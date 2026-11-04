# Auditoría v2 — Obra Maestra

Lectura de código solamente (nov 2026). No se cambió lógica, UI, assets, tests ni config. No se probó un iPhone físico: cada ítem cita lo que hace el código. El viewport ya trae `viewport-fit=cover` y la página usa `100dvh`, `touch-action` y un sobre de guardado con revisión. Eso no se reabre abajo.

Orden: bloqueante, importante, menor.

---

## Bloqueante

### 1. En iPad (y cualquier ventana ancha) el solar pide un canvas que Safari no aguanta

**Qué ve el jugador:** el cielo se pinta y el lote no. En cada frame se vuelve a intentar el bitmap enorme, así que la pestaña se puede cerrar sola por memoria.

**Dónde:** `dibujo.ts` (`zoomDe`, `asegurarTerreno`), `Juego.tsx` (el `try` de `dibujar`).

**Evidencia:** `zoomDe` devuelve `1.35` si el alto es mayor de 430 px y el ancho es de 760 px o más (iPad en vertical y en horizontal). `asegurarTerreno` crea un canvas del rango de mundo (−18…52, −16…46) más 400 px de margen. A zoom 1.35 eso mide unos **5532×2966 px (~16,4 megapíxeles, ~64 MB en RGBA)**. El lado largo pasa de 4096 px, el tope histórico del backing store de Safari iOS; el área queda justo debajo de 16,7 MP. En vertical de iPhone el zoom es 0.75 y el bitmap baja a ~3251×1826, dentro del tope. Si `getContext("2d")` viene null, el `!` no lo frena y el dibujo lanza. El `terreno` solo se guarda al final de la función: si lanza antes, **no hay caché y el frame siguiente lo intenta otra vez**. El `try` de `Juego.tsx` se traga el error una sola vez en consola y el bucle sigue.

---

## Importante

### 2. La palanca, ¡Dale! y el HUD entran en la zona del home indicator y del notch

**Qué ve el jugador:** en el iPhone el dedo de bajar la palanca lo interpreta el sistema (salir de la app), y el reloj de la obra queda debajo de la hora y la batería.

**Dónde:** `Juego.tsx` (`Palanca`, botón ¡Dale!), `Hud.tsx`, `__root.tsx`, `styles.css`.

**Evidencia:** el viewport es `viewport-fit=cover`, así que el dibujo llega al borde físico. La palanca es `absolute bottom-3 left-3` (12 px) y ¡Dale! es `right-3 bottom-3`, sin `env(safe-area-inset-bottom)`. El HUD de arriba usa `pt-1.5` / `pt-[52px]` solo desde 900 px, no el inset superior. Las hojas (`Marco`, menú, plano) sí rellenan el safe area. `touch-action: none` en la palanca no anula el gesto de sistema del borde inferior. En landscape (`innerHeight <= 430`) la palanca se encoge a 64 px y sigue pegada al mismo borde.

### 3. En horizontal el panel de compra se recorta y el solar se aleja

**Qué ve el jugador:** con el teléfono de lado, la cantidad de la ferretería o la X pueden quedar fuera de la hoja y no hay scroll horizontal. La cuadrilla y los sitios se ven muy chicos.

**Dónde:** `styles.css` (media landscape), `Paneles.tsx` (`Marco`), `dibujo.ts` (`zoomDe`).

**Evidencia:** con `orientation: landscape` y alto ≤ 520 px, `.marco-obra` pasa a `width: min(46vw, 26rem)`. El cuerpo del `Marco` es `overflow-x-hidden`. La fila de la ferretería es nombre (`max-w-[8.5rem]`) + precio + input `w-20` + botón, y no está dentro de un `overflow-x-auto`. En un ancho de ~670 px, 46 vw son ~310 px: la fila no cabe. A la vez `zoomDe` con alto ≤ 430 px devuelve entre **0.42 y 0.58** (en vertical de teléfono es 0.75). `RADIO` de acercarse a un sitio sigue en 2 unidades de mundo (`datos.ts`), así que el blanco en pantalla se encoge con el zoom; `FASE2_PENDIENTES.md` ya medía un piso visual de ~24 px.

### 4. El sonido no arranca con el gesto que el jugador hace, y se queda mudo al volver

**Qué ve el jugador:** con el control de círculo (el de fábrica) no hay ambiente, moneda ni compás hasta que pulsa ¡Dale!. Después de bloquear el teléfono o cambiar de app, el compás sigue mudo aunque quite la pausa.

**Dónde:** `Juego.tsx` (`desbloquear`, `sonar`, `aSegundoPlano`, `oculto`, `Palanca`).

**Evidencia:** `desbloquear` crea el `AudioContext` (con `webkitAudioContext`) y llama `resume()`, pero **sale al instante si ya existe**. Solo lo llaman el `keydown`, el `pointerdown` del mapa en modo arrastre, y el `onClick` de ¡Dale!. La palanca, el menú, Firmar y los botones del HUD no lo llaman. Al pasar a segundo plano (`visibilitychange` o `pagehide`) se hace `suspend()`. Al volver, el único `resume()` está en `visibilitychange`, que en iOS no cuenta como gesto del usuario. El toque siguiente de ¡Dale! entra a `desbloquear` y retorna sin `resume()`. No hay listener de `statechange` ni manejo del estado `interrupted`.

### 5. El ambiente fabrica buffers de audio dentro del frame

**Qué ve el jugador:** tirones justo cuando llueve o durante la jornada, y un acorde corto del colmado cada poco rato desde las 7:00 hasta las 17:00, aunque el maestro esté en la obra.

**Dónde:** `Juego.tsx` (`sonar`, `sonidoObra`, el bloque `ultimoColmado` / `ultimoAmb`).

**Evidencia:** con sonido activo, sin pausa y sin panel, cada 0,55 s se llama `sonar` del oficio o de la lluvia. `lluvia` y `ruido` hacen `createBuffer(1, sampleRate * dur, …)` y lo llenan en el hilo del `requestAnimationFrame` (la lluvia son 0,25 s de muestras). El colmado suena cada 1,8 s durante todo el horario de trabajo (`minuto` entre 7:00 y 17:00), no solo cerca de la tienda. `sonar` no está dentro del `try` del dibujo: si `start()` lanza (contexto `interrupted` o cerrado), el `requestAnimationFrame` de ese frame no se vuelve a pedir y **la obra se queda en el último cuadro**.

### 6. El reloj y el dibujo comparten un bucle sin red

**Qué ve el jugador:** un solo error (audio, un estado que no se puede clonar, un fallo del terreno) deja el reloj parado y la gente congelada. Los botones de React aún responden sobre la foto vieja.

**Dónde:** `Juego.tsx` (función `frame`).

**Evidencia:** `raf = requestAnimationFrame(frame)` está al final del frame. El `try/catch` solo envuelve `pintar` (`dibujar`). `tick`, `sonar`, `structuredClone` y `guardar` van fuera. `dt` además se recorta a 0,1 s: si el frame tarda más, el día corre más lento (`tick` suma `dt * 5` minutos por segundo quieto).

### 7. Cinco veces por segundo se clona toda la partida y se redibuja el mapa

**Qué ve el jugador:** en un teléfono caliente la palanca va a tirones y la batería baja aunque la hoja de la ferretería tape el solar.

**Dónde:** `Juego.tsx` (`frame`, `setSnap`), `dibujo.ts` (`dibujar`), `Paneles.tsx`.

**Evidencia:** cada 0,2 s de `dt` se hace `setSnap(structuredClone(estado.current))` aunque no haya cambiado nada, también en el menú y con un panel abierto. Eso vuelve a renderizar `Hud` y `Paneles`. El canvas sigue en `requestAnimationFrame` con el panel abierto, con `devicePixelRatio` hasta 2, y reasigna `canvas.width` cuando cambia el tamaño (al mostrar u ocultar la barra de Safari se tira el bitmap). El terreno y la caseta sí van a caché; la gente, las etiquetas (`measureText` por rótulo) y la lluvia no.

### 8. Lo que pasa solo dentro del reloj puede perderse, y un guardado fallido no se dice

**Qué ve el jugador:** al matar la pestaña (iOS cierra la pestaña en segundo plano) se pierden hasta ~20 s reales. Quieto, el reloj avanza 5 minutos de obra por segundo: son del orden de una hora y media de jornada, nómina o camión incluidos. En navegación privada el guardado falla siempre y no hay aviso.

**Dónde:** `Juego.tsx` (`frame`, `act`, `huellaDinero`), `guardar.ts` (`guardar`).

**Evidencia:** compras, fiado y «Libre mañana» sí llaman `guardar` al momento. La nómina, la llegada del camión y el paso del día ocurren en `tick` y solo bajan a disco cuando `guardado >= 20` (suma de `dt`, no reloj de pared) o en `pagehide` / pausa. `localStorage.setItem` que lanza (cuota, modo privado de Safari) se traga y `guardar` devuelve `false`. El único aviso de “ya no guarda” es el de otra pestaña (`pestanaVieja`). El estado entero se escribe en una sola clave, así que un rewind es consistente: no duplica dinero, pero sí borra el tramo no guardado.

### 9. No hay migración de forma: un guardado viejo o roto se tira, y la clave v1 puede volver

**Qué ve el jugador:** al abrir la v2, la partida de hoy puede salir como «El guardado estaba dañado» y empezar de cero. Si además quedó la clave antigua, la siguiente carga revive esa obra vieja sin decirlo.

**Dónde:** `guardar.ts` (`cargar`, `VERSION_GUARDADO`), `motor.ts` (`validar`).

**Evidencia:** el sobre guarda `v: 2` y **nunca lo lee**. `validar` exige `s.v === 1`; cualquier otro valor cae al `catch`, mueve la clave a `…-roto` y empieza obra nueva. `sanear` rellena campos sueltos, no cambia de versión. La migración desde `obra-maestra-v1` copia a v2 y **no borra la clave vieja**. `cargar` solo mira la clave vieja si la nueva no existe. Si la nueva se da por rota y se borra, la visita siguiente lee la v1 y la vuelve a migrar. `hayPartida` en `Paneles.tsx` pregunta por `obra-maestra-v1`, no por `obra-maestra-v2` (el botón Continuar sí depende de `seguir`, que sale de `cargar`).

### 10. La tabla del informe no se puede recorrer de lado en el teléfono

**Qué ve el jugador:** al entregar (o al perder) las columnas Presupuesto / Real / Desvío quedan cortadas y el dedo vertical se come el gesto horizontal.

**Dónde:** `Paneles.tsx` (tabla del informe, `Marco`).

**Evidencia:** la tabla lleva `min-w-[28rem]` (448 px) dentro de un `overflow-x-auto`, y el padre es `overflow-x-hidden overflow-y-auto`. En iOS el scroll anidado así suele no panear en horizontal. El resto del informe (caja, ganancia) sí cabe.

---

## Menor

### 11. El campo «Versión» del reporte hace zoom en Safari iOS

**Qué ve el jugador:** al tocar Versión, la página se agranda y, con `overflow: hidden` y `100dvh`, a veces no vuelve sola.

**Dónde:** `Hud.tsx` (input del reporte), `styles.css`, `__root.tsx`.

**Evidencia:** ese input está en `text-sm` (14 px). Safari iOS hace zoom al enfocar un control de menos de 16 px. El textarea de al lado es `text-base`. El viewport no fija `maximum-scale`. El formulario es `fixed top-16`: en un iPhone chico el teclado tapa Enviar.

### 12. El sello de «aprobado» no cae en el mismo sitio que el dibujo cuando la pantalla es baja

**Qué ve el jugador:** en horizontal el cartel del sello no coincide con el muro.

**Dónde:** `dibujo.ts` (`puntoEnPantalla`, `vis.ancla`), `Juego.tsx` (`colocarSello`).

**Evidencia:** al dibujar, si `h <= 430` el ancla vertical es `0.46`. `puntoEnPantalla` (el que coloca el div del sello) usa siempre `h * 0.56`. El toque para cerrar el sello es de ventana entera, así que se puede seguir; el fallo es de presentación. El toque para caminar sí usa `mundoDesde` y el ancla real.

### 13. Los dos primeros segundos del menú los botones están invisibles y sí reciben el toque

**Qué ve el jugador:** la casa se dibuja y parece que no hay menú; un toque a ciegas puede dar a Jugar o a Continuar.

**Dónde:** `styles.css` (`.menu-luego`), `Paneles.tsx` (menú).

**Evidencia:** `opacity: 0` y animación de 0,35 s con retraso de 2 s. No hay `pointer-events: none` durante la espera. Con `prefers-reduced-motion` la opacidad es 1 al instante.

### 14. El modo de control (círculo o arrastre) no está en los Ajustes del menú

**Qué ve el jugador:** para cambiar la palanca por arrastre hay que entrar a una obra y abrir Pausa. El círculo, que es el default, es justo el control que no desbloquea el audio (ítem 4).

**Dónde:** `Paneles.tsx` (Ajustes del menú frente a Pausa), `guardar.ts` (`ajustesBase`).

**Evidencia:** el menú solo guarda sonido y velocidad. Círculo / Arrastre vive en el panel Pausa. `control` por defecto es `"circulo"`.

---

## Ya cubierto (no reabrir en la v2)

- `touch-action: manipulation` en la página y `none` en el canvas y la palanca; no hay retraso de 300 ms.
- La palanca usa pointer capture, ignora un segundo dedo y no se suelta en `blur` (`Palanca`, `palancaDedo`).
- `alToque` más el listener de click en captura evitan el doble disparo cuando una hoja se cierra debajo del dedo. `firmar`, `contratar` y `despedir` además son idempotentes si el segundo toque llega.
- Segundo plano: `visibilitychange` y `pagehide` pausan, callan y guardan. Al volver hay que quitar la pausa a mano (está probado en `pruebas_e2e/joystick.e2e.mjs`).
- Guardado con sobre, revisión por pestaña y archivo de obra perdida para que Continuar no la reabra.
- Botones de juego en `min-h-11`. La oficina en el teléfono es lista, no la tabla ancha (esa tabla es `min-[900px]`).

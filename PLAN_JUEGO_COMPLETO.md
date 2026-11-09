# Plan: Obra Maestra, juego terminado

Lectura del código en `main` (1.0.1, commit `198b2af`, aprobada por el Revisor). El esquema del 4 nov 2026 y `AUDIT_V2.md` (PR #3) sirvieron de mapa; los números de abajo salen del código, no del esquema.

El juego es uno solo: la caseta de block 3×4. No se revive HQ Office ni Obra Maestra Viva.

## Qué existe hoy y funciona

En escritorio se puede jugar de punta a punta. El Revisor ya entregó una partida en teléfono (día 26, las 9 etapas). El motor no está a medias.

- **Abrir y empezar.** Menú con Jugar, Continuar (si hay partida y no está perdida), Cómo se juega, Obras, Ajustes y Créditos. Al firmar con Doña Carmen arranca la caseta 3×4: anticipo, kit de replanteo y caja. Hay guía en partida («Jugar con guía»).
- **La obra.** Nueve etapas: replanteo, excavación, acero de zapata, vaciado, muros de block (con plomo), columnas, viga, piso, techo y entrega. Reloj de jornada, lluvia, cansancio, cuadrilla, acarreo, agua, ferretería, libreta, adelanto, fiado y nómina.
- **Cierre.** Entrega con la cuenta línea por línea y botón «Otra obra». Si no queda nadie, «Obra perdida» explica por qué y ofrece «Obra nueva». La pérdida se archiva: Continuar no la reabre.
- **Guardado.** Clave `obra-maestra-v2` en el navegador, con dueño de pestaña. Compras y pagos se guardan al momento. El reloj se guarda cada ~20 s y al pasar la app a segundo plano.
- **Controles.** Teclado en escritorio. En pantalla, palanca o arrastre (se elige en Pausa) y botón ¡Dale!.
- **Sonido.** Hay ambiente, golpes y monedas. El arreglo de hoy está en «Qué falta».

## Qué falta

### Bloqueante

1. **El solar en iPad (y en cualquier ventana ancha) pide un canvas que Safari no aguanta.** `zoomDe` en `dibujo.ts` devuelve 1.35 si el alto pasa de 430 px y el ancho es de 760 px o más (iPad vertical y horizontal, y el escritorio ancho). `asegurarTerreno` arma un bitmap del mundo entero: a ese zoom mide unos **5533×2967 px (~16,4 megapíxeles)**. El lado largo pasa de 4096, el tope histórico de Safari en iPhone/iPad. Si el canvas se rechaza, el terreno no se guarda y **el cuadro siguiente lo pide otra vez**. La pestaña se puede cerrar sola. En el iPhone vertical el zoom es 0.75 y el bitmap cabe (~3252×1826): este fallo no es el del teléfono en vertical. Los personajes y la caseta se dibujan aparte, en bitmaps chicos; el problema es solo el suelo.

### Importante

2. **La palanca, ¡Dale! y el reloj entran en la zona del sistema.** En `Juego.tsx` la palanca y ¡Dale! van a 12 px del borde (`bottom-3`), sin `env(safe-area-inset-bottom)`. El reloj de `Hud.tsx` no respeta el notch. Con `viewport-fit=cover`, en el iPhone el dedo de bajar la palanca lo puede leer el sistema como «salir».
3. **En horizontal la ferretería se recorta y el solar se aleja.** Con el teléfono de lado, `zoomDe` baja a 0.42–0.58 y la hoja de compra (`styles.css`, `.marco-obra` a `46vw`) esconde la cantidad o la X. No hay scroll horizontal.
4. **El sonido no arranca con el gesto de verdad y se queda mudo al volver.** `desbloquear` en `Juego.tsx` solo lo llaman el teclado, el arrastre y ¡Dale!. La palanca (el control de fábrica) no lo llama. Al volver de segundo plano, `resume()` no cuenta como gesto en iOS, y el toque siguiente sale de `desbloquear` sin reanudar porque el contexto ya existe.
5. **Un error de audio puede congelar la obra.** `sonar` corre dentro del cuadro, fuera del `try` de pintar. Si `start()` lanza (contexto interrumpido), no se pide el cuadro siguiente: la gente se queda en la foto y el reloj no corre. Además, la lluvia fabrica un buffer de audio en ese mismo cuadro.
6. **El guardado del reloj puede perder un tramo, y un fallo no se dice.** Nómina, camión y cambio de día ocurren en `tick` y bajan a disco cada ~20 s (o al ocultar la pestaña). En navegación privada `localStorage` falla en silencio. La versión del sobre (`v: 2`) no se lee al cargar: un guardado que no pasa `validar` se tira, y si quedó la clave vieja `obra-maestra-v1`, la visita siguiente puede revivir esa obra.

### Menor

7. La tabla del informe (Presupuesto / Real / Desvío, `min-w-[28rem]`) no se recorre de lado en el teléfono: el scroll está dentro de un padre que ya recorta el eje X.
8. Los dos primeros segundos del menú los botones están invisibles (`opacity: 0`) y sí reciben el toque.
9. El sello de «aprobado» no cae en el mismo sitio que el muro cuando la pantalla es baja (`puntoEnPantalla` usa 0.56; el dibujo, si el alto es ≤ 430, usa 0.46).
10. El campo Versión del reporte está a 14 px: Safari agranda la página al tocarlo.
11. Círculo o arrastre solo se cambia en Pausa, no en Ajustes del menú.
12. Cada 0,2 s se clona toda la partida para refrescar la interfaz, también con un panel abierto. En un teléfono caliente la palanca va a tirones. No cambia reglas de dinero; es rendimiento.

### El anuncio «Próximamente: jugar como ingeniero»

Está solo en el menú (`Paneles.tsx`). No hay modo ingeniero en el código. Lo que sí existe es la nota de la ingeniera al sellar el plomo, y esa frase en la entrega.

Para un juego terminado el anuncio tiene que quedar honesto. Recomendación: **quitar la frase** (o cambiarla por algo que ya pasa, por ejemplo que la ingeniera revisa el plomo). No construir un segundo modo. Si más adelante se quiere, que sea una lectura encima de esta misma obra (planos, plomo, checklist), no otra simulación, y en un cambio aparte, después de la base del teléfono.

## Pasos, en orden

Cada paso se puede probar solo. Ninguno cambia precios, jornales, rendimientos ni la caja.

### Paso 1 — El solar no pide un canvas que Safari cierra

**Hecho en este cambio.**

- En `dibujo.ts`, el suelo se mide con `medidaTerreno`. Si el lado pasaría de 4096 px o el área de 12 megapíxeles, el bitmap se dibuja más chico y al pegarlo se estira al mismo tamaño de siempre. El zoom no se toca: una casilla en el iPhone sigue midiendo lo mismo (la prueba de 2,5 casillas/s queda).
- En el iPhone vertical la medida cabe y la escala se queda en 1: el suelo se ve igual que hoy.
- En iPad y escritorio ancho el suelo baja de ~16 MP a un lado ≤ 4096. Personas, caseta y letreros se siguen dibujando a zoom completo; solo el piso cacheado va un poco más suave.
- Si Safari rechaza ese bitmap, se intenta uno a la mitad **una vez**. El fallo se recuerda para ese zoom: el cuadro siguiente no lo vuelve a pedir. El cielo y la cuadrilla siguen.
- El canvas de la pantalla (`Juego.tsx`) usa el mismo tope de 4096 px de lado. En el iPhone y en el iPad de hoy no cambia el nitidez (ya cabían). Solo evita un escritorio enorme a retina.
- **Cómo se verifica:** `src/game/dibujo.test.ts` (medidas, zoom intacto, un fallo no se reintenta) y la suite `correr_pruebas.sh`. No hace falta un iPad para el número; en un iPad de verdad la prueba es abrir una partida y ver el solar sin que se cierre la pestaña.

### Paso 2 — Palanca, ¡Dale! y reloj fuera del borde del sistema

- Bajar la palanca y ¡Dale! con `env(safe-area-inset-bottom)` (y el reloj con el inset de arriba).
- **Verificación:** en una ventana con margen inferior simulado, el control no queda pegado al borde. Un toque en la palanca no se lo queda el gesto de «inicio».

### Paso 3 — Sonido que despierta con el primer toque y no congela el reloj

- Llamar a despertar el audio desde la palanca, el menú y Firmar, no solo desde ¡Dale!.
- Si el contexto ya existe pero está suspendido o interrumpido, el siguiente toque hace `resume()`.
- `sonar` dentro de un `try`: si el audio falla, se calla ese sonido y el cuadro siguiente se pide igual.
- **Verificación:** prueba de que un `start()` que lanza no impide volver a pedir cuadro; en el teléfono, ambiente después de tocar la palanca y después de bloquear y volver.

### Paso 4 — Guardar el día, la nómina y el camión sin esperar 20 s

- Esos tres eventos escriben al momento, igual que una compra. Si `localStorage` falla, un aviso en español («Esta partida no se está guardando»).
- Al cargar, leer la versión del sobre. No volver a copiar `obra-maestra-v1` si la clave nueva ya se dio por dañada.
- **Verificación:** las pruebas de `guardar.ts` / dinero cubren compra y pestaña; añadir una que avance el día, recargue y no pierda la nómina. Los montos no cambian.

### Paso 5 — Ferretería usable con el teléfono de lado

- La fila de cantidad entra en la hoja (scroll o salto de línea). El zoom horizontal no baja de un piso donde el sitio siga siendo tocable, sin cambiar `RADIO` ni a quién selecciona un toque.
- **Verificación:** a 844×390 la fila de la ferretería se ve completa y un toque en el solar sigue eligiendo el mismo sitio que hoy.

### Paso 6 — Informe que se puede leer en el teléfono

- La tabla del cierre se desplaza de lado sin que el dedo vertical se la coma. Entrega y obra perdida se leen enteras en 390 px de ancho.
- **Verificación:** la tabla tiene su propio scroll horizontal y el botón de otra obra queda al alcance.

### Paso 7 — Toques y sello que no mienten

- Menú invisible: `pointer-events: none` hasta que aparece.
- El sello usa la misma ancla que el dibujo.
- El input Versión a 16 px para que Safari no haga zoom.
- Círculo / arrastre también en Ajustes del menú (misma preferencia que ya se guarda).
- **Verificación:** en los primeros 2 s un toque no dispara Jugar; el cartel del sello coincide con el muro a alto ≤ 430.

### Paso 8 — Menos trabajo por cuadro (cuando lo anterior esté estable)

- No clonar toda la partida cinco veces por segundo si nada visible cambió. No redibujar de más con un panel que tapa el solar.
- **Verificación:** la caja, el reloj y los paneles siguen al día; las pruebas de dinero y de ritmo no se mueven.

### Paso 9 — Dejar honesto el anuncio del ingeniero

- Quitar «Próximamente: jugar como ingeniero» del menú, o sustituirla por una frase que el juego ya cumple.
- No implementar un modo ingeniero en este plan. Si Rico lo pide después, se escribe un paso nuevo, chico, sobre esta misma caseta.

### Paso 10 — Una partida de comprobación, de menú a cierre

- Con los pasos 1–6 hechos: menú → firmar → un tramo de obra → (en simulación, como ya hace `correr_pruebas.sh`) entrega y pérdida → otra obra.
- En navegador: menú, Jugar, caminar, abrir ferretería y libreta, en vertical y en horizontal.
- Recién ahí tiene sentido publicar. Este plan no publica ni despliega.

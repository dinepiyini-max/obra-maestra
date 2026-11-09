# Obra Maestra

Juego de construir una caseta de block de 3×4 para Doña Carmen.
Llevas la cuadrilla, la ferretería, la lluvia y la caja. El contrato
es de P$300,000 y el plazo es de 30 días. Se juega en el navegador
del teléfono o de la computadora.

La versión publicada está en [obramaestra.grok.me](https://obramaestra.grok.me).

El plan de lo que ya está y lo que sigue está en
[PLAN_JUEGO_COMPLETO.md](PLAN_JUEGO_COMPLETO.md).

## Correrlo en tu computadora

Hace falta Node.js 22.

```bash
npm install
npm run dev
```

Se abre en el navegador. Para pararlo, Ctrl+C en esa terminal.

## Probarlo

Las pruebas del motor (reglas, dinero, guardado):

```bash
./correr_pruebas.sh
```

`npm test` corre otras pruebas de la plantilla con la que se armó el
proyecto. No son las del juego.

## Cómo se publica

Lo publica **Grok Build**, desde la rama `main`. Cuando un cambio se
mezcla a `main`, Build lo vuelve a publicar en obramaestra.grok.me.
No hace falta subir el juego a mano ni tocar Vercel.

Una carpeta `python/` no entra en esa publicación: el juego solo
empaqueta lo que está en `src/`.

## Mapa de carpetas

```
src/game/          el juego: motor.ts (reglas), datos.ts (precios y jornales), dibujo.ts, guardar.ts
src/lib/           servidor: base de datos, inicio de sesión, reportes
src/routes/        la pantalla de la app
src/components/    la interfaz del juego
public/            imágenes y sonidos
scripts/           herramientas de la plantilla, y exportar-datos
python/            taller en Python para practicar con los números del juego (no se publica)
pruebas_e2e/       pruebas en el navegador
correr_pruebas.sh  pruebas del motor
PLAN_JUEGO_COMPLETO.md
```

El taller de Python, para abrirlo en PyCharm, está explicado en
[python/README.md](python/README.md). Desde aquí, `npm run exportar-datos`
vuelve a escribir `python/datos_juego.json` si cambian los precios.

## Derechos

Por ahora, todos los derechos reservados. No hay una licencia abierta.
Si más adelante se quiere una (por ejemplo MIT), se agrega a propósito.

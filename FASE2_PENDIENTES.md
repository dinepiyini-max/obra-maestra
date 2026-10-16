# Fase 2 — pendientes (identidad)

Lo de esta lista no se hizo porque exigía tocar el motor, las pruebas, o archivos que el encargo prohíbe. El juego sigue jugable con la identidad nueva.

## Área táctil de 44×44

El radio con el que un toque elige a un personaje está en `cercano()` de `src/game/motor.ts`. El dibujo puede medir menos de 44 px (el paisaje corto baja el zoom y el piso visual es 24 px), pero agrandar el área táctil cambiaría a quién se selecciona. No se tocó el motor.

## Textos que viven en el motor

Los avisos, `FRASES_CANSANCIO`, los nombres de las etapas y la palabra «Sita» dentro de `motor.ts` y `datos.ts` se quedan. Los cambia el equipo de Rico, no esta fase. Las frases nuevas (Doña, maestro, Nico, Guardalmacén, Ferretería, oficios y manías) solo se pintan en `src/game/dibujo.ts`. En pantalla, botones y burbujas de los componentes no aparece «Sita»; el nombre visible es Guardalmacén y se habla de la Ferretería o el despachador. Los identificadores internos (`hablarSita`, `aceptarSita`, panel `"sita"`) no se renombraron.

## `public/__grok`

Es el chrome de la plataforma (manifest, iconos). `src/routes/__root.tsx` lo referencia. No se borra.

## Dependencias

No existe `src/components/ui`. `lucide-react` se importa en `src/lib/error-component.tsx` (`TriangleAlert`), así que se queda. Los paquetes Radix y shadcn del `package.json` de la plantilla no los importa el juego; se dejan, porque quitarlos no aporta a la identidad y el encargo solo permite quitarlos si el build y las pruebas siguen pasando. No se arriesgó el árbol de la plantilla.

## `__root.tsx` y las fuentes

`src/routes/__root.tsx` no estaba en la lista blanca. La sección 2 prohíbe CDN y la búsqueda de hex de la sección 10 recorre todo `src/`. El único cambio: se quitó el `<link>` de Google Fonts (Jolly Lodger y Patrick Hand) y `theme-color` pasó a `#12171C`. Favicon, manifest y apple-touch-icon se quedaron.

Las tres familias van autoalojadas en `public/fonts` (`font-display: swap`): Bungee, Barlow Semi Condensed 500 y 700, Patrick Hand. Licencia SIL OFL 1.1 en `public/fonts/OFL.txt`.

En `src/styles.css` se conservan los alias `--color-fondo: #12171c` y `--color-papel: #e9e5dc` porque `src/routes/index.tsx` (fuera de la lista) los usa. No son la paleta vieja de oro.

## Contraste del reloj con lluvia

Tinta `#1B1F23` sobre `#5E6163` mide 2.66:1, por debajo de 4.5. Con lluvia el reloj usa texto cemento-claro (`#E9E5DC`), 4.96:1. Sin lluvia el reloj es cielo `#2E9BD6` con tinta (5.35:1). El amarillo de la caja y de «¡Dale!» lleva tinta, nunca blanco.

## `npm run lint` y `npm test`

`npm run lint` (`eslint .`) sale con error por cinco avisos que ya están en `main` y no son de esta fase:

- `prefer-const` en `src/game/motor.ts` (líneas 3668, 4447 y 4853)
- expresión sin efecto en `src/game/motor.test.ts:1812`
- `catch` vacío en `src/lib/app-data/client.server.ts:281`

El motor, las pruebas y `server/` no se tocan. En los archivos de esta fase, eslint no reporta ningún error.

`npm test` corre las pruebas de la plantilla, no las del juego. Ocho fallan en `scripts/grok-pwa-plugin.test.mjs` porque leen el `site.json` real de Obra Maestra (el título del juego pisa el título de prueba «Hello World»). `site.json` no cambió respecto a `main`. Las pruebas del juego van por `correr_pruebas.sh`.

## Partida de comprobación

`correr(1, BOTS.experto, "normal", 0)` en el mismo motor que `main` (el diff de `motor.ts` está vacío). Resultado, igual en 1280×800, 375×667 y 667×375: entregada, día 19, caja P$75,782. No es un clic a clic de 19 días: un día dura varios minutos reales. La apertura (menú, Jugar, caminar a la oficina, firmar y abrir paneles) sí se hizo con el navegador. Los números coinciden con `main` porque ninguna regla cambió.

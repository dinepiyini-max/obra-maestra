#!/bin/sh
set -e
cd "$(dirname "$0")"
node --experimental-strip-types --test src/game/motor.test.ts src/game/guia.test.ts src/game/dinero.test.ts src/game/dibujo.test.ts src/game/toque.test.ts src/game/guardar.test.ts src/game/estrellas.test.ts src/game/v26.test.ts src/game/v27.test.ts src/game/v28.test.ts

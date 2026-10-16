#!/bin/sh
set -e
cd "$(dirname "$0")"
node --experimental-strip-types --test src/game/motor.test.ts src/game/guia.test.ts src/game/dinero.test.ts
node --experimental-strip-types --test src/game/contratos.test.ts src/game/contratos_oro.test.ts

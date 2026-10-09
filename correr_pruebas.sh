#!/bin/sh
set -e
cd "$(dirname "$0")"
node --experimental-strip-types --test src/game/motor.test.ts src/game/guia.test.ts

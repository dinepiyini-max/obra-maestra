#!/bin/sh
# Uso: scripts/f3/oro.sh <dir_salida>   (9 celdas en paralelo)
mkdir -p "$1"
for p in principiante intermedio experto; do for c in poca normal mucha; do
  node --experimental-strip-types scripts/f3/oro_celda.ts $p $c > "$1/$p-$c.json" &
done; done; wait

// Prueba de oro: la caseta de Doña Carmen da exactamente lo mismo que la 1.0 (e562ecb)
// en 3 perfiles × 3 climas × 40 semillas (360 partidas). Corre 9 celdas en paralelo.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFileSync } from "node:fs";
import { promisify } from "node:util";
const run = promisify(execFile);
const ORO = JSON.parse(readFileSync(new URL("./oro_caseta_1.0.json", import.meta.url), "utf8")) as any[];
const celda = new URL("../../scripts/f3/oro_celda.ts", import.meta.url).pathname;

test("caseta = 1.0 en las 360 partidas", { timeout: 30 * 60_000 }, async () => {
  const celdas: [string, string][] = [];
  for (const p of ["principiante", "intermedio", "experto"]) for (const c of ["poca", "normal", "mucha"]) celdas.push([p, c]);
  const res = await Promise.all(celdas.map(([p, c]) =>
    run(process.execPath, ["--experimental-strip-types", "--no-warnings", celda, p, c], { maxBuffer: 1 << 24 }).then((r) => JSON.parse(r.stdout))));
  const ahora = res.flat();
  assert.equal(ahora.length, 360);
  assert.deepEqual(ahora, ORO);
});

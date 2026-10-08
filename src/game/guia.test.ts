import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GUIA_MS, cerrarGuia, guiaVisible, reiniciarGuia } from "./guia.ts";

describe("guía", () => {
  it("se apaga a los 20 s reales aunque el reloj de la obra no avance", () => {
    reiniciarGuia();
    const t0 = 50_000;
    assert.equal(guiaVisible(1, true, t0), true);
    assert.equal(guiaVisible(1, true, t0 + GUIA_MS - 1), true);
    assert.equal(guiaVisible(1, true, t0 + GUIA_MS), false);
    assert.equal(guiaVisible(1, true, t0 + GUIA_MS + 5_000), false);
  });

  it("cerrarla no borra el paso: el siguiente sigue apareciendo", () => {
    reiniciarGuia();
    assert.equal(guiaVisible(2, true, 0), true);
    cerrarGuia(2);
    assert.equal(guiaVisible(2, true, 1_000), false);
    assert.equal(guiaVisible(3, true, 1_000), true);
  });

  it("el plazo sigue corriendo aunque la línea no se pinte", () => {
    reiniciarGuia();
    assert.equal(guiaVisible(4, true, 0), true);
    assert.equal(guiaVisible(4, false, 10_000), false);
    assert.equal(guiaVisible(4, true, 10_000), true);
    assert.equal(guiaVisible(4, false, GUIA_MS), false);
    assert.equal(guiaVisible(4, true, GUIA_MS), false);
  });

  it("el día 1, contratar vuelve una sola vez 60 s después de esconderse", () => {
    reiniciarGuia();
    const t0 = 100_000;
    assert.equal(guiaVisible(1, true, t0), true);
    assert.equal(guiaVisible(1, true, t0 + GUIA_MS), false);
    assert.equal(guiaVisible(1, true, t0 + GUIA_MS + 59_999), false);
    assert.equal(guiaVisible(1, true, t0 + 80_000), true);
    assert.equal(guiaVisible(1, true, t0 + 80_000 + GUIA_MS), false);
    assert.equal(guiaVisible(1, true, t0 + 80_000 + GUIA_MS + 60_000), false);
    assert.equal(guiaVisible(2, true, t0 + 200_000), true);
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { TOQUE_CAMINAR_PX, esToqueDeCaminar } from "./toque.ts";

const quieto = { dx: 0, dy: 0, panel: false, pausa: false, entregada: false, palanca: false };

describe("el primer toque para caminar", () => {
  it("un toque quieto camina", () => {
    assert.equal(esToqueDeCaminar(quieto), true);
  });

  it("un dedo que tiembla un poco todavía cuenta (Safari a veces mueve el primer toque)", () => {
    assert.equal(esToqueDeCaminar({ ...quieto, dx: 20, dy: 8 }), true);
    assert.ok(Math.hypot(20, 8) < TOQUE_CAMINAR_PX);
  });

  it("un arrastre no camina de un golpe", () => {
    assert.equal(esToqueDeCaminar({ ...quieto, dx: 40, dy: 0 }), false);
  });

  it("con un panel, en pausa, entregada o con la palanca, el toque no manda a caminar", () => {
    assert.equal(esToqueDeCaminar({ ...quieto, panel: true }), false);
    assert.equal(esToqueDeCaminar({ ...quieto, pausa: true }), false);
    assert.equal(esToqueDeCaminar({ ...quieto, entregada: true }), false);
    assert.equal(esToqueDeCaminar({ ...quieto, palanca: true }), false);
  });
});

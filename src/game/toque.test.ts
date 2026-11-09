import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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

describe("a las 3 se avisa, sin cambiar la nómina", () => {
  it("el cartel dice que se van solos y el motor sigue pagando a las 15:00", () => {
    const hud = readFileSync(new URL("../components/juego/Hud.tsx", import.meta.url), "utf8");
    const motor = readFileSync(new URL("./motor.ts", import.meta.url), "utf8");
    assert.match(hud, /data-se-fueron/);
    assert.match(hud, /A las 3 se van solos y el día se paga/);
    assert.match(motor, /if \(s\.minuto >= 15 \* 60 && !s\.nominaPagada\) pagarNomina\(s\)/);
  });
});

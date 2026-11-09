import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { pasoAudio } from "./audio.ts";
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

describe("el audio despierta con el toque y vuelve después de bloquear", () => {
  it("sin contexto se crea; suspendido o interrumpido se reanuda; andando no se toca", () => {
    assert.equal(pasoAudio("sin"), "crear");
    assert.equal(pasoAudio("closed"), "crear");
    assert.equal(pasoAudio("suspended"), "reanudar");
    assert.equal(pasoAudio("interrupted"), "reanudar");
    assert.equal(pasoAudio("running"), "listo");
  });
});

describe("el cierre se puede leer y volver a jugar", () => {
  it("la entrega y la obra perdida dicen Volver a jugar y la tabla puede correrse", () => {
    const p = readFileSync(new URL("../components/juego/Paneles.tsx", import.meta.url), "utf8");
    assert.equal((p.match(/data-volver-a-jugar/g) ?? []).length, 2);
    assert.match(p, /Volver a jugar/);
    assert.match(p, /touch-pan-x/);
    assert.doesNotMatch(p, /Otra obra/);
    assert.doesNotMatch(p, /Próximamente: jugar como ingeniero/);
  });
});

describe("Terminar no queda debajo de ¡Dale!", () => {
  it("en el teléfono van en la misma columna, Terminar arriba", () => {
    const juego = readFileSync(new URL("../components/juego/Juego.tsx", import.meta.url), "utf8");
    const hud = readFileSync(new URL("../components/juego/Hud.tsx", import.meta.url), "utf8");
    const i = juego.indexOf("data-controles-abajo");
    const columna = juego.slice(i, i + 1800);
    assert.ok(columna.includes("data-terminar"));
    assert.ok(columna.includes("¡Dale!"));
    assert.ok(columna.indexOf("data-terminar") < columna.indexOf("¡Dale!"));
    assert.doesNotMatch(hud, /right-\[8\.6rem\]/);
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

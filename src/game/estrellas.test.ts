import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { correr, jugarPasivo } from "./auditoria_sim.ts";
import {
  DIA_OBRA_MAESTRA,
  GANANCIA_OBRA_MAESTRA,
  GANANCIA_PARA_ESTRELLA,
  calificar,
  calificarDatos,
  type DatosEstrellas,
} from "./estrellas.ts";
import { firmar, ahoraToca, nueva } from "./motor.ts";
import { PERFILES } from "./sim_v18.ts";
import { PLAZO_ENTREGA } from "./datos.ts";

const base = (p: Partial<DatosEstrellas> = {}): DatosEstrellas => ({
  entregada: true,
  dia: 19,
  ganancia: 80_000,
  desplomes: 0,
  aprobadasPrimera: 9,
  ...p,
});

describe("estrellas al entregar", () => {
  it("tres estrellas piden plazo, ganancia de maestro, cero desplomes y las 9 a la primera", () => {
    const c = calificarDatos(base());
    assert.equal(c.estrellas, 3);
    assert.deepEqual(
      c.detalle.map((e) => e.ganada),
      [true, true, true],
    );
  });

  it("el atento normal (día 25, ganancia de 60 mil, obra limpia) saca 2", () => {
    const c = calificarDatos(base({ dia: 25, ganancia: 60_000 }));
    assert.equal(c.estrellas, 2);
    assert.equal(c.detalle.find((e) => e.id === "plazo")?.ganada, true);
    assert.equal(c.detalle.find((e) => e.id === "cuenta")?.ganada, true);
    assert.equal(c.detalle.find((e) => e.id === "maestra")?.ganada, false);
    assert.match(c.detalle.find((e) => e.id === "maestra")!.texto, /día 25/);
    assert.match(c.detalle.find((e) => e.id === "maestra")!.texto, /75,000/);
  });

  it("un desplome o una etapa observada le quitan la tercera, no las otras", () => {
    assert.equal(calificarDatos(base({ desplomes: 1 })).estrellas, 2);
    assert.equal(calificarDatos(base({ aprobadasPrimera: 8 })).estrellas, 2);
  });

  it("entregar tarde o sin ganancia baja la cuenta, y sin entregar no hay estrellas", () => {
    assert.equal(calificarDatos(base({ dia: PLAZO_ENTREGA + 2, ganancia: 60_000 })).estrellas, 1);
    assert.equal(calificarDatos(base({ dia: PLAZO_ENTREGA + 2, ganancia: 10_000 })).estrellas, 0);
    assert.equal(calificarDatos(base({ ganancia: GANANCIA_PARA_ESTRELLA - 1, dia: 25 })).estrellas, 1);
    const nada = calificarDatos(base({ entregada: false }));
    assert.equal(nada.estrellas, 0);
    assert.match(nada.detalle[0]!.texto, /no se entregó/);
  });

  it("el día 21 con la ganancia de maestro sí es la tercera; el 22 ya no", () => {
    assert.equal(calificarDatos(base({ dia: DIA_OBRA_MAESTRA, ganancia: GANANCIA_OBRA_MAESTRA })).estrellas, 3);
    assert.equal(calificarDatos(base({ dia: DIA_OBRA_MAESTRA + 1, ganancia: GANANCIA_OBRA_MAESTRA })).estrellas, 2);
  });

  it("la semilla 1: el experto saca 3, el humano y el principiante 2, el pasivo 0", () => {
    const ex = correr(1, PERFILES.experto!, "normal", 0);
    const hu = correr(1, PERFILES.humano!, "normal", 0);
    const pr = correr(1, PERFILES.principiante!, "normal", 0);
    const pa = jugarPasivo(1);
    assert.equal(ex.s.entregada, true);
    assert.equal(calificar(ex.s).estrellas, 3, `experto día ${ex.s.dia} gan ${Math.round(ex.inf.ganancia)}`);
    assert.equal(hu.s.entregada, true);
    assert.equal(calificar(hu.s).estrellas, 2, `humano día ${hu.s.dia} gan ${Math.round(hu.inf.ganancia)}`);
    assert.equal(pr.s.entregada, true);
    assert.equal(calificar(pr.s).estrellas, 2, `principiante día ${pr.s.dia} gan ${Math.round(pr.inf.ganancia)}`);
    assert.equal(pa.s.entregada, false);
    assert.equal(calificar(pa.s).estrellas, 0);
  });
});

describe("tarjeta Ahora toca", () => {
  it("sin firmar manda a la oficina; al firmar dice la etapa 1 y la tarea", () => {
    const s = nueva(1);
    const antes = ahoraToca(s);
    assert.equal(antes.etapa, 0);
    assert.match(antes.tarea, /Doña Carmen/);
    firmar(s);
    const ahora = ahoraToca(s);
    assert.equal(ahora.etapa, 1);
    assert.equal(ahora.total, 9);
    assert.equal(ahora.nombre, "Replanteo");
    assert.match(ahora.tarea, /Limpiar/);
    assert.ok(ahora.progreso >= 0 && ahora.progreso < 1);
  });
});

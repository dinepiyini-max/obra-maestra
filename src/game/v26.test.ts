// v26: regresiones de lo que encontró el Revisor jugando la v25 a mano (16-oct-2026).
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ETAPAS } from "./datos.ts";
import { avanzarMinutos, contratar, firmar, hablarSita, loQueFalta, nueva, pedirTambien, type Estado } from "./motor.ts";
import { correr, BOTS } from "./auditoria_sim.ts";

function obraEn(etapa: number): Estado {
  const s = nueva(5);
  firmar(s);
  for (const c of s.candidatos.slice(0, 3)) contratar(s, c.id);
  s.panel = null;
  s.tut.fin = true;
  s.avisos = [];
  for (let i = 0; i < etapa; i++) {
    s.etapas[i]!.sello = "aprobado";
    for (const t of ETAPAS[i]!.trabajos) {
      const r = s.runs[i]!.find((x) => x.id === t.id);
      if (r) r.hecho = t.q;
    }
  }
  s.etapa = etapa;
  return s;
}

describe("v26: el guardalmacén deja pedir la etapa siguiente", () => {
  it("en Excavación (no compra nada) ofrece pedir lo de Cimientos y lo pide una sola vez", () => {
    const s = obraEn(1);
    assert.deepEqual(loQueFalta(s), {});
    hablarSita(s);
    assert.equal(s.panel, "sita");
    const of = s.sita.oferta;
    assert.ok(of, "hay oferta aunque la etapa actual no compre");
    assert.deepEqual(of!.items, {});
    assert.deepEqual(of!.siguiente, { grava: 0.5, v38: 26, v14: 10, alambre: 6 });
    assert.match(of!.texto, /¿Pido la siguiente\? Normal P\$10,901, llega mañana 7:30\./);
    const caja = s.caja;
    assert.equal(pedirTambien(s), null);
    assert.equal(Math.round(caja - s.caja), 10901);
    assert.equal(s.pedidos.length, 1);
    assert.deepEqual(s.pedidos[0]!.items, { grava: 0.5, v38: 26, v14: 10, alambre: 6 });
    assert.equal(s.sita.oferta!.hecho, true);
    assert.equal(s.sita.oferta!.siguiente, undefined);
    assert.equal(pedirTambien(s), "La etapa siguiente no pide material.");
    assert.equal(s.pedidos.length, 1, "no se repite el pedido");
  });
});

function estadoAlPlomo(): Estado {
  let snap: string | null = null;
  try {
    correr(1, BOTS.experto!, "normal", 0, (s) => {
      if (!snap && s.plomo) {
        snap = JSON.stringify(s);
        throw new Error("alto");
      }
    });
  } catch (e) {
    if (!String(e).includes("alto")) throw e;
  }
  assert.ok(snap, "el experto llega al primer plomo");
  return JSON.parse(snap!) as Estado;
}

describe("v26: plomear no deja vencer el mortero", () => {
  it("al primer plomo hay a lo sumo una tanda de mortero batida y no se bate más hasta plomear", () => {
    const s = estadoAlPlomo();
    assert.equal(s.etapa, 4);
    const m = s.mezclas.filter((x) => x.tipo === "M");
    assert.ok(m.length <= 1, `tandas de mortero al plomo: ${m.length}`);
    const vidas = m.filter((x) => x.lista).map((x) => x.vida);
    const perdidas = s.stats.tandasPerdidas;
    s.plomo = { ...s.plomo! };
    // El maestro tarda 90 minutos en llegar al muro: nadie plomea.
    for (let i = 0; i < 90; i++) {
      const plomo = s.plomo;
      avanzarMinutos(s, 1);
      if (!s.plomo) s.plomo = plomo;
    }
    assert.equal(s.stats.tandasPerdidas, perdidas, "no se venció nada");
    const despues = s.mezclas.filter((x) => x.tipo === "M");
    assert.deepEqual(despues.filter((x) => x.lista).map((x) => x.vida), vidas, "el mortero batido no envejece");
    assert.equal(despues.filter((x) => !x.lista).length, 0, "no se empezó otra tanda de mortero");
  });
});

// v28: regresiones de lo que encontró el Revisor jugando la versión publicada (17-oct-2026, entregada el día 26).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { ETAPAS } from "./datos.ts";
import {
  avanzarMinutos,
  contratar,
  cuentaFiadoPedido,
  fiarPedido,
  firmar,
  hablarSita,
  limiteFiado,
  aceptarSita,
  loQueFalta,
  loQueFaltaSiguiente,
  nueva,
  pedir,
  pedirTambien,
  primeroEstaEtapa,
  type Estado,
} from "./motor.ts";
import { correr } from "./auditoria_sim.ts";
import { PERFILES } from "./sim_v18.ts";
import { jugarTramposo } from "./tramposo.ts";

function obraEn(etapa: number, n = 3): Estado {
  const s = nueva(5);
  firmar(s);
  for (const c of s.candidatos.slice(0, n)) contratar(s, c.id);
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
  s.selloDia = s.dia;
  return s;
}

/** Viga de amarre (etapa 7) con el almacén vacío: le faltan cemento, arena y grava; la siguiente (techo) pide madera. */
function vigaSinMaterial(caja: number): Estado {
  const s = obraEn(7);
  for (const m of ["cemento", "arena", "grava", "pino", "abeto", "plywood", "zinc", "clavo", "clavoTecho"] as const) {
    s.inv[m].q = 0;
    s.inv[m].valor = 0;
    const e = s.entrada[m];
    if (e) e.q = 0;
  }
  s.cementoAfuera = 0;
  s.pedidos = [];
  s.cargas = [];
  s.minuto = 14 * 60 + 21;
  s.caja = caja;
  return s;
}

const tenido = (s: Estado, m: keyof Estado["inv"]) => (s.inv[m]?.q ?? 0) + (s.entrada[m]?.q ?? 0);

describe("v28 hallazgo 1: todo lo pedido llega y la siguiente etapa no se come lo de hoy", () => {
  it("el caso del Revisor: la hoja pide cemento, arena y grava; «Pedir también» (pino y abeto) no sale solo", () => {
    const s = vigaSinMaterial(12_000);
    const falta = loQueFalta(s);
    assert.ok((falta.cemento ?? 0) > 0 && (falta.arena ?? 0) > 0 && (falta.grava ?? 0) > 0, JSON.stringify(falta));
    assert.ok((loQueFaltaSiguiente(s).pino ?? 0) > 0);
    hablarSita(s);
    assert.ok(s.sita?.oferta?.siguiente);
    const err = pedirTambien(s);
    assert.match(err ?? "", /Primero lo de esta etapa: falta .*cemento/);
    assert.equal(s.pedidos.length, 0, "no salió ningún camión con solo pino y abeto");
    assert.equal(s.caja, 12_000);
  });

  it("con lo de esta etapa pedido, la siguiente ya se puede pedir", () => {
    const s = vigaSinMaterial(80_000);
    hablarSita(s);
    assert.equal(aceptarSita(s), null);
    assert.equal(primeroEstaEtapa(s), "");
    assert.equal(pedirTambien(s), null);
    assert.equal(s.pedidos.length, 2);
  });

  it("el fiado de la etapa siguiente deja reservado lo que esta etapa necesita", () => {
    const s = vigaSinMaterial(0);
    s.adelantoDia = 1;
    const sig = loQueFaltaSiguiente(s);
    const c = cuentaFiadoPedido(s, sig, false);
    assert.ok(c, "con fiado de sobra, la siguiente se fía");
    // Queda de cupo justo lo de la siguiente: con la reserva de hoy ya no cabe.
    s.fiado = limiteFiado(s) - c.total;
    assert.equal(cuentaFiadoPedido(s, sig, false), null);
    assert.match(fiarPedido(s, sig, false) ?? "", /no fía/);
    assert.equal(s.pedidos.length, 0);
    // Lo de esta etapa sí cabe y se fía.
    assert.ok(cuentaFiadoPedido(s, loQueFalta(s), false));
    assert.equal(fiarPedido(s, loQueFalta(s), false), null);
    assert.ok((s.pedidos[0]?.items.cemento ?? 0) > 0);
  });

  it("un pedido mixto llega entero aunque el almacén ya tenga 20 fundas (lo que se cobra es lo que llega)", () => {
    const s = vigaSinMaterial(80_000);
    s.inv.cemento.q = 20;
    s.inv.cemento.valor = 20 * 550;
    const items = { cemento: 8, arena: 1, grava: 1, pino: 4, abeto: 4 };
    const antes = Object.fromEntries(Object.keys(items).map((k) => [k, tenido(s, k as never)]));
    const caja0 = s.caja;
    assert.equal(pedir(s, items, false), null);
    const p = s.pedidos[0]!;
    assert.deepEqual(p.items, items, "el camión lleva todo lo pedido");
    assert.ok(caja0 - s.caja > 0);
    s.dia = p.dia;
    s.minuto = p.minuto - 1;
    avanzarMinutos(s, 2);
    assert.equal(s.pedidos.length, 0);
    for (const [k, n] of Object.entries(items)) {
      assert.ok(tenido(s, k as never) - antes[k]! >= n - 0.2, `${k}: llegó ${tenido(s, k as never) - antes[k]!} de ${n}`);
    }
  });

  it("en partidas de humano y tramposo cada camión llega el día y la hora prometidos y sin cambiar de carga", () => {
    const vigilar = () => {
      const vistos = new Map<string, { t: number; items: string }>();
      let malos = 0;
      const ver = (s: Estado, paso: string) => {
        if (paso !== "tick") return;
        const ahora = s.dia * 1440 + s.minuto;
        const ids = new Set(s.pedidos.map((p) => p.id));
        for (const p of s.pedidos) {
          const v = vistos.get(p.id);
          if (!v) vistos.set(p.id, { t: p.dia * 1440 + p.minuto, items: JSON.stringify(p.items) });
          else if (v.items !== JSON.stringify(p.items)) malos++;
        }
        for (const [id, v] of vistos) {
          if (ids.has(id)) continue;
          if (ahora < v.t) malos++;
          vistos.delete(id);
        }
      };
      return { ver, malos: () => malos };
    };
    for (const seed of [1, 2, 3, 4]) {
      const v = vigilar();
      const r = correr(seed, PERFILES.humano!, "normal", 0.15, v.ver);
      assert.equal(v.malos(), 0, `humano ${seed}`);
      assert.equal(r.s.entregada, true);
    }
    for (const seed of [1, 2]) {
      const v = vigilar();
      const r = jugarTramposo(seed, "normal", 0.15, v.ver);
      assert.equal(v.malos(), 0, `tramposo ${seed}`);
      assert.equal(r.s.entregada, true);
    }
  });

  it("la hoja del guardalmacén esconde «Pedir la siguiente etapa» mientras falte lo de esta etapa y «Antes de pedir» dice qué trae", () => {
    const src = readFileSync(new URL("../components/juego/Paneles.tsx", import.meta.url), "utf8");
    assert.match(src, /data-primero-esta-etapa/);
    assert.match(src, /&& !primeroEstaEtapa\(s\) \? \(/);
    assert.match(src, /data-trae/);
  });
});

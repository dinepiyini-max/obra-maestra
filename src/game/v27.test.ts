// v27: regresiones de lo que encontró el Revisor jugando la v26 a mano (17-oct-2026, «Obra perdida» el día 16).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { ETAPAS } from "./datos.ts";
import {
  ajusteLoQueFalta,
  asignar,
  avanzarMinutos,
  cobroDe,
  confirmarNomina,
  contratar,
  costoDespedir,
  cuentaFiadoPedido,
  despedir,
  esperaAlCobro,
  fiadoFerreteria,
  fiarPedido,
  firmar,
  hablarSita,
  loQueFalta,
  NOTA_FIADO_FERRETERIA,
  nueva,
  obraPerdida,
  pedirTambien,
  siguienteDia,
  type Estado,
} from "./motor.ts";
import { correr } from "./auditoria_sim.ts";
import { cuadreCaja, PERFILES } from "./sim_v18.ts";
import { _reiniciarPestana, cargar, guardar, hayGuardado, KEY, KEY_PERDIDA } from "./guardar.ts";

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

type ConQuitado = Estado & { quitadoBot?: number };

/** Caja en P$0 y el adelanto ya usado: el caso del Revisor. Lo quitado se anota para que el cuadre no lo cuente. */
function sinCaja(s: Estado) {
  const q = s as ConQuitado;
  q.quitadoBot = (q.quitadoBot ?? 0) + s.caja;
  s.caja = 0;
  s.adelantoDia = 1;
}

describe("v27 hallazgo 1: «Pedir la siguiente etapa» aunque la etapa actual no compre", () => {
  it("en Replanteo (no compra) y con Excavación sin material, ofrece la próxima que compra (Acero de zapata) y la pide", () => {
    const s = obraEn(0);
    assert.deepEqual(loQueFalta(s), {});
    hablarSita(s);
    const of = s.sita.oferta;
    assert.ok(of, "hay oferta: antes decía «Ya está todo en el almacén o en camino»");
    assert.deepEqual(of!.siguiente, { grava: 0.5, v38: 26, v14: 10, alambre: 6 });
    assert.match(of!.texto, /Para Acero de zapata \(la próxima que compra\)/);
    assert.doesNotMatch(of!.texto, /Ya está todo/);
    assert.equal(pedirTambien(s), null);
    assert.equal(s.pedidos.length, 1);
  });
  it("si la etapa siguiente ya está cubierta, busca la que sigue (Excavación con el acero ya en el almacén → Vaciado)", () => {
    const s = obraEn(1);
    s.inv.v38 = { q: 26, valor: 0 };
    s.inv.v14 = { q: 10, valor: 0 };
    s.inv.alambre = { q: 6, valor: 0 };
    s.inv.grava = { q: 0.5, valor: 0 };
    hablarSita(s);
    const of = s.sita.oferta;
    assert.ok(of && of.siguiente, "hay oferta para más adelante");
    assert.ok((of!.siguiente!.cemento ?? 0) >= 10, JSON.stringify(of!.siguiente));
    assert.match(of!.texto, /Vaciado de zapata/);
  });
  it("con la caja en P$0 la oferta sigue (la hoja ofrece fiarlo) y el pedido de la siguiente se puede fiar", () => {
    const s = obraEn(1);
    sinCaja(s);
    const c0 = cuadreCaja(s);
    hablarSita(s);
    const of = s.sita.oferta;
    assert.ok(of && of.siguiente);
    assert.match(of!.texto, /te lo fío/);
    assert.ok(cuentaFiadoPedido(s, of!.siguiente!, false));
    assert.equal(fiarPedido(s, of!.siguiente!, false), null);
    assert.equal(s.pedidos.length, 1);
    assert.equal(s.caja, 0);
    assert.ok((s.fiado ?? 0) > 10000);
    assert.ok(Math.abs(cuadreCaja(s) - c0) < 0.5);
  });
  it("la pantalla del guardalmacén muestra el botón aunque la caja no alcance y le pasa el pedido a «Antes de pedir»", () => {
    const src = readFileSync(new URL("../components/juego/Paneles.tsx", import.meta.url), "utf8");
    const i = src.indexOf("data-pedir-siguiente");
    assert.ok(i > 0);
    const bloque = src.slice(src.lastIndexOf("{of.siguiente", i), i);
    assert.doesNotMatch(bloque, /alcanza/, "el botón ya no depende de que la caja alcance");
    assert.match(src.slice(i, i + 600), /origen: "tambien"[^}]*items:/);
  });
});

describe("v27 hallazgo 2: con la caja en P$0 la Ferretería ofrece fiado", () => {
  it("«Lo que falta» llena el pedido y la Ferretería ofrece fiarlo; el fiado cuadra y la caja no baja de P$0", () => {
    const s = obraEn(4);
    sinCaja(s);
    const c0 = cuadreCaja(s);
    const aj = ajusteLoQueFalta(s);
    assert.ok(Object.keys(aj.items).length > 0, "antes el pedido quedaba vacío");
    assert.equal(aj.nota, NOTA_FIADO_FERRETERIA);
    assert.ok(fiadoFerreteria(s), "se ofrece aunque el carrito esté vacío");
    const f = fiadoFerreteria(s, aj.items);
    assert.ok(f);
    assert.match(f!.texto, /^Fiado: P\$[\d,]+, sale del cobro de Muros de block$/);
    const prev = s.fiado ?? 0;
    assert.equal(fiarPedido(s, f!.items, false), null);
    assert.equal(s.caja, 0);
    assert.ok(Math.abs((s.fiado ?? 0) - prev - f!.total) < 1);
    assert.ok(Math.abs(cuadreCaja(s) - c0) < 0.5);
  });
  it("con caja que alcanza no se ofrece fiado", () => {
    const s = obraEn(4);
    s.caja = 500000;
    assert.equal(fiadoFerreteria(s), null);
  });
  it("la Ferretería tiene el botón de fiado a la vista", () => {
    const src = readFileSync(new URL("../components/juego/Paneles.tsx", import.meta.url), "utf8");
    assert.match(src, /data-fiar-ferreteria/);
    assert.match(src, /fiadoFerreteria\(s, cart/);
  });
});

function dosNominasCortas(s: Estado) {
  for (let d = 0; d < 2; d++) {
    s.minuto = 15 * 60 - 1;
    s.panel = null;
    s.lluvias = [];
    avanzarMinutos(s, 2);
    if (s.panel === "nomina") confirmarNomina(s, false);
    if (d === 0) {
      s.panel = "finde";
      s.nominaPagada = true;
      siguienteDia(s);
      s.caja = 0;
    }
  }
}

describe("v27 hallazgo 3: dos nóminas cortas no pierden la obra mientras haya cobro por delante", () => {
  it("el caso del Revisor: Muros al 85 %, adelanto de P$20,000, caja P$0, un solo obrero: dos nóminas cortas y la obra sigue", () => {
    const s = obraEn(4, 1);
    sinCaja(s);
    s.adelanto = 20000;
    const block = s.runs[4]!.find((r) => r.id === "block")!;
    block.hecho = ETAPAS[4]!.trabajos.find((t) => t.id === "block")!.q * 0.85;
    assert.ok(cobroDe(s).neto >= 9000, `entra ${cobroDe(s).neto} al sellar muros`);
    dosNominasCortas(s);
    assert.ok((s.deudaNomina ?? 0) > 0, "hubo nóminas cortas");
    assert.equal(s.gente.length + s.reserva.length, 1, "Yeyo se queda");
    assert.equal(obraPerdida(s), false);
    assert.ok(s.diario.some((d) => /te pago al cobrar/.test(d.texto)));
  });
  it("con tres en la cuadrilla y el cobro de la etapa pagando la deuda, nadie se va aunque la etapa vaya empezando", () => {
    const s = obraEn(4, 3);
    sinCaja(s);
    const n = s.gente.length + s.reserva.length;
    s.rachaCorta = 1;
    s.deudaNomina = 3000;
    assert.ok(esperaAlCobro(s));
    s.minuto = 15 * 60 - 1;
    avanzarMinutos(s, 2);
    if (s.panel === "nomina") confirmarNomina(s, false);
    assert.equal(s.gente.length + s.reserva.length, n);
  });
  it("sin nada por cobrar que pague la deuda, el último sí se va y la obra se pierde (queda marcada)", () => {
    const s = obraEn(4, 1);
    sinCaja(s);
    s.fiado = 10_000_000;
    dosNominasCortas(s);
    assert.equal(s.gente.length + s.reserva.length, 0);
    assert.equal(s.panel, "perdida");
    assert.equal(s.perdida, true);
  });
});

class Caja {
  m = new Map<string, string>();
  getItem(k: string) {
    return this.m.has(k) ? this.m.get(k)! : null;
  }
  setItem(k: string, v: string) {
    this.m.set(k, String(v));
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
}

describe("v27 hallazgo 4: tras «Obra perdida», «Continuar» no abre la obra perdida", () => {
  it("guardar una obra perdida la archiva y borra la partida; cargar no la devuelve", () => {
    const g = globalThis as unknown as { localStorage?: Caja };
    const antes = g.localStorage;
    g.localStorage = new Caja();
    try {
      _reiniciarPestana();
      const s = obraEn(4, 1);
      assert.equal(guardar(s), true);
      assert.ok(hayGuardado());
      s.panel = "perdida";
      s.perdida = true;
      assert.equal(guardar(s), false);
      assert.equal(g.localStorage.getItem(KEY), null);
      assert.ok(g.localStorage.getItem(KEY_PERDIDA));
      assert.equal(hayGuardado(), false);
      assert.equal(cargar().s, null);
      _reiniciarPestana();
      const otra = nueva(9);
      firmar(otra);
      assert.equal(guardar(otra), true);
      assert.equal(cargar().s?.seed, 9);
    } finally {
      g.localStorage = antes;
      _reiniciarPestana();
    }
  });
  it("un guardado de la v26 con el panel «Obra perdida» (p. ej. al pasar a segundo plano) no se carga: se archiva", () => {
    const g = globalThis as unknown as { localStorage?: Caja };
    const antes = g.localStorage;
    g.localStorage = new Caja();
    try {
      _reiniciarPestana();
      const s = obraEn(4, 1);
      s.panel = "perdida";
      g.localStorage.setItem(KEY, JSON.stringify({ v: 2, partida: String(s.seed), rev: 3, t: Date.now(), s }));
      const c = cargar();
      assert.equal(c.s, null);
      assert.equal(c.perdida, true);
      assert.equal(c.roto, false);
      assert.equal(g.localStorage.getItem(KEY), null);
      assert.ok(g.localStorage.getItem(KEY_PERDIDA));
    } finally {
      g.localStorage = antes;
      _reiniciarPestana();
    }
  });
  it("la portada no muestra «Continuar» con la obra perdida y «Continuar» empieza otra", () => {
    const pan = readFileSync(new URL("../components/juego/Paneles.tsx", import.meta.url), "utf8");
    assert.match(pan, /seguir && !obraPerdida\(s\)/);
    const jue = readFileSync(new URL("../components/juego/Juego.tsx", import.meta.url), "utf8");
    assert.match(jue, /onContinuar=\{\(\) => \{\s*\/\/[^\n]*\n\s*if \(obraPerdida\(estado\.current\)\) \{\s*nuevaObra\(\);/);
  });
});

describe("v27 hallazgo 5: mortero con el peón en el Trompo y «Despedir» con costo", () => {
  it("sin block en el almacén no se bate mortero (antes se batía y se vencía tanda tras tanda)", () => {
    const s = obraEn(4, 0);
    const alb = s.candidatos.find((c) => c.oficio === "albanil")!;
    const ayu = s.candidatos.find((c) => c.oficio === "peon" || c.oficio === "ayudante")!;
    contratar(s, alb.id);
    contratar(s, ayu.id);
    asignar(s, alb.id, "obra");
    asignar(s, ayu.id, "batea");
    s.inv.cemento = { q: 20, valor: 11000 };
    s.inv.arena = { q: 2, valor: 5766 };
    s.inv.agua = { q: 1.1, valor: 0 };
    s.inv.block = { q: 0, valor: 0 };
    s.lluvias = [];
    s.minuto = 7 * 60;
    for (let i = 0; i < 7 * 60; i++) avanzarMinutos(s, 1);
    assert.equal(s.mezclas.filter((m) => m.tipo === "M").length, 0, "no hay mortero batido sin block");
    assert.equal(s.stats.tandasPerdidas, 0);
  });
  it("humano y principiante (semillas 1 a 3): a lo sumo 1 mortero vencido por día", () => {
    for (const p of ["humano", "principiante"]) {
      for (let seed = 1; seed <= 3; seed++) {
        let peor = 0;
        let donde = "";
        correr(seed, PERFILES[p]!, (["poca", "normal", "mucha"] as const)[(seed * 7 + 3) % 3]!, 0.15, (s) => {
          const n = (s.perdidasHoy ?? []).filter((x) => /Mortero vencido/.test(x.texto)).length;
          if (n > peor) {
            peor = n;
            donde = `día ${s.dia}`;
          }
        });
        assert.ok(peor <= 1, `${p} semilla ${seed}: ${peor} morteros vencidos el ${donde}`);
      }
    }
  });
  it("«Despedir» dice el costo antes; con caja paga eso exacto y sin caja no deja la caja en negativo", () => {
    const s = obraEn(4, 3);
    s.minuto = 10 * 60;
    const g = s.gente[0]!;
    const c = costoDespedir(s, g.id)!;
    assert.ok(c.total > 0);
    assert.equal(c.total, c.jornal + c.herramienta);
    assert.ok(c.texto.includes(`P$${c.total.toLocaleString("en-US")}`), c.texto);
    const caja = s.caja;
    const c0 = cuadreCaja(s);
    despedir(s, g.id);
    assert.equal(Math.round(caja - s.caja), c.total);
    assert.ok(Math.abs(cuadreCaja(s) - c0) < 0.5);
    const h = s.gente[0]!;
    sinCaja(s);
    const c1 = cuadreCaja(s);
    const ch = costoDespedir(s, h.id)!;
    assert.match(ch.texto, /deuda de nómina/);
    const deuda = s.deudaNomina ?? 0;
    despedir(s, h.id);
    assert.equal(s.caja, 0);
    assert.ok(Math.abs((s.deudaNomina ?? 0) - deuda - ch.total) < 1);
    assert.ok(Math.abs(cuadreCaja(s) - c1) < 0.5);
    const ult = s.gente[0]!;
    assert.match(costoDespedir(s, ult.id)!.texto, /último/);
  });
  it("la Cuadrilla pide confirmación con el costo antes de despedir", () => {
    const src = readFileSync(new URL("../components/juego/Paneles.tsx", import.meta.url), "utf8");
    assert.match(src, /data-confirmar-despedir/);
    assert.match(src, /data-despedir onClick=\{\(\) => setPorDespedir\(g\.id\)\}/);
  });
});

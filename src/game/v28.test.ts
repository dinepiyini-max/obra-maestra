// v28: regresiones de lo que encontró el Revisor jugando la versión publicada (17-oct-2026, entregada el día 26).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { ETAPAS, esSabado } from "./datos.ts";
import {
  asignar,
  avanzarMinutos,
  cerrarPanel,
  tick,
  contratar,
  costoDespedir,
  despedir,
  cuentaFiadoPedido,
  fiarPedido,
  golpe,
  firmar,
  hablarSita,
  limiteFiado,
  aceptarSita,
  alternarLibre,
  loQueFalta,
  loQueFaltaSiguiente,
  nueva,
  pedir,
  pedirTambien,
  primeroEstaEtapa,
  siguienteDia,
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

describe("v28 hallazgo 2: el reloj no se congela y «Reportar» lo para", () => {
  it("el guardalmacén trabado detrás del almacén ya no para el reloj (antes quedaba a las 14:00 para siempre)", () => {
    for (const [x, y] of [[8, 17], [9.5, 17], [3, 3], [20, 10]] as const) {
      const s = obraEn(7);
      s.minuto = 14 * 60;
      s.jugador = { x, y };
      s.destino = null;
      s.sita!.oferta = { items: { cemento: 1 }, urgente: false, mats: 550, flete: 1500, total: 2050, texto: "Para mañana faltan" };
      s.sita!.fase = "yendo";
      s.sita!.x = 3;
      s.sita!.y = 3;
      // 6 s reales a 60 cuadros por segundo.
      for (let i = 0; i < 360 && s.sita!.fase === "yendo"; i++) tick(s, 1 / 60, 1);
      assert.notEqual(s.sita!.fase, "yendo", `(${x},${y}) la nota llega`);
      assert.equal(s.panel, "sita");
      cerrarPanel(s);
      for (let i = 0; i < 120; i++) tick(s, 1 / 60, 1);
      assert.ok(s.minuto > 14 * 60, `(${x},${y}) el reloj sigue: ${s.minuto}`);
    }
  });

  it("con «Reportar» abierto el reloj está parado y al cerrarlo sigue", () => {
    const hud = readFileSync(new URL("../components/juego/Hud.tsx", import.meta.url), "utf8");
    const juego = readFileSync(new URL("../components/juego/Juego.tsx", import.meta.url), "utf8");
    assert.match(hud, /onReporte\?: \(abierto: boolean\) => void/);
    assert.match(hud, /reporteAbierto\.current\?\.\(reporte\)/);
    assert.match(juego, /onReporte=\{\(abierto\) => \{/);
    assert.match(juego, /st\.pausa = true;\s*pausaReporte\.current = true;/);
    // Con pausa el motor no avanza.
    const s = obraEn(4);
    s.minuto = 10 * 60;
    s.pausa = true;
    for (let i = 0; i < 600; i++) tick(s, 1 / 60, 1);
    assert.equal(s.minuto, 10 * 60);
  });
});

describe("v28 hallazgo 3: «Despedir» siempre muestra el costo y pide confirmación", () => {
  it("en toda la interfaz solo se despide desde «Sí, despedir», y la confirmación se ve en pantalla", () => {
    const dir = new URL("../components/juego/", import.meta.url);
    let llamadas = 0;
    for (const f of ["Paneles.tsx", "Juego.tsx", "Hud.tsx"]) {
      const src = readFileSync(new URL(f, dir), "utf8");
      const m = src.match(/[^a-zA-Z]despedir\(st/g) ?? [];
      llamadas += m.length;
      if (f !== "Paneles.tsx") assert.equal(m.length, 0, `${f} no despide directo`);
    }
    assert.equal(llamadas, 1, "una sola ruta despide");
    const p = readFileSync(new URL("Paneles.tsx", dir), "utf8");
    const i = p.indexOf("data-confirmar-despedir");
    const j = p.indexOf("despedir(st, g.id)");
    assert.ok(i > 0 && j > i && j - i < 1200, "despedir() está dentro de la caja de confirmación");
    assert.match(p, /data-despedir onClick=\{\(\) => setPorDespedir\(g\.id\)\}/);
    assert.match(p, /data-confirmar-despedir ref=\{\(el\) => el\?\.scrollIntoView/);
  });

  it("el costo que se muestra es el que se paga", () => {
    const s = obraEn(4);
    s.minuto = 10 * 60;
    s.caja = 50_000;
    const g = s.gente[0]!;
    const c = costoDespedir(s, g.id)!;
    assert.match(c.texto, /^Despedir a .+ cuesta P\$/);
    const caja = s.caja;
    despedir(s, g.id);
    assert.equal(Math.round(caja - s.caja), Math.round(c.total));
  });
});

describe("v28 hallazgo 4: con el peón en el Trompo el mortero no se vence (jugando en tiempo real, como en la pantalla)", () => {
  /** Un día de muros a 60 cuadros por segundo; el jugador plomea 10 s reales después del aviso. */
  function diaDeMuros(albaniles: number, peones: number, ritmo: number) {
    const s = obraEn(4, 0);
    const albs = s.candidatos.filter((c) => c.oficio === "albanil").slice(0, albaniles);
    const pes = s.candidatos.filter((c) => c.oficio === "peon" || c.oficio === "ayudante").slice(0, peones);
    for (const c of [...albs, ...pes]) contratar(s, c.id);
    for (const c of albs) asignar(s, c.id, "obra");
    for (const c of pes) asignar(s, c.id, "batea");
    for (const g of s.gente) {
      g.activo = true;
      g.falto = false;
    }
    for (const k of Object.keys(s.inv) as (keyof Estado["inv"])[]) s.inv[k] = { q: 50, valor: 0 };
    s.inv.cemento = { q: 20, valor: 11_000 };
    s.inv.block = { q: 500, valor: 20_000 };
    s.lluvias = [];
    s.minuto = 7 * 60;
    let desde = -1;
    for (let i = 0; i < 400_000 && s.minuto < 18 * 60 && s.panel !== "finde"; i++) {
      tick(s, 1 / 60, ritmo);
      if (s.panel) s.panel = null;
      if (s.plomo) {
        if (desde < 0) desde = i;
        if (i - desde > 600) {
          const j = s.jugador;
          s.jugador = { x: 19, y: 14.5 };
          golpe(s, true);
          s.jugador = j;
          desde = -1;
        }
      } else desde = -1;
    }
    const vencidos = (s.perdidasHoy ?? []).filter((x) => /Mortero vencido/.test(x.texto)).length;
    const block = s.runs[4]!.find((r) => r.id === "block")!.hecho;
    return { vencidos, block };
  }

  it("1 o 2 albañiles con el peón en el Trompo: 0 morteros vencidos en el día y el muro avanza", () => {
    for (const [a, p, r] of [[1, 1, 1], [2, 1, 1], [2, 2, 2], [3, 1, 1]] as const) {
      const d = diaDeMuros(a, p, r);
      assert.equal(d.vencidos, 0, `${a} albañil(es), ${p} peón(es), x${r}: ${d.vencidos} vencidos`);
      assert.ok(d.block >= (a === 1 ? 120 : 230), `${a} albañil(es): ${d.block} block`);
    }
  });
});

describe("v28 hallazgo 5: «Libre mañana» se marca, se ve y se aplica", () => {
  it("al tocarlo queda marcado sobre el estado vivo, avisa y al otro día no viene ni cobra; los demás sí", () => {
    const s = obraEn(4, 3);
    s.minuto = 10 * 60;
    const [a, b] = s.gente;
    assert.equal(alternarLibre(s, a!.id), true);
    assert.match(s.avisos.at(-1)!.texto, new RegExp(`${a!.nombre} libre (mañana|el lunes): no viene ni cobra`));
    s.minuto = 18 * 60;
    siguienteDia(s);
    if (s.descanso) siguienteDia(s);
    const a2 = s.gente.find((g) => g.id === a!.id)!;
    const b2 = s.gente.find((g) => g.id === b!.id)!;
    assert.equal(a2.activo, false, "el que tiene libre no viene");
    assert.equal(b2.activo, true);
    assert.equal(a2.libre, false, "el libre es de un solo día");
  });

  it("tocarlo otra vez lo deshace («Que venga mañana») y funciona con quien entra mañana", () => {
    const s = obraEn(4, 2);
    const g = s.gente[0]!;
    assert.equal(alternarLibre(s, g.id), true);
    assert.equal(alternarLibre(s, g.id), false);
    assert.match(s.avisos.at(-1)!.texto, /sí viene/);
    s.minuto = 18 * 60;
    siguienteDia(s);
    if (s.descanso) siguienteDia(s);
    assert.equal(s.gente.find((x) => x.id === g.id)!.activo, true);
    // Alguien contratado tarde (entra mañana) también se puede marcar.
    const nuevo = s.candidatos[0]!;
    s.minuto = 12 * 60;
    contratar(s, nuevo.id);
    if (s.reserva.some((x) => x.id === nuevo.id)) assert.equal(alternarLibre(s, nuevo.id), true);
  });

  it("el sábado, «Libre mañana» vale para el lunes", () => {
    const s = obraEn(4, 2);
    while (!esSabado(s.dia)) s.dia += 1;
    const g = s.gente[0]!;
    alternarLibre(s, g.id);
    assert.match(s.avisos.at(-1)!.texto, /libre el lunes/);
    s.minuto = 18 * 60;
    siguienteDia(s); // domingo
    assert.equal(s.descanso, true);
    siguienteDia(s); // lunes
    assert.equal(s.gente.find((x) => x.id === g.id)!.activo, false);
  });

  it("la Cuadrilla muestra la marca, el botón dice «Que venga mañana» y el cambio se guarda al instante", () => {
    const p = readFileSync(new URL("../components/juego/Paneles.tsx", import.meta.url), "utf8");
    const j = readFileSync(new URL("../components/juego/Juego.tsx", import.meta.url), "utf8");
    assert.equal((p.match(/data-libre aria-pressed=\{!!g\.libre\} onClick=\{\(\) => act\(\(st\) => void alternarLibre\(st, g\.id\)\)\}/g) ?? []).length, 2);
    assert.match(p, /data-libre-marca/);
    assert.doesNotMatch(p, /Sí viene mañana/);
    assert.match(p, /Que venga mañana/);
    assert.match(j, /libres\(\) !== antes\)\) guardar\(estado\.current\)/);
  });
});

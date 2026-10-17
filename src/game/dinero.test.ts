import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FLETE, FLETE_URGENTE, MATERIALES, type Mat } from "./datos.ts";
import {
  adelantar,
  asignar,
  confirmarNomina,
  continuarSello,
  contratar,
  firmar,
  informe,
  nueva,
  pedir,
  pronosticoDia,
  reloj,
  siguienteDia,
  tick,
  type Estado,
} from "./motor.ts";

function valorMapa(obj: Partial<Record<Mat, { q: number; valor: number }>> | Record<string, { q: number; valor: number } | undefined>): number {
  let n = 0;
  for (const sl of Object.values(obj)) n += sl?.valor ?? 0;
  return n;
}

export function descuadre(s: Estado): number {
  let costos = 0;
  for (const p of Object.values(s.costos)) costos += (p?.mo ?? 0) + (p?.mat ?? 0);
  const alm = valorMapa(s.inv);
  const entrada = valorMapa(s.entrada);
  let camino = 0;
  for (const p of s.pedidos) {
    for (const [k, n] of Object.entries(p.items) as [Mat, number][]) camino += (n ?? 0) * MATERIALES[k].precio;
  }
  let mezcla = 0;
  for (const m of s.mezclas) mezcla += m.lista ? m.costo * m.restante : m.costo;
  let mo = 0;
  if (!s.nominaPagada) {
    for (const g of s.gente) if (g.activo && !g.falto) mo += g.moHoy;
  }
  const deuda = s.deudaNomina ?? 0;
  const esperado = s.cobrado + (s.fiado ?? 0) - (costos + alm + entrada + camino + mezcla - mo - deuda);
  return Math.round((s.caja - esperado) * 100) / 100;
}

function atender(s: Estado) {
  if (s.panel === "nomina") confirmarNomina(s, true);
  if (s.panel === "sello") continuarSello(s);
  if (s.panel === "finde") {
    siguienteDia(s);
    if (s.descanso) siguienteDia(s);
  }
}

describe("dinero", () => {
  it("la caja cuadra en cada paso y el flete es 1500 o 3000", () => {
    const s = nueva(2);
    firmar(s);
    assert.ok(Math.abs(descuadre(s)) < 1, "firma " + descuadre(s));
    const alba = s.candidatos.filter((c) => c.oficio === "albanil").slice(0, 2);
    const ayuda = s.candidatos.filter((c) => c.oficio === "ayudante").slice(0, 2);
    for (const c of [...alba, ...ayuda]) contratar(s, c.id);
    for (const g of s.gente) asignar(s, g.id, g.oficio === "albanil" ? "obra" : "batea");
    const err = pedir(s, { cemento: 10, block: 200, arena: 2, grava: 1 }, false);
    assert.equal(err, null);
    for (const p of s.pedidos) assert.ok(p.flete === FLETE || p.flete === FLETE_URGENTE, String(p.flete));
    assert.ok(Math.abs(descuadre(s)) < 1, "pedido " + descuadre(s));
    let guard = 0;
    while (!s.entregada && s.panel !== "perdida" && guard < 8000) {
      guard++;
      atender(s);
      if (s.panel && s.panel !== "informe") s.panel = null;
      tick(s, 0.2);
      const d = descuadre(s);
      assert.ok(Math.abs(d) < 2, `paso ${guard} día ${s.dia} ${s.minuto} descuadre ${d}`);
      if (s.caja < 4000 && s.adelantoDia !== s.dia) adelantar(s);
    }
    if (s.entregada) assert.equal(s.adelanto, 0, "adelanto al entregar " + s.adelanto);
    void informe;
  });

  it("la misma semilla llueve igual y el domingo sin riego no cura", () => {
    const a = nueva(7);
    const b = nueva(7);
    firmar(a);
    firmar(b);
    assert.deepEqual(
      a.lluvias.map((r) => [r.dia, r.ini, r.prob, r.cae]),
      b.lluvias.map((r) => [r.dia, r.ini, r.prob, r.cae]),
    );
    let n = 0;
    let caen = 0;
    let suma = 0;
    for (let i = 1; i <= 40; i++) {
      const s = nueva(i);
      for (const r of s.lluvias) {
        n += 1;
        suma += r.prob;
        if (r.cae) caen += 1;
      }
    }
    const esperado = suma / 100;
    assert.ok(n >= 20, "lluvias " + n);
    assert.ok(Math.abs(caen - esperado) < Math.max(8, n * 0.2), `cayeron ${caen} esperado ${esperado.toFixed(1)}`);
    const s = nueva(3);
    firmar(s);
    s.curando = true;
    s.regadoHoy = false;
    s.curadoDias = [1];
    s.dia = 6;
    siguienteDia(s);
    assert.equal(s.curadoDias.includes(7), false);
    assert.ok(s.diario.some((d) => d.texto.includes("no se regó el sábado")));
    const r = nueva(3);
    firmar(r);
    r.curando = true;
    r.regadoHoy = true;
    r.curadoDias = [1];
    r.dia = 6;
    siguienteDia(r);
    assert.ok(r.curadoDias.includes(7));
    const seco = nueva(4);
    firmar(seco);
    seco.lluvias = [];
    assert.match(reloj(seco).clima, /No llovió/);
    const man = nueva(5);
    firmar(man);
    const prox = man.lluvias.find((x) => x.dia > man.dia);
    if (prox) assert.match(pronosticoDia(man, prox.dia - man.dia), /% de aguacero, a eso de las/);
  });
});

// ===================== v23: regresiones fijas de la partida a mano del Revisor (v22) =====================
import { BLOCKS_MURO, HILADA_TOPE, POR_HILADA, TAREAS, TOPE_BLOCK_DIA, peso as pesoTxt, pesoCaja as pesoCajaTxt } from "./datos.ts";
import {
  RELOJ_MIN_CAMINANDO,
  UMBRALES,
  avanzarMinutos,
  fatiga,
  libreta,
  lineasCierre,
  muertoPorVenir,
  progresoObra,
  relojParado,
  textoSinTarea,
  type Cierre,
} from "./motor.ts";
import { correr, BOTS, BOT_SIN_AYUDA } from "./auditoria_sim.ts";

describe("regresión v23", () => {
  it("1. la Entrega muestra pago, adelanto, fiado, bono, nómina y deuda, y cuadra con montos fijos", () => {
    // El caso del Revisor: P$26,390 tras el cobro + bono P$1,500 tenía que dar P$27,890 (salía P$26,140) y la deuda P$13,484 no salía.
    const c: Cierre = {
      cajaAntes: 10000,
      bruto: 30000,
      adelanto: 5000,
      fiado: 8610,
      bono: 1500,
      jornales: 4800,
      herramienta: 144,
      direccion: 1750,
      deudaPrevia: 13484,
      pagadoNomina: 20178,
      quedaDebiendo: 0,
      cajaDespues: 7712,
      dia: 29,
    };
    const l = lineasCierre(c);
    assert.deepEqual(
      l.map((x) => [x.texto, x.monto]),
      [
        ["Caja antes del último sello", 10000],
        ["+ pago de Doña Carmen por el techo", 30000],
        ["− adelanto que ya te había dado", -5000],
        ["− fiado del guardalmacén", -8610],
        ["+ bono de Doña Carmen (P$1,500 × 1 día antes del día 30)", 1500],
        ["− jornales del día", -4800],
        ["− herramienta (3% del jornal)", -144],
        ["− Dirección del día", -1750],
        ["− deuda de nómina de días anteriores", -13484],
        ["= caja final", 7712],
      ],
    );
    // Subtotal tras el cobro y el bono: 26,390 + 1,500 = 27,890 (no 26,140).
    assert.equal(l.slice(0, 4).reduce((a, x) => a + x.monto, 0), 26390);
    assert.equal(l.slice(0, 5).reduce((a, x) => a + x.monto, 0), 27890);
    // Con caja corta: lo que no alcanza queda como deuda y se ve; la caja final nunca sale negativa en pantalla.
    // 0 + 30,000 − 5,000 − 8,610 + 1,500 = 17,890 para una nómina de 20,178: se pagan 17,890 y quedan 2,288 de deuda.
    const corto = lineasCierre({ ...c, cajaAntes: 0, pagadoNomina: 17890, quedaDebiendo: 2288, cajaDespues: 0 });
    assert.deepEqual(corto.at(-2), { texto: "+ lo que no alcanzó y queda debiendo a la cuadrilla", monto: 2288 });
    assert.equal(corto.at(-1)!.monto, 0);
    assert.equal(corto.slice(0, -1).reduce((a, x) => a + x.monto, 0), 0);
    assert.equal(pesoCajaTxt(-2500), "P$0 · debes P$2,500");
    // Día 30 o después: la línea del bono dice «sin bono» con P$0.
    const tarde = lineasCierre({ ...c, bono: 0, cajaDespues: 6212, dia: 31 });
    assert.deepEqual(tarde[4], { texto: "+ bono de Doña Carmen (entregaste el día 31: sin bono)", monto: 0 });
  });

  it("1b. una obra real hasta la entrega: la cuenta de la Entrega suma exacto la caja final", () => {
    const r = correr(1, BOTS.experto!, "normal", 0.15);
    assert.equal(r.s.entregada, true);
    const c = r.s.cierre!;
    const l = lineasCierre(c);
    assert.equal(l.slice(0, -1).reduce((a, x) => a + x.monto, 0), Math.round(r.s.caja));
    assert.equal(l.at(-1)!.monto, Math.round(r.s.caja));
    assert.equal(l.some((x) => x.texto.startsWith("±")), false, "sin centavos sueltos");
    // El bono es P$1,500 por día antes del día 30.
    assert.equal(c.bono, Math.max(0, 30 - r.s.dia) * 1500);
    assert.equal(Math.round(c.pagadoNomina), Math.round(c.jornales + c.herramienta + c.direccion + c.deudaPrevia - c.quedaDebiendo));
  });

  it("2. Fefa no sale frita tras un día: curva de cansancio con valores fijos", () => {
    const s = nueva(1);
    firmar(s);
    const fefa = structuredClone(s.candidatos.find((g) => g.nombre === "Fefa")!);
    assert.equal(fefa.aguante, 3);
    assert.equal(fefa.mania, "patas");
    fefa.cansancio = 0;
    for (let i = 0; i < 480; i++) fatiga(s, fefa, "pesado");
    // 5/60 × (1.4 − 0.3) × 1.25 × 480 = 55
    assert.equal(Math.round(fefa.cansancio * 100) / 100, 55);
    const peor = { ...fefa, aguante: 1, cansancio: 0 };
    for (let i = 0; i < 480; i++) fatiga(s, peor, "pesado");
    assert.equal(Math.round(peor.cansancio * 100) / 100, 65);
    assert.ok(peor.cansancio < 85, "ni el de menos aguante se fríe en una jornada");
    // A la noche descansa 40: mañana viene con 15 y no falta.
    s.gente = [fefa];
    fefa.activo = true;
    siguienteDia(s);
    if (s.descanso) siguienteDia(s);
    assert.equal(fefa.falto, false);
    assert.equal(Math.round(fefa.cansancio), s.dia % 7 === 1 ? 0 : 15);
  });

  it("3. el peón nuevo va solo a la obra y no suma horas «Sin tarea» (Bolo)", () => {
    const s = nueva(1);
    firmar(s);
    s.tut.fin = false;
    s.tut.cuadrilla = false;
    s.minuto = 7 * 60;
    s.lluvias = [];
    const bolo = s.candidatos.find((g) => g.nombre === "Bolo")!;
    assert.equal(contratar(s, bolo.id), null);
    const g = s.gente.find((x) => x.nombre === "Bolo")!;
    assert.equal(g.puesto, "obra");
    s.panel = null;
    avanzarMinutos(s, 384); // 6,4 h
    assert.equal(g.sinTareaHoy, 0);
    assert.equal(textoSinTarea(g), null);
    assert.equal(s.stats.muertoDetalle?.tarea?.min ?? 0, 0);
  });

  it("4. el reloj se para con Ferretería o Pausa y un día dura menos de 5 min reales", () => {
    const s = nueva(2);
    firmar(s);
    s.lluvias = [];
    contratar(s, s.candidatos[0]!.id);
    s.minuto = 9 * 60;
    for (const [panel, pausa] of [["ferreteria", false], ["pausa", true]] as const) {
      s.panel = panel;
      s.pausa = pausa;
      assert.equal(relojParado(s), true);
      const m = s.minuto;
      for (let i = 0; i < 600; i++) tick(s, 0.1); // 60 s reales
      assert.equal(s.minuto, m, panel);
    }
    s.panel = null;
    s.pausa = false;
    assert.equal(RELOJ_MIN_CAMINANDO, 3);
    // Caminando sin parar de un lado al otro (el caso lento): 7:00 a 18:00 en menos de 300 s.
    const d = nueva(3);
    firmar(d);
    d.lluvias = [];
    contratar(d, d.candidatos[0]!.id);
    d.minuto = 7 * 60;
    let seg = 0;
    let dir = 1;
    while (d.minuto < 18 * 60 && seg < 2000) {
      if (d.panel) d.panel = null;
      if (d.jugador.x > 20) dir = -1;
      if (d.jugador.x < 4) dir = 1;
      d.mando = { ax: dir, ay: 0 };
      tick(d, 0.05, 1);
      seg += 0.05;
    }
    assert.ok(d.minuto >= 18 * 60, "llegó a las 18:00");
    assert.ok(seg <= 300, `día de ${seg.toFixed(0)} s`);
  });

  it("5. muros: ritmo, plomeos y Falta gastar con el tiempo muerto", () => {
    assert.equal(BLOCKS_MURO, 469);
    assert.equal(TAREAS.block.rinde, 210); // 26,25 block/h por albañil (antes 150 = 18,75)
    assert.equal((TAREAS.block.rinde / 480) * 60, 26.25);
    assert.deepEqual(UMBRALES, [3 * POR_HILADA, 9 * POR_HILADA]); // 2 paradas «Toca plomear» (antes 4)
    assert.equal(HILADA_TOPE, 8);
    assert.equal(TOPE_BLOCK_DIA, 8 * POR_HILADA);
    const s = nueva(4);
    firmar(s);
    s.etapa = 3;
    const p = progresoObra(s);
    const antes = libreta(s).porHacer;
    s.costos.muerto.mo += 1000;
    const esperado = (1000 * (1 - p)) / p;
    assert.equal(Math.round(muertoPorVenir(s)), Math.round(esperado));
    assert.equal(Math.round(libreta(s).porHacer - antes), Math.round(esperado));
    assert.ok(libreta(s).porHacer > antes, "Falta gastar sube con el tiempo muerto");
  });

  it("6. el guardado no lo pisa una pestaña vieja ni otra versión", async () => {
    const mem = new Map<string, string>();
    (globalThis as any).localStorage = {
      getItem: (k: string) => (mem.has(k) ? mem.get(k)! : null),
      setItem: (k: string, v: string) => void mem.set(k, String(v)),
      removeItem: (k: string) => void mem.delete(k),
    };
    // Dos pestañas = dos copias del módulo (cada una con su propio dueño de partida).
    type G = typeof import("./guardar.ts");
    const ruta = (q: string) => new URL(`./guardar.ts?${q}`, import.meta.url).href;
    const A = (await import(ruta("pestanaA"))) as G;
    const B = (await import(ruta("pestanaB"))) as G;
    assert.equal(A.KEY, "obra-maestra-v2");
    const vieja = nueva(111);
    firmar(vieja);
    A.tomarPartida(vieja, 1000);
    assert.equal(A.guardar(vieja, 1000), true);
    // Pestaña B empieza una obra nueva después.
    const nuevaObra = nueva(222);
    firmar(nuevaObra);
    B.tomarPartida(nuevaObra, 2000);
    assert.equal(B.guardar(nuevaObra, 2000), true);
    // La pestaña A (vieja) intenta guardar y borrar: no puede.
    assert.equal(A.guardar(vieja, 3000), false);
    assert.equal(A.pestanaVieja(), true);
    A.borrar(vieja);
    const sobre = JSON.parse(mem.get("obra-maestra-v2")!);
    assert.equal(sobre.partida, "222");
    assert.equal(sobre.v, 2);
    assert.equal(sobre.rev, 1);
    // Una pestaña de v22 que escribe la clave vieja tampoco toca la nueva.
    mem.set("obra-maestra-v1", JSON.stringify(vieja));
    const c = B.cargar();
    assert.equal(c.s?.seed, 222);
    // B sigue guardando su partida.
    assert.equal(B.guardar(nuevaObra, 4000), true);
    assert.equal(JSON.parse(mem.get("obra-maestra-v2")!).rev, 2);
    void pesoTxt;
    delete (globalThis as any).localStorage;
  });
});

// ===================== v24: obras que se trababan hasta el día 61 =====================
import { PERFILES, cuadreCaja } from "./sim_v18.ts";

describe("regresión v24: siempre hay salida", () => {
  // Causa: en Relleno y piso el firme quedaba en 7.98 de 8 (falta 0.02 tanda de hormigón). tandaCabe pedía más de
  // 0.02 tanda pendiente para batir, así que el trompo nunca batía y el guardalmacén (que ve 0.02 cubierto) no pedía nada.
  const casos = [
    ["principiante", 2, "mucha"],
    ["principiante", 7, "normal"],
    ["principiante", 40, "normal"],
    ["humano", 32, "mucha"],
    ["torpe", 38, "mucha"],
  ] as const;
  for (const [perfil, seed, clima] of casos) {
    it(`${perfil} semilla ${seed} (${clima}) entrega y no se traba`, () => {
      const r = correr(seed, PERFILES[perfil]!, clima, 0.15);
      assert.equal(r.s.entregada, true, `día ${r.s.dia} etapa ${r.s.etapa}`);
      assert.equal(r.s.etapa, 9);
      assert.ok(r.s.dia <= 30, `entregó el día ${r.s.dia}`);
    });
  }
  // v26: el caso del Revisor en la v25: sin peón ni ayudante y con la caja en P$0 nadie batía y la obra quedaba
  // trabada en Cimientos hasta el día 61. Ahora el albañil hace de ayuda (trompo, agua, acarreo) y el fiado paga.
  for (const [seed, dia] of [[1, 34], [2, 30], [4, 30]] as const) {
    it(`sin peón ni ayudante y caja P$0, semilla ${seed}: entrega el día ${dia}`, () => {
      const r = correr(seed, BOT_SIN_AYUDA, "normal", 0.15);
      assert.equal(r.perdida, false);
      assert.equal(r.sinSalida, 0);
      assert.equal(r.s.entregada, true, `día ${r.s.dia} etapa ${r.s.etapa}`);
      assert.equal(r.s.etapa, 9);
      assert.equal(r.s.dia, dia);
      assert.equal(r.s.gente.some((g) => g.oficio === "peon" || g.oficio === "ayudante"), false);
      assert.equal(Math.round(cuadreCaja(r.s)) + 0, 0, "descuadre 0 (descontando la caja que el bot vació a mano)");
      assert.equal(Math.round(descuadre(r.s)), -89400, "lo único fuera de cuadre es la caja vaciada a mano");
    });
  }
});

// ===================== v24: bot tramposo =====================
import { jugarTramposo, patrimonio, avance } from "./tramposo.ts";

describe("v24: el tramposo no fabrica dinero", () => {
  it("el detector sí ve un truco plantado (dinero sin avance)", () => {
    const s = nueva(3);
    firmar(s);
    const p0 = patrimonio(s);
    const a0 = avance(s);
    s.caja += 100;
    assert.equal(Math.round(patrimonio(s) - p0), 100);
    assert.equal(avance(s), a0);
    // Pedir material no sube el patrimonio (paga material y flete).
    const p1 = patrimonio(s);
    pedir(s, { cemento: 5 }, false);
    assert.ok(patrimonio(s) <= p1 + 0.5);
  });
  for (const seed of [1, 2, 3, 4, 5]) {
    it(`semilla ${seed}: ningún truco sube el dinero sin avanzar la obra`, () => {
      const r = jugarTramposo(seed, (["poca", "normal", "mucha"] as const)[seed % 3]!, 0.15);
      assert.deepEqual(r.encontrados, []);
      assert.equal(r.s.entregada, true, `día ${r.s.dia}`);
    });
  }
});

// ===================== v24: hallazgos del Revisor en la 1.0 =====================
import { cuentaFiadoPedido, fiarPedido, limiteFiado } from "./motor.ts";
import { FLETE as FLETE_NORMAL, MATERIALES as MAT } from "./datos.ts";

describe("v24: Revisor 1.0", () => {
  it("1. con la caja en P$0, el pedido suelto también se puede fiar (monto fijo)", () => {
    const s = nueva(5);
    firmar(s);
    s.panel = null;
    s.caja = 0;
    s.adelantoDia = 1; // ya no hay adelanto
    const items = { cemento: 5 };
    const c = cuentaFiadoPedido(s, items, false);
    assert.ok(c, "ofrece fiado");
    assert.equal(c!.total, 5 * MAT.cemento.precio + FLETE_NORMAL); // 5 × 550 + 1,500 = 4,250
    assert.equal(c!.total, 4250);
    const lim = limiteFiado(s);
    const d0 = descuadre(s);
    assert.equal(fiarPedido(s, items, false), null);
    assert.equal(s.caja, 0, "la caja no se toca");
    assert.equal(s.fiado, 4250);
    assert.equal(limiteFiado(s), lim - 4250);
    assert.equal(s.pedidos.length, 1);
    assert.equal(Math.round(descuadre(s) - d0), 0, "el fiado cuadra: entra material y deuda por igual");
    // Con caja que lo paga, no se fía.
    const r = nueva(5);
    firmar(r);
    r.caja = 50000;
    assert.equal(cuentaFiadoPedido(r, items, false), null);
    // Nunca más de lo que queda por cobrar.
    s.fiado = limiteFiado(s) + (s.fiado ?? 0);
    assert.equal(cuentaFiadoPedido(s, items, false), null);
  });
});

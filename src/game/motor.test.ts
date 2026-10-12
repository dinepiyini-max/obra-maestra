import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CONTRATO, DIRECCION_DIA, ETAPAS, FLETE, FLETE_URGENTE, HERRAMIENTA, MATERIALES, NOTA_ESCUADRA, POR_HILADA, RECETA_H, RECETA_M, SITIOS, BLOCKS_MURO, COMPRA, TAREAS, TUTORIAL, esSabado, horaDe, jornalDe, peso, type Puesto } from "./datos.ts";
import {
  abrirDespacho,
  accion,
  aceptarSita,
  adelantar,
  almacen,
  ancla,
  asignar,
  cajaLibre,
  confirmarDespacho,
  confirmarNomina,
  continuarSello,
  contratar,
  cuentaPedido,
  cuello,
  cuelloLabor,
  desgloseNomina,
  firmar,
  golpe,
  hablarSita,
  hayCarga,
  informe,
  laborDe,
  libreta,
  lineaAhora,
  lineaFicha,
  loQueFalta,
  loQueFaltaSiguiente,
  marcarLibre,
  marcarGuia,
  nominaPendiente,
  nueva,
  nominaManana,
  partesMuerto,
  pasoTutorial,
  pedir,
  pedirTambien,
  puedeAdelantar,
  queHaceEspacio,
  rechazarSita,
  sanear,
  seguirDedo,
  seguirJornada,
  señalesReplanteo,
  siguienteDia,
  terminarJornada,
  textoCajaLibre,
  textoLlegada,
  tick,
  topeAvance,
  tramos,
  trianguloEscuadra,
  validar,
  avanzarMinutos,
  type Estado,
} from "./motor.ts";

function cabeNominaManana(s: Estado): boolean {
  const manana = (s.dia + 1 - 1) % 7 === 6 ? s.dia + 2 : s.dia + 1;
  let adel = 0;
  if (manana - (s.selloDia || 1) <= 18) {
    const monto = Math.round(Math.min(20000, topeAvance(s)));
    if (monto >= 100) adel = monto;
  }
  return nominaManana(s) <= s.caja + adel + 0.5;
}

function aliviarNomina(s: Estado) {
  if (cabeNominaManana(s)) return;
  const mando = (oficio: string) => oficio === "albanil" || oficio === "varillero" || oficio === "carpintero";
  const cola = [...s.gente]
    .filter((g) => !g.libre)
    .sort((a, b) => Number(mando(a.oficio)) - Number(mando(b.oficio)) || jornalDe(b.oficio, b.rinde) - jornalDe(a.oficio, a.rinde));
  for (const g of cola) {
    if (cabeNominaManana(s)) break;
    const lideres = s.gente.filter((o) => !o.libre && (o.oficio === "albanil" || o.oficio === "varillero"));
    if (lideres.length === 1 && lideres[0] === g) continue;
    marcarLibre(s, g.id, true);
  }
}

function ver(s: Estado) {
  return s.panel;
}

function silenciar(s: Estado) {
  s.avisos = [];
}

function jugar(seed: number, cupo = 4) {
  const s = nueva(seed);
  firmar(s);
  for (const c of s.candidatos.slice(0, cupo)) contratar(s, c.id);
  for (const g of s.gente) asignar(s, g.id, "obra");
  s.jugador = { x: 19, y: 14.5 };
  s.tut.fin = true;
  let guard = 0;
  let pedidoDia = -1;
  const log: string[] = [];
  while (!s.entregada && guard < 60000) {
    guard++;
    if (s.panel === "sello") continuarSello(s);
    if (s.panel === "nomina") confirmarNomina(s, true);
    if (s.panel === "finde") {
      let n = 0;
      while (cajaLibre(s) < 5000 && n < 4 && adelantar(s) === null) n++;
      aliviarNomina(s);
      siguienteDia(s);
    }
    if (`${s.panel}` === "perdida") break;
    if (s.panel && s.panel !== "informe") s.panel = null;
    if (s.entregada) break;
    if (s.minuto >= 7 * 60 && s.minuto < 7 * 60 + 15 && pedidoDia !== s.dia) {
      gestionar(s, true, cupo);
      pedidoDia = s.dia;
    } else if (s.minuto < 15 * 60 && (s.minuto % 15 === 0 || laborCambia(s))) gestionar(s, false, cupo);
    if (s.minuto < 7 * 60 + 8) silenciar(s);
    if ((s.plomo || (s.curando && !s.regadoHoy && s.curadoDias.length < 7)) && s.minuto < 17 * 60) {
      s.jugador = { x: 19, y: 14.5 };
      golpe(s, true);
    }
    if (s.minuto % 5 === 0 && s.minuto < 15 * 60) {
      s.jugador = { x: 19, y: 14.5 };
      golpe(s, false);
    }
    const antes = s.dia + ":" + s.minuto;
    tick(s, 0.2);
    if (s.minuto === 7 * 60 + 30 || (s.minuto === 15 * 60 + 1 && log[log.length - 1]?.startsWith("D" + s.dia + " ") !== true)) {
      /* marker */
    }
    if (s.minuto === 15 * 60 + 2) {
      const mojado = s.mojado;
      log.push(
        `D${s.dia} et${s.etapa + 1} caja ${Math.round(s.caja)} flete ${s.stats.fletes} mojado ${mojado} gente ${s.gente.filter((g) => g.activo).length} :: ${cuello(s)}`,
      );
      if (process.env.DEBUG_SIM === String(seed)) console.log(log[log.length - 1]);
    }
    if (ver(s) === "sello") continue;
    if (s.minuto >= 15 * 60 + 8 && s.nominaPagada && !s.panel) {
      const c = cuelloLabor(s);
      const muro = s.etapa === 4 && s.blocksHoy >= 180;
      if (c.includes("fragua") || c.includes("Fragua") || c.includes("hiladas") || muro || (c.includes("Curado") && s.etapa >= 7)) {
        terminarJornada(s);
      }
    }
    void antes;
  }
  if (process.env.DEBUG_SIM === String(seed)) {
    console.log("FIN", s.entregada, "dia", s.dia, "panel", s.panel, "guard", guard, "ganancia", Math.round(informe(s).ganancia), "curado", s.curadoDias.join(","));
    console.log(log.join("\n"));
  }
  return { s, guard, log, inf: informe(s) };
}

function aceptarSiAlcanza(s: Estado): boolean {
  const of = s.sita?.oferta;
  if (!of) return false;
  const hay = (c?: Record<string, number | undefined>) => !!c && Object.values(c).some((n) => (n ?? 0) > 1e-6);
  const cerrarSi = (err: string | null) => {
    if (err) rechazarSita(s);
  };
  if (!hay(of.items)) {
    if (!hay(of.siguiente)) {
      rechazarSita(s);
      return false;
    }
    const mats = Object.entries(of.siguiente ?? {}).reduce((a, [k, n]) => a + (n ?? 0) * MATERIALES[k as keyof typeof MATERIALES].precio, 0);
    const total = mats + (of.flete || 0);
    const cuenta = cuentaPedido(s, total);
    if (!cuenta.alcanza) {
      rechazarSita(s);
      return false;
    }
    if (cuenta.usaAdelanto && adelantar(s, total)) {
      rechazarSita(s);
      return false;
    }
    const antes = s.pedidos.length;
    const err = pedirTambien(s);
    cerrarSi(err);
    return !err && s.pedidos.length > antes;
  }
  const cuenta = cuentaPedido(s, of.total);
  if (!cuenta.alcanza) {
    rechazarSita(s);
    return false;
  }
  if (cuenta.usaAdelanto && adelantar(s, of.total)) {
    rechazarSita(s);
    return false;
  }
  const antes = s.pedidos.length;
  const err = aceptarSita(s);
  return !err && s.pedidos.length > antes;
}

function jugarNovato(seed: number, cupo = 4) {
  const s = nueva(seed);
  firmar(s);
  for (const c of s.candidatos.slice(0, cupo)) contratar(s, c.id);
  for (const g of s.gente) asignar(s, g.id, "obra");
  s.jugador = { x: 19, y: 14.5 };
  s.tut.fin = true;
  let guard = 0;
  let urgentes = 0;
  while (!s.entregada && guard < 60000) {
    guard++;
    if (s.panel === "sello") continuarSello(s);
    if (s.panel === "nomina") confirmarNomina(s, true);
    if (s.panel === "finde") {
      let n = 0;
      while (cajaLibre(s) < 5000 && n < 4 && adelantar(s) === null) n++;
      aliviarNomina(s);
      siguienteDia(s);
    }
    if (`${s.panel}` === "perdida") break;
    if (s.sita?.oferta) {
      const antes = s.pedidos.length;
      const ok = aceptarSiAlcanza(s);
      if (ok && s.pedidos.length > antes && s.pedidos[s.pedidos.length - 1]?.urgente) urgentes += 1;
    }
    if (s.panel && s.panel !== "informe") s.panel = null;
    if (s.entregada) break;
    if (s.minuto < 15 * 60 && (s.minuto % 15 === 0 || laborCambia(s))) gestionar(s, false, cupo);
    if (s.minuto < 7 * 60 + 8) silenciar(s);
    if ((s.plomo || (s.curando && !s.regadoHoy && s.curadoDias.length < 7)) && s.minuto < 17 * 60) {
      s.jugador = { x: 19, y: 14.5 };
      golpe(s, true);
    }
    if (s.minuto % 5 === 0 && s.minuto < 15 * 60) {
      s.jugador = { x: 19, y: 14.5 };
      golpe(s, false);
    }
    tick(s, 0.2);
    if (s.sita?.oferta) {
      const antes = s.pedidos.length;
      const ok = aceptarSiAlcanza(s);
      if (ok && s.pedidos.length > antes && s.pedidos[s.pedidos.length - 1]?.urgente) urgentes += 1;
    }
    if (ver(s) === "sello") continue;
    if (s.minuto >= 15 * 60 + 8 && s.nominaPagada && !s.panel) {
      const c = cuelloLabor(s);
      const muro = s.etapa === 4 && s.blocksHoy >= 180;
      if (c.includes("fragua") || c.includes("Fragua") || c.includes("hiladas") || muro || (c.includes("Curado") && s.etapa >= 7)) {
        terminarJornada(s);
      }
    }
  }
  return { s, guard, inf: informe(s), urgentes };
}

function puedeBatir(s: Estado): boolean {
  if (s.mezclas.some((m) => !m.lista)) return true;
  if (s.etapa < 3 || s.etapa > 7) return false;
  const h =
    s.inv.cemento.q >= RECETA_H.cemento - 1e-6 &&
    s.inv.arena.q >= RECETA_H.arena - 1e-6 &&
    s.inv.grava.q >= RECETA_H.grava - 1e-6 &&
    s.inv.agua.q >= RECETA_H.agua - 1e-6;
  const m =
    s.inv.cemento.q >= RECETA_M.cemento - 1e-6 &&
    s.inv.arena.q >= RECETA_M.arena - 1e-6 &&
    s.inv.agua.q >= RECETA_M.agua - 1e-6;
  if (s.etapa === 4) return m || h;
  return h || (s.etapa >= 4 && m);
}

function laborCambia(s: Estado): boolean {
  const vivos = s.gente.filter((g) => g.activo && !g.falto && !g.fuera);
  const acarreo = vivos.filter((g) => g.puesto === "acarreo").length;
  const batea = vivos.filter((g) => g.puesto === "batea").length;
  if (puedeBatir(s)) return batea < 1;
  if (hayCarga(s)) return acarreo < 1;
  return false;
}

function pedirSiPuede(s: Estado, items: Record<string, number | undefined>) {
  if (!Object.keys(items).length) return;
  const total = costoDe(items);
  let err = pedir(s, items, false);
  if (err && err.includes("nómina") && puedeAdelantar(s, total)) {
    adelantar(s, total);
    err = pedir(s, items, false);
  }
  if (err && err.includes("nómina")) {
    const keys = Object.keys(items) as (keyof typeof items)[];
    const half: typeof items = {};
    for (const k of keys) half[k] = Math.max(MATERIALES_PASO(k), (items[k] ?? 0) / 2);
    pedir(s, half, false);
  }
}

function gestionar(s: Estado, conPedido: boolean, cupo = 4, tambienSiguiente = true, unSoloTrompo = false) {
  for (const c of [...s.candidatos]) {
    if (s.gente.length + s.reserva.length >= cupo) break;
    const err = contratar(s, c.id);
    if (err) break;
  }
  const vivos = s.gente.filter((g) => g.activo && !g.falto && !g.fuera);
  const batir = puedeBatir(s);
  const carga = hayCarga(s);
  const maxBatea = batir ? (unSoloTrompo && carga ? 1 : 2) : 0;
  const maxAcarreo = carga ? 2 : 0;
  let batea = 0;
  let acarreo = 0;
  for (const g of vivos) {
    let puesto: Puesto = "obra";
    if ((g.oficio === "peon" || g.oficio === "ayudante") && batea < maxBatea) {
      puesto = "batea";
      batea++;
    } else if ((g.oficio === "peon" || g.oficio === "ayudante") && acarreo < maxAcarreo) {
      puesto = "acarreo";
      acarreo++;
    }
    if (g.oficio === "albanil" || g.oficio === "varillero" || g.oficio === "carpintero") puesto = "obra";
    asignar(s, g.id, puesto);
  }
  if (conPedido) {
    pedirSiPuede(s, loQueFalta(s));
    if (tambienSiguiente) pedirSiPuede(s, loQueFaltaSiguiente(s));
  }
  if (s.curando && s.curadoDias.length < 7 && s.etapa >= 8) {
    for (const g of s.gente) marcarLibre(s, g.id, true);
  }
}

function pesosFirmados(s: Estado): number {
  let sum = 0;
  const re = /([+\u2212-])P\$([\d,]+)/g;
  for (const l of s.diario) {
    if (l.texto.startsWith("Ojo:")) continue;
    for (const m of l.texto.matchAll(re)) {
      const n = Number(m[2]!.replace(/,/g, ""));
      sum += m[1] === "+" ? n : -n;
    }
  }
  return sum;
}

function jugarQuieto(seed: number) {
  const s = nueva(seed);
  firmar(s);
  for (const c of s.candidatos.slice(0, 4)) contratar(s, c.id);
  for (const g of [...s.gente, ...s.reserva]) g.puesto = null;
  s.jugador = { x: 19, y: 14.5 };
  s.tut.fin = true;
  let guard = 0;
  while (!s.entregada && s.dia <= 40 && guard < 90000) {
    guard++;
    if (s.panel === "sello") continuarSello(s);
    if (s.panel === "nomina") confirmarNomina(s, true);
    if (s.panel === "finde") {
      if (cajaLibre(s) < 5000) adelantar(s);
      siguienteDia(s);
    }
    if (`${s.panel}` === "perdida") break;
    if (s.sita?.oferta) aceptarSiAlcanza(s);
    if (s.panel && s.panel !== "informe" && `${s.panel}` !== "perdida") s.panel = null;
    if (s.entregada || `${s.panel}` === "perdida") break;
    tick(s, 0.2);
  }
  return { s, guard, inf: informe(s) };
}

function jugarPasivo(seed: number) {
  const s = nueva(seed);
  firmar(s);
  for (const id of s.candidatos.slice(0, 3).map((c) => c.id)) contratar(s, id);
  for (const g of [...s.gente, ...s.reserva]) g.puesto = null;
  s.jugador = { x: 19, y: 14.5 };
  s.tut.fin = true;
  s.panel = null;
  let guard = 0;
  while (!s.entregada && `${s.panel}` !== "perdida" && s.dia <= 45 && guard < 90000) {
    guard++;
    if (s.panel === "sello") continuarSello(s);
    if (s.panel === "nomina") confirmarNomina(s, true);
    if (s.panel === "finde") siguienteDia(s);
    if (`${s.panel}` === "perdida") break;
    if (s.sita?.oferta) aceptarSiAlcanza(s);
    if (s.panel && s.panel !== "informe" && `${s.panel}` !== "perdida") s.panel = null;
    if (s.entregada || `${s.panel}` === "perdida") break;
    tick(s, 0.2);
  }
  return { s, inf: informe(s) };
}

function pedirAtento(s: Estado) {
  const items = loQueFalta(s);
  if (!Object.keys(items).length) return;
  const mats = costoDe(items) - FLETE;
  const urgente = s.minuto < 12 * 60 && mats >= 2500;
  const total = costoDe(items) + (urgente ? FLETE_URGENTE - FLETE : 0);
  let err = pedir(s, items, urgente);
  if (err && /12/.test(err)) err = pedir(s, items, false);
  if (err && err.includes("nómina") && puedeAdelantar(s, total)) {
    adelantar(s, total);
    err = pedir(s, items, urgente);
    if (err && /12/.test(err)) err = pedir(s, items, false);
  }
  if (err && err.includes("nómina")) {
    const keys = Object.keys(items) as (keyof typeof items)[];
    const half: typeof items = {};
    for (const k of keys) half[k] = Math.max(MATERIALES_PASO(k), (items[k] ?? 0) / 2);
    err = pedir(s, half, urgente && s.minuto < 12 * 60);
  }
}

function aceptarActual(s: Estado): boolean {
  const of = s.sita?.oferta;
  if (!of) return false;
  const hay = (c?: Record<string, number | undefined>) => !!c && Object.values(c).some((n) => (n ?? 0) > 1e-6);
  if (!hay(of.items)) {
    rechazarSita(s);
    return false;
  }
  const cuenta = cuentaPedido(s, of.total);
  if (!cuenta.alcanza) {
    rechazarSita(s);
    return false;
  }
  if (cuenta.usaAdelanto && adelantar(s, of.total)) {
    rechazarSita(s);
    return false;
  }
  const antes = s.pedidos.length;
  const err = aceptarSita(s);
  return !err && s.pedidos.length > antes;
}

function jugarAtento(seed: number, cupo: number) {
  const s = nueva(seed);
  firmar(s);
  const cuadrilla =
    cupo === 4
      ? [
          ...s.candidatos.filter((c) => c.oficio === "albanil").slice(0, 2),
          ...s.candidatos.filter((c) => c.oficio !== "albanil"),
        ].slice(0, 4)
      : s.candidatos.slice(0, cupo);
  for (const c of cuadrilla) contratar(s, c.id);
  for (const g of s.gente) asignar(s, g.id, "obra");
  s.jugador = { x: SITIOS.obra.x, y: SITIOS.obra.y };
  s.destino = null;
  s.tut.fin = true;
  let guard = 0;
  let pedidoClave = "";
  let ultimoGolpe = -1;
  let diaMuros = 0;
  let diaBlock = 0;
  while (!s.entregada && guard < 80000) {
    guard++;
    if (s.etapa >= 5 && !diaMuros) diaMuros = s.dia;
    if (s.panel === "sello") continuarSello(s);
    if (s.panel === "nomina") confirmarNomina(s, true);
    if (s.etapa >= 5 && !diaMuros) diaMuros = s.dia;
    if (s.panel === "finde") {
      let n = 0;
      while (cajaLibre(s) < 5000 && n < 4 && adelantar(s) === null) n++;
      aliviarNomina(s);
      siguienteDia(s);
      pedidoClave = "";
    }
    if (`${s.panel}` === "perdida") break;
    if (s.sita?.oferta) aceptarActual(s);
    if (s.panel && s.panel !== "informe") s.panel = null;
    if (s.entregada) break;
    s.jugador = { x: SITIOS.obra.x, y: SITIOS.obra.y };
    s.destino = null;
    const clave = `${s.dia}:${s.etapa}`;
    const pide = clave !== pedidoClave && s.minuto >= 7 * 60 && s.minuto < 15 * 60 && Object.keys(loQueFalta(s)).length > 0;
    if (pide) {
      pedirAtento(s);
      const sig = loQueFaltaSiguiente(s);
      if (Object.keys(sig).length) pedirSiPuede(s, sig);
      pedidoClave = clave;
    }
    if (s.minuto < 15 * 60 && (s.minuto % 15 === 0 || laborCambia(s))) gestionar(s, false, cupo, false, true);
    if (s.minuto < 7 * 60 + 8) silenciar(s);
    let yaGolpe = false;
    if (s.plomo && s.minuto < 17 * 60) {
      golpe(s, true);
      yaGolpe = true;
      ultimoGolpe = s.minuto;
    }
    if (!yaGolpe && s.minuto % 5 === 0 && s.minuto !== ultimoGolpe && s.minuto < 15 * 60) {
      ultimoGolpe = s.minuto;
      golpe(s, false);
    }
    tick(s, 0.2);
    if (!diaBlock) {
      const hecho = s.runs[4]?.find((r) => r.id === "block")?.hecho ?? 0;
      if (hecho >= BLOCKS_MURO - 1) diaBlock = s.dia;
    }
    if (ver(s) === "sello") continue;
    if (s.minuto >= 15 * 60 + 8 && s.nominaPagada && !s.panel) {
      const c = cuelloLabor(s);
      const muro = s.etapa === 4 && s.blocksHoy >= 180;
      if (c.includes("fragua") || c.includes("Fragua") || c.includes("hiladas") || muro || (c.includes("Curado") && s.etapa >= 7)) {
        terminarJornada(s);
      }
    }
  }
  if (s.etapa >= 5 && !diaMuros) diaMuros = s.dia;
  return { s, guard, inf: informe(s), diaMuros, diaBlock };
}

function filaAtento(seed: number, r: ReturnType<typeof jugarAtento>) {
  const entregada = r.s.entregada;
  const perdida = r.s.panel === "perdida";
  return {
    semilla: seed,
    entregada,
    diaMuros: r.diaMuros,
    diaBlock: r.diaBlock,
    diaEntrega: entregada ? r.s.dia : null,
    ganancia: Math.round(r.inf.ganancia),
    diaPerdida: perdida ? r.s.dia : null,
  };
}

function mediana10(xs: number[]): number {
  const o = [...xs].sort((a, b) => a - b);
  return (o[4]! + o[5]!) / 2;
}

function reporteMuerto(nombre: string, runs: { s: Estado; inf: ReturnType<typeof informe> }[]) {
  const claves = new Map<string, string>();
  for (const r of runs) for (const p of partesMuerto(r.s)) claves.set(p.id, p.nombre);
  const causas = [...claves.entries()].map(([id, nom]) => {
    const horas = runs.map((r) => (partesMuerto(r.s).find((p) => p.id === id)?.min ?? 0) / 60);
    const pesos = runs.map((r) => partesMuerto(r.s).find((p) => p.id === id)?.pesos ?? 0);
    return { id, nom, h: Math.round(mediana10(horas) * 10) / 10, pesos: Math.round(mediana10(pesos)) };
  });
  const linea = {
    nombre,
    entregadas: runs.filter((r) => r.s.entregada).length,
    perdidas: runs.filter((r) => r.s.panel === "perdida").length,
    dias: mediana10(runs.map((r) => r.s.dia)),
    diasTrabajados: mediana10(runs.map((r) => r.s.diasTrabajados)),
    muerto: Math.round(mediana10(runs.map((r) => r.s.costos.muerto.mo))),
    causas,
  };
  console.log("MUERTO10", JSON.stringify(linea));
  return linea;
}

function costoDe(items: Record<string, number | undefined>): number {
  let mats = 0;
  for (const [k, n] of Object.entries(items)) mats += (n ?? 0) * MATERIALES[k as keyof typeof MATERIALES].precio;
  return mats + FLETE;
}

function MATERIALES_PASO(k: string): number {
  if (k === "arena" || k === "grava" || k === "agua") return 0.5;
  if (k === "block") return 10;
  return 1;
}

describe("obra", () => {
  it("¡Dale! en la obra sigue contando el compás", () => {
    const s = nueva(3);
    firmar(s);
    s.jugador = { x: 19, y: 14.5 };
    s.panel = null;
    let n = 0;
    for (let i = 0; i < 6; i++) {
      const f = golpe(s, true);
      assert.ok(f, "golpe");
      n += 1;
    }
    assert.equal(n, 6);
    assert.equal(s.stats.compas, 6);
    assert.equal(s.panel, null);
  });

  it("un pedido no usa la nómina", () => {
    const s = nueva(2);
    firmar(s);
    for (const c of [...s.candidatos]) contratar(s, c.id);
    const libre = cajaLibre(s);
    assert.ok(nominaPendiente(s) > 0);
    assert.ok(libre < s.caja);
    const err = pedir(s, { cemento: 400 }, false);
    assert.ok(err);
    assert.equal(s.pedidos.length, 0);
    assert.ok(s.caja > nominaPendiente(s));
  });

  it("el cansancio alto no cobra mañana", () => {
    const s = nueva(5);
    firmar(s);
    const c = s.candidatos[0]!;
    contratar(s, c.id);
    const g = s.gente[0]!;
    g.cansancio = 90;
    terminarJornada(s);
    assert.equal(s.panel, "finde");
    const caja = s.caja;
    siguienteDia(s);
    const mismo = s.gente.find((p) => p.id === g.id)!;
    assert.equal(mismo.activo, false);
    assert.equal(mismo.falto, true);
    assert.ok(s.stats.faltas >= 1);
    // no cobró el día que faltó: la caja no baja por su jornal al amanecer
    assert.ok(s.caja <= caja);
    tick(s, 0.2);
    assert.equal(mismo.moHoy, 0);
  });

  it("la tanda de hormigón se vence a los 90 min", () => {
    const s = nueva(1);
    firmar(s);
    s.panel = null;
    s.etapa = 3;
    s.inv.cemento = { q: 5, valor: 2750 };
    s.inv.arena = { q: 1, valor: 0 };
    s.inv.grava = { q: 1, valor: 0 };
    s.inv.agua = { q: 1, valor: 0 };
    s.jugador = { x: SITIOS.batea.x, y: SITIOS.batea.y };
    const peon = s.candidatos[0]!;
    contratar(s, peon.id);
    asignar(s, peon.id, "sombra");
    // 10 golpes de +10% completan la tanda, el 10º la deja lista
    for (let i = 0; i < 12; i++) golpe(s, false);
    const lista = s.mezclas.find((m) => m.lista && m.tipo === "H");
    assert.ok(lista, "debía quedar lista");
    assert.equal(lista!.vida, 90);
    for (let i = 0; i < 200; i++) tick(s, 0.1);
    assert.ok(s.stats.tandasPerdidas > 0.5);
    assert.ok(s.avisos.some((a) => a.texto.includes("venció") || a.texto.includes("hormigón")));
  });

  it("libreta e informe coinciden", () => {
    const s = nueva(4);
    firmar(s);
    for (const c of [...s.candidatos]) contratar(s, c.id);
    tick(s, 2);
    const a = libreta(s);
    const b = informe(s);
    assert.equal(Math.round(a.costo), Math.round(b.costo));
    assert.equal(Math.round(a.ganancia), Math.round(b.ganancia));
    const suma = a.filas.reduce((n, f) => n + f.real, 0);
    assert.ok(Math.abs(suma - a.costo) < 0.01);
  });

  it("guardado inválido no pasa", () => {
    assert.equal(validar(null), false);
    assert.equal(validar({ v: 2 }), false);
    assert.equal(validar(nueva(1)), true);
  });

  it("almacén separa reservado y apostable", () => {
    const s = nueva(1);
    firmar(s);
    s.inv.block = { q: 100, valor: 5540 };
    const a = almacen(s);
    const block = a.filas.find((f) => f.clave === "block");
    assert.ok(block);
    assert.ok(block!.reservado <= block!.en);
    assert.ok(a.apostable <= 20000);
    assert.ok(a.apostable <= a.valorLibre * 0.25 + 0.01);
  });

  it("se termina la caseta con dos albañiles y ganancia", () => {
    const r = jugarAtento(2, 4);
    assert.equal(r.s.entregada, true);
    assert.ok(r.s.dia >= 12 && r.s.dia <= 24, "dia " + r.s.dia);
    assert.equal(r.s.stats.sellos >= 9, true);
    const block = r.inf.filas.find((f) => f.partida === "block");
    const puestos = r.s.runs[4]?.find((x) => x.id === "block")?.hecho ?? 0;
    assert.ok(puestos >= 468, "blocks " + puestos);
    assert.ok(block && block.real > 37000 && block.real < 56000, "block " + block?.real);
    assert.ok(r.inf.ganancia > 30000, "ganancia " + r.inf.ganancia);
  });

  it("rechaza un guardado incompleto", () => {
    const s = nueva(1);
    const inv = structuredClone(s);
    inv.inv = {} as Estado["inv"];
    assert.equal(validar(inv), false);
    const gente = structuredClone(s);
    gente.gente = [{}] as Estado["gente"];
    assert.equal(validar(gente), false);
    const stats = structuredClone(s);
    stats.stats = {} as Estado["stats"];
    assert.equal(validar(stats), false);
  });

  it("el día 1 no salta de etapa y estima unos cien mil", () => {
    const s = nueva(1);
    firmar(s);
    const q = loQueFalta(s);
    assert.equal(q.v38, undefined);
    assert.equal(q.v14, undefined);
    assert.equal(q.alambre, undefined);
    assert.equal(q.plywood, undefined);
    assert.equal(q.block, undefined);
    const sig = loQueFaltaSiguiente(s);
    assert.equal(sig.v38, undefined);
    assert.equal(sig.plywood, undefined);
    assert.equal(sig.block, undefined);
    const lib = libreta(s);
    assert.ok(lib.ganancia > 90000 && lib.ganancia < 110000, String(lib.ganancia));
    const sinEmpezar = lib.filas.filter((f) => f.real < 1 && f.pre > 0);
    assert.ok(sinEmpezar.length > 0);
  });

  it("el adelanto usa la caja libre, no la caja", () => {
    const s = nueva(1);
    firmar(s);
    for (const c of [...s.candidatos]) contratar(s, c.id);
    const nom = nominaPendiente(s);
    s.caja = 8000;
    s.etapa = 2;
    assert.ok(nom > 3000, "nómina " + nom);
    assert.ok(s.caja >= 5000);
    assert.ok(cajaLibre(s) < 5000, "libre " + cajaLibre(s));
    const antes = s.caja;
    assert.equal(adelantar(s), null);
    assert.ok(s.caja > antes);
    s.caja = nominaPendiente(s) + 6000;
    const no = adelantar(s);
    assert.ok(no && no.includes("5,000"));
  });

  it("con la caja en rojo sale un solo adelanto por día", () => {
    const s = nueva(1);
    firmar(s);
    for (const c of [...s.candidatos]) contratar(s, c.id);
    s.caja = -40000;
    s.etapa = 2;
    assert.equal(puedeAdelantar(s), true);
    assert.equal(adelantar(s), null);
    const caja = s.caja;
    const cobrado = s.cobrado;
    const lineas = s.diario.filter((d) => d.texto.startsWith("Adelanto de Doña Carmen"));
    assert.equal(lineas.length, 1);
    assert.match(lineas[0]!.texto, /\+P\$/);
    assert.equal(puedeAdelantar(s), false);
    const otra = adelantar(s);
    assert.ok(otra && otra.includes("hoy"), otra ?? "");
    assert.equal(s.caja, caja);
    assert.equal(s.cobrado, cobrado);
    s.dia += 1;
    assert.equal(puedeAdelantar(s), true);
    assert.equal(adelantar(s), null);
    assert.equal(s.diario.filter((d) => d.texto.startsWith("Adelanto de Doña Carmen")).length, 2);
  });

  it("auto-tarea: prioridad, sin zona y sin espera", () => {
    const dBatea = Math.hypot(SITIOS.batea.x - SITIOS.obra.x, SITIOS.batea.y - SITIOS.obra.y);
    const dToma = Math.hypot(SITIOS.toma.x - SITIOS.obra.x, SITIOS.toma.y - SITIOS.obra.y);
    assert.ok(Math.abs(dBatea / 0.56 - 5) < 0.8, "batea min " + dBatea / 0.56);
    assert.ok(Math.abs(dToma / 0.56 - 10) < 0.8, "tanque min " + dToma / 0.56);
    assert.equal(SITIOS.entrada.x, 12.4);
    assert.equal(SITIOS.almacen.x, 4.5);

    const s = nueva(1);
    firmar(s);
    s.panel = null;
    s.lluvias = [];
    s.minuto = 8 * 60;
    for (const c of [...s.candidatos]) contratar(s, c.id);
    for (const g of s.gente) g.puesto = null;
    const fefa = s.gente.find((g) => g.nombre === "Fefa")!;
    const lalo = s.gente.find((g) => g.nombre === "Lalo")!;
    const tono = s.gente.find((g) => g.nombre === "Toño")!;
    asignar(s, fefa.id, "sombra");
    asignar(s, lalo.id, "acarreo");
    lalo.x = SITIOS.entrada.x;
    lalo.y = SITIOS.entrada.y;
    lalo.esperaZona = 0;
    s.inv.agua.q = 0.4;
    s.cargas = [];
    s.entrada = {};
    s.etapa = 3;
    s.mezclas = [{ tipo: "H", prog: 0.2, lista: false, vida: 0, costo: 100, restante: 1 }];
    const dTomaLalo = Math.hypot(lalo.x - SITIOS.toma.x, lalo.y - SITIOS.toma.y);
    const dBateaLalo = Math.hypot(lalo.x - SITIOS.batea.x, lalo.y - SITIOS.batea.y);
    assert.ok(dBateaLalo > dTomaLalo, "la batea queda más lejos que la toma");
    assert.equal(laborDe(s, lalo), "batea");
    assert.equal(lineaFicha(s, lalo), "Lalo (Acarreo) · batiendo");
    assert.equal(lalo.puesto, "acarreo");

    asignar(s, fefa.id, "batea");
    fefa.x = SITIOS.batea.x;
    fefa.y = SITIOS.batea.y;
    assert.equal(laborDe(s, fefa), "batea");
    assert.equal(laborDe(s, lalo), "agua");
    assert.equal(lineaFicha(s, lalo), "Lalo (Acarreo) · buscando agua");
    s.cargas.push({ id: "cam", tipo: "cemento", items: { cemento: 1 }, prog: 0 });
    s.entrada.cemento = { q: 1, valor: 550 };
    assert.equal(laborDe(s, lalo), "acarreo");
    assert.equal(lineaFicha(s, lalo), null);

    s.cargas = [];
    s.entrada = {};
    s.inv.agua.q = 0.4;
    s.mezclas = [];
    s.inv.cemento = { q: 0, valor: 0 };
    s.inv.arena = { q: 0, valor: 0 };
    s.inv.grava = { q: 0, valor: 0 };
    assert.equal(laborDe(s, fefa), "agua");
    assert.equal(lineaFicha(s, fefa), "Fefa (Trompo) · buscando agua");
    assert.notEqual(laborDe(s, fefa), "acarreo");

    s.inv.agua.q = 1.2;
    s.inv.cemento = { q: 8, valor: 0 };
    s.inv.arena = { q: 2, valor: 0 };
    s.inv.grava = { q: 2, valor: 0 };
    s.mezclas = [{ tipo: "H", prog: 0.3, lista: false, vida: 0, costo: 100, restante: 1 }];
    asignar(s, tono.id, "obra");
    tono.x = SITIOS.obra.x;
    tono.y = SITIOS.obra.y;
    tono.esperaZona = 0;
    assert.equal(laborDe(s, tono), "batea");
    assert.equal(tono.puesto, "obra");
    assert.match(lineaFicha(s, tono) ?? "", /Toño \(Obra\) · batiendo/);
    s.mezclas = [{ tipo: "H", prog: 1, lista: true, vida: 90, costo: 100, restante: 1 }];
    assert.equal(laborDe(s, tono), "obra");
    assert.equal(lineaFicha(s, tono), null);

    const quieto = nueva(2);
    firmar(quieto);
    quieto.panel = null;
    quieto.lluvias = [];
    quieto.tut.fin = true;
    quieto.minuto = 8 * 60;
    const idS = quieto.candidatos[0]!.id;
    const idN = quieto.candidatos[1]!.id;
    contratar(quieto, idS);
    contratar(quieto, idN);
    const sombra = quieto.gente.find((g) => g.id === idS)!;
    const suelto = quieto.gente.find((g) => g.id === idN)!;
    asignar(quieto, sombra.id, "sombra");
    suelto.puesto = null;
    sombra.x = SITIOS.sombra.x + 0.48;
    sombra.y = SITIOS.sombra.y;
    suelto.x = 10;
    suelto.y = 10;
    const sx = sombra.x;
    const sy = sombra.y;
    const nx = suelto.x;
    const ny = suelto.y;
    for (let i = 0; i < 40; i++) {
      if (quieto.panel) quieto.panel = null;
      tick(quieto, 0.2);
    }
    assert.ok(Math.hypot(sombra.x - sx, sombra.y - sy) < 0.05, "sombra se movió");
    assert.ok(Math.hypot(suelto.x - nx, suelto.y - ny) < 0.05, "sin puesto se movió");
    assert.equal(sombra.puesto, "sombra");
    assert.equal(suelto.puesto, null);

    asignar(s, lalo.id, "obra");
    s.etapa = 1;
    s.minuto = 8 * 60;
    s.panel = null;
    s.mezclas = [];
    s.cargas = [];
    s.entrada = {};
    s.inv.agua.q = 1.2;
    assert.equal(lalo.puesto, "obra");
    assert.equal(laborDe(s, lalo), "obra");
    const dest = ancla(s, lalo);
    assert.ok(dest && dest.x >= 16 && dest.x <= 22, JSON.stringify(dest));
  });

  it("golpe del maestro: 15 minutos, plomo y el que pega no lo recibe", () => {
    const armar = () => {
      const s = nueva(1);
      firmar(s);
      s.panel = null;
      s.lluvias = [];
      s.lluviaOn = false;
      s.minuto = 8 * 60;
      s.tut.fin = true;
      s.sinGolpe = 0;
      const id = s.candidatos[0]!.id;
      contratar(s, id);
      asignar(s, id, "obra");
      const g = s.gente[0]!;
      const puesto = ancla(s, g);
      if (puesto) {
        g.x = puesto.x;
        g.y = puesto.y;
      }
      s.jugador = { x: 19, y: 14.5 };
      return s;
    };
    const pasoLimpio = (s: Estado) => {
      avanzarMinutos(s, 1);
      if (s.panel && s.panel !== "perdida") s.panel = null;
    };

    const quieto = armar();
    for (let i = 0; i < 60; i++) pasoLimpio(quieto);
    assert.ok((quieto.stats.golpesAuto ?? 0) >= 3, "sin pegar " + quieto.stats.golpesAuto);
    assert.ok(quieto.gritos.length === 0 || quieto.gritos.every((g) => g.texto === "El maestro lo dijo"));

    const ritmo = armar();
    for (let i = 0; i < 60; i++) {
      if (i % 5 === 0) {
        ritmo.jugador = { x: 19, y: 14.5 };
        golpe(ritmo, false);
      }
      pasoLimpio(ritmo);
    }
    assert.equal(ritmo.stats.golpesAuto ?? 0, 0);

    const plomo = armar();
    plomo.plomo = { umbral: 3 * POR_HILADA, min: 0 };
    plomo.sinGolpe = 0;
    for (let i = 0; i < 14; i++) pasoLimpio(plomo);
    assert.ok(plomo.plomo, "el plomo aguanta 14 minutos");
    pasoLimpio(plomo);
    assert.equal(plomo.plomo, null);
    assert.ok(plomo.plumbed.some((p) => Math.abs(p - 3 * POR_HILADA) < 1e-3));
    assert.ok((plomo.stats.golpesAuto ?? 0) >= 1);

    const suelto = nueva(1);
    firmar(suelto);
    suelto.panel = null;
    suelto.lluvias = [];
    suelto.minuto = 8 * 60;
    suelto.tut.fin = true;
    contratar(suelto, suelto.candidatos[0]!.id);
    for (const g of [...suelto.gente, ...suelto.reserva]) g.puesto = null;
    for (let i = 0; i < 40; i++) {
      avanzarMinutos(suelto, 1);
      if (suelto.panel) suelto.panel = null;
    }
    assert.equal(suelto.stats.golpesAuto ?? 0, 0);

    const lejos = armar();
    lejos.jugador = { x: 4, y: 14.5 };
    lejos.runs[0]!.find((r) => r.id === "limpiar")!.hecho = 30;
    lejos.sinGolpe = 14;
    const rep = lejos.runs[0]!.find((r) => r.id === "replantear")!;
    const antes = rep.hecho;
    pasoLimpio(lejos);
    assert.ok(rep.hecho <= antes + 1e-6, "lejos no pega");
    assert.equal(lejos.stats.golpesAuto ?? 0, 0);
  });

  it("el golpe acelera como máximo un 25 % y pegar más no sube el tope", () => {
    const hechoDe = (s: Estado) => s.runs[0]!.find((r) => r.id === "limpiar")!.hecho;
    const armar = () => {
      const s = nueva(1);
      firmar(s);
      s.panel = null;
      s.lluvias = [];
      s.minuto = 8 * 60;
      s.tut.fin = true;
      s.sinGolpe = 0;
      const id = s.candidatos.find((c) => c.oficio === "peon")!.id;
      contratar(s, id);
      asignar(s, id, "obra");
      const g = s.gente[0]!;
      const puesto = ancla(s, g);
      assert.ok(puesto);
      g.x = puesto.x;
      g.y = puesto.y;
      s.jugador = { x: SITIOS.obra.x, y: SITIOS.obra.y };
      return s;
    };
    const correr = (s: Estado, cada: number) => {
      for (let i = 0; i < 60; i++) {
        avanzarMinutos(s, 1);
        if (s.panel && s.panel !== "perdida") s.panel = null;
        if (cada > 0 && (i % cada === cada - 1 || i === 59)) golpe(s, false);
      }
    };
    const quieto = armar();
    quieto.jugador = { x: 2, y: 2 };
    correr(quieto, 0);
    const seguido = armar();
    correr(seguido, 1);
    const rato = armar();
    correr(rato, 15);
    const spam = armar();
    for (let i = 0; i < 60; i++) {
      avanzarMinutos(spam, 1);
      if (spam.panel && spam.panel !== "perdida") spam.panel = null;
      for (let k = 0; k < 8; k++) golpe(spam, true);
    }
    const base = hechoDe(quieto);
    const extraSeguido = hechoDe(seguido) - base;
    const extraRato = hechoDe(rato) - base;
    const extraSpam = hechoDe(spam) - base;
    assert.ok(base > 1, "el peón limpió " + base);
    assert.ok(extraSeguido > 0, "el golpe no aceleró");
    assert.ok(extraSeguido <= base * 0.25 + 0.02, `extra ${extraSeguido} sobre ${base}`);
    assert.ok(extraRato <= base * 0.25 + 0.02, `rato ${extraRato} sobre ${base}`);
    assert.ok(extraSpam <= base * 0.25 + 0.02, `spam ${extraSpam} sobre ${base}`);
    assert.ok(Math.abs(extraSeguido - extraRato) < 0.05, `seguido ${extraSeguido} rato ${extraRato}`);
    assert.ok(Math.abs(extraSeguido - extraSpam) < 0.05, `seguido ${extraSeguido} spam ${extraSpam}`);

    const solo = armar();
    for (const g of solo.gente) {
      g.puesto = null;
      g.trabajando = false;
    }
    const antes = hechoDe(solo);
    for (let i = 0; i < 10; i++) golpe(solo, true);
    assert.ok(hechoDe(solo) <= antes + 1e-6, "sin oficio el golpe avanzó");
  });

  it("el adelanto cabe en lo avanzado, con tope de P$20,000", () => {
    const s = nueva(1);
    firmar(s);
    s.caja = -1000;
    s.adelantoDia = 0;
    const parado = adelantar(s);
    assert.ok(parado && parado.includes("avanzado"), parado ?? "");
    s.etapa = 2;
    const montos: number[] = [];
    for (let i = 0; i < 4; i++) {
      s.caja = -1000;
      s.dia = i + 2;
      s.adelantoDia = 0;
      const antes = s.cobrado;
      const err = adelantar(s);
      if (err) break;
      montos.push(s.cobrado - antes);
    }
    assert.deepEqual(montos, [20000, 20000, 5000]);
    s.caja = -1000;
    s.dia = 8;
    s.adelantoDia = 0;
    const no = adelantar(s);
    assert.ok(no && no.includes("avanzado"), no ?? "");
  });

  it("del día 1 al 2 cada peso de la caja está en el Diario", () => {
    const s = nueva(1);
    firmar(s);
    for (const c of [...s.candidatos]) contratar(s, c.id);
    for (const g of s.gente) asignar(s, g.id, "obra");
    s.panel = null;
    s.tut.fin = true;
    const q = loQueFalta(s);
    const pidio = pedir(s, q, false);
    let guard = 0;
    while (s.dia === 1 && s.panel !== "finde" && !s.entregada && guard < 8000) {
      guard++;
      if (s.panel === "sello") continuarSello(s);
    if (s.panel === "nomina") confirmarNomina(s, true);
      if (s.sita?.oferta) aceptarSita(s);
      if (s.panel && s.panel !== "finde" && s.panel !== "informe") s.panel = null;
      tick(s, 0.2);
    }
    assert.equal(s.panel, "finde", "panel " + s.panel + " min " + s.minuto);
    assert.ok(s.diario.some((d) => d.texto.startsWith("Anticipo de Doña Carmen: +")));
    assert.ok(s.diario.some((d) => d.texto.startsWith("Kit de replanteo: −")));
    assert.ok(s.diario.some((d) => d.texto.startsWith("Nómina: −") && d.texto.includes("Herramienta: −")));
    assert.ok(s.diario.some((d) => d.texto.startsWith("Dirección del día: −")));
    if (pidio == null) assert.ok(s.diario.some((d) => d.texto.startsWith("Pedido a la ferretería: −")));
    const cajaNoche = s.caja;
    const descuadre = Math.abs(pesosFirmados(s) - cajaNoche);
    assert.ok(descuadre < 1.5, `diario ${pesosFirmados(s)} caja ${cajaNoche}`);
    siguienteDia(s);
    assert.equal(s.dia, 2);
    assert.ok(Math.abs(s.caja - cajaNoche) < 0.01, "el amanecer no mueve la caja");
    assert.ok(Math.abs(pesosFirmados(s) - s.caja) < 1.5);
    console.log(
      "DIA1",
      JSON.stringify({
        pidio,
        caja: Math.round(cajaNoche),
        lineas: s.diario.filter((d) => /[+\u2212-]P\$/.test(d.texto)).map((d) => d.texto),
      }),
    );
  });

  it("sin puesto el tiempo muerto queda como sin tarea", () => {
    const s = nueva(1);
    firmar(s);
    assert.equal(contratar(s, s.candidatos[0]!.id), null);
    const peon = s.gente[0]!;
    assert.equal(peon.puesto, null);
    assert.equal(peon.cansancio, 0);
    s.panel = null;
    s.tut.fin = true;
    avanzarMinutos(s, 40);
    const partes = partesMuerto(s);
    const tarea = partes.find((p) => p.id === "tarea");
    assert.ok(tarea && tarea.min >= 35, JSON.stringify(partes));
    assert.equal(tarea!.dias.length, 1);
    assert.equal(tarea!.dias[0]!.dia, 1);
    const suma = partes.reduce((a, p) => a + p.pesos, 0);
    assert.ok(Math.abs(suma - s.costos.muerto.mo) < 0.05, `${suma} vs ${s.costos.muerto.mo}`);
    const inf = informe(s);
    assert.equal(inf.faltasLista.length, 0);
  });

  it("se pierde la obra si no hay caja, adelanto ni material", () => {
    const s = nueva(2);
    firmar(s);
    s.etapa = 4;
    s.caja = -10000;
    s.cobrado = CONTRATO;
    s.inv.block = { q: 0, valor: 0 };
    s.pedidos = [];
    s.panel = "finde";
    siguienteDia(s);
    assert.equal(s.panel, "perdida");
  });

  it("la arena del pedido cumple la guía y el plomo se alcanza junto al muro", () => {
    const s = nueva(3);
    firmar(s);
    s.panel = null;
    assert.equal(s.tut.arena, false);
    s.pedidos.push({ id: "p", items: { arena: 0.5, grava: 0.5 }, dia: s.dia, minuto: s.minuto, flete: 0, urgente: true });
    avanzarMinutos(s, 1);
    assert.equal(s.tut.arena, true);
    assert.ok(s.inv.arena.q >= 0.5);
    s.plomo = { umbral: 1, min: 0 };
    s.jugador = { x: 17.2, y: 13.2 };
    const a = accion(s);
    assert.equal(a.verbo, "Plomear");
  });

  it("una fracción de tanda pide la funda entera y pierde la obra", () => {
    const s = nueva(11);
    firmar(s);
    s.etapa = 7;
    s.panel = null;
    s.inv.cemento = { q: 0.25, valor: 137.5 };
    s.inv.arena = { q: 2, valor: 0 };
    s.inv.grava = { q: 2, valor: 0 };
    s.inv.agua = { q: 1, valor: 0 };
    s.inv.tierra = { q: 3, valor: 0 };
    s.runs[7]!.find((r) => r.id === "relleno")!.hecho = 2.2;
    s.runs[7]!.find((r) => r.id === "firme")!.hecho = 8 - 0.14;
    for (const c of [...s.candidatos]) contratar(s, c.id);
    for (const g of s.gente) asignar(s, g.id, "obra");
    s.jugador = { x: 19, y: 14.5 };
    const q = loQueFalta(s);
    assert.ok((q.cemento ?? 0) >= 1, "cemento " + JSON.stringify(q));
    assert.match(cuello(s), /Cemento/);
    assert.match(cuello(s), /Ferretería/);
    s.caja = -80;
    s.cobrado = CONTRATO;
    s.panel = "finde";
    siguienteDia(s);
    assert.equal(s.panel, "perdida");
  });

  it("la tanda que se bate no pide cemento de más", () => {
    const s = nueva(11);
    firmar(s);
    s.etapa = 7;
    s.panel = null;
    s.tut.fin = true;
    for (const c of [...s.candidatos]) contratar(s, c.id);
    for (const g of s.gente) asignar(s, g.id, "obra");
    s.jugador = { x: 19, y: 14.5 };
    s.inv.cemento = { q: 0.5, valor: 275 };
    s.inv.arena = { q: 2, valor: 0 };
    s.inv.grava = { q: 2, valor: 0 };
    s.inv.agua = { q: 1, valor: 0 };
    s.inv.tierra = { q: 3, valor: 0 };
    s.inv.abeto = { q: 20, valor: 0 };
    s.inv.pino = { q: 20, valor: 0 };
    s.inv.zinc = { q: 20, valor: 0 };
    s.inv.clavo = { q: 8, valor: 0 };
    s.inv.clavoTecho = { q: 8, valor: 0 };
    s.runs[7]!.find((r) => r.id === "relleno")!.hecho = 2.2;
    s.runs[7]!.find((r) => r.id === "firme")!.hecho = 8 - 0.35;
    s.mezclas.push({ tipo: "H", prog: 0.8, lista: false, vida: 0, costo: 550, restante: 1 });
    const q = loQueFalta(s);
    assert.equal(q.cemento, undefined, JSON.stringify(q));
    const cartel = cuello(s);
    assert.doesNotMatch(cartel, /p[ií]delo|p[ií]dela|pedir|ferreter[ií]a/i);
  });

  it("cemento, golpe, sello de reloj, ferretería y puesto al contratar", () => {
    const piso = (hecho: number, cemento: number) => {
      const s = nueva(11);
      firmar(s);
      s.etapa = 7;
      s.panel = null;
      s.tut.fin = true;
      s.lluvias = [];
      s.jugador = { x: 19, y: 14.5 };
      s.inv.cemento = { q: cemento, valor: cemento * 550 };
      s.inv.arena = { q: 2, valor: 0 };
      s.inv.grava = { q: 2, valor: 0 };
      s.inv.agua = { q: 1, valor: 0 };
      s.inv.tierra = { q: 3, valor: 0 };
      s.inv.abeto = { q: 20, valor: 0 };
      s.inv.pino = { q: 20, valor: 0 };
      s.inv.zinc = { q: 20, valor: 0 };
      s.inv.clavo = { q: 8, valor: 0 };
      s.inv.clavoTecho = { q: 8, valor: 0 };
      s.runs[7]!.find((r) => r.id === "relleno")!.hecho = 2.2;
      s.runs[7]!.find((r) => r.id === "firme")!.hecho = hecho;
      const alb = s.candidatos.find((c) => c.oficio === "albanil");
      const peon = s.candidatos.find((c) => c.oficio === "peon");
      if (alb) contratar(s, alb.id);
      if (peon) contratar(s, peon.id);
      for (const g of s.gente) {
        if (g.oficio === "albanil") asignar(s, g.id, "obra");
        if (g.oficio === "peon") {
          asignar(s, g.id, "batea");
          g.x = SITIOS.batea.x;
          g.y = SITIOS.batea.y;
        }
      }
      return s;
    };
    const pide = /p[ií]delo|p[ií]dela|pedir|ferreter[ií]a/i;
    const al20 = piso(7, 0);
    al20.mezclas.push({ tipo: "H", prog: 0.2, lista: false, vida: 0, costo: 550, restante: 1 });
    assert.equal(loQueFalta(al20).cemento, undefined, JSON.stringify(loQueFalta(al20)));
    assert.doesNotMatch(cuello(al20), pide);
    const media = piso(7, 0.5);
    media.mezclas.push({ tipo: "H", prog: 0.2, lista: false, vida: 0, costo: 550, restante: 1 });
    assert.equal(loQueFalta(media).cemento, undefined, JSON.stringify(loQueFalta(media)));
    assert.doesNotMatch(cuello(media), pide);

    const camino = piso(6, 0);
    camino.mezclas.push({ tipo: "H", prog: 0.4, lista: false, vida: 0, costo: 550, restante: 1 });
    camino.pedidos.push({ id: "cam", items: { cemento: 2 }, dia: camino.dia + 1, minuto: 7 * 60 + 30, flete: FLETE, urgente: false });
    assert.equal(loQueFalta(camino).cemento, undefined, JSON.stringify(loQueFalta(camino)));
    assert.doesNotMatch(cuello(camino), pide);
    assert.doesNotMatch(cuello(camino), /cemento/i);

    const dos = piso(5, 0);
    dos.mezclas.push({ tipo: "H", prog: 0.4, lista: false, vida: 0, costo: 550, restante: 1 });
    assert.equal(loQueFalta(dos).cemento, 2, JSON.stringify(loQueFalta(dos)));
    assert.match(cuello(dos), /cemento/i);

    const lista = piso(7.65, 0);
    lista.mezclas.push({ tipo: "H", prog: 1, lista: true, vida: 90, costo: 550, restante: 0.4 });
    assert.equal(loQueFalta(lista).cemento, undefined, JSON.stringify(loQueFalta(lista)));
    assert.doesNotMatch(cuello(lista), pide);

    const arena = piso(0, 8);
    arena.inv.arena = { q: 0.068 * 8 - 0.0015, valor: 0 };
    assert.ok((loQueFalta(arena).arena ?? 0) >= 0.5, JSON.stringify(loQueFalta(arena)));

    const oficina = nueva(3);
    firmar(oficina);
    oficina.panel = null;
    oficina.lluvias = [];
    oficina.minuto = 8 * 60;
    oficina.tut.fin = true;
    oficina.jugador = { x: SITIOS.oficina.x, y: SITIOS.oficina.y };
    const idOf = oficina.candidatos.find((c) => c.oficio === "albanil")!.id;
    contratar(oficina, idOf);
    asignar(oficina, idOf, "obra");
    const canso = oficina.gente[0]!.cansancio;
    avanzarMinutos(oficina, 120);
    assert.equal(oficina.stats.golpesAuto ?? 0, 0);
    assert.ok(oficina.gente[0]!.cansancio > canso, "la cuadrilla sí trabajó");

    const plomo = nueva(3);
    firmar(plomo);
    plomo.panel = null;
    plomo.lluvias = [];
    plomo.minuto = 8 * 60;
    plomo.tut.fin = true;
    plomo.jugador = { x: 4, y: 14.5 };
    plomo.plomo = { umbral: 10, min: 30 };
    contratar(plomo, plomo.candidatos[0]!.id);
    avanzarMinutos(plomo, 1);
    assert.ok(plomo.plomo);
    assert.equal(plomo.plomo.min, 30);
    assert.equal(accion(plomo).verbo, "Camina al muro");
    assert.equal(accion(plomo).detalle, "Plomear");
    assert.equal(plomo.stats.golpesAuto ?? 0, 0);

    const cerca = nueva(3);
    firmar(cerca);
    cerca.panel = null;
    cerca.lluvias = [];
    cerca.minuto = 8 * 60;
    cerca.tut.fin = true;
    cerca.sinGolpe = 0;
    cerca.jugador = { x: 14, y: 14.5 };
    const idC = cerca.candidatos.find((c) => c.oficio === "albanil")!.id;
    contratar(cerca, idC);
    asignar(cerca, idC, "obra");
    const enObra = ancla(cerca, cerca.gente[0]!);
    if (enObra) {
      cerca.gente[0]!.x = enObra.x;
      cerca.gente[0]!.y = enObra.y;
    }
    for (let i = 0; i < 15; i++) {
      avanzarMinutos(cerca, 1);
      if (cerca.panel && cerca.panel !== "perdida") cerca.panel = null;
    }
    assert.ok((cerca.stats.golpesAuto ?? 0) >= 1, "a 3 m " + cerca.stats.golpesAuto);
    const van = cerca.stats.golpesAuto ?? 0;
    for (let i = 0; i < 14; i++) {
      avanzarMinutos(cerca, 1);
      if (cerca.panel) cerca.panel = null;
    }
    assert.equal(cerca.stats.golpesAuto ?? 0, van);
    avanzarMinutos(cerca, 1);
    if (cerca.panel) cerca.panel = null;
    assert.ok((cerca.stats.golpesAuto ?? 0) >= van + 1);

    const hoja = nueva(1);
    firmar(hoja);
    contratar(hoja, hoja.candidatos[0]!.id);
    hoja.gente[0]!.puesto = null;
    hoja.panel = "cuadrilla";
    hoja.minuto = 8 * 60;
    const hora = hoja.minuto;
    const cans = hoja.gente[0]!.cansancio;
    for (let i = 0; i < 50; i++) tick(hoja, 0.2);
    assert.equal(hoja.minuto, hora);
    assert.equal(hoja.gente[0]!.cansancio, cans);

    const ocioso = nueva(1);
    firmar(ocioso);
    ocioso.panel = null;
    ocioso.lluvias = [];
    ocioso.minuto = 8 * 60;
    ocioso.tut.fin = true;
    contratar(ocioso, ocioso.candidatos[0]!.id);
    ocioso.gente[0]!.puesto = null;
    const base = ocioso.gente[0]!.cansancio;
    avanzarMinutos(ocioso, 120);
    assert.equal(ocioso.gente[0]!.cansancio, base);

    const fer = nueva(1);
    firmar(fer);
    fer.panel = null;
    for (const [x, y] of [
      [30, 21.1],
      [30, 23.9],
      [27.8, 22.5],
      [32.2, 22.5],
    ] as const) {
      fer.jugador = { x, y };
      const a = accion(fer);
      assert.equal(`${a.tecla} · ${a.verbo}`, "Espacio · Ferretería El Cruce", `${x},${y} ${a.verbo}`);
    }

    const cuadrilla = nueva(1);
    firmar(cuadrilla);
    const moncho = cuadrilla.candidatos.find((c) => c.nombre === "Moncho")!;
    const tono = cuadrilla.candidatos.find((c) => c.nombre === "Toño")!;
    assert.equal(contratar(cuadrilla, moncho.id), null);
    assert.equal(contratar(cuadrilla, tono.id), null);
    assert.equal(cuadrilla.gente.find((g) => g.nombre === "Moncho")!.puesto, null);
    assert.equal(cuadrilla.gente.find((g) => g.nombre === "Toño")!.puesto, null);
    assert.equal(cuadrilla.gente.find((g) => g.nombre === "Moncho")!.cansancio, 0);
    assert.equal(cuadrilla.gente.find((g) => g.nombre === "Toño")!.cansancio, 0);
  });

  it("el adelanto sale solo si el pedido deja menos de 5000 libres", () => {
    const s = nueva(3);
    firmar(s);
    for (const c of [...s.candidatos]) contratar(s, c.id);
    const nom = nominaPendiente(s);
    s.caja = nom + 37000;
    s.etapa = 2;
    assert.ok(Math.abs(cajaLibre(s) - 37000) < 1, "libre " + cajaLibre(s));
    const block = 470;
    const cemento = 26;
    const mats = block * MATERIALES.block.precio + cemento * MATERIALES.cemento.precio;
    const pedido = mats + FLETE;
    assert.ok(pedido > 40000 && pedido < 43000, "pedido " + pedido);
    assert.equal(puedeAdelantar(s, 0), false);
    assert.equal(puedeAdelantar(s, pedido), true);
    const trabado = pedir(s, { block, cemento }, false);
    assert.ok(trabado && trabado.includes("nómina"));
    assert.equal(s.pedidos.length, 0);
    assert.equal(adelantar(s, pedido), null);
    assert.equal(pedir(s, { block, cemento }, false), null);
    assert.equal(s.pedidos.length, 1);

    const quieto = nueva(4);
    firmar(quieto);
    for (const c of [...quieto.candidatos]) contratar(quieto, c.id);
    quieto.caja = nominaPendiente(quieto) + 6000;
    assert.ok(cajaLibre(quieto) >= 5000);
    assert.equal(puedeAdelantar(quieto), false);
    assert.equal(puedeAdelantar(quieto, 0), false);
  });

  it("comprobaciones de oficina, acarreo y agua", () => {
    const s0 = nueva(1);
    firmar(s0);
    s0.panel = null;
    s0.minuto = 12 * 60 + 12;
    assert.equal(s0.panel, null);
    assert.equal(cuello(s0), "Replanteo 0/2 · Contrata en la oficina.");
    assert.equal(ETAPAS[0]!.regla, NOTA_ESCUADRA);
    assert.equal(señalesReplanteo(0).estacas, 0);
    s0.jugador = { x: 19, y: 14.5 };
    golpe(s0, false);
    assert.equal(s0.panel, null);

    s0.minuto = 8 * 60;
    for (const nombre of ["Moncho", "Toño", "Fefa"]) {
      const c = s0.candidatos.find((p) => p.nombre === nombre);
      assert.ok(c, nombre);
      assert.equal(contratar(s0, c!.id), null);
    }
    assert.equal(s0.gente.length, 3);
    for (const g of s0.gente) g.puesto = null;
    assert.equal(cuello(s0), "Replanteo 0/2 · Manda a alguien a replantear.");
    const moncho = s0.gente.find((g) => g.nombre === "Moncho")!;
    asignar(s0, moncho.id, "obra");
    moncho.x = 16.3;
    moncho.y = 13.5;
    const otros = s0.gente.filter((g) => g.id !== moncho.id);
    for (const g of otros) asignar(s0, g.id, "obra");
    let minutos = 0;
    let vioEstacas = false;
    let vioCordel = false;
    while (minutos < 200 && !cuello(s0).startsWith("Replanteo listo")) {
      const diag = s0.runs[0]!.find((r) => r.id === "replantear")!.hecho;
      const senal = señalesReplanteo(diag);
      if (senal.estacas === 4) vioEstacas = true;
      if (senal.cordel) vioCordel = true;
      avanzarMinutos(s0, 1);
      minutos += 1;
    }
    const diagFin = s0.runs[0]!.find((r) => r.id === "replantear")!.hecho;
    assert.ok(diagFin >= 2 - 1e-3, "diag " + diagFin);
    assert.ok(vioEstacas, "estacas");
    assert.ok(vioCordel, "cordel");
    assert.equal(trianguloEscuadra(s0), true);
    assert.equal(cuello(s0), "Replanteo listo: escuadra comprobada 3, 4, 5");
    assert.ok(minutos >= 100 && minutos <= 180, "minutos " + minutos);
    console.log("replanteo Moncho", minutos, "min");

    const ped = nueva(2);
    firmar(ped);
    ped.panel = null;
    ped.etapa = 4;
    ped.minuto = 8 * 60;
    for (const nombre of ["Toño", "Fefa"]) {
      const c = ped.candidatos.find((p) => p.nombre === nombre)!;
      assert.equal(contratar(ped, c.id), null);
    }
    const falta = loQueFalta(ped);
    console.log("loQueFalta muros", JSON.stringify(falta));
    assert.ok((falta.block ?? 0) >= 469);
    assert.ok((falta.cemento ?? 0) >= 13, "cemento " + falta.cemento);
    assert.equal(pedir(ped, falta, false), null);
    ped.panel = "finde";
    siguienteDia(ped);
    assert.equal(ped.minuto, 7 * 60);
    avanzarMinutos(ped, 31);
    assert.ok(ped.minuto >= 7 * 60 + 30);
    assert.ok((ped.entrada.block?.q ?? 0) >= 469, "block entrada " + ped.entrada.block?.q);
    assert.ok((ped.entrada.cemento?.q ?? 0) >= 13, "cemento entrada " + ped.entrada.cemento?.q);
    assert.ok(ped.inv.arena.q > 0.2, "arena " + ped.inv.arena.q);
    assert.ok(ped.inv.grava.q > 0.02, "grava " + ped.inv.grava.q);
    assert.equal(ped.inv.block.q, 0);
    const entros = ped.bitacora.filter((a) => a.clase === "entro");
    assert.ok(entros.some((a) => a.lugar === "entrada" && a.min === 7 * 60 + 30));
    assert.ok(entros.some((a) => a.lugar === "montón" && a.texto.includes("montón")));
    const cementPedido = falta.cemento ?? 0;
    const blockEntrada = ped.entrada.block?.q ?? 0;
    const paleros = ped.gente.filter((g) => g.nombre === "Toño" || g.nombre === "Fefa");
    assert.equal(paleros.length, 2);
    for (const g of paleros) {
      asignar(ped, g.id, "acarreo");
      g.x = SITIOS.entrada.x;
      g.y = SITIOS.entrada.y;
    }
    let guardado = "";
    for (let i = 0; i < 400 && !guardado; i++) {
      avanzarMinutos(ped, 1);
      const g = ped.bitacora.find((a) => a.clase === "guardado");
      if (g) guardado = g.texto;
    }
    console.log("guardado", guardado, "cemento pedido", cementPedido, "en almacén", ped.inv.cemento.q);
    assert.equal(guardado, `Guardado ${Math.round(ped.inv.cemento.q)} fundas`);
    assert.ok(Math.abs(ped.inv.cemento.q - Math.min(20, cementPedido)) < 0.6, ped.inv.cemento.q + " vs " + cementPedido);
    assert.ok(Math.abs((ped.entrada.block?.q ?? 0) - blockEntrada) < 1, "el block sigue en la entrada");
    assert.equal(ped.inv.block.q, 0);
    assert.equal(ped.bitacora.some((a) => a.clase === "salio" && a.texto.includes("block")), false);

    const lluvia = nueva(3);
    firmar(lluvia);
    lluvia.panel = null;
    lluvia.etapa = 1;
    lluvia.minuto = 8 * 60;
    lluvia.entrada.cemento = { q: 9, valor: 9 * 550 };
    lluvia.cementoAfuera = 9;
    lluvia.lluvias = [{ dia: lluvia.dia, ini: 11 * 60, fin: 13 * 60, prob: 80 }];
    lluvia.avisoNubes = false;
    avanzarMinutos(lluvia, 1);
    assert.equal(cuello(lluvia), "Hay cemento en la entrada y vienen nubes.");
    assert.ok(lluvia.diario.some((d) => d.texto.includes("Hay cemento en la entrada y vienen nubes")));
    while (lluvia.minuto < 11 * 60 + 1 && lluvia.mojado < 1) avanzarMinutos(lluvia, 1);
    assert.equal(lluvia.mojado, 4);
    assert.ok((lluvia.stats.costoMojado ?? 0) > 0);
    assert.ok(lluvia.bitacora.some((a) => a.texto === "Mojado 4"));
    assert.ok(Math.abs((lluvia.entrada.cemento?.q ?? 0) - 5) < 1e-6);

    const agua = nueva(4);
    firmar(agua);
    agua.panel = null;
    agua.etapa = 3;
    agua.minuto = 8 * 60;
    agua.inv.cemento = { q: 5, valor: 2750 };
    agua.inv.arena = { q: 1, valor: 0 };
    agua.inv.grava = { q: 1, valor: 0 };
    agua.inv.agua = { q: 0.01, valor: 0 };
    const a1 = agua.candidatos.find((c) => c.oficio === "ayudante") ?? agua.candidatos[0]!;
    const a2 = agua.candidatos.find((c) => c.id !== a1.id && (c.oficio === "peon" || c.oficio === "ayudante"))!;
    contratar(agua, a1.id);
    contratar(agua, a2.id);
    const enBatea = agua.gente.find((g) => g.id === a1.id)!;
    const enAgua = agua.gente.find((g) => g.id === a2.id)!;
    asignar(agua, enBatea.id, "sombra");
    enBatea.x = SITIOS.sombra.x;
    enBatea.y = SITIOS.sombra.y;
    asignar(agua, enAgua.id, "sombra");
    enAgua.x = SITIOS.sombra.x;
    enAgua.y = SITIOS.sombra.y;
    assert.equal(cuello(agua), "Sin agua en el tanque: manda a alguien por agua.");
    const antes = agua.inv.agua.q;
    avanzarMinutos(agua, 20);
    assert.ok(Math.abs(agua.inv.agua.q - antes) < 1e-6, "la sombra no busca agua");
    assert.equal(cuello(agua), "Sin agua en el tanque: manda a alguien por agua.");
    asignar(agua, enAgua.id, "agua");
    enAgua.x = SITIOS.toma.x;
    enAgua.y = SITIOS.toma.y;
    asignar(agua, enBatea.id, "batea");
    enBatea.x = SITIOS.batea.x;
    enBatea.y = SITIOS.batea.y;
    avanzarMinutos(agua, 25);
    assert.ok(agua.inv.agua.q > 0.1, "tanque " + agua.inv.agua.q);
    const prog = agua.mezclas.reduce((n, m) => n + m.prog, 0);
    assert.ok(prog > 0.05, "prog " + prog);
    assert.equal(enBatea.puesto, "batea");
    assert.equal(cuello(agua).includes("Sin agua en el tanque"), false);

    const viejo = nueva(8);
    firmar(viejo);
    const inv = viejo.inv as unknown as Record<string, { q: number; valor: number }>;
    inv.arenaBruta = { q: 1.5, valor: 0 };
    inv.piedra = { q: 0.4, valor: 0 };
    viejo.gente[0] && (viejo.gente[0].puesto = "piedra" as Puesto);
    viejo.runs[0]!.push({ id: "trazar", hecho: 1, ini: true });
    const caja = viejo.caja;
    sanear(viejo);
    assert.equal(inv.arenaBruta, undefined);
    assert.equal(inv.piedra, undefined);
    assert.equal(viejo.caja, caja);
    assert.equal(viejo.runs[0]!.find((r) => r.id === "replantear")!.hecho, 1);
  });

  it("el puesto sigue al otro día y la batea dice quién falta", () => {
    const s = nueva(17);
    firmar(s);
    s.panel = null;
    const tomar = [...s.candidatos].slice(0, 4).map((c) => c.id);
    for (const id of tomar) contratar(s, id);
    const puestos: Puesto[] = ["batea", "agua", "acarreo", "obra"];
    s.gente.forEach((g, i) => asignar(s, g.id, puestos[i]!));
    const esperado = s.gente.map((g) => [g.id, g.puesto] as const);
    s.gente[1]!.cansancio = 90;
    s.minuto = 10 * 60;
    terminarJornada(s);
    siguienteDia(s);
    assert.equal(s.minuto, 7 * 60);
    for (const [id, puesto] of esperado) {
      const g = s.gente.find((x) => x.id === id);
      assert.ok(g);
      assert.equal(g.puesto, puesto);
    }
    const falto = s.gente.find((g) => g.falto);
    assert.ok(falto);
    assert.equal(falto.puesto, "agua");
    assert.equal(falto.activo, false);
    const crudo = JSON.parse(JSON.stringify(s)) as Estado;
    assert.equal(validar(crudo), true);
    sanear(crudo);
    for (const [id, puesto] of esperado) {
      assert.equal(crudo.gente.find((g) => g.id === id)?.puesto, puesto);
    }

    const b = nueva(5);
    firmar(b);
    b.panel = null;
    b.etapa = 3;
    b.minuto = 8 * 60;
    b.lluvias = [];
    b.pedidos = [];
    b.inv.cemento = { q: 6, valor: 3300 };
    b.inv.arena = { q: 1, valor: 0 };
    b.inv.grava = { q: 1, valor: 0 };
    b.inv.agua = { q: 1, valor: 0 };
    const quien = b.candidatos.find((c) => c.oficio === "ayudante" || c.oficio === "peon") ?? b.candidatos[0]!;
    contratar(b, quien.id);
    const g = b.gente[0]!;
    asignar(b, g.id, "obra");
    g.x = SITIOS.obra.x;
    g.y = SITIOS.obra.y;
    b.jugador = { x: SITIOS.obra.x, y: SITIOS.obra.y };
    assert.equal(g.puesto, "obra");
    assert.equal(laborDe(b, g), "batea");
    assert.equal(cuello(b).startsWith("Nadie en el Trompo"), false);
    asignar(b, g.id, "batea");
    g.x = SITIOS.batea.x;
    g.y = SITIOS.batea.y;
    assert.equal(cuello(b).startsWith("Nadie en el Trompo"), false);
    const antes = b.mezclas.reduce((n, m) => n + m.prog, 0);
    avanzarMinutos(b, 12);
    const prog = b.mezclas.reduce((n, m) => n + m.prog, 0);
    assert.ok(prog > antes + 0.05, "batea sola " + prog);
    assert.equal(g.puesto, "batea");
    b.mezclas = [{ tipo: "H", prog: 0.4, lista: false, vida: 90, costo: 10, restante: 1 }];
    assert.equal(cuello(b).startsWith("Nadie en el Trompo"), false);
    asignar(b, g.id, "obra");
    assert.equal(g.puesto, "obra");
    assert.equal(laborDe(b, g), "batea");
    assert.equal(cuello(b).startsWith("Nadie en el Trompo"), false);
  });

  it("el plomo pide el muro y, si no vas, avisa sin cambiar el desplome", () => {
    const armar = (seed: number) => {
      const s = nueva(seed);
      firmar(s);
      s.panel = null;
      s.etapa = 4;
      s.minuto = 8 * 60;
      s.lluvias = [];
      s.pedidos = [];
      s.blocksHoy = 0;
      s.inv.block = { q: 400, valor: 0 };
      s.inv.v38 = { q: 20, valor: 0 };
      s.inv.alambre = { q: 4, valor: 0 };
      s.inv.cemento = { q: 8, valor: 0 };
      s.inv.arena = { q: 1, valor: 0 };
      s.inv.agua = { q: 1, valor: 0 };
      s.mezclas = [{ tipo: "M", prog: 1, lista: true, vida: 400, costo: 100, restante: 20 }];
      const alb = s.candidatos.find((c) => c.oficio === "albanil");
      assert.ok(alb);
      contratar(s, alb.id);
      const g = s.gente.find((x) => x.id === alb.id)!;
      asignar(s, g.id, "obra");
      const sitio = ancla(s, g);
      assert.ok(sitio);
      g.x = sitio.x;
      g.y = sitio.y;
      g.ojo = 5;
      return s;
    };
    const s = armar(9);
    const run = s.runs[4]!.find((r) => r.id === "block")!;
    for (const h of [3, 6, 9, 12]) {
      const u = h * POR_HILADA;
      run.hecho = u - 0.01;
      s.plomo = null;
      s.minuto = 8 * 60;
      s.blocksHoy = 0;
      s.plumbed = s.plumbed.filter((p) => Math.abs(p - u) > 1e-3);
      avanzarMinutos(s, 2);
      assert.ok(s.plomo, "hilada " + h + " hecho " + run.hecho);
      assert.equal(cuello(s), "Toca plomear: ve al muro y pulsa Espacio.");
      s.jugador = { x: SITIOS.obra.x, y: SITIOS.obra.y };
      const f = golpe(s, false);
      assert.equal(f?.texto, "¡Plomo!");
      assert.equal(f?.x, SITIOS.obra.x);
      assert.equal(f?.y, SITIOS.obra.y);
      assert.equal(s.plomo, null);
      const otra = golpe(s, false);
      assert.notEqual(otra?.texto, "¡Plomo!");
    }

    let aguanto = false;
    for (let seed = 1; seed <= 8 && !aguanto; seed++) {
      const t = armar(seed);
      const muro = t.runs[4]!.find((r) => r.id === "block")!;
      muro.hecho = 3 * POR_HILADA - 0.01;
      avanzarMinutos(t, 2);
      assert.ok(t.plomo, "semilla " + seed);
      t.jugador = { x: SITIOS.oficina.x, y: SITIOS.oficina.y };
      for (const g of t.gente) g.puesto = null;
      const extras = t.extras.length;
      const desplomes = t.desplomes;
      const min = t.plomo.min;
      avanzarMinutos(t, 120);
      assert.ok(t.plomo, "sigue esperando");
      assert.equal(t.plomo.min, min);
      assert.equal(accion(t).verbo, "Camina al muro");
      assert.equal(accion(t).detalle, "Plomear");
      assert.equal(t.avisos.some((a) => a.texto.includes("No plomeaste")), false);
      assert.equal(t.extras.length, extras);
      assert.equal(t.desplomes, desplomes);
      t.jugador = { x: SITIOS.obra.x, y: SITIOS.obra.y };
      const f = golpe(t, false);
      assert.equal(f?.texto, "¡Plomo!");
      assert.equal(t.plomo, null);
      aguanto = true;
    }
    assert.equal(aguanto, true);
  });

  it("la cuadrilla de ocho trabaja cada uno en lo suyo y la nómina cuadra", () => {
    const s = nueva(1);
    firmar(s);
    s.panel = null;
    s.lluvias = [];
    s.minuto = 8 * 60;
    s.tut.fin = true;
    for (const c of s.candidatos.slice(0, 8)) assert.equal(contratar(s, c.id), null, c.nombre);
    assert.equal(s.gente.length, 8);
    assert.match(contratar(s, s.candidatos[0]!.id) ?? "", /8/);
    const oficios = s.gente.map((g) => g.oficio).sort();
    assert.deepEqual(oficios, ["albanil", "albanil", "ayudante", "ayudante", "peon", "peon", "varillero", "varillero"]);

    s.etapa = 4;
    s.mezclas = [{ tipo: "M", prog: 0.3, lista: false, vida: 0, costo: 100, restante: 1 }];
    s.inv.agua.q = 0.3;
    s.entrada = { cemento: { q: 2, valor: 1100 } };
    s.tierraMonton = 2;
    for (const g of s.gente) asignar(s, g.id, "obra");
    for (const g of s.gente) {
      const labor = laborDe(s, g);
      if (g.oficio === "peon" || g.oficio === "ayudante") {
        assert.ok(labor === "batea" || labor === "agua" || labor === "acarreo" || labor === "tierra" || labor === "regar", `${g.nombre} ${labor}`);
      } else {
        assert.ok(labor === "obra" || labor === "regar", `${g.nombre} ${g.oficio} ${labor}`);
        assert.notEqual(labor, "batea");
        assert.notEqual(labor, "agua");
        assert.notEqual(labor, "acarreo");
        assert.notEqual(labor, "tierra");
      }
    }
    const moncho = s.gente.find((g) => g.nombre === "Moncho")!;
    asignar(s, moncho.id, "batea");
    assert.notEqual(laborDe(s, moncho), "batea");

    const fefa = s.gente.find((g) => g.nombre === "Fefa")!;
    const tono = s.gente.find((g) => g.nombre === "Toño")!;
    s.etapa = 3;
    s.mezclas = [{ tipo: "H", prog: 1, lista: true, vida: 90, costo: 100, restante: 10 }];
    s.inv.agua.q = 2;
    s.entrada = {};
    s.cargas = [];
    s.tierraMonton = 2;
    for (const g of s.gente) asignar(s, g.id, "obra");
    assert.equal(laborDe(s, fefa), "obra");
    assert.notEqual(laborDe(s, tono), "tierra");

    const antes = s.caja;
    const esp = nominaPendiente(s);
    s.minuto = 15 * 60 - 1;
    s.panel = null;
    avanzarMinutos(s, 1);
    assert.equal(s.nominaPagada, true);
    assert.ok(Math.abs(antes - s.caja - esp) < 1.5, `caja ${antes - s.caja} nómina ${esp}`);
    const linea = s.diario.find((d) => d.texto.startsWith("Nómina:"));
    assert.ok(linea);
    assert.equal(Math.round(antes - s.caja), Math.round(esp));
  });

  it("después de Ahora no, Sita se puede llamar a las 14:20", () => {
    const s = nueva(3);
    firmar(s);
    s.panel = null;
    s.etapa = 4;
    s.minuto = 14 * 60;
    s.lluvias = [];
    s.pedidos = [];
    s.runs[4]!.find((r) => r.id === "block")!.hecho = BLOCKS_MURO * 0.5;
    for (const m of COMPRA) s.inv[m] = { q: 0, valor: 0 };
    s.inv.agua = { q: 0.4, valor: 0 };
    s.entrada = {};
    contratar(s, s.candidatos[0]!.id);
    const g = s.gente[0] ?? s.reserva[0]!;
    g.activo = false;
    g.falto = true;
    avanzarMinutos(s, 1);
    const of = s.sita.oferta;
    assert.ok(of, "nota a las 14:00");
    const items = { ...of!.items };
    rechazarSita(s);
    assert.equal(s.sita.oferta == null, true);
    assert.equal(s.pedidos.length, 0);
    s.minuto = 14 * 60 + 20;
    s.panel = null;
    hablarSita(s);
    const vuelta = s.sita.oferta;
    assert.equal(s.panel, "sita");
    assert.ok(vuelta);
    assert.equal(vuelta!.urgente, false);
    assert.deepEqual(vuelta!.items, items);
    assert.match(vuelta!.texto, /Normal/);
    assert.equal(aceptarSita(s), null);
    assert.equal(s.pedidos.length, 1);
    assert.equal(s.pedidos[0]!.urgente, false);
  });

  it("el arrastre rodea la oficina", () => {
    const s = nueva(1);
    firmar(s);
    s.panel = null;
    s.jugador = { x: 6.2, y: 16.6 };
    const meta = { x: 12.2, y: 16.6 };
    for (let i = 0; i < 80; i++) seguirDedo(s, meta.x, meta.y, false, 0.45);
    const x = s.jugador.x;
    const y = s.jugador.y;
    const dentro = x > 8.7 - 1.175 && x < 8.7 + 1.175 && y > 16.6 - 0.95 && y < 16.6 + 0.95;
    assert.equal(dentro, false, `${x},${y}`);
    assert.ok(x > 9.5, `no rodeó ${x},${y}`);
    seguirDedo(s, x, y, true);
    assert.equal(s.vel, 0);
    assert.equal(s.destino, null);
  });

  it("la nómina de hoy es la misma en la cuenta y en el pago", () => {
    const s = nueva(1);
    firmar(s);
    s.minuto = 8 * 60;
    s.panel = null;
    s.lluvias = [];
    for (const c of s.candidatos.slice(0, 8)) assert.equal(contratar(s, c.id), null);
    const d = desgloseNomina(s);
    let jornales = 0;
    let herramienta = 0;
    for (const g of s.gente) {
      const j = jornalDe(g.oficio, g.rinde);
      jornales += j;
      herramienta += Math.round(j * HERRAMIENTA);
    }
    assert.equal(d.jornales, jornales);
    assert.equal(d.herramienta, herramienta);
    assert.equal(d.direccion, DIRECCION_DIA);
    assert.equal(d.total, jornales + herramienta + DIRECCION_DIA);
    assert.equal(nominaPendiente(s), d.total);
    assert.match(textoCajaLibre(s), /nómina de hoy/);
    const cuenta = cuentaPedido(s, 1000);
    assert.equal(cuenta.nomina, d.total);
    assert.equal(cuenta.jornales, d.jornales);
    assert.equal(cuenta.herramienta, d.herramienta);
    assert.equal(cuenta.direccion, d.direccion);
    const antes = s.caja;
    s.minuto = 15 * 60 - 1;
    avanzarMinutos(s, 1);
    assert.ok(Math.abs(antes - s.caja - d.total) < 1.5, `pago ${antes - s.caja} nómina ${d.total}`);
  });

  it("terminar a las 14:05 abre la hoja y seguir no despacha", () => {
    const s = nueva(1);
    firmar(s);
    contratar(s, s.candidatos[0]!.id);
    s.minuto = 14 * 60 + 5;
    s.panel = null;
    s.lluvias = [];
    const caja = s.caja;
    const nomina = nominaPendiente(s);
    abrirDespacho(s);
    assert.equal(s.panel, "despacho");
    assert.equal(s.nominaPagada, false);
    assert.equal(s.caja, caja);
    seguirJornada(s);
    assert.equal(s.panel, null);
    assert.equal(s.minuto, 14 * 60 + 5);
    assert.equal(s.nominaPagada, false);
    abrirDespacho(s);
    confirmarDespacho(s);
    assert.equal(s.nominaPagada, true);
    assert.equal(s.panel, "finde");
    assert.ok(s.avisos.some((a) => a.texto.startsWith(`Se fueron a las ${horaDe(14 * 60 + 5)}`)));
    assert.ok(Math.abs(caja - s.caja - nomina) < 1.5);
  });

  it("sin trabajo de mezcla el trompo no bate y el block corto lo dice", () => {
    const s = nueva(1);
    firmar(s);
    s.panel = null;
    s.lluvias = [];
    s.minuto = 8 * 60;
    s.etapa = 0;
    s.jugador = { x: SITIOS.batea.x, y: SITIOS.batea.y };
    s.inv.cemento = { q: 8, valor: 0 };
    s.inv.arena = { q: 2, valor: 0 };
    s.inv.grava = { q: 2, valor: 0 };
    s.inv.agua = { q: 2, valor: 0 };
    const f = golpe(s, false);
    assert.equal(f?.texto, "Nada que batir");
    assert.equal(s.mezclas.length, 0);
    s.mezclas = [{ tipo: "M", prog: 1, lista: true, vida: 1, costo: 0, restante: 1 }];
    avanzarMinutos(s, 1);
    assert.equal(s.avisos.some((a) => /Se venció/.test(a.texto) && /P\$0/.test(a.texto)), false);
    s.etapa = 4;
    s.blocksHoy = 200;
    s.inv.block = { q: 400, valor: 0 };
    s.inv.v38 = { q: 20, valor: 0 };
    s.inv.alambre = { q: 4, valor: 0 };
    s.inv.cemento = { q: 20, valor: 0 };
    s.inv.arena = { q: 2, valor: 0 };
    s.inv.agua = { q: 2, valor: 0 };
    s.mezclas = [{ tipo: "M", prog: 1, lista: true, vida: 90, costo: 10, restante: 30 }];
    s.plomo = null;
    assert.equal(cuelloLabor(s), "Máximo 6 hiladas por día.");
  });

  it("un pedido que deja la nómina en rojo no alcanza", () => {
    const s = nueva(1);
    firmar(s);
    for (const c of s.candidatos.slice(0, 4)) contratar(s, c.id);
    s.cobrado = s.precio;
    s.caja = nominaPendiente(s) + 100;
    const cuenta = cuentaPedido(s, 5000);
    assert.equal(cuenta.usaAdelanto, false);
    assert.equal(cuenta.alcanza, false);
    assert.ok(cuenta.libre < 0);
    const err = pedir(s, { cemento: 4 }, false);
    assert.ok(err && /nómina/.test(err));
    assert.equal(s.pedidos.length, 0);
  });

  it("la ferretería abierta no mueve la hora ni el cansancio", () => {
    const s = nueva(1);
    firmar(s);
    contratar(s, s.candidatos[0]!.id);
    s.panel = null;
    s.lluvias = [];
    s.minuto = 8 * 60;
    s.gente[0]!.cansancio = 12;
    s.gente[0]!.puesto = "obra";
    const antes = s.minuto;
    for (let i = 0; i < 5; i++) tick(s, 0.1);
    assert.ok(s.minuto > antes, "sin hoja el reloj corre");
    s.minuto = antes;
    s.frac = 0;
    s.gente[0]!.cansancio = 12;
    s.panel = "ferreteria";
    for (let i = 0; i < 100; i++) tick(s, 0.1);
    assert.equal(s.minuto, antes);
    assert.equal(s.gente[0]!.cansancio, 12);
  });

  it("tramos de cobro: muros 10, columnas 10, suma el contrato", () => {
    assert.equal(TAREAS.block.rinde, 150);
    assert.equal(ETAPAS.find((e) => e.id === "muros")!.tramo, 0.1);
    assert.equal(ETAPAS.find((e) => e.id === "columnas")!.tramo, 0.1);
    const s = nueva(1);
    firmar(s);
    const t = tramos(s);
    const suma = t.reduce((n, x) => n + x.monto, 0);
    assert.equal(suma, s.precio);
    assert.equal(s.precio, CONTRATO);
    assert.equal(t.find((x) => x.nombre === "Muros 10%")?.monto, 30000);
    assert.equal(t.find((x) => x.nombre === "Columnas 10%")?.monto, 30000);
    assert.equal(t.find((x) => x.nombre === "Zapata 15%")?.monto, 45000);
    assert.equal(t.find((x) => x.nombre === "Anticipo 30%")?.monto, 90000);
  });

  it("atento con 4 termina muros entre los días 9 y 11", () => {
    const n = Number(process.env.ATENTO_N || 40);
    const filas = [];
    for (let seed = 1; seed <= n; seed++) filas.push(filaAtento(seed, jugarAtento(seed, 4)));
    const entregadas = filas.filter((f) => f.entregada).length;
    const conGanancia = filas.filter((f) => f.entregada && f.ganancia > 0).length;
    console.log("ATENTO4", JSON.stringify(filas));
    console.log(
      "ATENTO4_RES",
      JSON.stringify({
        entregadas,
        conGanancia,
        muros: filas.map((f) => f.diaMuros),
        block: filas.map((f) => f.diaBlock),
        entrega: filas.map((f) => f.diaEntrega),
        ganancia: filas.map((f) => f.ganancia),
        perdida: filas.map((f) => f.diaPerdida),
      }),
    );
    for (const f of filas) {
      assert.ok(f.entregada || f.diaPerdida, `semilla ${f.semilla}`);
    }
    assert.ok(entregadas >= 34, `entregadas ${entregadas}/40`);
  });

  it("atento con 5 entrega entre los días 14 y 18", () => {
    const n = Number(process.env.ATENTO_N || 40);
    const filas = [];
    for (let seed = 1; seed <= n; seed++) filas.push(filaAtento(seed, jugarAtento(seed, 5)));
    const entregadas = filas.filter((f) => f.entregada).length;
    console.log("ATENTO5", JSON.stringify(filas));
    console.log(
      "ATENTO5_RES",
      JSON.stringify({
        entregadas,
        entrega: filas.map((f) => f.diaEntrega),
        ganancia: filas.map((f) => f.ganancia),
        perdida: filas.map((f) => f.diaPerdida),
      }),
    );
    assert.ok(entregadas >= 30, `entregadas ${entregadas}/40`);
  });

  it("simulación de 40 semillas", () => {
    const ganancias: number[] = [];
    const dias: number[] = [];
    const fletes: number[] = [];
    const muertos: number[] = [];
    let entregadas = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const r = jugar(seed);
      if (r.s.entregada) entregadas += 1;
      ganancias.push(Math.round(r.inf.ganancia));
      dias.push(r.s.dia);
      fletes.push(r.s.stats.fletes);
      muertos.push(r.s.costos.muerto.mo);
    }
    const g = [...ganancias].sort((a, b) => a - b);
    const d = [...dias].sort((a, b) => a - b);
    const mid = (xs: number[]) => (xs[19]! + xs[20]!) / 2;
    const p10 = (xs: number[]) => xs[3]!;
    const p90 = (xs: number[]) => xs[35]!;
    const media = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    const linea = {
      entregadas,
      mediana: mid(g),
      p10: p10(g),
      p90: p90(g),
      peor: g[0],
      diasMediana: mid(d),
      diasP10: p10(d),
      diasP90: p90(d),
      fletes: media(fletes),
      muertoPromedio: Math.round(media(muertos)),
    };
    console.log("SIM40", JSON.stringify(linea));
    assert.equal(ganancias.length, 40, JSON.stringify(linea));
  });

  it("la guía no retrocede", () => {
    const s = nueva(1);
    firmar(s);
    contratar(s, s.candidatos[0]!.id);
    const rng = s.rng;
    const caja = s.caja;
    s.sita.oferta = { items: { cemento: 1 }, urgente: false, mats: 1, flete: FLETE, total: 2050, texto: "falta" };
    marcarGuia(s);
    assert.equal(pasoTutorial(s) + 1, 3);
    s.sita.oferta = null;
    assert.equal(s.tut.parada, false);
    assert.equal(s.tut.sita, false);
    assert.equal(pasoTutorial(s) + 1, 3);
    s.runs[0]!.find((r) => r.id === "replantear")!.hecho = 2;
    marcarGuia(s);
    assert.equal(pasoTutorial(s) + 1, 4);
    s.runs[0]!.find((r) => r.id === "replantear")!.hecho = 0;
    assert.equal(pasoTutorial(s) + 1, 4);
    assert.equal(s.rng, rng);
    assert.equal(s.caja, caja);
  });

  it("Sita propone y solo pide si confirmas", () => {
    const muros = () => {
      const s = nueva(3);
      firmar(s);
      s.panel = null;
      s.etapa = 4;
      s.minuto = 14 * 60;
      s.lluvias = [];
      s.pedidos = [];
      s.runs[4]!.find((r) => r.id === "block")!.hecho = BLOCKS_MURO * 0.5;
      for (const m of COMPRA) s.inv[m] = { q: 0, valor: 0 };
      s.inv.agua = { q: 0.4, valor: 0 };
      s.entrada = {};
      const id = s.candidatos[0]!.id;
      contratar(s, id);
      const g = s.gente[0] ?? s.reserva[0];
      if (g) {
        g.activo = false;
        g.falto = true;
      }
      return s;
    };
    const s = muros();
    const caja = s.caja;
    const falta = loQueFalta(s);
    avanzarMinutos(s, 1);
    const of = s.sita.oferta;
    assert.ok(of, "nota a las 14:00");
    assert.equal(of!.urgente, false);
    assert.equal(s.minuto, 14 * 60 + 1);
    assert.match(of!.texto, /faltan:/);
    assert.match(of!.texto, /Normal/);
    assert.match(of!.texto, /llega mañana 7:30/);
    assert.deepEqual(of!.items, falta);
    assert.equal(s.pedidos.length, 0);
    assert.equal(s.caja, caja);
    assert.equal(s.stats.fletes, 0);
    const otro = muros();
    const cajaOtro = otro.caja;
    assert.equal(pedir(otro, falta, false), null);
    assert.equal(aceptarSita(s), null);
    assert.ok(Math.abs(caja - s.caja - (cajaOtro - otro.caja)) < 0.01);
    assert.equal(s.pedidos.length, 1);
    assert.equal(s.pedidos[0]!.urgente, false);
    assert.equal(s.pedidos[0]!.flete, FLETE);
    assert.equal(s.pedidos[0]!.minuto, 7 * 60 + 30);
    assert.equal(s.pedidos[0]!.dia, s.dia + 1);
    assert.deepEqual(s.pedidos[0]!.items, otro.pedidos[0]!.items);
    assert.ok(s.bitacora.some((a) => a.clase === "nota" && a.lugar === "almacén"));

    const conCamion = muros();
    conCamion.pedidos.push({ id: "ya", items: { cemento: 1 }, dia: conCamion.dia + 1, minuto: 7 * 60 + 30, flete: FLETE, urgente: false });
    const cajaCamion = conCamion.caja;
    avanzarMinutos(conCamion, 1);
    assert.equal(conCamion.sita.oferta, null);
    assert.equal(conCamion.pedidos.length, 1);
    assert.equal(conCamion.caja, cajaCamion);

    const no = muros();
    avanzarMinutos(no, 1);
    assert.ok(no.sita.oferta);
    const cajaNo = no.caja;
    rechazarSita(no);
    assert.equal(no.pedidos.length, 0);
    assert.equal(no.caja, cajaNo);
    assert.equal(no.sita.oferta == null, true);
    siguienteDia(no);
    no.minuto = 14 * 60;
    no.panel = null;
    avanzarMinutos(no, 1);
    const vuelta = no.sita.oferta;
    assert.ok(vuelta, "vuelve al día siguiente");
    assert.equal(vuelta.urgente, false);
    assert.equal(no.pedidos.length, 0);

    const u9 = nueva(2);
    firmar(u9);
    u9.panel = null;
    u9.etapa = 3;
    u9.minuto = 9 * 60;
    u9.lluvias = [];
    u9.pedidos = [];
    for (const m of COMPRA) u9.inv[m] = { q: 0, valor: 0 };
    u9.inv.agua = { q: 1, valor: 0 };
    contratar(u9, u9.candidatos[0]!.id);
    const quieto9 = u9.gente[0] ?? u9.reserva[0];
    if (quieto9) {
      quieto9.activo = false;
      quieto9.falto = true;
    }
    const caja9 = u9.caja;
    avanzarMinutos(u9, 1);
    assert.equal(u9.sita.oferta?.urgente, true);
    assert.match(u9.sita.oferta!.texto, /Urgente/);
    assert.match(u9.sita.oferta!.texto, /llega a las/);
    assert.equal(u9.pedidos.length, 0);
    assert.equal(u9.caja, caja9);
    assert.equal(aceptarSita(u9), null);
    assert.equal(u9.pedidos[0]!.urgente, true);
    assert.equal(u9.pedidos[0]!.flete, FLETE_URGENTE);
    assert.ok(u9.sita.oferta);
    assert.equal(Object.keys(u9.sita.oferta!.items).length, 0);
    assert.ok((u9.sita.oferta!.siguiente?.block ?? 0) > 0);
    const antesTam = u9.pedidos.length;
    assert.equal(pedirTambien(u9), null);
    assert.equal(u9.pedidos.length, antesTam + 1);
    assert.equal(u9.sita.oferta, null);

    const u13 = nueva(2);
    firmar(u13);
    u13.panel = null;
    u13.etapa = 3;
    u13.minuto = 13 * 60;
    u13.lluvias = [];
    u13.pedidos = [];
    for (const m of COMPRA) u13.inv[m] = { q: 0, valor: 0 };
    u13.inv.agua = { q: 1, valor: 0 };
    contratar(u13, u13.candidatos[0]!.id);
    const quieto13 = u13.gente[0] ?? u13.reserva[0];
    if (quieto13) {
      quieto13.activo = false;
      quieto13.falto = true;
    }
    avanzarMinutos(u13, 1);
    assert.equal(u13.sita.oferta == null, true);
    while (u13.minuto < 14 * 60) avanzarMinutos(u13, 1);
    assert.equal(u13.sita.oferta == null, true);
    avanzarMinutos(u13, 1);
    const of13 = u13.sita.oferta;
    assert.ok(of13);
    assert.equal(of13.urgente, false);
    assert.match(of13.texto, /Normal/);
    assert.equal(u13.pedidos.length, 0);

    const viejo = nueva(8);
    firmar(viejo);
    const suelto = JSON.parse(JSON.stringify(viejo)) as Estado;
    delete (suelto as { sita?: unknown }).sita;
    assert.equal(validar(suelto), true);
    sanear(suelto);
    assert.equal(suelto.sita.fase, "casa");
  });

  it("el fin del día nombra la etapa y el informe el cemento mojado", () => {
    const s = nueva(4);
    firmar(s);
    s.etapa = 4;
    s.runs[4]!.find((r) => r.id === "block")!.hecho = 10;
    s.etapas[0]!.sello = "aprobado";
    s.etapas[1]!.sello = "aprobado";
    assert.equal(s.etapas.filter((e) => e.sello).length, 2);
    assert.match(lineaAhora(s), /^Ahora: Levantar block · 10 de 469 ud$/);
    s.mojado = 4;
    s.stats.costoMojado = 2200;
    const inf = informe(s);
    assert.equal(inf.mojado, 4);
    assert.equal(inf.costoMojado, 2200);
  });

  it("novato que solo acepta a Sita", () => {
    const ganancias: number[] = [];
    const dias: number[] = [];
    const fletes: number[] = [];
    const urgentes: number[] = [];
    let entregadas = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const r = jugarNovato(seed);
      if (r.s.entregada) entregadas += 1;
      ganancias.push(Math.round(r.inf.ganancia));
      dias.push(r.s.diasTrabajados);
      fletes.push(r.s.stats.fletes);
      urgentes.push(r.urgentes);
    }
    const g = [...ganancias].sort((a, b) => a - b);
    const d = [...dias].sort((a, b) => a - b);
    const f = [...fletes].sort((a, b) => a - b);
    const mid = (xs: number[]) => (xs[19]! + xs[20]!) / 2;
    const p10 = (xs: number[]) => xs[3]!;
    const p90 = (xs: number[]) => xs[35]!;
    const media = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    const linea = {
      entregadas,
      mediana: mid(g),
      p10: p10(g),
      p90: p90(g),
      peor: g[0],
      diasTrabajados: mid(d),
      fletesMediana: mid(f),
      fletes: media(fletes),
      urgentes: media(urgentes),
    };
    console.log("NOVATO40", JSON.stringify(linea));
    assert.equal(ganancias.length, 40, JSON.stringify(linea));
  });

  it("pasivo que no asigna pierde entre los días 12 y 28", () => {
    const dias: number[] = [];
    for (let seed = 1; seed <= 40; seed++) {
      const r = jugarPasivo(seed);
      assert.equal(r.s.panel, "perdida", `semilla ${seed} panel ${r.s.panel} día ${r.s.dia}`);
      assert.equal(r.s.entregada, false);
      assert.equal(r.s.stats.golpesAuto ?? 0, 0, `semilla ${seed} golpes auto`);
      dias.push(r.s.dia);
      assert.ok(r.s.dia >= 12 && r.s.dia <= 28, `semilla ${seed} día ${r.s.dia}`);
    }
    const o = [...dias].sort((a, b) => a - b);
    console.log("PASIVO40", JSON.stringify({ min: o[0], mediana: (o[19]! + o[20]!) / 2, max: o[39], dias: o }));
  });

  it("los textos de la obra no mueven la caja", () => {
    assert.equal(TUTORIAL[6], "El guardalmacén te trae una nota a las 14:00, o antes si la obra se para por material.");
    const vaciar = (s: Estado) => {
      for (const m of COMPRA) s.inv[m] = { q: 0, valor: 0 };
      s.inv.agua = { q: 1, valor: 0 };
      s.entrada = {};
      s.pedidos = [];
      s.lluvias = [];
      s.panel = null;
    };
    const quieto = (s: Estado) => {
      contratar(s, s.candidatos[0]!.id);
      const g = s.gente[0] ?? s.reserva[0];
      if (g) {
        g.activo = false;
        g.falto = true;
      }
    };
    const hoy = nueva(1);
    firmar(hoy);
    hoy.etapa = 2;
    hoy.minuto = 9 * 60;
    vaciar(hoy);
    quieto(hoy);
    avanzarMinutos(hoy, 1);
    assert.match(hoy.sita.oferta?.texto ?? "", /^Para hoy faltan:/);
    assert.equal(hoy.sita.oferta?.urgente, true);

    const tarde = nueva(1);
    firmar(tarde);
    tarde.etapa = 2;
    tarde.minuto = 14 * 60;
    vaciar(tarde);
    quieto(tarde);
    const cajaNota = tarde.caja;
    avanzarMinutos(tarde, 1);
    const nota = tarde.sita.oferta?.texto ?? "";
    assert.match(nota, /^Para mañana faltan:/);
    assert.match(nota, /Varilla 3\/8: hace falta \d+, hay 0, vienen 0, pido \d+/);
    assert.doesNotMatch(nota.split("Para la siguiente")[0] ?? nota, /plywood|pino|block/i);
    assert.equal(tarde.caja, cajaNota);

    const corto = nueva(1);
    firmar(corto);
    corto.etapa = 2;
    corto.minuto = 14 * 60;
    corto.caja = 100;
    vaciar(corto);
    quieto(corto);
    avanzarMinutos(corto, 1);
    const pobre = corto.sita.oferta;
    assert.ok(pobre);
    assert.equal(corto.caja, 100);
    assert.match(pobre!.texto, /llega mañana 7:30/);
    assert.match(pobre!.texto, /Caja libre/);
    assert.doesNotMatch(pobre!.texto, /Al tocar Pedir/);
    assert.doesNotMatch(pobre!.texto, /Ni con el adelanto/);
    const cuenta = cuentaPedido(corto, pobre!.total);
    if (cuenta.usaAdelanto) assert.match(pobre!.texto, /Usa el adelanto de Doña Carmen/);
    else assert.match(pobre!.texto, /No alcanza para la nómina de hoy/);
    const err = aceptarSita(corto);
    assert.notEqual(err, null);
    assert.equal(corto.pedidos.length, 0);
    assert.ok(corto.sita?.oferta);
    if (cuenta.usaAdelanto) {
      assert.equal(adelantar(corto, pobre!.total), null);
      assert.equal(aceptarSita(corto), null);
      assert.equal(corto.pedidos.length, 1);
    }

    const nom = nueva(1);
    firmar(nom);
    contratar(nom, nom.candidatos[0]!.id);
    nom.minuto = 15 * 60 - 1;
    nom.panel = null;
    nom.lluvias = [];
    avanzarMinutos(nom, 1);
    const avisoNom = nom.avisos.find((a) => a.texto.startsWith("Se fueron"));
    assert.ok(avisoNom);
    assert.match(avisoNom!.texto, /^Se fueron a las 3\. Nómina: −P\$[\d,]+\. Herramienta: −P\$[\d,]+\.$/);
    assert.ok(nom.diario.some((d) => d.texto.startsWith("Nómina: −") && d.texto.includes("Herramienta: −")));

    const muro = nueva(1);
    firmar(muro);
    muro.etapa = 2;
    muro.minuto = 15 * 60;
    muro.lluvias = [];
    vaciar(muro);
    assert.equal(cuello(muro), "Se fueron a las 3. Mañana sigue: Armar acero de zapata · falta Varilla 3/8");
    muro.inv.v38 = { q: 40, valor: 0 };
    muro.inv.v14 = { q: 20, valor: 0 };
    muro.inv.alambre = { q: 20, valor: 0 };
    muro.inv.grava = { q: 2, valor: 0 };
    const sigue = cuello(muro);
    assert.match(sigue, /^Se fueron a las 3\. Mañana sigue: /);
    assert.equal(sigue.includes("falta Varilla"), false);
  });

  it("la zapata con 3 fundas pide solo lo de esa etapa", () => {
    const s = nueva(1);
    firmar(s);
    s.etapa = 3;
    s.minuto = 14 * 60;
    for (const m of COMPRA) s.inv[m] = { q: 0, valor: 0 };
    s.inv.cemento = { q: 3, valor: 1650 };
    s.inv.agua = { q: 1, valor: 0 };
    s.entrada = {};
    s.pedidos = [];
    s.lluvias = [];
    s.panel = null;
    contratar(s, s.candidatos[0]!.id);
    const g = s.gente[0] ?? s.reserva[0];
    if (g) {
      g.activo = false;
      g.falto = true;
    }
    avanzarMinutos(s, 1);
    const nota = s.sita.oferta?.texto ?? "";
    assert.match(nota, /^Para mañana faltan:/);
    assert.match(nota, /Cemento: hace falta 10, hay 3, vienen 0, pido 7/);
    const principal = nota.split("Para la siguiente")[0] ?? nota;
    assert.doesNotMatch(principal, /plywood|pino|block/i);
    assert.match(nota, /Para la siguiente etapa \(opcional\):/);
    assert.match(nota, /Block: hace falta/);
    const notas = s.bitacora.filter((a) => a.clase === "nota" && a.texto.includes("Para mañana faltan"));
    assert.equal(notas.length, 1);
    s.aviso14 = false;
    if (s.sita) s.sita.oferta = null;
    avanzarMinutos(s, 0);
    assert.equal(s.bitacora.filter((a) => a.clase === "nota" && a.texto.includes("Para mañana faltan")).length, 1);
  });

  it("la pista y Espacio achican lo mismo", () => {
    const s = nueva(1);
    firmar(s);
    s.panel = null;
    s.lluvias = [];
    s.etapa = 1;
    s.minuto = 8 * 60;
    s.tut.fin = true;
    s.jugador = { x: SITIOS.oficina.x, y: SITIOS.oficina.y };
    s.extras.push({
      id: "achicar-t",
      etapa: 1,
      k: "achicar",
      nombre: "Achicar la zanja",
      q: 2,
      hecho: 0,
      bloquea: true,
      partida: "excavacion",
    });
    const pe = s.candidatos.find((c) => c.oficio === "peon")!;
    contratar(s, pe.id);
    asignar(s, pe.id, "obra");
    const g = s.gente[0]!;
    const puesto = ancla(s, g);
    assert.ok(puesto);
    g.x = puesto.x;
    g.y = puesto.y;
    const lejos = queHaceEspacio(s);
    assert.equal(lejos.verbo, "Camina a la zanja");
    assert.equal(lejos.detalle, "Achicar 0/2");
    assert.equal(lejos.hacer, "zanja");
    const f = golpe(s, true);
    assert.match(f?.texto ?? "", /Camina a la zanja/);
    assert.equal(s.panel, null);
    assert.equal(s.extras[0]!.hecho, 0);
    for (let i = 0; i < 40; i++) {
      avanzarMinutos(s, 1);
      if (s.panel && s.panel !== "perdida") s.panel = null;
    }
    const rendido = s.extras[0]!.hecho;
    assert.ok(rendido > 0.2, "el peón achicó " + rendido);
    s.jugador = { x: SITIOS.obra.x, y: SITIOS.obra.y };
    const cerca = queHaceEspacio(s);
    assert.equal(cerca.verbo, "Achicar");
    assert.match(cerca.detalle, /Achicar|\/2/);
    golpe(s, true);
    const conUno = s.extras[0]!.hecho;
    const extra = conUno - rendido;
    assert.ok(extra > 0, "el golpe no achicó");
    assert.ok(extra <= rendido * 0.25 + 0.02, `extra ${extra} sobre ${rendido}`);
    for (let k = 0; k < 8; k++) golpe(s, true);
    const extraTodo = s.extras[0]!.hecho - rendido;
    assert.ok(extraTodo <= rendido * 0.25 + 0.02, `spam ${extraTodo} sobre ${rendido}`);
    assert.ok(extraTodo <= extra + TAREAS.achicar.golpe * 1.25 + 1e-6);
    s.extras[0]!.hecho = 0;
    s.lluvias = [{ dia: s.dia, ini: 7 * 60, fin: 18 * 60, prob: 1, cae: true }];
    s.minuto = 12 * 60;
    const lluvia = golpe(s, true);
    assert.match(lluvia?.texto ?? "", /Sigue lloviendo/);
    assert.equal(s.extras[0]!.hecho, 0);
  });

  it("la caja libre escribe la resta", () => {
    const s = nueva(1);
    firmar(s);
    s.caja = 6423;
    const gente = s.gente;
    s.gente = [
      {
        ...s.candidatos[0]!,
        activo: true,
        falto: false,
        fuera: false,
      },
    ];
    const uno = nominaPendiente(s);
    s.gente = gente;
    assert.equal(textoCajaLibre(s), `Caja libre ${peso(6423)}`);
    s.gente = [
      {
        ...s.candidatos[0]!,
        activo: true,
        falto: false,
        fuera: false,
      },
    ];
    const nom = nominaPendiente(s);
    assert.ok(nom > 0);
    assert.equal(textoCajaLibre(s), `Caja libre ${peso(6423 - nom)} = caja ${peso(6423)} menos nómina de hoy ${peso(nom)}`);
    assert.equal(uno, nom);
  });

  it("un sábado el pedido llega el lunes", () => {
    const s = nueva(1);
    firmar(s);
    s.dia = 6;
    assert.equal(esSabado(s.dia), true);
    assert.equal(textoLlegada(s, false), "llega el lunes 7:30");
    s.dia = 2;
    assert.equal(textoLlegada(s, false), "llega mañana 7:30");
  });

  it("una tanda sobrante no pide arena", () => {
    const s = nueva(1);
    firmar(s);
    s.etapa = 4;
    s.panel = null;
    s.lluvias = [];
    for (const r of s.runs[4] ?? []) r.hecho = 10000;
    s.mezclas = [{ tipo: "H", prog: 1, lista: true, vida: 90, costo: 100, restante: 1 }];
    for (const m of COMPRA) s.inv[m] = { q: 0, valor: 0 };
    s.entrada = {};
    s.pedidos = [];
    assert.equal(cuelloLabor(s), "Sobró una tanda en el trompo");
    assert.equal(loQueFalta(s).arena, undefined);
    assert.equal(loQueFalta(s).cemento, undefined);
    assert.doesNotMatch(cuelloLabor(s), /arena|Arena/);
  });

  it("con material en la entrada alguien acarrea", () => {
    const s = nueva(1);
    firmar(s);
    s.panel = null;
    s.lluvias = [];
    s.etapa = 2;
    s.minuto = 8 * 60;
    for (const m of COMPRA) s.inv[m] = { q: 0, valor: 0 };
    s.entrada = { v38: { q: 26, valor: 0 } };
    s.pedidos = [];
    const pe = s.candidatos.find((c) => c.oficio === "peon")!;
    contratar(s, pe.id);
    const g = s.gente.find((p) => p.id === pe.id)!;
    asignar(s, g.id, "obra");
    assert.notEqual(g.puesto, "acarreo");
    assert.equal(laborDe(s, g), "acarreo");
  });

  it("el teléfono abierto no mueve el reloj", () => {
    const s = nueva(1);
    firmar(s);
    contratar(s, s.candidatos[0]!.id);
    s.panel = "oficina";
    s.oficinaTab = "telefono";
    const min = s.minuto;
    tick(s, 60);
    assert.equal(s.minuto, min);
    assert.equal(s.panel, "oficina");
  });

  it("informe semilla 1", () => {
    const a = jugar(1);
    const n = jugarNovato(1);
    console.log(
      "SEED1_ATENTO",
      JSON.stringify({
        dia: a.s.dia,
        diasTrabajados: a.s.diasTrabajados,
        costo: a.inf.costo,
        ganancia: a.inf.ganancia,
        caja: a.s.caja,
        entregada: a.s.entregada,
      }),
    );
    console.log(
      "SEED1_NOVATO",
      JSON.stringify({
        dia: n.s.dia,
        diasTrabajados: n.s.diasTrabajados,
        costo: n.inf.costo,
        ganancia: n.inf.ganancia,
        caja: n.s.caja,
        entregada: n.s.entregada,
      }),
    );
  });

  it("diez semillas: tiempo muerto por causa", () => {
    const auto = [];
    const quieto = [];
    for (let seed = 1; seed <= 10; seed++) {
      const a = jugar(seed);
      const q = jugarQuieto(seed);
      for (const r of [a, q]) {
        const suma = partesMuerto(r.s).reduce((n, p) => n + p.pesos, 0);
        assert.ok(Math.abs(suma - r.s.costos.muerto.mo) < 1, `${seed} ${suma} vs ${r.s.costos.muerto.mo}`);
        const porDia = new Map<number, number>();
        for (const d of r.s.diario) {
          if (!d.texto.startsWith("Adelanto de Doña Carmen")) continue;
          porDia.set(d.dia, (porDia.get(d.dia) ?? 0) + 1);
        }
        for (const [dia, n] of porDia) assert.ok(n <= 1, `semilla ${seed} día ${dia} adelantos ${n}`);
        assert.ok(Math.abs(pesosFirmados(r.s) - r.s.caja) < 40, `cuadre ${seed} ${pesosFirmados(r.s)} vs ${r.s.caja}`);
      }
      auto.push(a);
      quieto.push(q);
    }
    reporteMuerto("auto", auto);
    reporteMuerto("quieto", quieto);
  });
});

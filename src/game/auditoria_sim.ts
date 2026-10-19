import assert from "node:assert/strict";

import { CONTRATO, DIRECCION_DIA, ETAPAS, FLETE, FLETE_URGENTE, HERRAMIENTA, MATERIALES, NOTA_ESCUADRA, POR_HILADA, RECETA_H, RECETA_M, SITIOS, BLOCKS_MURO, COMPRA, TAREAS, TUTORIAL, esSabado, horaDe, jornalDe, peso, type Puesto, type Mat } from "./datos.ts";
import {
  abrirDespacho,
  accion,
  aceptarSita,
  adelantar,
  fiar,
  puedeFiar,
  pedidoQueCabe,
  almacen,
  ancla,
  asignar,
  cajaLibre,
  confirmarDespacho,
  continuarSello,
  confirmarNomina,
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
  textoFaltaNomina,
  nueva,
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
  tramos,
  trianguloEscuadra,
  validar,
  avanzarMinutos,
  cuadrillaSugerida,
  diasDeCaja,
  type Estado,
} from "./motor.ts";

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
    if (s.panel === "nomina") confirmarNomina(s, true);
    if (s.panel === "sello") continuarSello(s);
    if (s.panel === "finde") {
      let n = 0;
      while (cajaLibre(s) < 5000 && n < 4 && adelantar(s) === null) n++;
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
    if (s.panel === "nomina") confirmarNomina(s, true);
    if (s.panel === "sello") continuarSello(s);
    if (s.panel === "finde") {
      let n = 0;
      while (cajaLibre(s) < 5000 && n < 4 && adelantar(s) === null) n++;
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
    if (s.panel === "nomina") confirmarNomina(s, true);
    if (s.panel === "sello") continuarSello(s);
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

export function jugarPasivo(seed: number) {
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
    if (s.panel === "nomina") confirmarNomina(s, true);
    if (s.panel === "sello") continuarSello(s);
    if (s.panel === "finde") siguienteDia(s);
    if (`${s.panel}` === "perdida") break;
    if (s.sita?.oferta) aceptarSiAlcanza(s);
    if (s.panel && s.panel !== "informe" && `${s.panel}` !== "perdida") s.panel = null;
    if (s.entregada || `${s.panel}` === "perdida") break;
    tick(s, 0.2);
  }
  return { s, inf: informe(s) };
}

function sitioAtento(minuto: number): { x: number; y: number } {
  const hora = Math.floor(minuto / 60) % 3;
  if (hora === 0) return SITIOS.oficina;
  if (hora === 1) return SITIOS.ferreteria;
  return SITIOS.sombra;
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

export function jugarAtento(seed: number, cupo: number, torpe = false) {
  const s = nueva(seed);
  firmar(s);
  // v16: el atento contrata primero 2 albañiles; el torpe toma los primeros de la lista.
  const albaniles = torpe ? [] : s.candidatos.filter((c) => c.oficio === "albanil").slice(0, 2);
  const orden = [...albaniles, ...s.candidatos.filter((c) => !albaniles.includes(c))];
  for (const c of orden.slice(0, cupo)) contratar(s, c.id);
  for (const g of s.gente) asignar(s, g.id, "obra");
  s.jugador = { x: SITIOS.obra.x, y: SITIOS.obra.y };
  s.destino = null;
  s.tut.fin = true;
  let guard = 0;
  let pedidoClave = "";
  let ultimoGolpe = -1;
  let diaMuros = 0;
  let diaBlock = 0;
  while (!s.entregada && `${s.panel}` !== "perdida" && guard < 80000) {
    guard++;
    if (s.etapa >= 5 && !diaMuros) diaMuros = s.dia;
    if (s.panel === "nomina") confirmarNomina(s, true);
    if (s.panel === "sello") continuarSello(s);
    if (s.etapa >= 5 && !diaMuros) diaMuros = s.dia;
    if (s.panel === "finde") {
      let n = 0;
      while (cajaLibre(s) < 5000 && n < 4 && adelantar(s) === null) n++;
      siguienteDia(s);
      pedidoClave = "";
    }
    if (`${s.panel}` === "perdida") break;
    if (s.sita?.oferta) aceptarActual(s);
    if (s.panel && s.panel !== "informe") s.panel = null;
    if (s.entregada) break;
    const enObra = s.minuto % 60 < 30 && s.minuto < 15 * 60;
    const sitio = enObra ? SITIOS.obra : sitioAtento(s.minuto);
    s.jugador = { x: sitio.x, y: sitio.y };
    s.destino = null;
    const clave = `${s.dia}:${s.etapa}`;
    const pide = clave !== pedidoClave && s.minuto >= 7 * 60 && s.minuto < 15 * 60 && Object.keys(loQueFalta(s)).length > 0;
    if (pide) {
      pedirAtento(s);
      pedidoClave = clave;
    }
    if (s.minuto < 15 * 60 && (s.minuto % 15 === 0 || laborCambia(s))) gestionar(s, false, cupo, false, true);
    if (s.minuto < 7 * 60 + 8) silenciar(s);
    let yaGolpe = false;
    if (enObra && s.plomo) {
      golpe(s, true);
      yaGolpe = true;
      ultimoGolpe = s.minuto;
    }
    if (enObra && !yaGolpe && s.minuto % 10 === 0 && s.minuto !== ultimoGolpe && s.minuto < 15 * 60) {
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

// ======== AUDITORÍA V16 ========
export type Clima = "poca" | "normal" | "mucha";
const PRECIO_BASE: Record<string, number> = Object.fromEntries(Object.entries(MATERIALES).map(([k, v]) => [k, v.precio]));
function rngDe(seed: number) { let a = (seed * 2654435761) >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export function ponerPrecios(seed: number, factor: number | null) {
  const r = rngDe(seed + 999);
  for (const k of Object.keys(MATERIALES)) (MATERIALES as any)[k].precio = factor === null ? PRECIO_BASE[k] : Math.round(PRECIO_BASE[k]! * (1 + (r() * 2 - 1) * factor) * 100) / 100;
}
export function ponerClima(s: Estado, clima: Clima) {
  if (clima === "normal") return;
  // v16: mismo modelo que el juego (días y horas al azar, cae con la probabilidad anunciada), con otra frecuencia.
  const r = rngDe(s.seed + 77);
  const out = [] as Estado["lluvias"];
  const pDia = clima === "poca" ? 0.07 : 0.4;
  for (let d = 2; d <= 48 && out.length < (clima === "poca" ? 2 : 12); d++) {
    if (d % 7 === 0 || r() >= pDia) continue;
    const ini = 9 * 60 + Math.floor(r() * 390); const dur = 60 + Math.floor(r() * 121);
    const prob = clima === "poca" ? 30 + Math.floor(r() * 31) : 50 + Math.floor(r() * 41);
    out.push({ dia: d, ini, fin: Math.min(ini + dur, 18 * 60 - 1), prob, cae: r() * 100 < prob });
  }
  s.lluvias = out;
}
function esDom(d: number) { return d % 7 === 0; }

export interface Cfg {
  nombre: string;
  cupo: number;
  orden: "lista" | "albaniles" | "baratos" | "azar";
  horaPedido: number; // minuto del día en que pide
  siguiente: boolean;
  olvido: number; // prob. de no pedir en el día
  errorPuesto: number; // prob. por revisión de dejar a todos en obra
  golpeCada: number; // minutos
  fallaPlomo: number; // prob. de no atender el plomo
  urgente: boolean;
  soloSita: boolean;
  cortarTemprano: boolean;
  /** v18: contrata la cuadrilla sugerida y hace caso al aviso de días de caja. */
  sugerida?: boolean;
  /** v20: juega como el revisor a mano: no reserva nómina, usa «Pedir lo que alcanza» y toma la salida (fiado) cuando aparece. */
  torpe?: boolean;
  /** v23: tiempo de reacción relativo (1 = humano normal; 3 = un tercio de la velocidad). Revisa la obra, pide y plomea más tarde. */
  reaccion?: number;
  /** v26: juega sin peón ni ayudante (solo oficiales) y empieza con la caja en P$0. Tiene que entregar igual. */
  sinAyuda?: boolean;
}
export const BOTS: Record<string, Cfg> = {
  principiante: { nombre: "principiante", cupo: 3, orden: "azar", horaPedido: 11 * 60, siguiente: false, olvido: 0.3, errorPuesto: 0.25, golpeCada: 20, fallaPlomo: 0.35, urgente: true, soloSita: false, cortarTemprano: false },
  intermedio: { nombre: "intermedio", cupo: 4, orden: "lista", horaPedido: 7 * 60, siguiente: true, olvido: 0.1, errorPuesto: 0.08, golpeCada: 10, fallaPlomo: 0.1, urgente: false, soloSita: false, cortarTemprano: true },
  // v19: con bono por entrega temprana, el experto apuesta a 4 con 2 albañiles para entregar antes.
  experto: { nombre: "experto", cupo: 4, orden: "albaniles", horaPedido: 7 * 60, siguiente: true, olvido: 0, errorPuesto: 0, golpeCada: 5, fallaPlomo: 0, urgente: false, soloSita: false, cortarTemprano: true },
};
/** v26: el caso del Revisor en la v25: solo albañiles (y otros oficiales), sin peón ni ayudante, y la caja en P$0. */
export const BOT_SIN_AYUDA: Cfg = { nombre: "sinAyuda", cupo: 3, orden: "albaniles", horaPedido: 7 * 60, siguiente: false, olvido: 0, errorPuesto: 0, golpeCada: 10, fallaPlomo: 0, urgente: false, soloSita: false, cortarTemprano: false, torpe: true, sinAyuda: true };
const esAyudaOf = (of: string) => of === "peon" || of === "ayudante";
export const ESTRATEGIAS: Record<string, Cfg> = {
  A_dos_albaniles_c4: { ...BOTS.experto!, nombre: "A 2 albañiles, cuadrilla 4", cupo: 4 },
  B_grande_c7: { ...BOTS.experto!, nombre: "B cuadrilla 7", cupo: 7 },
  C_minima_c3: { ...BOTS.experto!, nombre: "C cuadrilla 3 barata", cupo: 3, orden: "baratos" },
  D_justo_a_tiempo: { ...BOTS.experto!, nombre: "D compra justo a tiempo (sin etapa siguiente)", siguiente: false },
  E_solo_sita: { ...BOTS.experto!, nombre: "E solo acepta a Sita", soloSita: true },
};

export type Chequeo = (s: Estado, paso: string) => void;

export function correr(seed: number, cfg0: Cfg, clima: Clima = "normal", precios: number | null = null, chequeo?: Chequeo, inicio?: Estado, hastaEtapa = 99) {
  let cfg = cfg0;
  ponerPrecios(seed, precios);
  const r = rngDe(seed * 31 + cfg.nombre.length);
  if (inicio) return seguirDesde(inicio, cfg, r, chequeo, hastaEtapa);
  const s = nueva(seed);
  ponerClima(s, clima);
  firmar(s);
  chequeo?.(s, "firmar");
  let cand = [...s.candidatos];
  if (cfg.sinAyuda) {
    cand = cand.filter((c) => !esAyudaOf(c.oficio));
    // La caja se vacía a mano: lo quitado se anota aparte para que el cuadre lo descuente.
    (s as Estado & { quitadoBot?: number }).quitadoBot = s.caja;
    s.caja = 0;
  }
  if (cfg.orden === "albaniles") { const a = cand.filter((c) => c.oficio === "albanil").slice(0, 2); cand = [...a, ...cand.filter((c) => !a.includes(c))]; }
  if (cfg.orden === "baratos") cand.sort((a, b) => jornalDe(a.oficio, a.rinde) - jornalDe(b.oficio, b.rinde));
  if (cfg.orden === "azar") cand.sort(() => r() - 0.5);
  if (cfg.sugerida) { const sug = cuadrillaSugerida(s); for (const id of sug.ids) contratar(s, id); cfg = { ...cfg, cupo: s.gente.length + s.reserva.length }; }
  else for (const c of cand.slice(0, cfg.cupo)) contratar(s, c.id);
  for (const g of s.gente) asignar(s, g.id, "obra");
  s.jugador = { x: 19, y: 14.5 };
  s.tut.fin = true;
  return seguirDesde(s, cfg, r, chequeo, 99);
}

/** v21: juega desde un estado dado (p. ej. la partida real del revisor) hasta entregar o hasta pasar `hastaEtapa`. */
export function seguirDesde(s: Estado, cfg: Cfg, r: () => number, chequeo?: Chequeo, hastaEtapa = 99) {
  const seed = s.seed;
  const R = Math.max(1, cfg.reaccion ?? 1);
  let plomoVisto = -1;
  let guard = 0, pedidoDia = -1, olvidoHoy = false, diaOlvido = -1, diaAviso = -1, diaSalida = -1, sinSalida = 0;
  const T = (p: string) => chequeo?.(s, p);
  while (!s.entregada && guard < 80000 && s.etapa <= hastaEtapa) {
    guard++;
    if (s.panel === "nomina") confirmarNomina(s, true);
    if (s.panel === "sello") { continuarSello(s); T("sello"); }
    if (s.panel === "finde") { let n = 0; while (cajaLibre(s) < 5000 && n < 4 && adelantar(s) === null) { n++; T("adelanto"); } siguienteDia(s); T("siguienteDia"); }
    if (`${s.panel}` === "perdida") break;
    if (s.sita?.oferta && (cfg.soloSita || r() < 0.3)) { aceptarSiAlcanza(s); T("sita"); }
    if (s.panel && s.panel !== "informe") s.panel = null;
    if (s.entregada) break;
    if (diaOlvido !== s.dia) { diaOlvido = s.dia; olvidoHoy = r() < cfg.olvido; }
    if (cfg.sugerida && diaAviso !== s.dia) {
      diaAviso = s.dia;
      // Hace caso al aviso «Te quedan X días de caja»: con 1 día o menos, da libre al peón más caro.
      if (s.avisos.some((x) => x.texto.startsWith("Te quedan")) && diasDeCaja(s) <= 1) {
        const p = s.gente.filter((g) => !g.libre && (g.oficio === "peon" || g.oficio === "ayudante")).sort((a, b) => jornalDe(b.oficio, b.rinde) - jornalDe(a.oficio, a.rinde))[0];
        if (p && s.gente.filter((g) => !g.libre).length > 2) marcarLibre(s, p.id, true);
      }
    }
    if (!cfg.soloSita && !olvidoHoy && s.minuto >= cfg.horaPedido + 15 * (R - 1) && s.minuto < cfg.horaPedido + 15 * R && pedidoDia !== s.dia) {
      gestionarCfg(s, cfg, r, true); pedidoDia = s.dia; T("pedido");
    } else if (s.minuto < 15 * 60 && (s.minuto % (15 * R) === 0 || (R === 1 && laborCambia(s)))) gestionarCfg(s, cfg, r, false);
    if (s.minuto < 7 * 60 + 8) silenciar(s);
    if (cfg.torpe && puedeFiar(s) && s.minuto % 30 === 0) { fiar(s); T("fiar"); }
    // v23: cualquier jugador que ve «Siempre hay salida» (falta material, no viene nada y la caja no lo paga) toma el fiado.
    // Antes solo el torpe lo hacía y algunas obras quedaban trabadas hasta el día 60 con P$0 de caja.
    else if (!cfg.torpe && s.minuto % (30 * R) === 0 && s.minuto >= 8 * 60 && s.minuto < 14 * 60 && !s.pedidos.length && puedeFiar(s)) {
      const falta = loQueFalta(s);
      const costo = Object.entries(falta).reduce((a, [k, n]) => a + (n ?? 0) * MATERIALES[k as Mat].precio, 0) + FLETE;
      if (Object.keys(falta).length && s.caja < costo && !puedeAdelantar(s, costo)) { fiar(s); T("fiar"); }
    }
    if (s.minuto === 10 * 60 && diaSalida !== s.dia) {
      diaSalida = s.dia;
      // Sin salida: falta material, no viene nada, la caja no lo paga y no hay adelanto ni fiado.
      const falta = loQueFalta(s);
      const costo = Object.entries(falta).reduce((a, [k, n]) => a + (n ?? 0) * MATERIALES[k as Mat].precio, 0) + FLETE;
      if (Object.keys(falta).length && !s.pedidos.length && s.caja < costo && !puedeAdelantar(s, costo) && !puedeFiar(s) && !s.entregada) sinSalida++;
    }
    // v23: el lento tarda 5 min × reacción en ver «Toca plomear» y caminar al muro.
    if (s.plomo && plomoVisto < 0) plomoVisto = s.dia * 1440 + s.minuto;
    if (!s.plomo) plomoVisto = -1;
    const plomoTarde = R > 1 && s.plomo && s.dia * 1440 + s.minuto - plomoVisto < 5 * R;
    if (!plomoTarde && (s.plomo || (s.curando && !s.regadoHoy && s.curadoDias.length < 7)) && s.minuto < 17 * 60 && !(s.plomo && r() < cfg.fallaPlomo / 30)) { s.jugador = { x: 19, y: 14.5 }; golpe(s, true); }
    if (s.minuto % cfg.golpeCada === 0 && s.minuto < 15 * 60) { s.jugador = { x: 19, y: 14.5 }; golpe(s, false); }
    tick(s, 0.2);
    T("tick");
    if (ver(s) === "sello") continue;
    if (cfg.cortarTemprano && s.minuto >= 15 * 60 + 8 && s.nominaPagada && !s.panel) {
      const c = cuelloLabor(s);
      const muro = s.etapa === 4 && s.blocksHoy >= 180;
      if (c.includes("fragua") || c.includes("Fragua") || c.includes("hiladas") || muro || (c.includes("Curado") && s.etapa >= 7)) { terminarJornada(s); T("terminar"); }
    } else if (!cfg.cortarTemprano && s.minuto >= 15 * 60 + 8 && s.nominaPagada && !s.panel && s.minuto >= 17 * 60 + 50) { /* deja correr */ }
  }
  ponerPrecios(seed, null);
  return { s, guard, inf: informe(s), perdida: `${s.panel}` === "perdida", sinSalida };
}

function pedirCfg(s: Estado, items: Record<string, number | undefined>, urg: boolean, cfg?: Cfg) {
  if (!Object.keys(items).length) return;
  if (cfg?.torpe) {
    // «Pedir lo que alcanza»: paga con la caja aunque la nómina quede corta; si no cabe todo, pide lo que cabe.
    if (pedir(s, items, false) === null) return;
    if (puedeAdelantar(s)) { adelantar(s); if (pedir(s, items, false) === null) return; }
    const cabe = pedidoQueCabe(s, items as never, false, s.caja);
    if (Object.keys(cabe).length) pedir(s, cabe, false);
    return;
  }
  const total = costoDe(items) + (urg ? FLETE_URGENTE - FLETE : 0);
  let err = pedir(s, items, urg);
  if (err && /12/.test(err)) { urg = false; err = pedir(s, items, false); }
  if (err && err.includes("nómina") && puedeAdelantar(s, total)) { adelantar(s, total); err = pedir(s, items, urg); }
  if (err && err.includes("nómina")) {
    const half: typeof items = {};
    for (const k of Object.keys(items)) half[k] = Math.max(MATERIALES_PASO(k), (items[k] ?? 0) / 2);
    pedir(s, half, urg);
  }
}

function gestionarCfg(s: Estado, cfg: Cfg, r: () => number, conPedido: boolean) {
  // v16: si la pantalla pide un albañil o varillero y no hay, contrata uno (lo que haría un jugador que lee el aviso).
  if (s.avisos.some((a) => a.texto.includes("Contrata uno"))) {
    const equipo = [...s.gente, ...s.reserva];
    if (!equipo.some((g) => g.oficio === "albanil")) {
      const c = s.candidatos.find((x) => x.oficio === "albanil");
      if (c) contratar(s, c.id);
    }
  }
  for (const c of [...s.candidatos]) { if (cfg.sinAyuda && esAyudaOf(c.oficio)) continue; if (s.gente.length + s.reserva.length >= cfg.cupo) break; if (contratar(s, c.id)) break; }
  if (r() < cfg.errorPuesto / 4) { for (const g of s.gente) asignar(s, g.id, "obra"); }
  else {
    const vivos = s.gente.filter((g) => g.activo && !g.falto && !g.fuera);
    const batir = puedeBatir(s), carga = hayCarga(s);
    let batea = 0, acarreo = 0;
    for (const g of vivos) {
      let puesto: Puesto = "obra";
      const peon = g.oficio === "peon" || g.oficio === "ayudante";
      if (peon && batir && batea < (carga ? 1 : 2)) { puesto = "batea"; batea++; }
      else if (peon && carga && acarreo < 2) { puesto = "acarreo"; acarreo++; }
      asignar(s, g.id, puesto);
    }
  }
  if (conPedido) {
    pedirCfg(s, loQueFalta(s), cfg.urgente && s.minuto < 12 * 60, cfg);
    if (cfg.siguiente) pedirCfg(s, loQueFaltaSiguiente(s), false, cfg);
  }
  if (s.curando && s.curadoDias.length < 7 && s.etapa >= 8) for (const g of s.gente) marcarLibre(s, g.id, true);
}

/** Auditoría v16: cada peso de cada paso. */
export function libroDe(s: Estado) {
  let costos = 0;
  for (const c of Object.values(s.costos)) costos += c.mo + c.mat;
  let inv = 0;
  for (const m of Object.keys(s.inv) as Mat[]) inv += s.inv[m].valor;
  let entrada = 0;
  for (const v of Object.values(s.entrada)) entrada += v?.valor ?? 0;
  let camino = 0;
  for (const p of s.pedidos) for (const [k, n] of Object.entries(p.items)) camino += (n ?? 0) * MATERIALES[k as Mat].precio;
  // Mano de obra que ya entró al costo pero se paga a las 3.
  let porPagar = 0;
  if (!s.nominaPagada) for (const g of s.gente) if (g.activo && !g.falto) porPagar += g.moHoy;
  const cargas = -porPagar;
  let mezclas = 0;
  for (const m of s.mezclas) mezclas += m.costo * m.restante;
  return { costos, inv, entrada, camino, cargas, mezclas, gastado: costos + inv + entrada + camino + cargas + mezclas };
}

export function auditor() {
  const hallazgos = new Map<string, { n: number; ej: string }>();
  const anota = (k: string, ej: string) => { const h = hallazgos.get(k); if (h) h.n++; else hallazgos.set(k, { n: 1, ej }); };
  let avisoHoy = -1;
  let fletesVistos = 0;
  let pedidosVistos = new Set<string>();
  let adelantoNeto = 0;
  let cajaAntes = NaN, cobradoAntes = NaN, adelAntes = 0;
  const chequeo: Chequeo = (s, paso) => {
    const L = libroDe(s);
    const diff = s.caja - (s.cobrado + (s.fiado ?? 0) - L.gastado);
    if (Math.abs(diff) > 1) anota(`caja ≠ cobrado − gastado (${paso})`, `semilla ${s.seed} día ${s.dia} ${Math.floor(s.minuto / 60)}:${String(s.minuto % 60).padStart(2, "0")} diferencia ${diff.toFixed(2)} ${JSON.stringify(Object.fromEntries(Object.entries(L).map(([k, v]) => [k, Math.round(v)])))}`);
    if (textoFaltaNomina(s)) avisoHoy = s.dia;
    // la nómina se paga: ¿quedó la caja en rojo sin aviso previo?
    if (s.nominaPagada && s.caja < -0.5 && avisoHoy !== s.dia) anota("nómina sin cubrir y sin aviso", `semilla ${s.seed} día ${s.dia} caja ${Math.round(s.caja)}`);
    if (s.nominaPagada && s.caja < -0.5) anota("nómina pagada con caja en rojo (con aviso)", `semilla ${s.seed} día ${s.dia} caja ${Math.round(s.caja)}`);
    // pedidos nuevos
    for (const p of s.pedidos) if (!pedidosVistos.has(p.id)) {
      pedidosVistos.add(p.id);
      if (!s.nominaPagada && s.caja - nominaPendiente(s) < -0.5) anota("un pedido dejó la nómina sin cubrir", `semilla ${s.seed} día ${s.dia} libre ${Math.round(s.caja - nominaPendiente(s))}`);
      if (p.flete !== (p.urgente ? 3000 : 1500)) anota("flete distinto a la tarifa", `${p.id} ${p.flete}`);
    }
    if (s.stats.fletes !== pedidosVistos.size && s.stats.fletes !== fletesVistos) fletesVistos = s.stats.fletes;
    // adelanto
    if (s.adelanto < -0.5) anota("adelanto negativo", `semilla ${s.seed} ${s.adelanto}`);
    if (!Number.isNaN(cajaAntes)) {
      const dAdel = s.adelanto - adelAntes;
      if (dAdel > 0.5) adelantoNeto += dAdel;
      const dCob = s.cobrado - cobradoAntes;
      if (dCob < -0.5) anota("cobrado bajó", `semilla ${s.seed} día ${s.dia} ${dCob}`);
    }
    cajaAntes = s.caja; cobradoAntes = s.cobrado; adelAntes = s.adelanto;
    if (s.cobrado - (s.precio || 300000) > 0.5) anota("cobrado mayor que el precio", `semilla ${s.seed} ${s.cobrado}`);
    if (s.entregada && Math.abs(s.adelanto) > 0.5) anota("adelanto sin descontar al entregar", `semilla ${s.seed} quedan ${s.adelanto}`);
    if (s.entregada && Math.abs(s.cobrado - s.precio) > 0.5) anota("al entregar no se cobró el precio", `semilla ${s.seed} cobrado ${s.cobrado} precio ${s.precio}`);
  };
  const cierre = (s: Estado) => {
    const fl = s.costos.fletes.mat;
    void fl;
    pedidosVistos = new Set(); avisoHoy = -1; cajaAntes = NaN; adelAntes = 0;
  };
  return { chequeo, cierre, hallazgos };
}


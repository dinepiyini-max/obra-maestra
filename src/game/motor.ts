import {
  ANTICIPO,
  BOTE_TIERRA,
  BLOCKS_MURO,
  TROMPO_CUERPO,
  COMPRA,
  CONTRATO,
  CUADRILLA,
  DIRECCION_DIA,
  EFI,
  ETAPAS,
  FLETE,
  FLETE_URGENTE,
  FRASES_CANSANCIO,
  HERRAMIENTA,
  INICIO,
  JORNAL_BASE,
  KIT_PRECIO,
  MATERIALES,
  MATS,
  MAX_CUADRILLA,
  OFICIOS,
  OFICIO_NOMBRE,
  PARTIDAS,
  PARTIDA_NOMBRE,
  POR_HILADA,
  PRESUPUESTO,
  PRESUPUESTO_TOTAL,
  PUESTO_NOMBRE,
  PUESTO_SITIO,
  PUESTOS,
  RADIO,
  RADIO_LIDER,
  RECETA_H,
  RECETA_M,
  SITIOS,
  SOLAR,
  TAREAS,
  TOPE_BLOCK_DIA,
  TUTORIAL,
  VEL_CUADRILLA,
  VEL_MAESTRO,
  diaSemana,
  esDomingo,
  esSabado,
  hash2,
  horaDe,
  jornalDe,
  num,
  peso,
  type Cantidades,
  type EtapaDef,
  type Mania,
  type Mat,
  type Oficio,
  type Partida,
  type PersonaBase,
  type Puesto,
  type Tarea,
  type TrabajoDef,
} from "./datos.ts";

export type Panel =
  | null
  | "menu"
  | "contrato"
  | "oficina"
  | "cuadrilla"
  | "libreta"
  | "almacen"
  | "finde"
  | "informe"
  | "perdida"
  | "sello"
  | "pausa"
  | "sita"
  | "ferreteria";

export type OficinaTab = "gente" | "planos" | "telefono" | "diario" | "libreta";

export type ClaseApunte = "entro" | "salio" | "guardado" | "mojado" | "nota";

export interface Apunte {
  dia: number;
  min: number;
  clase: ClaseApunte;
  texto: string;
  lugar: string;
}

export type TipoCarga = "cemento" | "varilla" | "menudo" | "madera" | "zinc" | "block";

export interface Carga {
  id: string;
  tipo: TipoCarga;
  items: Cantidades;
  prog: number;
}

export interface Persona {
  id: string;
  nombre: string;
  apellido: string;
  mania: Mania;
  oficio: Oficio;
  rinde: number;
  aguante: number;
  ojo: number;
  cansancio: number;
  puesto: Puesto | null;
  x: number;
  y: number;
  activo: boolean;
  fuera: boolean;
  falto: boolean;
  libre: boolean;
  noViene: boolean;
  moHoy: number;
  aviso70: boolean;
  anim: string;
  trabajando: boolean;
  dias: number;
  /** Contador viejo. La caminata lo lee; no elige la labor. */
  esperaZona: number;
  enCruce: boolean;
}

export interface Run {
  id: string;
  hecho: number;
  ini: boolean;
}

export interface EtapaRun {
  sello: "aprobado" | "observado" | null;
  motivo: string;
  primera: boolean | null;
}

export interface Extra {
  id: string;
  etapa: number;
  k: Tarea;
  nombre: string;
  q: number;
  hecho: number;
  bloquea: boolean;
  mezcla?: "H" | "M";
  mezclaQ?: number;
  usa?: Cantidades;
  partida: Partida;
}

export interface Mezcla {
  tipo: "H" | "M";
  prog: number;
  lista: boolean;
  vida: number;
  costo: number;
  restante: number;
}

export interface Pedido {
  id: string;
  items: Cantidades;
  dia: number;
  minuto: number;
  flete: number;
  urgente: boolean;
}

export interface Lluvia {
  dia: number;
  ini: number;
  fin: number;
  prob: number;
}

export interface Sello {
  ok: boolean;
  motivo: string;
  etapa: number;
  pago: number;
  nombre: string;
}

export interface TutorialFlags {
  firma: boolean;
  parada: boolean;
  cuadrilla: boolean;
  trazo: boolean;
  pedido: boolean;
  arena: boolean;
  libreta: boolean;
  agua?: boolean;
  sita?: boolean;
  /** Paso de guía más alto ya mostrado. Solo sube. */
  visto?: number;
  fin: boolean;
}

export interface Estado {
  v: 1;
  seed: number;
  rng: number;
  dia: number;
  minuto: number;
  frac: number;
  firmado: boolean;
  entregada: boolean;
  pausa: boolean;
  panel: Panel;
  caja: number;
  cobrado: number;
  adelanto: number;
  costos: Record<Partida, { mo: number; mat: number }>;
  inv: Record<Mat, { q: number; valor: number }>;
  entrada: Partial<Record<Mat, { q: number; valor: number }>>;
  cargas: Carga[];
  bitacora: Apunte[];
  mojado: number;
  avisoNubes: boolean;
  aviso14: boolean;
  escuadraHasta: number;
  oficinaTab: OficinaTab;
  aguaNota: number;
  salidaPend: Partial<Record<string, number>>;
  cementoAfuera: number;
  gente: Persona[];
  candidatos: Persona[];
  reserva: Persona[];
  idSeq: number;
  etapas: EtapaRun[];
  runs: Run[][];
  extras: Extra[];
  etapa: number;
  pedidos: Pedido[];
  mezclas: Mezcla[];
  lluvias: Lluvia[];
  lluviaOn: boolean;
  achiques: string[];
  plomo: null | { umbral: number; min: number };
  plumbed: number[];
  blocksHoy: number;
  desplomes: number;
  desplomesCobrados: number;
  fragua: null | { dia: number; minuto: number; que: string };
  curando: boolean;
  curadoDias: number[];
  regadoHoy: boolean;
  regarProg: number;
  kitGastado: boolean;
  nominaPagada: boolean;
  direccionCobrada: boolean;
  /** Herramienta cobrada hoy con la nómina. No cambia el cobro: es lo que ya se restó. */
  herrHoy: number;
  /** Mezcla vencida desde las 15:00. El cargo sigue en su partida; esto solo se muestra. */
  mezclaTarde: number;
  mezclaTardeNota: boolean;
  /** Tierra aún junto a la zanja. No entra en la caja: inv.tierra sigue igual. */
  tierraMonton: number;
  /** Tierra ya botada al borde del solar. */
  tierraBote: number;
  /** Día en que Doña Carmen ya soltó el adelanto. Uno por día. */
  adelantoDia: number;
  /** Marca dia*10000+minuto de la última mezcla vencida. */
  morteroVencio: number;
  diasTrabajados: number;
  tut: TutorialFlags;
  diario: { dia: number; min: number; texto: string }[];
  avisos: { id: number; texto: string }[];
  avisoSeq: number;
  jugador: { x: number; y: number };
  yaw: number;
  vel: number;
  mando: { ax: number; ay: number };
  destino: { x: number; y: number } | null;
  /** Minutos de juego sin un Espacio del jugador en la obra o en el trompo. */
  sinGolpe: number;
  /** El golpe automático cuenta al maestro como líder. No se guarda como regla. */
  maestroLider?: boolean;
  gritos: { texto: string; x: number; y: number }[];
  sello: Sello | null;
  faltanManana: string[];
  stats: {
    compas: number;
    golpes: number;
    /** Golpes que dio el juego en la obra, porque el jugador no pegó. */
    golpesAuto?: number;
    golpesAutoHoy?: number;
    golpesAutoPorDia?: Record<string, number>;
    tandasPerdidas: number;
    costoPerdidas: number;
    faltas: number;
    fletes: number;
    rio: Partial<Record<Mat, number>>;
    aprobadasPrimera: number;
    sellos: number;
    muertoCausas?: { espera: number; lluvia: number; camino: number; resto: number };
    /** Horas-persona y pesos de tiempo muerto, por causa y por día. No cambia el cobro. */
    muertoDetalle?: Record<string, { min: number; pesos: number; dias: Record<string, { min: number; pesos: number }> }>;
    faltasLog?: { dia: number; min: number; quien: string; porque: string }[];
    costoMojado?: number;
    /** Minutos caminados. No entra en la caja ni en el costo. */
    caminata?: { zona: number; cruce: number; puesto: number; cruces: Record<string, number> };
  };
  sita: Sita;
}

export interface OfertaSita {
  items: Cantidades;
  urgente: boolean;
  mats: number;
  flete: number;
  total: number;
  texto: string;
}

export interface Sita {
  x: number;
  y: number;
  fase: "casa" | "yendo" | "nota" | "vuelta";
  oferta: OfertaSita | null;
  ultima: OfertaSita | null;
  rechazoDia: number;
  rechazoConParo: boolean;
  urgenteDia: number;
  paro: boolean;
  editando: boolean;
}

export interface Flotante {
  texto: string;
  x: number;
  y: number;
  oro: boolean;
}

interface W {
  id: string;
  k: Tarea;
  nombre: string;
  q: number;
  hecho: number;
  usa?: Cantidades;
  usaIni?: Cantidades;
  ini: boolean;
  mezcla?: "H" | "M";
  mezclaQ?: number;
  partida: Partida;
  soloMaestro?: boolean;
  reqCurado?: boolean;
  despuesDe?: string[];
  desdePct?: { id: string; pct: number };
  bloquea?: boolean;
  setHecho: (n: number) => void;
  setIni: () => void;
}

const UMBRALES = [3, 6, 9, 12].map((h) => h * POR_HILADA);

function clamp(n: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, n));
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function rngNext(s: Estado): number {
  let a = s.rng >>> 0;
  a = (a + 0x6d2b79f5) | 0;
  s.rng = a >>> 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function aviso(s: Estado, texto: string) {
  s.avisoSeq += 1;
  s.avisos.push({ id: s.avisoSeq, texto });
  if (s.avisos.length > 6) s.avisos.splice(0, s.avisos.length - 6);
}

function diario(s: Estado, texto: string) {
  s.diario.push({ dia: s.dia, min: s.minuto, texto });
  if (s.diario.length > 800) s.diario.splice(0, s.diario.length - 800);
}

export function quitarAviso(s: Estado, id: number) {
  s.avisos = s.avisos.filter((a) => a.id !== id);
}

function vacioInv(): Estado["inv"] {
  const inv = {} as Estado["inv"];
  for (const k of Object.keys(MATERIALES) as Mat[]) inv[k] = { q: 0, valor: 0 };
  return inv;
}

function vacioCostos(): Estado["costos"] {
  const c = {} as Estado["costos"];
  for (const p of PARTIDAS) c[p] = { mo: 0, mat: 0 };
  return c;
}

function personaDe(s: Estado, base: PersonaBase, i: number): Persona {
  return {
    id: "p" + ++s.idSeq,
    nombre: base.nombre,
    apellido: base.apellido,
    mania: base.mania,
    oficio: base.oficio,
    rinde: base.rinde,
    aguante: base.aguante,
    ojo: base.ojo,
    cansancio: 0,
    puesto: null,
    x: SITIOS.oficina.x + 1.35 + (i % 3) * 0.48,
    y: SITIOS.oficina.y + 1.15 + Math.floor(i / 3) * 0.42,
    activo: false,
    fuera: false,
    falto: false,
    libre: false,
    noViene: false,
    moHoy: 0,
    aviso70: false,
    anim: "nada",
    trabajando: false,
    dias: 0,
    esperaZona: 0,
    enCruce: false,
  };
}

function planLluvia(s: Estado) {
  const out: Lluvia[] = [];
  const hacer = (dia: number) => {
    const ini = 11 * 60 + Math.floor(rngNext(s) * (3 * 60 + 46));
    const dur = 90 + Math.floor(rngNext(s) * 91);
    const prob = 60 + Math.floor(rngNext(s) * 21);
    out.push({ dia, ini, fin: Math.min(ini + dur, 18 * 60 - 1), prob });
  };
  hacer(4);
  for (let d = 3; d <= 48 && out.length < 3; d++) {
    if (d <= 2 || d === 4 || esDomingo(d)) continue;
    if (rngNext(s) < 0.16) hacer(d);
  }
  s.lluvias = out;
}

function sitaBase(): Sita {
  return {
    x: SITIOS.almacen.x,
    y: SITIOS.almacen.y,
    fase: "casa",
    oferta: null,
    ultima: null,
    rechazoDia: 0,
    rechazoConParo: false,
    urgenteDia: 0,
    paro: false,
    editando: false,
  };
}

export function nueva(seed?: number): Estado {
  const s0 = (seed ?? (Date.now() % 1_000_000_000)) >>> 0;
  const s: Estado = {
    v: 1 as const,
    seed: s0,
    rng: s0,
    dia: 1,
    minuto: 7 * 60,
    frac: 0,
    firmado: false,
    entregada: false,
    pausa: false,
    panel: "menu" as Panel,
    caja: 0,
    cobrado: 0,
    adelanto: 0,
    costos: vacioCostos(),
    inv: vacioInv(),
    entrada: {},
    cargas: [],
    bitacora: [],
    mojado: 0,
    avisoNubes: false,
    aviso14: false,
    escuadraHasta: 0,
    oficinaTab: "gente",
    aguaNota: 0,
    salidaPend: {},
    cementoAfuera: 0,
    gente: [],
    candidatos: [],
    reserva: [],
    idSeq: 0,
    etapas: ETAPAS.map(() => ({ sello: null, motivo: "", primera: null })),
    runs: ETAPAS.map((e) => e.trabajos.map((t) => ({ id: t.id, hecho: 0, ini: false }))),
    extras: [],
    etapa: 0,
    pedidos: [],
    mezclas: [],
    lluvias: [],
    lluviaOn: false,
    achiques: [],
    plomo: null,
    plumbed: [],
    blocksHoy: 0,
    desplomes: 0,
    desplomesCobrados: 0,
    fragua: null,
    curando: false,
    curadoDias: [],
    regadoHoy: false,
    regarProg: 0,
    kitGastado: false,
    nominaPagada: false,
    direccionCobrada: false,
    herrHoy: 0,
    mezclaTarde: 0,
    mezclaTardeNota: false,
    tierraMonton: 0,
    tierraBote: 0,
    adelantoDia: 0,
    morteroVencio: 0,
    diasTrabajados: 0,
    tut: {
      firma: false,
      parada: false,
      cuadrilla: false,
      trazo: false,
      pedido: false,
      arena: false,
      libreta: false,
      agua: false,
      sita: false,
      visto: 0,
      fin: false,
    },
    diario: [],
    avisos: [],
    avisoSeq: 0,
    jugador: { ...INICIO },
    yaw: 0,
    vel: 0,
    mando: { ax: 0, ay: 0 },
    destino: null,
    sinGolpe: 0,
    gritos: [],
    sello: null,
    faltanManana: [],
    stats: {
      compas: 0,
      golpes: 0,
      golpesAuto: 0,
      golpesAutoHoy: 0,
      golpesAutoPorDia: {},
      tandasPerdidas: 0,
      costoPerdidas: 0,
      faltas: 0,
      fletes: 0,
      rio: {},
      aprobadasPrimera: 0,
      sellos: 0,
      costoMojado: 0,
    },
    sita: sitaBase(),
  };
  planLluvia(s);
  s.candidatos = CUADRILLA.map((b, i) => personaDe(s, b, i));
  return s;
}

export function validar(x: unknown): x is Estado {
  if (!x || typeof x !== "object") return false;
  const s = x as Estado;
  if (s.v !== 1) return false;
  if (!numOk(s.dia) || !numOk(s.minuto) || !numOk(s.caja) || !numOk(s.seed) || !numOk(s.rng)) return false;
  if (!s.jugador || !numOk(s.jugador.x) || !numOk(s.jugador.y)) return false;
  if (!s.inv) return false;
  for (const m of MATS) {
    const slot = s.inv[m];
    if (!slot || !numOk(slot.q) || !numOk(slot.valor)) return false;
  }
  if (!Array.isArray(s.gente) || !s.gente.every(personaOk)) return false;
  if (!Array.isArray(s.reserva) || !s.reserva.every(personaOk)) return false;
  if (!s.stats || typeof s.stats !== "object" || !s.stats.rio || typeof s.stats.rio !== "object") return false;
  if (!numOk(s.stats.compas) || !numOk(s.stats.golpes) || !numOk(s.stats.tandasPerdidas) || !numOk(s.stats.sellos))
    return false;
  if (!s.costos) return false;
  for (const p of PARTIDAS) {
    const c = s.costos[p];
    if (!c || !numOk(c.mo) || !numOk(c.mat)) return false;
  }
  if (!Array.isArray(s.etapas) || s.etapas.length !== 9) return false;
  if (!Array.isArray(s.runs) || s.runs.length !== 9) return false;
  for (const list of s.runs) {
    if (!Array.isArray(list)) return false;
    for (const r of list) {
      if (!r || typeof r.id !== "string" || !numOk(r.hecho)) return false;
    }
  }
  if (!s.tut || typeof s.tut.firma !== "boolean") return false;
  if (!s.mando || !numOk(s.mando.ax) || !numOk(s.mando.ay)) return false;
  return true;
}

export function sanear(s: Estado): Estado {
  const inv = s.inv as Record<string, { q: number; valor: number } | undefined>;
  if (inv?.arenaBruta) delete inv.arenaBruta;
  if (inv?.piedra) delete inv.piedra;
  s.entrada ??= {};
  s.cargas ??= [];
  s.bitacora ??= [];
  s.mojado ??= 0;
  s.avisoNubes ??= false;
  s.aviso14 ??= false;
  s.escuadraHasta ??= 0;
  s.oficinaTab ??= "gente";
  const tab = s.oficinaTab as string;
  if (tab === "lista") s.oficinaTab = "libreta";
  else if (tab === "almacen" || (tab !== "gente" && tab !== "planos" && tab !== "telefono" && tab !== "diario" && tab !== "libreta"))
    s.oficinaTab = "gente";
  s.aguaNota ??= 0;
  s.salidaPend ??= {};
  const okPuesto = new Set<string>(PUESTOS);
  for (const g of [...(s.gente ?? []), ...(s.reserva ?? []), ...(s.candidatos ?? [])]) {
    if (g.puesto && !okPuesto.has(g.puesto)) g.puesto = "obra";
    if (typeof g.dias !== "number" || !Number.isFinite(g.dias)) g.dias = 0;
    if (typeof g.esperaZona !== "number" || !Number.isFinite(g.esperaZona)) g.esperaZona = 0;
    g.enCruce = !!g.enCruce;
  }
  const panel = s.panel as string | null;
  if (panel === "parada" || panel === "escuadra") {
    s.oficinaTab = "gente";
    s.panel = panel === "escuadra" ? null : "oficina";
  }
  if (s.panel === "libreta") {
    s.oficinaTab = "libreta";
    s.panel = "oficina";
  } else if (s.panel === "almacen") s.panel = null;
  const run0 = s.runs?.[0];
  if (Array.isArray(run0)) {
    const viejo = run0.find((r) => r.id === "trazar");
    let nuevo = run0.find((r) => r.id === "replantear");
    if (!nuevo) {
      nuevo = { id: "replantear", hecho: viejo?.hecho ?? 0, ini: !!viejo?.ini };
      run0.push(nuevo);
    } else if (viejo && nuevo.hecho < viejo.hecho) nuevo.hecho = viejo.hecho;
  }
  if (!s.stats.rio) s.stats.rio = {};
  s.stats.costoMojado ??= 0;
  s.stats.golpesAuto ??= 0;
  s.stats.golpesAutoHoy ??= 0;
  s.stats.golpesAutoPorDia ??= {};
  if (typeof s.sinGolpe !== "number" || !Number.isFinite(s.sinGolpe)) s.sinGolpe = 0;
  s.gritos ??= [];
  s.maestroLider = false;
  s.stats.muertoDetalle ??= {};
  s.stats.faltasLog ??= [];
  if (typeof s.adelantoDia !== "number" || !Number.isFinite(s.adelantoDia)) s.adelantoDia = 0;
  if (typeof s.morteroVencio !== "number" || !Number.isFinite(s.morteroVencio)) s.morteroVencio = 0;
  if (typeof s.herrHoy !== "number" || !Number.isFinite(s.herrHoy)) s.herrHoy = 0;
  if (typeof s.mezclaTarde !== "number" || !Number.isFinite(s.mezclaTarde)) s.mezclaTarde = 0;
  s.mezclaTardeNota = !!s.mezclaTardeNota;
  if (typeof s.tierraMonton !== "number" || !Number.isFinite(s.tierraMonton)) s.tierraMonton = s.inv.tierra?.q ?? 0;
  if (typeof s.tierraBote !== "number" || !Number.isFinite(s.tierraBote)) s.tierraBote = 0;
  if (!s.sita || s.sita.fase == null || typeof s.sita.x !== "number") s.sita = sitaBase();
  else {
    s.sita.oferta ??= null;
    s.sita.ultima ??= null;
    s.sita.rechazoDia ??= 0;
    s.sita.rechazoConParo ??= false;
    s.sita.urgenteDia ??= 0;
    s.sita.paro ??= false;
    s.sita.editando ??= false;
  }
  s.tut.agua ??= false;
  s.tut.sita ??= false;
  if (typeof s.tut.visto !== "number" || !Number.isFinite(s.tut.visto)) s.tut.visto = 0;
  if (s.panel === "sita" && !s.sita.oferta) s.panel = null;
  return s;
}

function numOk(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

function personaOk(g: unknown): boolean {
  if (!g || typeof g !== "object") return false;
  const p = g as Persona;
  if (typeof p.id !== "string" || typeof p.nombre !== "string" || !p.nombre) return false;
  if (typeof p.oficio !== "string" || !(OFICIOS as readonly string[]).includes(p.oficio)) return false;
  return numOk(p.x) && numOk(p.y);
}

function chequearTutorial(s: Estado) {
  const ok =
    s.tut.firma &&
    s.tut.parada &&
    s.tut.cuadrilla &&
    s.tut.pedido &&
    s.tut.arena &&
    !!s.tut.agua &&
    !!s.tut.sita;
  if (ok && !s.tut.fin) {
    s.tut.fin = true;
    aviso(s, TUTORIAL[7] ?? "El cartel de arriba dice qué frena la obra.");
  }
}

function pasoNatural(s: Estado): number {
  if (!s.firmado) return 0;
  const hayGente = s.gente.length + s.reserva.length > 0;
  if (!s.tut.fin && !s.tut.sita && s.sita?.oferta && hayGente) return 6;
  const flags = [
    s.tut.firma,
    s.tut.parada,
    s.tut.cuadrilla,
    s.tut.pedido,
    s.tut.arena,
    !!s.tut.agua,
    !!s.tut.sita,
    s.tut.fin,
  ];
  const i = flags.findIndex((f) => !f);
  return i < 0 ? 8 : i;
}

export function marcarGuia(s: Estado) {
  const n = pasoNatural(s);
  const alto = typeof s.tut.visto === "number" && Number.isFinite(s.tut.visto) ? s.tut.visto : 0;
  if (n > alto) s.tut.visto = n;
}

export function pasoTutorial(s: Estado): number {
  const n = pasoNatural(s);
  const alto = typeof s.tut.visto === "number" && Number.isFinite(s.tut.visto) ? s.tut.visto : 0;
  return n > alto ? n : alto;
}

export function flecha(s: Estado): { x: number; y: number } | null {
  if (!s.firmado || s.tut.fin || s.entregada) return null;
  switch (pasoTutorial(s)) {
    case 1:
      return SITIOS.oficina;
    case 2:
      return SITIOS.obra;
    case 3:
      return SITIOS.oficina;
    case 4:
      return SITIOS.entrada;
    case 5:
      return SITIOS.toma;
    default:
      return null;
  }
}

export function firmar(s: Estado) {
  if (s.firmado) return;
  s.firmado = true;
  s.caja = ANTICIPO;
  s.cobrado = ANTICIPO;
  diario(s, `Anticipo de Doña Carmen: +${peso(ANTICIPO)}.`);
  s.caja -= KIT_PRECIO;
  diario(s, `Kit de replanteo: −${peso(KIT_PRECIO)}.`);
  s.inv.kit = { q: 1, valor: KIT_PRECIO };
  s.inv.agua = { q: 0.4, valor: 0 };
  s.panel = null;
  s.pausa = false;
  s.tut.firma = true;
  aviso(s, "Cayó el anticipo. El kit de replanteo está en el almacén.");
  chequearTutorial(s);
}

export function abrirPanel(s: Estado, p: Panel) {
  if (p === "libreta") {
    s.tut.libreta = true;
    chequearTutorial(s);
    s.oficinaTab = "libreta";
    s.panel = "oficina";
    s.pausa = false;
    return;
  }
  s.panel = p;
  s.pausa = false;
}

export function cerrarPanel(s: Estado) {
  if (s.panel === "menu" && !s.firmado) return;
  if (s.panel === "informe" || s.panel === "perdida") return;
  if (s.panel === "sello") {
    continuarSello(s);
    return;
  }
  if (s.panel === "finde") return;
  if (s.panel === "pausa") s.pausa = false;
  if (s.panel === "sita") {
    if (s.sita && (s.sita.fase === "nota" || s.sita.fase === "yendo")) rechazarSita(s);
    else {
      if (s.sita) {
        s.sita.oferta = null;
        s.sita.editando = false;
      }
      s.panel = null;
    }
    return;
  }
  if (s.panel === "oficina" && s.sita?.editando) {
    s.sita.editando = false;
    s.panel = "sita";
    return;
  }
  s.panel = null;
}

function usar(s: Estado, mat: Mat, n: number): number {
  const slot = s.inv[mat];
  const q = Math.min(slot.q, Math.max(0, n));
  if (q <= 1e-12) return 0;
  const avg = slot.q > 0 ? slot.valor / slot.q : 0;
  const costo = avg * q;
  slot.q -= q;
  slot.valor = Math.max(0, slot.valor - costo);
  if (slot.q < 1e-9) {
    slot.q = 0;
    slot.valor = 0;
  }
  if (mat === "tierra" && q > 0) {
    let n = q;
    const deBote = Math.min(s.tierraBote ?? 0, n);
    s.tierraBote = Math.max(0, (s.tierraBote ?? 0) - deBote);
    n -= deBote;
    s.tierraMonton = Math.max(0, (s.tierraMonton ?? 0) - n);
  }
  return costo;
}

function agregar(s: Estado, mat: Mat, n: number, precio: number) {
  if (n <= 1e-12) return;
  const slot = s.inv[mat];
  const antes = slot.q;
  slot.q += n;
  slot.valor += n * precio;
  if (mat === "cemento") {
    const bajo = antes - s.cementoAfuera;
    const cabe = Math.max(0, 20 - Math.max(0, bajo));
    const afuera = Math.max(0, n - cabe);
    s.cementoAfuera += afuera;
    if (afuera >= 0.5) aviso(s, `${num(afuera, 0)} fundas van a quedar afuera. Si llueve se mojan.`);
  }
}

function tieneMapa(s: Estado, map: Cantidades): boolean {
  for (const [k, n] of Object.entries(map) as [Mat, number][]) {
    if ((s.inv[k]?.q ?? 0) < n - 1e-9) return false;
  }
  return true;
}

function gastarMapa(s: Estado, map: Cantidades, donde?: "batea" | "obra"): number {
  let c = 0;
  for (const [k, n] of Object.entries(map) as [Mat, number][]) {
    const costo = usar(s, k, n);
    c += costo;
    if (donde && n > 1e-8) anotarSalida(s, k, n, donde);
  }
  return c;
}

function entSlot(s: Estado, m: Mat): { q: number; valor: number } {
  let sl = s.entrada[m];
  if (!sl) {
    sl = { q: 0, valor: 0 };
    s.entrada[m] = sl;
  }
  return sl;
}

function tenido(s: Estado, m: Mat): number {
  return (s.inv[m]?.q ?? 0) + (s.entrada[m]?.q ?? 0);
}

function apunte(s: Estado, clase: ClaseApunte, texto: string, lugar = "") {
  s.bitacora.push({ dia: s.dia, min: s.minuto, clase, texto, lugar });
  if (s.bitacora.length > 240) s.bitacora.splice(0, s.bitacora.length - 240);
}

function anotarSalida(s: Estado, mat: Mat, n: number, donde: "batea" | "obra") {
  const k = `${mat}|${donde}`;
  s.salidaPend[k] = (s.salidaPend[k] ?? 0) + n;
}

function flushSalidas(s: Estado) {
  const keys = Object.keys(s.salidaPend);
  for (const k of keys) {
    const q = s.salidaPend[k] ?? 0;
    const [mat, donde] = k.split("|") as [Mat, "batea" | "obra"];
    const vol = mat === "arena" || mat === "grava" || mat === "agua" || mat === "tierra";
    const umbral = vol ? 0.05 : 1;
    if (q + 1e-9 < umbral) continue;
    const toma = vol ? Math.round(q * 100) / 100 : Math.floor(q + 1e-6);
    s.salidaPend[k] = Math.max(0, q - toma);
    const unidad = MATERIALES[mat].unidad;
    const lugar = donde === "batea" ? "trompo" : "obra";
    const prep = donde === "batea" ? "al" : "a la";
    apunte(s, "salio", `Salió ${num(toma, vol ? 2 : 0)} ${unidad} ${prep} ${lugar}`, lugar);
  }
}

function receta(tipo: "H" | "M"): Cantidades {
  if (tipo === "H") return { cemento: RECETA_H.cemento, arena: RECETA_H.arena, grava: RECETA_H.grava, agua: RECETA_H.agua };
  return { cemento: RECETA_M.cemento, arena: RECETA_M.arena, agua: RECETA_M.agua };
}

function espacio(s: Estado, m: Mat): number {
  const q = tenido(s, m);
  if (m === "arena") return Math.max(0, 4 - q);
  if (m === "grava") return Math.max(0, 4 - q);
  if (m === "agua") return Math.max(0, 1.2 - q);
  if (m === "v38" || m === "v14") return Math.max(0, 60 - tenido(s, "v38") - tenido(s, "v14"));
  if (m === "block") return Math.max(0, 500 - q);
  if (m === "plywood" || m === "pino" || m === "abeto")
    return Math.max(0, 40 - tenido(s, "plywood") - tenido(s, "pino") - tenido(s, "abeto"));
  if (m === "zinc") return Math.max(0, 30 - q);
  return 9999;
}

function runDe(s: Estado, etapa: number, id: string): Run {
  const list = s.runs[etapa];
  let r = list?.find((x) => x.id === id);
  if (!r) {
    r = { id, hecho: 0, ini: false };
    list?.push(r);
  }
  return r;
}

export function hechoDe(s: Estado, etapa: number, id: string): number {
  return s.runs[etapa]?.find((r) => r.id === id)?.hecho ?? 0;
}

export function señalesReplanteo(diag: number): { estacas: number; cordel: boolean } {
  const u = Math.min(1, Math.max(0, diag / 2));
  const estacas = u <= 0 ? 0 : Math.min(4, Math.ceil((Math.min(u, 0.45) / 0.45) * 4));
  return { estacas, cordel: u > 0.45 };
}

export function trianguloEscuadra(s: Estado): boolean {
  return s.etapa === 0 && s.minuto < s.escuadraHasta && hechoDe(s, 0, "replantear") >= 2 - 1e-3;
}

function fraguaActiva(s: Estado): boolean {
  if (!s.fragua) return false;
  if (s.dia > s.fragua.dia) return false;
  if (s.dia === s.fragua.dia && s.minuto >= s.fragua.minuto) return false;
  return true;
}

function works(s: Estado): W[] {
  const def = ETAPAS[s.etapa];
  if (!def) return [];
  const out: W[] = [];
  for (const t of def.trabajos) {
    const run = runDe(s, s.etapa, t.id);
    out.push({
      id: t.id,
      k: t.k,
      nombre: t.nombre,
      q: t.q,
      hecho: run.hecho,
      usa: t.usa,
      usaIni: t.usaIni,
      ini: run.ini,
      mezcla: t.mezcla,
      mezclaQ: t.mezclaQ,
      partida: TAREAS[t.k].partida,
      soloMaestro: t.soloMaestro,
      reqCurado: t.reqCurado,
      despuesDe: t.despuesDe,
      desdePct: t.desdePct,
      setHecho: (n) => {
        run.hecho = n;
      },
      setIni: () => {
        run.ini = true;
      },
    });
  }
  for (const e of s.extras) {
    if (e.etapa !== s.etapa) continue;
    out.push({
      id: e.id,
      k: e.k,
      nombre: e.nombre,
      q: e.q,
      hecho: e.hecho,
      usa: e.usa,
      ini: true,
      mezcla: e.mezcla,
      mezclaQ: e.mezclaQ,
      partida: e.partida,
      bloquea: e.bloquea,
      setHecho: (n) => {
        e.hecho = n;
      },
      setIni: () => {},
    });
  }
  return out;
}

function prereqOk(s: Estado, w: W): boolean {
  if (w.reqCurado && s.curadoDias.length < 3) return false;
  const def = ETAPAS[s.etapa];
  if (!def) return false;
  if (w.despuesDe) {
    for (const id of w.despuesDe) {
      const d = def.trabajos.find((t) => t.id === id);
      const r = runDe(s, s.etapa, id);
      if (d && r.hecho < d.q - 1e-4) return false;
    }
  }
  if (w.desdePct) {
    const d = def.trabajos.find((t) => t.id === w.desdePct!.id);
    const r = runDe(s, s.etapa, w.desdePct.id);
    if (d && r.hecho < d.q * w.desdePct.pct - 1e-4) return false;
  }
  return true;
}

function listos(s: Estado): W[] {
  if (fraguaActiva(s) || s.etapa >= 9 || s.entregada) return [];
  const all = works(s);
  const bloqueo = all.find((w) => w.bloquea && w.hecho < w.q - 1e-4);
  const base = (bloqueo ? [bloqueo] : all).filter((w) => w.hecho < w.q - 1e-4 && !w.soloMaestro && prereqOk(s, w));
  if (s.plomo) {
    for (let i = base.length - 1; i >= 0; i--) if (base[i]!.id === "block") base.splice(i, 1);
  }
  if (s.blocksHoy >= TOPE_BLOCK_DIA - 1e-6) {
    for (let i = base.length - 1; i >= 0; i--) if (base[i]!.k === "block") base.splice(i, 1);
  }
  if (s.curando && !s.regadoHoy && s.curadoDias.length < 3 && !fraguaActiva(s)) {
    base.unshift({
      id: "regar",
      k: "regar",
      nombre: "Regar la viga",
      q: 1,
      hecho: s.regarProg,
      ini: true,
      partida: "hormigon",
      setHecho: (n) => {
        s.regarProg = n;
      },
      setIni: () => {},
    });
  }
  return base;
}

function hayLider(s: Estado, k: Tarea): boolean {
  const lid = TAREAS[k].lider;
  if (!lid) return true;
  if (s.maestroLider) return true;
  if (dist(s.jugador, SITIOS.obra) <= RADIO_LIDER) return true;
  return s.gente.some(
    (g) => g.activo && !g.fuera && !g.falto && distAlSolar(g.x, g.y) <= 1.5 && lid.includes(g.oficio),
  );
}

function stockMezcla(s: Estado, tipo: "H" | "M"): number {
  let n = 0;
  for (const m of s.mezclas) if (m.lista && m.tipo === tipo) n += m.restante;
  return n;
}

function tandasEnCurso(s: Estado, tipo: "H" | "M"): number {
  let n = 0;
  for (const m of s.mezclas) if (!m.lista && m.tipo === tipo) n += 1;
  return n;
}

function mezclaQueFalta(w: W): number {
  if (!w.mezcla || !w.mezclaQ || w.q <= 0) return 0;
  return Math.max(0, w.q - w.hecho) * (w.mezclaQ / w.q);
}

function consumirMezcla(s: Estado, tipo: "H" | "M", cant: number): { tomado: number; costo: number } {
  let falta = cant;
  let costo = 0;
  for (const m of s.mezclas) {
    if (!m.lista || m.tipo !== tipo || falta <= 0) continue;
    const tom = Math.min(m.restante, falta);
    m.restante -= tom;
    falta -= tom;
    costo += (m.costo * tom) / Math.max(0.0001, 1);
  }
  s.mezclas = s.mezclas.filter((m) => !m.lista || m.restante > 1e-4);
  return { tomado: cant - falta, costo };
}

function aplicar(s: Estado, w: W, dq: number): number {
  if (dq <= 0 || w.hecho >= w.q - 1e-8) return 0;
  if (TAREAS[w.k].lider && !hayLider(s, w.k)) return 0;
  if (w.id === "block" && s.plomo) return 0;
  if (w.k === "block") dq = Math.min(dq, Math.max(0, TOPE_BLOCK_DIA - s.blocksHoy));
  if (w.id === "block") {
    for (const u of UMBRALES) {
      const ya = s.plumbed.some((p) => Math.abs(p - u) < 1e-3);
      if (!ya && w.hecho < u - 1e-6) {
        dq = Math.min(dq, u - w.hecho);
        break;
      }
    }
  }
  if (w.usaIni && !w.ini) {
    if (!tieneMapa(s, w.usaIni)) return 0;
    const c = gastarMapa(s, w.usaIni, "obra");
    s.costos[w.partida].mat += c;
    w.setIni();
    w.ini = true;
  }
  if (w.usa) {
    for (const [k, total] of Object.entries(w.usa) as [Mat, number][]) {
      const per = total / w.q;
      if (per > 0) dq = Math.min(dq, s.inv[k].q / per);
    }
  }
  if (w.mezcla && w.mezclaQ) {
    const per = w.mezclaQ / w.q;
    const have = stockMezcla(s, w.mezcla);
    if (per > 0) dq = Math.min(dq, have / per);
  }
  if (w.k === "regar") {
    const faltaAgua = Math.max(0, 0.1 - s.inv.agua.q);
    if (faltaAgua > 1e-6 && w.hecho + dq >= 1) dq = Math.min(dq, Math.max(0, 0.95 - w.hecho));
  }
  if (dq <= 1e-8) return 0;
  dq = Math.min(dq, w.q - w.hecho);
  if (w.usa) {
    const mapa: Cantidades = {};
    for (const [k, total] of Object.entries(w.usa) as [Mat, number][]) mapa[k] = (total * dq) / w.q;
    s.costos[w.partida].mat += gastarMapa(s, mapa, "obra");
  }
  if (w.mezcla && w.mezclaQ) {
    const need = (w.mezclaQ * dq) / w.q;
    const got = consumirMezcla(s, w.mezcla, need);
    s.costos[w.partida].mat += got.costo;
    if (got.tomado + 1e-8 < need) dq *= need > 0 ? got.tomado / need : 0;
  }
  if (dq <= 1e-8) return 0;
  const antes = w.hecho;
  const nuevo = Math.min(w.q, antes + dq);
  w.setHecho(nuevo);
  w.hecho = nuevo;
  const real = nuevo - antes;
  if (w.k === "excavar") {
    s.inv.tierra.q += real;
    s.tierraMonton = (s.tierraMonton ?? 0) + real;
  }
  if (w.k === "block") s.blocksHoy += real;
  if (w.k === "replantear" && antes < 2 - 1e-4 && w.hecho >= 2 - 1e-4) {
    s.escuadraHasta = s.minuto + 4;
    s.tut.trazo = true;
    chequearTutorial(s);
    aviso(s, "Replanteo listo: escuadra comprobada 3, 4, 5");
  }
  if (w.id === "block") {
    for (const u of UMBRALES) {
      const ya = s.plumbed.some((p) => Math.abs(p - u) < 1e-3);
      if (!ya && antes < u - 1e-6 && w.hecho >= u - 1e-4) {
        w.setHecho(u);
        s.plomo = { umbral: u, min: 0 };
        break;
      }
    }
  }
  if (w.k === "regar" && w.hecho >= 1 - 1e-6 && !s.regadoHoy) {
    if (s.inv.agua.q >= 0.1 - 1e-6) {
      const c = usar(s, "agua", 0.1);
      s.costos.hormigon.mat += c;
      s.regadoHoy = true;
      s.curadoDias.push(s.dia);
      s.regarProg = 0;
      w.setHecho(0);
      aviso(s, `Viga regada. Van ${s.curadoDias.length} de 3 días.`);
    }
  }
  return real;
}

function ojoDe(g: Persona): number {
  let o = g.ojo;
  if (g.mania === "tranquilo") o += 2;
  if (g.mania === "piedra") o -= 1;
  return o;
}

function hayCantor(s: Estado, puesto: Puesto | null, menos: string): boolean {
  if (!puesto) return false;
  return s.gente.some((g) => {
    if (g.id === menos || !g.activo || g.fuera || g.falto || g.puesto !== puesto || g.mania !== "cantor") return false;
    const a = ancla(s, g);
    return !!a && dist(g, a) < 1.3;
  });
}

function factorMania(s: Estado, g: Persona, tarea: Tarea): number {
  let f = 1;
  const td = TAREAS[tarea];
  if (g.mania === "tranquilo") f *= 0.9;
  if (g.mania === "madrugador") f *= 1.125;
  if (g.mania === "domino") f *= 0.9375;
  if (g.mania === "cantor") f *= 0.95;
  const pala =
    tarea === "excavar" || tarea === "achicar" || tarea === "relleno" || tarea === "palear" || tarea === "acarreo" || tarea === "agua";
  if (g.mania === "patas" && pala) f *= 1.2;
  if (g.mania === "piedra" && td.peso === "pesado") f *= 1.2;
  if (g.mania !== "cantor" && hayCantor(s, g.puesto, g.id)) f *= 1.1;
  return f;
}

function factorCansancio(c: number): number {
  if (c <= 50) return 1;
  return 1 - 0.4 * clamp((c - 50) / 50, 0, 1);
}

function ritmo(s: Estado, g: Persona, tarea: Tarea): number {
  const td = TAREAS[tarea];
  const ei = OFICIOS.indexOf(g.oficio);
  const e = EFI[td.grupo][ei] ?? 0;
  return (td.rinde / 480) * e * g.rinde * factorCansancio(g.cansancio) * factorMania(s, g, tarea);
}

function fatiga(s: Estado, g: Persona, tipo: "pesado" | "medio" | "liviano" | "caminar" | "sombra" | "lluvia") {
  const tabla = { pesado: 9, medio: 5, liviano: 3, caminar: 2, sombra: -12, lluvia: -6 };
  let d = tabla[tipo] / 60;
  if (d > 0) {
    d *= 1.4 - 0.1 * g.aguante;
    if (g.mania === "patas") d *= 1.25;
    if (g.mania === "domino") d *= 0.8;
  }
  g.cansancio = clamp(g.cansancio + d, 0, 100);
}

function cobrarMin(s: Estado, g: Persona, partida: Partida, causa?: "espera" | "lluvia" | "camino" | "resto") {
  const c = jornalDe(g.oficio, g.rinde) / 480;
  s.costos[partida].mo += c;
  g.moHoy += c;
  if (partida !== "muerto") return;
  anotarMuerto(s, g, c, 1, causa === "lluvia" ? "lluvia" : causa === "camino" ? "camino" : causa === "resto" ? "resto" : undefined);
}

function matParado(s: Estado, w: W): Mat | null {
  if (w.usaIni && !w.ini) {
    for (const [k, n] of Object.entries(w.usaIni) as [Mat, number][]) {
      if (s.inv[k].q + 1e-9 < n) return k;
    }
  }
  if (w.usa) {
    for (const [k, total] of Object.entries(w.usa) as [Mat, number][]) {
      const per = total / Math.max(w.q, 1e-9);
      if (per > 1e-9 && s.inv[k].q <= 1e-9) return k;
    }
  }
  if (w.mezcla && stockMezcla(s, w.mezcla) + tandasEnCurso(s, w.mezcla) + 1e-6 < mezclaQueFalta(w)) {
    const map = receta(w.mezcla);
    for (const [k, n] of Object.entries(map) as [Mat, number][]) {
      if (k === "agua") continue;
      if (s.inv[k].q + 1e-9 < n) return k;
    }
  }
  return null;
}

function claveMuerto(s: Estado, g: Persona | null, hint?: "lluvia" | "camino" | "resto"): string {
  if (hint === "resto") return "otro";
  if (hint === "lluvia" || lluviaAhora(s)) return "lluvia";
  if (hint === "camino") return "otro";
  if (!g || !g.puesto) return "tarea";
  if (g.puesto === "sombra") return "otro";
  if (s.plomo) return "plomo";
  const w = elegir(s, g);
  if (!w) return "tarea";
  if (w.mezcla) {
    const map = receta(w.mezcla);
    const stock = stockMezcla(s, w.mezcla);
    const curso = tandasEnCurso(s, w.mezcla);
    if (stock + curso + 1e-6 < mezclaQueFalta(w) && stock < 0.05) {
      if (aguaEsElFreno(s, map)) return "agua";
      const mat = matParado(s, w);
      if (mat) return `mat:${MATERIALES[mat].nombre}`;
      const vencio = Math.floor((s.morteroVencio ?? 0) / 10000) === s.dia && (s.morteroVencio ?? 0) > 0;
      if (vencio && curso <= 0) return "mortero";
      const enBatea = s.gente.some((p) => p.activo && !p.fuera && !p.falto && p.puesto === "batea");
      if (!enBatea) return "batea";
      return curso > 0 ? "otro" : "batea";
    }
  }
  const mat = matParado(s, w);
  if (mat) return `mat:${MATERIALES[mat].nombre}`;
  if (TAREAS[w.k].lider && !hayLider(s, w.k)) return "otro";
  return "otro";
}

function anotarMuerto(s: Estado, g: Persona | null, pesos: number, minutos: number, hint?: "lluvia" | "camino" | "resto") {
  if (pesos <= 0 && minutos <= 0) return;
  const key = claveMuerto(s, g, hint);
  const det = (s.stats.muertoDetalle ??= {});
  const row = (det[key] ??= { min: 0, pesos: 0, dias: {} });
  row.min += minutos;
  row.pesos += pesos;
  const dia = (row.dias[String(s.dia)] ??= { min: 0, pesos: 0 });
  dia.min += minutos;
  dia.pesos += pesos;
  const bag = (s.stats.muertoCausas ??= { espera: 0, lluvia: 0, camino: 0, resto: 0 });
  const viejo = hint === "lluvia" ? "lluvia" : hint === "camino" ? "camino" : hint === "resto" ? "resto" : "espera";
  bag[viejo] += pesos;
}

const NOMBRE_MUERTO: Record<string, string> = {
  batea: "Nadie en el Trompo",
  agua: "Sin agua",
  mortero: "Mortero vencido",
  lluvia: "Lluvia",
  plomo: "Esperando plomo",
  tarea: "Sin tarea asignada",
  otro: "Otro",
};

export interface ParteMuerto {
  id: string;
  nombre: string;
  min: number;
  pesos: number;
  dias: { dia: number; min: number; pesos: number }[];
}

export function partesMuerto(s: Estado): ParteMuerto[] {
  const det = s.stats.muertoDetalle ?? {};
  const orden = ["batea", "agua", "mortero", "lluvia", "plomo", "tarea", "otro"];
  const mats = Object.keys(det)
    .filter((k) => k.startsWith("mat:"))
    .sort();
  const keys = [...mats, ...orden.filter((k) => det[k])];
  const out: ParteMuerto[] = [];
  for (const k of keys) {
    const row = det[k];
    if (!row || (row.min < 0.05 && row.pesos < 0.5)) continue;
    const nombre = k.startsWith("mat:") ? `Falta de ${k.slice(4)}` : (NOMBRE_MUERTO[k] ?? k);
    const dias = Object.entries(row.dias)
      .map(([d, v]) => ({ dia: Number(d), min: v.min, pesos: v.pesos }))
      .filter((d) => d.min >= 0.05 || d.pesos >= 0.5)
      .sort((a, b) => a.dia - b.dia);
    out.push({ id: k, nombre, min: row.min, pesos: row.pesos, dias });
  }
  return out;
}

function herramientaDe(k: Tarea): string {
  if (k === "excavar" || k === "achicar" || k === "relleno" || k === "palear" || k === "calzos" || k === "acarreo") return "pala";
  if (k === "encofrar" || k === "techo") return "martillo";
  if (k === "agua" || k === "mezclarH" || k === "mezclarM" || k === "regar") return "cubeta";
  if (k === "block" || k === "llanear" || k === "vaciar" || k === "acero" || k === "limpiar" || k === "limpieza" || k === "replantear")
    return "cuchara";
  return "nada";
}

function albaniles(s: Estado): number {
  return s.gente.filter((g) => g.activo && !g.fuera && !g.falto && g.oficio === "albanil").length;
}

function tipoQueFalta(s: Estado): "H" | "M" | null {
  const need: ("H" | "M")[] = [];
  for (const w of listos(s)) if (w.mezcla && !need.includes(w.mezcla)) need.push(w.mezcla);
  if (!need.length) return null;
  const meta = Math.max(1, albaniles(s));
  let best: "H" | "M" | null = null;
  let bestReady = Infinity;
  for (const t of need) {
    const ready = s.mezclas.filter((m) => m.lista && m.tipo === t && m.restante > 0.05).length;
    const curso = s.mezclas.some((m) => !m.lista && m.tipo === t);
    if (ready >= meta) continue;
    if (curso) return t;
    if (ready < bestReady) {
      bestReady = ready;
      best = t;
    }
  }
  return best;
}

function iniciarMezcla(s: Estado, tipo: "H" | "M"): Mezcla | null {
  const map = receta(tipo);
  if (!tieneMapa(s, map)) return null;
  const costo = gastarMapa(s, map, "batea");
  const m: Mezcla = { tipo, prog: 0, lista: false, vida: 0, costo, restante: 1 };
  s.mezclas.push(m);
  return m;
}

function lavarMezclas(s: Estado, motivo: string) {
  if (!s.mezclas.length) return;
  let costo = 0;
  let n = 0;
  for (const m of s.mezclas) {
    const frac = m.lista ? m.restante : Math.max(m.prog, 0);
    const c = m.costo * frac;
    costo += c;
    n += frac;
    s.costos[m.tipo === "H" ? "hormigon" : "block"].mat += c;
  }
  s.stats.tandasPerdidas += n;
  s.stats.costoPerdidas += costo;
  s.mezclas = [];
  if (costo > 1) aviso(s, `${motivo} Se perdió mezcla por ${peso(costo)}.`);
}

function envejecerMezclas(s: Estado) {
  const siguen: Mezcla[] = [];
  for (const m of s.mezclas) {
    if (m.lista) m.vida -= 1;
    if (m.lista && m.vida <= 0) {
      const c = m.costo * m.restante;
      s.costos[m.tipo === "H" ? "hormigon" : "block"].mat += c;
      s.stats.tandasPerdidas += m.restante;
      s.stats.costoPerdidas += c;
      s.morteroVencio = s.dia * 10000 + s.minuto;
      if (s.minuto >= 15 * 60) s.mezclaTarde = (s.mezclaTarde ?? 0) + c;
      else aviso(s, `Se venció el ${m.tipo === "H" ? "hormigón" : "mortero"} (${peso(c)}).`);
    } else siguen.push(m);
  }
  s.mezclas = siguen;
}

function notarMezclaTarde(s: Estado) {
  if (s.mezclaTardeNota) return;
  const c = s.mezclaTarde ?? 0;
  if (Math.round(c) < 1) return;
  s.mezclaTardeNota = true;
  diario(s, `Mezcla vencida después de las 3: ${peso(c)}.`);
}

function esAyuda(of: Oficio): boolean {
  return of === "peon" || of === "ayudante";
}

function puedeTarea(of: Oficio, k: Tarea): boolean {
  if (of === "varillero") return k === "acero" || k === "calzos";
  if (of === "carpintero") return k === "encofrar" || k === "techo" || k === "limpieza" || k === "limpiar";
  if (of === "albanil") return k !== "mezclarH" && k !== "mezclarM" && k !== "agua" && k !== "acarreo" && k !== "palear";
  return k !== "acero" && k !== "vaciar" && k !== "block" && k !== "encofrar" && k !== "techo" && k !== "llanear" && k !== "replantear";
}

function elegir(s: Estado, g: Persona): W | null {
  const lista = listos(s);
  let best: W | null = null;
  let score = -1;
  for (const w of lista) {
    if (!puedeTarea(g.oficio, w.k)) continue;
    const ei = OFICIOS.indexOf(g.oficio);
    const e = EFI[TAREAS[w.k].grupo][ei] ?? 0;
    const lider = TAREAS[w.k].lider?.includes(g.oficio) ? 0.6 : 0;
    let sc = e + lider;
    if (w.k === "regar") sc += 3;
    if (sc > score) {
      score = sc;
      best = w;
    }
  }
  return best;
}

function lluviaAhora(s: Estado): Lluvia | null {
  return s.lluvias.find((r) => r.dia === s.dia && s.minuto >= r.ini && s.minuto < r.fin) ?? null;
}

function zanjaAbierta(s: Estado): boolean {
  if (s.etapa < 1 || s.etapa > 3) return false;
  if (s.etapa === 3) {
    const r = runDe(s, 3, "vaciar");
    if (r.hecho >= 10 - 1e-4) return false;
  }
  return true;
}

function comenzarLluvia(s: Estado, r: Lluvia) {
  lavarMezclas(s, "El aguacero lavó el trompo.");
  aviso(s, "¡Aguacero! Todo el mundo pa'l almacén.");
  diario(s, `Llovió a las ${horaDe(r.ini)}.`);
  const id = `${r.dia}-${r.ini}`;
  if (zanjaAbierta(s) && !s.achiques.includes(id)) {
    s.achiques.push(id);
    const ya = s.extras.find((e) => e.etapa === s.etapa && e.k === "achicar" && e.hecho < e.q - 1e-4);
    if (!ya) {
      s.extras.push({
        id: "achicar-" + id,
        etapa: s.etapa,
        k: "achicar",
        nombre: "Achicar la zanja",
        q: 2,
        hecho: 0,
        bloquea: true,
        partida: "excavacion",
      });
      aviso(s, "La zanja se inundó. Hay que achicar.");
    }
  }
  if ((s.entrada.cemento?.q ?? 0) >= 1 || s.cementoAfuera >= 1) {
    const enPuerta = s.entrada.cemento?.q ?? 0;
    const legacy = Math.max(0, s.cementoAfuera - enPuerta);
    const fuera = enPuerta + legacy;
    const pierde = Math.floor(fuera / 2);
    if (pierde >= 1) {
      let resta = pierde;
      let costo = 0;
      const deEntrada = Math.min(resta, enPuerta);
      if (deEntrada > 0) {
        costo += usarEntrada(s, "cemento", deEntrada);
        resta -= deEntrada;
      }
      if (resta > 0) costo += usar(s, "cemento", resta);
      s.cementoAfuera = Math.max(0, (s.entrada.cemento?.q ?? 0) + Math.max(0, legacy - (pierde - deEntrada)));
      s.mojado += pierde;
      s.costos.hormigon.mat += costo;
      s.stats.costoMojado = (s.stats.costoMojado ?? 0) + costo;
      apunte(s, "mojado", `Mojado ${pierde}`, "entrada");
      aviso(s, `La lluvia mojó ${pierde} fundas que estaban afuera (${peso(costo)}).`);
      diario(s, `Mojado ${pierde} fundas en la entrada.`);
    }
  }
}

function escampar(s: Estado) {
  aviso(s, "Escampó.");
}

function resolverPlomoAuto(s: Estado) {
  if (!s.plomo) return;
  const ojos = s.gente.filter((g) => g.oficio === "albanil" && g.activo && !g.fuera).map(ojoDe);
  const mejor = ojos.length ? Math.max(...ojos) : 0;
  const riesgo = Math.max(0.04, (6 - mejor) * 0.08);
  const falla = rngNext(s) < riesgo;
  s.plumbed.push(s.plomo.umbral);
  s.plomo = null;
  if (falla) {
    s.desplomes += 1;
    aviso(s, "¡Se desplomó un tramo! La ingeniera lo va a observar.");
    diario(s, "Desplome en el muro.");
  } else aviso(s, "No plomeaste esta hilada: si se desploma, toca rehacer.");
}

function entregarPedidos(s: Estado) {
  const quedan: Pedido[] = [];
  for (const p of s.pedidos) {
    const llega = s.dia > p.dia || (s.dia === p.dia && s.minuto >= p.minuto);
    if (!llega) {
      quedan.push(p);
      continue;
    }
    const puerta: Cantidades = {};
    for (const [k, n] of Object.entries(p.items) as [Mat, number][]) {
      if (n <= 0) continue;
      if (k === "arena" || k === "grava") {
        agregar(s, k, n, MATERIALES[k].precio);
        apunte(s, "entro", `Entró ${num(n, 2)} m³ al montón`, "montón");
        s.tut.arena = true;
        chequearTutorial(s);
      } else {
        meterEntrada(s, k, n, MATERIALES[k].precio);
        puerta[k] = n;
        const unidad = MATERIALES[k].unidad;
        apunte(s, "entro", `Entró ${num(n, n >= 10 ? 0 : 2)} ${unidad} a la entrada`, "entrada");
      }
    }
    s.cargas.push(...partirCargas(s, puerta));
    aviso(s, p.urgente ? "Llegó el camión urgente." : "Llegó el pedido de la ferretería.");
    diario(s, `Entró material a las ${horaDe(s.minuto)}.`);
  }
  s.pedidos = quedan;
}

function trabajarPersona(s: Estado, g: Persona) {
  if (!g.activo || g.fuera || g.falto) {
    g.trabajando = false;
    return;
  }
  if (s.minuto >= 15 * 60) return;
  const llueve = !!lluviaAhora(s);
  if (llueve) {
    const d = dist(g, puertaAlmacen());
    if (d > 0.45) {
      fatiga(s, g, "caminar");
      cobrarMin(s, g, "muerto", "camino");
      g.trabajando = false;
      g.anim = "nada";
      return;
    }
    fatiga(s, g, "lluvia");
    cobrarMin(s, g, "muerto", "lluvia");
    g.trabajando = false;
    g.anim = "nada";
    return;
  }
  const labor = laborDe(s, g);
  if (!labor) {
    fatiga(s, g, "liviano");
    cobrarMin(s, g, "muerto");
    g.trabajando = false;
    g.anim = "nada";
    return;
  }
  const dest = ancla(s, g);
  if (labor !== "acarreo" && (!dest || dist(g, dest) > 0.5)) {
    const partida: Partida =
      labor === "obra" || labor === "batea" || labor === "regar"
        ? (elegir(s, g)?.partida ?? "muerto")
        : labor === "sombra" || labor === "tierra"
          ? "muerto"
          : "farmeo";
    fatiga(s, g, "caminar");
    cobrarMin(s, g, partida, partida === "muerto" ? "camino" : undefined);
    g.trabajando = false;
    g.anim = "nada";
    return;
  }
  if (labor === "sombra") {
    fatiga(s, g, "sombra");
    cobrarMin(s, g, "muerto");
    g.trabajando = false;
    g.anim = "nada";
    return;
  }
  if (labor === "batea") {
    if (!trabajarBatea(s, g)) {
      fatiga(s, g, "liviano");
      cobrarMin(s, g, "muerto");
      g.trabajando = false;
      g.anim = "nada";
    }
    return;
  }
  if (labor === "acarreo") {
    trabajarAcarreo(s, g);
    return;
  }
  if (labor === "agua") {
    trabajarAgua(s, g);
    return;
  }
  if (labor === "regar") {
    trabajarRegar(s, g);
    return;
  }
  if (labor === "tierra") {
    trabajarTierra(s, g);
    return;
  }
  const w = elegir(s, g);
  if (!w) {
    fatiga(s, g, "liviano");
    cobrarMin(s, g, "muerto");
    g.trabajando = false;
    g.anim = "nada";
    return;
  }
  const dq = ritmo(s, g, w.k);
  const got = aplicar(s, w, dq);
  fatiga(s, g, got > 0 ? TAREAS[w.k].peso : "liviano");
  cobrarMin(s, g, got > 0 ? w.partida : "muerto");
  g.trabajando = got > 0;
  g.anim = got > 0 ? herramientaDe(w.k) : "nada";
}

function trabajarBatea(s: Estado, g: Persona): boolean {
  let curso = s.mezclas.find((m) => !m.lista);
  if (!curso) {
    const tipo = tipoQueFalta(s);
    if (!tipo) return false;
    const tarea = tipo === "H" ? "mezclarH" : "mezclarM";
    const vel = Math.max(1e-6, ritmo(s, g, tarea));
    if (s.minuto + 1 / vel > 15 * 60) {
      fatiga(s, g, "liviano");
      cobrarMin(s, g, "muerto");
      g.trabajando = false;
      g.anim = "nada";
      return true;
    }
    if (!tieneMapa(s, receta(tipo))) {
      const map = receta(tipo);
      const soloAgua = aguaEsElFreno(s, map);
      fatiga(s, g, "liviano");
      cobrarMin(s, g, "muerto");
      g.trabajando = false;
      g.anim = "nada";
      return soloAgua;
    }
    curso = iniciarMezcla(s, tipo) ?? undefined;
    if (!curso) return false;
  }
  const tarea = curso.tipo === "H" ? "mezclarH" : "mezclarM";
  curso.prog += ritmo(s, g, tarea);
  fatiga(s, g, "pesado");
  cobrarMin(s, g, TAREAS[tarea].partida);
  g.trabajando = true;
  g.anim = "cubeta";
  if (curso.prog >= 1 - 1e-6) {
    curso.prog = 1;
    curso.lista = true;
    curso.vida = curso.tipo === "H" ? RECETA_H.vida : RECETA_M.vida;
    curso.restante = 1;
  }
  return true;
}

function usarEntrada(s: Estado, mat: Mat, n: number): number {
  const sl = s.entrada[mat];
  if (!sl) return 0;
  const q = Math.min(sl.q, Math.max(0, n));
  if (q <= 1e-12) return 0;
  const avg = sl.q > 0 ? sl.valor / sl.q : 0;
  const costo = avg * q;
  sl.q -= q;
  sl.valor = Math.max(0, sl.valor - costo);
  if (sl.q < 1e-9) {
    sl.q = 0;
    sl.valor = 0;
  }
  return costo;
}

function meterEntrada(s: Estado, mat: Mat, n: number, precio: number) {
  if (n <= 1e-12) return;
  const sl = entSlot(s, mat);
  sl.q += n;
  sl.valor += n * precio;
  if (mat === "cemento") s.cementoAfuera += n;
}

const ORDEN_CARGA: TipoCarga[] = ["cemento", "varilla", "menudo", "madera", "zinc", "block"];

function partirCargas(s: Estado, items: Cantidades): Carga[] {
  const out: Carga[] = [];
  const add = (tipo: TipoCarga, bag: Cantidades) => {
    out.push({ id: "c" + ++s.idSeq, tipo, items: bag, prog: 0 });
  };
  const cement = Math.round(items.cemento ?? 0);
  for (let i = 0; i < cement; i++) add("cemento", { cemento: 1 });
  let v38 = items.v38 ?? 0;
  let v14 = items.v14 ?? 0;
  while (v38 > 1e-6 || v14 > 1e-6) {
    let room = 4;
    const bag: Cantidades = {};
    const t38 = Math.min(v38, room);
    if (t38 > 0) {
      bag.v38 = t38;
      v38 -= t38;
      room -= t38;
    }
    const t14 = Math.min(v14, room);
    if (t14 > 0) {
      bag.v14 = t14;
      v14 -= t14;
    }
    if ((bag.v38 ?? 0) + (bag.v14 ?? 0) <= 0) break;
    add("varilla", bag);
  }
  const men: Cantidades = {};
  if ((items.alambre ?? 0) > 0) men.alambre = items.alambre;
  if ((items.clavo ?? 0) > 0) men.clavo = items.clavo;
  if ((items.clavoTecho ?? 0) > 0) men.clavoTecho = items.clavoTecho;
  if (Object.keys(men).length) add("menudo", men);
  const piezas: Mat[] = [];
  for (const m of ["plywood", "pino", "abeto"] as Mat[]) {
    const n = Math.round(items[m] ?? 0);
    for (let i = 0; i < n; i++) piezas.push(m);
  }
  for (let i = 0; i < piezas.length; i += 2) {
    const bag: Cantidades = {};
    const a = piezas[i]!;
    bag[a] = (bag[a] ?? 0) + 1;
    const b = piezas[i + 1];
    if (b) bag[b] = (bag[b] ?? 0) + 1;
    add("madera", bag);
  }
  let zinc = Math.round(items.zinc ?? 0);
  while (zinc > 0) {
    const t = Math.min(4, zinc);
    add("zinc", { zinc: t });
    zinc -= t;
  }
  let block = items.block ?? 0;
  while (block > 1e-6) {
    const t = Math.min(10, block);
    add("block", { block: Math.round(t * 1000) / 1000 });
    block -= t;
  }
  return out;
}

function cargaSirve(s: Estado, c: Carga): boolean {
  if (c.tipo !== "cemento") return true;
  return s.inv.cemento.q < 20 - 1e-6;
}

function cargaActual(s: Estado): Carga | null {
  for (const t of ORDEN_CARGA) {
    const c = s.cargas.find((x) => x.tipo === t && x.prog < 1 - 1e-8 && cargaSirve(s, x));
    if (c) return c;
  }
  return null;
}

export function hayCarga(s: Estado): boolean {
  return cargaActual(s) != null;
}

function animDeCarga(t: TipoCarga): string {
  if (t === "varilla") return "varilla";
  if (t === "block") return "carretilla";
  return "saco";
}

function guardarCarga(s: Estado, c: Carga) {
  let movioCemento = 0;
  for (const [k, n] of Object.entries(c.items) as [Mat, number][]) {
    let mueve = n;
    if (k === "cemento") mueve = Math.min(n, Math.max(0, 20 - s.inv.cemento.q));
    if (mueve <= 1e-8) continue;
    const sl = s.entrada[k];
    const q = Math.min(mueve, sl?.q ?? 0);
    if (q <= 1e-8) continue;
    const avg = sl && sl.q > 0 ? sl.valor / sl.q : MATERIALES[k].precio;
    sl!.q -= q;
    sl!.valor = Math.max(0, sl!.valor - avg * q);
    s.inv[k].q += q;
    s.inv[k].valor += avg * q;
    if (k === "cemento") {
      s.cementoAfuera = Math.max(0, s.cementoAfuera - q);
      movioCemento += q;
    }
  }
  if (movioCemento > 0 && (s.entrada.cemento?.q ?? 0) < 0.5) {
    const n = Math.round(s.inv.cemento.q);
    apunte(s, "guardado", `Guardado ${n} fundas`, "almacén");
  }
}

function trabajarAcarreo(s: Estado, g: Persona) {
  let dq = ritmo(s, g, "acarreo");
  let anim = "saco";
  let hizo = false;
  while (dq > 1e-8) {
    const c = cargaActual(s);
    if (!c) break;
    anim = animDeCarga(c.tipo);
    const need = 1 - c.prog;
    const use = Math.min(dq, need);
    c.prog += use;
    dq -= use;
    hizo = true;
    if (c.prog >= 1 - 1e-8) {
      c.prog = 1;
      guardarCarga(s, c);
    }
  }
  s.cargas = s.cargas.filter((c) => c.prog < 1 - 1e-8);
  fatiga(s, g, hizo ? "pesado" : "liviano");
  cobrarMin(s, g, hizo ? "farmeo" : "muerto");
  g.trabajando = hizo;
  g.anim = hizo ? anim : "nada";
}

function trabajarTierra(s: Estado, g: Persona) {
  const cerca = dist(g, BOTE_TIERRA) <= 0.55;
  const hay = (s.tierraMonton ?? 0) > 0.02;
  if (cerca && hay) {
    const mueve = Math.min(0.06, s.tierraMonton);
    s.tierraMonton -= mueve;
    s.tierraBote = (s.tierraBote ?? 0) + mueve;
  }
  fatiga(s, g, "medio");
  cobrarMin(s, g, "muerto");
  g.trabajando = cerca && hay;
  g.anim = "carretilla";
}

function trabajarRegar(s: Estado, g: Persona) {
  const w = listos(s).find((x) => x.k === "regar");
  if (!w) {
    fatiga(s, g, "liviano");
    cobrarMin(s, g, "muerto");
    g.trabajando = false;
    g.anim = "nada";
    return;
  }
  const got = aplicar(s, w, ritmo(s, g, "regar"));
  fatiga(s, g, got > 0 ? "medio" : "liviano");
  cobrarMin(s, g, got > 0 ? w.partida : "muerto");
  g.trabajando = got > 0;
  g.anim = got > 0 ? "cubeta" : "nada";
}

function trabajarAgua(s: Estado, g: Persona) {
  const dq = ritmo(s, g, "agua");
  const n = Math.min(dq, Math.max(0, 1.2 - s.inv.agua.q));
  if (n > 1e-8) {
    s.inv.agua.q += n;
    s.aguaNota += n;
    if (s.aguaNota >= 0.1 - 1e-9) {
      const q = Math.floor(s.aguaNota * 10) / 10;
      s.aguaNota -= q;
      apunte(s, "entro", `Entró ${num(q, 1)} m³ al tanque`, "tanque");
    }
  }
  fatiga(s, g, n > 0 ? "medio" : "liviano");
  cobrarMin(s, g, n > 0 ? "farmeo" : "muerto");
  g.trabajando = n > 0;
  g.anim = n > 0 ? "cubeta" : "nada";
  if (n > 1e-8) {
    s.tut.agua = true;
    chequearTutorial(s);
  }
}

function aguaEsElFreno(s: Estado, map: Cantidades): boolean {
  const need = map.agua ?? 0;
  if (need <= 0) return false;
  if (s.inv.agua.q + 1e-9 >= need) return false;
  for (const [k, n] of Object.entries(map) as [Mat, number][]) {
    if (k === "agua") continue;
    if ((s.inv[k]?.q ?? 0) + 1e-9 < n) return false;
  }
  return true;
}

function materialEnAlmacen(s: Estado, w: W): boolean {
  if (w.usaIni && !w.ini && !tieneMapa(s, w.usaIni)) return false;
  if (w.usa) {
    for (const [k, total] of Object.entries(w.usa) as [Mat, number][]) {
      const per = total / Math.max(w.q, 1e-9);
      if (per > 1e-9 && s.inv[k].q <= 1e-9) return false;
    }
  }
  if (w.mezcla) {
    const hay = stockMezcla(s, w.mezcla);
    if (hay <= 1e-6 && !tieneMapa(s, receta(w.mezcla))) return false;
  }
  return true;
}

function sinTrabajoUtil(s: Estado, g: Persona): boolean {
  const w = elegir(s, g);
  if (!w) return true;
  if (w.mezcla && stockMezcla(s, w.mezcla) <= 1e-6) return true;
  if (TAREAS[w.k].lider && !hayLider(s, w.k)) return false;
  return !materialEnAlmacen(s, w);
}

function bateaTieneTrabajo(s: Estado): boolean {
  if (s.mezclas.some((m) => !m.lista)) return true;
  const tipo = tipoQueFalta(s);
  return !!tipo && tieneMapa(s, receta(tipo));
}

function obraEsperaMezcla(s: Estado): boolean {
  for (const w of listos(s)) {
    if (w.mezcla && stockMezcla(s, w.mezcla) < 0.05) return true;
  }
  return false;
}

function regarToca(s: Estado): boolean {
  return s.curando && !s.regadoHoy && s.curadoDias.length < 3 && !fraguaActiva(s);
}

function puestoTieneTrabajo(s: Estado, g: Persona, puesto: Puesto): boolean {
  if (puesto === "sombra") return true;
  if (puesto === "batea") return bateaTieneTrabajo(s);
  if (puesto === "agua") return s.inv.agua.q < 1.1 - 1e-9;
  if (puesto === "acarreo") return hayCarga(s);
  if (puesto === "obra") return !sinTrabajoUtil(s, g);
  return false;
}

export type Labor = "batea" | "agua" | "regar" | "acarreo" | "obra" | "sombra" | "tierra";

function laborEnZona(puesto: Puesto, labor: Labor): boolean {
  if (puesto === "obra") return labor === "obra" || labor === "batea" || labor === "agua" || labor === "regar";
  if (puesto === "batea" || puesto === "agua") return labor === "batea" || labor === "agua";
  if (puesto === "acarreo") return labor === "acarreo";
  return false;
}

function elegirAuto(s: Estado, g: Persona, batiendo: number): Labor {
  const ops = opcionesAuto(s, g, batiendo);
  const ayuda = esAyuda(g.oficio);
  const puestoIlegal = !ayuda && (g.puesto === "batea" || g.puesto === "agua" || g.puesto === "acarreo");
  const propio =
    !puestoIlegal && (g.puesto === "batea" || g.puesto === "agua" || g.puesto === "acarreo" || g.puesto === "obra")
      ? g.puesto
      : "obra";
  if (!ops.length) return propio;
  let best = ops[0]!;
  for (const o of ops) if (o.prio < best.prio) best = o;
  return best.labor;
}

function opcionesAuto(s: Estado, g: Persona, batiendo: number): { labor: Labor; prio: number }[] {
  const ayuda = esAyuda(g.oficio);
  const out: { labor: Labor; prio: number }[] = [];
  const ayudarBatea =
    ayuda &&
    bateaTieneTrabajo(s) &&
    batiendo < 2 &&
    (batiendo === 0 || (g.puesto === "obra" && obraEsperaMezcla(s)));
  if (ayudarBatea) out.push({ labor: "batea", prio: 1 });
  if (ayuda && s.inv.agua.q < 1.1 - 1e-9) out.push({ labor: "agua", prio: 2 });
  if (regarToca(s)) out.push({ labor: "regar", prio: 3 });
  if (ayuda && hayCarga(s)) out.push({ labor: "acarreo", prio: 4 });
  if (!sinTrabajoUtil(s, g)) out.push({ labor: "obra", prio: 5 });
  if (g.oficio === "ayudante" && (s.tierraMonton ?? 0) > 0.05) out.push({ labor: "tierra", prio: 6 });
  return out;
}

function planLabores(s: Estado): Map<string, Labor | null> {
  const out = new Map<string, Labor | null>();
  let batiendo = 0;
  const ociosos: Persona[] = [];
  for (const g of s.gente) {
    if (!g.activo || g.fuera || g.falto || !g.puesto) {
      out.set(g.id, null);
      continue;
    }
    if (g.puesto === "sombra") {
      out.set(g.id, "sombra");
      continue;
    }
    const puestoAjeno =
      (g.puesto === "batea" || g.puesto === "agua" || g.puesto === "acarreo") && !esAyuda(g.oficio);
    if (!puestoAjeno && puestoTieneTrabajo(s, g, g.puesto)) {
      out.set(g.id, g.puesto);
      if (g.puesto === "batea") batiendo += 1;
      continue;
    }
    ociosos.push(g);
  }
  for (const g of ociosos) {
    const labor = elegirAuto(s, g, batiendo);
    out.set(g.id, labor);
    if (labor === "batea") batiendo += 1;
  }
  return out;
}

export function laborDe(s: Estado, g: Persona): Labor | null {
  if (!g.activo || g.fuera || g.falto || !g.puesto) return null;
  return planLabores(s).get(g.id) ?? null;
}

const QUE_LABOR: Record<Labor, string> = {
  batea: "batiendo",
  agua: "buscando agua",
  regar: "regando",
  acarreo: "acarreando",
  obra: "en la obra",
  sombra: "en la sombra",
  tierra: "botando tierra",
};

export function lineaFicha(s: Estado, g: Persona): string | null {
  if (!g.puesto || g.puesto === "sombra") return null;
  const labor = laborDe(s, g);
  if (!labor || labor === g.puesto) return null;
  return `${g.nombre} (${PUESTO_NOMBRE[g.puesto]}) · ${QUE_LABOR[labor]}`;
}

function puestoEfectivo(s: Estado, g: Persona): Puesto | null {
  const labor = laborDe(s, g);
  if (!labor) return null;
  if (labor === "regar") return "obra";
  if (labor === "tierra") return null;
  return labor;
}

function etapaCompleta(s: Estado): boolean {
  const def = ETAPAS[s.etapa];
  if (!def) return false;
  for (const t of def.trabajos) {
    if (runDe(s, s.etapa, t.id).hecho < t.q - 1e-4) return false;
  }
  for (const e of s.extras) if (e.etapa === s.etapa && e.hecho < e.q - 1e-4) return false;
  return true;
}

function revisar(s: Estado) {
  if (s.sello || s.entregada || s.etapa >= 9) return;
  if (!etapaCompleta(s)) return;
  const def = ETAPAS[s.etapa]!;
  let ok = true;
  let motivo = "Ta' derecho. Sigue la obra.";
  if (def.id === "muros" && s.desplomes > s.desplomesCobrados) {
    const n = s.desplomes - s.desplomesCobrados;
    ok = false;
    motivo =
      n === 1
        ? "Se desplomó un tramo. Hay que picar y rehacer 24 block."
        : `Hubo ${n} desplomes. Hay que picar y rehacer ${24 * n} block.`;
  }
  s.sello = { ok, motivo, etapa: s.etapa, pago: 0, nombre: def.nombre };
  s.panel = "sello";
}

export function continuarSello(s: Estado) {
  const seal = s.sello;
  if (!seal) return;
  const i = seal.etapa;
  const def = ETAPAS[i];
  if (!def) {
    s.sello = null;
    s.panel = null;
    return;
  }
  s.stats.sellos += 1;
  if (!seal.ok) {
    const n = s.desplomes - s.desplomesCobrados;
    if (n > 0) {
      s.extras.push({
        id: "rehacer-" + s.desplomes + "-" + s.dia,
        etapa: i,
        k: "block",
        nombre: "Picar y rehacer",
        q: 24 * n,
        hecho: 0,
        bloquea: false,
        mezcla: "M",
        mezclaQ: (24 * n) / 22,
        usa: { block: 24 * n },
        partida: "block",
      });
      s.desplomesCobrados = s.desplomes;
    }
    s.etapas[i]!.sello = "observado";
    s.etapas[i]!.motivo = seal.motivo;
    s.etapas[i]!.primera = false;
    diario(s, `OBSERVADO en ${def.nombre}. ${seal.motivo}`);
    s.sello = null;
    s.panel = null;
    return;
  }
  let pago = 0;
  if (def.tramo > 0) {
    const bruto = Math.round(CONTRATO * def.tramo);
    const descuenta = Math.min(s.adelanto, bruto);
    s.adelanto -= descuenta;
    pago = bruto - descuenta;
    s.caja += pago;
    s.cobrado += pago;
  }
  seal.pago = pago;
  if (s.etapas[i]!.primera == null) {
    s.etapas[i]!.primera = true;
    s.stats.aprobadasPrimera += 1;
  }
  s.etapas[i]!.sello = "aprobado";
  s.etapas[i]!.motivo = seal.motivo;
  diario(s, pago > 0 ? `APROBADO: ${def.nombre}. Cobro: +${peso(pago)}.` : `APROBADO: ${def.nombre}.`);
  if (def.id === "zapata") s.fragua = programarFragua(s, "La zapata fragua. El block empieza mañana a las 7:00.");
  if (def.id === "columnas") s.fragua = programarFragua(s, "Las columnas fraguan. Mañana se puede seguir.");
  if (def.id === "viga") {
    s.curando = true;
    s.curadoDias = [];
    s.regadoHoy = false;
    s.regarProg = 0;
  }
  s.etapa += 1;
  s.sello = null;
  if (s.etapa >= 9) {
    s.entregada = true;
    if (!s.direccionCobrada) {
      s.caja -= DIRECCION_DIA;
      s.costos.direccion.mo += DIRECCION_DIA;
      s.direccionCobrada = true;
      s.diasTrabajados += 1;
      diario(s, `Dirección del día: −${peso(DIRECCION_DIA)}.`);
    }
    notarMezclaTarde(s);
    s.panel = "informe";
    diario(s, "Obra entregada. Doña Carmen tiene su caseta.");
  } else s.panel = null;
}

function programarFragua(s: Estado, que: string): { dia: number; minuto: number; que: string } {
  let dia = s.dia + 1;
  if (esDomingo(dia)) dia += 1;
  return { dia, minuto: 7 * 60, que };
}

function pagarNomina(s: Estado) {
  if (s.nominaPagada) return;
  let total = 0;
  let herrSum = 0;
  for (const g of s.gente) {
    if (!g.activo || g.falto) continue;
    const j = jornalDe(g.oficio, g.rinde);
    const diff = j - g.moHoy;
    if (diff > 0.01) {
      s.costos.muerto.mo += diff;
      const rate = j / 480;
      anotarMuerto(s, g, diff, rate > 0 ? diff / rate : 0, "resto");
      g.moHoy = j;
    }
    const herr = j * HERRAMIENTA;
    s.caja -= j + herr;
    s.costos.herramienta.mo += herr;
    total += j;
    herrSum += herr;
    g.dias += 1;
    g.fuera = true;
    g.trabajando = false;
  }
  s.nominaPagada = true;
  s.herrHoy = herrSum;
  if (total > 0) {
    diario(s, `Nómina: −${peso(total)}. Herramienta: −${peso(herrSum)}.`);
    aviso(s, `Se fueron a las 3. Nómina ${peso(total)} · Herramienta ${peso(herrSum)}.`);
  }
}

function abrirFinde(s: Estado) {
  notarMezclaTarde(s);
  if (s.panel === "finde" || s.panel === "informe") return;
  if (!s.direccionCobrada && s.firmado && !s.entregada) {
    s.caja -= DIRECCION_DIA;
    s.costos.direccion.mo += DIRECCION_DIA;
    s.direccionCobrada = true;
    s.diasTrabajados += 1;
    diario(s, `Dirección del día: −${peso(DIRECCION_DIA)}.`);
  }
  let manana = s.dia + 1;
  if (esDomingo(manana)) manana += 1;
  s.faltanManana = [];
  for (const g of s.gente) {
    const nom = `${g.nombre} ${g.apellido}`;
    if (g.cansancio >= 85) s.faltanManana.push(`${nom} · frito, no cobra`);
    else if (g.libre) s.faltanManana.push(`${nom} · libre, no cobra`);
    else if (g.mania === "madrugador" && esSabado(manana)) s.faltanManana.push(`${nom} · el sábado no viene`);
  }
  if (!s.entregada && s.caja < -1 && puedeAdelantar(s)) adelantar(s);
  if (!s.entregada && s.caja < -1) {
    s.panel = "perdida";
    return;
  }
  s.panel = s.entregada ? "informe" : "finde";
}

function vigilarNubes(s: Estado) {
  const hoy = s.lluvias.find((r) => r.dia === s.dia && s.minuto < r.ini);
  const cement = s.entrada.cemento?.q ?? 0;
  if (hoy && cement >= 1 && !s.avisoNubes) {
    s.avisoNubes = true;
    const texto = "Hay cemento en la entrada y vienen nubes.";
    diario(s, texto);
    aviso(s, texto);
  }
}

function avisarFaltaManana(s: Estado) {
  if (s.aviso14) return;
  s.aviso14 = true;
  const q = loQueFalta(s);
  const partes: string[] = [];
  if ((q.cemento ?? 0) >= 1) partes.push(`${Math.round(q.cemento!)} fundas`);
  if ((q.block ?? 0) >= 1) partes.push(`${Math.round(q.block!)} block`);
  if ((q.arena ?? 0) > 0.02) partes.push(`${num(q.arena!, 1)} m³ de arena`);
  if ((q.grava ?? 0) > 0.02) partes.push(`${num(q.grava!, 1)} m³ de grava`);
  if (!partes.length) {
    for (const [k, n] of Object.entries(q) as [Mat, number][]) {
      if (!n || k === "cemento" || k === "block" || k === "arena" || k === "grava") continue;
      partes.push(`${num(n, 0)} ${MATERIALES[k].unidad} de ${MATERIALES[k].nombre}`);
      if (partes.length >= 3) break;
    }
  }
  if (!partes.length) return;
  const texto = `Para mañana faltan ${partes.join(" y ")}`;
  diario(s, texto);
  apunte(s, "nota", texto, "");
}

function paso(s: Estado) {
  if (s.entregada || s.minuto >= 18 * 60) {
    abrirFinde(s);
    return;
  }
  const ll = lluviaAhora(s);
  if (ll && !s.lluviaOn) comenzarLluvia(s, ll);
  if (!ll && s.lluviaOn) escampar(s);
  s.lluviaOn = !!ll;
  if (s.fragua && !fraguaActiva(s)) s.fragua = null;
  entregarPedidos(s);
  envejecerMezclas(s);
  vigilarNubes(s);
  const sinNota = !s.sita?.oferta;
  revisarSita(s);
  if (s.minuto === 14 * 60 && sinNota && !s.sita?.oferta) avisarFaltaManana(s);
  flushSalidas(s);
  if (s.plomo && s.minuto < 15 * 60) {
    s.plomo.min += 1;
    if (s.plomo.min >= 60) resolverPlomoAuto(s);
  }
  if (s.minuto < 15 * 60) {
    for (const g of s.gente) trabajarPersona(s, g);
    for (const g of s.gente) cerrarEspera(s, g);
    pulsoGolpeMaestro(s);
  }
  s.minuto += 1;
  if (s.minuto >= 15 * 60 && !s.nominaPagada) pagarNomina(s);
  if (s.minuto >= 18 * 60) abrirFinde(s);
  else if (!s.panel) revisar(s);
}

export function tick(s: Estado, dtReal: number) {
  if (!s.firmado || s.entregada || s.pausa) return;
  const sim = dtReal >= 0.15;
  if (!sim && s.sita?.fase === "yendo" && !s.panel) {
    moverSita(s, clamp(dtReal, 0, 0.1), 11);
    if (s.sita.fase === "yendo") return;
    if (!s.panel) s.panel = "sita";
    return;
  }
  if (s.panel) return;
  const dt = clamp(dtReal, 0, 0.1);
  moverMaestro(s, dt);
  moverCuadrilla(s, dt);
  if (s.gente.length + s.reserva.length === 0) return;
  s.frac += dt * 5;
  let n = 0;
  while (s.frac >= 1 && n < 8) {
    if (s.panel || s.entregada) break;
    paso(s);
    s.frac -= 1;
    n += 1;
  }
  if (s.sita?.fase === "yendo" && !s.panel) moverSita(s, sim ? 1 : dt, sim ? 240 : 11);
  else if (s.sita?.fase === "vuelta") moverSita(s, sim ? 1 : dt, sim ? 240 : 11);
}

export function avanzarMinutos(s: Estado, n: number) {
  for (let i = 0; i < n; i++) {
    if (s.entregada || s.minuto >= 18 * 60) return;
    const panel = s.panel;
    paso(s);
    if (s.panel === "sello" || s.panel === "finde" || s.panel === "informe") return;
    if (panel && panel !== "sello") s.panel = panel;
  }
}

function cajasSolidas(): { x0: number; y0: number; x1: number; y1: number }[] {
  const caja = (cx: number, cy: number, dx: number, dy: number) => ({
    x0: cx - dx / 2,
    y0: cy - dy / 2,
    x1: cx + dx / 2,
    y1: cy + dy / 2,
  });
  return [
    caja(SITIOS.oficina.x, SITIOS.oficina.y, 2.35, 1.9),
    caja(SITIOS.almacen.x, SITIOS.almacen.y, 2.45, 2.05),
    caja(SITIOS.ferreteria.x, SITIOS.ferreteria.y, 4.1, 2.5),
  ];
}

function circulosSolidos(): { x: number; y: number; r: number }[] {
  return [
    { x: SITIOS.tanque.x, y: SITIOS.tanque.y, r: 0.62 },
    { x: TROMPO_CUERPO.x, y: TROMPO_CUERPO.y, r: TROMPO_CUERPO.r },
    { x: SITIOS.sombra.x, y: SITIOS.sombra.y, r: 0.48 },
  ];
}

function choca(x: number, y: number): boolean {
  for (const c of cajasSolidas()) if (x > c.x0 && x < c.x1 && y > c.y0 && y < c.y1) return true;
  for (const c of circulosSolidos()) if (Math.hypot(x - c.x, y - c.y) < c.r) return true;
  return false;
}

function sacar(x: number, y: number): { x: number; y: number } {
  let px = x;
  let py = y;
  for (let n = 0; n < 6; n++) {
    let hit = false;
    for (const c of cajasSolidas()) {
      if (!(px > c.x0 && px < c.x1 && py > c.y0 && py < c.y1)) continue;
      hit = true;
      const iz = px - c.x0;
      const de = c.x1 - px;
      const ab = py - c.y0;
      const ar = c.y1 - py;
      const m = Math.min(iz, de, ab, ar);
      if (m === iz) px = c.x0;
      else if (m === de) px = c.x1;
      else if (m === ab) py = c.y0;
      else py = c.y1;
    }
    for (const c of circulosSolidos()) {
      const dx = px - c.x;
      const dy = py - c.y;
      const d = Math.hypot(dx, dy);
      if (d >= c.r) continue;
      hit = true;
      const nx = d < 1e-6 ? 1 : dx / d;
      const ny = d < 1e-6 ? 0 : dy / d;
      px = c.x + nx * c.r;
      py = c.y + ny * c.r;
    }
    if (!hit) break;
  }
  return { x: px, y: py };
}

function puertaAlmacen(): { x: number; y: number } {
  return { x: SITIOS.almacen.x + 1.4, y: SITIOS.almacen.y + 0.15 };
}

function segCaja(ax: number, ay: number, bx: number, by: number, c: { x0: number; y0: number; x1: number; y1: number }): boolean {
  const e = 0.02;
  let t0 = 0;
  let t1 = 1;
  const dx = bx - ax;
  const dy = by - ay;
  const clip = (p: number, q: number) => {
    if (Math.abs(p) < 1e-12) return q >= 0;
    const r = q / p;
    if (p < 0) {
      if (r > t1) return false;
      if (r > t0) t0 = r;
    } else {
      if (r < t0) return false;
      if (r < t1) t1 = r;
    }
    return true;
  };
  if (!clip(-dx, ax - (c.x0 + e))) return false;
  if (!clip(dx, c.x1 - e - ax)) return false;
  if (!clip(-dy, ay - (c.y0 + e))) return false;
  if (!clip(dy, c.y1 - e - ay)) return false;
  return t0 < t1;
}

function segCirculo(ax: number, ay: number, bx: number, by: number, c: { x: number; y: number; r: number }): boolean {
  const dx = bx - ax;
  const dy = by - ay;
  const fx = ax - c.x;
  const fy = ay - c.y;
  const a = dx * dx + dy * dy;
  if (a < 1e-12) return false;
  const rr = Math.max(0.05, c.r - 0.02);
  const b = 2 * (fx * dx + fy * dy);
  const cc = fx * fx + fy * fy - rr * rr;
  const disc = b * b - 4 * a * cc;
  if (disc < 0) return false;
  const s = Math.sqrt(disc);
  const u1 = (-b - s) / (2 * a);
  const u2 = (-b + s) / (2 * a);
  if (u1 > 0.002 && u1 < 0.998) return true;
  if (u2 > 0.002 && u2 < 0.998) return true;
  return cc < 0 && u1 < 0.002 && u2 > 0.998;
}

function segmentoChoca(ax: number, ay: number, bx: number, by: number): boolean {
  for (const c of cajasSolidas()) if (segCaja(ax, ay, bx, by, c)) return true;
  for (const c of circulosSolidos()) if (segCirculo(ax, ay, bx, by, c)) return true;
  return false;
}

function rodeos(ax: number, ay: number, gx: number, gy: number): { x: number; y: number }[] {
  const o = 0.18;
  const out: { x: number; y: number }[] = [];
  for (const c of cajasSolidas()) {
    if (!segCaja(ax, ay, gx, gy, c)) continue;
    out.push(
      { x: c.x0 - o, y: c.y0 - o },
      { x: c.x1 + o, y: c.y0 - o },
      { x: c.x0 - o, y: c.y1 + o },
      { x: c.x1 + o, y: c.y1 + o },
    );
  }
  for (const c of circulosSolidos()) {
    if (!segCirculo(ax, ay, gx, gy, c)) continue;
    const rr = c.r + o;
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI * 2 * i) / 8;
      out.push({ x: c.x + Math.cos(a) * rr, y: c.y + Math.sin(a) * rr });
    }
  }
  return out;
}

function andar(x: number, y: number, tx: number, ty: number, gx?: number, gy?: number): { x: number; y: number } {
  if (choca(x, y)) return sacar(x, y);
  const metaX = gx ?? tx;
  const metaY = gy ?? ty;
  const lejos = Math.hypot(metaX - tx, metaY - ty) > 0.35;
  if (!choca(tx, ty) && (!lejos || !segmentoChoca(x, y, tx, ty))) return { x: tx, y: ty };
  if (lejos) {
    let mx = metaX;
    let my = metaY;
    if (choca(mx, my)) {
      const s = sacar(mx, my);
      mx = s.x;
      my = s.y;
    }
    let best: { x: number; y: number } | null = null;
    let bestScore = Infinity;
    for (const w of rodeos(x, y, mx, my)) {
      if (choca(w.x, w.y)) continue;
      if (segmentoChoca(x, y, w.x, w.y)) continue;
      const dw = Math.hypot(w.x - x, w.y - y);
      if (dw < 0.12) continue;
      const score = dw + Math.hypot(mx - w.x, my - w.y);
      if (score < bestScore) {
        bestScore = score;
        best = w;
      }
    }
    if (best) {
      const dw = Math.hypot(best.x - x, best.y - y);
      const paso = Math.hypot(tx - x, ty - y);
      const t = dw > 1e-6 ? Math.min(1, paso / dw) : 0;
      const nx = x + (best.x - x) * t;
      const ny = y + (best.y - y) * t;
      if (!choca(nx, ny)) return { x: nx, y: ny };
    }
  }
  const dx = tx - x;
  const dy = ty - y;
  if (!choca(x + dx, y)) return { x: x + dx, y };
  if (!choca(x, y + dy)) return { x, y: y + dy };
  const d = Math.hypot(dx, dy) || 1;
  const ux = -dy / d;
  const uy = dx / d;
  if (!choca(x + ux * d, y + uy * d)) return { x: x + ux * d, y: y + uy * d };
  if (!choca(x - ux * d, y - uy * d)) return { x: x - ux * d, y: y - uy * d };
  return { x, y };
}

function moverMaestro(s: Estado, dt: number) {
  const ax0 = s.mando.ax;
  const ay0 = s.mando.ay;
  const len = Math.hypot(ax0, ay0);
  let dx = 0;
  let dy = 0;
  const k = Math.SQRT1_2;
  if (len > 0.08) {
    const nx = ax0 / len;
    const ny = ay0 / len;
    dx = (nx - ny) * k;
    dy = (-nx - ny) * k;
    s.yaw = Math.atan2(-nx, ny);
    s.destino = null;
  } else if (s.destino) {
    dx = s.destino.x - s.jugador.x;
    dy = s.destino.y - s.jugador.y;
    const d = Math.hypot(dx, dy);
    if (d < 0.18) {
      s.destino = null;
      s.vel = 0;
      return;
    }
    dx /= d;
    dy /= d;
    const ax = (dx - dy) / (2 * k);
    const ay = -(dx + dy) / (2 * k);
    const l = Math.hypot(ax, ay) || 1;
    s.yaw = Math.atan2(-ax / l, ay / l);
  } else {
    s.vel = 0;
    return;
  }
  const paso = andar(s.jugador.x, s.jugador.y, s.jugador.x + dx * VEL_MAESTRO * dt, s.jugador.y + dy * VEL_MAESTRO * dt);
  s.jugador.x = clamp(paso.x, 0.6, 33.4);
  s.jugador.y = clamp(paso.y, 3.75, 25.5);
  s.vel = VEL_MAESTRO;
}

export function seguirDedo(s: Estado, x: number, y: number, soltar: boolean, alcance = 4.4) {
  if (soltar) {
    s.destino = null;
    s.vel = 0;
    s.mando.ax = 0;
    s.mando.ay = 0;
    return;
  }
  const tx = clamp(x, 0.6, 33.4);
  const ty = clamp(y, 3.75, 25.5);
  let px = s.jugador.x;
  let py = s.jugador.y;
  let queda = Math.max(0, alcance);
  for (let i = 0; i < 8 && queda > 0.01; i++) {
    const d = Math.hypot(tx - px, ty - py);
    if (d < 0.08) break;
    const st = Math.min(0.55, d, queda);
    const nx = px + ((tx - px) / d) * st;
    const ny = py + ((ty - py) / d) * st;
    const p = andar(px, py, nx, ny, tx, ty);
    const av = Math.hypot(p.x - px, p.y - py);
    if (av < 1e-4) break;
    queda -= av;
    px = p.x;
    py = p.y;
  }
  s.jugador.x = clamp(px, 0.6, 33.4);
  s.jugador.y = clamp(py, 3.75, 25.5);
  s.destino = null;
  s.mando.ax = 0;
  s.mando.ay = 0;
  s.vel = Math.hypot(tx - s.jugador.x, ty - s.jugador.y) > 0.2 ? VEL_MAESTRO : 0;
}

const ANCLA_OBRA = [
  { x: 16.3, y: 13.5 },
  { x: 16.3, y: 15.7 },
  { x: 21.7, y: 13.5 },
  { x: 21.7, y: 15.7 },
  { x: 19, y: 12.3 },
];

export function ancla(s: Estado, g: Persona): { x: number; y: number } | null {
  if (!g.activo || g.fuera || g.falto) return null;
  const labor = laborDe(s, g);
  if (lluviaAhora(s)) return puertaAlmacen();
  if (labor === "tierra") {
    const ciclo = 10;
    const t = (s.minuto + g.nombre.length) % ciclo;
    return t < 5 ? sacar(SITIOS.tierra.x, SITIOS.tierra.y) : { ...BOTE_TIERRA };
  }
  const puesto = puestoEfectivo(s, g);
  if (!puesto) return null;
  if (puesto === "obra") {
    const lista = s.gente.filter((p) => puestoEfectivo(s, p) === "obra");
    const i = Math.max(0, lista.findIndex((p) => p.id === g.id));
    return ANCLA_OBRA[i % ANCLA_OBRA.length]!;
  }
  if (puesto === "acarreo") {
    if (!hayCarga(s)) return dist(g, SITIOS.entrada) <= dist(g, SITIOS.almacen) ? SITIOS.entrada : puertaAlmacen();
    const ciclo = 16;
    const t = ((s.minuto + g.nombre.length) % ciclo) / ciclo;
    const u = t < 0.5 ? t * 2 : (1 - t) * 2;
    const puerta = puertaAlmacen();
    const vias = [SITIOS.entrada, { x: 11.4, y: 18.95 }, { x: 6.3, y: 18.15 }, puerta];
    let rest = u * (vias.length - 1);
    const i = Math.min(vias.length - 2, Math.floor(rest));
    const f = rest - i;
    const a = vias[i]!;
    const b = vias[i + 1]!;
    return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
  }
  if (puesto === "sombra") return sacar(SITIOS.sombra.x, SITIOS.sombra.y);
  return PUESTO_SITIO[puesto];
}

function destinoPersona(s: Estado, g: Persona): { x: number; y: number } | null {
  return ancla(s, g);
}

function moverCuadrilla(s: Estado, dt: number) {
  for (const g of s.gente) {
    const dest = destinoPersona(s, g);
    const x0 = g.x;
    const y0 = g.y;
    if (dest) {
      const dx = dest.x - g.x;
      const dy = dest.y - g.y;
      const d = Math.hypot(dx, dy);
      if (d >= 0.08) {
        let sp = VEL_CUADRILLA;
        if (g.mania === "patas") sp *= 1.2;
        const step = Math.min(d, sp * dt);
        const nxt = andar(g.x, g.y, g.x + (dx / d) * step, g.y + (dy / d) * step, dest.x, dest.y);
        g.x = nxt.x;
        g.y = nxt.y;
      }
    }
    const movido = Math.hypot(g.x - x0, g.y - y0);
    if (movido > 1e-4 && !lluviaAhora(s)) {
      let sp = VEL_CUADRILLA;
      if (g.mania === "patas") sp *= 1.2;
      anotarCamino(s, g, movido / (sp * 0.2));
    }
  }
}

function anotarCamino(s: Estado, g: Persona, minutos: number) {
  const labor = laborDe(s, g);
  if (!labor || !g.puesto || g.puesto === "sombra") return;
  const bag = (s.stats.caminata ??= { zona: 0, cruce: 0, puesto: 0, cruces: {} });
  if (labor === g.puesto) bag.puesto += minutos;
  else if (laborEnZona(g.puesto, labor)) bag.zona += minutos;
  else bag.cruce += minutos;
}

function cerrarEspera(s: Estado, g: Persona) {
  if (!g.activo || g.fuera || g.falto || !g.puesto || g.puesto === "sombra") {
    g.esperaZona = 0;
    g.enCruce = false;
    return;
  }
  const labor = laborDe(s, g);
  const cruzando = !!(labor && labor !== g.puesto && !laborEnZona(g.puesto, labor));
  if (cruzando && !g.enCruce) {
    const bag = (s.stats.caminata ??= { zona: 0, cruce: 0, puesto: 0, cruces: {} });
    bag.cruces[g.nombre] = (bag.cruces[g.nombre] ?? 0) + 1;
  }
  g.enCruce = cruzando;
  if (puestoTieneTrabajo(s, g, g.puesto)) {
    g.esperaZona = 0;
    return;
  }
  if (labor && labor !== g.puesto && laborEnZona(g.puesto, labor)) {
    g.esperaZona = 0;
    return;
  }
  if (cruzando) {
    g.esperaZona = 60;
    return;
  }
  g.esperaZona = Math.min(60, (g.esperaZona ?? 0) + 1);
}

export function nominaPendiente(s: Estado): number {
  if (s.nominaPagada) return 0;
  let t = 0;
  for (const g of s.gente) if (g.activo && !g.falto && !g.fuera) t += jornalDe(g.oficio, g.rinde);
  return t;
}

export function cajaLibre(s: Estado): number {
  return s.caja - nominaPendiente(s);
}

function sumaNecesidad(s: Estado, idx: number, restante: boolean, enteras = false): Cantidades {
  const def = ETAPAS[idx];
  const need: Cantidades = {};
  if (!def) return need;
  const add = (m: Mat, n: number) => {
    if (n > 1e-8) need[m] = (need[m] ?? 0) + n;
  };
  for (const t of def.trabajos) {
    const run = runDe(s, idx, t.id);
    const frac = restante ? Math.max(0, (t.q - run.hecho) / t.q) : 1;
    if (t.usa) for (const [k, n] of Object.entries(t.usa) as [Mat, number][]) add(k, n * frac);
    if (t.usaIni && (!restante || !run.ini)) for (const [k, n] of Object.entries(t.usaIni) as [Mat, number][]) add(k, n);
    if (t.mezcla && t.mezclaQ) {
      const map = receta(t.mezcla);
      let batches = t.mezclaQ * frac;
      if (enteras && restante && batches > 1e-6) batches = Math.ceil(batches - 1e-9);
      for (const [k, n] of Object.entries(map) as [Mat, number][]) add(k, n * batches);
    }
  }
  if (restante) {
    for (const e of s.extras) {
      if (e.etapa !== idx) continue;
      const frac = Math.max(0, (e.q - e.hecho) / e.q);
      if (e.usa) for (const [k, n] of Object.entries(e.usa) as [Mat, number][]) add(k, n * frac);
      if (e.mezcla && e.mezclaQ) {
        const map = receta(e.mezcla);
        let batches = e.mezclaQ * frac;
        if (enteras && batches > 1e-6) batches = Math.ceil(batches - 1e-9);
        for (const [k, n] of Object.entries(map) as [Mat, number][]) add(k, n * batches);
      }
    }
  }
  return need;
}

function enCamino(s: Estado, m: Mat): number {
  let n = 0;
  for (const p of s.pedidos) n += p.items[m] ?? 0;
  return n;
}

export function loQueFalta(s: Estado): Cantidades {
  let need = sumaNecesidad(s, s.etapa, true, true);
  const nxt = sumaNecesidad(s, s.etapa + 1, false);
  for (const [k, n] of Object.entries(nxt) as [Mat, number][]) need[k] = (need[k] ?? 0) + n;
  if (!pideCompra(need)) {
    for (let i = s.etapa + 2; i < ETAPAS.length; i++) {
      const lejos = sumaNecesidad(s, i, false);
      if (pideCompra(lejos)) {
        need = lejos;
        break;
      }
    }
  }
  for (const m of s.mezclas) {
    const frac = m.lista ? m.restante : Math.max(m.prog, 0.15);
    const map = receta(m.tipo);
    for (const [k, n] of Object.entries(map) as [Mat, number][]) {
      if (need[k]) need[k] = Math.max(0, (need[k] ?? 0) - n * frac);
    }
  }
  const out: Cantidades = {};
  for (const m of COMPRA) {
    let n = (need[m] ?? 0) - tenido(s, m) - enCamino(s, m);
    if (n <= 0.02) continue;
    const paso = MATERIALES[m].paso;
    let q = Math.ceil((n - 1e-9) / paso) * paso;
    if (m !== "cemento") {
      const esp = espacio(s, m) - enCamino(s, m);
      q = Math.min(q, Math.max(0, Math.floor((esp + 1e-9) / paso) * paso));
    }
    if (q > 0) out[m] = Math.round(q * 1000) / 1000;
  }
  return out;
}

export function marcarLoQueFalta(s: Estado) {
  s.tut.pedido = true;
  chequearTutorial(s);
}

function tieneItems(items: Cantidades): boolean {
  return Object.values(items).some((n) => (n ?? 0) > 0);
}

function gapCompra(s: Estado, need: Cantidades): boolean {
  return COMPRA.some((m) => (need[m] ?? 0) - tenido(s, m) - enCamino(s, m) > 0.02);
}

function debeProponer(s: Estado): boolean {
  if (gapCompra(s, sumaNecesidad(s, s.etapa, true, true))) return true;
  for (let i = s.etapa + 1; i < ETAPAS.length; i++) {
    const need = sumaNecesidad(s, i, false);
    if (!pideCompra(need)) continue;
    return gapCompra(s, need);
  }
  return false;
}

function paradaPorMaterial(s: Estado): boolean {
  if (!s.firmado || s.entregada || s.etapa >= 9) return false;
  if (lluviaAhora(s) || s.plomo || fraguaActiva(s)) return false;
  if (s.minuto >= 15 * 60) return false;
  const pendientes = works(s).filter((w) => w.hecho < w.q - 1e-4 && !w.soloMaestro);
  const siguiente = pendientes.find((w) => prereqOk(s, w)) ?? pendientes[0];
  if (!siguiente) return false;
  const mf = materialFalta(s, siguiente);
  return !!mf && mf.includes("Ferretería");
}

function llegadaPedido(s: Estado, urgente: boolean, minutoBase = s.minuto): { dia: number; minuto: number } {
  let dia = s.dia;
  let minuto = minutoBase + 180;
  if (!urgente) {
    dia = s.dia + 1;
    minuto = 7 * 60 + 30;
  }
  if (esDomingo(dia)) {
    dia += 1;
    if (!urgente) minuto = 7 * 60 + 30;
  }
  if (urgente && minuto >= 18 * 60) {
    dia += 1;
    minuto = 7 * 60 + 30;
    if (esDomingo(dia)) dia += 1;
  }
  return { dia, minuto };
}

const ORDEN_NOTA: Mat[] = ["cemento", "block", "v38", "v14", "arena", "grava"];

function textoLista(items: Cantidades, primero?: Mat | null): string {
  const partes: string[] = [];
  const vistos = new Set<Mat>();
  const push = (m: Mat) => {
    if (vistos.has(m)) return;
    vistos.add(m);
    const n = items[m];
    if (!n || n <= 0) return;
    if (m === "cemento") partes.push(`${Math.round(n)} fundas`);
    else if (m === "block") partes.push(`${Math.round(n)} block`);
    else if (m === "v38") partes.push(`${Math.round(n)} varillas 3/8`);
    else if (m === "v14") partes.push(`${Math.round(n)} varillas 1/4`);
    else if (m === "arena") partes.push(`${num(n, 1)} m³ de arena`);
    else if (m === "grava") partes.push(`${num(n, 1)} m³ de grava`);
    else partes.push(`${num(n, 0)} ${MATERIALES[m].unidad} de ${MATERIALES[m].nombre}`);
  };
  if (primero) push(primero);
  for (const m of ORDEN_NOTA) push(m);
  for (const m of COMPRA) if (!ORDEN_NOTA.includes(m)) push(m);
  if (partes.length > 3) return `${partes.slice(0, 3).join(", ")}...`;
  return partes.join(", ");
}

function ofrecerSita(s: Estado, items: Cantidades, urgente: boolean) {
  const mats = Object.entries(items).reduce((a, [k, n]) => a + (n ?? 0) * MATERIALES[k as Mat].precio, 0);
  const flete = urgente ? FLETE_URGENTE : FLETE;
  const total = mats + flete;
  if (mats <= 0) return;
  const llega = llegadaPedido(s, urgente, s.minuto + 1);
  const cuando = urgente ? `llega a las ${horaDe(llega.minuto)}` : "llega mañana 7:30";
  const modo = urgente ? "Urgente" : "Normal";
  const cabeza = urgente ? "Para hoy faltan" : "Para mañana faltan";
  const primero = urgente ? null : matQueFrena(s);
  let texto = `${cabeza}: ${textoLista(items, primero)}. ¿Pido? ${modo} ${peso(total)}, ${cuando}`;
  if (total > cajaLibre(s) + 0.5 && puedeAdelantar(s, total)) {
    const libre = cajaLibre(s);
    const monto = montoAdelanto(s);
    if (total <= libre + monto + 0.5) {
      const quedan = libre + monto - total;
      texto += ` Caja libre ${peso(libre)}. Al tocar Pedir, Doña Carmen adelanta ${peso(monto)} y quedan libres ${peso(quedan)}.`;
    } else {
      const faltan = Math.max(0, total - libre - monto);
      texto += `. Caja libre ${peso(libre)}. Ni con el adelanto de ${peso(monto)} alcanza: faltan ${peso(faltan)}.`;
    }
  }
  s.sita.oferta = { items, urgente, mats, flete, total, texto };
  s.sita.ultima = { items: { ...items }, urgente, mats, flete, total, texto };
  s.sita.editando = false;
  if (s.sita.fase === "casa") {
    const p = puertaAlmacen();
    s.sita.x = p.x;
    s.sita.y = p.y;
  }
  s.sita.fase = "yendo";
  apunte(s, "nota", texto, "almacén");
  diario(s, `Sita propone un pedido ${urgente ? "urgente" : "normal"} de ${peso(total)}.`);
}

function revisarSita(s: Estado) {
  if (!s.sita || !s.firmado || s.entregada) return;
  if (s.gente.length + s.reserva.length === 0) return;
  if (s.sita.oferta || s.sita.fase === "yendo" || s.sita.fase === "nota") return;
  const parada = paradaPorMaterial(s);
  const sube = parada && !s.sita.paro && s.pedidos.length === 0;
  if (s.pedidos.length === 0) s.sita.paro = parada;
  if (s.pedidos.length > 0 || s.minuto >= 15 * 60) return;
  if (sube && s.minuto + 1 < 12 * 60 && s.sita.urgenteDia !== s.dia) {
    const items = loQueFalta(s);
    if (tieneItems(items)) {
      s.sita.urgenteDia = s.dia;
      ofrecerSita(s, items, true);
      return;
    }
  }
  if (s.minuto === 14 * 60 && s.sita.rechazoDia !== s.dia && debeProponer(s)) {
    const items = loQueFalta(s);
    if (tieneItems(items)) ofrecerSita(s, items, false);
  }
}

function cerrarOfertaSita(s: Estado) {
  if (!s.sita) return;
  if (!s.sita.oferta && s.sita.fase !== "nota" && s.sita.fase !== "yendo") return;
  s.sita.oferta = null;
  s.sita.editando = false;
  if (s.sita.fase === "yendo" || s.sita.fase === "nota") s.sita.fase = "vuelta";
  if (s.panel === "sita") s.panel = null;
}

export function aceptarSita(s: Estado): string | null {
  const of = s.sita?.oferta;
  if (!of) return "Sita no tiene nada que pedir.";
  let err = pedir(s, of.items, of.urgente);
  if (err && /nómina|caja libre/.test(err) && pedidoAlcanza(s, of.total) && of.total > cajaLibre(s) + 0.5) {
    adelantar(s, of.total);
    err = pedir(s, of.items, of.urgente);
  }
  if (!err) {
    s.tut.pedido = true;
    s.tut.sita = true;
    s.sita.ultima = null;
    chequearTutorial(s);
    return null;
  }
  if (/nómina|caja libre/.test(err)) {
    const libre = cajaLibre(s);
    let faltan = Math.max(0, of.total - libre);
    if (puedeAdelantar(s, of.total)) {
      const monto = montoAdelanto(s);
      if (of.total > libre + monto + 0.5) faltan = Math.max(0, of.total - libre - monto);
    }
    cerrarOfertaSita(s);
    return `El pedido es ${peso(of.total)}. La caja libre es ${peso(libre)}. Faltan ${peso(faltan)}.`;
  }
  return err;
}

export function rechazarSita(s: Estado) {
  if (!s.sita) return;
  s.sita.rechazoDia = s.dia;
  s.sita.rechazoConParo = !!s.sita.paro;
  s.sita.oferta = null;
  s.sita.editando = false;
  if (s.sita.fase !== "casa") s.sita.fase = "vuelta";
  if (s.panel === "sita") s.panel = null;
}

export function puntoSita(s: Estado): { x: number; y: number } {
  if (!s.sita || s.sita.fase === "casa") return { x: SITIOS.oficina.x - 0.35, y: SITIOS.oficina.y + 0.72 };
  return { x: s.sita.x, y: s.sita.y };
}

function ofrecerManual(s: Estado, items: Cantidades, urgente: boolean) {
  const mats = Object.entries(items).reduce((a, [k, n]) => a + (n ?? 0) * MATERIALES[k as Mat].precio, 0);
  if (mats <= 0) return;
  const flete = urgente ? FLETE_URGENTE : FLETE;
  const total = mats + flete;
  const llega = llegadaPedido(s, urgente, s.minuto + 1);
  const cuando = urgente ? `llega a las ${horaDe(llega.minuto)}` : "llega mañana 7:30";
  const modo = urgente ? "Urgente" : "Normal";
  const texto = `Lo que falta: ${textoLista(items)}. ¿Pido? ${modo} ${peso(total)}, ${cuando}`;
  const oferta = { items: { ...items }, urgente, mats, flete, total, texto };
  s.sita.oferta = oferta;
  s.sita.ultima = { ...oferta, items: { ...items } };
  s.sita.editando = false;
}

export function hablarSita(s: Estado) {
  if (!s.firmado || !s.sita || s.entregada) return;
  if (!s.sita.oferta) {
    const u = s.sita.ultima;
    const urgenteOk = s.minuto < 12 * 60;
    if (u && tieneItems(u.items)) {
      if (u.urgente && !urgenteOk) ofrecerManual(s, u.items, false);
      else s.sita.oferta = { ...u, items: { ...u.items } };
    } else {
      const items = loQueFalta(s);
      if (tieneItems(items)) ofrecerManual(s, items, false);
    }
  }
  s.panel = "sita";
}

export function editarSita(s: Estado) {
  if (!s.sita?.oferta) return;
  s.sita.editando = true;
  s.sita.fase = "nota";
  s.panel = "ferreteria";
}

function moverSita(s: Estado, dt: number, vel: number) {
  if (!s.sita || s.sita.fase === "casa" || s.sita.fase === "nota") return;
  const meta = s.sita.fase === "vuelta" ? puertaAlmacen() : s.jugador;
  const dx = meta.x - s.sita.x;
  const dy = meta.y - s.sita.y;
  const d = Math.hypot(dx, dy);
  if (s.sita.fase === "yendo" && d < 1.15) {
    s.sita.x = meta.x;
    s.sita.y = meta.y;
    s.sita.fase = "nota";
    return;
  }
  if (s.sita.fase === "vuelta" && d < 0.35) {
    const p = puertaAlmacen();
    s.sita.x = p.x;
    s.sita.y = p.y;
    s.sita.fase = "casa";
    return;
  }
  if (d < 1e-6) {
    if (s.sita.fase === "yendo") s.sita.fase = "nota";
    else s.sita.fase = "casa";
    return;
  }
  const step = Math.min(d, vel * Math.max(0, dt));
  const nxt = andar(s.sita.x, s.sita.y, s.sita.x + (dx / d) * step, s.sita.y + (dy / d) * step, meta.x, meta.y);
  s.sita.x = nxt.x;
  s.sita.y = nxt.y;
}

export function pedir(s: Estado, items: Cantidades, urgente: boolean): string | null {
  const limpio: Cantidades = {};
  let avisosTope = false;
  for (const [k, n] of Object.entries(items) as [Mat, number][]) {
    if (!n || n <= 0 || !MATERIALES[k]?.compra || k === "kit") continue;
    const paso = MATERIALES[k].paso;
    let q = Math.ceil((n - 1e-9) / paso) * paso;
    if (k !== "cemento") {
      const esp = espacio(s, k) - enCamino(s, k);
      const cabe = Math.max(0, Math.floor((esp + 1e-9) / paso) * paso);
      if (q > cabe + 1e-6) avisosTope = true;
      q = Math.min(q, cabe);
    }
    if (q > 0) limpio[k] = Math.round(q * 1000) / 1000;
  }
  const mats = Object.entries(limpio).reduce((a, [k, n]) => a + (n ?? 0) * MATERIALES[k as Mat].precio, 0);
  if (mats <= 0) return avisosTope ? "El tope del almacén no deja pedir eso." : "No hay nada que pedir.";
  if (urgente && s.minuto >= 12 * 60) return "Lo urgente solo corre antes de las 12.";
  const flete = urgente ? FLETE_URGENTE : FLETE;
  const total = mats + flete;
  if (total > cajaLibre(s) + 0.5) return "Eso se come la nómina de hoy. La caja libre no da.";
  let cementoNuevo = limpio.cemento ?? 0;
  if (cementoNuevo > 0) {
    const bajoTecho = s.inv.cemento.q;
    const ya = (s.entrada.cemento?.q ?? 0) + enCamino(s, "cemento");
    const afuera = Math.max(0, bajoTecho + ya + cementoNuevo - 20);
    if (afuera >= 1) aviso(s, `${num(afuera, 0)} fundas van a quedar afuera del techo.`);
  }
  s.caja -= total;
  s.costos.fletes.mat += flete;
  s.stats.fletes += 1;
  const llega = llegadaPedido(s, urgente);
  s.pedidos.push({
    id: "ped" + ++s.idSeq,
    items: limpio,
    dia: llega.dia,
    minuto: llega.minuto,
    flete,
    urgente,
  });
  diario(s, `Pedido a la ferretería: −${peso(total)} (${urgente ? "urgente" : "flete normal"}).`);
  aviso(s, urgente ? "El camión sale ya. Llega en 3 horas." : "Pedido hecho. Llega mañana a las 7:30.");
  if (avisosTope) aviso(s, "Parte del pedido se recortó por el tope del almacén.");
  cerrarOfertaSita(s);
  return null;
}

export function contratar(s: Estado, id: string): string | null {
  if (s.gente.length + s.reserva.length >= MAX_CUADRILLA) return "Ya son 8. No cabe nadie más.";
  const i = s.candidatos.findIndex((c) => c.id === id);
  if (i < 0) return "Esa persona ya no está en la oficina.";
  const p = s.candidatos.splice(i, 1)[0]!;
  const hoy = s.minuto < 9 * 60 && !s.nominaPagada;
  if (hoy) {
    p.activo = true;
    p.falto = false;
    s.gente.push(p);
    aviso(s, `${p.nombre} entra hoy. Jornal ${peso(jornalDe(p.oficio, p.rinde))}.`);
  } else {
    p.activo = false;
    s.reserva.push(p);
    aviso(s, `${p.nombre} empieza mañana.`);
  }
  diario(s, `Contrataste a ${p.nombre} ${p.apellido}, ${OFICIO_NOMBRE[p.oficio]}.`);
  if (s.gente.length + s.reserva.length >= 3) s.tut.parada = true;
  chequearTutorial(s);
  return null;
}

export function asignar(s: Estado, id: string, puesto: Puesto | null) {
  const g = s.gente.find((x) => x.id === id) ?? s.reserva.find((x) => x.id === id);
  if (!g) return;
  g.puesto = puesto;
  g.esperaZona = 0;
  g.enCruce = false;
  const enObra = [...s.gente, ...s.reserva].filter((x) => x.puesto === "obra").length;
  if (enObra >= 3 || (s.gente.filter((x) => x.puesto === "obra").length >= Math.min(3, s.gente.length) && s.gente.length >= 3))
    s.tut.cuadrilla = true;
  if (s.gente.filter((x) => x.puesto === "obra").length >= 3) s.tut.cuadrilla = true;
  if (puesto === "agua") s.tut.agua = true;
  chequearTutorial(s);
}

export function despedir(s: Estado, id: string) {
  const gi = s.gente.findIndex((g) => g.id === id);
  if (gi >= 0) {
    const g = s.gente[gi]!;
    if (g.activo && !g.falto && !s.nominaPagada) {
      const j = jornalDe(g.oficio, g.rinde);
      const diff = Math.max(0, j - g.moHoy);
      s.costos.muerto.mo += diff;
      anotarMuerto(s, g, diff, j > 0 ? (diff * 480) / j : 0, "resto");
      const herr = j * HERRAMIENTA;
      s.caja -= j + herr;
      s.costos.herramienta.mo += herr;
      aviso(s, `Despediste a ${g.nombre}. Le pagaste el día (${peso(j)}).`);
      diario(s, `Despediste a ${g.nombre} ${g.apellido}: −${peso(j + herr)}.`);
    } else {
      aviso(s, `Despediste a ${g.nombre}. Hoy no cobró.`);
      diario(s, `Despediste a ${g.nombre} ${g.apellido}.`);
    }
    s.gente.splice(gi, 1);
    return;
  }
  const ri = s.reserva.findIndex((g) => g.id === id);
  if (ri >= 0) {
    const g = s.reserva[ri]!;
    s.reserva.splice(ri, 1);
    aviso(s, `${g.nombre} no entra mañana.`);
  }
}

export function marcarLibre(s: Estado, id: string, valor: boolean) {
  const g = s.gente.find((x) => x.id === id);
  if (!g) return;
  g.libre = valor;
}

function pideCompra(need: Cantidades): boolean {
  return COMPRA.some((m) => (need[m] ?? 0) > 0.02);
}

function faltaCompra(s: Estado): boolean {
  const need = sumaNecesidad(s, s.etapa, true, true);
  return COMPRA.some((m) => (need[m] ?? 0) - (s.inv[m]?.q ?? 0) - enCamino(s, m) > 0.02);
}

function montoAdelanto(s: Estado): number {
  const pendiente = Math.max(0, CONTRATO - s.cobrado + s.adelanto);
  const tope = Math.round(pendiente * 0.3);
  const room = tope - s.adelanto;
  const falta = CONTRATO - s.cobrado;
  const monto = Math.round(Math.min(20000, Math.max(0, room), Math.max(0, falta)));
  return monto >= 100 ? monto : 0;
}

export function puedeAdelantar(s: Estado, pedido = 0): boolean {
  if (s.adelantoDia === s.dia) return false;
  if (cajaLibre(s) - Math.max(0, pedido) >= 5000) return false;
  return montoAdelanto(s) >= 100;
}

export function pedidoAlcanza(s: Estado, total: number): boolean {
  if (total <= cajaLibre(s) + 0.5) return true;
  if (!puedeAdelantar(s, total)) return false;
  return total <= cajaLibre(s) + montoAdelanto(s) + 0.5;
}

export function libreTrasPedido(s: Estado, total: number): number {
  let libre = cajaLibre(s);
  if (total > libre + 0.5 && puedeAdelantar(s, total)) {
    const extra = montoAdelanto(s);
    if (total <= libre + extra + 0.5) libre += extra;
  }
  return libre - total;
}

export function adelantar(s: Estado, pedido = 0): string | null {
  if (!puedeAdelantar(s, pedido)) {
    if (cajaLibre(s) - Math.max(0, pedido) >= 5000)
      return "Todavía tienes más de P$5,000 libres. Doña Carmen no suelta más.";
    if (s.adelantoDia === s.dia) return "Doña Carmen ya soltó un adelanto hoy.";
    if (CONTRATO - s.cobrado <= 1) return "Ya no queda nada por cobrar.";
    return "Doña Carmen no suelta más hasta que se cobre un tramo.";
  }
  const monto = montoAdelanto(s);
  s.caja += monto;
  s.cobrado += monto;
  s.adelanto += monto;
  s.adelantoDia = s.dia;
  diario(s, `Adelanto de Doña Carmen: +${peso(monto)}.`);
  aviso(s, `Doña Carmen soltó ${peso(monto)}. Se descuenta del próximo tramo.`);
  return null;
}

export function terminarJornada(s: Estado) {
  if (!s.firmado || s.entregada) return;
  if (s.minuto < 15 * 60 && !s.nominaPagada) {
    const falta = 15 * 60 - s.minuto;
    for (const g of s.gente) {
      if (!g.activo || g.falto) continue;
      const rate = jornalDe(g.oficio, g.rinde) / 480;
      s.costos.muerto.mo += rate * falta;
      anotarMuerto(s, g, rate * falta, falta, "resto");
      g.moHoy += rate * falta;
    }
    pagarNomina(s);
    diario(s, "Despachaste la cuadrilla antes de las 3, día completo.");
  }
  if (s.nominaPagada) {
    s.minuto = 18 * 60;
    abrirFinde(s);
  }
}

function anotarFalta(s: Estado, quien: string, porque: string) {
  s.stats.faltas += 1;
  (s.stats.faltasLog ??= []).push({ dia: s.dia, min: s.minuto, quien, porque });
}

export function siguienteDia(s: Estado) {
  lavarMezclas(s, "La noche se llevó la mezcla.");
  for (const g of s.gente) {
    if (g.cansancio >= 85) {
      g.noViene = true;
      g.cansancio = 20;
    } else g.cansancio = Math.max(0, g.cansancio - 40);
  }
  let dia = s.dia + 1;
  if (esDomingo(dia)) {
    diario(s, "Domingo: descanso. El cansancio se fue y el curado contó.");
    if (s.curando && s.curadoDias.length < 3 && !s.curadoDias.includes(dia)) s.curadoDias.push(dia);
    for (const g of s.gente) {
      g.cansancio = 0;
      g.noViene = false;
    }
    dia += 1;
  }
  s.dia = dia;
  s.minuto = 7 * 60;
  s.frac = 0;
  s.sinGolpe = 0;
  s.stats.golpesAutoHoy = 0;
  s.nominaPagada = false;
  s.direccionCobrada = false;
  s.herrHoy = 0;
  s.mezclaTarde = 0;
  s.mezclaTardeNota = false;
  s.blocksHoy = 0;
  s.regadoHoy = false;
  s.regarProg = 0;
  s.lluviaOn = false;
  s.aviso14 = false;
  s.avisoNubes = false;
  for (const p of s.reserva) s.gente.push(p);
  s.reserva = [];
  const sinCobro = s.caja < 0;
  if (sinCobro) {
    aviso(s, "Sin cobrar no se trabaja. La caja amaneció en rojo.");
    diario(s, "Nadie vino: la caja estaba negativa.");
  }
  for (const g of s.gente) {
    const libre = g.libre;
    g.libre = false;
    g.fuera = false;
    g.moHoy = 0;
    g.aviso70 = false;
    g.activo = true;
    g.falto = false;
    g.trabajando = false;
    g.esperaZona = 0;
    g.enCruce = false;
    if (sinCobro) {
      g.activo = false;
      g.falto = true;
      anotarFalta(s, `${g.nombre} ${g.apellido}`, "La caja estaba en rojo");
      continue;
    }
    if (libre) {
      g.activo = false;
      g.cansancio = 0;
      continue;
    }
    if (g.noViene) {
      g.activo = false;
      g.falto = true;
      g.noViene = false;
      anotarFalta(s, `${g.nombre} ${g.apellido}`, "Ayer quedó frito");
      aviso(s, `${g.nombre} no vino. Ayer quedó frito y hoy no cobra.`);
      continue;
    }
    if (g.mania === "madrugador" && esSabado(s.dia)) {
      g.activo = false;
      g.falto = true;
      anotarFalta(s, `${g.nombre} ${g.apellido}`, "Los sábados no aparece");
      aviso(s, `${g.nombre} es Madrugador: los sábados no aparece.`);
      continue;
    }
  }
  s.candidatos = generarCandidatos(s);
  s.faltanManana = [];
  diario(s, `Amaneció ${diaSemana(s.dia)}. Día ${s.dia}.`);
  if (s.caja < -1) s.panel = "perdida";
  else s.panel = null;
}

function generarCandidatos(s: Estado): Persona[] {
  const usados = new Set([...s.gente, ...s.reserva].map((g) => g.nombre));
  return CUADRILLA.filter((b) => !usados.has(b.nombre)).map((b, i) => personaDe(s, b, i));
}

export interface SitioCerca {
  id: string;
  nombre: string;
  x: number;
  y: number;
  d: number;
}

function distAlSolar(x: number, y: number): number {
  const dx = Math.max(SOLAR.x0 - x, 0, x - SOLAR.x1);
  const dy = Math.max(SOLAR.y0 - y, 0, y - SOLAR.y1);
  return Math.hypot(dx, dy);
}

export function cercano(s: Estado): SitioCerca | null {
  const dObra = distAlSolar(s.jugador.x, s.jugador.y);
  const pts: SitioCerca[] = [
    { ...SITIOS.toma, d: dist(s.jugador, SITIOS.toma) },
    { ...SITIOS.tanque, d: dist(s.jugador, SITIOS.tanque) },
    { ...SITIOS.monton, d: dist(s.jugador, SITIOS.monton) },
    { ...SITIOS.batea, d: dist(s.jugador, SITIOS.batea) },
    { ...SITIOS.almacen, d: dist(s.jugador, SITIOS.almacen) },
    { ...SITIOS.oficina, d: dist(s.jugador, SITIOS.oficina) },
    { ...SITIOS.entrada, d: dist(s.jugador, SITIOS.entrada) },
    { ...SITIOS.obra, d: dObra <= 1.5 ? dObra : 99 },
    { ...SITIOS.ferreteria, d: dist(s.jugador, SITIOS.ferreteria) },
    { ...SITIOS.sombra, d: dist(s.jugador, SITIOS.sombra) },
  ];
  pts.sort((a, b) => a.d - b.d);
  const top = pts[0];
  if (!top || top.d > RADIO) return null;
  return top;
}

function txtCant(n: number, unidad: string): string {
  if (unidad === "m³" && Math.abs(n) < 1) return `${Math.max(1, Math.round(n * 1000))} L`;
  if (Math.abs(n) >= 10) return String(Math.round(n));
  const r = Math.round(n * 100) / 100;
  return Number.isInteger(r) ? String(r) : r.toFixed(2);
}

function flot(texto: string, x: number, y: number, oro: boolean): Flotante {
  return { texto, x, y, oro };
}

function hayPuestoUtil(s: Estado): boolean {
  return s.gente.some((g) => g.activo && !g.fuera && !g.falto && !!g.puesto && g.puesto !== "sombra");
}

function previewAplica(s: Estado, w: W): boolean {
  if (w.hecho >= w.q - 1e-8) return false;
  if (w.id === "block" && s.plomo) return false;
  if (w.k === "block" && s.blocksHoy >= TOPE_BLOCK_DIA - 1e-6) return false;
  if (w.usaIni && !w.ini && !tieneMapa(s, w.usaIni)) return false;
  if (w.usa) {
    for (const [k, total] of Object.entries(w.usa) as [Mat, number][]) {
      const per = total / w.q;
      if (per > 0 && s.inv[k].q <= 1e-9) return false;
    }
  }
  if (w.mezcla && w.mezclaQ && w.mezclaQ / w.q > 0 && stockMezcla(s, w.mezcla) <= 1e-6) return false;
  return true;
}

function obraListaParaGolpe(s: Estado): boolean {
  if (s.entregada || s.etapa >= 9) return false;
  if (s.plomo) return true;
  if (s.curando && !s.regadoHoy && s.curadoDias.length < 3 && !fraguaActiva(s)) return s.inv.agua.q >= 0.1 - 1e-6;
  if (fraguaActiva(s)) return false;
  const w = listos(s).find((t) => t.k !== "regar");
  return !!w && previewAplica(s, w);
}

function anotarGolpeMaestro(s: Estado) {
  s.stats.golpesAuto = (s.stats.golpesAuto ?? 0) + 1;
  s.stats.golpesAutoHoy = (s.stats.golpesAutoHoy ?? 0) + 1;
  const dias = (s.stats.golpesAutoPorDia ??= {});
  const k = String(s.dia);
  dias[k] = (dias[k] ?? 0) + 1;
  s.gritos ??= [];
  s.gritos.push({ texto: "El maestro le dio", x: SITIOS.obra.x, y: SITIOS.obra.y });
  if (s.gritos.length > 6) s.gritos.splice(0, s.gritos.length - 6);
}

function golpeMaestro(s: Estado) {
  s.maestroLider = true;
  const f = golpeObra(s, 1, false);
  s.maestroLider = false;
  if (!f) return;
  const vacio = /^(Nada que hacer|Falta material|Sin mezcla|Falta líder|Fragua|Falta agua|Curado)$/;
  if (vacio.test(f.texto)) return;
  anotarGolpeMaestro(s);
}

function pulsoGolpeMaestro(s: Estado) {
  if (!s.firmado || s.entregada || s.minuto >= 15 * 60 || s.panel || s.pausa) return;
  s.sinGolpe = (s.sinGolpe ?? 0) + 1;
  if (s.sinGolpe < 15) return;
  if (lluviaAhora(s)) return;
  if (!hayPuestoUtil(s)) return;
  s.sinGolpe = 0;
  if (!obraListaParaGolpe(s)) return;
  golpeMaestro(s);
}

export function golpe(s: Estado, alCompas: boolean): Flotante | null {
  if (!s.firmado || s.entregada || s.panel || s.pausa) return null;
  const sitio = cercano(s);
  const ps = puntoSita(s);
  const dSita = dist(s.jugador, ps);
  if (sitio?.id === "almacen" || (dSita <= 1.15 && sitio?.id !== "oficina" && sitio?.id !== "obra" && sitio?.id !== "batea" && sitio?.id !== "ferreteria")) {
    hablarSita(s);
    return null;
  }
  if (!sitio) return flot("Nada cerca", s.jugador.x, s.jugador.y, false);
  s.stats.golpes += 1;
  if (alCompas) s.stats.compas += 1;
  const b = alCompas ? 1.25 : 1;
  const { x, y } = s.jugador;
  if (sitio.id === "oficina") {
    s.oficinaTab = "gente";
    abrirPanel(s, "oficina");
    return null;
  }
  if (sitio.id === "ferreteria") {
    abrirPanel(s, "ferreteria");
    return null;
  }
  if (sitio.id === "sombra") return flot("Sombra", x, y, false);
  if (sitio.id === "tanque" || sitio.id === "toma" || sitio.id === "monton" || sitio.id === "entrada")
    return flot(sitio.nombre, x, y, false);
  if (sitio.id === "batea") {
    s.sinGolpe = 0;
    return golpeBatea(s, b, alCompas);
  }
  if (sitio.id === "obra") {
    s.sinGolpe = 0;
    return golpeObra(s, b, alCompas);
  }
  return null;
}

function golpeBatea(s: Estado, b: number, oro: boolean): Flotante {
  const { x, y } = s.jugador;
  let curso = s.mezclas.find((m) => !m.lista);
  if (!curso) {
    const tipo = tipoQueFalta(s) ?? (listos(s).some((w) => w.mezcla === "M") ? "M" : "H");
    const map = receta(tipo);
    if (!tieneMapa(s, map)) {
      if (aguaEsElFreno(s, map)) return flot("Sin agua", x, y, false);
      return flot("Faltan ingredientes", x, y, false);
    }
    curso = iniciarMezcla(s, tipo) ?? undefined;
    if (!curso) return flot("No hay mezcla", x, y, false);
  }
  const plus = curso.tipo === "H" ? 0.1 * (b / 1.25) * b : 0.25 * (b / 1.25) * b;
  // base +10% H or +25% M, times compas
  const add = (curso.tipo === "H" ? 0.1 : 0.25) * (oro ? 1.25 : 1);
  void plus;
  curso.prog = Math.min(1, curso.prog + add);
  if (curso.prog >= 1 - 1e-6) {
    curso.prog = 1;
    curso.lista = true;
    curso.vida = curso.tipo === "H" ? RECETA_H.vida : RECETA_M.vida;
    curso.restante = 1;
    return flot(curso.tipo === "H" ? "Tanda lista" : "Mortero listo", x, y, oro);
  }
  return flot(`${Math.round(curso.prog * 100)}%`, x, y, oro);
}

function golpeObra(s: Estado, b: number, oro: boolean): Flotante | null {
  const { x, y } = s.jugador;
  if (s.plomo) {
    s.plumbed.push(s.plomo.umbral);
    s.plomo = null;
    return flot("¡Plomo!", SITIOS.obra.x, SITIOS.obra.y, true);
  }
  if (s.curando && !s.regadoHoy && s.curadoDias.length < 3) {
    if (s.inv.agua.q < 0.1 - 1e-6) return flot("Falta agua", x, y, false);
    const c = usar(s, "agua", 0.1);
    s.costos.hormigon.mat += c;
    s.regadoHoy = true;
    s.curadoDias.push(s.dia);
    s.regarProg = 0;
    return flot(`Regado ${s.curadoDias.length}/3`, x, y, true);
  }
  if (fraguaActiva(s)) return flot("Fragua", x, y, false);
  const lista = listos(s).filter((w) => w.k !== "regar");
  const w = lista[0];
  if (!w) {
    if (s.curando && s.curadoDias.length < 3 && s.etapa >= 8) return flot("Curado", x, y, false);
    return flot("Nada que hacer", x, y, false);
  }
  const dq = TAREAS[w.k].golpe * b;
  const antes = w.hecho;
  const got = aplicar(s, w, dq);
  if (got <= 1e-8) {
    if (TAREAS[w.k].lider && !hayLider(s, w.k)) return flot("Falta líder", x, y, false);
    if (w.mezcla && stockMezcla(s, w.mezcla) <= 1e-6) return flot("Sin mezcla", x, y, false);
    return flot("Falta material", x, y, false);
  }
  const unidad = unidadDe(w.k);
  const texto = `+${txtCant(w.hecho - antes, unidad)} ${corto(w)}`;
  return flot(texto, x, y, oro);
}

function unidadDe(k: Tarea): string {
  if (k === "limpiar" || k === "encofrar" || k === "techo" || k === "llanear") return "m²";
  if (k === "excavar" || k === "relleno") return "m³";
  if (k === "acero") return "kg";
  if (k === "block") return "ud";
  return "u";
}

export function lineaAhora(s: Estado): string {
  const def = ETAPAS[s.etapa];
  if (!def || s.entregada || s.etapa >= 9) return "Ahora: obra entregada";
  const abierto = def.trabajos.find((t) => runDe(s, s.etapa, t.id).hecho < t.q - 1e-4);
  const w = abierto ?? def.trabajos[def.trabajos.length - 1];
  if (!w) return `Ahora: ${def.nombre}`;
  const hecho = runDe(s, s.etapa, w.id).hecho;
  return `Ahora: ${w.nombre} · ${num(hecho, 1)} de ${num(w.q, 1)} ${unidadDe(w.k)}`;
}

function corto(w: W): string {
  if (w.k === "block") return "block";
  if (w.k === "acero") return "acero";
  if (w.k === "vaciar") return "hormigón";
  if (w.k === "limpiar") return "m²";
  if (w.k === "excavar") return "zanja";
  if (w.k === "llanear") return "piso";
  if (w.k === "techo") return "techo";
  if (w.k === "encofrar") return "encofrado";
  if (w.k === "relleno") return "relleno";
  if (w.k === "achicar") return "agua";
  if (w.k === "calzos") return "calzo";
  if (w.k === "limpieza") return "limpieza";
  if (w.k === "replantear") return "esquina";
  return w.nombre;
}

export function accion(s: Estado): { tecla: string; verbo: string; detalle: string } {
  const sitio = cercano(s);
  if (!s.firmado) return { tecla: "Espacio", verbo: "Firma primero", detalle: "Doña Carmen te espera" };
  if (!sitio) return { tecla: "Espacio", verbo: "Camina", detalle: "Nada a 2 metros" };
  if (sitio.id === "batea") {
    const c = s.mezclas.find((m) => !m.lista);
    return {
      tecla: "Espacio",
      verbo: "Mezclar",
      detalle: c ? `${Math.round(c.prog * 100)}% de ${c.tipo === "H" ? "hormigón" : "mortero"}` : "una tanda en el trompo",
    };
  }
  if (sitio.id === "almacen") return { tecla: "Espacio", verbo: "Almacén", detalle: "el libro de Sita" };
  if (sitio.id === "oficina") return { tecla: "Espacio", verbo: "Oficina", detalle: "contrata, planos y teléfono" };
  if (sitio.id === "ferreteria") return { tecla: "Espacio", verbo: "Ferretería El Cruce", detalle: "precio y entrega" };
  if (sitio.id === "entrada") return { tecla: "Espacio", verbo: "Entrada", detalle: "aquí deja el camión" };
  if (sitio.id === "tanque") return { tecla: "Espacio", verbo: "Tanque", detalle: s.inv.agua.q > 0.15 ? "tiene agua" : "está vacío" };
  if (sitio.id === "toma") return { tecla: "Espacio", verbo: "Toma", detalle: "el agua del solar no se cobra" };
  if (sitio.id === "monton") return { tecla: "Espacio", verbo: "Montón", detalle: "arena y grava" };
  if (sitio.id === "sombra") return { tecla: "Espacio", verbo: "Sombra", detalle: "debajo del mango" };
  if (s.plomo) return { tecla: "Espacio", verbo: "Plomear", detalle: "" };
  if (s.curando && !s.regadoHoy && s.curadoDias.length < 3)
    return { tecla: "Espacio", verbo: "Regar la viga", detalle: `${s.curadoDias.length}/3 días · 0.1 m³` };
  const w = listos(s).find((t) => t.k !== "regar");
  if (!w) return { tecla: "Espacio", verbo: cuello(s), detalle: "el cartel de arriba dice por qué" };
  return {
    tecla: "Espacio",
    verbo: w.nombre,
    detalle: `${num(w.hecho, 1)} / ${num(w.q, 1)}`,
  };
}

function matsEnFalta(s: Estado, w: W): Mat[] {
  const falta: Mat[] = [];
  if (w.usaIni && !w.ini) {
    for (const [k, n] of Object.entries(w.usaIni) as [Mat, number][]) if (s.inv[k].q + enCamino(s, k) < n - 1e-6) falta.push(k);
  }
  if (w.usa) {
    for (const [k, total] of Object.entries(w.usa) as [Mat, number][]) {
      const per = total / w.q;
      const paso = Math.max(per * 0.02, 1e-4);
      if (s.inv[k].q < paso && (w.q - w.hecho) * per > s.inv[k].q + 1e-6) falta.push(k);
    }
  }
  if (w.mezcla) {
    const map = receta(w.mezcla);
    const hay = stockMezcla(s, w.mezcla) + tandasEnCurso(s, w.mezcla);
    if (hay + 1e-6 < mezclaQueFalta(w)) {
      for (const [k, n] of Object.entries(map) as [Mat, number][]) {
        if (s.inv[k].q < n - 1e-6) falta.push(k);
      }
    }
  }
  return falta;
}

function materialFalta(s: Estado, w: W): string | null {
  const pedido = loQueFalta(s);
  for (const m of matsEnFalta(s, w)) {
    const nom = MATERIALES[m].nombre;
    if (enCamino(s, m) > 0) return `Falta ${nom}. Viene en el camión.`;
    if ((s.entrada[m]?.q ?? 0) > 0.02) return `${nom} está en la entrada. Hay que acarrearlo.`;
    if (m === "tierra") return "Falta tierra. Sale de la zanja.";
    if (m === "agua") continue;
    if ((pedido[m] ?? 0) <= 0) continue;
    return `Falta ${nom}. Pídelo en la Ferretería.`;
  }
  return null;
}

function trabajoSiguiente(s: Estado): W | null {
  const pendientes = works(s).filter((w) => w.hecho < w.q - 1e-4 && !w.soloMaestro);
  return pendientes.find((w) => prereqOk(s, w)) ?? pendientes[0] ?? null;
}

const CORTO_MAT: Partial<Record<Mat, string>> = {
  v38: "Varilla 3/8",
  v14: "Varilla 1/4",
  cemento: "Cemento",
  block: "Block",
  arena: "Arena",
  grava: "Grava",
  alambre: "Alambre",
  plywood: "Plywood",
  pino: "Pino",
  abeto: "Abeto",
  zinc: "Zinc",
  clavo: "Clavo",
  clavoTecho: "Clavo de techo",
};

function nombreCortoMat(m: Mat): string {
  return CORTO_MAT[m] ?? MATERIALES[m].nombre;
}

function matQueFrena(s: Estado): Mat | null {
  const w = trabajoSiguiente(s);
  if (!w) return null;
  const pedido = loQueFalta(s);
  for (const m of matsEnFalta(s, w)) {
    if (m === "tierra" || m === "agua") continue;
    if (enCamino(s, m) > 0) continue;
    if ((s.entrada[m]?.q ?? 0) > 0.02) continue;
    if ((pedido[m] ?? 0) <= 0) continue;
    return m;
  }
  return null;
}

export function cuello(s: Estado): string {
  if (!s.entregada && !lluviaAhora(s) && s.minuto >= 15 * 60) {
    const w = trabajoSiguiente(s);
    const mf = w ? materialFalta(s, w) : null;
    const m = mf && mf.includes("Ferretería") ? matQueFrena(s) : null;
    if (w && m) return `Se fueron a las 3. Mañana sigue: ${w.nombre} · falta ${nombreCortoMat(m)}`;
    const sigue = lineaAhora(s).replace(/^Ahora:\s*/, "");
    return `Se fueron a las 3. Mañana sigue: ${sigue}`;
  }
  return cuelloLabor(s);
}

/** El cartel de faena, sin el cierre de las 15:00. Lo usan los ensayos para no cambiar el día. */
export function cuelloLabor(s: Estado): string {
  if (s.entregada) return "Obra entregada. Doña Carmen ya tiene su caseta.";
  if (lluviaAhora(s)) return "Aguacero. La cuadrilla está en el almacén.";
  if (s.plomo) return "Toca plomear: ve al muro y pulsa Espacio.";
  if (s.curando && !s.regadoHoy && s.curadoDias.length < 3)
    return `Toca regar la viga · ${s.curadoDias.length}/3 días.`;
  const def = ETAPAS[s.etapa];
  if (!def) return "Obra entregada.";
  const diag = runDe(s, 0, "replantear").hecho;
  if (def.id === "replanteo" && diag < 2 - 1e-4) {
    const base = `Replanteo ${Math.floor(diag + 1e-6)}/2`;
    if (!s.gente.length && !s.reserva.length) return `${base} · Contrata en la oficina.`;
    const alguien = s.gente.some((g) => {
      if (!g.activo || g.fuera || g.falto) return false;
      if (laborDe(s, g) !== "obra") return false;
      return elegir(s, g)?.k === "replantear";
    });
    if (!alguien) return `${base} · Manda a alguien a replantear.`;
    return `${base} · ${num(diag, 1)} de 2`;
  }
  if (def.id === "replanteo" && diag >= 2 - 1e-4 && s.minuto < s.escuadraHasta)
    return "Replanteo listo: escuadra comprobada 3, 4, 5";
  if (vienenNubes(s)) return "Hay cemento en la entrada y vienen nubes.";
  if (bateaSinAgua(s) && !s.gente.some((g) => laborDe(s, g) === "agua"))
    return "Sin agua en el tanque: manda a alguien por agua.";
  if (fraguaActiva(s) && s.fragua) return s.fragua.que;
  const pendientes = works(s).filter((w) => w.hecho < w.q - 1e-4 && !w.soloMaestro);
  const siguiente = pendientes.find((w) => prereqOk(s, w)) ?? pendientes[0];
  if (siguiente?.reqCurado && s.curadoDias.length < 3)
    return `Curado de la viga · ${s.curadoDias.length}/3 días. El techo espera.`;
  if (siguiente && TAREAS[siguiente.k].lider && !hayLider(s, siguiente.k)) {
    const hayGente = s.gente.some((g) => g.activo && !g.fuera && distAlSolar(g.x, g.y) <= 1.5);
    if (hayGente) return "Falta un líder en la obra. Acércate o pon al oficio que manda.";
  }
  const hayTrabajo = listos(s).some((w) => w.k !== "regar");
  if (!s.gente.length && !s.reserva.length && hayTrabajo) return "Contrata en la oficina.";
  const topeHiladas =
    s.blocksHoy >= TOPE_BLOCK_DIA - 1e-4 && def.id === "muros" && runDe(s, s.etapa, "block").hecho < BLOCKS_MURO - 1e-3;
  if (!topeHiladas) {
    const ultima = faltaTrasTanda(s);
    if (ultima) return `Última tanda en el trompo. Después falta ${ultima}: pídela.`;
  }
  if (siguiente) {
    const mf = materialFalta(s, siguiente);
    if (mf && (siguiente.usa || siguiente.usaIni || siguiente.mezcla)) return mf;
  }
  if (siguiente?.mezcla) {
    const stock = stockMezcla(s, siguiente.mezcla);
    const curso = tandasEnCurso(s, siguiente.mezcla);
    if (stock + curso + 1e-6 < mezclaQueFalta(siguiente) && stock < 0.05) {
      const map = receta(siguiente.mezcla);
      const cubreBatea = s.gente.some((g) => {
        if (!g.activo || g.fuera || g.falto) return false;
        const lab = laborDe(s, g);
        if (lab === "batea") return true;
        return g.puesto === "batea" && lab === "agua";
      });
      const sinIng = (Object.entries(map) as [Mat, number][]).some(([k, n]) => s.inv[k].q < n - 1e-6);
      const vaPorAgua = s.gente.some((g) => laborDe(s, g) === "agua");
      if (!cubreBatea) {
        if (curso <= 0 && aguaEsElFreno(s, map) && !vaPorAgua) return "Sin agua en el tanque: manda a alguien por agua.";
        if (curso <= 0 && sinIng) return "El trompo está sin ingredientes.";
        return "Nadie en el Trompo: pon a alguien a batir.";
      }
      if (curso <= 0) {
        if (aguaEsElFreno(s, map) && !vaPorAgua) return "Sin agua en el tanque: manda a alguien por agua.";
        if (sinIng && !aguaEsElFreno(s, map)) return "El trompo está sin ingredientes.";
        const buscaAgua = s.gente.some((g) => g.puesto === "batea" && laborDe(s, g) === "agua");
        if (!buscaAgua) return "El trompo está sin mezcla lista.";
      }
    }
  }
  if (topeHiladas) return "Ya van 6 hiladas hoy. Mañana se sigue el muro.";
  if (siguiente) return `${def.nombre}: ${siguiente.nombre} · ${num(siguiente.hecho, 1)} / ${num(siguiente.q, 1)}`;
  return `${def.nombre}: ${num(progresoEtapa(s) * 100, 0)}%`;
}

function faltaTrasTanda(s: Estado): string | null {
  const queda = s.mezclas.some((m) => (m.lista && m.restante > 0.02) || (!m.lista && m.prog > 0.02));
  if (!queda) return null;
  const tipo = tipoQueFalta(s);
  if (!tipo) return null;
  const map = receta(tipo);
  if (tieneMapa(s, map)) return null;
  const orden: Mat[] = ["arena", "grava", "cemento", "agua"];
  for (const k of orden) {
    const n = map[k];
    if (!n) continue;
    if ((s.inv[k]?.q ?? 0) + 1e-9 < n) return MATERIALES[k].nombre;
  }
  return null;
}

function vienenNubes(s: Estado): boolean {
  const hoy = s.lluvias.find((r) => r.dia === s.dia);
  return !!hoy && s.minuto < hoy.ini && (s.entrada.cemento?.q ?? 0) >= 1;
}

function bateaSinAgua(s: Estado): boolean {
  const tipos: ("H" | "M")[] = [];
  for (const w of listos(s)) if (w.mezcla && !tipos.includes(w.mezcla)) tipos.push(w.mezcla);
  for (const t of tipos) {
    if (stockMezcla(s, t) > 0.05 || tandasEnCurso(s, t) > 0) continue;
    if (aguaEsElFreno(s, receta(t))) return true;
  }
  return false;
}

function progresoEtapa(s: Estado): number {
  const def = ETAPAS[s.etapa];
  if (!def) return 1;
  let a = 0;
  let b = 0;
  for (const t of def.trabajos) {
    a += Math.min(1, runDe(s, s.etapa, t.id).hecho / t.q);
    b += 1;
  }
  return b ? a / b : 0;
}

export function progresoObra(s: Estado): number {
  let a = 0;
  for (let i = 0; i < 9; i++) {
    if (i < s.etapa) a += 1;
    else if (i === s.etapa) a += progresoEtapa(s);
  }
  return a / 9;
}

export interface FilaAlmacen {
  clave: Mat;
  nombre: string;
  unidad: string;
  en: number;
  reservado: number;
  libre: number;
  valor: number;
}

export function almacen(s: Estado): { filas: FilaAlmacen[]; valorLibre: number; apostable: number } {
  const need = sumaNecesidad(s, s.etapa, true);
  const nxt = sumaNecesidad(s, s.etapa + 1, false);
  for (const [k, n] of Object.entries(nxt) as [Mat, number][]) need[k] = (need[k] ?? 0) + n;
  const filas: FilaAlmacen[] = [];
  for (const m of Object.keys(MATERIALES) as Mat[]) {
    const en = s.inv[m].q;
    const pide = need[m] ?? 0;
    if (en <= 1e-6 && pide <= 1e-6) continue;
    const reservado = Math.min(en, Math.max(0, pide));
    const libre = Math.max(0, en - Math.max(0, pide));
    const avg = en > 1e-9 ? s.inv[m].valor / en : 0;
    filas.push({
      clave: m,
      nombre: MATERIALES[m].nombre,
      unidad: MATERIALES[m].unidad,
      en,
      reservado,
      libre,
      valor: libre * avg,
    });
  }
  const valorLibre = filas.reduce((a, f) => a + f.valor, 0);
  return { filas, valorLibre, apostable: Math.min(valorLibre * 0.25, 20000) };
}

export interface FilaCosto {
  partida: Partida;
  nombre: string;
  pre: number;
  mo: number;
  mat: number;
  real: number;
  desv: number;
}

function quedaPresupuesto(s: Estado, p: Partida, real: number): number {
  const pre = PRESUPUESTO[p];
  if (pre <= 0 || s.entregada) return 0;
  if (p === "direccion" || p === "herramienta" || p === "fletes") return Math.max(0, pre - real);
  const tope: Partial<Record<Partida, number>> = {
    replanteo: 0,
    excavacion: 1,
    acero: 6,
    block: 4,
    encofrado: 6,
    hormigon: 7,
    piso: 7,
    techo: 8,
  };
  const hasta = tope[p];
  if (hasta == null || s.etapa > hasta) return 0;
  return Math.max(0, pre - real);
}

export function libreta(s: Estado) {
  const filas: FilaCosto[] = PARTIDAS.map((p) => {
    const mo = s.costos[p].mo;
    const mat = s.costos[p].mat;
    const real = mo + mat;
    const pre = PRESUPUESTO[p];
    return { partida: p, nombre: PARTIDA_NOMBRE[p], pre, mo, mat, real, desv: real - pre };
  });
  const costo = filas.reduce((a, f) => a + f.real, 0);
  const porHacer = filas.reduce((a, f) => a + quedaPresupuesto(s, f.partida, f.real), 0);
  return {
    filas,
    costo,
    presupuesto: PRESUPUESTO_TOTAL,
    porHacer,
    ganancia: CONTRATO - (costo + porHacer),
    cobrado: s.cobrado,
    caja: s.caja,
    diario: s.diario,
    almacen: almacen(s),
  };
}

export function informe(s: Estado) {
  const lib = libreta(s);
  const rio = s.stats?.rio ?? {};
  const ahorro =
    (rio.arena ?? 0) * MATERIALES.arena.precio +
    (rio.grava ?? 0) * MATERIALES.grava.precio +
    (rio.agua ?? 0) * MATERIALES.agua.precio;
  return {
    ...lib,
    dias: s.dia,
    aprobadasPrimera: s.stats.aprobadasPrimera,
    ahorro,
    tandasPerdidas: s.stats.tandasPerdidas,
    costoPerdidas: s.stats.costoPerdidas,
    faltas: s.stats.faltas,
    faltasLista: s.stats.faltasLog ?? [],
    fletes: s.stats.fletes,
    compas: s.stats.compas,
    golpes: s.stats.golpes,
    sellos: s.stats.sellos,
    apostable: lib.almacen.apostable,
    mojado: s.mojado,
    costoMojado: s.stats.costoMojado ?? 0,
  };
}

export function tramos(s: Estado): { nombre: string; monto: number; cobrado: boolean; nota: string }[] {
  const defs: { nombre: string; monto: number; etapa: number | null }[] = [
    { nombre: "Anticipo 30%", monto: ANTICIPO, etapa: null },
    { nombre: "Zapata 15%", monto: Math.round(CONTRATO * 0.15), etapa: 3 },
    { nombre: "Columnas 20%", monto: Math.round(CONTRATO * 0.2), etapa: 5 },
    { nombre: "Viga 15%", monto: Math.round(CONTRATO * 0.15), etapa: 6 },
    { nombre: "Piso 5%", monto: Math.round(CONTRATO * 0.05), etapa: 7 },
    { nombre: "Techo 15%", monto: Math.round(CONTRATO * 0.15), etapa: 8 },
  ];
  return defs.map((d) => ({
    nombre: d.nombre,
    monto: d.monto,
    cobrado: d.etapa == null ? s.firmado : (s.etapas[d.etapa]?.sello === "aprobado"),
    nota: d.etapa == null ? "Al firmar" : `Etapa ${d.etapa + 1}`,
  }));
}

export function reloj(s: Estado): {
  dia: string;
  hora: string;
  clima: string;
  progreso: number;
  marca: number;
} {
  const man = esDomingo(s.dia + 1) ? s.dia + 2 : s.dia + 1;
  const hoy = s.lluvias.find((r) => r.dia === s.dia);
  const ll = lluviaAhora(s);
  let clima = "Sol";
  if (ll) clima = "Aguacero";
  else if (hoy && s.minuto < hoy.ini) clima = `Se nubla · ${hoy.prob}%`;
  else if (hoy && s.minuto >= hoy.fin) clima = "Escampó";
  const pMan = s.lluvias.find((r) => r.dia === man);
  if (!ll && pMan) clima += ` · mañana ${pMan.prob}%`;
  return {
    dia: `${diaSemana(s.dia)} · día ${s.dia}`,
    hora: horaDe(s.minuto),
    clima,
    progreso: clamp((s.minuto - 7 * 60) / (11 * 60), 0, 1),
    marca: (8 * 60) / (11 * 60),
  };
}

export function pronosticoDia(s: Estado, delta: number): string {
  let d = s.dia + delta;
  if (delta === 1 && esDomingo(d)) d += 1;
  const r = s.lluvias.find((x) => x.dia === d);
  const nom = delta === 0 ? "Hoy" : esDomingo(s.dia + 1) && delta === 1 ? "El lunes" : "Mañana";
  if (!r) return `${nom}: sol`;
  return `${nom}: aguacero ${r.prob}% desde las ${horaDe(r.ini)}`;
}

export function etapaActual(s: Estado): EtapaDef | null {
  return ETAPAS[s.etapa] ?? null;
}

export function minutosMezcla(s: Estado): { tipo: "H" | "M"; min: number; lista: boolean } | null {
  const m = s.mezclas.find((x) => !x.lista) ?? s.mezclas.find((x) => x.lista);
  if (!m) return null;
  if (!m.lista) return { tipo: m.tipo, min: Math.max(0, Math.round((1 - m.prog) * 40)), lista: false };
  return { tipo: m.tipo, min: Math.max(0, Math.round(m.vida)), lista: true };
}

void JORNAL_BASE;

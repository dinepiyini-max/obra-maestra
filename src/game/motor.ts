import {
  BOTE_TIERRA,
  BLOCKS_MURO,
  TROMPO_CUERPO,
  COMPRA,
  CONTRATO,
  CUADRILLA,
  CURADO_DIAS,
  DIRECCION_DIA,
  BONO_DIA,
  PLAZO_ENTREGA,
  EFI,
  ETAPAS,
  FLETE,
  FLETE_URGENTE,
  FRASES_CANSANCIO,
  HERRAMIENTA,
  ESCOMBRO,
  INICIO,
  MAPA,
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
  HILADA_TOPE,
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
  type TrabajoDef, pesoCaja} from "./datos.ts";

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
  | "ferreteria"
  | "despacho"
  | "nomina";

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
  /** Minutos de hoy sin tarea. Vuelve a 0 al amanecer. No entra en la caja. */
  sinTareaHoy: number;
  aviso70: boolean;
  anim: string;
  trabajando: boolean;
  dias: number;
  /** 100 es entero. Baja si la nómina queda corta. No entra en la caja. */
  animo: number;
  /** Contador viejo. La caminata lo lee; no elige la labor. */
  esperaZona: number;
  enCruce: boolean;
  /** 0 va al montón, 1 va al botadero. Cambia al llegar, no con el reloj. */
  faseViaje?: number;
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
  /** Si no hay dato, la lluvia cae. */
  cae?: boolean;
}

export interface Cierre {
  cajaAntes: number;
  bruto: number;
  adelanto: number;
  fiado: number;
  bono: number;
  jornales: number;
  herramienta: number;
  direccion: number;
  deudaPrevia: number;
  pagadoNomina: number;
  quedaDebiendo: number;
  cajaDespues: number;
  /** v23: día de la entrega (para explicar el bono). */
  dia?: number;
}

export interface LineaCierre {
  texto: string;
  /** Con signo: + entra a la caja, − sale. Ya redondeado a peso entero. */
  monto: number;
  total?: boolean;
}

/** v23: la cuenta completa de la Entrega, línea por línea, como la promete la Libreta. La suma de los montos da la caja final. */
export function lineasCierre(c: Cierre): LineaCierre[] {
  const r = (n: number) => Math.round(n);
  const out: LineaCierre[] = [{ texto: "Caja antes del último sello", monto: r(c.cajaAntes) }];
  out.push({ texto: "+ pago de Doña Carmen por el techo", monto: r(c.bruto) });
  out.push({ texto: "− adelanto que ya te había dado", monto: -r(c.adelanto) });
  out.push({ texto: "− fiado del guardalmacén", monto: -r(c.fiado) });
  const dias = Math.round(c.bono / BONO_DIA);
  out.push({
    texto: c.bono > 0.5 ? `+ bono de Doña Carmen (${peso(BONO_DIA)} × ${dias} ${dias === 1 ? "día" : "días"} antes del día ${PLAZO_ENTREGA})` : `+ bono de Doña Carmen (entregaste el día ${c.dia ?? PLAZO_ENTREGA}: sin bono)`,
    monto: r(c.bono),
  });
  out.push({ texto: "− jornales del día", monto: -r(c.jornales) });
  out.push({ texto: "− herramienta (3% del jornal)", monto: -r(c.herramienta) });
  out.push({ texto: "− Dirección del día", monto: -r(c.direccion) });
  out.push({ texto: "− deuda de nómina de días anteriores", monto: -r(c.deudaPrevia) });
  if (c.quedaDebiendo > 0.5) out.push({ texto: "+ lo que no alcanzó y queda debiendo a la cuadrilla", monto: r(c.quedaDebiendo) });
  const suma = out.reduce((a, l) => a + l.monto, 0);
  const final = r(c.cajaDespues);
  // Redondeo de centavos: si la suma de pesos enteros se aleja de la caja real, se muestra (nunca se esconde).
  if (suma !== final) out.push({ texto: "± centavos de redondeo", monto: final - suma });
  out.push({ texto: "= caja final", monto: final, total: true });
  return out;
}

export interface Sello {
  ok: boolean;
  motivo: string;
  etapa: number;
  pago: number;
  nombre: string;
  /** v20: «P$30,000 − P$20,000 adelanto = P$10,000». */
  cobroTexto?: string;
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
  /** Día en que Doña Carmen soltó el adelanto. Uno solo por obra. */
  adelantoDia: number;
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
  /** Tierra ya botada al baldío. No vuelve al relleno. */
  tierraBote: number;
  /** Pedazos de block y mezcla botada, junto al solar. */
  escombro: number;
  escombroBote: number;
  /** Precio firmado. 0 hasta que se firma: la oferta sigue en 300 mil. */
  precio: number;
  /** Doña Carmen solo escucha un pedido. */
  regateo: boolean;
  /** Minuto en que se despachó la cuadrilla. −1 si todavía no. */
  salidaMin: number;
  /** Agua entrada hoy, para una sola línea del diario. */
  aguaDia: number;
  /** Nómina del día, en pesos enteros. */
  nominaHoy: number;
  /** Día del último sello aprobado. Sanear lo rellena. */
  selloDia: number;
  /** Día en que el maestro aceptó pagar la nómina aunque no alcance. */
  nominaRoja: number;
  /** Jornales ya causados y no pagados. Se suman a la nómina de mañana. */
  deudaNomina: number;
  /** Días seguidos con la nómina incompleta. A 2 se va un obrero y vuelve a 0. */
  rachaCorta: number;
  /** Doña Carmen ya soltó la mitad de una etapa. Una vez por obra. */
  rescateUsado: boolean;
  /** v20: material fiado por el guardalmacén; se descuenta solo del próximo cobro. */
  fiado?: number;
  /** v27: la obra se perdió. Una obra perdida no se guarda ni se puede «Continuar». */
  perdida?: boolean;
  /** v19: bono cobrado al entregar antes del plazo. */
  bono?: number;
  /** v22: cuenta de la caja al entregar. */
  cierre?: Cierre;
  /** v23: segundos reales jugados hoy (para el piso del reloj). */
  realHoy?: number;
  /** v19: pérdidas del día (mezcla vencida, mojado...) para el resumen de la noche. */
  perdidasHoy?: { texto: string; pesos: number }[];
  /** El finde está parado en el domingo, a la espera del toque. */
  descanso: boolean;
  notaNomina: string;
  avisoOficioAlbanil: boolean;
  avisoOficioAcero: boolean;
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
  /** v19: última dirección de paso (para frenar suave) y fase del paso según lo caminado. */
  dirX?: number;
  dirY?: number;
  pasoFase?: number;
  mando: { ax: number; ay: number };
  destino: { x: number; y: number } | null;
  /** Waypoints del toque. No se guarda: sanear la vacía. */
  ruta?: { x: number; y: number }[] | null;
  /** Minutos de juego sin un Espacio del jugador en la obra o en el trompo. */
  sinGolpe: number;
  /** Ya no cuenta como albañil. Se deja en falso para partidas viejas. */
  maestroLider?: boolean;
  /** 25 % de lo que el oficio ya rindió, por tarea. Pegar no lo aumenta. */
  golpeBanco: Record<string, number>;
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
    /** Hormigón que se venció o se lavó, en tandas. No entra en la caja. */
    hormigonVencido?: number;
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
  siguiente?: Cantidades;
  hecho?: boolean;
  /** El completo no cabe en la caja. `cabe` es lo que la caja sí paga, aunque deje la nómina corta. */
  recorte?: boolean;
  cabe?: Cantidades;
  /** La caja paga el pedido y la nómina de hoy queda corta. */
  comeNomina?: boolean;
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

// v23: dos plomeos por muro (antes cuatro): menos paradas «Toca plomear» con la caja contada.
export const UMBRALES = [3, 9].map((h) => h * POR_HILADA);

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
    sinTareaHoy: 0,
    aviso70: false,
    anim: "nada",
    trabajando: false,
    dias: 0,
    animo: 100,
    esperaZona: 0,
    enCruce: false,
  };
}

function planLluvia(s: Estado) {
  const out: Lluvia[] = [];
  for (let d = 2; d <= 48 && out.length < 6; d++) {
    if (esDomingo(d)) continue;
    if (rngNext(s) >= 0.2) continue;
    const ini = 9 * 60 + Math.floor(rngNext(s) * (6 * 60 + 31));
    const dur = 60 + Math.floor(rngNext(s) * 121);
    const prob = 30 + Math.floor(rngNext(s) * 51);
    const cae = rngNext(s) * 100 < prob;
    out.push({ dia: d, ini, fin: Math.min(ini + dur, 18 * 60 - 1), prob, cae });
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
    escombro: 0,
    escombroBote: 0,
    precio: 0,
    regateo: false,
    salidaMin: -1,
    aguaDia: 0,
    nominaHoy: 0,
    selloDia: 1,
    nominaRoja: 0,
    deudaNomina: 0,
    rachaCorta: 0,
    rescateUsado: false,
    descanso: false,
    notaNomina: "",
    avisoOficioAlbanil: false,
    avisoOficioAcero: false,
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
    ruta: null,
    sinGolpe: 0,
    golpeBanco: {},
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
    if (typeof g.animo !== "number" || !Number.isFinite(g.animo)) g.animo = 100;
    if (typeof g.sinTareaHoy !== "number" || !Number.isFinite(g.sinTareaHoy)) g.sinTareaHoy = 0;
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
  s.golpeBanco = sanearBanco(s.golpeBanco);
  s.stats.muertoDetalle ??= {};
  s.stats.faltasLog ??= [];
  if (typeof s.adelantoDia !== "number" || !Number.isFinite(s.adelantoDia)) s.adelantoDia = 0;
  s.ruta = null;
  if (typeof s.morteroVencio !== "number" || !Number.isFinite(s.morteroVencio)) s.morteroVencio = 0;
  if (typeof s.herrHoy !== "number" || !Number.isFinite(s.herrHoy)) s.herrHoy = 0;
  if (typeof s.mezclaTarde !== "number" || !Number.isFinite(s.mezclaTarde)) s.mezclaTarde = 0;
  s.mezclaTardeNota = !!s.mezclaTardeNota;
  if (typeof s.tierraMonton !== "number" || !Number.isFinite(s.tierraMonton)) s.tierraMonton = s.inv.tierra?.q ?? 0;
  if (typeof s.tierraBote !== "number" || !Number.isFinite(s.tierraBote)) s.tierraBote = 0;
  if (typeof s.escombro !== "number" || !Number.isFinite(s.escombro)) s.escombro = 0;
  if (typeof s.escombroBote !== "number" || !Number.isFinite(s.escombroBote)) s.escombroBote = 0;
  if (typeof s.precio !== "number" || !Number.isFinite(s.precio)) s.precio = 0;
  s.regateo = !!s.regateo;
  if (typeof s.salidaMin !== "number" || !Number.isFinite(s.salidaMin)) s.salidaMin = -1;
  if (typeof s.aguaDia !== "number" || !Number.isFinite(s.aguaDia)) s.aguaDia = 0;
  if (typeof s.nominaHoy !== "number" || !Number.isFinite(s.nominaHoy)) s.nominaHoy = 0;
  if (typeof s.selloDia !== "number" || !Number.isFinite(s.selloDia)) {
    const hay = s.etapas?.some((e) => e?.sello === "aprobado");
    s.selloDia = hay ? s.dia : 1;
  }
  if (typeof s.nominaRoja !== "number" || !Number.isFinite(s.nominaRoja)) s.nominaRoja = 0;
  if (typeof s.deudaNomina !== "number" || !Number.isFinite(s.deudaNomina)) s.deudaNomina = 0;
  if (typeof s.rachaCorta !== "number" || !Number.isFinite(s.rachaCorta)) s.rachaCorta = 0;
  s.rescateUsado = !!s.rescateUsado;
  s.descanso = !!s.descanso;
  s.notaNomina = typeof s.notaNomina === "string" ? s.notaNomina : "";
  s.avisoOficioAlbanil = !!s.avisoOficioAlbanil;
  s.avisoOficioAcero = !!s.avisoOficioAcero;
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

function pasoHecho(s: Estado, i: number): boolean {
  const gente = s.gente.length + s.reserva.length > 0;
  const en = (puesto: Puesto) => [...s.gente, ...s.reserva].some((g) => g.puesto === puesto);
  const replanteo = s.etapa > 0 || runDe(s, 0, "replantear").hecho >= 2 - 1e-4;
  switch (i) {
    case 0:
      return s.firmado || s.tut.firma;
    case 1:
      return s.tut.parada || gente;
    case 2:
      return replanteo || runDe(s, 0, "replantear").hecho > 0.05;
    case 3:
      return s.tut.pedido || s.pedidos.length > 0;
    case 4:
      return s.tut.arena || en("acarreo");
    case 5:
      return !!s.tut.agua || en("agua");
    case 6:
      return !!s.tut.sita;
    case 7:
      return s.tut.fin;
    default:
      return false;
  }
}

function pasoNatural(s: Estado): number {
  if (!s.firmado && !s.tut.firma) return 0;
  for (let i = 0; i < 8; i++) if (!pasoHecho(s, i)) return i;
  return 8;
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
  if (!s.firmado && !s.entregada) return { x: SITIOS.oficina.x, y: SITIOS.oficina.y };
  if (s.firmado && !s.entregada && listos(s).some((w) => w.k === "achicar") && !juntoAZanja(s))
    return { x: SITIOS.obra.x, y: SITIOS.obra.y };
  if (s.firmado && !s.entregada && s.plomo && !juntoAlMuro(s)) return { x: SITIOS.obra.x, y: SITIOS.obra.y };
  const w = trabajoSiguiente(s);
  if (w && s.firmado && !s.entregada) {
    for (const m of matsEnFalta(s, w)) {
      if ((s.entrada[m]?.q ?? 0) > 0.02) return SITIOS.entrada;
    }
  }
  if (!s.firmado || s.tut.fin || s.entregada) return null;
  switch (pasoTutorial(s)) {
    case 1:
      return SITIOS.oficina;
    case 2:
      return SITIOS.obra;
    case 3:
      return puertaAlmacen();
    case 4:
      return SITIOS.entrada;
    case 5:
      return SITIOS.toma;
    default:
      return null;
  }
}

export function precioDe(s: Estado): number {
  return s.precio > 0 ? s.precio : CONTRATO;
}

/** v19: bono de Doña Carmen por entregar antes del día del plazo. Una regla: BONO_DIA por día de adelanto. */
export function bonoEntrega(s: Estado, dia = s.dia): number {
  return Math.max(0, PLAZO_ENTREGA - dia) * BONO_DIA;
}

export function techoCarmen(seed: number): number {
  const u = hash2(seed >>> 0, 60);
  const i = Math.min(2, Math.floor(u * 3));
  return [310_000, 315_000, 320_000][i]!;
}

const PEDIDOS_REGATEO = [305_000, 310_000, 315_000, 320_000, 325_000];

export function regatear(s: Estado, pedido: number): string {
  if (s.firmado) return "El contrato ya está firmado.";
  if (s.regateo) return "Doña Carmen ya te respondió.";
  if (!PEDIDOS_REGATEO.includes(pedido)) return "Ese precio no está en la mesa.";
  s.regateo = true;
  const techo = techoCarmen(s.seed);
  if (pedido <= techo) {
    s.precio = pedido;
    return `Está bien. Queda en ${peso(pedido)}.`;
  }
  s.precio = 295_000;
  return "Así no. Ya me cotizaron otro maestro en P$295,000. Si la quieres, es a ese precio.";
}

let cierreHoja = 0;
export function notarCierreHoja() {
  cierreHoja = Date.now();
}
export function terminarEnFrio(): boolean {
  return Date.now() - cierreHoja < 400;
}

export function firmar(s: Estado) {
  if (s.firmado) return;
  s.firmado = true;
  if (!(s.precio > 0)) s.precio = CONTRATO;
  const anticipo = Math.round(s.precio * 0.3);
  s.caja = anticipo;
  s.cobrado = anticipo;
  diario(s, `Anticipo de Doña Carmen: +${peso(anticipo)}.`);
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
  if (s.panel === "menu") return;
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

function mermaDe(k: Mat): number {
  return k === "block" ? 1.03 : 1;
}

function pasoCompra(m: Mat): number {
  return m === "block" ? 1 : MATERIALES[m].paso;
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
    s.tierraMonton = Math.max(0, (s.tierraMonton ?? 0) - q);
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
  const min = Math.min(s.minuto, 18 * 60);
  s.bitacora.push({ dia: s.dia, min, clase, texto, lugar });
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

const GRUPO_TOPE: Partial<Record<Mat, Mat[]>> = {
  v38: ["v14"],
  v14: ["v38"],
  plywood: ["pino", "abeto"],
  pino: ["plywood", "abeto"],
  abeto: ["plywood", "pino"],
};

/** v21: lo que el almacén tiene de su mismo grupo (madera o varilla) y esta etapa ya no usa. El guardalmacén lo recibe de vuelta para hacer sitio. */
function sobraDevolvible(s: Estado, g: Mat): number {
  const need = necesidadActual(s)[g] ?? 0;
  return Math.max(0, (s.inv[g]?.q ?? 0) - need);
}

function devolvible(s: Estado, m: Mat): number {
  let n = 0;
  for (const g of GRUPO_TOPE[m] ?? []) n += sobraDevolvible(s, g);
  return n;
}

/** v21: devuelve sobrantes del grupo (al precio en libros) hasta dejar sitio para `falta`. */
function devolverPara(s: Estado, m: Mat, falta: number) {
  let resta = falta;
  for (const g of GRUPO_TOPE[m] ?? []) {
    if (resta <= 1e-6) break;
    const sl = s.inv[g];
    if (!sl) continue;
    const q = Math.min(sobraDevolvible(s, g), resta);
    if (q <= 1e-6) continue;
    const v = sl.q > 0 ? (sl.valor * q) / sl.q : 0;
    sl.q -= q;
    sl.valor -= v;
    s.caja += v;
    resta -= q;
    diario(s, `Devuelto al guardalmacén para hacer sitio: ${num(q, 2)} ${MATERIALES[g].unidad} de ${MATERIALES[g].nombre} (+${peso(v)}).`);
  }
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
  if (w.reqCurado && s.curadoDias.length < CURADO_DIAS) return false;
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
  if (s.curando && !s.regadoHoy && s.curadoDias.length < CURADO_DIAS && !fraguaActiva(s)) {
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
      const per = (total / w.q) * mermaDe(k);
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
    let piezas = 0;
    for (const [k, total] of Object.entries(w.usa) as [Mat, number][]) {
      const base = (total * dq) / w.q;
      mapa[k] = base * mermaDe(k);
      if (k === "block") piezas += base * 0.03;
    }
    s.costos[w.partida].mat += gastarMapa(s, mapa, "obra");
    if (piezas > 0) s.escombro = (s.escombro ?? 0) + piezas * 0.008;
  }
  if (w.mezcla && w.mezclaQ) {
    const need = (w.mezclaQ * dq) / w.q;
    const got = consumirMezcla(s, w.mezcla, need);
    s.costos[w.partida].mat += got.costo;
    if (got.tomado + 1e-8 < need) dq *= need > 0 ? got.tomado / need : 0;
  }
  if (dq <= 1e-8) return 0;
  const antes = w.hecho;
  let nuevo = Math.min(w.q, antes + dq);
  // v19: lo que en pantalla ya es «10/10» cuenta como hecho; no pide otra tanda por una milésima.
  if (w.q - nuevo <= casiLleno(w.q)) nuevo = w.q;
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
      aviso(s, `Viga regada. Van ${s.curadoDias.length} de ${CURADO_DIAS} días.`);
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

/** El rinde de la hoja de contratar: el del motor, con la manía que aplica siempre. Sin tarea nueva. */
export function rindeLista(g: { rinde: number; mania: string }): number {
  let f = 1;
  if (g.mania === "tranquilo") f *= 0.9;
  if (g.mania === "madrugador") f *= 1.125;
  if (g.mania === "domino") f *= 0.9375;
  if (g.mania === "cantor") f *= 0.95;
  return g.rinde * f;
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

export function fatiga(s: Estado, g: Persona, tipo: "pesado" | "medio" | "liviano" | "caminar" | "sombra" | "lluvia") {
  // v23: curva más suave. Antes un día pesado (9/h) freía en una sola jornada a quien tiene poco aguante (Fefa).
  // Ahora el peor caso (aguante 1, patas) llega a 65 en 8 h pesadas: «frito» (85) pide dos días duros sin sombra.
  const tabla = { pesado: 5, medio: 3, liviano: 2, caminar: 1.5, sombra: -12, lluvia: -6 };
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
  // v23: con puesto, no tener nada que hacer de su oficio no es «Sin tarea asignada» (Bolo marcaba 6,4 h en Obra).
  if (!w) return "nohay";
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
  if (g && key === "tarea") g.sinTareaHoy = (g.sinTareaHoy ?? 0) + minutos;
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
  nohay: "En su puesto, sin trabajo de su oficio",
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
  const orden = ["batea", "agua", "mortero", "lluvia", "plomo", "tarea", "nohay", "otro"];
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

function consumoPorMin(s: Estado, tipo: "H" | "M"): number {
  let r = 0;
  for (const w of listos(s)) {
    if (w.mezcla !== tipo || !w.mezclaQ || w.q <= 0) continue;
    if (!alguienHara(s, w)) continue;
    if (mezclaPorMaterial(s, w) <= 1e-6) continue;
    const per = w.mezclaQ / w.q;
    for (const g of s.gente) {
      if (!g.activo || g.fuera || g.falto || g.puesto !== "obra") continue;
      if (!puedeTarea(g.oficio, w.k)) continue;
      const pick = elegir(s, g);
      if (!pick || pick.id !== w.id) continue;
      r += (TAREAS[w.k].rinde / 480) * Math.max(0.5, g.rinde) * per;
    }
  }
  return r;
}

/** En Muros el albañil está libre para vaciar solo si su próxima tarea es el hormigón, no el block. */
function albanilLibreParaVaciar(s: Estado): boolean {
  if (s.etapa !== 4) return true;
  // v23: el plomo saca el block de la lista solo un momento; no se bate hormigón por eso (se vencía al volver al block).
  if (s.plomo) return false;
  for (const w of listos(s)) {
    if (w.mezcla !== "H" || w.k !== "vaciar") continue;
    if (alguienHara(s, w)) return true;
  }
  return false;
}

function faltaMezclaUtil(s: Estado, tipo: "H" | "M"): number {
  let falta = 0;
  for (const w of listos(s)) {
    if (w.mezcla !== tipo) continue;
    if (!alguienHara(s, w)) continue;
    // v27: sin el material de la tarea en el almacén (p. ej. el block sigue en la entrada o en el camión) nadie gasta
    // la mezcla: se batía igual y se vencía tanda tras tanda con el peón en el Trompo.
    const util = w.id === "block" ? morteroHastaPlomo(s, w) : mezclaQueFalta(w);
    falta += Math.min(util, mezclaPorMaterial(s, w));
  }
  return falta;
}

/** v27: la mezcla que se puede gastar con el material (sin contar la mezcla) que hay hoy en el almacén. */
function mezclaPorMaterial(s: Estado, w: W): number {
  if (!w.mezcla || !w.mezclaQ || w.q <= 0) return 0;
  if (w.usaIni && !w.ini && !tieneMapa(s, w.usaIni)) return 0;
  let unidades = Math.max(0, w.q - w.hecho);
  if (w.usa) {
    for (const [k, total] of Object.entries(w.usa) as [Mat, number][]) {
      const per = total / Math.max(w.q, 1e-9);
      if (per <= 1e-9) continue;
      unidades = Math.min(unidades, Math.max(0, s.inv[k].q) / per);
    }
  }
  return unidades * (w.mezclaQ / w.q);
}

/** El mortero que sirve antes del próximo plomo (y del tope de block del día), más una tanda. Lo demás esperaría y se vencería. */
function morteroHastaPlomo(s: Estado, w: W): number {
  if (!w.mezclaQ || w.q <= 0) return 0;
  if (s.plomo) return 0;
  let hasta = w.q;
  for (const u of UMBRALES) {
    const ya = s.plumbed.some((p) => Math.abs(p - u) < 1e-3);
    if (!ya && u > w.hecho + 1e-6) {
      hasta = Math.min(hasta, u);
      break;
    }
  }
  const porTope = TOPE_BLOCK_DIA - s.blocksHoy;
  const bloques = Math.max(0, Math.min(hasta - w.hecho, porTope));
  // Una tanda de margen: el albañil no se queda esperando mezcla justo antes del plomo.
  // v27: el margen no va cuando lo que frena es el tope de hiladas del día: esa tanda sobraba y se vencía.
  const margen = bloques > 1e-6 && porTope > hasta - w.hecho ? 1 : 0;
  return Math.min(mezclaQueFalta(w), bloques * (w.mezclaQ / w.q) + margen);
}

/** No arranca una tanda que nadie va a usar antes de que se venza. */
function tandaCabe(s: Estado, tipo: "H" | "M"): boolean {
  if (tipo === "H" && !albanilLibreParaVaciar(s)) return false;
  const falta = faltaMezclaUtil(s, tipo);
  const have = stockMezcla(s, tipo) + tandasEnCurso(s, tipo);
  // v24: el último pedacito (p. ej. 7.98 de 8 en el firme) también pide su tanda. Antes, con menos de 0.02 tanda
  // pendiente, no se batía nunca y la obra quedaba trabada sin que el guardalmacén pidiera nada.
  if (falta <= have + 1e-3) return false;
  const porMin = consumoPorMin(s, tipo);
  if (have < 1e-3 && porMin > 0 && falta < 1) return true;
  const vida = tipo === "H" ? RECETA_H.vida : RECETA_M.vida;
  const hastaFaena = Math.max(0, 15 * 60 - s.minuto);
  const minutosBatir = tipo === "H" ? 60 : 22;
  const ventana = Math.max(0, hastaFaena - minutosBatir);
  const uso = porMin * Math.min(vida, ventana);
  if (uso < 0.9) return false;
  if (have + 0.05 >= Math.min(falta, uso)) return false;
  // v27: la tanda nueva se gasta después de las que ya hay (la más vieja primero). Si lo batido más esta tanda no se
  // alcanza a gastar dentro de su vida, la última se vence: con un solo albañil y el peón en el Trompo se vencían
  // varias al día. Se deja un 15 % de margen por cansancio y plomeos.
  if (tipo === "M" && have > 1e-3 && have + 1 > uso * 0.85) return false;
  return true;
}

function tipoQueFalta(s: Estado): "H" | "M" | null {
  const curso = s.mezclas.find((m) => !m.lista);
  if (curso) return curso.tipo;
  if (s.etapa === 4 && tandaCabe(s, "M")) return "M";
  const need: ("H" | "M")[] = [];
  for (const w of listos(s)) {
    if (!w.mezcla || !alguienHara(s, w)) continue;
    if (!need.includes(w.mezcla)) need.push(w.mezcla);
  }
  if (!need.length) return null;
  let best: "H" | "M" | null = null;
  let bestGap = 0;
  for (const t of need) {
    if (!tandaCabe(s, t)) continue;
    const gap = faltaMezclaUtil(s, t) - stockMezcla(s, t);
    if (gap > bestGap) {
      bestGap = gap;
      best = t;
    }
  }
  return best;
}

function iniciarMezcla(s: Estado, tipo: "H" | "M"): Mezcla | null {
  if (!tandaCabe(s, tipo)) return null;
  const map = receta(tipo);
  if (!tieneMapa(s, map)) return null;
  const costo = gastarMapa(s, map, "batea");
  const m: Mezcla = { tipo, prog: 0, lista: false, vida: 0, costo, restante: 1 };
  s.mezclas.push(m);
  return m;
}

function volMezcla(tipo: "H" | "M", frac: number): number {
  if (frac <= 1e-8) return 0;
  if (tipo === "H") return frac * (RECETA_H.arena + RECETA_H.grava + RECETA_H.agua);
  return frac * (RECETA_M.arena + RECETA_M.agua);
}

/** v21: lo que vale la mezcla hecha que se pierde si se va a dormir con ella. */
export function mezclaDeNoche(s: Estado): number {
  let c = 0;
  for (const m of s.mezclas) c += m.costo * (m.lista ? m.restante : 1);
  return Math.round(c);
}

function lavarMezclas(s: Estado, motivo: string) {
  if (!s.mezclas.length) return;
  let costo = 0;
  let n = 0;
  let vol = 0;
  for (const m of s.mezclas) {
    const frac = m.lista ? m.restante : 1;
    const c = m.costo * (m.lista ? m.restante : 1);
    costo += c;
    n += frac;
    vol += volMezcla(m.tipo, frac);
    s.costos[m.tipo === "H" ? "hormigon" : "block"].mat += c;
    if (m.tipo === "H" && frac > 1e-8) s.stats.hormigonVencido = (s.stats.hormigonVencido ?? 0) + frac;
  }
  s.stats.tandasPerdidas += n;
  s.stats.costoPerdidas += costo;
  s.escombro = (s.escombro ?? 0) + vol;
  s.mezclas = [];
  if (costo > 1) {
    aviso(s, `${motivo} Se perdió mezcla por ${peso(costo)}.`);
    perdida(s, "Mezcla perdida", costo);
  }
}

/** Anota una pérdida del día (ya está en su partida; no mueve la caja). */
function perdida(s: Estado, texto: string, pesos: number) {
  if (Math.round(pesos) < 1) return;
  (s.perdidasHoy ??= []).push({ texto, pesos });
  diario(s, `Pérdida: ${texto}, ${peso(pesos)}.`);
}

/** v20: la mezcla lista no se vence mientras la obra espera el plomo o el camión (nadie puede gastarla). */
function mezclaEnEspera(s: Estado): boolean {
  if (s.plomo) return true;
  return s.pedidos.length > 0 && !s.gente.some((g) => g.activo && !g.falto && g.trabajando);
}

function envejecerMezclas(s: Estado) {
  const siguen: Mezcla[] = [];
  for (const m of s.mezclas) {
    if (m.lista && !mezclaEnEspera(s)) m.vida -= 1;
    if (m.lista && m.vida <= 0) {
      const c = m.costo * m.restante;
      s.costos[m.tipo === "H" ? "hormigon" : "block"].mat += c;
      s.stats.tandasPerdidas += m.restante;
      s.stats.costoPerdidas += c;
      if (m.tipo === "H") s.stats.hormigonVencido = (s.stats.hormigonVencido ?? 0) + m.restante;
      s.escombro = (s.escombro ?? 0) + volMezcla(m.tipo, m.restante);
      s.morteroVencio = s.dia * 10000 + s.minuto;
      if (s.minuto >= 15 * 60) s.mezclaTarde = (s.mezclaTarde ?? 0) + c;
      if (Math.round(c) >= 1) {
        aviso(s, `Se venció el ${m.tipo === "H" ? "hormigón" : "mortero"} (${peso(c)}).`);
        perdida(s, `${m.tipo === "H" ? "Hormigón" : "Mortero"} vencido a las ${horaDe(s.minuto)}`, c);
      }
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

/** Sin peón ni ayudante trabajando hoy, el albañil hace de ayuda: bate en el trompo, busca agua y acarrea. Siempre hay salida. */
export function sinAyuda(s: Estado): boolean {
  return !s.gente.some((g) => esAyuda(g.oficio) && g.activo && !g.fuera && !g.falto);
}

function haceDeAyuda(s: Estado, g: Persona): boolean {
  return esAyuda(g.oficio) || (g.oficio === "albanil" && sinAyuda(s));
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

function alguienHara(s: Estado, w: W): boolean {
  for (const g of s.gente) {
    if (!g.activo || g.fuera || g.falto || g.puesto !== "obra") continue;
    if (!puedeTarea(g.oficio, w.k)) continue;
    const pick = elegir(s, g);
    if (pick && pick.id === w.id) return true;
  }
  return false;
}

function lluviaAhora(s: Estado): Lluvia | null {
  return s.lluvias.find((r) => r.cae !== false && r.dia === s.dia && s.minuto >= r.ini && s.minuto < r.fin) ?? null;
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
      perdida(s, `Cemento mojado (${pierde} fundas)`, costo);
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
    aviso(s, p.urgente ? "Llegó el camión urgente." : "Llegó el pedido.");
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
  if (g.puesto === "batea" && !bateaTieneTrabajo(s) && (!labor || labor === "batea")) {
    cobrarMin(s, g, "muerto");
    g.trabajando = false;
    g.anim = "nada";
    return;
  }
  if (labor === "tierra") {
    trabajarTierra(s, g);
    return;
  }
  if (!labor) {
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
        : labor === "sombra"
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
  const w = elegir(s, g);
  if (!w) {
    cobrarMin(s, g, "muerto");
    g.trabajando = false;
    g.anim = "nada";
    return;
  }
  const dq = ritmo(s, g, w.k);
  const got = aplicar(s, w, dq);
  if (got > 0) anotarRindeGolpe(s, g, w, got);
  if (got > 0) fatiga(s, g, TAREAS[w.k].peso);
  cobrarMin(s, g, got > 0 ? w.partida : "muerto");
  g.trabajando = got > 0;
  g.anim = got > 0 ? herramientaDe(w.k) : "nada";
}

/** Con el plomo pendiente no se bate mortero: lo batido se quedaría esperando y se vence después del plomeo. */
function morteroEnPausa(s: Estado, tipo: "H" | "M" | null | undefined): boolean {
  return !!s.plomo && tipo === "M";
}

function trabajarBatea(s: Estado, g: Persona): boolean {
  let curso = s.mezclas.find((m) => !m.lista);
  if (morteroEnPausa(s, curso ? curso.tipo : tipoQueFalta(s))) return false;
  if (!curso) {
    const tipo = tipoQueFalta(s);
    if (!tipo) return false;
    const tarea = tipo === "H" ? "mezclarH" : "mezclarM";
    const vel = Math.max(1e-6, ritmo(s, g, tarea));
    if (s.minuto + 1 / vel > 15 * 60) {
      cobrarMin(s, g, "muerto");
      g.trabajando = false;
      g.anim = "nada";
      return true;
    }
    if (!tieneMapa(s, receta(tipo))) {
      const map = receta(tipo);
      const soloAgua = aguaEsElFreno(s, map);
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
  if (hizo) fatiga(s, g, "pesado");
  cobrarMin(s, g, hizo ? "farmeo" : "muerto");
  g.trabajando = hizo;
  g.anim = hizo ? anim : "nada";
}

function tierraGuardada(s: Estado): number {
  const hecho = runDe(s, 7, "relleno").hecho;
  if (s.etapa > 7 || hecho >= 2.2 - 1e-4) return 0;
  return Math.max(0, 2.2 - hecho);
}

function tierraSobrante(s: Estado): number {
  return Math.max(0, (s.tierraMonton ?? 0) - tierraGuardada(s));
}

function trabajarTierra(s: Estado, g: Persona) {
  let cupo = 0.015;
  const sobra = tierraSobrante(s);
  if (sobra > 1e-6) {
    const q = Math.min(cupo, sobra);
    s.tierraMonton = Math.max(0, (s.tierraMonton ?? 0) - q);
    s.inv.tierra.q = Math.max(0, s.inv.tierra.q - q);
    if (s.inv.tierra.q < 1e-8) {
      s.inv.tierra.q = 0;
      s.inv.tierra.valor = 0;
    }
    s.tierraBote = (s.tierraBote ?? 0) + q;
    cupo -= q;
  }
  if (cupo > 1e-6 && (s.escombro ?? 0) > 1e-6) {
    const q = Math.min(cupo, s.escombro ?? 0);
    s.escombro = Math.max(0, (s.escombro ?? 0) - q);
    s.escombroBote = (s.escombroBote ?? 0) + q;
    cupo -= q;
  }
  const hizo = cupo < 0.015 - 1e-8;
  if (hizo) fatiga(s, g, "pesado");
  cobrarMin(s, g, hizo ? "farmeo" : "muerto");
  g.trabajando = hizo;
  g.anim = hizo ? "carretilla" : "nada";
}

function trabajarRegar(s: Estado, g: Persona) {
  const w = listos(s).find((x) => x.k === "regar");
  if (!w) {
    cobrarMin(s, g, "muerto");
    g.trabajando = false;
    g.anim = "nada";
    return;
  }
  const got = aplicar(s, w, ritmo(s, g, "regar"));
  if (got > 0) fatiga(s, g, "medio");
  cobrarMin(s, g, got > 0 ? w.partida : "muerto");
  g.trabajando = got > 0;
  g.anim = got > 0 ? "cubeta" : "nada";
}

function trabajarAgua(s: Estado, g: Persona) {
  const dq = ritmo(s, g, "agua");
  const n = Math.min(dq, Math.max(0, 1.2 - s.inv.agua.q));
  if (n > 1e-8) {
    s.inv.agua.q += n;
    s.aguaDia = (s.aguaDia ?? 0) + n;
    const q = Math.floor(s.aguaDia * 10) / 10;
    if (q >= 0.1 - 1e-9) {
      const texto = `Entró ${num(q, 1)} m³ al tanque`;
      const prev = [...s.bitacora].reverse().find((a) => a.dia === s.dia && a.lugar === "tanque" && a.clase === "entro");
      if (prev) {
        prev.texto = texto;
        prev.min = s.minuto;
      } else apunte(s, "entro", texto, "tanque");
    }
  }
  if (n > 1e-8) fatiga(s, g, "medio");
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
  return s.curando && !s.regadoHoy && s.curadoDias.length < CURADO_DIAS && !fraguaActiva(s);
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
  const ayuda = haceDeAyuda(s, g);
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
  const ayuda = haceDeAyuda(s, g);
  const out: { labor: Labor; prio: number }[] = [];
  const ayudarBatea =
    ayuda &&
    bateaTieneTrabajo(s) &&
    batiendo < (esAyuda(g.oficio) ? 2 : 1) &&
    (batiendo === 0 || (g.puesto === "obra" && obraEsperaMezcla(s)));
  if (ayudarBatea) out.push({ labor: "batea", prio: 1 });
  if (ayuda && s.inv.agua.q < 1.1 - 1e-9) out.push({ labor: "agua", prio: 2 });
  if (regarToca(s)) out.push({ labor: "regar", prio: 3 });
  if (ayuda && hayCarga(s)) out.push({ labor: "acarreo", prio: 4 });
  if (!sinTrabajoUtil(s, g)) out.push({ labor: "obra", prio: 5 });
  if (puedeBotar(s, g)) out.push({ labor: "tierra", prio: 6 });
  return out;
}

function puedeBotar(s: Estado, g: Persona): boolean {
  if (!esAyuda(g.oficio)) return false;
  if (g.puesto === "batea" || g.puesto === "agua") return false;
  if (bateaTieneTrabajo(s)) return false;
  return tierraSobrante(s) > 0.02 || (s.escombro ?? 0) > 0.02;
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
      (g.puesto === "batea" || g.puesto === "agua" || g.puesto === "acarreo") && !haceDeAyuda(s, g);
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
  const frenaEntrada = (() => {
    const w = trabajoSiguiente(s);
    if (!w) return false;
    const mf = materialFalta(s, w);
    return !!mf && /acarreo/i.test(mf);
  })();
  const hayAcarreo = s.gente.some((g) => g.activo && !g.fuera && !g.falto && (g.puesto === "acarreo" || out.get(g.id) === "acarreo"));
  if (frenaEntrada && !hayAcarreo) {
    const libre = s.gente.find((g) => {
      if (!g.activo || g.fuera || g.falto || !haceDeAyuda(s, g)) return false;
      if (g.puesto === "acarreo" || out.get(g.id) === "acarreo") return false;
      if ((g.puesto === "batea" || g.puesto === "agua") && g.puesto && puestoTieneTrabajo(s, g, g.puesto)) return false;
      return true;
    });
    if (libre) out.set(libre.id, "acarreo");
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
  const labor = laborDe(s, g);
  if (g.puesto === "batea" && !bateaTieneTrabajo(s) && (labor == null || labor === "batea")) return "Trompo · espera tanda";
  if (!g.puesto || g.puesto === "sombra") return null;
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

/** Margen por debajo del cual un trabajo ya se ve completo (10/10). */
function casiLleno(q: number): number {
  return Math.max(1e-4, q * 0.002);
}

function etapaCompleta(s: Estado): boolean {
  const def = ETAPAS[s.etapa];
  if (!def) return false;
  for (const t of def.trabajos) {
    if (runDe(s, s.etapa, t.id).hecho < t.q - casiLleno(t.q)) return false;
  }
  for (const e of s.extras) if (e.etapa === s.etapa && e.hecho < e.q - casiLleno(e.q)) return false;
  return true;
}

/** Lo que falta para sellar, solo cuando la etapa ya se ve casi lista (90% o más en cada trabajo). */
export function avisoSello(s: Estado): string {
  const def = ETAPAS[s.etapa];
  if (!def || s.entregada || s.sello) return "";
  for (const t of def.trabajos) if (runDe(s, s.etapa, t.id).hecho < t.q * 0.9) return "";
  return faltaParaSellar(s);
}

/** Si la etapa no sella, qué falta, en palabras: trabajo pendiente, material, mezcla, plomo, lluvia o fragua. */
export function faltaParaSellar(s: Estado): string {
  const def = ETAPAS[s.etapa];
  if (!def || s.entregada || s.sello) return "";
  const partes: string[] = [];
  for (const t of def.trabajos) {
    const h = runDe(s, s.etapa, t.id).hecho;
    if (h < t.q - casiLleno(t.q)) partes.push(`${t.nombre}: ${num(h, 1)} de ${num(t.q, 1)}`);
  }
  for (const e of s.extras) if (e.etapa === s.etapa && e.hecho < e.q - casiLleno(e.q)) partes.push(`${e.nombre}: ${num(e.hecho, 1)} de ${num(e.q, 1)}`);
  if (!partes.length) return "";
  const extra: string[] = [];
  if (s.plomo) extra.push("plomo pendiente: dale con la plomada");
  if (lluviaAhora(s)) extra.push("está lloviendo");
  if (s.fragua && fraguaActiva(s)) extra.push("fraguando");
  const c = cuello(s);
  if (/Falta|Pídelo|mezcla|Mezcla/.test(c)) extra.push(c.replace(/\.$/, ""));
  return `Para sellar ${def.nombre} falta: ${[...partes, ...extra].join("; ")}.`;
}

function revisar(s: Estado) {
  if (s.sello || s.entregada || s.etapa >= 9) return;
  if (!etapaCompleta(s)) return;
  const def = ETAPAS[s.etapa]!;
  let ok = true;
  let motivo = s.etapa >= ETAPAS.length - 1 ? "Ta' derecho. Obra terminada: la caseta quedó en pie y se entrega a Doña Carmen." : "Ta' derecho. Sigue la obra.";
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

/** v20: lo que entra de verdad al sellar una etapa: tramo − adelanto − fiado. */
export function cobroDe(s: Estado, etapa = s.etapa): { bruto: number; adelanto: number; fiado: number; neto: number; texto: string } {
  const def = ETAPAS[etapa];
  const bruto = def && def.tramo > 0 ? Math.round(precioDe(s) * def.tramo) : 0;
  const adelanto = Math.min(s.adelanto, bruto);
  const fiado = Math.min(s.fiado ?? 0, bruto - adelanto);
  const neto = bruto - adelanto - fiado;
  let texto = peso(bruto);
  if (adelanto > 0.5) texto += ` − ${peso(adelanto)} adelanto`;
  if (fiado > 0.5) texto += ` − ${peso(fiado)} fiado`;
  if (adelanto > 0.5 || fiado > 0.5) texto += ` = ${peso(neto)}`;
  return { bruto, adelanto, fiado, neto, texto };
}

function proximoTramo(s: Estado): number {
  for (let i = s.etapa; i < ETAPAS.length; i++) if (ETAPAS[i]!.tramo > 0) return i;
  return -1;
}

/** v20: lo que hace falta para sellar la etapa actual, si la caja no lo paga ni con adelanto. */
export function cuentaFiado(s: Estado): { items: Cantidades; total: number } | null {
  // Se puede fiar más de una vez, mientras todo lo fiado quepa en el próximo cobro.
  if (!s.firmado || s.entregada || s.sello) return null;
  const prox = proximoTramo(s);
  if (prox < 0) return null;
  const items = loQueFalta(s);
  if (!tieneItems(items)) return null;
  const mats = costoMats(items);
  const total = mats + fleteDe(s, false);
  if (cajaLibre(s) >= total - 0.5) return null;
  if (puedeAdelantar(s, total)) return null;
  if (total > limiteFiado(s) + 0.5) return null;
  return { items, total };
}

/** v21: lo fiado se descuenta de los tramos que faltan (uno tras otro). El tope es lo que queda por cobrar. */
export function limiteFiado(s: Estado): number {
  let suma = 0;
  for (let i = s.etapa; i < ETAPAS.length; i++) if (ETAPAS[i]!.tramo > 0) suma += Math.round(precioDe(s) * ETAPAS[i]!.tramo);
  return Math.max(0, suma - s.adelanto - (s.fiado ?? 0));
}

export function puedeFiar(s: Estado): boolean {
  return cuentaFiado(s) != null;
}

/** v20: el guardalmacén fía lo justo para sellar esta etapa. Se paga solo del próximo cobro de Doña Carmen. */
export function fiar(s: Estado): string | null {
  const c = cuentaFiado(s);
  if (!c) return "El guardalmacén solo fía lo que falta para sellar la etapa, cuando la caja y el adelanto no alcanzan.";
  return fiarItems(s, c.items, false, c.total);
}

/** v24: el pedido suelto de la Ferretería también se puede fiar, con las mismas reglas: la caja (y el adelanto) no lo
 * pagan y todo lo fiado cabe en lo que queda por cobrar. Antes solo se fiaba lo que faltaba para sellar la etapa. */
export function cuentaFiadoPedido(s: Estado, items: Cantidades, urgente = false): { items: Cantidades; total: number } | null {
  if (!s.firmado || s.entregada || s.sello) return null;
  if (proximoTramo(s) < 0) return null;
  const limpio: Cantidades = {};
  for (const [k, n] of Object.entries(items) as [Mat, number][]) if ((n ?? 0) > 1e-6 && MATERIALES[k]?.compra) limpio[k] = n;
  if (!tieneItems(limpio)) return null;
  const total = costoMats(limpio) + fleteDe(s, urgente);
  if (s.caja >= total - 0.5) return null;
  if (puedeAdelantar(s, total) && cajaLibre(s) + montoAdelanto(s) >= total - 0.5) return null;
  if (total > limiteFiado(s) + 0.5) return null;
  return { items: limpio, total };
}

export function fiarPedido(s: Estado, items: Cantidades, urgente = false): string | null {
  const c = cuentaFiadoPedido(s, items, urgente);
  if (!c) return "El guardalmacén no fía este pedido: la caja lo paga o ya no cabe en lo que queda por cobrar.";
  return fiarItems(s, c.items, urgente, c.total);
}

function fiarItems(s: Estado, items: Cantidades, urgente: boolean, total: number): string | null {
  const caja = s.caja;
  // Caja de paso para que el pedido salga aunque la caja esté en cero o negativa; luego vuelve a su valor.
  const paso = total + 1e6;
  s.caja = paso;
  const err = pedir(s, items, urgente, true);
  const pagado = paso - s.caja;
  s.caja = caja;
  if (err) return err;
  s.fiado = (s.fiado ?? 0) + pagado;
  const prox = ETAPAS[proximoTramo(s)]?.nombre ?? "la próxima etapa";
  const frase = `El guardalmacén fía ${peso(pagado)} de material. Se descuenta solo al cobrar ${prox}.`;
  diario(s, frase);
  aviso(s, frase);
  if (s.sita) cerrarOfertaSita(s);
  return null;
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
  const cajaAntes = s.caja;
  const cAntes = cobroDe(s, i);
  if (def.tramo > 0) {
    const c = cobroDe(s, i);
    s.adelanto -= c.adelanto;
    s.fiado = Math.max(0, (s.fiado ?? 0) - c.fiado);
    if (s.fiado < 0.5) s.fiado = 0;
    // El fiado se le paga al guardalmacén del cobro: entra a la caja solo lo neto.
    pago = c.bruto - c.adelanto;
    s.caja += pago - c.fiado;
    s.cobrado += pago;
    seal.cobroTexto = c.texto;
    pago = c.neto;
  }
  seal.pago = pago;
  if (s.etapas[i]!.primera == null) {
    s.etapas[i]!.primera = true;
    s.stats.aprobadasPrimera += 1;
  }
  s.etapas[i]!.sello = "aprobado";
  s.etapas[i]!.motivo = seal.motivo;
  s.selloDia = s.dia;
  diario(s, seal.cobroTexto ? `APROBADO: ${def.nombre}. Cobro: +${peso(pago)}${/=/.test(seal.cobroTexto) ? ` (${seal.cobroTexto})` : ""}.` : `APROBADO: ${def.nombre}.`);
  // v19: el domingo se descansa; si mañana es domingo, el block y el resto siguen el lunes.
  const otroDia = esDomingo(s.dia + 1) ? "el lunes" : "mañana";
  if (def.id === "zapata") s.fragua = programarFragua(s, `La zapata fragua. El block empieza ${otroDia} a las 7:00.`);
  if (def.id === "columnas") s.fragua = programarFragua(s, `Las columnas fraguan. ${otroDia === "mañana" ? "Mañana" : "El lunes"} se puede seguir.`);
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
    const bono = bonoEntrega(s);
    if (bono > 0) {
      s.caja += bono;
      s.cobrado += bono;
      s.bono = bono;
      diario(s, `Bono por entrega temprana (${PLAZO_ENTREGA - s.dia} días antes del día ${PLAZO_ENTREGA}): +${peso(bono)}.`);
    }
    // v22: al entregar se paga la nómina del día y la deuda de nómina; la cuenta queda a la vista.
    s.entregada = false;
    const d = desgloseNomina(s);
    const deudaPrevia = s.deudaNomina ?? 0;
    const antesNom = s.caja;
    let jornales = 0;
    let herramienta = 0;
    let direccion = 0;
    if (!s.nominaPagada) {
      // v23: el desglose sale de lo que pagarNomina cobró de verdad (no de una estimación aparte).
      void d;
      const dirAntes = s.costos.direccion.mo;
      s.nominaRoja = s.dia;
      s.rachaCorta = 0;
      pagarNomina(s);
      jornales = s.nominaHoy ?? 0;
      herramienta = s.herrHoy ?? 0;
      direccion = s.costos.direccion.mo - dirAntes;
      s.entregada = true;
      if (s.panel === "nomina") s.panel = null;
    } else {
      s.entregada = true;
      if (!s.direccionCobrada) {
        s.caja -= DIRECCION_DIA;
        s.costos.direccion.mo += DIRECCION_DIA;
        s.direccionCobrada = true;
        s.diasTrabajados += 1;
        direccion = DIRECCION_DIA;
        diario(s, `Dirección del día: −${peso(DIRECCION_DIA)}.`);
      }
      const deuda = s.deudaNomina ?? 0;
      if (deuda > 0.5) {
        const paga = Math.min(Math.max(0, s.caja), deuda);
        s.caja -= paga;
        s.deudaNomina = deuda - paga > 0.5 ? deuda - paga : 0;
        if (paga > 0.5) diario(s, `Deuda de nómina pagada al entregar: −${peso(paga)}.`);
      }
    }
    s.cierre = {
      cajaAntes,
      bruto: cAntes.bruto,
      adelanto: cAntes.adelanto,
      fiado: cAntes.fiado,
      bono,
      jornales,
      herramienta,
      direccion,
      deudaPrevia,
      pagadoNomina: antesNom - s.caja,
      quedaDebiendo: s.deudaNomina ?? 0,
      cajaDespues: s.caja,
      dia: s.dia,
    };
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

function costoNominaHoy(s: Estado): { jornales: number; herr: number; direccion: number; total: number } {
  let jornales = 0;
  let herr = 0;
  for (const g of s.gente) {
    if (!g.activo || g.falto) continue;
    const j = jornalDe(g.oficio, g.rinde);
    jornales += j;
    herr += Math.round(j * HERRAMIENTA);
  }
  const direccion = jornales > 0 && !s.direccionCobrada && s.firmado && !s.entregada ? DIRECCION_DIA : 0;
  return { jornales, herr, direccion, total: jornales + herr + direccion };
}

/** El que se iría primero si la nómina vuelve a quedar corta: el de menos ánimo; a igual ánimo, el que no manda. */
export function quienSeVa(s: Estado): Persona | null {
  const lista = [...s.gente, ...s.reserva];
  if (!lista.length) return null;
  const lider = (g: Persona) => g.oficio === "albanil" || g.oficio === "varillero" || g.oficio === "carpintero";
  lista.sort((a, b) => (a.animo ?? 100) - (b.animo ?? 100) || Number(lider(a)) - Number(lider(b)));
  return lista[0]!;
}

/** v27: la obra se pierde (no quedó nadie). Queda marcada para que el guardado la archive y no se pueda continuar. */
function perderObra(s: Estado) {
  s.panel = "perdida";
  s.perdida = true;
  if (!s.diario.some((d) => d.texto === "No quedó nadie trabajando. La obra se perdió.")) diario(s, "No quedó nadie trabajando. La obra se perdió.");
}

/** v27: true si la obra se perdió (marca nueva o, en guardados de la v26 o antes, el panel «Obra perdida»). */
export function obraPerdida(s: Estado | null | undefined): boolean {
  if (!s) return false;
  return s.perdida === true || s.panel === "perdida";
}

function seVaObrero(s: Estado) {
  const lista = [...s.gente, ...s.reserva];
  if (!lista.length) {
    perderObra(s);
    return;
  }
  const g = quienSeVa(s)!;
  const gi = s.gente.findIndex((x) => x.id === g.id);
  if (gi >= 0) s.gente.splice(gi, 1);
  else {
    const ri = s.reserva.findIndex((x) => x.id === g.id);
    if (ri >= 0) s.reserva.splice(ri, 1);
  }
  anotarFalta(s, `${g.nombre} ${g.apellido}`, "Dos días sin la nómina completa");
  const frase = `${g.nombre} se fue: dos días seguidos sin cobrar completo.`;
  diario(s, frase);
  aviso(s, frase);
  if (s.gente.length + s.reserva.length === 0) perderObra(s);
}

function pagarNomina(s: Estado) {
  if (s.nominaPagada) return;
  const previo = costoNominaHoy(s);
  const deudaPrev = s.deudaNomina ?? 0;
  const duePrevio = previo.total + deudaPrev;
  if (s.caja - duePrevio < -0.5 && s.nominaRoja !== s.dia) {
    s.panel = "nomina";
    return;
  }
  let jornales = 0;
  let herrSum = 0;
  for (const g of s.gente) {
    if (!g.activo || g.falto) continue;
    const j = jornalDe(g.oficio, g.rinde);
    const diff = j - g.moHoy;
    if (diff > 0.01) {
      s.costos.muerto.mo += diff;
      const rate = j / 480;
      anotarMuerto(s, g, diff, rate > 0 ? diff / rate : 0, "resto");
    }
    g.moHoy = j;
    const herr = Math.round(j * HERRAMIENTA);
    s.costos.herramienta.mo += herr;
    jornales += j;
    herrSum += herr;
    g.dias += 1;
    g.fuera = true;
    g.trabajando = false;
  }
  let direccion = 0;
  if (jornales > 0 && !s.direccionCobrada && s.firmado && !s.entregada) {
    s.costos.direccion.mo += DIRECCION_DIA;
    s.direccionCobrada = true;
    s.diasTrabajados += 1;
    direccion = DIRECCION_DIA;
  }
  const hoy = jornales + herrSum + direccion;
  const totalDue = hoy + deudaPrev;
  const pago = Math.min(Math.max(0, s.caja), totalDue);
  s.caja -= pago;
  const corto = totalDue - pago;
  s.deudaNomina = corto > 0.5 ? corto : 0;
  s.nominaPagada = true;
  s.herrHoy = herrSum;
  s.nominaHoy = jornales;
  if (s.salidaMin < 0) s.salidaMin = s.minuto;
  if (corto > 0.5) {
    s.rachaCorta = (s.rachaCorta ?? 0) + 1;
    for (const g of [...s.gente, ...s.reserva]) g.animo = Math.max(0, (g.animo ?? 100) - 25);
    const frase = `Nómina corta: se pagaron ${peso(pago)} de ${peso(totalDue)}. Quedan ${peso(s.deudaNomina)} para mañana y el ánimo bajó.`;
    diario(s, `Nómina pagada (corta): −${peso(pago)}.`);
    diario(s, frase);
    aviso(s, frase);
    if (s.rachaCorta >= 2) {
      const espera = esperaAlCobro(s) || esperaUltimo(s);
      if (espera) {
        // v22: «te pago al cobrar»: con la etapa casi lista y un cobro que cubre la deuda, nadie se va.
        s.rachaCorta = 1;
        diario(s, espera);
        aviso(s, espera);
      } else {
        s.rachaCorta = 0;
        seVaObrero(s);
      }
    }
  } else {
    s.rachaCorta = 0;
    for (const g of [...s.gente, ...s.reserva]) g.animo = Math.min(100, (g.animo ?? 100) + 5);
    if (deudaPrev > 0.5) diario(s, `Deuda de nómina: −${peso(Math.min(deudaPrev, pago))}.`);
    if (jornales > 0) {
      const temprano = s.salidaMin < 15 * 60;
      const cabeza = temprano
        ? `Se fueron a las ${horaDe(s.salidaMin)}. El día se paga completo.`
        : "Se fueron a las 3.";
      const linea = `Nómina: −${peso(jornales)}. Herramienta: −${peso(herrSum)}.`;
      diario(s, linea);
      if (direccion > 0) diario(s, `Dirección del día: −${peso(direccion)}.`);
      aviso(s, `${cabeza} Jornales ${peso(jornales)} + herramienta ${peso(herrSum)} + Dirección ${peso(direccion)} = ${peso(jornales + herrSum + direccion)}.`);
    }
  }
}

export function confirmarNomina(s: Estado, conAdelanto: boolean) {
  if (s.nominaPagada) return;
  if (conAdelanto && puedeAdelantar(s)) adelantar(s);
  s.nominaRoja = s.dia;
  if (s.panel === "nomina") s.panel = null;
  pagarNomina(s);
}

function vieneManana(g: Persona, dia: number): boolean {
  if (g.libre) return false;
  if (g.cansancio >= 85) return false;
  if (g.mania === "madrugador" && esSabado(dia)) return false;
  return true;
}

export function nominaManana(s: Estado): number {
  let dia = s.dia + 1;
  if (esDomingo(dia)) dia += 1;
  let jornales = 0;
  let herr = 0;
  for (const g of [...s.gente, ...s.reserva]) {
    if (!vieneManana(g, dia)) continue;
    const j = jornalDe(g.oficio, g.rinde);
    jornales += j;
    herr += Math.round(j * HERRAMIENTA);
  }
  if (jornales <= 0) return 0;
  return jornales + herr + DIRECCION_DIA;
}

function adelantoManana(s: Estado): number {
  if (adelantoUsado(s)) return 0;
  if (precioDe(s) - s.cobrado <= 1) return 0;
  const manana = esDomingo(s.dia + 1) ? s.dia + 2 : s.dia + 1;
  if (manana - (s.selloDia ?? 1) > 18) return 0;
  const monto = Math.round(Math.min(20000, topeAvance(s)));
  return monto >= 100 ? monto : 0;
}

function avisarNominaManana(s: Estado) {
  if (s.entregada) {
    s.notaNomina = "";
    return;
  }
  const nom = nominaManana(s);
  const adel = adelantoManana(s);
  const deuda = deudaPendiente(s);
  const falta = nom + deuda - s.caja - adel;
  if (falta <= 0.5) {
    s.notaNomina = "";
    return;
  }
  const conDeuda = deuda > 0.5 ? ` más ${peso(deuda)} de deuda` : "";
  const conAdel = adel > 0 ? ` (más ${peso(adel)} de adelanto)` : " (sin adelanto disponible)";
  const texto = `Ojo: mañana la nómina es ${peso(nom)}${conDeuda} y tienes ${pesoCaja(s.caja)}${conAdel}. Faltan ${peso(falta)}: ${accionesNomina(s).join("; ")}.${textoSeVaManana(s)}`;
  s.notaNomina = texto;
  if (!s.diario.some((d) => d.dia === s.dia && d.texto.startsWith("Ojo: mañana la nómina"))) diario(s, texto);
  if (!s.avisos.some((a) => a.texto.startsWith("Ojo: mañana la nómina"))) aviso(s, texto);
}

/** Dos o tres cosas concretas para cubrir la nómina de mañana. */
export function accionesNomina(s: Estado): string[] {
  const out: string[] = [];
  const prox = ETAPAS.slice(s.etapa).find((e) => e.tramo > 0);
  if (prox && !s.entregada) out.push(`sella ${prox.nombre} (cobra ${cobroDe(s, ETAPAS.indexOf(prox)).texto})`);
  const ayuda = [...s.gente, ...s.reserva]
    .filter((g) => !g.libre && (g.oficio === "peon" || g.oficio === "ayudante"))
    .sort((a, b) => jornalDe(b.oficio, b.rinde) - jornalDe(a.oficio, a.rinde))[0];
  if (ayuda) out.push(`da libre a ${ayuda.nombre} (ahorras ${peso(jornalDe(ayuda.oficio, ayuda.rinde))})`);
  else out.push("da libre a alguien");
  out.push("pide solo lo que falta para hoy");
  return out;
}

/** Si ya hubo un día de nómina corta, quién se va mañana si se repite. */
/** v22: la cuadrilla espera al cobro si la etapa que cobra va en 75% o más y lo neto de ese cobro paga la deuda de nómina. */
export function esperaAlCobro(s: Estado): string {
  if (!s.firmado || s.entregada) return "";
  const i = proximoTramo(s);
  if (i < 0) return "";
  const def = ETAPAS[i]!;
  // v27: margen. Antes solo se esperaba con la etapa que cobra al 75 % o más (por trabajos), y el Revisor perdió la obra
  // con los muros al 85 % del block: el promedio con los huecos no llegaba. Ahora la cuadrilla espera mientras lo neto
  // del próximo cobro pague la deuda de nómina, vaya la obra por donde vaya. La deuda crece cada día corto, así que el
  // margen se acaba solo si el cobro ya no alcanza.
  const neto = cobroDe(s, i).neto;
  const deuda = (s.deudaNomina ?? 0) + desgloseNomina(s).total;
  if (neto + Math.max(0, s.caja) < deuda - 0.5) return "";
  return `Nadie se va: «te pago al cobrar». El cobro de ${def.nombre} (${peso(neto)}) cubre la deuda de nómina (${peso(s.deudaNomina ?? 0)}).`;
}

/** v27: el último que queda no se va mientras lo que falta por cobrar (todos los tramos, menos adelanto y fiado) pague
 * la deuda: la obra no se pierde por la nómina mientras haya cobro por delante. */
export function esperaUltimo(s: Estado): string {
  if (!s.firmado || s.entregada) return "";
  if (s.gente.length + s.reserva.length !== 1) return "";
  if (proximoTramo(s) < 0) return "";
  // Con la obra parada (más de 18 días sin sellar nada) no hay cobro a la vista: el último también se va.
  if (obraParada(s)) return "";
  const deuda = (s.deudaNomina ?? 0) + desgloseNomina(s).total;
  if (limiteFiado(s) + Math.max(0, s.caja) < deuda - 0.5) return "";
  const g = [...s.gente, ...s.reserva][0]!;
  return `${g.nombre} se queda: es el último y espera el cobro («te pago al cobrar»). Quedan ${peso(s.deudaNomina ?? 0)} de deuda de nómina.`;
}

export function textoSeVaManana(s: Estado): string {
  if ((s.rachaCorta ?? 0) < 1) return "";
  if (esperaAlCobro(s)) {
    const i = proximoTramo(s);
    return ` Si vuelve a quedar corta, nadie se va: el cobro de ${ETAPAS[i]?.nombre ?? "la próxima etapa"} paga la deuda («te pago al cobrar»).`;
  }
  if (esperaUltimo(s)) return ` Si vuelve a quedar corta, ${[...s.gente, ...s.reserva][0]!.nombre} se queda: es el último y espera el cobro.`;
  const g = quienSeVa(s);
  return g ? ` Si vuelve a quedar corta, mañana se va ${g.nombre}.` : "";
}

function abrirFinde(s: Estado) {
  notarMezclaTarde(s);
  avisarNominaManana(s);
  if (s.panel === "finde" || s.panel === "informe" || s.panel === "perdida") return;
  // v18: la dirección se cobra con la misma regla que el pronóstico: solo si ese día se pagaron jornales.
  if (!s.direccionCobrada && s.firmado && !s.entregada && (s.nominaHoy ?? 0) > 0.5) {
    const pago = Math.min(Math.max(0, s.caja), DIRECCION_DIA);
    s.caja -= pago;
    s.costos.direccion.mo += DIRECCION_DIA;
    const resta = DIRECCION_DIA - pago;
    if (resta > 0.5) s.deudaNomina = (s.deudaNomina ?? 0) + resta;
    s.direccionCobrada = true;
    s.diasTrabajados += 1;
    const texto = resta > 0.5 ? `Dirección del día: −${peso(pago)} (de ${peso(DIRECCION_DIA)}). Quedan ${peso(resta)} de deuda para la nómina de mañana.` : `Dirección del día: −${peso(DIRECCION_DIA)}.`;
    diario(s, texto);
    if (resta > 0.5) aviso(s, texto);
  }
  if (s.mezclas.length && !s.diario.some((d) => d.dia === s.dia && d.texto.startsWith("Hay mezcla en el trompo"))) {
    const texto = "Hay mezcla en el trompo. Si duermes, se pierde.";
    diario(s, texto);
    aviso(s, texto);
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
  if (!s.entregada && puedeRescate(s)) {
    const frase = fraseRescate(s);
    if (!s.diario.some((d) => d.dia === s.dia && d.texto === frase)) {
      diario(s, frase);
      aviso(s, frase);
    }
  }
  if (!s.entregada && s.gente.length + s.reserva.length === 0) {
    perderObra(s);
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
  if (s.sita?.oferta) return;
  if (notaEnDia(s, "Para mañana faltan")) return;
  const cuerpo = cuerpoNota(s);
  if (!cuerpo.lineas) return;
  const llega = llegadaPedido(s, false, s.minuto + 1);
  const cuando = fraseCuando(s, false, llega);
  let texto = `Para mañana faltan:\n${cuerpo.lineas}`;
  if (cuerpo.lineasSig) texto += `\nPara la siguiente etapa (opcional):\n${cuerpo.lineasSig}`;
  texto += `\n¿Pido? Normal, ${cuando}`;
  apunte(s, "nota", texto, "");
}

function paso(s: Estado) {
  if (s.entregada) {
    abrirFinde(s);
    return;
  }
  if (s.minuto >= 18 * 60) {
    if (s.destino) return;
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
  if (s.minuto < 15 * 60) {
    for (const g of s.gente) trabajarPersona(s, g);
    for (const g of s.gente) cerrarEspera(s, g);
    pulsoGolpeMaestro(s);
  }
  s.minuto += 1;
  if (s.minuto >= 15 * 60 && !s.nominaPagada) pagarNomina(s);
  if (s.minuto >= 18 * 60) {
    if (!s.destino) abrirFinde(s);
  } else if (!s.panel) revisar(s);
}

export function tick(s: Estado, dtReal: number, ritmo = 1) {
  if (s.entregada || s.pausa) return;
  if (!s.firmado) {
    if (s.panel) return;
    const d = moverMaestro(s, clamp(dtReal, 0, 0.1), ritmo);
    s.pasoFase = (s.pasoFase ?? 0) + d;
    return;
  }
  const sim = dtReal >= 0.15;
  if (!sim && s.sita?.fase === "yendo" && !s.panel) {
    moverSita(s, clamp(dtReal, 0, 0.1), 11);
    if (s.sita.fase === "yendo") return;
    if (!s.panel) s.panel = "sita";
    return;
  }
  if (s.panel) return;
  const dt = clamp(dtReal, 0, 0.1);
  const camino = moverMaestro(s, dt, ritmo);
  s.pasoFase = (s.pasoFase ?? 0) + camino;
  moverCuadrilla(s, dt * ritmo);
  if (s.gente.length + s.reserva.length === 0) return;
  // v19: mientras el maestro camina, el reloj corre por lo caminado (cruzar el solar < 20 min);
  // quieto, corre como siempre (5 min por segundo a x1).
  // v23: caminando, el reloj corre por lo caminado (cruzar el solar ≤ 20 min), pero después de 90 s reales en el día
  // nunca baja de 3 min por segundo: un día (7:00 a 18:00) dura como mucho ~4,8 min reales a x1 aunque camines todo el rato.
  // Antes corría solo por lo caminado (0,65 min/s) y un día caminando duraba más de 15 minutos.
  if (!sim) s.realHoy = (s.realHoy ?? 0) + dt;
  const piso = (s.realHoy ?? 0) > RELOJ_GRACIA_SEG ? dt * RELOJ_MIN_CAMINANDO * ritmo : 0;
  s.frac += camino > 1e-4 ? Math.max(camino * MIN_POR_CASILLA, piso) : sim ? dt * 5 : dt * 5 * ritmo;
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
    if (s.panel === "sello" || s.panel === "finde" || s.panel === "informe" || s.panel === "nomina" || s.panel === "perdida") return;
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
  // v20: contra un tanque, el trompo o la mata, resbala por el borde (aunque vaya de frente) en vez de quedarse pegado.
  for (const c of circulosSolidos()) {
    const ox = x - c.x;
    const oy = y - c.y;
    const od = Math.hypot(ox, oy);
    if (od > c.r + Math.hypot(dx, dy) + 0.05 || od < 1e-6) continue;
    const nx = ox / od;
    const ny = oy / od;
    const dn = dx * nx + dy * ny;
    if (dn >= 0) continue;
    let sx = dx - dn * nx;
    let sy = dy - dn * ny;
    const paso = Math.hypot(dx, dy);
    if (Math.hypot(sx, sy) < paso * 0.35) {
      const lado = sx * -ny + sy * nx >= 0 ? 1 : -1;
      sx = -ny * lado * paso * 0.7;
      sy = nx * lado * paso * 0.7;
    }
    const px = c.x + (ox + sx) / Math.hypot(ox + sx, oy + sy) * Math.max(od, c.r + 1e-3);
    const py = c.y + (oy + sy) / Math.hypot(ox + sx, oy + sy) * Math.max(od, c.r + 1e-3);
    if (!choca(px, py)) return { x: px, y: py };
  }
  if (!choca(x + dx, y)) return { x: x + dx, y };
  if (!choca(x, y + dy)) return { x, y: y + dy };
  const d = Math.hypot(dx, dy) || 1;
  const ux = -dy / d;
  const uy = dx / d;
  if (!choca(x + ux * d, y + uy * d)) return { x: x + ux * d, y: y + uy * d };
  if (!choca(x - ux * d, y - uy * d)) return { x: x - ux * d, y: y - uy * d };
  return { x, y };
}

function nodosRodeo(): { x: number; y: number }[] {
  const o = 0.28;
  const out: { x: number; y: number }[] = [];
  for (const c of cajasSolidas()) {
    out.push(
      { x: c.x0 - o, y: c.y0 - o },
      { x: c.x1 + o, y: c.y0 - o },
      { x: c.x0 - o, y: c.y1 + o },
      { x: c.x1 + o, y: c.y1 + o },
    );
  }
  for (const c of circulosSolidos()) {
    const rr = c.r + o;
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI * 2 * i) / 8;
      out.push({ x: c.x + Math.cos(a) * rr, y: c.y + Math.sin(a) * rr });
    }
  }
  return out.filter((p) => p.x >= MAPA.x0 && p.x <= MAPA.x1 && p.y >= MAPA.y0 && p.y <= MAPA.y1 && !choca(p.x, p.y));
}

/** Ruta más corta del toque. En campo abierto es la recta, igual que el mando. */
function rutaMasCorta(ax: number, ay: number, bx: number, by: number): { x: number; y: number }[] {
  let gx = clamp(bx, MAPA.x0, MAPA.x1);
  let gy = clamp(by, MAPA.y0, MAPA.y1);
  if (choca(gx, gy)) {
    const s = sacar(gx, gy);
    gx = s.x;
    gy = s.y;
  }
  const origen = choca(ax, ay) ? sacar(ax, ay) : { x: ax, y: ay };
  if (!segmentoChoca(origen.x, origen.y, gx, gy)) return [{ x: gx, y: gy }];
  const nodes = [origen, { x: gx, y: gy }, ...nodosRodeo()];
  const n = nodes.length;
  const dist = new Array<number>(n).fill(Infinity);
  const prev = new Array<number>(n).fill(-1);
  const used = new Array<boolean>(n).fill(false);
  dist[0] = 0;
  for (let k = 0; k < n; k++) {
    let u = -1;
    let best = Infinity;
    for (let i = 0; i < n; i++) {
      if (!used[i] && dist[i]! < best) {
        best = dist[i]!;
        u = i;
      }
    }
    if (u < 0) break;
    used[u] = true;
    if (u === 1) break;
    const a = nodes[u]!;
    for (let v = 0; v < n; v++) {
      if (used[v] || v === u) continue;
      const b = nodes[v]!;
      if (segmentoChoca(a.x, a.y, b.x, b.y)) continue;
      const w = Math.hypot(a.x - b.x, a.y - b.y);
      if (dist[u]! + w < dist[v]!) {
        dist[v] = dist[u]! + w;
        prev[v] = u;
      }
    }
  }
  if (!Number.isFinite(dist[1])) return [{ x: gx, y: gy }];
  const path: { x: number; y: number }[] = [];
  let c = 1;
  while (c >= 0) {
    path.push(nodes[c]!);
    if (c === 0) break;
    c = prev[c]!;
  }
  path.reverse();
  if (path[0] && Math.hypot(path[0].x - origen.x, path[0].y - origen.y) < 0.05) path.shift();
  return path.length ? path : [{ x: gx, y: gy }];
}

/** v19: caminar con física. Velocidad en casillas por segundo real, con arranque y frenada suaves. */
export const MAESTRO_VEL = VEL_MAESTRO; // casillas/s a x1
export const MAESTRO_ACEL = 9; // casillas/s² al arrancar
export const MAESTRO_FRENO = 12; // casillas/s² al frenar
/** Minutos de reloj por casilla caminada: cruzar el solar (≈70 casillas) cuesta menos de 20 minutos. */
export const MIN_POR_CASILLA = 0.26;
/** v23: minutos de juego por segundo real, como mínimo, mientras el maestro camina. */
export const RELOJ_MIN_CAMINANDO = 3;
/** v23: segundos reales del día antes de que entre el piso del reloj caminando. */
export const RELOJ_GRACIA_SEG = 90;

/** v23: el reloj está parado con cualquier panel abierto (Ferretería, Pausa, Libreta…) o en pausa. */
export function relojParado(s: Estado): boolean {
  return !!s.pausa || !!s.panel || s.entregada;
}
/** A x2 el maestro camina un poco más rápido, no el doble. */
export function multPaso(ritmo: number): number {
  return ritmo >= 2 ? 1.3 : 1;
}

function acercar(v: number, meta: number, dt: number): number {
  if (meta > v) return Math.min(meta, v + MAESTRO_ACEL * dt);
  return Math.max(meta, v - MAESTRO_FRENO * dt);
}

/** Mueve al maestro y devuelve las casillas recorridas en este paso. */
function moverMaestro(s: Estado, dt: number, ritmo = 1): number {
  const vmax = MAESTRO_VEL * multPaso(ritmo);
  const v0 = Math.max(0, s.vel || 0);
  const ax0 = s.mando.ax;
  const ay0 = s.mando.ay;
  const len = Math.hypot(ax0, ay0);
  const k = Math.SQRT1_2;
  const x0 = s.jugador.x;
  const y0 = s.jugador.y;
  if (len > 0.08) {
    const nx = ax0 / len;
    const ny = ay0 / len;
    const dx = (nx - ny) * k;
    const dy = (-nx - ny) * k;
    s.yaw = Math.atan2(-nx, ny);
    s.destino = null;
    s.ruta = null;
    s.dirX = dx;
    s.dirY = dy;
    const v = acercar(v0, vmax * Math.min(1, len), dt);
    const p = andar(x0, y0, x0 + dx * v * dt, y0 + dy * v * dt);
    s.jugador.x = clamp(p.x, MAPA.x0, MAPA.x1);
    s.jugador.y = clamp(p.y, MAPA.y0, MAPA.y1);
    const av = Math.hypot(s.jugador.x - x0, s.jugador.y - y0);
    s.vel = av < 1e-5 && v > 0 ? 0 : v;
    return av;
  }
  if (s.destino) {
    const meta = s.destino;
    const ult = s.ruta?.[s.ruta.length - 1];
    if (!s.ruta || !ult || Math.hypot(ult.x - meta.x, ult.y - meta.y) > 0.08) {
      s.ruta = rutaMasCorta(x0, y0, meta.x, meta.y);
    }
    let resta = 0;
    let px = x0;
    let py = y0;
    for (const wp of s.ruta) {
      resta += Math.hypot(wp.x - px, wp.y - py);
      px = wp.x;
      py = wp.y;
    }
    // Frena para llegar justo: v² = 2·freno·distancia.
    const v = acercar(v0, Math.min(vmax, Math.sqrt(2 * MAESTRO_FRENO * resta) + 0.4), dt);
    let queda = v * dt;
    const total = queda;
    let guard = 0;
    while (s.ruta.length && queda > 1e-5 && guard < 8) {
      guard++;
      const wp = s.ruta[0]!;
      const dx0 = wp.x - s.jugador.x;
      const dy0 = wp.y - s.jugador.y;
      const d = Math.hypot(dx0, dy0);
      if (d < 0.05) {
        s.ruta.shift();
        continue;
      }
      const step = Math.min(queda, d);
      const nx = s.jugador.x + (dx0 / d) * step;
      const ny = s.jugador.y + (dy0 / d) * step;
      const p = andar(s.jugador.x, s.jugador.y, nx, ny, wp.x, wp.y);
      const av = Math.hypot(p.x - s.jugador.x, p.y - s.jugador.y);
      s.jugador.x = clamp(p.x, MAPA.x0, MAPA.x1);
      s.jugador.y = clamp(p.y, MAPA.y0, MAPA.y1);
      if (av < 1e-5) {
        if (d < 0.8) s.ruta.shift();
        else break;
        continue;
      }
      queda -= av;
      s.dirX = dx0 / d;
      s.dirY = dy0 / d;
      const ax = (dx0 / d - dy0 / d) / (2 * k);
      const ay = -(dx0 / d + dy0 / d) / (2 * k);
      const l = Math.hypot(ax, ay) || 1;
      s.yaw = Math.atan2(-ax / l, ay / l);
      if (Math.hypot(wp.x - s.jugador.x, wp.y - s.jugador.y) < 0.05) s.ruta.shift();
    }
    const av = Math.hypot(s.jugador.x - x0, s.jugador.y - y0);
    // Sin avance (meta dentro de un muro o un árbol): se queda donde llegó.
    if (!s.ruta.length || (total > 1e-3 && total - queda < 1e-5)) {
      s.destino = null;
      s.ruta = null;
      s.vel = 0;
      return av;
    }
    s.vel = v;
    return av;
  }
  // Sin mando: frena suave en la última dirección.
  if (v0 <= 0) {
    s.vel = 0;
    return 0;
  }
  const v = acercar(v0, 0, dt);
  const dx = s.dirX ?? 0;
  const dy = s.dirY ?? 0;
  const p = andar(x0, y0, x0 + dx * v * dt, y0 + dy * v * dt);
  s.jugador.x = clamp(p.x, MAPA.x0, MAPA.x1);
  s.jugador.y = clamp(p.y, MAPA.y0, MAPA.y1);
  const av = Math.hypot(s.jugador.x - x0, s.jugador.y - y0);
  s.vel = av < 1e-5 ? 0 : v;
  return av;
}

/** Arrastre con el dedo: fija la meta; el paso lo da moverMaestro con la misma física. */
export function seguirDedo(s: Estado, x: number, y: number, soltar: boolean, _alcance = 0) {
  void _alcance;
  s.mando.ax = 0;
  s.mando.ay = 0;
  if (soltar) {
    s.destino = null;
    s.ruta = null;
    return;
  }
  const tx = clamp(x, MAPA.x0, MAPA.x1);
  const ty = clamp(y, MAPA.y0, MAPA.y1);
  if (Math.hypot(tx - s.jugador.x, ty - s.jugador.y) < 0.1) {
    s.destino = null;
    return;
  }
  if (!s.destino || Math.hypot(s.destino.x - tx, s.destino.y - ty) > 0.3) s.destino = { x: tx, y: ty };
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
    const sobra = tierraSobrante(s);
    const origen = sobra > 0.02 ? SITIOS.tierra : ESCOMBRO;
    return (g.faseViaje ?? 0) % 2 === 0 ? { x: origen.x, y: origen.y } : { ...BOTE_TIERRA };
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
    const rest = u * (vias.length - 1);
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
    if (dest && laborDe(s, g) === "tierra" && Math.hypot(g.x - dest.x, g.y - dest.y) < 0.4) {
      g.faseViaje = ((g.faseViaje ?? 0) + 1) % 2;
    }
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

export function desgloseNomina(s: Estado): { jornales: number; herramienta: number; direccion: number; total: number } {
  if (s.nominaPagada) return { jornales: 0, herramienta: 0, direccion: 0, total: 0 };
  let jornales = 0;
  let herramienta = 0;
  for (const g of s.gente) {
    if (!g.activo || g.falto || g.fuera) continue;
    const j = jornalDe(g.oficio, g.rinde);
    jornales += j;
    herramienta += Math.round(j * HERRAMIENTA);
  }
  const direccion = jornales > 0.5 && !s.direccionCobrada && s.firmado && !s.entregada ? DIRECCION_DIA : 0;
  return { jornales, herramienta, direccion, total: jornales + herramienta + direccion };
}

export function nominaPendiente(s: Estado): number {
  return desgloseNomina(s).total;
}

/** Deuda de nómina que arrastra la caja (la de ayer, o la de hoy si ya se pagó corta). Se cobra en la próxima nómina. */
export function deudaPendiente(s: Estado): number {
  const d = s.deudaNomina ?? 0;
  return d > 0.5 ? d : 0;
}

export function textoFaltaNomina(s: Estado): string | null {
  if (!s.firmado || s.entregada || s.nominaPagada || s.minuto >= 15 * 60) return null;
  const falta = nominaPendiente(s) + deudaPendiente(s) - s.caja;
  if (falta <= 0.5) return null;
  return deudaPendiente(s) > 0
    ? `Falta ${peso(falta)} para la nómina de las 3 (incluye ${peso(deudaPendiente(s))} de deuda de ayer)`
    : `Falta ${peso(falta)} para la nómina de las 3`;
}

export function cajaLibre(s: Estado): number {
  return s.caja - nominaPendiente(s) - deudaPendiente(s);
}

export function textoCajaLibre(s: Estado): string {
  const nomina = nominaPendiente(s);
  const deuda = deudaPendiente(s);
  const libre = s.caja - nomina - deuda;
  const partes: string[] = [];
  if (nomina > 0.5) partes.push(`nómina de hoy ${peso(nomina)}`);
  if (deuda > 0.5) partes.push(`deuda de nómina ${peso(deuda)}`);
  if (!partes.length) return `Caja libre ${pesoCaja(libre)}`;
  return `Caja libre ${pesoCaja(libre)} = caja ${pesoCaja(s.caja)} menos ${partes.join(" y ")}`;
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

function tandasRestantes(s: Estado, tipo: "H" | "M"): number {
  let n = 0;
  const def = ETAPAS[s.etapa];
  if (def) {
    for (const t of def.trabajos) {
      if (t.mezcla !== tipo || !t.mezclaQ || t.q <= 0) continue;
      const run = runDe(s, s.etapa, t.id);
      n += t.mezclaQ * Math.max(0, (t.q - run.hecho) / t.q);
    }
  }
  for (const e of s.extras) {
    if (e.etapa !== s.etapa || e.mezcla !== tipo || !e.mezclaQ || e.q <= 0) continue;
    n += e.mezclaQ * Math.max(0, (e.q - e.hecho) / e.q);
  }
  return n;
}

function tandasAPedir(s: Estado, tipo: "H" | "M"): number {
  const falta = tandasRestantes(s, tipo) - stockMezcla(s, tipo) - tandasEnCurso(s, tipo);
  if (falta <= 1e-9) return 0;
  return Math.ceil(falta - 1e-9);
}

function recetaFraccion(s: Estado, idx: number, restante: boolean): Cantidades {
  const need: Cantidades = {};
  const sumar = (tipo: "H" | "M", batches: number) => {
    if (batches <= 1e-8) return;
    for (const [k, n] of Object.entries(receta(tipo)) as [Mat, number][]) need[k] = (need[k] ?? 0) + n * batches;
  };
  const def = ETAPAS[idx];
  if (!def) return need;
  for (const t of def.trabajos) {
    if (!t.mezcla || !t.mezclaQ) continue;
    const frac = restante ? Math.max(0, (t.q - runDe(s, idx, t.id).hecho) / t.q) : 1;
    sumar(t.mezcla, t.mezclaQ * frac);
  }
  if (restante) {
    for (const e of s.extras) {
      if (e.etapa !== idx || !e.mezcla || !e.mezclaQ || e.q <= 0) continue;
      sumar(e.mezcla, e.mezclaQ * Math.max(0, (e.q - e.hecho) / e.q));
    }
  }
  return need;
}

function necesidadActual(s: Estado): Cantidades {
  const ahora = sumaNecesidad(s, s.etapa, true, false);
  const frac = recetaFraccion(s, s.etapa, true);
  for (const [k, n] of Object.entries(frac) as [Mat, number][]) ahora[k] = Math.max(0, (ahora[k] ?? 0) - n);
  for (const tipo of ["H", "M"] as const) {
    const batches = tandasAPedir(s, tipo);
    if (batches <= 0) continue;
    for (const [k, n] of Object.entries(receta(tipo)) as [Mat, number][]) ahora[k] = (ahora[k] ?? 0) + n * batches;
  }
  return ahora;
}

function cuantizarPedido(s: Estado, m: Mat, bruto: number, hay: number, vienen: number): number {
  if (bruto <= 1e-8) return 0;
  const pedido = m === "block" ? bruto * 1.03 : bruto;
  const n = pedido - hay - vienen;
  if (n <= 1e-6) return 0;
  const paso = pasoCompra(m);
  let q = Math.ceil((n - 1e-9) / paso) * paso;
  if (m !== "cemento") {
    const esp = espacio(s, m) + devolvible(s, m) - enCamino(s, m);
    q = Math.min(q, Math.max(0, Math.floor((esp + 1e-9) / paso) * paso));
  }
  if (q <= 1e-6) return 0;
  return Math.round(q * 1000) / 1000;
}

interface RenglonCuenta {
  m: Mat;
  falta: number;
  hay: number;
  vienen: number;
  pido: number;
}

function stockBase(s: Estado): { hay: Cantidades; vienen: Cantidades } {
  const hay: Cantidades = {};
  const vienen: Cantidades = {};
  for (const m of COMPRA) {
    hay[m] = tenido(s, m);
    vienen[m] = enCamino(s, m);
  }
  return { hay, vienen };
}

function renglonesDe(
  s: Estado,
  need: Cantidades,
  hayBase: Cantidades,
  vienenBase: Cantidades,
): { renglones: RenglonCuenta[]; haySobra: Cantidades; vienenSobra: Cantidades } {
  const renglones: RenglonCuenta[] = [];
  const haySobra: Cantidades = { ...hayBase };
  const vienenSobra: Cantidades = { ...vienenBase };
  for (const m of COMPRA) {
    const falta = need[m] ?? 0;
    const hay = hayBase[m] ?? 0;
    const vienen = vienenBase[m] ?? 0;
    const merma = m === "block" ? falta * 1.03 : falta;
    const tomaHay = Math.min(hay, Math.max(0, merma));
    const tomaVienen = Math.min(vienen, Math.max(0, merma - tomaHay));
    haySobra[m] = Math.max(0, hay - tomaHay);
    vienenSobra[m] = Math.max(0, vienen - tomaVienen);
    if (falta <= 1e-8) continue;
    renglones.push({ m, falta, hay, vienen, pido: cuantizarPedido(s, m, falta, hay, vienen) });
  }
  return { renglones, haySobra, vienenSobra };
}

function itemsDe(renglones: RenglonCuenta[]): Cantidades {
  const out: Cantidades = {};
  for (const r of renglones) if (r.pido > 1e-6) out[r.m] = r.pido;
  return out;
}

function fmtCta(n: number): string {
  if (!Number.isFinite(n)) return "0";
  const r = Math.round(n * 10) / 10;
  if (Math.abs(r - Math.round(r)) < 0.05) return String(Math.round(r));
  return r.toFixed(1);
}

function lineasCuenta(renglones: RenglonCuenta[]): string {
  const orden = (m: Mat) => {
    const i = ORDEN_NOTA.indexOf(m);
    return i < 0 ? 50 + COMPRA.indexOf(m) : i;
  };
  return [...renglones]
    .filter((r) => r.pido > 1e-6)
    .sort((a, b) => orden(a.m) - orden(b.m))
    .map((r) => `${nombreCortoMat(r.m)}: hace falta ${fmtCta(r.falta)}, hay ${fmtCta(r.hay)}, vienen ${fmtCta(r.vienen)}, pido ${fmtCta(r.pido)}`)
    .join("\n");
}

function cuerpoNota(s: Estado): { items: Cantidades; siguiente: Cantidades; lineas: string; lineasSig: string } {
  const base = stockBase(s);
  const ahora = renglonesDe(s, necesidadActual(s), base.hay, base.vienen);
  const nxt = renglonesDe(s, sumaNecesidad(s, s.etapa + 1, false), ahora.haySobra, ahora.vienenSobra);
  return { items: itemsDe(ahora.renglones), siguiente: itemsDe(nxt.renglones), lineas: lineasCuenta(ahora.renglones), lineasSig: lineasCuenta(nxt.renglones) };
}

function notaEnDia(s: Estado, cabeza: string): boolean {
  return s.bitacora.some((a) => a.dia === s.dia && a.clase === "nota" && a.texto.includes(cabeza));
}

function fraseCuando(s: Estado, urgente: boolean, llega: { dia: number; minuto: number }): string {
  if (urgente && llega.dia === s.dia) return `llega a las ${horaDe(llega.minuto)}`;
  if (esSabado(s.dia) || llega.dia > s.dia + 1) return "llega el lunes 7:30";
  return "llega mañana 7:30";
}

export function textoLlegada(s: Estado, urgente: boolean): string {
  return fraseCuando(s, urgente, llegadaPedido(s, urgente));
}

export function hojaGuardalmacen(s: Estado, cuando?: string): { todo: boolean; texto: string; siguiente: boolean } {
  const cuerpo = cuerpoNota(s);
  const todo = !cuerpo.lineas && !cuerpo.lineasSig;
  const partes: string[] = [];
  if (cuando) {
    partes.push(`Pedido: ${cuando}.`);
    partes.push(`${textoCajaLibre(s)}.`);
  }
  if (todo) partes.push("Ya está todo en el almacén o en camino.");
  else if (cuerpo.lineas) {
    partes.push("Falta:");
    partes.push(cuerpo.lineas);
  }
  if (cuerpo.lineasSig) {
    partes.push("Para la siguiente etapa (opcional):");
    partes.push(cuerpo.lineasSig);
  }
  return { todo, texto: partes.join("\n"), siguiente: !!cuerpo.lineasSig };
}

export function loQueFalta(s: Estado): Cantidades {
  return cuerpoNota(s).items;
}

/** v19: materiales que la etapa necesita y este pedido no trae (o trae de menos). Para avisar antes de confirmar. */
export function faltaEnPedido(s: Estado, items: Cantidades | undefined): string[] {
  const falta = loQueFalta(s);
  const out: string[] = [];
  for (const [k, n] of Object.entries(falta) as [Mat, number][]) {
    if (!(n > 1e-6)) continue;
    const trae = items?.[k] ?? 0;
    if (trae + 1e-6 < n) out.push(`${MATERIALES[k].nombre} (faltan ${num(n - trae, 2)} ${MATERIALES[k].unidad})`);
  }
  return out;
}

export function loQueFaltaSiguiente(s: Estado): Cantidades {
  return cuerpoNota(s).siguiente;
}

export function marcarLoQueFalta(s: Estado) {
  s.tut.pedido = true;
  chequearTutorial(s);
}

function tieneItems(items: Cantidades): boolean {
  return Object.values(items).some((n) => (n ?? 0) > 0);
}

function debeProponer(s: Estado): boolean {
  return tieneItems(loQueFalta(s));
}

function paradaPorMaterial(s: Estado): boolean {
  if (!s.firmado || s.entregada || s.etapa >= 9) return false;
  if (lluviaAhora(s) || s.plomo || fraguaActiva(s)) return false;
  if (s.minuto >= 15 * 60) return false;
  const pendientes = works(s).filter((w) => w.hecho < w.q - 1e-4 && !w.soloMaestro);
  const siguiente = pendientes.find((w) => prereqOk(s, w)) ?? pendientes[0];
  if (!siguiente) return false;
  const mf = materialFalta(s, siguiente);
  return !!mf && mf.includes("guardalmacén");
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

/** Un camión, un flete. La carga que se sube al que ya viene paga un octavo: el viaje ya está pagado. */
export function fleteDe(s: Estado, urgente: boolean): number {
  const lleno = urgente ? FLETE_URGENTE : FLETE;
  const llega = llegadaPedido(s, urgente);
  const yaViaje = s.pedidos.some((p) => p.dia === llega.dia && p.minuto === llega.minuto && p.urgente === urgente);
  if (!yaViaje) return lleno;
  return Math.round(lleno / 8);
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
    if (m === "cemento") partes.push(`${Math.round(n)} ${Math.round(n) === 1 ? "funda" : "fundas"}`);
    else if (m === "block") partes.push(`${Math.round(n)} block`);
    else if (m === "v38") partes.push(`${Math.round(n)} ${Math.round(n) === 1 ? "varilla" : "varillas"} 3/8`);
    else if (m === "v14") partes.push(`${Math.round(n)} ${Math.round(n) === 1 ? "varilla" : "varillas"} 1/4`);
    else if (m === "arena") partes.push(`${num(n, 1)} m³ de arena`);
    else if (m === "grava") partes.push(`${num(n, 1)} m³ de grava`);
    else partes.push(`${num(n, 0)} ${MATERIALES[m].unidad} de ${MATERIALES[m].nombre}`);
  };
  if (primero) push(primero);
  for (const m of ORDEN_NOTA) push(m);
  for (const m of COMPRA) if (!ORDEN_NOTA.includes(m)) push(m);
  return partes.join("\n");
}

function costoMats(items: Cantidades): number {
  let n = 0;
  for (const [k, q] of Object.entries(items) as [Mat, number][]) n += (q ?? 0) * MATERIALES[k].precio;
  return n;
}

/** Una tanda de cada material y el resto en lo que más pesa, sin pasar `fondo` (caja o caja libre). */
export function pedidoQueCabe(s: Estado, items: Cantidades, urgente: boolean, fondo = cajaLibre(s)): Cantidades {
  const flete = fleteDe(s, urgente);
  let bolsa = fondo - flete;
  const out: Cantidades = {};
  if (bolsa < -0.5) return out;
  const vivos = (Object.keys(items) as Mat[]).filter((m) => (items[m] ?? 0) > 1e-8 && MATERIALES[m].precio > 0);
  const pasoDe = (m: Mat) => {
    const paso = pasoCompra(m);
    const want = items[m] ?? 0;
    const pasos = Math.floor((want + 1e-9) / paso);
    return { paso, precio: MATERIALES[m].precio, max: Math.max(0, pasos) };
  };
  const barato = [...vivos].sort((a, b) => pasoDe(a).precio * pasoDe(a).paso - pasoDe(b).precio * pasoDe(b).paso);
  for (const m of barato) {
    const { paso, precio, max } = pasoDe(m);
    if (max <= 0) continue;
    const unidad = precio * paso;
    if (unidad > bolsa + 0.5) continue;
    out[m] = paso;
    bolsa -= unidad;
  }
  const grueso = [...vivos].sort((a, b) => (items[b] ?? 0) * MATERIALES[b].precio - (items[a] ?? 0) * MATERIALES[a].precio);
  for (const m of grueso) {
    const { paso, precio, max } = pasoDe(m);
    const ya = Math.round(((out[m] ?? 0) + 1e-9) / paso);
    const unidad = precio * paso;
    if (unidad <= 0 || ya >= max) continue;
    const extra = Math.min(max - ya, Math.floor((bolsa + 0.5) / unidad));
    if (extra <= 0) continue;
    out[m] = Math.round((ya + extra) * paso * 1000) / 1000;
    bolsa -= extra * unidad;
  }
  return out;
}

/** `comerNomina` usa la caja entera. Si no, solo lo que sobra después de la nómina de hoy. */
export function pedidoQueAlcanza(s: Estado, items: Cantidades, urgente: boolean, comerNomina: boolean): Cantidades {
  return pedidoQueCabe(s, items, urgente, comerNomina ? s.caja : cajaLibre(s));
}

export const NOTA_FIADO_FERRETERIA = "La caja no alcanza. El guardalmacén te lo fía: toca «Fiado». Sale solo del próximo cobro.";

/** v27: lo que la Ferretería ofrece fiar ahora: el pedido armado (si la caja no lo paga) o, si no hay pedido,
 * lo que falta para esta etapa o para la próxima que compra. null si la caja alcanza o ya no cabe más fiado. */
export function fiadoFerreteria(s: Estado, carrito?: Cantidades, urgente = false): { items: Cantidades; total: number; texto: string } | null {
  const prox = ETAPAS[proximoTramo(s)]?.nombre ?? "la próxima etapa";
  const texto = (total: number) => `Fiado: ${peso(total)}, sale del cobro de ${prox}`;
  if (carrito && tieneItems(carrito)) {
    const c = cuentaFiadoPedido(s, carrito, urgente);
    return c ? { ...c, texto: texto(c.total) } : null;
  }
  const falta = loQueFalta(s);
  if (tieneItems(falta)) {
    const c = cuentaFiadoPedido(s, falta, urgente);
    return c ? { ...c, texto: texto(c.total) } : null;
  }
  const sig = siguienteConCompra(s);
  if (!sig) return null;
  const c = cuentaFiadoPedido(s, sig.items, urgente);
  return c ? { ...c, texto: texto(c.total) } : null;
}

const AVISO_LIBRE_MANANA =
  "No alcanza para la nómina de hoy. Da libre a alguien mañana: abre Cuadrilla y toca Libre mañana.";

export function yaVieneCamion(s: Estado): boolean {
  return s.pedidos.some((p) => Object.values(p.items).some((n) => (n ?? 0) > 1e-6));
}

/** «Lo que falta» neto de lo que ya viene. Si el completo no cabe ni con adelanto, la cantidad que sí entra en la caja libre. */
export function ajusteLoQueFalta(s: Estado): { items: Cantidades; nota: string } {
  const full = loQueFalta(s);
  const viene = yaVieneCamion(s);
  if (!tieneItems(full)) {
    return {
      items: {},
      nota: viene
        ? "Ya viene en el camión. No se vuelve a pedir ni se cobra el flete otra vez."
        : "Por ahora no falta nada.",
    };
  }
  const of = ofertaDe(s, full, false, "Lo que falta");
  if (!of) return { items: {}, nota: viene ? "Ya viene en el camión. No se vuelve a pedir ni se cobra el flete otra vez." : "Por ahora no falta nada." };
  if (of.recorte) {
    if (!tieneItems(of.cabe ?? {})) {
      // v27: con la caja en P$0 «Lo que falta» llena el pedido igual y ofrece el fiado (antes quedaba vacío).
      if (cuentaFiadoPedido(s, full, false)) return { items: { ...full }, nota: NOTA_FIADO_FERRETERIA };
      return { items: {}, nota: AVISO_LIBRE_MANANA };
    }
    let nota = of.comeNomina
      ? "Pedir lo que alcanza. La caja paga esto aunque la nómina quede corta."
      : "No cabe el pedido completo. Esto entra sin tocar la nómina de hoy.";
    if (viene) nota += " Lo que ya viene no se vuelve a pedir ni se cobra el flete otra vez.";
    return { items: { ...of.cabe }, nota };
  }
  let nota = "Pedido lleno con lo que falta de esta etapa. La siguiente, si la hay, va aparte.";
  if (viene) nota += " Lo que ya viene no se vuelve a pedir ni se cobra el flete otra vez.";
  return { items: of.items, nota };
}

function ofertaDe(s: Estado, itemsIn: Cantidades, urgente: boolean, cabeza: string): OfertaSita | null {
  const cubierto = loQueFalta(s);
  const items: Cantidades = {};
  for (const [k, n] of Object.entries(itemsIn) as [Mat, number][]) {
    const q = Math.min(n ?? 0, cubierto[k] ?? 0);
    if (q > 1e-6) items[k] = q;
  }
  if (!tieneItems(items)) return null;
  const flete = fleteDe(s, urgente);
  const mats = costoMats(items);
  const total = mats + flete;
  const llega = llegadaPedido(s, urgente, s.minuto + 1);
  const cuando = fraseCuando(s, urgente, llega);
  const modo = urgente ? "Urgente" : "Normal";
  const cuerpo = cuerpoNota(s);
  const cuenta = cuentaPedido(s, total);
  if (cuenta.alcanza) {
    let texto = `${cabeza}:\n${cuerpo.lineas}`;
    if (cuerpo.lineasSig) texto += `\nPara la siguiente etapa (opcional):\n${cuerpo.lineasSig}`;
    texto += `\n¿Pido? ${modo} ${peso(total)}, ${cuando}`;
    if (cuenta.nomina > 0.5 || cuenta.usaAdelanto) {
      texto += ` ${textoCajaLibre(s)}.`;
      if (cuenta.usaAdelanto) texto += ` Usa el adelanto de Doña Carmen: ${peso(cuenta.adelanto)}. En esta obra no habrá otro.`;
    }
    const siguiente = tieneItems(cuerpo.siguiente) ? cuerpo.siguiente : undefined;
    return { items, urgente, mats, flete, total, texto, siguiente };
  }
  const faltaDe = (costo: number) => faltaNominaTras(s, costo);
  if (s.caja + 0.5 >= total) {
    const falta = faltaDe(total);
    let texto = `${cabeza}:\n${cuerpo.lineas}`;
    if (cuerpo.lineasSig) texto += `\nPara la siguiente etapa (opcional):\n${cuerpo.lineasSig}`;
    texto += `\nPedir lo que alcanza: ${modo} ${peso(total)}, ${cuando}. La caja paga el pedido. La nómina quedará corta por ${peso(falta)}.`;
    const siguiente = tieneItems(cuerpo.siguiente) ? cuerpo.siguiente : undefined;
    return { items, urgente, mats, flete, total, texto, siguiente, comeNomina: true };
  }
  const corto = pedidoQueCabe(s, items, urgente, s.caja);
  const matsCorto = costoMats(corto);
  const totalCorto = matsCorto + flete;
  const falta = faltaDe(totalCorto);
  const aviso = tieneItems(corto)
    ? `${cabeza}:\n${textoLista(corto, matQueFrena(s))}\nPedir lo que alcanza: ${modo} ${peso(totalCorto)}, ${cuando}. La nómina quedará corta por ${peso(falta)}.`
    : `${AVISO_LIBRE_MANANA} ${textoCajaLibre(s)}. ${modo}, ${cuando}.${cuerpo.lineas ? `\n${cabeza}:\n${cuerpo.lineas}` : ""}`;
  return {
    items: { ...corto },
    urgente,
    mats: matsCorto,
    flete,
    total: tieneItems(corto) ? totalCorto : 0,
    texto: aviso,
    recorte: true,
    cabe: { ...corto },
    comeNomina: tieneItems(corto),
  };
}

function ofrecerSita(s: Estado, items: Cantidades, urgente: boolean) {
  const cabeza = urgente ? "Para hoy faltan" : "Para mañana faltan";
  const of = ofertaDe(s, items, urgente, cabeza);
  if (!of) return;
  s.sita.oferta = of;
  s.sita.ultima = { ...of, items: { ...of.items }, siguiente: of.siguiente ? { ...of.siguiente } : undefined };
  s.sita.editando = false;
  if (s.sita.fase === "casa") {
    const p = puertaAlmacen();
    s.sita.x = p.x;
    s.sita.y = p.y;
  }
  s.sita.fase = "yendo";
  if (!notaEnDia(s, cabeza)) apunte(s, "nota", of.texto, "almacén");
  if (of.recorte && tieneItems(of.cabe ?? {}))
    diario(s, `El guardalmacén deja lo que la caja alcanza: ${peso(costoMats(of.cabe ?? {}) + of.flete)}.`);
  else if (of.recorte) diario(s, "El guardalmacén no pide: la caja no cubre ni el flete.");
  else if (of.comeNomina) diario(s, `El guardalmacén ofrece lo que la caja paga, ${peso(of.total)}, aunque la nómina quede corta.`);
  else diario(s, `El guardalmacén propone un pedido ${urgente ? "urgente" : "normal"} de ${peso(of.total)}.`);
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
  if (!of) return "El guardalmacén no tiene nada que pedir.";
  const ahora = loQueFalta(s);
  const fuente = of.recorte ? (of.cabe ?? {}) : of.items;
  const items: Cantidades = {};
  for (const [k, n] of Object.entries(fuente) as [Mat, number][]) {
    const q = Math.min(n ?? 0, ahora[k] ?? 0);
    if (q > 1e-6) items[k] = q;
  }
  const siguiente = !of.recorte && of.siguiente && tieneItems(of.siguiente) ? { ...of.siguiente } : undefined;
  if (!tieneItems(items)) {
    if (of.recorte) return AVISO_LIBRE_MANANA;
    if (siguiente) return "Eso ya está pedido. La siguiente etapa sigue aparte.";
    if (s.sita) s.sita.ultima = null;
    cerrarOfertaSita(s);
    return "Ya está todo en el almacén o en camino";
  }
  const mats = Object.entries(items).reduce((a, [k, n]) => a + (n ?? 0) * MATERIALES[k as Mat].precio, 0);
  const total = mats + of.flete;
  of.items = items;
  of.mats = mats;
  of.total = total;
  const mantener = !!siguiente;
  const err = pedir(s, items, of.urgente, mantener);
  if (!err) {
    const cuando = textoLlegada(s, of.urgente);
    const hoja = hojaGuardalmacen(s, cuando);
    if (mantener && s.sita?.oferta) {
      s.sita.oferta.items = {};
      s.sita.oferta.mats = 0;
      s.sita.oferta.total = 0;
      s.sita.oferta.texto = hoja.texto;
      s.sita.oferta.hecho = true;
      s.sita.oferta.siguiente = siguiente;
      s.sita.fase = "nota";
    }
    s.tut.pedido = true;
    s.tut.sita = true;
    s.sita.ultima = null;
    chequearTutorial(s);
    return null;
  }
  if (/nómina|caja libre/.test(err)) return err;
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
  if (!s.sita || s.sita.fase === "casa") {
    if (s.firmado && !s.entregada && !s.tut.fin && pasoTutorial(s) === 3) return puertaAlmacen();
    return { x: SITIOS.oficina.x - 0.35, y: SITIOS.oficina.y + 0.72 };
  }
  return { x: s.sita.x, y: s.sita.y };
}

function ofrecerManual(s: Estado, items: Cantidades, urgente: boolean) {
  const of = ofertaDe(s, items, urgente, "Lo que falta");
  if (!of) return;
  s.sita.oferta = of;
  s.sita.ultima = { ...of, items: { ...of.items }, siguiente: of.siguiente ? { ...of.siguiente } : undefined };
  s.sita.editando = false;
}

/** v27: la primera etapa después de la actual a la que todavía le falta comprar algo. Salta las que no compran
 * (Excavación) y las que ya tienen todo en el almacén o en camino. */
export function siguienteConCompra(s: Estado): { idx: number; items: Cantidades; lineas: string } | null {
  const base = stockBase(s);
  const ahora = renglonesDe(s, necesidadActual(s), base.hay, base.vienen);
  let hay = ahora.haySobra;
  let vienen = ahora.vienenSobra;
  for (let i = s.etapa + 1; i < ETAPAS.length; i++) {
    const r = renglonesDe(s, sumaNecesidad(s, i, false), hay, vienen);
    const items = itemsDe(r.renglones);
    if (tieneItems(items)) return { idx: i, items, lineas: lineasCuenta(r.renglones) };
    hay = r.haySobra;
    vienen = r.vienenSobra;
  }
  return null;
}

/** La etapa actual no compra nada, pero otra más adelante sí: el guardalmacén deja pedirla de una vez.
 * v27: también cuando la etapa que sigue ya está cubierta (busca la próxima que compra) y aunque la caja no alcance
 * (entonces la hoja lo dice y el pedido se puede fiar). */
export function ofertaSiguiente(s: Estado, urgente = false): OfertaSita | null {
  const cuerpo = cuerpoNota(s);
  if (tieneItems(cuerpo.items)) return null;
  const prox = siguienteConCompra(s);
  if (!prox) return null;
  const sig = { ...prox.items };
  const flete = fleteDe(s, urgente);
  const mats = costoMats(sig);
  const total = mats + flete;
  const cuando = fraseCuando(s, urgente, llegadaPedido(s, urgente, s.minuto + 1));
  const estaCompra = pideCompra(sumaNecesidad(s, s.etapa, true));
  let texto = estaCompra ? "Lo de esta etapa ya está en el almacén o en camino." : "Esta etapa no necesita material.";
  texto += prox.idx === s.etapa + 1 ? `\nPara la siguiente etapa:\n${prox.lineas}` : `\nPara ${ETAPAS[prox.idx]!.nombre} (la próxima que compra):\n${prox.lineas}`;
  texto += `\n¿Pido la siguiente? ${urgente ? "Urgente" : "Normal"} ${peso(total)}, ${cuando}.`;
  const cuenta = cuentaPedido(s, total);
  if (!cuenta.alcanza) {
    texto += ` ${textoCajaLibre(s)}.`;
    if (cuentaFiadoPedido(s, sig, urgente)) texto += " Si la caja no alcanza, te lo fío: sale del próximo cobro.";
  }
  return { items: {}, urgente, mats: 0, flete, total: 0, texto, siguiente: sig };
}

export function hablarSita(s: Estado) {
  if (!s.firmado || !s.sita || s.entregada) return;
  const items = loQueFalta(s);
  if (tieneItems(items)) ofrecerManual(s, items, false);
  else {
    const sig = ofertaSiguiente(s);
    s.sita.oferta = sig;
    s.sita.ultima = sig ? { ...sig, items: {}, siguiente: { ...sig.siguiente } } : null;
    s.sita.editando = false;
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

export function pedir(s: Estado, items: Cantidades, urgente: boolean, mantener = false): string | null {
  const limpio: Cantidades = {};
  let avisosTope = false;
  for (const [k, n] of Object.entries(items) as [Mat, number][]) {
    if (!n || n <= 0 || !MATERIALES[k]?.compra || k === "kit") continue;
    const paso = pasoCompra(k);
    let q = Math.ceil((n - 1e-9) / paso) * paso;
    if (k !== "cemento") {
      const esp = espacio(s, k) + devolvible(s, k) - enCamino(s, k);
      const cabe = Math.max(0, Math.floor((esp + 1e-9) / paso) * paso);
      if (q > cabe + 1e-6) avisosTope = true;
      q = Math.min(q, cabe);
    }
    if (q > 0) limpio[k] = Math.round(q * 1000) / 1000;
  }
  const mats = Object.entries(limpio).reduce((a, [k, n]) => a + (n ?? 0) * MATERIALES[k as Mat].precio, 0);
  if (mats <= 0) return avisosTope ? "El tope del almacén no deja pedir eso." : "No hay nada que pedir.";
  if (urgente && s.minuto >= 12 * 60) return "Lo urgente solo corre antes de las 12.";
  const llega = llegadaPedido(s, urgente);
  const flete = fleteDe(s, urgente);
  const total = mats + flete;
  if (total > s.caja + 0.5) return `No alcanza la caja. Tienes ${pesoCaja(s.caja)} y el pedido es ${peso(total)}.`;
  const cementoNuevo = limpio.cemento ?? 0;
  if (cementoNuevo > 0) {
    const bajoTecho = s.inv.cemento.q;
    const ya = (s.entrada.cemento?.q ?? 0) + enCamino(s, "cemento");
    const afuera = Math.max(0, bajoTecho + ya + cementoNuevo - 20);
    if (afuera >= 1) aviso(s, `${num(afuera, 0)} fundas van a quedar afuera del techo.`);
  }
  for (const [k, q] of Object.entries(limpio) as [Mat, number][]) {
    const hueco = espacio(s, k) - enCamino(s, k);
    if (k !== "cemento" && q > hueco + 1e-6) devolverPara(s, k, q - hueco);
  }
  s.caja -= total;
  s.costos.fletes.mat += flete;
  if (flete > 0) s.stats.fletes += 1;
  s.pedidos.push({
    id: "ped" + ++s.idSeq,
    items: limpio,
    dia: llega.dia,
    minuto: llega.minuto,
    flete,
    urgente,
  });
  diario(s, `Pedido al guardalmacén: −${peso(total)} (${flete < (urgente ? FLETE_URGENTE : FLETE) ? "va en el camión que ya viene" : urgente ? "urgente" : "flete normal"}).`);
  const cuando = fraseCuando(s, urgente, llega);
  const normalManana = !urgente && cuando === "llega mañana 7:30";
  const conBlock = (limpio.block ?? 0) > 0;
  const avisoLlega = urgente && llega.dia === s.dia
    ? "El camión sale ya. Llega en 3 horas."
    : normalManana && conBlock
      ? "Llega mañana 7:30. El block empieza cuando llegue."
      : `Pedido hecho. ${cuando.charAt(0).toUpperCase()}${cuando.slice(1)}.`;
  aviso(s, avisoLlega);
  if (avisosTope) aviso(s, "Parte del pedido se recortó por el tope del almacén.");
  if (!mantener) {
    if (s.panel === "sita" && s.sita) {
      const hoja = hojaGuardalmacen(s, cuando);
      const sig = hoja.siguiente ? loQueFaltaSiguiente(s) : undefined;
      s.sita.oferta = {
        items: {},
        urgente,
        mats: 0,
        flete: 0,
        total: 0,
        texto: hoja.texto,
        siguiente: sig && tieneItems(sig) ? sig : undefined,
        hecho: true,
      };
      s.sita.ultima = null;
      s.sita.editando = false;
      s.sita.fase = "nota";
    } else {
      if (s.sita) s.sita.ultima = null;
      cerrarOfertaSita(s);
    }
  }
  return null;
}

export function pedirTambien(s: Estado): string | null {
  const of = s.sita?.oferta;
  const sig = of?.siguiente;
  if (!of || !sig || !tieneItems(sig)) return "La etapa siguiente no pide material.";
  const quedaMain = tieneItems(of.items);
  const err = pedir(s, sig, !!of.urgente, quedaMain);
  if (!err && quedaMain && s.sita?.oferta) s.sita.oferta.siguiente = undefined;
  else if (!err && s.sita?.oferta) {
    // Solo se pidió la siguiente: la hoja queda como pedida, sin botón para repetir el pedido.
    const hoja = hojaGuardalmacen(s, textoLlegada(s, !!of.urgente));
    s.sita.oferta.siguiente = undefined;
    s.sita.oferta.hecho = true;
    s.sita.oferta.texto = hoja.texto;
    s.sita.ultima = null;
  }
  return err;
}

export function contratar(s: Estado, id: string): string | null {
  if (s.gente.length + s.reserva.length >= MAX_CUADRILLA) return "Ya son 8. No cabe nadie más.";
  const p = s.candidatos.find((c) => c.id === id);
  if (!p) return "Esa persona ya no está en la oficina.";
  if (s.gente.some((g) => g.id === id) || s.reserva.some((g) => g.id === id)) return null;
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
  // v22: si ya aprendiste a dar puestos, el nuevo entra a la tarea de la obra (sin quedar «Sin puesto»).
  // v23: todo contratado va solo a la obra (antes, sin el tutorial de puestos, quedaba «Sin tarea»).
  p.puesto = "obra";
  p.cansancio = 0;
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

/** v27: lo que cuesta despedir a alguien ahora (el día completo y la herramienta, si hoy vino y aún no se pagó la
 * nómina), para mostrarlo y pedir confirmación antes. */
export function costoDespedir(s: Estado, id: string): { total: number; jornal: number; herramienta: number; texto: string; ultimo: boolean } | null {
  const g = s.gente.find((x) => x.id === id) ?? s.reserva.find((x) => x.id === id);
  if (!g) return null;
  const ultimo = s.gente.length + s.reserva.length === 1;
  const cobra = s.gente.includes(g) && g.activo && !g.falto && !s.nominaPagada;
  const jornal = cobra ? jornalDe(g.oficio, g.rinde) : 0;
  const herramienta = cobra ? Math.round(jornal * HERRAMIENTA) : 0;
  const total = jornal + herramienta;
  let texto = total > 0
    ? `Despedir a ${g.nombre} cuesta ${peso(total)}: el día completo (${peso(jornal)}) y la herramienta (${peso(herramienta)}).`
    : `Despedir a ${g.nombre} no cuesta nada: hoy no cobra.`;
  if (total > 0 && s.caja < total - 0.5) texto += ` La caja tiene ${pesoCaja(s.caja)}: lo que falte queda como deuda de nómina.`;
  if (ultimo) texto += " Es el último de la cuadrilla: sin nadie, la obra se pierde.";
  return { total, jornal, herramienta, texto, ultimo };
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
      const herr = Math.round(j * HERRAMIENTA);
      // v27: la caja no baja de P$0; lo que no alcanza queda como deuda de nómina (se paga con la nómina de mañana).
      const paga = Math.min(Math.max(0, s.caja), j + herr);
      s.caja -= paga;
      const resta = j + herr - paga;
      if (resta > 0.5) s.deudaNomina = (s.deudaNomina ?? 0) + resta;
      s.costos.herramienta.mo += herr;
      aviso(s, resta > 0.5
        ? `Despediste a ${g.nombre}. Le pagaste ${peso(paga)} de ${peso(j + herr)} (día y herramienta). Quedan ${peso(resta)} de deuda de nómina.`
        : `Despediste a ${g.nombre}. Le pagaste el día (${peso(j)}) y la herramienta (${peso(herr)}).`);
      diario(s, `Despediste a ${g.nombre} ${g.apellido}: −${peso(paga)}${resta > 0.5 ? ` (debes ${peso(resta)})` : ""}.`);
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
  return COMPRA.some((m) => (need[m] ?? 0) > 1e-6);
}

export function obraParada(s: Estado): boolean {
  return s.dia - (s.selloDia ?? 1) > 18;
}

export function diasSinSello(s: Estado): number {
  return Math.max(0, s.dia - (s.selloDia || 1));
}

export function textoDiasSinSello(s: Estado): string {
  return `Días sin sello: ${diasSinSello(s)} de 18. A los 18, Doña Carmen no adelanta.`;
}

export function topeAvance(s: Estado): number {
  const precio = precioDe(s);
  let suma = 0.3;
  const hasta = Math.min(ETAPAS.length - 1, (s.etapa ?? 0) + 1);
  for (let i = 0; i <= hasta; i++) suma += ETAPAS[i]!.tramo;
  return Math.max(0, Math.round(precio * Math.min(1, suma) - s.cobrado));
}

function montoAdelanto(s: Estado): number {
  if (obraParada(s)) return 0;
  const monto = Math.round(Math.min(20000, topeAvance(s)));
  return monto >= 100 ? monto : 0;
}

/** Doña Carmen adelanta una sola vez por obra (el adelanto o la mitad de la etapa, no los dos). */
export function adelantoUsado(s: Estado): boolean {
  return (s.adelantoDia ?? 0) > 0 || !!s.rescateUsado;
}

export function puedeAdelantar(s: Estado, pedido = 0): boolean {
  if (obraParada(s)) return false;
  if (adelantoUsado(s)) return false;
  if (cajaLibre(s) - Math.max(0, pedido) >= 5000) return false;
  return montoAdelanto(s) >= 100;
}

export function textoTopeAdelanto(s: Estado): string {
  const dias = textoDiasSinSello(s);
  if (obraParada(s)) return `Doña Carmen no adelanta con la obra parada: sella una etapa. ${dias}`;
  if (montoAdelanto(s) < 100) return `Ya adelantó todo lo avanzado. Avanza la etapa para que suelte más. ${dias}`;
  return `Doña Carmen adelanta hasta ${peso(montoAdelanto(s))} una vez por obra, a cuenta de lo avanzado (${peso(topeAvance(s))}). ${dias}`;
}

export function razonAdelanto(s: Estado): string {
  if (obraParada(s)) return "Doña Carmen no adelanta con la obra parada: sella una etapa.";
  if (adelantoUsado(s)) return "Doña Carmen ya soltó el adelanto de esta obra.";
  if (cajaLibre(s) >= 5000) return "Todavía tienes más de P$5,000 libres. Doña Carmen no suelta más.";
  if (precioDe(s) - s.cobrado <= 1) return "Ya no queda nada por cobrar.";
  if (montoAdelanto(s) < 100) return "Ya adelantó todo lo avanzado. Avanza la etapa para que suelte más.";
  return "";
}

export interface CuentaPedido {
  caja: number;
  pedido: number;
  jornales: number;
  herramienta: number;
  direccion: number;
  nomina: number;
  /** Deuda de nómina de ayer, que también sale a las 3. */
  deuda: number;
  adelanto: number;
  usaAdelanto: boolean;
  libre: number;
  alcanza: boolean;
  /** La caja, sin mirar la nómina, cubre el pedido. */
  pagaCaja: boolean;
  /** Cuánto faltará de la nómina si se paga el pedido con la caja de ahora. */
  faltaNomina: number;
}

/** v20: cuánto faltará para la nómina (hoy + deuda) si la caja paga este gasto. La usan todas las pantallas. */
export function faltaNominaTras(s: Estado, gasto: number): number {
  return Math.max(0, desgloseNomina(s).total + deudaPendiente(s) - (s.caja - gasto));
}

export function cuentaPedido(s: Estado, total: number): CuentaPedido {
  const d = desgloseNomina(s);
  const deuda = deudaPendiente(s);
  const base = s.caja - total - d.total - deuda;
  let adelanto = 0;
  let usa = false;
  if (base < -0.5 && puedeAdelantar(s, total)) {
    const m = montoAdelanto(s);
    if (base + m >= -0.5) {
      usa = true;
      adelanto = m;
    }
  }
  const libre = base + adelanto;
  return {
    caja: s.caja,
    pedido: total,
    jornales: d.jornales,
    herramienta: d.herramienta,
    direccion: d.direccion,
    nomina: d.total,
    deuda,
    adelanto,
    usaAdelanto: usa,
    libre,
    alcanza: libre >= -0.5,
    pagaCaja: s.caja + 0.5 >= total,
    faltaNomina: faltaNominaTras(s, total),
  };
}

export function abrirDespacho(s: Estado) {
  if (!s.firmado || s.entregada) return;
  if (s.minuto >= 15 * 60 || s.nominaPagada) {
    terminarJornada(s);
    return;
  }
  s.panel = "despacho";
}

export function confirmarDespacho(s: Estado) {
  if (s.panel === "despacho") s.panel = null;
  terminarJornada(s);
}

export function seguirJornada(s: Estado) {
  if (s.panel === "despacho") s.panel = null;
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

function montoRescate(s: Estado): number {
  const et = ETAPAS[s.etapa];
  if (!et || et.tramo <= 0) return 0;
  const monto = Math.round(precioDe(s) * et.tramo * 0.5);
  return monto >= 100 ? monto : 0;
}

/** Una vez por obra, si no se puede sellar ni cobrar el adelanto de siempre. */
export function puedeRescate(s: Estado): boolean {
  if (s.rescateUsado || s.entregada || !s.firmado) return false;
  if (etapaCompleta(s) || s.sello) return false;
  if (puedeAdelantar(s)) return false;
  if ((s.adelantoDia ?? 0) > 0) return false;
  if (cajaLibre(s) >= 5000) return false;
  const sinAdelanto = obraParada(s) || montoAdelanto(s) < 100 || precioDe(s) - s.cobrado <= 1;
  if (!sinAdelanto) return false;
  return montoRescate(s) >= 100;
}

export function fraseRescate(s: Estado): string {
  const nombre = ETAPAS[s.etapa]?.nombre ?? "esta etapa";
  return `Doña Carmen suelta ${peso(montoRescate(s))}, la mitad de ${nombre}, y lo descuenta de la entrega.`;
}

export function aceptarRescate(s: Estado): string | null {
  if (!puedeRescate(s)) return "Doña Carmen no tiene ese adelanto.";
  const monto = montoRescate(s);
  s.caja += monto;
  s.cobrado += monto;
  s.adelanto += monto;
  s.rescateUsado = true;
  s.adelantoDia = Math.max(1, s.dia);
  const frase = fraseRescate(s);
  diario(s, frase);
  aviso(s, frase);
  return null;
}

export function adelantar(s: Estado, pedido = 0): string | null {
  if (!puedeAdelantar(s, pedido)) {
    if (obraParada(s)) return "Doña Carmen no adelanta con la obra parada: sella una etapa.";
    if (cajaLibre(s) - Math.max(0, pedido) >= 5000)
      return "Todavía tienes más de P$5,000 libres. Doña Carmen no suelta más.";
    if ((s.adelantoDia ?? 0) > 0) return "Doña Carmen ya soltó el adelanto de esta obra.";
    if (precioDe(s) - s.cobrado <= 1) return "Ya no queda nada por cobrar.";
    return "Ya adelantó todo lo avanzado. Avanza la etapa para que suelte más.";
  }
  const monto = montoAdelanto(s);
  s.caja += monto;
  s.cobrado += monto;
  s.adelanto += monto;
  s.adelantoDia = Math.max(1, s.dia);
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
  if (s.descanso) {
    s.descanso = false;
  } else {
    lavarMezclas(s, "La noche se llevó la mezcla.");
    for (const g of s.gente) {
      if (g.cansancio >= 85) {
        g.noViene = true;
        g.cansancio = 20;
      } else g.cansancio = Math.max(0, g.cansancio - 40);
    }
    if (esDomingo(s.dia + 1)) {
      const domingo = s.dia + 1;
      const regado = s.regadoHoy;
      let texto = "Domingo: descanso.";
      if (s.curando) {
        if (regado && s.curadoDias.length < CURADO_DIAS && !s.curadoDias.includes(domingo)) {
          s.curadoDias.push(domingo);
          texto = "Domingo: descanso. La viga quedó regada el sábado y el curado contó.";
        } else if (!regado) texto = "Domingo: descanso. La viga no se regó el sábado: el domingo no cuenta para el curado.";
        else texto = "Domingo: descanso. La viga quedó regada el sábado y el curado contó.";
      }
      for (const g of s.gente) {
        g.cansancio = 0;
        g.noViene = false;
      }
      s.dia = domingo;
      s.minuto = 7 * 60;
      s.descanso = true;
      s.panel = "finde";
      diario(s, texto);
      aviso(s, `${texto} Toca para seguir el lunes.`);
      return;
    }
  }
  const dia = s.dia + 1;
  s.dia = dia;
  s.minuto = 7 * 60;
  s.frac = 0;
  s.realHoy = 0;
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
  s.aguaDia = 0;
  s.salidaMin = -1;
  s.nominaHoy = 0;
  s.perdidasHoy = [];
  for (const p of s.reserva) s.gente.push(p);
  s.reserva = [];
  for (const g of s.gente) {
    const libre = g.libre;
    g.libre = false;
    g.fuera = false;
    g.moHoy = 0;
    g.sinTareaHoy = 0;
    g.aviso70 = false;
    g.activo = true;
    g.falto = false;
    g.trabajando = false;
    g.esperaZona = 0;
    g.enCruce = false;
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
  const plazo = textoPlazoAdelanto(s);
  if (plazo) {
    diario(s, plazo);
    aviso(s, plazo);
  }
  const caja = textoDiasCaja(s);
  if (caja) {
    diario(s, caja);
    aviso(s, caja);
  }
  if (s.gente.length + s.reserva.length === 0) perderObra(s);
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

function juntoAZanja(s: Estado): boolean {
  if (distAlSolar(s.jugador.x, s.jugador.y) <= 1.5) return true;
  return dist(s.jugador, SITIOS.obra) <= RADIO;
}

function juntoAlMuro(s: Estado): boolean {
  if (distAlSolar(s.jugador.x, s.jugador.y) <= 1.5) return true;
  return dist(s.jugador, SITIOS.obra) <= 1.5;
}

function distCaja(x: number, y: number, c: { x0: number; y0: number; x1: number; y1: number }): number {
  const dx = Math.max(c.x0 - x, 0, x - c.x1);
  const dy = Math.max(c.y0 - y, 0, y - c.y1);
  return Math.hypot(dx, dy);
}

function distFerreteria(x: number, y: number): number {
  const caja = {
    x0: SITIOS.ferreteria.x - 4.1 / 2,
    y0: SITIOS.ferreteria.y - 2.5 / 2,
    x1: SITIOS.ferreteria.x + 4.1 / 2,
    y1: SITIOS.ferreteria.y + 2.5 / 2,
  };
  const d = distCaja(x, y, caja);
  return d <= 1 ? d : 99;
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
    { ...SITIOS.ferreteria, d: distFerreteria(s.jugador.x, s.jugador.y) },
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
  if (s.curando && !s.regadoHoy && s.curadoDias.length < CURADO_DIAS && !fraguaActiva(s)) return s.inv.agua.q >= 0.1 - 1e-6;
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
  s.gritos.push({ texto: "El maestro lo dijo", x: SITIOS.obra.x, y: SITIOS.obra.y });
  if (s.gritos.length > 6) s.gritos.splice(0, s.gritos.length - 6);
}

/** El 25 % de lo que el oficio acaba de rendir en ESA tarea. Otra tarea no lo borra, y pegar no lo sube. */
function anotarRindeGolpe(s: Estado, g: Persona, w: W, producido: number) {
  if (producido <= 0 || !oficioDelGolpe(g, w)) return;
  const clave = claveGolpe(s, w);
  s.golpeBanco[clave] = (s.golpeBanco[clave] ?? 0) + producido * 0.25;
}

function oficioDelGolpe(g: Persona, w: W): boolean {
  const lid = TAREAS[w.k].lider;
  if (lid) return lid.includes(g.oficio);
  return puedeTarea(g.oficio, w.k);
}

function claveGolpe(s: Estado, w: W): string {
  return `${s.etapa}:${w.id}`;
}

function hayOficioTrabajando(s: Estado, w: W): boolean {
  const lid = TAREAS[w.k].lider;
  for (const g of s.gente) {
    if (!g.activo || g.fuera || g.falto || !g.trabajando || g.puesto !== "obra") continue;
    if (!puedeTarea(g.oficio, w.k)) continue;
    if (lid && !lid.includes(g.oficio)) continue;
    const suya = elegir(s, g);
    if (suya && suya.id === w.id) return true;
  }
  return false;
}

/** Como máximo el 25 % ya rendido por el oficio en esta tarea. Pegar más seguido no agranda el tope. */
function tomarGolpe(s: Estado, w: W, b: number): number {
  if (!hayOficioTrabajando(s, w)) return 0;
  const tope = Math.max(0, s.golpeBanco[claveGolpe(s, w)] ?? 0);
  return Math.min(TAREAS[w.k].golpe * b, tope);
}

function gastarGolpe(s: Estado, w: W, got: number) {
  if (got <= 0) return;
  const clave = claveGolpe(s, w);
  s.golpeBanco[clave] = Math.max(0, (s.golpeBanco[clave] ?? 0) - got);
}

function sanearBanco(v: unknown): Record<string, number> {
  if (!v || typeof v !== "object") return {};
  const out: Record<string, number> = {};
  for (const [k, n] of Object.entries(v as Record<string, unknown>)) {
    if (typeof n === "number" && Number.isFinite(n) && n > 0) out[k] = n;
  }
  return out;
}

function golpeMaestro(s: Estado) {
  const f = golpeObra(s, 1, false);
  if (!f) return;
  const vacio = /^(Nada que hacer|Falta material|Sin mezcla|Falta líder|Fragua|Falta agua|Curado|Nadie trabajando|Van a su ritmo)$/;
  if (vacio.test(f.texto)) return;
  anotarGolpeMaestro(s);
}

function pulsoGolpeMaestro(s: Estado) {
  if (!s.firmado || s.entregada || s.minuto >= 15 * 60 || s.panel || s.pausa) return;
  s.sinGolpe = (s.sinGolpe ?? 0) + 1;
  if (s.sinGolpe < 15) return;
  if (distAlSolar(s.jugador.x, s.jugador.y) > 3) return;
  if (lluviaAhora(s)) return;
  if (!hayPuestoUtil(s)) return;
  s.sinGolpe = 0;
  if (!obraListaParaGolpe(s)) return;
  golpeMaestro(s);
}

export function golpe(s: Estado, alCompas: boolean): Flotante | null {
  if (s.entregada || s.panel || s.pausa) return null;
  const q = queHaceEspacio(s);
  if (!s.firmado) {
    if (q.hacer === "firma") {
      abrirPanel(s, "contrato");
      return null;
    }
    return flot("Doña Carmen está en la oficina", s.jugador.x, s.jugador.y, false);
  }
  if (q.hacer === "zanja" || q.hacer === "muro") return flot(q.verbo, s.jugador.x, s.jugador.y, false);
  if (q.hacer === "sita") {
    hablarSita(s);
    return null;
  }
  const sitio = cercano(s);
  if (q.hacer === "nada") return flot(q.detalle || "Nada cerca", s.jugador.x, s.jugador.y, false);
  s.stats.golpes += 1;
  if (alCompas) s.stats.compas += 1;
  const b = alCompas ? 1.25 : 1;
  const { x, y } = s.jugador;
  if (q.hacer === "oficina") {
    s.oficinaTab = "gente";
    abrirPanel(s, "oficina");
    return null;
  }
  if (q.hacer === "ferreteria") {
    abrirPanel(s, "ferreteria");
    return null;
  }
  if (sitio?.id === "sombra") return flot("Sombra", x, y, false);
  if (sitio && (sitio.id === "tanque" || sitio.id === "toma" || sitio.id === "monton" || sitio.id === "entrada"))
    return flot(sitio.nombre, x, y, false);
  if (q.hacer === "batea") {
    s.sinGolpe = 0;
    return golpeBatea(s, b, alCompas);
  }
  if (q.hacer === "obra") {
    s.sinGolpe = 0;
    const f = golpeObra(s, b, alCompas);
    if (f) return f;
    return flot("Nada que hacer", x, y, false);
  }
  return flot("Nada cerca", x, y, false);
}

function golpeBatea(s: Estado, b: number, oro: boolean): Flotante {
  const { x, y } = s.jugador;
  let curso = s.mezclas.find((m) => !m.lista);
  if (!curso) {
    const tipo = tipoQueFalta(s);
    if (!tipo) return flot("Nada que batir", x, y, false);
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
  if (s.curando && !s.regadoHoy && s.curadoDias.length < CURADO_DIAS) {
    if (s.inv.agua.q < 0.1 - 1e-6) return flot("Falta agua", x, y, false);
    const c = usar(s, "agua", 0.1);
    s.costos.hormigon.mat += c;
    s.regadoHoy = true;
    s.curadoDias.push(s.dia);
    s.regarProg = 0;
    return flot(`Regado ${s.curadoDias.length}/${CURADO_DIAS}`, x, y, true);
  }
  if (fraguaActiva(s)) return flot("Fragua", x, y, false);
  const lista = listos(s).filter((w) => w.k !== "regar");
  const w = lista.find((t) => hayOficioTrabajando(s, t)) ?? lista[0];
  if (!w) {
    if (s.curando && s.curadoDias.length < CURADO_DIAS && s.etapa >= 8) return flot("Curado", x, y, false);
    return flot("Nada que hacer", x, y, false);
  }
  if (w.k === "achicar") {
    if (lluviaAhora(s)) return flot("Sigue lloviendo", x, y, false);
    const dq = tomarGolpe(s, w, b);
    if (dq <= 1e-8) return flot(hayOficioTrabajando(s, w) ? "Van a su ritmo" : "Falta un peón", x, y, false);
    const got = aplicar(s, w, dq);
    gastarGolpe(s, w, got);
    if (got <= 1e-8) return flot(lluviaAhora(s) ? "Sigue lloviendo" : "Falta un peón", x, y, false);
    return flot(`Achicar ${fmtCta(w.hecho)}/${fmtCta(w.q)}`, x, y, oro);
  }
  const faltaOf = oficioQueFalta(s, w.k);
  if (faltaOf === "albanil") {
    if (!s.avisoOficioAlbanil) {
      s.avisoOficioAlbanil = true;
      aviso(s, "El block y el vaciado los hace un albañil. Contrata uno en la oficina.");
    }
    return flot("Falta un albañil", x, y, false);
  }
  if (faltaOf === "acero") {
    if (!s.avisoOficioAcero) {
      s.avisoOficioAcero = true;
      aviso(s, "El acero lo arma un varillero o un albañil. Contrata uno en la oficina.");
    }
    return flot("Falta un varillero o albañil", x, y, false);
  }
  const dq = tomarGolpe(s, w, b);
  if (dq <= 1e-8) return flot(hayOficioTrabajando(s, w) ? "Van a su ritmo" : "Nadie trabajando", x, y, false);
  const antes = w.hecho;
  const got = aplicar(s, w, dq);
  gastarGolpe(s, w, got);
  if (got <= 1e-8) {
    if (TAREAS[w.k].lider && !hayLider(s, w.k)) return flot("Falta líder", x, y, false);
    if (w.mezcla && stockMezcla(s, w.mezcla) <= 1e-6) return flot("Sin mezcla", x, y, false);
    return flot("Falta material", x, y, false);
  }
  const unidad = unidadDe(w.k);
  const texto = `+${txtCant(w.hecho - antes, unidad)} ${corto(w)}`;
  return flot(texto, x, y, oro);
}

function oficioQueFalta(s: Estado, k: Tarea): "albanil" | "acero" | null {
  if (k !== "block" && k !== "vaciar" && k !== "acero") return null;
  const hay = s.gente.some((g) => g.activo && !g.fuera && !g.falto && puedeTarea(g.oficio, k));
  if (hay) return null;
  return k === "acero" ? "acero" : "albanil";
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

type HacerEspacio = "firma" | "nada" | "zanja" | "muro" | "sita" | "oficina" | "ferreteria" | "batea" | "obra" | "sitio";

export function queHaceEspacio(s: Estado): { tecla: string; verbo: string; detalle: string; hacer: HacerEspacio } {
  const sitio = cercano(s);
  if (!s.firmado) {
    if (sitio?.id === "oficina") return { tecla: "Espacio", verbo: "Firmar", detalle: "Doña Carmen, la dueña", hacer: "firma" };
    return { tecla: "Espacio", verbo: "Camina", detalle: "", hacer: "nada" };
  }
  if (s.entregada) return { tecla: "Espacio", verbo: "Obra entregada", detalle: "", hacer: "nada" };
  const achicar = listos(s).find((w) => w.k === "achicar");
  if (achicar && !juntoAZanja(s)) {
    return { tecla: "Espacio", verbo: "Camina a la zanja", detalle: `Achicar ${fmtCta(achicar.hecho)}/${fmtCta(achicar.q)}`, hacer: "zanja" };
  }
  if (achicar && juntoAZanja(s)) {
    return { tecla: "Espacio", verbo: "Achicar", detalle: `${fmtCta(achicar.hecho)}/${fmtCta(achicar.q)}`, hacer: "obra" };
  }
  if (s.plomo && !juntoAlMuro(s)) {
    return { tecla: "Espacio", verbo: "Camina al muro", detalle: "Plomear", hacer: "muro" };
  }
  if (s.plomo && juntoAlMuro(s)) {
    return { tecla: "Espacio", verbo: "Plomear", detalle: "", hacer: "obra" };
  }
  const ps = s.sita ? puntoSita(s) : null;
  const dSita = ps ? dist(s.jugador, ps) : 99;
  const bloqueaSita = sitio?.id === "oficina" || sitio?.id === "obra" || sitio?.id === "batea" || sitio?.id === "ferreteria";
  if (s.sita && (sitio?.id === "almacen" || (dSita <= 1.15 && !bloqueaSita))) {
    return { tecla: "Espacio", verbo: "Almacén", detalle: "el libro del guardalmacén", hacer: "sita" };
  }
  if (!sitio) return { tecla: "Espacio", verbo: "Camina", detalle: "Nada a 2 metros", hacer: "nada" };
  if (sitio.id === "batea") {
    const c = s.mezclas.find((m) => !m.lista);
    return {
      tecla: "Espacio",
      verbo: "Mezclar",
      detalle: c ? `${Math.round(c.prog * 100)}% de ${c.tipo === "H" ? "hormigón" : "mortero"}` : "una tanda en el trompo",
      hacer: "batea",
    };
  }
  if (sitio.id === "almacen") return { tecla: "Espacio", verbo: "Almacén", detalle: "el libro del guardalmacén", hacer: "sita" };
  if (sitio.id === "oficina") return { tecla: "Espacio", verbo: "Oficina", detalle: "contrata, planos y teléfono", hacer: "oficina" };
  if (sitio.id === "ferreteria") return { tecla: "Espacio", verbo: "Ferretería El Cruce", detalle: "precio y entrega", hacer: "ferreteria" };
  if (sitio.id === "entrada") return { tecla: "Espacio", verbo: "Entrada", detalle: "aquí deja el camión", hacer: "sitio" };
  if (sitio.id === "tanque") return { tecla: "Espacio", verbo: "Tanque", detalle: s.inv.agua.q > 0.15 ? "tiene agua" : "está vacío", hacer: "sitio" };
  if (sitio.id === "toma") return { tecla: "Espacio", verbo: "Toma", detalle: "el agua del solar no se cobra", hacer: "sitio" };
  if (sitio.id === "monton") return { tecla: "Espacio", verbo: "Montón", detalle: "arena y grava", hacer: "sitio" };
  if (sitio.id === "sombra") return { tecla: "Espacio", verbo: "Sombra", detalle: "debajo del mango", hacer: "sitio" };
  if (s.curando && !s.regadoHoy && s.curadoDias.length < CURADO_DIAS)
    return { tecla: "Espacio", verbo: "Regar la viga", detalle: `${s.curadoDias.length}/${CURADO_DIAS} días · 0.1 m³`, hacer: "obra" };
  const w = listos(s).find((t) => t.k !== "regar");
  if (!w) return { tecla: "Espacio", verbo: cuello(s), detalle: "el cartel de arriba dice por qué", hacer: "obra" };
  return { tecla: "Espacio", verbo: w.nombre, detalle: `${num(w.hecho, 1)} / ${num(w.q, 1)}`, hacer: "obra" };
}

export function accion(s: Estado): { tecla: string; verbo: string; detalle: string } {
  const q = queHaceEspacio(s);
  return { tecla: q.tecla, verbo: q.verbo, detalle: q.detalle };
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
    const pide = (pedido[m] ?? 0) > 0;
    if (!pide && enCamino(s, m) > 0) continue;
    if (enCamino(s, m) > 0) return "Viene en el camión";
    if ((s.entrada[m]?.q ?? 0) > 0.02) return `${nom} ya llegó a la entrada. Falta el acarreo.`;
    if (m === "tierra") return "Falta tierra. Sale de la zanja.";
    if (m === "agua" || !pide) continue;
    return `Falta ${nom}. Pídelo al guardalmacén.`;
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
    if (s.salidaMin >= 0 && s.salidaMin < 15 * 60)
      return `Se fueron a las ${horaDe(s.salidaMin)}. El día se paga completo.`;
    const w = trabajoSiguiente(s);
    const mf = w ? materialFalta(s, w) : null;
    const m = mf && mf.includes("guardalmacén") ? matQueFrena(s) : null;
    if (w && m) return `Se fueron a las 3. Mañana sigue: ${w.nombre} · falta ${nombreCortoMat(m)}`;
    const sigue = lineaAhora(s).replace(/^Ahora:\s*/, "");
    return `Se fueron a las 3. Mañana sigue: ${sigue}`;
  }
  return cuelloLabor(s);
}

/** El cartel de faena, sin el cierre de las 15:00. Lo usan los ensayos para no cambiar el día. */
export function cuelloLabor(s: Estado): string {
  if (!s.firmado) return "Doña Carmen te espera en la oficina para firmar la caseta.";
  if (s.entregada) return "Obra entregada. Doña Carmen ya tiene su caseta.";
  if (lluviaAhora(s)) return "Aguacero. La cuadrilla está en el almacén.";
  if (s.plomo) return "Toca plomear: ve al muro y pulsa Espacio.";
  if (s.curando && !s.regadoHoy && s.curadoDias.length < CURADO_DIAS)
    return `Toca regar la viga · ${s.curadoDias.length}/${CURADO_DIAS} días.`;
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
    return base;
  }
  if (def.id === "replanteo" && diag >= 2 - 1e-4 && s.minuto < s.escuadraHasta)
    return "Replanteo listo: escuadra comprobada 3, 4, 5";
  if (vienenNubes(s)) return "Hay cemento en la entrada y vienen nubes.";
  if (bateaSinAgua(s) && !s.gente.some((g) => laborDe(s, g) === "agua"))
    return "Sin agua en el tanque: manda a alguien por agua.";
  if (fraguaActiva(s) && s.fragua) return s.fragua.que;
  const pendientes = works(s).filter((w) => w.hecho < w.q - 1e-4 && !w.soloMaestro);
  const siguiente = pendientes.find((w) => prereqOk(s, w)) ?? pendientes[0];
  if (siguiente?.reqCurado && s.curadoDias.length < CURADO_DIAS)
    return `Curado de la viga · ${s.curadoDias.length}/${CURADO_DIAS} días. El techo espera.`;
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
    if (ultima === "sobro") return "Sobró una tanda en el trompo";
    if (ultima === "entrada") {
      const w = trabajoSiguiente(s);
      const mf = w ? materialFalta(s, w) : null;
      if (mf) return mf;
    } else if (ultima === "camion") return "Viene en el camión";
    else if (ultima) return `Última tanda en el trompo. Después falta ${ultima}: pídela.`;
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
      const puestoTrompo = s.gente.some((g) => g.activo && !g.fuera && !g.falto && g.puesto === "batea");
      const sinIng = (Object.entries(map) as [Mat, number][]).some(([k, n]) => s.inv[k].q < n - 1e-6);
      const vaPorAgua = s.gente.some((g) => laborDe(s, g) === "agua");
      if (!cubreBatea && !puestoTrompo) {
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
  if (topeHiladas) return `Máximo ${HILADA_TOPE} hiladas por día.`;
  if (siguiente) return `${def.nombre}: ${siguiente.nombre} · ${num(siguiente.hecho, 1)} / ${num(siguiente.q, 1)}`;
  return `${def.nombre}: ${num(progresoEtapa(s) * 100, 0)}%`;
}

function faltaTrasTanda(s: Estado): string | null {
  const queda = s.mezclas.some((m) => (m.lista && m.restante > 1e-4) || (!m.lista && m.prog > 1e-4));
  if (!queda) return null;
  const usa = tandasRestantes(s, "H") > 1e-6 || tandasRestantes(s, "M") > 1e-6;
  if (!usa) return "sobro";
  const pedido = loQueFalta(s);
  const orden: Mat[] = ["arena", "grava", "cemento"];
  for (const k of orden) {
    if ((pedido[k] ?? 0) <= 0 && (s.entrada[k]?.q ?? 0) <= 0.02 && enCamino(s, k) <= 0) continue;
    if ((s.entrada[k]?.q ?? 0) > 0.02) return "entrada";
    if (enCamino(s, k) > 0) return "camion";
    if ((pedido[k] ?? 0) > 0) return MATERIALES[k].nombre;
  }
  return null;
}

function vienenNubes(s: Estado): boolean {
  // v18: avisa con cualquier pronóstico de hoy, caiga o no; no adelanta el dado.
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

/** v23: el tiempo muerto que se ha ido pagando, proyectado sobre lo que falta de obra. Así «Falta gastar» sube con el tiempo muerto. */
export function muertoPorVenir(s: Estado): number {
  if (s.entregada) return 0;
  const p = progresoObra(s);
  const muerto = s.costos.muerto.mo + s.costos.muerto.mat;
  if (p < 0.05 || p >= 1 || muerto <= 0) return 0;
  return (muerto * (1 - p)) / p;
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


// ======== v18: ayuda al principiante ========

/** Nómina de un día con esta gente: jornales, herramienta y dirección. */
export function nominaDiaDe(gente: { oficio: Persona["oficio"]; rinde: number }[]): number {
  if (!gente.length) return 0;
  let j = 0;
  for (const g of gente) j += jornalDe(g.oficio, g.rinde);
  return j + Math.round(j * HERRAMIENTA) + DIRECCION_DIA;
}

/** Días hábiles que paga la caja con la cuadrilla de hoy (sin contar cobros). */
export function diasDeCaja(s: Estado): number {
  const nom = nominaDiaDe([...s.gente, ...s.reserva].filter((g) => !g.libre));
  if (nom <= 0) return 99;
  return Math.max(0, Math.floor((s.caja - (s.deudaNomina ?? 0)) / nom));
}

export interface Sugerencia {
  ids: string[];
  nombres: string[];
  nominaDia: number;
  dias: number;
  texto: string;
}

/** Cuadrilla que la caja de hoy aguanta: un albañil y peones o ayudantes que no faltan (tres con P$25,000 o más, si no dos). */
export function cuadrillaSugerida(s: Estado): Sugerencia {
  const equipo = [...s.gente, ...s.reserva];
  const caja = s.caja - (s.deudaNomina ?? 0);
  // Probado en 40 obras por perfil (sim_v18): tres con un albañil entrega más que cuatro o cinco sin colchón.
  const tam = caja >= 25000 ? 3 : 2;
  const quiereAlb = 1;
  const libres = s.candidatos.filter((c) => !equipo.some((g) => g.id === c.id || (g.nombre === c.nombre && g.apellido === c.apellido)));
  const elegidos: Persona[] = [];
  const tieneAlb = equipo.filter((g) => g.oficio === "albanil").length;
  const albs = libres.filter((c) => c.oficio === "albanil").sort((a, b) => b.rinde - a.rinde);
  for (const c of albs.slice(0, Math.max(0, quiereAlb - tieneAlb))) elegidos.push(c);
  const ayuda = libres
    .filter((c) => (c.oficio === "peon" || c.oficio === "ayudante") && c.mania !== "madrugador")
    .sort((a, b) => b.rinde / jornalDe(b.oficio, b.rinde) - a.rinde / jornalDe(a.oficio, a.rinde));
  for (const c of ayuda) {
    if (equipo.length + elegidos.length >= tam) break;
    elegidos.push(c);
  }
  const todos = [...equipo, ...elegidos];
  const nominaDia = nominaDiaDe(todos);
  const dias = nominaDia > 0 ? Math.floor(caja / nominaDia) : 99;
  const nombres = elegidos.map((c) => `${c.nombre} (${OFICIO_NOMBRE[c.oficio]})`);
  let texto: string;
  if (!elegidos.length) texto = `Con tu caja (${pesoCaja(caja)}) no hace falta contratar más: la cuadrilla de ${todos.length} cuesta ${peso(nominaDia)} al día.`;
  else
    texto = `Con tu caja (${pesoCaja(caja)}) te conviene una cuadrilla de ${todos.length}: ${nombres.join(", ")}. Nómina ${peso(nominaDia)} al día, ${dias > 0 ? `la caja aguanta unos ${dias} días` : "sin caja: no aguanta ni un día"}.`;
  return { ids: elegidos.map((c) => c.id), nombres, nominaDia, dias, texto };
}

/** Para la pantalla «Obra perdida»: quién se fue y qué día, y cuánto faltó de nómina, sacado del diario. */
export function causasPerdida(s: Estado): { salidas: string[]; cortas: string[]; deuda: number } {
  const salidas: string[] = [];
  const cortas: string[] = [];
  for (const d of s.diario) {
    if (/ se fue: /.test(d.texto)) salidas.push(`Día ${d.dia}: ${d.texto}`);
    else if (d.texto.startsWith("Nómina corta:")) cortas.push(`Día ${d.dia}: ${d.texto}`);
  }
  return { salidas, cortas, deuda: deudaPendiente(s) };
}

/** Aviso de la mañana cuando el adelanto está por vencer o ya venció (18 días sin sellar). */
export function textoPlazoAdelanto(s: Estado): string {
  if (adelantoUsado(s) || s.entregada || !s.firmado) return "";
  const sin = s.dia - (s.selloDia || 1);
  const queda = 18 - sin;
  if (sin === 19) return "Pasaron 18 días sin sellar una etapa: Doña Carmen ya no adelanta. Sella una etapa para que vuelva.";
  if (queda >= 0 && queda <= 2) {
    const d = queda === 0 ? "hoy es el último día" : `quedan ${queda} ${queda === 1 ? "día" : "días"}`;
    return `Ojo con el adelanto: Doña Carmen solo adelanta hasta 18 días sin sellar; ${d}.`;
  }
  return "";
}

/** Aviso de la mañana: cuántos días de nómina quedan en la caja. */
export function textoDiasCaja(s: Estado): string {
  const nom = nominaDiaDe([...s.gente, ...s.reserva].filter((g) => !g.libre));
  if (nom <= 0 || s.entregada) return "";
  const dias = diasDeCaja(s);
  if (dias > 4) return "";
  const prox = ETAPAS.slice(s.etapa).find((e) => e.tramo > 0);
  const cobro = prox ? ` El próximo cobro es al aprobar ${prox.nombre}: ${cobroDe(s, ETAPAS.indexOf(prox)).texto}.` : "";
  const dd = dias === 1 ? "día" : "días";
  return `Te quedan ${dias} ${dd} de caja con esta cuadrilla (${peso(nom)} al día).${cobro} Si no llegas, da libre a un peón.`;
}

export const REGLAS_LIBRETA = [
  "Siempre hay salida: si la caja y el adelanto no pagan lo que falta para sellar la etapa, el guardalmacén lo fía (solo lo de esta etapa, y nunca más de lo que paga el próximo tramo). Al aprobar, Doña Carmen paga el tramo y el fiado sale de ahí: tramo − adelanto − fiado = lo que entra.",
  "Nadie se va antes del cobro: si la etapa que cobra va en 75% o más y lo que entra al sellarla paga la deuda de nómina, la cuadrilla espera («te pago al cobrar»). Si no, a la segunda nómina corta se va uno.",
  "Al entregar se paga la nómina del día y la deuda de nómina; la Entrega muestra la cuenta completa de la caja.",
  "La mezcla lista no se vence mientras esperas el plomo o el camión.",
  "Pedir lo que alcanza: si la caja paga el pedido, el guardalmacén lo suelta aunque la nómina quede corta, y dice cuánto faltará.",
  "Nómina corta: se paga lo que hay y el resto es deuda de mañana. Baja el ánimo. Dos días seguidos, un obrero se va. La obra se pierde solo si no queda nadie.",
  "Doña Carmen adelanta una sola vez por obra: o el adelanto a cuenta de lo avanzado, o (si no se puede sellar ni pedirlo) la mitad de la etapa. Después, la nómina corta solo ofrece «Pagar lo que haya».",
  "Cuadrilla sugerida: al contratar, la oficina mira tu caja y te dice cuánta gente aguanta (un albañil siempre, el resto peones). Con P$25,000 o más, tres: un albañil y dos ayudantes; con menos, dos. Más gente acaba la caja antes del cobro.",
  "Aviso de la mañana: si la caja no paga más de 4 días de nómina con la cuadrilla de hoy, al amanecer sale «Te quedan X días de caja…». Sella la etapa que cobra o da libre a un peón.",
  "Bono por entrega temprana: Doña Carmen paga P$1,500 por cada día que entregues antes del día 30 (entregar el día 20 = P$15,000). El día 30 o después, sin bono.",
  "Nómina del día = jornales + herramienta (3% del jornal) + Dirección (P$1,750 si ese día hubo jornales). El aviso de las 3 muestra las tres partes y el total.",
  "Cada noche muestra el resumen y espera tu toque. Si hay mezcla en el trompo, avisa antes de dormir: se pierde.",
];

export function libreta(s: Estado) {
  const filas: FilaCosto[] = PARTIDAS.map((p) => {
    const mo = s.costos[p].mo;
    const mat = s.costos[p].mat;
    const real = mo + mat;
    const pre = PRESUPUESTO[p];
    return { partida: p, nombre: PARTIDA_NOMBRE[p], pre, mo, mat, real, desv: real - pre };
  });
  const costo = filas.reduce((a, f) => a + f.real, 0);
  const porHacer = filas.reduce((a, f) => a + quedaPresupuesto(s, f.partida, f.real), 0) + muertoPorVenir(s);
  return {
    filas,
    costo,
    presupuesto: PRESUPUESTO_TOTAL,
    porHacer,
    ganancia: precioDe(s) + (s.bono ?? 0) - (costo + porHacer),
    bono: s.bono ?? 0,
    cobrado: s.cobrado,
    caja: s.caja,
    diario: s.diario,
    almacen: almacen(s),
    sugerencia: cuadrillaSugerida(s).texto,
    diasCaja: textoDiasCaja(s),
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
  const precio = precioDe(s);
  const anticipo = Math.round(precio * 0.3);
  const defs: { nombre: string; monto: number; etapa: number | null }[] = [
    { nombre: "Anticipo 30%", monto: anticipo, etapa: null },
    { nombre: "Zapata 15%", monto: Math.round(precio * 0.15), etapa: 3 },
    { nombre: "Muros 10%", monto: Math.round(precio * 0.1), etapa: 4 },
    { nombre: "Columnas 10%", monto: Math.round(precio * 0.1), etapa: 5 },
    { nombre: "Viga 15%", monto: Math.round(precio * 0.15), etapa: 6 },
    { nombre: "Piso 5%", monto: Math.round(precio * 0.05), etapa: 7 },
    { nombre: "Techo 15%", monto: Math.round(precio * 0.15), etapa: 8 },
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
  let clima = "No llovió";
  if (ll) clima = "Aguacero";
  // v18: el % se muestra igual caiga o no; la barra no adelanta el dado de la lluvia.
  else if (hoy && s.minuto < hoy.ini) clima = `Se nubla · ${hoy.prob}%`;
  else if (hoy && s.minuto >= hoy.ini && hoy.cae === false) clima = "No llovió";
  else if (hoy && s.minuto >= hoy.fin) clima = hoy.cae === false ? "No llovió" : "Escampó";
  const pMan = s.lluvias.find((r) => r.dia === man);
  if (!ll) clima += pMan ? ` · mañana ${pMan.prob}%` : " · mañana sol";
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
  if (!r) return delta === 0 && s.minuto >= 15 * 60 ? `${nom}: no llovió` : `${nom}: sol`;
  const hora = horaDe(r.ini);
  if (delta > 0 || s.minuto < r.ini) return `${nom}: ${r.prob}% de aguacero, a eso de las ${hora}`;
  if (r.cae === false) return `${nom}: amenazó lluvia y no cayó`;
  return `${nom}: llovió desde las ${hora}`;
}

export function textoMezcla(s: Estado): string | null {
  const m = minutosMezcla(s);
  if (!m) return null;
  const nom = m.tipo === "H" ? "Hormigón" : "Mortero";
  if (!m.lista) return `${nom} batiendo · listo en ${m.min} min`;
  return `${nom} listo · se vence en ${m.min} min`;
}

export function textoSinTarea(g: Persona): string | null {
  // v19: con puesto asignado no está «sin tarea» (puede estar esperando material: eso va en Tiempo muerto).
  if (g.puesto) return null;
  const min = g.sinTareaHoy ?? 0;
  if (min <= 4 * 60) return null;
  const h = Math.round((min / 60) * 10) / 10;
  const tx = Number.isInteger(h) ? String(h) : num(h);
  return `${g.nombre} estuvo ${tx} h sin tarea. ¿Libre mañana?`;
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

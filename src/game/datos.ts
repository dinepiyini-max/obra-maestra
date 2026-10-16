export const CONTRATO = 300_000;
export const ANTICIPO = 90_000;
export const KIT_PRECIO = 600;
export const CAJA_INICIAL = ANTICIPO - KIT_PRECIO;
export const DIRECCION_DIA = 1750;
/** v19: Doña Carmen paga P$1,500 por cada día que la obra se entrega antes del día 30. */
export const PLAZO_ENTREGA = 30;
export const BONO_DIA = 1500;
export const FLETE = 1500;
export const FLETE_URGENTE = 3000;
export const HERRAMIENTA = 0.03;
export const CURADO_DIAS = 7;
export const MAX_CUADRILLA = 8;
export const RADIO = 2;
export const RADIO_LIDER = 4.5;
/** v19: paso de una persona, en casillas por segundo real (x1). */
export const VEL_MAESTRO = 2.5;
export const VEL_CUADRILLA = 2.8;
export const HILADA_TOPE = 8;
export const BLOCKS_MURO = 469;
export const HILADAS = 15;
export const POR_HILADA = BLOCKS_MURO / HILADAS;
export const TOPE_BLOCK_DIA = HILADA_TOPE * POR_HILADA;

export const OFICIOS = ["peon", "ayudante", "albanil", "varillero", "carpintero"] as const;
export type Oficio = (typeof OFICIOS)[number];

export const MANIAS = ["patas", "tranquilo", "madrugador", "cantor", "piedra", "domino"] as const;
export type Mania = (typeof MANIAS)[number];

export const PUESTOS = ["obra", "batea", "acarreo", "agua", "sombra"] as const;
export type Puesto = (typeof PUESTOS)[number];

export const PARTIDAS = [
  "replanteo",
  "excavacion",
  "acero",
  "encofrado",
  "hormigon",
  "block",
  "techo",
  "piso",
  "direccion",
  "herramienta",
  "fletes",
  "farmeo",
  "muerto",
] as const;
export type Partida = (typeof PARTIDAS)[number];

export const PARTIDA_NOMBRE: Record<Partida, string> = {
  replanteo: "Replanteo y limpieza",
  excavacion: "Excavación",
  acero: "Acero",
  encofrado: "Encofrado",
  hormigon: "Hormigón 1:2:3",
  block: "Block y mortero",
  techo: "Techo",
  piso: "Piso y terminación",
  direccion: "Dirección (tu jornal)",
  herramienta: "Herramienta",
  fletes: "Fletes",
  farmeo: "Acarreo",
  muerto: "Tiempo muerto",
};

export const PRESUPUESTO: Record<Partida, number> = {
  replanteo: 3700,
  excavacion: 1680,
  acero: 19807,
  encofrado: 14474,
  hormigon: 49312,
  block: 48096,
  techo: 23016,
  piso: 3014,
  direccion: 28000,
  herramienta: 2609,
  fletes: 6000,
  farmeo: 0,
  muerto: 0,
};

export const PRESUPUESTO_TOTAL = Object.values(PRESUPUESTO).reduce((a, b) => a + b, 0);

export const MATS = [
  "arena",
  "grava",
  "agua",
  "cemento",
  "v38",
  "v14",
  "alambre",
  "block",
  "plywood",
  "pino",
  "abeto",
  "zinc",
  "clavo",
  "clavoTecho",
  "kit",
  "tierra",
] as const;
export type Mat = (typeof MATS)[number];

export interface MatDef {
  nombre: string;
  unidad: string;
  precio: number;
  paso: number;
  compra: boolean;
}

export const MATERIALES: Record<Mat, MatDef> = {
  arena: { nombre: "Arena gruesa", unidad: "m³", precio: 2883.33, paso: 0.5, compra: true },
  grava: { nombre: "Grava", unidad: "m³", precio: 1773.33, paso: 0.5, compra: true },
  agua: { nombre: "Agua", unidad: "m³", precio: 200, paso: 0.5, compra: false },
  cemento: { nombre: "Cemento gris 42.5 kg", unidad: "funda", precio: 550, paso: 1, compra: true },
  v38: { nombre: 'Varilla 3/8" × 20\'', unidad: "barra", precio: 262.87, paso: 1, compra: true },
  v14: { nombre: 'Varilla 1/4" × 20\'', unidad: "barra", precio: 120.24, paso: 1, compra: true },
  alambre: { nombre: "Alambre de amarre cal. 16", unidad: "lb", precio: 79.5, paso: 1, compra: true },
  block: { nombre: 'Block de 6"', unidad: "ud", precio: 55.4, paso: 10, compra: true },
  plywood: { nombre: 'Plywood 3/4" 4×8', unidad: "plancha", precio: 2200, paso: 1, compra: true },
  pino: { nombre: "Pino 1×4×10'", unidad: "pieza", precio: 358.97, paso: 1, compra: true },
  abeto: { nombre: "Abeto 2×4×12'", unidad: "pieza", precio: 586.46, paso: 1, compra: true },
  zinc: { nombre: "Zinc acanalado cal. 29 3×6'", unidad: "lámina", precio: 384.86, paso: 1, compra: true },
  clavo: { nombre: 'Clavo 3"', unidad: "lb", precio: 69.02, paso: 1, compra: true },
  clavoTecho: { nombre: "Clavo de techo con arandela", unidad: "lb", precio: 81.83, paso: 1, compra: true },
  kit: { nombre: "Kit de replanteo", unidad: "lote", precio: 600, paso: 1, compra: true },
  tierra: { nombre: "Tierra de zanja", unidad: "m³", precio: 0, paso: 0.1, compra: false },
};

export const COMPRA = (Object.keys(MATERIALES) as Mat[]).filter((k) => MATERIALES[k].compra && k !== "kit");

export type Peso = "pesado" | "medio" | "liviano";
export type Grupo =
  | "pala"
  | "block"
  | "acero"
  | "encofrar"
  | "vaciar"
  | "llanear"
  | "limpiar"
  | "regar";

export const TAREAS_K = [
  "limpiar",
  "excavar",
  "achicar",
  "acero",
  "calzos",
  "mezclarH",
  "mezclarM",
  "vaciar",
  "block",
  "encofrar",
  "techo",
  "relleno",
  "llanear",
  "limpieza",
  "regar",
  "palear",
  "agua",
  "acarreo",
  "replantear",
] as const;
export type Tarea = (typeof TAREAS_K)[number];

export interface TareaDef {
  nombre: string;
  rinde: number;
  peso: Peso;
  lider: Oficio[] | null;
  partida: Partida;
  golpe: number;
  grupo: Grupo;
}

const PALA: Oficio[] | null = null;

export const TAREAS: Record<Tarea, TareaDef> = {
  limpiar: { nombre: "Limpiar", rinde: 60, peso: "medio", lider: null, partida: "replanteo", golpe: 0.75, grupo: "limpiar" },
  excavar: { nombre: "Excavar", rinde: 3, peso: "pesado", lider: null, partida: "excavacion", golpe: 0.036, grupo: "pala" },
  achicar: { nombre: "Achicar", rinde: 8, peso: "pesado", lider: null, partida: "excavacion", golpe: 0.1, grupo: "pala" },
  acero: { nombre: "Armar acero", rinde: 100, peso: "medio", lider: ["varillero", "albanil"], partida: "acero", golpe: 1.2, grupo: "acero" },
  calzos: { nombre: "Calzos de grava (0.05 m³, separan el acero del fondo)", rinde: 16, peso: "liviano", lider: null, partida: "acero", golpe: 0.17, grupo: "limpiar" },
  mezclarH: { nombre: "Mezclar hormigón", rinde: 8, peso: "pesado", lider: null, partida: "hormigon", golpe: 0.1, grupo: "pala" },
  mezclarM: { nombre: "Mezclar mortero", rinde: 22, peso: "pesado", lider: null, partida: "block", golpe: 0.25, grupo: "pala" },
  vaciar: { nombre: "Vaciar", rinde: 8, peso: "pesado", lider: ["albanil"], partida: "hormigon", golpe: 0.1, grupo: "vaciar" },
  block: { nombre: "Poner block", rinde: 210, peso: "medio", lider: ["albanil"], partida: "block", golpe: 1, grupo: "block" },
  encofrar: { nombre: "Encofrar", rinde: 6.7, peso: "medio", lider: ["carpintero", "albanil"], partida: "encofrado", golpe: 0.08, grupo: "encofrar" },
  techo: { nombre: "Techar", rinde: 8, peso: "medio", lider: ["carpintero", "albanil"], partida: "techo", golpe: 0.1, grupo: "encofrar" },
  relleno: { nombre: "Rellenar", rinde: 3, peso: "pesado", lider: null, partida: "piso", golpe: 0.036, grupo: "pala" },
  llanear: { nombre: "Llanear", rinde: 20, peso: "medio", lider: ["albanil"], partida: "piso", golpe: 0.25, grupo: "llanear" },
  limpieza: { nombre: "Limpieza", rinde: 2, peso: "liviano", lider: null, partida: "piso", golpe: 0.025, grupo: "limpiar" },
  regar: { nombre: "Regar", rinde: 16, peso: "liviano", lider: null, partida: "hormigon", golpe: 0.2, grupo: "regar" },
  palear: { nombre: "Palear", rinde: 2, peso: "pesado", lider: null, partida: "farmeo", golpe: 0.025, grupo: "pala" },
  agua: { nombre: "Halar agua", rinde: 4, peso: "medio", lider: null, partida: "farmeo", golpe: 0.05, grupo: "pala" },
  acarreo: { nombre: "Acarrear", rinde: 40, peso: "pesado", lider: null, partida: "farmeo", golpe: 0, grupo: "pala" },
  replantear: { nombre: "Replantear", rinde: 8, peso: "liviano", lider: ["albanil"], partida: "replanteo", golpe: 0.08, grupo: "block" },
};

void PALA;

export const EFI: Record<Grupo, number[]> = {
  pala: [1, 1, 0.8, 0.8, 0.8],
  block: [0.2, 0.3, 1, 0.4, 0.4],
  acero: [0.3, 0.5, 0.7, 1, 0.5],
  encofrar: [0.3, 0.5, 0.7, 0.5, 1],
  vaciar: [0.4, 0.6, 1, 0.7, 0.7],
  llanear: [0.3, 0.4, 1, 0.5, 0.5],
  limpiar: [1, 1, 0.7, 0.7, 0.7],
  regar: [1, 1, 1, 1, 1],
};

export const JORNAL_BASE: Record<Oficio, number> = {
  peon: 1200,
  ayudante: 1200,
  albanil: 2800,
  varillero: 2800,
  carpintero: 2800,
};

export const OFICIO_NOMBRE: Record<Oficio, string> = {
  peon: "Peón",
  ayudante: "Ayudante",
  albanil: "Albañil",
  varillero: "Varillero",
  carpintero: "Carpintero",
};

export const OFICIO_COLOR: Record<Oficio, { camisa: string; casco: string }> = {
  peon: { camisa: "#6e8cae", casco: "#e2b43a" },
  ayudante: { camisa: "#6e8f62", casco: "#d07a3a" },
  albanil: { camisa: "#d9d3c7", casco: "#b8432f" },
  varillero: { camisa: "#a85a3a", casco: "#3d5f8a" },
  carpintero: { camisa: "#8a623c", casco: "#3f6b45" },
};

export const MANIA_INFO: Record<Mania, { nombre: string; bueno: string; malo: string }> = {
  patas: { nombre: "Patas Largas", bueno: "Pala +20% y camina rápido", malo: "Se cansa un 25% más" },
  tranquilo: { nombre: "el Tranquilo", bueno: "Ojo +2", malo: "Rinde 10% menos" },
  madrugador: { nombre: "Madrugador", bueno: "Rinde 12.5% más", malo: "Los sábados no viene" },
  cantor: { nombre: "el Cantor", bueno: "+10% a quien comparta su puesto", malo: "Él rinde 5% menos" },
  piedra: { nombre: "Mano'e Piedra", bueno: "Lo pesado +20%", malo: "Ojo −1" },
  domino: { nombre: "el Dominero", bueno: "Se cansa 20% menos", malo: "Rinde un chin menos" },
};

export const PUESTO_NOMBRE: Record<Puesto, string> = {
  obra: "Obra",
  batea: "Trompo",
  acarreo: "Acarreo",
  agua: "Agua",
  sombra: "Sombra",
};

export interface Sitio {
  id: string;
  nombre: string;
  x: number;
  y: number;
}

export const SITIOS = {
  monton: { id: "monton", nombre: "Montón", x: 14.3, y: 11.7 },
  tanque: { id: "tanque", nombre: "Tanque", x: 16.5, y: 18.6 },
  toma: { id: "toma", nombre: "Toma", x: 15.8, y: 19.1 },
  batea: { id: "batea", nombre: "Trompo", x: 19, y: 17.3 },
  almacen: { id: "almacen", nombre: "Almacén", x: 4.5, y: 14.5 },
  oficina: { id: "oficina", nombre: "Oficina", x: 8.7, y: 16.6 },
  obra: { id: "obra", nombre: "Obra", x: 19, y: 14.5 },
  tierra: { id: "tierra", nombre: "Tierra", x: 23.58, y: 12.2 },
  sombra: { id: "sombra", nombre: "Mata de mango", x: 27.5, y: 11 },
  entrada: { id: "entrada", nombre: "Entrada", x: 12.4, y: 21.2 },
  ferreteria: { id: "ferreteria", nombre: "Ferretería El Cruce", x: 30, y: 22.5 },
  camion: { id: "camion", nombre: "Camión", x: 16.5, y: 22.4 },
} as const;

export const PUESTO_SITIO: Record<Puesto, { x: number; y: number }> = {
  obra: SITIOS.obra,
  batea: SITIOS.batea,
  acarreo: SITIOS.entrada,
  agua: SITIOS.toma,
  sombra: SITIOS.sombra,
};

/** Tambor del trompo. El puesto se queda en SITIOS.batea, fuera del cuerpo. */
export const TROMPO_CUERPO = { x: 19.9, y: 17.1, r: 0.68 };
/** Bote del baldío. La tierra sobrante y el escombro salen del solar. */
export const BOTE_TIERRA = { x: 10.2, y: 9.4 };
/** Montón de escombro, al lado oeste del solar. */
export const ESCOMBRO = { x: 15.3, y: 16.9 };
/** Lo que se pinta y por donde camina el maestro. Un solo rectángulo. */
export const MAPA = { x0: -10, x1: 44, y0: -8, y1: 34 };

export const LISTERO = { nombre: "Nico", apellido: "Adames", rol: "Listero" };
export const GUARDALMACEN = { nombre: "Guardalmacén", apellido: "", rol: "Guardalmacén" };
export const NOTA_ESCUADRA = "Si 3 m y 4 m dan 5 m de diagonal, la esquina está a escuadra.";

export const SOLAR = { x0: 17, x1: 21, y0: 13, y1: 16 };
export const MUNDO = { w: 34, h: 26 };
export const RIO_Y = 3.6;
export const CAMINO_Y = 23.6;
export const INICIO = { x: 12.4, y: 22.15 };

export const RECETA_H = { cemento: 1, arena: 0.068, grava: 0.102, agua: 0.025, vida: 90 };
export const RECETA_M = { cemento: 0.25, arena: 0.034, agua: 0.006, vida: 150, block: 22 };

export type Cantidades = Partial<Record<Mat, number>>;

export interface TrabajoDef {
  id: string;
  k: Tarea;
  nombre: string;
  q: number;
  usa?: Cantidades;
  usaIni?: Cantidades;
  mezcla?: "H" | "M";
  mezclaQ?: number;
  despuesDe?: string[];
  desdePct?: { id: string; pct: number };
  soloMaestro?: boolean;
  reqCurado?: boolean;
}

export interface EtapaDef {
  id: string;
  n: number;
  nombre: string;
  regla: string;
  tramo: number;
  trabajos: TrabajoDef[];
}

export const ETAPAS: EtapaDef[] = [
  {
    id: "replanteo",
    n: 1,
    nombre: "Replanteo",
    regla: NOTA_ESCUADRA,
    tramo: 0,
    trabajos: [
      { id: "limpiar", k: "limpiar", nombre: "Limpiar el solar", q: 30 },
      { id: "replantear", k: "replantear", nombre: "Replantear", q: 2, usaIni: { kit: 1 } },
    ],
  },
  {
    id: "excavacion",
    n: 2,
    nombre: "Excavación",
    regla: "Zanja corrida 0.50 × 0.60 m en 14 m de perímetro.",
    tramo: 0,
    trabajos: [{ id: "excavar", k: "excavar", nombre: "Excavar zanja", q: 4.2 }],
  },
  {
    id: "acero",
    n: 3,
    nombre: "Acero de zapata",
    regla: "Recubrimiento de 7.5 cm. La varilla no puede quedar pegada a la tierra.",
    tramo: 0,
    trabajos: [
      { id: "acero", k: "acero", nombre: "Armar acero de zapata", q: 103.8, usa: { v38: 26, v14: 10, alambre: 6 } },
      { id: "calzos", k: "calzos", nombre: "Calzos de grava (0.05 m³, separan el acero del fondo)", q: 1, usa: { grava: 0.05 } },
    ],
  },
  {
    id: "zapata",
    n: 4,
    nombre: "Vaciado de zapata",
    regla: "No se vacía con lluvia. Después fragua: el block empieza mañana a las 7:00.",
    tramo: 0.15,
    trabajos: [{ id: "vaciar", k: "vaciar", nombre: "Vaciar zapata", q: 10, mezcla: "H", mezclaQ: 10 }],
  },
  {
    id: "muros",
    n: 5,
    nombre: "Muros de block",
    regla: "Máximo 6 hiladas por día. Plomo en las hiladas 3, 6, 9 y 12.",
    tramo: 0.1,
    trabajos: [
      {
        id: "block",
        k: "block",
        nombre: "Levantar block",
        q: BLOCKS_MURO,
        usa: { v38: 8, alambre: 1, block: BLOCKS_MURO },
        mezcla: "M",
        mezclaQ: BLOCKS_MURO / 22,
      },
      {
        id: "huecos",
        k: "vaciar",
        nombre: "Rellenar huecos con hormigón",
        q: 7,
        mezcla: "H",
        mezclaQ: 7,
        desdePct: { id: "block", pct: 0.5 },
      },
    ],
  },
  {
    id: "columnas",
    n: 6,
    nombre: "Columnas de amarre",
    regla: "Primero el encofrado, después el vaciado. Fragua hasta el día siguiente.",
    tramo: 0.1,
    trabajos: [
      {
        id: "encofrar",
        k: "encofrar",
        nombre: "Encofrar columnas",
        q: 7.2,
        usaIni: { plywood: 3, pino: 6, clavo: 2 },
      },
      {
        id: "vaciar",
        k: "vaciar",
        nombre: "Vaciar columnas",
        q: 5,
        mezcla: "H",
        mezclaQ: 5,
        despuesDe: ["encofrar"],
      },
    ],
  },
  {
    id: "viga",
    n: 7,
    nombre: "Viga de amarre",
    regla: "Luego se cura 7 días regando. El domingo cuenta solo si se regó el sábado.",
    tramo: 0.15,
    trabajos: [
      { id: "acero", k: "acero", nombre: "Acero de viga", q: 48.1, usa: { v38: 11, v14: 7, alambre: 3 } },
      { id: "encofrar", k: "encofrar", nombre: "Encofrar viga", q: 5.63, usaIni: { clavo: 1 } },
      {
        id: "vaciar",
        k: "vaciar",
        nombre: "Vaciar viga",
        q: 4,
        mezcla: "H",
        mezclaQ: 4,
        despuesDe: ["acero", "encofrar"],
      },
    ],
  },
  {
    id: "piso",
    n: 8,
    nombre: "Relleno y piso",
    regla: "El llaneo va detrás del vaciado, desde el 25%.",
    tramo: 0.05,
    trabajos: [
      { id: "relleno", k: "relleno", nombre: "Relleno compactado", q: 2.2, usa: { tierra: 2.2 } },
      { id: "firme", k: "vaciar", nombre: "Firme de piso", q: 8, mezcla: "H", mezclaQ: 8, despuesDe: ["relleno"] },
      { id: "llano", k: "llanear", nombre: "Llanear piso", q: 11, desdePct: { id: "firme", pct: 0.25 } },
    ],
  },
  {
    id: "techo",
    n: 9,
    nombre: "Techo y entrega",
    regla: "El zinc solo se monta con la viga ya curada.",
    tramo: 0.15,
    trabajos: [
      {
        id: "techo",
        k: "techo",
        nombre: "Montar techo",
        q: 16.5,
        usa: { abeto: 8, pino: 14, zinc: 18, clavo: 2, clavoTecho: 4 },
        reqCurado: true,
      },
      { id: "limpieza", k: "limpieza", nombre: "Limpieza final", q: 1, desdePct: { id: "techo", pct: 0.5 } },
    ],
  },
];

export const TRAMO_NOMBRE: Record<string, string> = {
  anticipo: "Anticipo",
  zapata: "Zapata",
  columnas: "Columnas",
  viga: "Viga",
  piso: "Piso",
  techo: "Techo y entrega",
};

export interface PersonaBase {
  nombre: string;
  apellido: string;
  oficio: Oficio;
  rinde: number;
  aguante: number;
  ojo: number;
  mania: Mania;
}

export const DIA1: PersonaBase[] = [
  { nombre: "Toño", apellido: "Batista", oficio: "peon", rinde: 1, aguante: 4, ojo: 3, mania: "domino" },
  { nombre: "Fefa", apellido: "Peñaló", oficio: "ayudante", rinde: 1.1, aguante: 3, ojo: 3, mania: "patas" },
  { nombre: "Moncho", apellido: "Taveras", oficio: "albanil", rinde: 0.95, aguante: 3, ojo: 4, mania: "tranquilo" },
  { nombre: "Lalo", apellido: "Rosario", oficio: "peon", rinde: 0.85, aguante: 2, ojo: 2, mania: "cantor" },
];

/** Cuadrilla fija. Los cuatro de hoy conservan su oficio. El ayudante cobra el jornal del peón. */
export const CUADRILLA: PersonaBase[] = [
  ...DIA1,
  { nombre: "Yeyo", apellido: "Mejía", oficio: "albanil", rinde: 1, aguante: 3, ojo: 3, mania: "piedra" },
  { nombre: "Tato", apellido: "Guzmán", oficio: "varillero", rinde: 1, aguante: 3, ojo: 3, mania: "tranquilo" },
  { nombre: "Chago", apellido: "Polanco", oficio: "varillero", rinde: 0.95, aguante: 4, ojo: 3, mania: "cantor" },
  { nombre: "Cuca", apellido: "Almonte", oficio: "ayudante", rinde: 1, aguante: 3, ojo: 2, mania: "domino" },
  { nombre: "Nena", apellido: "Cabral", oficio: "ayudante", rinde: 0.9, aguante: 4, ojo: 3, mania: "madrugador" },
  { nombre: "Bolo", apellido: "Féliz", oficio: "ayudante", rinde: 1.05, aguante: 3, ojo: 2, mania: "patas" },
];

/** A qué cuadrilla pertenece cada ayudante. */
export const AYUDA_DE: Record<string, "albanil" | "varillero"> = {
  Fefa: "albanil",
  Cuca: "albanil",
  Nena: "varillero",
  Bolo: "varillero",
};

export const POOL: [string, string][] = [
  ["Chago", "Polanco"],
  ["Cuca", "Almonte"],
  ["Tato", "Guzmán"],
  ["Yeyo", "Mejía"],
  ["Chichí", "Brito"],
  ["Mayi", "Ureña"],
  ["Bolo", "Féliz"],
  ["Kelvin", "Santana"],
  ["Nena", "Cabral"],
  ["Fello", "Jiménez"],
];

export const FRASES_CANSANCIO = [
  "¡E'toy frito, maestro!",
  "No doy má' un paso.",
  "Échame pa' la sombra un rato.",
  "Esto 'tá jarto.",
  "Se me van las patas.",
];

export const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"] as const;

export const OBRAS_MENU = [
  { id: "caseta", nombre: "Caseta de block 3x4", abierta: true },
  { id: "losa", nombre: "Losa de concreto", abierta: false },
  { id: "nivel", nombre: "Segundo nivel", abierta: false },
  { id: "cisterna", nombre: "Cisterna de 5 m³", abierta: false },
  { id: "muro", nombre: "Muro perimetral", abierta: false },
  { id: "bloquera", nombre: "Bloquera manual", abierta: false },
];

export const TUTORIAL = [
  "Muévete con las flechas o el joystick; Espacio o ¡Dale! hace la acción; T termina el día.",
  "Contrata en la oficina.",
  "Toca Cuadrilla, luego Puesto y Obra, para mandar al albañil a replantear.",
  "Pide «Lo que falta» para arrancar.",
  "Manda a alguien a acarrear.",
  "Que alguien busque agua.",
  "El guardalmacén te trae una nota a las 14:00, o antes si la obra se para por material.",
  "El cartel de arriba dice qué frena la obra.",
];

export function jornalDe(oficio: Oficio, rinde: number): number {
  const raw = JORNAL_BASE[oficio] * (0.85 + 0.15 * rinde);
  return Math.round(raw / 50) * 50;
}

export function diaSemana(dia: number): (typeof DIAS)[number] {
  return DIAS[(dia - 1) % 7] ?? "Lunes";
}

export function esDomingo(dia: number): boolean {
  return (dia - 1) % 7 === 6;
}

export function esSabado(dia: number): boolean {
  return (dia - 1) % 7 === 5;
}

/** v21: caja o caja libre: nunca un monto negativo en pantalla. «P$0 · debes P$X». */
export function pesoCaja(n: number): string {
  const v = Math.round(n);
  return v < 0 ? `P$0 · debes ${peso(-v)}` : peso(v);
}

export function peso(n: number, conSigno = false): string {
  const v = Math.round(n);
  const neg = v < 0;
  const t = Math.abs(v).toLocaleString("en-US");
  if (neg) return `−P$${t}`;
  return conSigno ? `+P$${t}` : `P$${t}`;
}

export function num(n: number, dec = 1): string {
  if (!Number.isFinite(n)) return "0";
  const r = Math.round(n * 10 ** dec) / 10 ** dec;
  if (Math.abs(r - Math.round(r)) < 1e-6) return String(Math.round(r));
  return r.toFixed(dec);
}

export function horaDe(minuto: number): string {
  const h = Math.floor(minuto / 60);
  const m = minuto % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hash2(seed: number, i: number): number {
  const n = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

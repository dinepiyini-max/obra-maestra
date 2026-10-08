export const CONTRATO = 300_000;
export const ANTICIPO = 90_000;
export const KIT_PRECIO = 600;
export const CAJA_INICIAL = ANTICIPO - KIT_PRECIO;
export const DIRECCION_DIA = 1750;
export const FLETE = 1500;
export const FLETE_URGENTE = 3000;
export const HERRAMIENTA = 0.03;
export const MAX_CUADRILLA = 8;
export const RADIO = 2;
export const RADIO_LIDER = 4.5;
export const VEL_MAESTRO = 4.5;
export const VEL_CUADRILLA = 2.8;
export const HILADA_TOPE = 6;
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

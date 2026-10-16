/**
 * Fase 3: un contrato es datos. El motor lee el contrato activo con `contratoDe(s)`
 * en vez de las constantes globales. La caseta de Doña Carmen es el contrato 0 y
 * toma sus valores de datos.ts, que sigue siendo la fuente de la 1.0.
 */
import {
  ANTICIPO,
  BONO_DIA,
  CAJA_INICIAL,
  CONTRATO,
  CUADRILLA,
  DIA1,
  DIRECCION_DIA,
  ETAPAS,
  KIT_PRECIO,
  PLAZO_ENTREGA,
  PRESUPUESTO,
  SOLAR,
  type EtapaDef,
  type Partida,
  type PersonaBase,
} from "./datos.ts";

export interface ContratoDef {
  id: string;
  cliente: string;
  obra: string;
  /** Precio del contrato en P$. */
  presupuesto: number;
  adelanto: number;
  kit: number;
  cajaInicial: number;
  direccionDia: number;
  /** Día de entrega. Se cobra un bono por cada día que se entregue antes. */
  plazo: number;
  bonoDia: number;
  partidas: Record<Partida, number>;
  partidasTotal: number;
  etapas: EtapaDef[];
  solar: { x0: number; x1: number; y0: number; y1: number };
  cuadrilla: PersonaBase[];
  dia1: PersonaBase[];
}

export const CASETA: ContratoDef = Object.freeze({
  id: "caseta",
  cliente: "Doña Carmen",
  obra: "Caseta de block 3x4",
  presupuesto: CONTRATO,
  adelanto: ANTICIPO,
  kit: KIT_PRECIO,
  cajaInicial: CAJA_INICIAL,
  direccionDia: DIRECCION_DIA,
  plazo: PLAZO_ENTREGA,
  bonoDia: BONO_DIA,
  partidas: PRESUPUESTO,
  partidasTotal: Object.values(PRESUPUESTO).reduce((a, b) => a + b, 0),
  etapas: ETAPAS,
  solar: SOLAR,
  cuadrilla: CUADRILLA,
  dia1: DIA1,
}) as ContratoDef;

export const CONTRATOS: Record<string, ContratoDef> = { caseta: CASETA };
export const CONTRATO_INICIAL = "caseta";

/** Contrato activo de una partida. Sin campo `contrato` (guardados 1.0) es la caseta. */
export function contratoDe(s?: { contrato?: string } | null): ContratoDef {
  return (s?.contrato && CONTRATOS[s.contrato]) || CASETA;
}

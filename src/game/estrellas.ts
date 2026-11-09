import { PLAZO_ENTREGA, peso } from "./datos.ts";
import { informe, type Estado } from "./motor.ts";

/** Ganancia mínima para la segunda estrella. Un jugador atento normal (día ~25) la pasa. */
export const GANANCIA_PARA_ESTRELLA = 50_000;
/** Ganancia, junto con el día y la obra limpia, para la tercera. El experto casi siempre llega; el atento normal, no. */
export const GANANCIA_OBRA_MAESTRA = 75_000;
/** Hay que entregar este día o antes para la tercera estrella. El plazo del contrato sigue siendo el día 30. */
export const DIA_OBRA_MAESTRA = 21;
export const ETAPAS_A_LA_PRIMERA = 9;

export type IdEstrella = "plazo" | "cuenta" | "maestra";

export type Estrella = {
  id: IdEstrella;
  nombre: string;
  ganada: boolean;
  texto: string;
};

export type DatosEstrellas = {
  entregada: boolean;
  dia: number;
  ganancia: number;
  desplomes: number;
  aprobadasPrimera: number;
};

export type Calificacion = {
  estrellas: number;
  detalle: Estrella[];
  entregada: boolean;
};

export function calificarDatos(d: DatosEstrellas): Calificacion {
  if (!d.entregada) {
    return {
      estrellas: 0,
      entregada: false,
      detalle: [
        {
          id: "plazo",
          nombre: "A tiempo",
          ganada: false,
          texto: "Sin estrellas: la obra no se entregó.",
        },
      ],
    };
  }
  const aTiempo = d.dia <= PLAZO_ENTREGA;
  const conCuenta = d.ganancia + 0.5 >= GANANCIA_PARA_ESTRELLA;
  const limpia = d.desplomes === 0 && d.aprobadasPrimera >= ETAPAS_A_LA_PRIMERA;
  const maestra = d.dia <= DIA_OBRA_MAESTRA && d.ganancia + 0.5 >= GANANCIA_OBRA_MAESTRA && limpia;
  const detalle: Estrella[] = [
    {
      id: "plazo",
      nombre: "A tiempo",
      ganada: aTiempo,
      texto: aTiempo
        ? `Entregaste el día ${d.dia}, dentro del plazo (día ${PLAZO_ENTREGA}).`
        : `Entregaste el día ${d.dia}, después del día ${PLAZO_ENTREGA}.`,
    },
    {
      id: "cuenta",
      nombre: "Con ganancia",
      ganada: conCuenta,
      texto: conCuenta
        ? `Ganancia ${peso(d.ganancia)}. Para esta estrella bastan ${peso(GANANCIA_PARA_ESTRELLA)}.`
        : `Ganancia ${peso(d.ganancia)}. Para esta estrella hacen falta ${peso(GANANCIA_PARA_ESTRELLA)}.`,
    },
    {
      id: "maestra",
      nombre: "Obra maestra",
      ganada: maestra,
      texto: maestra
        ? `Día ${d.dia}, ganancia ${peso(d.ganancia)}, sin desplomes y las ${ETAPAS_A_LA_PRIMERA} etapas a la primera.`
        : faltaMaestra(d, limpia),
    },
  ];
  return { estrellas: detalle.filter((e) => e.ganada).length, detalle, entregada: true };
}

function faltaMaestra(d: DatosEstrellas, limpia: boolean): string {
  const partes: string[] = [];
  if (d.dia > DIA_OBRA_MAESTRA) partes.push(`entregaste el día ${d.dia} (hace falta el día ${DIA_OBRA_MAESTRA} o antes)`);
  if (d.ganancia + 0.5 < GANANCIA_OBRA_MAESTRA) partes.push(`la ganancia fue ${peso(d.ganancia)} (hacen falta ${peso(GANANCIA_OBRA_MAESTRA)})`);
  if (d.desplomes > 0) partes.push(d.desplomes === 1 ? "hubo 1 desplome" : `hubo ${d.desplomes} desplomes`);
  if (d.aprobadasPrimera < ETAPAS_A_LA_PRIMERA)
    partes.push(`${d.aprobadasPrimera} de ${ETAPAS_A_LA_PRIMERA} etapas a la primera`);
  if (!partes.length && !limpia) partes.push("la obra no quedó limpia");
  return `Te faltó: ${partes.join("; ")}.`;
}

export function calificar(s: Estado): Calificacion {
  const inf = informe(s);
  return calificarDatos({
    entregada: s.entregada,
    dia: s.dia,
    ganancia: inf.ganancia,
    desplomes: s.desplomes,
    aprobadasPrimera: s.stats.aprobadasPrimera,
  });
}

export function fraseEstrellas(n: number): string {
  if (n >= 3) return "¡Obra maestra!";
  if (n === 2) return "Buen trabajo, maestro.";
  if (n === 1) return "La entregaste.";
  return "La entregaste, sin estrella.";
}

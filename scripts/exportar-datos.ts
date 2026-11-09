/**
 * Escribe python/datos_juego.json con los números de src/game/datos.ts.
 *
 * No entra al juego: Vite solo empaqueta lo que importa src/.
 * Se corre con: npm run exportar-datos
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ANTICIPO,
  BONO_DIA,
  CAJA_INICIAL,
  CONTRATO,
  DIRECCION_DIA,
  ETAPAS,
  FLETE,
  FLETE_URGENTE,
  JORNAL_BASE,
  KIT_PRECIO,
  MATERIALES,
  OFICIO_NOMBRE,
  PARTIDAS,
  PARTIDA_NOMBRE,
  PLAZO_ENTREGA,
  PRESUPUESTO,
  PRESUPUESTO_TOTAL,
} from "../src/game/datos.ts";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const salida = join(raiz, "python", "datos_juego.json");

const presupuesto = PARTIDAS.map((id) => ({
  id,
  nombre: PARTIDA_NOMBRE[id],
  monto: PRESUPUESTO[id],
}));

const presupuestoPorNombre: Record<string, number> = {};
for (const fila of presupuesto) presupuestoPorNombre[fila.nombre] = fila.monto;

const materiales = Object.entries(MATERIALES).map(([id, mat]) => ({
  id,
  nombre: mat.nombre,
  unidad: mat.unidad,
  precio: mat.precio,
  paso: mat.paso,
  compra: mat.compra,
}));

const jornales = (Object.keys(JORNAL_BASE) as (keyof typeof JORNAL_BASE)[]).map((id) => ({
  id,
  nombre: OFICIO_NOMBRE[id],
  jornal: JORNAL_BASE[id],
}));

const etapas = ETAPAS.map((etapa) => ({
  id: etapa.id,
  n: etapa.n,
  nombre: etapa.nombre,
}));

const datos = {
  nota: "Generado por npm run exportar-datos desde src/game/datos.ts. No lo edites a mano.",
  contrato: CONTRATO,
  anticipo: ANTICIPO,
  plazo_dias: PLAZO_ENTREGA,
  caja_inicial: CAJA_INICIAL,
  kit_precio: KIT_PRECIO,
  direccion_dia: DIRECCION_DIA,
  bono_dia: BONO_DIA,
  flete: FLETE,
  flete_urgente: FLETE_URGENTE,
  presupuesto_total: PRESUPUESTO_TOTAL,
  presupuesto,
  presupuesto_por_nombre: presupuestoPorNombre,
  materiales,
  jornales,
  etapas,
};

writeFileSync(salida, `${JSON.stringify(datos, null, 2)}\n`);
console.log(`Listo: ${salida}`);
console.log(`Contrato P$${CONTRATO.toLocaleString("en-US")} · presupuesto P$${PRESUPUESTO_TOTAL.toLocaleString("en-US")}`);

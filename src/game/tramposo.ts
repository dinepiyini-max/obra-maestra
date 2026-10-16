// v24: bot «tramposo». Juega como humano, pero cada media hora intenta fabricar dinero: comprar y devolver,
// abusar del fiado y del adelanto, pagar la nómina dos veces, despedir y recontratar, cobrar el sello dos veces.
// Cada truco se mide solo (sin que pase el tiempo): si el patrimonio sube y la obra no avanzó, es un truco que funciona.
import { correr, type Clima } from "./auditoria_sim.ts";
import { PERFILES } from "./sim_v18.ts";
import { MATERIALES, type Mat } from "./datos.ts";
import {
  adelantar,
  aceptarRescate,
  confirmarNomina,
  continuarSello,
  contratar,
  despedir,
  fiar,
  marcarLibre,
  pedir,
  terminarJornada,
  type Estado,
} from "./motor.ts";

/** Lo que vale la obra para el maestro: caja y material, menos lo que debe (nómina, fiado y adelanto). */
export function patrimonio(s: Estado): number {
  let v = s.caja;
  for (const sl of Object.values(s.inv)) v += sl?.valor ?? 0;
  for (const sl of Object.values(s.entrada)) v += sl?.valor ?? 0;
  for (const p of s.pedidos) for (const [k, n] of Object.entries(p.items)) v += (n ?? 0) * MATERIALES[k as Mat].precio;
  for (const m of s.mezclas) v += m.lista ? m.costo * m.restante : m.costo;
  return v - (s.deudaNomina ?? 0) - (s.fiado ?? 0) - (s.adelanto ?? 0);
}

/** Avance de obra: etapas selladas y todo lo hecho. */
export function avance(s: Estado): number {
  let a = s.etapa * 1e6;
  for (const lista of s.runs) for (const r of lista ?? []) a += r.hecho;
  for (const e of s.extras) a += e.hecho;
  return a;
}

export interface Truco {
  truco: string;
  dia: number;
  minuto: number;
  sube: number;
}

export function jugarTramposo(seed: number, clima: Clima = "normal", precios: number | null = 0.15, otro?: (s: Estado, paso: string) => void) {
  const encontrados: Truco[] = [];
  let ultimo = -1;
  const hechos = new Set<string>();
  /** Cada truco una vez por día (los que estropean la obra, una vez por partida), para que la obra siga. */
  const vez = (k: string) => {
    if (hechos.has(k)) return false;
    hechos.add(k);
    return true;
  };
  const probar = (s: Estado, nombre: string, fn: () => void) => {
    if (s.entregada) return;
    const p0 = patrimonio(s);
    const a0 = avance(s);
    const c0 = s.cobrado;
    fn();
    const sube = patrimonio(s) - p0;
    const avanzo = avance(s) !== a0;
    // Lo que entra por un sello de verdad (cobrado sube con avance) no cuenta.
    if (sube > 0.5 && !avanzo) encontrados.push({ truco: nombre, dia: s.dia, minuto: s.minuto, sube: Math.round(sube * 100) / 100 });
    void c0;
  };
  const chequeo = (s: Estado, paso: string) => {
    otro?.(s, paso);
    if (paso === "sello") probar(s, "cobrar el sello dos veces", () => continuarSello(s));
    if (paso !== "tick" || s.entregada) return;
    const t = s.dia * 1440 + s.minuto;
    if (t - ultimo < 30) return;
    ultimo = t;
    if (s.etapa >= 1 && vez("compra")) probar(s, "comprar y devolver en la Ferretería", () => {
      // Llena el almacén y luego pide otra cosa del mismo grupo: el guardalmacén devuelve sobrantes «para hacer sitio».
      pedir(s, { arena: 2, grava: 2 }, false);
      pedir(s, { arena: 4, grava: 4 }, true);
    });
    probar(s, "fiado repetido", () => {
      for (let i = 0; i < 3; i++) fiar(s);
    });
    probar(s, "adelanto y rescate repetidos", () => {
      for (let i = 0; i < 3; i++) adelantar(s);
      for (let i = 0; i < 2; i++) aceptarRescate(s);
    });
    if (s.minuto >= 15 * 60 && vez("nomina" + s.dia)) probar(s, "pagar la nómina dos veces", () => {
      confirmarNomina(s, true);
      confirmarNomina(s, false);
    });
    if (s.minuto < 9 * 60 && s.dia >= 2 && vez("despedir")) probar(s, "despedir y recontratar el mismo día", () => {
      const g = s.gente.find((x) => x.oficio === "peon" || x.oficio === "ayudante");
      if (!g) return;
      despedir(s, g.id);
      contratar(s, g.id);
    });
    if (vez("libre" + s.dia)) probar(s, "libre y de vuelta", () => {
      const g = s.gente[0];
      if (!g) return;
      marcarLibre(s, g.id, true);
      marcarLibre(s, g.id, false);
    });
    if (s.minuto >= 15 * 60 + 30) probar(s, "terminar la jornada dos veces", () => {
      terminarJornada(s);
      terminarJornada(s);
    });
    if (s.panel && s.panel !== "informe" && s.panel !== "sello" && s.panel !== "finde" && s.panel !== "nomina") s.panel = null;
  };
  const r = correr(seed, { ...PERFILES.humano!, nombre: "tramposo" }, clima, precios, chequeo);
  return { ...r, encontrados };
}

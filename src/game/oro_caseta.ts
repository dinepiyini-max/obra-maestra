// Huella de la caseta de Doña Carmen: 3 perfiles × 3 climas × 40 semillas.
import { correr, BOTS, type Clima } from "./auditoria_sim.ts";
export const PERFILES = ["principiante", "intermedio", "experto"] as const;
export const CLIMAS: Clima[] = ["poca", "normal", "mucha"];
export function huella(perfil: string, clima: Clima, seed: number) {
  const r = correr(seed, BOTS[perfil]!, clima, 0.15);
  const s = r.s as any;
  return {
    perfil, clima, seed,
    entregada: !!s.entregada, perdida: !!r.perdida, dia: s.dia, etapa: s.etapa,
    caja: Math.round(s.caja * 100) / 100,
    ganancia: Math.round(r.inf.ganancia * 100) / 100,
    precio: s.precio, fletes: s.stats?.fletes ?? null,
  };
}
export function tabla() {
  const out = [];
  for (const p of PERFILES) for (const c of CLIMAS) for (let seed = 1; seed <= 40; seed++) out.push(huella(p, c, seed));
  return out;
}
if (process.argv[1]?.endsWith("oro_caseta.ts")) console.log(JSON.stringify(tabla()));

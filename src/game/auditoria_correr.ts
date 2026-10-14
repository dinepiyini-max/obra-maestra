import { correr, BOTS, ESTRATEGIAS } from "./auditoria_sim.ts";
const [grupo, clave, clima] = process.argv.slice(2);
const cfg = (grupo === "bot" ? BOTS : ESTRATEGIAS)[clave!]!;
const desde = Number(process.env.DESDE || 1), hasta = Number(process.env.HASTA || 40);
for (let seed = desde; seed <= hasta; seed++) {
  const r = correr(seed, cfg, clima as any, 0.15);
  console.log(JSON.stringify({ grupo, clave, clima, seed, ent: r.s.entregada, perdida: r.perdida, dia: r.s.dia, gan: Math.round(r.inf.ganancia), fletes: r.s.stats.fletes, etapa: r.s.etapa }));
}

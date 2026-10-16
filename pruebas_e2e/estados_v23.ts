import { nueva, firmar, contratar } from "../src/game/motor.ts";
import { ETAPAS, POR_HILADA } from "../src/game/datos.ts";
import { writeFileSync } from "node:fs";
const cp = (x: unknown) => JSON.parse(JSON.stringify(x));
const base = (etapa: number, dia: number) => {
  const s = nueva(5); firmar(s);
  for (const c of s.candidatos.slice(0, 3)) contratar(s, c.id);
  s.panel = null; s.tut.fin = true; s.avisos = [];
  s.etapa = etapa; for (let i = 0; i < etapa; i++) { s.etapas[i]!.sello = "aprobado"; for (const t of ETAPAS[i]!.trabajos) { const r = s.runs[i]!.find((x) => x.id === t.id); if (r) r.hecho = t.q; } }
  s.dia = dia; s.minuto = 9 * 60; s.mezclas = []; s.plomo = null; s.fragua = null; s.curando = false;
  for (const g of s.gente) g.puesto = "obra" as any;
  return s;
};
const out: Record<string, unknown> = {};
// Entrega: techo casi listo, deuda de nómina P$13,484, adelanto y fiado vivos, día 25 (bono 5 días).
const e = base(8, 25); for (const t of ETAPAS[8]!.trabajos) s8(e, t);
function s8(s: any, t: any) { s.runs[8].find((r: any) => r.id === t.id).hecho = t.q; }
e.runs[8][0].hecho -= 0.0004; e.caja = 26000; e.deudaNomina = 13484; e.adelanto = 5000; e.fiado = 3000; e.inv = cp(nueva(5).inv);
out.entrega = cp(e);
// Reloj: a media mañana, para abrir Ferretería y Pausa.
const r = base(4, 9); r.minuto = 10 * 60 + 20; out.reloj = cp(r);
// Muros: block a 4 hiladas, con mortero listo y material.
const m = base(4, 9); m.minuto = 10 * 60; m.runs[4]!.find((x) => x.id === "block")!.hecho = 4 * POR_HILADA; m.plumbed = [3 * POR_HILADA];
m.inv.block.q = 300; m.inv.block.valor = 300 * 55.4; m.inv.cemento.q = 12; m.inv.cemento.valor = 12 * 600; m.inv.arena.q = 2; m.inv.arena.valor = 2 * 1800;
m.mezclas = [{ tipo: "M", prog: 1, lista: true, vida: 140, costo: 471, restante: 1 } as any];
m.jugador = { x: 17, y: 14.5 };
out.muros = cp(m);
writeFileSync(new URL("./estados_v23.json", import.meta.url), JSON.stringify(out));
console.log("ok", Object.keys(out));

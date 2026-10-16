// v18: tabla de 40 obras por perfil, con lluvia y precios variables, y control de caja en cada paso.
// Uso: node --experimental-strip-types src/game/sim_v18.ts <perfil> [desde] [hasta]
import { correr, BOTS, jugarPasivo, ponerPrecios, type Cfg, type Clima } from "./auditoria_sim.ts";
import { MATERIALES } from "./datos.ts";
import type { Estado } from "./motor.ts";

/** Igual que cuadreCaja de motor.test.ts: caja − (cobrado − todo lo gastado o guardado). */
export function cuadreCaja(s: Estado): number {
  let costos = 0;
  for (const p of Object.values(s.costos)) costos += (p?.mo ?? 0) + (p?.mat ?? 0);
  const valor = (obj: Partial<Record<string, { valor: number } | undefined>>) => {
    let n = 0;
    for (const sl of Object.values(obj)) n += sl?.valor ?? 0;
    return n;
  };
  let camino = 0;
  for (const p of s.pedidos) for (const [k, n] of Object.entries(p.items)) camino += (n ?? 0) * MATERIALES[k as keyof typeof MATERIALES].precio;
  let mezcla = 0;
  for (const m of s.mezclas) mezcla += m.lista ? m.costo * m.restante : m.costo;
  let mo = 0;
  if (!s.nominaPagada) for (const g of s.gente) if (g.activo && !g.falto) mo += g.moHoy;
  const esperado = s.cobrado + (s.fiado ?? 0) - (costos + valor(s.inv) + valor(s.entrada) + camino + mezcla - mo - (s.deudaNomina ?? 0));
  return Math.round((s.caja - esperado) * 100) / 100;
}

export const PERFILES: Record<string, Cfg> = {
  principiante: { ...BOTS.principiante!, nombre: "principiante", sugerida: true },
  humano: { nombre: "humano", cupo: 4, orden: "lista", horaPedido: 9 * 60, siguiente: false, olvido: 0.2, errorPuesto: 0.15, golpeCada: 15, fallaPlomo: 0.2, urgente: false, soloSita: false, cortarTemprano: false, sugerida: true },
  // v23: humano lento: los mismos errores que humano, pero reacciona a un tercio de la velocidad
  // (revisa la obra cada 45 min, golpea cada 45, pide 30 min más tarde y tarda 15 min en plomear).
  humano_lento: { nombre: "humano_lento", cupo: 4, orden: "lista", horaPedido: 9 * 60, siguiente: false, olvido: 0.2, errorPuesto: 0.15, golpeCada: 45, fallaPlomo: 0.2, urgente: false, soloSita: false, cortarTemprano: false, sugerida: true, reaccion: 3 },
  // intermedio: el bot de v16/v17, pero contratando la cuadrilla sugerida (comete menos errores que humano).
  intermedio: { ...BOTS.intermedio!, sugerida: true },
  // El bot de v17 tal cual (4 primeros de la lista, sin mirar la sugerida), para comparar.
  intermedio_sin_sugerida: BOTS.intermedio!,
  // v18: el experto de v16/v17 contrataba 5 con 2 albañiles y se comía la caja (ver informe). Ahora usa la sugerida
  // y juega igual de fino (golpe cada 5 min, sin olvidos ni errores de puesto, pide temprano y la etapa siguiente).
  // v19: experto = 4 con 2 albañiles (sin la sugerida): entrega antes y cobra el bono.
  experto: BOTS.experto!,
  // v20: imita al revisor a mano: 6 de la lista, pide tarde (2 pm), olvida, no reserva nómina, «Pedir lo que alcanza».
  torpe: { nombre: "torpe", cupo: 6, orden: "lista", horaPedido: 14 * 60, siguiente: false, olvido: 0.3, errorPuesto: 0.2, golpeCada: 20, fallaPlomo: 0.3, urgente: false, soloSita: false, cortarTemprano: false, torpe: true },
};

function climaDe(seed: number): Clima {
  return (["poca", "normal", "mucha"] as const)[(seed * 7 + 3) % 3]!;
}

if (process.argv[1]?.endsWith("sim_v18.ts")) main();
function main() {
const [perfil, a, b] = process.argv.slice(2);
const desde = Number(a ?? 1), hasta = Number(b ?? 40);
for (let seed = desde; seed <= hasta; seed++) {
  const clima = climaDe(seed);
  let pasos = 0, difs = 0, peor = 0, ultimoCobrado = 0, ultimoCaja = NaN;
  let movs = 0;
  const chequeo = (s: Estado) => {
    pasos++;
    if (s.caja !== ultimoCaja || s.cobrado !== ultimoCobrado) movs++;
    ultimoCaja = s.caja; ultimoCobrado = s.cobrado;
    const d = cuadreCaja(s);
    if (Math.abs(d) > 0.5) { difs++; peor = Math.max(peor, Math.abs(d)); }
  };
  let r: { s: any; inf: any; perdida?: boolean };
  if (perfil === "pasivo") {
    ponerPrecios(seed, 0.15);
    r = jugarPasivo(seed);
    chequeo(r.s);
    ponerPrecios(seed, null);
  } else r = correr(seed, PERFILES[perfil!]!, clima, 0.15, chequeo);
  console.log(JSON.stringify({ perfil, seed, clima, ent: r.s.entregada, perdida: !!r.perdida || r.s.panel === "perdida", dia: r.s.dia, gan: Math.round(r.inf.ganancia), caja: Math.round(r.s.caja), adelantos: (r.s.adelantoDia > 0 ? 1 : 0), rescate: !!r.s.rescateUsado, pasos, movs, difs, peor, gente: r.s.gente.length, sinSalida: (r as any).sinSalida ?? 0, fiado: !!r.s.diario?.some((d: any) => /fía/.test(d.texto)) }));
}
}

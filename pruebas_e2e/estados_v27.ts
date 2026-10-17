// v27: estados para las capturas y la partida de teléfono. Uso: node --experimental-strip-types pruebas_e2e/estados_v27.ts
import { writeFileSync } from "node:fs";
import { ETAPAS } from "../src/game/datos.ts";
import { avanzarMinutos, confirmarNomina, contratar, firmar, hablarSita, nueva, siguienteDia, type Estado } from "../src/game/motor.ts";
import { correr } from "../src/game/auditoria_sim.ts";
import { PERFILES } from "../src/game/sim_v18.ts";

function obraEn(etapa: number, n = 3, seed = 5): Estado {
  const s = nueva(seed);
  firmar(s);
  for (const c of s.candidatos.slice(0, n)) contratar(s, c.id);
  s.panel = null;
  s.tut.fin = true;
  s.avisos = [];
  for (let i = 0; i < etapa; i++) {
    s.etapas[i]!.sello = "aprobado";
    for (const t of ETAPAS[i]!.trabajos) {
      const r = s.runs[i]!.find((x) => x.id === t.id);
      if (r) r.hecho = t.q;
    }
  }
  s.etapa = etapa;
  s.selloDia = s.dia;
  s.minuto = 9 * 60;
  return s;
}
const E: Record<string, unknown> = {};

// Hallazgo 1: Replanteo (no compra), caja P$0 → el guardalmacén ofrece la próxima que compra.
{
  const s = obraEn(0, 3, 11);
  s.caja = 0;
  s.cobrado = 0;
  s.adelantoDia = 1;
  s.jugador = { x: 5.4, y: 14.5 };
  hablarSita(s);
  E.siguiente = s;
}
// Hallazgo 2: Muros sin material y caja P$0, el maestro frente a la Ferretería.
{
  const s = obraEn(4, 3, 12);
  s.caja = 0;
  s.adelantoDia = 1;
  s.jugador = { x: 30, y: 21.4 };
  E.ferreteria = s;
}
// Hallazgo 3: el caso del Revisor tras dos nóminas cortas (un solo obrero, muros al 85 %).
{
  const s = obraEn(4, 1, 13);
  s.caja = 0;
  s.adelantoDia = 1;
  s.adelanto = 20000;
  const b = s.runs[4]!.find((r) => r.id === "block")!;
  b.hecho = ETAPAS[4]!.trabajos.find((t) => t.id === "block")!.q * 0.85;
  for (let d = 0; d < 2; d++) {
    s.minuto = 15 * 60 - 1;
    s.panel = null;
    s.lluvias = [];
    avanzarMinutos(s, 2);
    if (s.panel === "nomina") confirmarNomina(s, false);
    if (d === 0) {
      s.panel = "finde";
      s.nominaPagada = true;
      siguienteDia(s);
      s.caja = 0;
    }
  }
  s.panel = null;
  E.nomina = s;
}
// Hallazgo 4: guardado de una obra perdida (como lo dejaba la v26 al pasar a segundo plano).
{
  const s = obraEn(4, 1, 14);
  s.gente = [];
  s.reserva = [];
  s.panel = "perdida";
  E.perdida = s;
}
// Hallazgo 5: despedir a las 10:00 con la cuadrilla trabajando.
{
  const s = obraEn(4, 3, 15);
  s.minuto = 10 * 60;
  E.despedir = s;
}
// Partida de «humano normal» (perfil humano de la tabla, lluvia y precios variables): un estado por etapa y la entrega.
{
  const seed = Number(process.env.SEMILLA ?? 7);
  const hitos: Estado[] = [];
  let ult = -1;
  const r = correr(seed, PERFILES.humano!, (["poca", "normal", "mucha"] as const)[(seed * 7 + 3) % 3]!, 0.15, (s) => {
    if (s.etapa !== ult && !s.panel && s.minuto >= 9 * 60 && s.minuto < 14 * 60) {
      ult = s.etapa;
      hitos.push(JSON.parse(JSON.stringify(s)));
    }
  });
  const fin = JSON.parse(JSON.stringify(r.s)) as Estado;
  E.humano = { seed, hitos, fin, entregada: r.s.entregada, dia: r.s.dia, caja: Math.round(r.s.caja), ganancia: Math.round(r.inf.ganancia) };
}
writeFileSync(new URL("./estados_v27.json", import.meta.url), JSON.stringify(E));
console.log("ok", Object.keys(E).join(","), "humano:", JSON.stringify({ ...(E.humano as object), hitos: undefined, fin: undefined }));

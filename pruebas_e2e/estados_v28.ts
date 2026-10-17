// v28: estados para las capturas y la partida de teléfono. Uso: node --experimental-strip-types pruebas_e2e/estados_v28.ts
import { writeFileSync } from "node:fs";
import { ETAPAS } from "../src/game/datos.ts";
import { contratar, firmar, hablarSita, nueva, type Estado } from "../src/game/motor.ts";
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

// Hallazgo 1: Viga de amarre sin cemento, arena ni grava y la caja corta: la hoja pide lo de esta etapa y la siguiente
// (techo) no sale sola.
{
  const s = obraEn(7, 3, 21);
  for (const m of ["cemento", "arena", "grava", "pino", "abeto", "plywood", "zinc", "clavo", "clavoTecho"] as const) {
    s.inv[m].q = 0;
    s.inv[m].valor = 0;
    const e = s.entrada[m];
    if (e) e.q = 0;
  }
  s.cementoAfuera = 0;
  s.pedidos = [];
  s.cargas = [];
  s.minuto = 14 * 60 + 21;
  s.caja = 12000;
  s.jugador = { x: 5.4, y: 14.5 };
  hablarSita(s);
  E.viga = s;
}
// Hallazgo 2: el guardalmacén sale a las 14:00 y el maestro está detrás del almacén (antes el reloj quedaba parado).
{
  const s = obraEn(4, 3, 22);
  s.minuto = 14 * 60;
  s.jugador = { x: 8, y: 17 };
  s.destino = null;
  s.sita!.oferta = { items: { cemento: 1 }, urgente: false, mats: 550, flete: 1500, total: 2050, texto: "Para mañana faltan:\n1 funda" };
  s.sita!.fase = "yendo";
  s.sita!.x = 3;
  s.sita!.y = 3;
  E.reloj = s;
}
// Hallazgo 2b: «Reportar» con la cuadrilla trabajando a las 14:30.
{
  const s = obraEn(4, 3, 23);
  s.minuto = 14 * 60 + 30;
  E.reporte = s;
}
// Hallazgo 3: despedir a las 10:00 con la cuadrilla trabajando.
{
  const s = obraEn(4, 3, 15);
  s.minuto = 10 * 60;
  E.despedir = s;
}
// Hallazgo 5: «Libre mañana» en la Cuadrilla.
{
  const s = obraEn(4, 3, 24);
  s.minuto = 11 * 60;
  E.libre = s;
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
writeFileSync(new URL("./estados_v28.json", import.meta.url), JSON.stringify(E));
console.log("ok", Object.keys(E).join(","), "humano:", JSON.stringify({ ...(E.humano as object), hitos: undefined, fin: undefined }));

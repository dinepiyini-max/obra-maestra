import { correr } from "../src/game/auditoria_sim.ts";
import { PERFILES } from "../src/game/sim_v18.ts";
import { laborDe, cuelloLabor, type Estado } from "../src/game/motor.ts";
const [perfil, seedS, diaS] = process.argv.slice(2);
const seed = Number(seedS), dia = Number(diaS);
let prevN = 0, prevM = "";
try {
correr(seed, PERFILES[perfil!]!, (["poca","normal","mucha"] as const)[(seed*7+3)%3], 0.15, (s: Estado, paso) => {
  if (s.dia < dia) return;
  if (s.dia > dia) throw new Error("fin");
  const ms = s.mezclas.map(m => `${m.tipo}${m.lista ? "L" + m.vida + "/" + m.restante.toFixed(2) : "c" + m.prog.toFixed(2)}`).join(" ");
  const n = (s.perdidasHoy ?? []).filter((x) => /Mortero vencido/.test(x.texto)).length;
  if (ms !== prevM || n !== prevN) {
    const h = `${Math.floor(s.minuto/60)}:${String(s.minuto%60).padStart(2,"0")}`;
    console.log(h, paso, "mez[", ms, "] venc", n, "plomo", !!s.plomo, "blocksHoy", Math.round(s.blocksHoy), "blockInv", Math.round(s.inv.block?.q ?? 0), "cem", (s.inv.cemento?.q??0).toFixed(1), s.gente.map(g => g.oficio[0]+":"+g.puesto+":"+laborDe(s,g)+(g.trabajando?"*":"")+(g.fuera?"F":"")).join(","), "|", cuelloLabor(s));
    prevM = ms; prevN = n;
  }
});
} catch (e) { if (!String(e).includes("fin")) throw e; }

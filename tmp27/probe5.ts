import { correr } from "../src/game/auditoria_sim.ts";
import { PERFILES } from "../src/game/sim_v18.ts";
import { laborDe, type Estado } from "../src/game/motor.ts";
const perfiles = process.argv.slice(2);
for (const p of perfiles) {
  let peor = 0, donde = "";
  for (let seed = 1; seed <= 8; seed++) {
    correr(seed, PERFILES[p]!, (["poca","normal","mucha"] as const)[(seed*7+3)%3], 0.15, (s: Estado) => {
      const n = (s.perdidasHoy ?? []).filter((x) => /Mortero vencido/.test(x.texto)).length;
      if (n > peor) { peor = n; donde = `seed ${seed} dia ${s.dia} etapa ${s.etapa} gente ${s.gente.map(g=>g.oficio+":"+g.puesto+":"+laborDe(s,g)).join(",")}`; }
    });
  }
  console.log(p, "max mortero vencido/día", peor, donde);
}

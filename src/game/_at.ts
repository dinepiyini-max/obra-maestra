import { jugarAtento } from "./auditoria_sim.ts";
const [cupo, a, b] = process.argv.slice(2).map(Number);
for (let sd = a!; sd <= b!; sd++) { const r = jugarAtento(sd, cupo!); console.log(JSON.stringify({ cupo, sd, ent: r.s.entregada, dia: r.s.dia })); }

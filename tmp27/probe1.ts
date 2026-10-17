import { correr } from "../src/game/auditoria_sim.ts";
import { PERFILES } from "../src/game/sim_v18.ts";
import { hablarSita, loQueFalta, cuentaPedido, type Estado } from "../src/game/motor.ts";
import { MATERIALES } from "../src/game/datos.ts";
const vistos = new Set<string>();
for (const perfil of ["humano", "sinAyuda"]) {
  correr(3, PERFILES[perfil]!, "normal", 0.15, (s0: Estado) => {
    if (s0.panel || s0.minuto % 60 !== 0) return;
    const s = JSON.parse(JSON.stringify(s0)) as Estado;
    if (Object.keys(loQueFalta(s)).length) return;
    const k = perfil + s.etapa + (s.pedidos.length > 0);
    if (vistos.has(k)) return; vistos.add(k);
    hablarSita(s);
    const of = s.sita.oferta;
    const tot = of?.siguiente ? Object.entries(of.siguiente).reduce((a, [m, n]) => a + (n ?? 0) * MATERIALES[m as keyof typeof MATERIALES].precio, 0) : 0;
    console.log(perfil, "etapa", s.etapa, "dia", s.dia, "caja", Math.round(s.caja), "pedidos", s.pedidos.length, "oferta", !!of, "sig", JSON.stringify(of?.siguiente), "alcanza", of?.siguiente ? cuentaPedido(s, tot + 1000).alcanza : "-", of ? "" : "(sin oferta)");
  });
}

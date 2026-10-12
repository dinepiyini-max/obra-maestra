import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FLETE, FLETE_URGENTE, MATERIALES, type Mat } from "./datos.ts";
import {
  adelantar,
  asignar,
  confirmarNomina,
  continuarSello,
  contratar,
  firmar,
  informe,
  nueva,
  pedir,
  pronosticoDia,
  reloj,
  siguienteDia,
  tick,
  type Estado,
} from "./motor.ts";

function valorMapa(obj: Partial<Record<Mat, { q: number; valor: number }>> | Record<string, { q: number; valor: number } | undefined>): number {
  let n = 0;
  for (const sl of Object.values(obj)) n += sl?.valor ?? 0;
  return n;
}

export function descuadre(s: Estado): number {
  let costos = 0;
  for (const p of Object.values(s.costos)) costos += (p?.mo ?? 0) + (p?.mat ?? 0);
  const alm = valorMapa(s.inv);
  const entrada = valorMapa(s.entrada);
  let camino = 0;
  for (const p of s.pedidos) {
    for (const [k, n] of Object.entries(p.items) as [Mat, number][]) camino += (n ?? 0) * MATERIALES[k].precio;
  }
  let mezcla = 0;
  for (const m of s.mezclas) mezcla += m.lista ? m.costo * m.restante : m.costo;
  let mo = 0;
  if (!s.nominaPagada) {
    for (const g of s.gente) if (g.activo && !g.falto) mo += g.moHoy;
  }
  const esperado = s.cobrado - (costos + alm + entrada + camino + mezcla - mo);
  return Math.round((s.caja - esperado) * 100) / 100;
}

function atender(s: Estado) {
  if (s.panel === "nomina") confirmarNomina(s, true);
  if (s.panel === "sello") continuarSello(s);
  if (s.panel === "finde") siguienteDia(s);
}

describe("dinero", () => {
  it("la caja cuadra en cada paso y el flete es 1500 o 3000", () => {
    const s = nueva(2);
    firmar(s);
    assert.ok(Math.abs(descuadre(s)) < 1, "firma " + descuadre(s));
    const alba = s.candidatos.filter((c) => c.oficio === "albanil").slice(0, 2);
    const ayuda = s.candidatos.filter((c) => c.oficio === "ayudante").slice(0, 2);
    for (const c of [...alba, ...ayuda]) contratar(s, c.id);
    for (const g of s.gente) asignar(s, g.id, g.oficio === "albanil" ? "obra" : "batea");
    const err = pedir(s, { cemento: 10, block: 200, arena: 2, grava: 1 }, false);
    assert.equal(err, null);
    for (const p of s.pedidos) assert.ok(p.flete === FLETE || p.flete === FLETE_URGENTE, String(p.flete));
    assert.ok(Math.abs(descuadre(s)) < 1, "pedido " + descuadre(s));
    let guard = 0;
    while (!s.entregada && s.panel !== "perdida" && guard < 8000) {
      guard++;
      atender(s);
      if (s.panel && s.panel !== "informe") s.panel = null;
      tick(s, 0.2);
      const d = descuadre(s);
      assert.ok(Math.abs(d) < 2, `paso ${guard} día ${s.dia} ${s.minuto} descuadre ${d}`);
      if (s.caja < 4000 && s.adelantoDia !== s.dia) adelantar(s);
    }
    if (s.entregada) assert.equal(s.adelanto, 0, "adelanto al entregar " + s.adelanto);
    void informe;
  });

  it("la misma semilla llueve igual y el domingo sin riego no cura", () => {
    const a = nueva(7);
    const b = nueva(7);
    firmar(a);
    firmar(b);
    assert.deepEqual(
      a.lluvias.map((r) => [r.dia, r.ini, r.prob, r.cae]),
      b.lluvias.map((r) => [r.dia, r.ini, r.prob, r.cae]),
    );
    let n = 0;
    let caen = 0;
    let suma = 0;
    for (let i = 1; i <= 40; i++) {
      const s = nueva(i);
      for (const r of s.lluvias) {
        n += 1;
        suma += r.prob;
        if (r.cae) caen += 1;
      }
    }
    const esperado = suma / 100;
    assert.ok(n >= 20, "lluvias " + n);
    assert.ok(Math.abs(caen - esperado) < Math.max(8, n * 0.2), `cayeron ${caen} esperado ${esperado.toFixed(1)}`);
    const s = nueva(3);
    firmar(s);
    s.curando = true;
    s.regadoHoy = false;
    s.curadoDias = [1];
    s.dia = 6;
    siguienteDia(s);
    assert.equal(s.curadoDias.includes(7), false);
    assert.ok(s.diario.some((d) => d.texto.includes("no se regó el sábado")));
    const r = nueva(3);
    firmar(r);
    r.curando = true;
    r.regadoHoy = true;
    r.curadoDias = [1];
    r.dia = 6;
    siguienteDia(r);
    assert.ok(r.curadoDias.includes(7));
    const seco = nueva(4);
    firmar(seco);
    seco.lluvias = [];
    assert.match(reloj(seco).clima, /No llovió/);
    const man = nueva(5);
    firmar(man);
    const prox = man.lluvias.find((x) => x.dia > man.dia);
    if (prox) assert.match(pronosticoDia(man, prox.dia - man.dia), /% de aguacero, a eso de las/);
  });
});

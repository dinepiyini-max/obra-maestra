import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { firmar, nueva } from "./motor.ts";
import { KEY, KEY_RECORD, KEY_VIEJA, _reiniciarPestana, anotarRecord, cargar, guardar, hayGuardado, leerRecord } from "./guardar.ts";

class Caja {
  m = new Map<string, string>();
  getItem(k: string) {
    return this.m.has(k) ? this.m.get(k)! : null;
  }
  setItem(k: string, v: string) {
    this.m.set(k, String(v));
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
}

const g = globalThis as unknown as { localStorage?: Caja };

afterEach(() => {
  delete g.localStorage;
  _reiniciarPestana();
});

describe("récord de la mejor obra", () => {
  it("guarda la mejor y no deja que una peor la borre", () => {
    g.localStorage = new Caja();
    const primera = anotarRecord({ estrellas: 2, dias: 25, ganancia: 60_000 }, 1000);
    assert.equal(primera.esNuevo, true);
    assert.equal(leerRecord()?.estrellas, 2);
    const peor = anotarRecord({ estrellas: 1, dias: 10, ganancia: 90_000 }, 2000);
    assert.equal(peor.esNuevo, false);
    assert.equal(leerRecord()?.estrellas, 2);
    const mejor = anotarRecord({ estrellas: 3, dias: 19, ganancia: 78_000 }, 3000);
    assert.equal(mejor.esNuevo, true);
    assert.equal(leerRecord()?.dias, 19);
    const mismoDiaMenosPlata = anotarRecord({ estrellas: 3, dias: 19, ganancia: 70_000 }, 4000);
    assert.equal(mismoDiaMenosPlata.esNuevo, false);
    assert.equal(leerRecord()?.ganancia, 78_000);
    const mismoDiaMasPlata = anotarRecord({ estrellas: 3, dias: 19, ganancia: 81_000 }, 5000);
    assert.equal(mismoDiaMasPlata.esNuevo, true);
    const menosDias = anotarRecord({ estrellas: 3, dias: 18, ganancia: 70_000 }, 6000);
    assert.equal(menosDias.esNuevo, true);
    assert.equal(leerRecord()?.dias, 18);
  });

  it("un récord dañado no tumba la partida que ya estaba guardada", () => {
    g.localStorage = new Caja();
    const s = nueva(4);
    firmar(s);
    assert.equal(guardar(s), true);
    g.localStorage.setItem(KEY_RECORD, "{esto no es un record");
    assert.equal(leerRecord(), null);
    const c = cargar();
    assert.equal(c.roto, false);
    assert.equal(c.s?.seed, 4);
    assert.equal(hayGuardado(), true);
  });
});

describe("guardado y continuar", () => {
  it("la clave vieja se pasa a la nueva y no se queda para revivir", () => {
    g.localStorage = new Caja();
    const s = nueva(4);
    firmar(s);
    s.caja = 12345;
    g.localStorage.setItem(KEY_VIEJA, JSON.stringify(s));
    const c = cargar();
    assert.equal(c.roto, false);
    assert.equal(c.s?.seed, 4);
    assert.equal(c.s?.caja, 12345);
    assert.equal(g.localStorage.getItem(KEY_VIEJA), null);
    assert.ok(g.localStorage.getItem(KEY));
  });

  it("si la clave nueva estaba dañada, la vieja no vuelve", () => {
    g.localStorage = new Caja();
    g.localStorage.setItem(`${KEY}-roto`, "{");
    const vieja = nueva(7);
    firmar(vieja);
    g.localStorage.setItem(KEY_VIEJA, JSON.stringify(vieja));
    const c = cargar();
    assert.equal(c.s, null);
    assert.equal(hayGuardado(), false);
    assert.ok(g.localStorage.getItem(KEY_VIEJA));
  });

  it("después de perder, esa obra no se continúa y la siguiente queda limpia", () => {
    g.localStorage = new Caja();
    const perdida = nueva(3);
    firmar(perdida);
    perdida.caja = 1;
    perdida.panel = "perdida";
    perdida.perdida = true;
    assert.equal(guardar(perdida), false);
    assert.equal(cargar().s, null);
    _reiniciarPestana();
    const limpia = nueva(11);
    assert.equal(guardar(limpia), true);
    const c = cargar();
    assert.equal(c.s?.seed, 11);
    assert.equal(c.s?.firmado, false);
    assert.equal(c.s?.entregada, false);
    assert.ok(!c.s?.perdida);
    assert.equal(c.s?.dia, 1);
    assert.notEqual(c.s?.caja, 1);
  });

  it("después de entregar, una obra nueva reemplaza el guardado", () => {
    g.localStorage = new Caja();
    const hecha = nueva(2);
    firmar(hecha);
    hecha.entregada = true;
    hecha.panel = "informe";
    hecha.caja = 99999;
    hecha.dia = 20;
    assert.equal(guardar(hecha), true);
    _reiniciarPestana();
    const limpia = nueva(12);
    assert.equal(guardar(limpia), true);
    const c = cargar();
    assert.equal(c.s?.seed, 12);
    assert.equal(c.s?.entregada, false);
    assert.equal(c.s?.dia, 1);
    assert.notEqual(c.s?.caja, 99999);
  });
});

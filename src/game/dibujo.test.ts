// El suelo del iPad no puede pedir un canvas que Safari cierra (lado > 4096).
import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  TOPE_AREA_CANVAS,
  TOPE_LADO_CANVAS,
  _leerTerrenoParaPrueba,
  _lienzoParaPrueba,
  backingSeguro,
  intentosTerreno,
  medidaTerreno,
  proyectar,
  zoomDe,
} from "./dibujo.ts";

afterEach(() => {
  _lienzoParaPrueba(null);
});

function ctxFalso(): CanvasRenderingContext2D {
  return new Proxy({} as CanvasRenderingContext2D, {
    get(_t, prop) {
      if (prop === "canvas") return { width: 0, height: 0 };
      return () => undefined;
    },
    set() {
      return true;
    },
  });
}

describe("zoom del solar (no se toca el tamaño del mundo)", () => {
  it("el teléfono vertical sigue en 0.75, el iPad en 1.35 y el horizontal en el piso corto", () => {
    assert.equal(zoomDe(375, 667), 0.75);
    assert.equal(zoomDe(390, 844), 0.75);
    assert.equal(zoomDe(1024, 1366), 1.35);
    assert.equal(zoomDe(1366, 1024), 1.35);
    const bajo = zoomDe(844, 390);
    assert.ok(bajo <= 0.58 && bajo >= 0.42, `horizontal ${bajo}`);
    assert.equal(bajo, Math.min(0.58, Math.max(0.42, 390 / 680)));
  });
});

describe("bitmap del suelo cabe en Safari", () => {
  it("en el teléfono vertical no se encoge: cabe de sobra", () => {
    const z = zoomDe(390, 844);
    const m = medidaTerreno(z);
    assert.equal(m.escala, 1);
    assert.equal(m.W, m.naturalW);
    assert.equal(m.H, m.naturalH);
    assert.ok(m.W <= TOPE_LADO_CANVAS && m.H <= TOPE_LADO_CANVAS);
    assert.ok(m.W * m.H <= TOPE_AREA_CANVAS, `${m.W}×${m.H}`);
  });

  it("en el iPad el lado natural pasa de 4096 y el que se pide no", () => {
    for (const [w, h] of [
      [1024, 1366],
      [1366, 1024],
    ] as const) {
      const m = medidaTerreno(zoomDe(w, h));
      assert.ok(m.naturalW > TOPE_LADO_CANVAS, `natural ${m.naturalW} en ${w}×${h}`);
      assert.ok(m.W <= TOPE_LADO_CANVAS && m.H <= TOPE_LADO_CANVAS, `${m.W}×${m.H}`);
      assert.ok(m.W * m.H <= TOPE_AREA_CANVAS, `área ${m.W * m.H}`);
      assert.ok(m.escala < 1 && m.escala > 0.5, `escala ${m.escala}`);
    }
  });

  it("al estirar el bitmap, un punto del solar cae en el mismo sitio", () => {
    const z = zoomDe(1024, 1366);
    const m = medidaTerreno(z);
    for (const [x, y] of [
      [19, 14.5],
      [8, 18],
      [0, 0],
      [34, 21],
    ] as const) {
      const p = proyectar(x, y, 0, z);
      const localX = p.sx - m.minX + m.pad;
      const localY = p.sy - m.minY + m.pad;
      // setTransform(escala) y drawImage al tamaño natural: el punto no se corre.
      const destW = m.W / m.escala;
      const destH = m.H / m.escala;
      const screenX = ((localX * m.escala) / m.W) * destW;
      const screenY = ((localY * m.escala) / m.H) * destH;
      assert.ok(Math.abs(screenX - localX) < 1e-6, `x ${screenX} vs ${localX}`);
      assert.ok(Math.abs(screenY - localY) < 1e-6, `y ${screenY} vs ${localY}`);
      assert.ok(localX > 0 && localX < m.naturalW, `x ${localX}`);
      assert.ok(localY > 0 && localY < m.naturalH, `y ${localY}`);
    }
    // Al estirar, el suelo ocupa el mismo rectángulo (el floor come menos de 1 px).
    assert.ok(Math.abs(m.W / m.escala - m.naturalW) < 1);
    assert.ok(Math.abs(m.H / m.escala - m.naturalH) < 1);
  });

  it("el segundo intento es la mitad, por si el primero no entra", () => {
    const [a, b] = intentosTerreno(zoomDe(1024, 1366));
    assert.ok(a && b);
    assert.ok(b.W <= TOPE_LADO_CANVAS / 2 && b.H <= TOPE_LADO_CANVAS / 2, `${b.W}×${b.H}`);
    assert.ok(b.W < a.W && b.H < a.H);
    assert.equal(a.minX, b.minX);
    assert.equal(a.minY, b.minY);
  });
});

describe("canvas de la pantalla", () => {
  it("iPhone y iPad de hoy no bajan de nitidez", () => {
    const iphone = backingSeguro(390, 844, 3);
    assert.equal(iphone.dpr, 2);
    assert.equal(iphone.bw, 780);
    assert.equal(iphone.bh, 1688);
    const ipad = backingSeguro(1024, 1366, 2);
    assert.equal(ipad.dpr, 2);
    assert.equal(ipad.bw, 2048);
    assert.equal(ipad.bh, 2732);
  });

  it("un escritorio retina enorme no pasa de 4096 de lado", () => {
    const g = backingSeguro(2560, 1440, 2);
    assert.ok(g.bw <= TOPE_LADO_CANVAS && g.bh <= TOPE_LADO_CANVAS, `${g.bw}×${g.bh}`);
    assert.ok(g.dpr < 2);
    assert.equal(g.bw, 4096);
  });
});

describe("un canvas rechazado no se vuelve a pedir cada cuadro", () => {
  it("en el teléfono pide el tamaño natural una sola vez", () => {
    const pedidos: number[] = [];
    _lienzoParaPrueba((w, h) => {
      pedidos.push(w, h);
      return { width: w, height: h, getContext: () => ctxFalso() };
    });
    const z = zoomDe(390, 844);
    const natural = medidaTerreno(z);
    const a = _leerTerrenoParaPrueba(z, 7);
    const b = _leerTerrenoParaPrueba(z, 7);
    assert.equal(a.listo, true);
    assert.equal(a.ancho, natural.W);
    assert.equal(a.alto, natural.H);
    assert.equal(a.escala, 1);
    assert.deepEqual(b, a);
    assert.deepEqual(pedidos, [natural.W, natural.H]);
  });

  it("si el grande falla, usa la mitad y no lo reintenta", () => {
    const pedidos: number[] = [];
    _lienzoParaPrueba((w, h) => {
      pedidos.push(w);
      if (w > 3000) return null;
      return { width: w, height: h, getContext: () => ctxFalso() };
    });
    const z = zoomDe(1024, 1366);
    const [grande, mitad] = intentosTerreno(z);
    assert.ok(grande && mitad && grande.W > 3000 && mitad.W <= 3000);
    const a = _leerTerrenoParaPrueba(z, 3);
    assert.equal(a.listo, true);
    assert.equal(a.ancho, mitad.W);
    assert.equal(a.escala, mitad.escala);
    const n = pedidos.length;
    const b = _leerTerrenoParaPrueba(z, 3);
    assert.deepEqual(b, a);
    assert.equal(pedidos.length, n, "el cuadro siguiente no pide otro bitmap");
    assert.deepEqual(pedidos, [grande.W, mitad.W]);
  });

  it("si los dos fallan, el cielo sigue y no hay un tercer intento", () => {
    let pedidos = 0;
    _lienzoParaPrueba(() => {
      pedidos += 1;
      return null;
    });
    const z = zoomDe(1024, 1366);
    const a = _leerTerrenoParaPrueba(z, 1);
    assert.equal(a.listo, false);
    assert.equal(pedidos, 2);
    _leerTerrenoParaPrueba(z, 1);
    assert.equal(pedidos, 2);
  });
});

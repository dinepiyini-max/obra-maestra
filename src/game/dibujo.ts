import {
  GUARDALMACEN,
  LISTERO,
  OFICIO_COLOR,
  POR_HILADA,
  SITIOS,
  SOLAR,
  TROMPO_CUERPO,
  BOTE_TIERRA,
  hash2,
  type Oficio,
} from "./datos.ts";
import {
  etapaActual,
  progresoObra,
  hechoDe,
  cercano,
  cuello,
  ancla,
  señalesReplanteo,
  trianguloEscuadra,
  type Estado,
} from "./motor.ts";

export interface Cam {
  x: number;
  y: number;
}

export interface Floater {
  x: number;
  y: number;
  texto: string;
  oro: boolean;
  vida: number;
}

export interface Vis {
  t: number;
  dt: number;
  compas: number;
  cam: Cam;
  shake: number;
  floaters: Floater[];
  ancho: number;
  ondas: { x: number; y: number; t: number }[];
  camion: number;
  pedidos: number;
  hit: number;
  selloOn: boolean;
  plomoOn: boolean;
  mira: { x: number; y: number } | null;
}

const TINTA = "#1d1712";
const PAPEL = "#e8dcc2";
const ORO = "#d4a73c";
const ORO2 = "#f2d27a";
const AGUA = "#8fb3ad";
const TIERRA = "#e8dcc2";
const TIERRA2 = "#efe6d4";
const TIERRA3 = "#e2d4b8";
const ACERA = "#d9d0c0";
const CALLE = "#cbbda8";

export function zoomDe(w: number): number {
  return w < 760 ? 0.75 : 1.35;
}

function sxu(z: number) {
  return 0.72 * 40 * z;
}
function syu(z: number) {
  return 0.36 * 40 * z;
}

export function proyectar(x: number, y: number, alt: number, z: number) {
  return { sx: (x - y) * sxu(z), sy: (x + y) * syu(z) - alt * 30 * z };
}

function jit(seed: number, i: number, amp: number) {
  return (hash2(seed, i) - 0.5) * 2 * amp;
}

function trazo(ctx: CanvasRenderingContext2D, pts: { x: number; y: number }[], closed: boolean) {
  if (pts.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(pts[0]!.x, pts[0]!.y);
  const n = closed ? pts.length : pts.length - 1;
  for (let i = 0; i < n; i++) {
    const b = pts[(i + 1) % pts.length]!;
    ctx.lineTo(b.x, b.y);
  }
  if (closed) ctx.closePath();
}

export function ink(
  ctx: CanvasRenderingContext2D,
  pts: { x: number; y: number }[],
  opt: { fill?: string; lw?: number; seed: number; closed?: boolean; amp?: number },
) {
  if (pts.length < 2) return;
  const closed = opt.closed !== false;
  const amp = opt.amp ?? 0.28;
  const p = pts.map((pt, i) => ({
    x: pt.x + jit(opt.seed, i * 3 + 1, amp),
    y: pt.y + jit(opt.seed, i * 3 + 7, amp),
  }));
  if (opt.fill) {
    ctx.save();
    trazo(ctx, p, closed);
    ctx.fillStyle = opt.fill;
    ctx.fill();
    ctx.restore();
  }
  trazo(ctx, p, closed);
  ctx.strokeStyle = TINTA;
  ctx.lineWidth = opt.lw ?? 1.1;
  ctx.lineJoin = "bevel";
  ctx.lineCap = "butt";
  ctx.stroke();
  ctx.save();
  ctx.globalAlpha = 0.22;
  trazo(ctx, p, closed);
  ctx.stroke();
  ctx.restore();
}

function hatch(ctx: CanvasRenderingContext2D, pts: { x: number; y: number }[], gap = 5) {
  ctx.save();
  trazo(ctx, pts, true);
  ctx.clip();
  ctx.strokeStyle = TINTA;
  ctx.globalAlpha = 0.18;
  ctx.lineWidth = 1;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of pts) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  for (let x = minX - 20; x < maxX + 20; x += gap) {
    ctx.beginPath();
    ctx.moveTo(x, minY - 10);
    ctx.lineTo(x + (maxY - minY), maxY + 10);
    ctx.stroke();
  }
  ctx.restore();
}

let terreno: { key: string; c: HTMLCanvasElement; ox: number; oy: number } | null = null;
let obraCache: { key: string; c: HTMLCanvasElement; ax: number; ay: number } | null = null;

export function puntoEnPantalla(x: number, y: number, alt: number, w: number, h: number, cam: Cam) {
  const z = zoomDe(w);
  const o = proyectar(cam.x, cam.y, 0, z);
  const q = proyectar(x, y, alt, z);
  return { x: w / 2 + (q.sx - o.sx), y: h * 0.56 + (q.sy - o.sy) };
}

function pantallaDe(x: number, y: number, alt: number, vis: Vis, w: number, h: number, z: number) {
  const o = proyectar(vis.cam.x, vis.cam.y, 0, z);
  const q = proyectar(x, y, alt, z);
  return { x: w / 2 + (q.sx - o.sx), y: h * 0.56 + (q.sy - o.sy) };
}

export function mundoDesde(px: number, py: number, w: number, h: number, vis: Vis): { x: number; y: number } {
  const z = zoomDe(vis.ancho || w);
  const o = proyectar(vis.cam.x, vis.cam.y, 0, z);
  const sx = px - w / 2 + o.sx;
  const sy = py - h * 0.56 + o.sy;
  const SX = sxu(z);
  const SY = syu(z);
  return { x: (sx / SX + sy / SY) / 2, y: (sy / SY - sx / SX) / 2 };
}

function pintarSenderos(
  ctx: CanvasRenderingContext2D,
  P: (x: number, y: number) => { x: number; y: number },
  seed: number,
) {
  const tramo = (a: { x: number; y: number }, b: { x: number; y: number }, n: number) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const px = (-dy / len) * 0.58;
    const py = (dx / len) * 0.58;
    ink(
      ctx,
      [P(a.x + px, a.y + py), P(b.x + px, b.y + py), P(b.x - px, b.y - py), P(a.x - px, a.y - py)],
      { fill: "#f6edd6", lw: 1, seed: seed + n, amp: 0.2 },
    );
    ctx.save();
    ctx.strokeStyle = "#8d7350";
    ctx.globalAlpha = 0.72;
    ctx.lineWidth = 1.45;
    ctx.lineCap = "round";
    const huella = (lado: number) => {
      ctx.beginPath();
      ctx.moveTo(P(a.x + px * lado, a.y + py * lado).x, P(a.x + px * lado, a.y + py * lado).y);
      ctx.lineTo(P(b.x + px * lado, b.y + py * lado).x, P(b.x + px * lado, b.y + py * lado).y);
      ctx.stroke();
    };
    huella(0.42);
    huella(-0.42);
    ctx.restore();
  };
  const w = {
    entrada: { x: 12.4, y: 21.0 },
    oficina: { x: 8.7, y: 18.45 },
    almacen: { x: 6.35, y: 15.7 },
    trompo: { x: 19.0, y: 18.35 },
    tanque: { x: 16.5, y: 19.55 },
    obra: { x: 19.0, y: 16.15 },
    patio: { x: 22.4, y: 14.2 },
    sombra: { x: 26.2, y: 12.35 },
    cruce: { x: 17.4, y: 18.9 },
  };
  tramo(w.entrada, w.cruce, 1);
  tramo(w.cruce, w.trompo, 2);
  tramo(w.cruce, w.tanque, 3);
  tramo(w.trompo, w.obra, 4);
  tramo(w.obra, w.patio, 5);
  tramo(w.patio, w.sombra, 6);
  tramo(w.entrada, w.oficina, 7);
  tramo(w.oficina, w.almacen, 8);
}

function asegurarTerreno(z: number, seed: number) {
  const key = `dia|${seed}|${z.toFixed(2)}|senderos2`;
  if (terreno?.key === key) return terreno;
  const pad = 200;
  const corners = [
    proyectar(-18, -16, 0, z),
    proyectar(52, -16, 0, z),
    proyectar(52, 46, 0, z),
    proyectar(-18, 46, 0, z),
  ];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const c of corners) {
    minX = Math.min(minX, c.sx);
    minY = Math.min(minY, c.sy);
    maxX = Math.max(maxX, c.sx);
    maxY = Math.max(maxY, c.sy);
  }
  const W = Math.ceil(maxX - minX + pad * 2);
  const H = Math.ceil(maxY - minY + pad * 2);
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  const P = (x: number, y: number) => ({ x: proyectar(x, y, 0, z).sx - minX + pad, y: proyectar(x, y, 0, z).sy - minY + pad });
  const poly = (pts: { x: number; y: number }[], fill: string) => {
    ink(ctx, pts, { fill, lw: 1.15, seed, closed: true, amp: 0.2 });
  };
  poly([P(-18, -16), P(52, -16), P(52, 46), P(-18, 46)], TIERRA);
  poly([P(0, 0), P(34, 0), P(34, 21.6), P(0, 21.6)], TIERRA2);
  poly([P(2, 10), P(32, 10), P(32, 21.6), P(2, 21.6)], TIERRA3);
  poly([P(-8, 21.6), P(46, 21.6), P(46, 23.6), P(-8, 23.6)], ACERA);
  poly([P(-18, 23.6), P(52, 23.6), P(52, 46), P(-18, 46)], CALLE);
  poly(
    [P(SOLAR.x0, SOLAR.y0), P(SOLAR.x1, SOLAR.y0), P(SOLAR.x1, SOLAR.y1), P(SOLAR.x0, SOLAR.y1)],
    "#e4d5b8",
  );
  ctx.save();
  ctx.beginPath();
  const borde = [P(-18, -16), P(52, -16), P(52, 46), P(-18, 46)];
  borde.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.closePath();
  ctx.clip();
  ctx.strokeStyle = TINTA;
  ctx.globalAlpha = 0.09;
  ctx.lineWidth = 1;
  for (let x = -40; x < W + 80; x += 16) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + H * 0.35, H);
    ctx.stroke();
  }
  ctx.restore();
  ctx.strokeStyle = TINTA;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 1.2;
  ctx.setLineDash([10, 14]);
  ctx.beginPath();
  const ca = P(-8, 24.8);
  const cb = P(46, 24.8);
  ctx.moveTo(ca.x, ca.y);
  ctx.lineTo(cb.x, cb.y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
  for (let i = 0; i < 70; i++) {
    const x = hash2(seed, i) * 32 + 1;
    const y = 4 + hash2(seed, i + 400) * 16;
    const q = P(x, y);
    ctx.fillStyle = TINTA;
    ctx.globalAlpha = 0.18;
    ctx.fillRect(q.x, q.y, 1.2, 1.2);
    ctx.globalAlpha = 1;
  }
  pintarSenderos(ctx, P, seed);
  terreno = { key, c, ox: minX - pad, oy: minY - pad };
  return terreno;
}

const ANILLO = anillo();

function anillo() {
  const slots: { x: number; y: number; ax: number; ay: number }[] = [];
  const line = (x0: number, y0: number, x1: number, y1: number, n: number, skip: number[] = []) => {
    const len = Math.hypot(x1 - x0, y1 - y0) || 1;
    const ax = (x1 - x0) / len;
    const ay = (y1 - y0) / len;
    for (let i = 0; i < n; i++) {
      if (skip.includes(i)) continue;
      const t = (i + 0.5) / n;
      slots.push({ x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t, ax, ay });
    }
  };
  line(17.25, 15.82, 18.4, 15.82, 4);
  line(19.6, 15.82, 20.75, 15.82, 4);
  line(17.25, 13.18, 20.75, 13.18, 12);
  line(17.18, 13.45, 17.18, 15.55, 6);
  line(20.82, 13.45, 20.82, 15.55, 7, [3, 4]);
  return slots;
}

function bloqueCount(s: Estado): number {
  if (s.etapa < 4) return 0;
  const puesto = s.etapa === 4 ? hechoDe(s, 4, "block") : 469;
  const redo = s.extras.filter((e) => e.k === "block").reduce((a, e) => a + e.hecho, 0);
  return Math.min(469, puesto + (s.etapa > 4 ? 0 : 0) + Math.min(redo, 24));
}

function drawObraEn(ctx: CanvasRenderingContext2D, s: Estado, z: number, ox: number, oy: number) {
  const P = (x: number, y: number, a = 0) => {
    const q = proyectar(x, y, a, z);
    return { x: q.sx - ox, y: q.sy - oy };
  };
  const seed = s.seed;
  const limpiar = s.etapa > 0 ? 1 : Math.min(1, hechoDe(s, 0, "limpiar") / 30);
  const diag = s.etapa > 0 ? 2 : hechoDe(s, 0, "replantear");
  const senal = señalesReplanteo(diag);
  const cordel = senal.cordel;
  const exc = s.etapa > 1 ? 1 : s.etapa === 1 ? hechoDe(s, 1, "excavar") / 4.2 : 0;
  const acero = s.etapa > 2 ? 1 : s.etapa === 2 ? hechoDe(s, 2, "acero") / 103.8 : 0;
  const zap = s.etapa > 3 ? 1 : s.etapa === 3 ? hechoDe(s, 3, "vaciar") / 10 : 0;
  const blocks = s.etapa > 4 ? 469 : s.etapa === 4 ? hechoDe(s, 4, "block") : 0;
  const colsF = s.etapa > 5 ? 1 : s.etapa === 5 ? hechoDe(s, 5, "encofrar") / 7.2 : 0;
  const colsV = s.etapa > 5 ? 1 : s.etapa === 5 ? hechoDe(s, 5, "vaciar") / 5 : 0;
  const vigaV = s.etapa > 6 ? 1 : s.etapa === 6 ? hechoDe(s, 6, "vaciar") / 4 : 0;
  const vigaF = s.etapa > 6 ? 1 : s.etapa === 6 ? hechoDe(s, 6, "encofrar") / 5.63 : 0;
  const vigaA = s.etapa > 6 ? 1 : s.etapa === 6 ? hechoDe(s, 6, "acero") / 48.1 : 0;
  const rell = s.etapa > 7 ? 1 : s.etapa === 7 ? hechoDe(s, 7, "relleno") / 2.2 : 0;
  const firme = s.etapa > 7 ? 1 : s.etapa === 7 ? hechoDe(s, 7, "firme") / 8 : 0;
  const llano = s.etapa > 7 ? 1 : s.etapa === 7 ? hechoDe(s, 7, "llano") / 11 : 0;
  const techo = s.etapa > 8 ? 1 : s.etapa === 8 ? hechoDe(s, 8, "techo") / 16.5 : 0;
  const MURO = 3;

  const dentro = (p: { x: number; y: number }, d: number) => {
    const dx = 19 - p.x;
    const dy = 14.5 - p.y;
    const l = Math.hypot(dx, dy) || 1;
    return { x: p.x + (dx / l) * d, y: p.y + (dy / l) * d };
  };
  const estaca = (x: number, y: number, h = 0.75) => {
    const a = P(x, y, 0);
    const b = P(x, y, h);
    ctx.strokeStyle = TINTA;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    const f1 = P(x, y, h);
    const f2 = P(x + 0.22, y + 0.02, h - 0.1);
    const f3 = P(x, y, h - 0.18);
    ink(ctx, [f1, f2, f3], { fill: ORO, lw: 0.8, seed: Math.round(x * 20 + y * 7), amp: 0.04 });
  };
  const cerco = (pts: { x: number; y: number }[], alt: number, color: string) => {
    if (pts.length < 2) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    pts.forEach((p, i) => {
      const q = P(p.x, p.y, alt);
      if (i === 0) ctx.moveTo(q.x, q.y);
      else ctx.lineTo(q.x, q.y);
    });
    ctx.closePath();
    ctx.stroke();
  };

  const lote: { x: number; y: number }[] = [
    { x: 16.7, y: 12.7 },
    { x: 21.3, y: 12.7 },
    { x: 21.3, y: 16.3 },
    { x: 16.7, y: 16.3 },
  ];
  cerco(lote, 0.12, TINTA);
  for (const p of lote) estaca(p.x, p.y, 0.7);
  const caseta = [
    { x: 17, y: 13 },
    { x: 21, y: 13 },
    { x: 21, y: 16 },
    { x: 17, y: 16 },
  ];
  cerco(caseta, 0.32, ORO);
  for (const p of caseta) estaca(p.x, p.y, 0.78);

  if (limpiar < 0.98) {
    ctx.strokeStyle = "#3f5a32";
    ctx.lineWidth = 1;
    for (let i = 0; i < 14; i++) {
      if (i / 14 < limpiar) continue;
      const x = SOLAR.x0 + 0.35 + hash2(seed, i + 20) * 3.3;
      const y = SOLAR.y0 + 0.3 + hash2(seed, i + 80) * 2.4;
      const b = P(x, y, 0);
      const t = P(x + 0.04, y, 0.16 + hash2(seed, i) * 0.14);
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(t.x, t.y);
      ctx.stroke();
    }
  }

  if (s.etapa === 0 && cordel) {
    ctx.strokeStyle = ORO;
    ctx.lineWidth = 1.3;
    const a = P(17, 13, 0.32);
    const b = P(21, 16, 0.32);
    const c = P(21, 13, 0.32);
    const d = P(17, 16, 0.32);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.moveTo(c.x, c.y);
    ctx.lineTo(d.x, d.y);
    ctx.stroke();
  }

  if (exc > 0.02) {
    const per = perimetro();
    const n = Math.max(1, Math.round(per.length * Math.min(1, exc)));
    for (let i = 0; i < n; i++) {
      const a = per[i % per.length]!;
      const b = per[(i + 1) % per.length]!;
      const a2 = dentro(a, 0.42);
      const b2 = dentro(b, 0.42);
      ink(ctx, [P(a.x, a.y), P(b.x, b.y), P(b2.x, b2.y), P(a2.x, a2.y)], {
        fill: "#1c1612",
        lw: 1,
        seed: seed + 90 + i,
        amp: 0.12,
      });
    }
  }

  if (acero > 0.02 && zap < 0.98) {
    const per = perimetro();
    const n = Math.max(1, Math.round(per.length * acero));
    ctx.strokeStyle = "#3e4a55";
    ctx.lineWidth = 1.25;
    for (const alt of [0.1, 0.22]) {
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const q = P(per[i]!.x, per[i]!.y, alt);
        if (i === 0) ctx.moveTo(q.x, q.y);
        else ctx.lineTo(q.x, q.y);
      }
      ctx.stroke();
    }
    for (let i = 0; i < n; i++) {
      const p = per[i]!;
      const lo = P(p.x, p.y, 0.08);
      const hi = P(p.x, p.y, 0.26);
      ctx.beginPath();
      ctx.moveTo(lo.x, lo.y);
      ctx.lineTo(hi.x, hi.y);
      ctx.stroke();
      if (i % 2 === 0) {
        const dow = P(p.x, p.y, 0.58);
        ctx.beginPath();
        ctx.moveTo(hi.x, hi.y);
        ctx.lineTo(dow.x, dow.y);
        ctx.stroke();
      }
      if (i % 3 === 0) {
        const c = dentro(p, 0.05);
        isoBox(ctx, P, c.x - 0.045, c.y - 0.045, 0, 0.09, 0.09, 0.08, "#8d8a84", "#5c5a56", "#c8c4bc", seed + 400 + i);
      }
    }
  }

  if (zap > 0.02) {
    const per = perimetro();
    const n = Math.max(1, Math.round(per.length * zap));
    for (let i = 0; i < n; i++) {
      const a = per[i % per.length]!;
      const b = per[(i + 1) % per.length]!;
      const a2 = dentro(a, 0.46);
      const b2 = dentro(b, 0.46);
      ink(ctx, [P(a.x, a.y, 0), P(b.x, b.y, 0), P(b.x, b.y, 0.1), P(a.x, a.y, 0.1)], {
        fill: "#6e6e6a",
        lw: 0.9,
        seed: seed + 180 + i,
        amp: 0.1,
      });
      ink(ctx, [P(a.x, a.y, 0.1), P(b.x, b.y, 0.1), P(b2.x, b2.y, 0.1), P(a2.x, a2.y, 0.1)], {
        fill: "#9a9a96",
        lw: 1,
        seed: seed + 200 + i,
        amp: 0.1,
      });
    }
  }

  if (rell > 0.05 || firme > 0.05) {
    const inset = 0.58;
    const h = firme > 0.15 ? 0.08 : 0.04;
    const col = firme > 0.2 ? (llano > 0.55 ? "#c2bfb8" : "#8e8c88") : "#5c4a38";
    ink(
      ctx,
      [
        P(SOLAR.x0 + inset, SOLAR.y0 + inset, h),
        P(SOLAR.x1 - inset, SOLAR.y0 + inset, h),
        P(SOLAR.x1 - inset, SOLAR.y1 - inset, h),
        P(SOLAR.x0 + inset, SOLAR.y1 - inset, h),
      ],
      { fill: col, lw: 1, seed: seed + 600, amp: 0.12 },
    );
  }

  const puestos = Math.floor(blocks);
  const bricks: { x: number; y: number; c: number; ax: number; ay: number }[] = [];
  for (let i = 0; i < puestos && i < ANILLO.length * 15; i++) {
    const curso = Math.floor(i / ANILLO.length);
    const sl = ANILLO[i % ANILLO.length]!;
    const off = curso % 2 === 1 ? 0.1 : 0;
    bricks.push({ x: sl.x + sl.ax * off, y: sl.y + sl.ay * off, c: curso, ax: sl.ax, ay: sl.ay });
  }
  bricks.sort((a, b) => a.x + a.y - (b.x + b.y) || a.c - b.c);
  for (const br of bricks) {
    const alt = br.c * 0.2;
    const hx = br.ax * 0.16;
    const hy = br.ay * 0.16;
    const px = -br.ay * 0.07;
    const py = br.ax * 0.07;
    const x0 = br.x - hx + px;
    const y0 = br.y - hy + py;
    isoBox(ctx, P, x0, y0, alt, hx * 2, hy * 2, 0.03, "#c4b49a", "#a89880", "#d7c4a8", seed + br.c + 17);
    isoBox(ctx, P, x0, y0, alt + 0.03, hx * 2, hy * 2, 0.155, "#d9d0be", "#a89880", "#efe6d4", seed + br.c);
  }

  if (colsF > 0.05 || colsV > 0.05 || s.etapa > 5) {
    const cols = [
      { x: 17.2, y: 13.2 },
      { x: 20.8, y: 13.2 },
      { x: 17.2, y: 15.8 },
      { x: 18.5, y: 15.8 },
      { x: 19.5, y: 15.8 },
      { x: 20.8, y: 15.8 },
    ];
    cols.forEach((c, i) => {
      const formed = s.etapa > 5 || colsF > i / cols.length;
      const poured = s.etapa > 5 || colsV > i / cols.length;
      if (!formed && !poured) return;
      if (s.etapa > 5) {
        isoBox(ctx, P, c.x - 0.13, c.y - 0.13, 0.08, 0.26, 0.26, MURO, "#9a9a96", "#6e6e6a", "#c8c8c2", seed + 300 + i);
        return;
      }
      const cage = 0.09;
      ctx.strokeStyle = "#3e4a55";
      ctx.lineWidth = 1.1;
      const offs = [
        [-cage, -cage],
        [cage, -cage],
        [cage, cage],
        [-cage, cage],
      ];
      for (const [ox, oy] of offs) {
        const a = P(c.x + ox, c.y + oy, 0.12);
        const b = P(c.x + ox, c.y + oy, MURO + 0.32);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      for (let t = 0.35; t < MURO; t += 0.5) {
        ctx.beginPath();
        offs.forEach((o, k) => {
          const q = P(c.x + o[0], c.y + o[1], t);
          if (k === 0) ctx.moveTo(q.x, q.y);
          else ctx.lineTo(q.x, q.y);
        });
        ctx.closePath();
        ctx.stroke();
      }
      const fh = poured ? MURO : MURO * Math.min(1, 0.35 + colsF * 0.7);
      const s0 = 0.36;
      const x0 = c.x - s0 / 2;
      const y0 = c.y - s0 / 2;
      ink(ctx, [P(x0, y0, 0.12), P(x0 + s0, y0, 0.12), P(x0 + s0, y0, fh), P(x0, y0, fh)], {
        fill: "#e6d2a8",
        lw: 1,
        seed: seed + 340 + i,
        amp: 0.1,
      });
      ink(ctx, [P(x0, y0, 0.12), P(x0, y0 + s0, 0.12), P(x0, y0 + s0, fh), P(x0, y0, fh)], {
        fill: "#c4a574",
        lw: 1,
        seed: seed + 360 + i,
        amp: 0.1,
      });
      isoBox(ctx, P, x0 + s0 - 0.06, y0, 0.12, 0.06, 0.06, fh, "#8d6b3e", "#6a4e32", "#c4a574", seed + 380 + i);
      isoBox(ctx, P, x0 + s0 - 0.06, y0 + s0 - 0.06, 0.12, 0.06, 0.06, fh, "#8d6b3e", "#6a4e32", "#c4a574", seed + 390 + i);
      ctx.strokeStyle = "#6a4e32";
      ctx.lineWidth = 1.35;
      const mid = P(c.x, c.y, fh * 0.5);
      const g1 = P(c.x + 0.75, c.y + 0.08, 0);
      const g2 = P(c.x + 0.08, c.y + 0.75, 0);
      ctx.beginPath();
      ctx.moveTo(mid.x, mid.y);
      ctx.lineTo(g1.x, g1.y);
      ctx.moveTo(mid.x, mid.y);
      ctx.lineTo(g2.x, g2.y);
      ctx.stroke();
      if (poured) {
        isoBox(ctx, P, c.x - 0.1, c.y - 0.1, 0.16, 0.2, 0.2, fh - 0.08, "#8a8a86", "#5e5e5a", "#b0b0aa", seed + 410 + i);
      }
    });
  }

  const corona = Math.max(vigaF, vigaA, vigaV);
  if ((corona > 0.04 || s.etapa > 6) && (blocks > 180 || s.etapa > 4)) {
    const h = MURO;
    const anilloCajas = (alt: number, dz: number, frac: number, lado: string, lado2: string, tapa: string, sd: number) => {
      const x0 = 17.12;
      const y0 = 13.12;
      const x1 = 20.88;
      const y1 = 15.88;
      const w = x1 - x0;
      const d = y1 - y0;
      const t = 0.2;
      const f = Math.min(1, Math.max(0, frac));
      const segs: [number, number, number, number][] = [
        [x0, y0, w * Math.min(1, f * 4), t],
        [x1 - t, y0, t, d * Math.min(1, Math.max(0, f * 4 - 1))],
        [x1 - w * Math.min(1, Math.max(0, f * 4 - 2)), y1 - t, w * Math.min(1, Math.max(0, f * 4 - 2)), t],
        [x0, y1 - d * Math.min(1, Math.max(0, f * 4 - 3)), t, d * Math.min(1, Math.max(0, f * 4 - 3))],
      ];
      segs.forEach((g, i) => {
        if (g[2] < 0.08 || g[3] < 0.08) return;
        isoBox(ctx, P, g[0], g[1], alt, g[2], g[3], dz, lado, lado2, tapa, sd + i);
      });
    };
    const madera = s.etapa === 6 && vigaV < 0.98 && vigaF > 0.04;
    if (madera) anilloCajas(h, 0.32, Math.max(vigaF, vigaA), "#c4a574", "#8d6b3e", "#e6d2a8", seed + 500);
    if (s.etapa === 6 && vigaA > 0.08 && vigaV < 0.92) {
      ctx.strokeStyle = "#3e4a55";
      ctx.lineWidth = 1.15;
      const yb = 13.2;
      const a = P(17.2, yb, h + 0.16);
      const b = P(17.2 + 3.6 * vigaA, yb, h + 0.16);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    if (vigaV > 0.04 || s.etapa > 6) {
      const mojada = s.curando && s.curadoDias.length < 1;
      const col = mojada ? "#4e5558" : "#6a6d70";
      anilloCajas(h + (madera ? 0.05 : 0), madera ? 0.2 : 0.24, s.etapa > 6 ? 1 : vigaV, col, "#4a4d50", "#8d9094", seed + 540);
    }
  }

  if (techo > 0.04) {
    const h = MURO + 0.3;
    const rise = 0.62;
    const ym = 14.5;
    const n = Math.max(2, Math.round(7 * Math.min(1, techo * 1.35)));
    ctx.strokeStyle = "#6a4e32";
    ctx.lineWidth = 1.7;
    for (let i = 0; i < n; i++) {
      const x = 17.2 + ((i + 0.5) * 3.6) / n;
      const a = P(x, 13.12, h);
      const m = P(x, ym, h + rise);
      const b = P(x, 15.88, h);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(m.x, m.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    if (techo > 0.18) {
      ctx.strokeStyle = "#a8845c";
      ctx.lineWidth = 1.15;
      for (const y of [13.6, 14.15, 14.85, 15.4]) {
        const alt = h + rise * (1 - Math.abs(y - ym) / 1.38);
        const a = P(17.2, y, alt);
        const b = P(20.8, y, alt);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
    if (techo > 0.32) {
      const sheets = Math.max(1, Math.round(8 * Math.min(1, (techo - 0.2) / 0.8)));
      for (let i = 0; i < sheets; i++) {
        const x0 = 17.35 + (i * 3.3) / 8;
        const x1 = 17.35 + ((i + 1) * 3.3) / 8;
        ink(ctx, [P(x0, 13.25, h + 0.05), P(x1, 13.25, h + 0.05), P(x1, ym, h + rise - 0.02), P(x0, ym, h + rise - 0.02)], {
          fill: i % 2 ? "#8a8680" : "#c5c0b6",
          lw: 0.85,
          seed: seed + 700 + i,
          amp: 0.08,
        });
        ink(ctx, [P(x0, 15.75, h + 0.05), P(x1, 15.75, h + 0.05), P(x1, ym, h + rise - 0.02), P(x0, ym, h + rise - 0.02)], {
          fill: i % 2 ? "#7a766f" : "#b7b2a8",
          lw: 0.85,
          seed: seed + 740 + i,
          amp: 0.08,
        });
      }
    }
  }
}

function perimetro() {
  const pts = [];
  const w = 4;
  const h = 3;
  const x0 = 17;
  const y0 = 13;
  for (let i = 0; i <= 4; i++) pts.push({ x: x0 + (w * i) / 4, y: y0 });
  for (let i = 1; i <= 3; i++) pts.push({ x: x0 + w, y: y0 + (h * i) / 3 });
  for (let i = 1; i <= 4; i++) pts.push({ x: x0 + w - (w * i) / 4, y: y0 + h });
  for (let i = 1; i < 3; i++) pts.push({ x: x0, y: y0 + h - (h * i) / 3 });
  return pts;
}

function isoBox(
  ctx: CanvasRenderingContext2D,
  P: (x: number, y: number, a?: number) => { x: number; y: number },
  x: number,
  y: number,
  z: number,
  dx: number,
  dy: number,
  dz: number,
  lado: string,
  lado2: string,
  tapa: string,
  seed: number,
) {
  const a = P(x, y, z);
  const b = P(x + dx, y, z);
  const c = P(x + dx, y + dy, z);
  const d = P(x, y + dy, z);
  const a2 = P(x, y, z + dz);
  const b2 = P(x + dx, y, z + dz);
  const c2 = P(x + dx, y + dy, z + dz);
  const d2 = P(x, y + dy, z + dz);
  ink(ctx, [d, c, c2, d2], { fill: lado2, lw: 1, seed });
  ink(ctx, [b, c, c2, b2], { fill: lado, lw: 1, seed: seed + 1 });
  ink(ctx, [a2, b2, c2, d2], { fill: tapa, lw: 1, seed: seed + 2 });
}

type Proy = (x: number, y: number, a?: number) => { x: number; y: number };

function metro(P: Proy, x: number, y: number) {
  const a = P(x, y, 0);
  const b = P(x, y, 1);
  return Math.max(8, Math.hypot(b.x - a.x, b.y - a.y));
}

function sombraIso(ctx: CanvasRenderingContext2D, P: Proy, x: number, y: number, rx: number, ry: number) {
  const c = P(x, y, 0.02);
  const a = P(x + rx, y, 0.02);
  const b = P(x, y + ry, 0.02);
  const ex = Math.max(8, Math.hypot(a.x - c.x, a.y - c.y));
  const ey = Math.max(5, Math.hypot(b.x - c.x, b.y - c.y) * 0.72);
  ctx.save();
  ctx.fillStyle = "rgba(29,23,18,0.16)";
  ctx.beginPath();
  ctx.ellipse(c.x + ex * 0.06, c.y + 3, ex, ey, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function techoZinc(ctx: CanvasRenderingContext2D, P: Proy, x: number, y: number, dx: number, dy: number, base: number, seed: number) {
  const rise = 0.42;
  const ym = y + dy / 2;
  const e = 0.18;
  ink(ctx, [P(x - e, y - e, base), P(x + dx + e, y - e, base), P(x + dx + e, ym, base + rise), P(x - e, ym, base + rise)], {
    fill: "#d5d0c6",
    lw: 1,
    seed,
    amp: 0.1,
  });
  ink(ctx, [P(x - e, y + dy + e, base), P(x + dx + e, y + dy + e, base), P(x + dx + e, ym, base + rise), P(x - e, ym, base + rise)], {
    fill: "#a8a49c",
    lw: 1,
    seed: seed + 1,
    amp: 0.1,
  });
  ctx.save();
  ctx.strokeStyle = TINTA;
  ctx.globalAlpha = 0.45;
  ctx.lineWidth = 1;
  const ribs = Math.max(7, Math.round(dx / 0.26));
  for (let i = 1; i < ribs; i++) {
    const xx = x - e * 0.2 + ((dx + e * 0.4) * i) / ribs;
    const ridge = P(xx, ym, base + rise);
    const far = P(xx, y - e * 0.15, base + 0.03);
    const near = P(xx, y + dy + e * 0.15, base + 0.03);
    ctx.beginPath();
    ctx.moveTo(far.x, far.y);
    ctx.lineTo(ridge.x, ridge.y);
    ctx.lineTo(near.x, near.y);
    ctx.stroke();
  }
  ctx.restore();
  const gy = y + dy + e;
  ink(
    ctx,
    [P(x - 0.04, y + dy, base + 0.02), P(x + dx + 0.1, y + dy, base + 0.02), P(x + dx + 0.1, gy, base - 0.07), P(x - 0.04, gy, base - 0.07)],
    { fill: "#8d8982", lw: 1.05, seed: seed + 11, amp: 0.06 },
  );
  ink(
    ctx,
    [P(x - 0.04, gy, base - 0.07), P(x + dx + 0.1, gy, base - 0.07), P(x + dx + 0.1, gy + 0.12, base - 0.16), P(x - 0.04, gy + 0.12, base - 0.16)],
    { fill: "#6a6660", lw: 1, seed: seed + 12, amp: 0.06 },
  );
  ctx.save();
  ctx.strokeStyle = "#4a4642";
  ctx.lineWidth = 2.6;
  const boca = P(x + dx - 0.02, gy + 0.04, base - 0.12);
  const pie = P(x + dx + 0.06, gy + 0.16, 0.08);
  ctx.beginPath();
  ctx.moveTo(boca.x, boca.y);
  ctx.lineTo(pie.x, pie.y);
  ctx.stroke();
  ctx.restore();
}

function tablasPared(
  ctx: CanvasRenderingContext2D,
  P: Proy,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  h: number,
  n: number,
) {
  ctx.save();
  ctx.strokeStyle = TINTA;
  ctx.globalAlpha = 0.4;
  ctx.lineWidth = 1;
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const xa = x0 + (x1 - x0) * t;
    const ya = y0 + (y1 - y0) * t;
    const a = P(xa, ya, 0.05);
    const b = P(xa, ya, h - 0.04);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  for (const alt of [h * 0.34, h * 0.68]) {
    const a = P(x0, y0, alt);
    const b = P(x1, y1, alt);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  ctx.restore();
}

function nave(
  ctx: CanvasRenderingContext2D,
  P: Proy,
  x: number,
  y: number,
  dx: number,
  dy: number,
  h: number,
  seed: number,
  muro: string,
  muro2: string,
  piso = "#cfc6b4",
) {
  sombraIso(ctx, P, x + dx * 0.45, y + dy * 0.55, dx * 0.62, dy * 0.7);
  ink(ctx, [P(x, y, 0.02), P(x + dx, y, 0.02), P(x + dx, y + dy, 0.02), P(x, y + dy, 0.02)], {
    fill: piso,
    lw: 1,
    seed,
    amp: 0.1,
  });
  ink(ctx, [P(x, y, 0), P(x + dx, y, 0), P(x + dx, y, h), P(x, y, h)], { fill: muro, lw: 1.05, seed: seed + 1, amp: 0.12 });
  tablasPared(ctx, P, x, y, x + dx, y, h, Math.max(6, Math.round(dx / 0.2)));
  ink(ctx, [P(x, y, 0), P(x, y + dy, 0), P(x, y + dy, h), P(x, y, h)], { fill: muro2, lw: 1.05, seed: seed + 2, amp: 0.12 });
  tablasPared(ctx, P, x, y, x, y + dy, h, Math.max(5, Math.round(dy / 0.2)));
  isoBox(ctx, P, x + dx - 0.1, y, 0, 0.1, 0.1, h, "#6a4e32", "#4a3824", "#8d6b3e", seed + 3);
  isoBox(ctx, P, x + dx - 0.1, y + dy - 0.1, 0, 0.1, 0.1, h, "#6a4e32", "#4a3824", "#8d6b3e", seed + 4);
  isoBox(ctx, P, x, y + dy - 0.1, 0, 0.1, 0.1, h, "#6a4e32", "#4a3824", "#8d6b3e", seed + 5);
  isoBox(ctx, P, x, y, 0, 0.1, 0.1, h, "#6a4e32", "#4a3824", "#8d6b3e", seed + 7);
  ink(ctx, [P(x, y + dy, h), P(x + dx, y + dy, h), P(x + dx, y + dy, h + 0.08), P(x, y + dy, h + 0.08)], {
    fill: "#6a4e32",
    lw: 1,
    seed: seed + 6,
    amp: 0.1,
  });
  ctx.save();
  ctx.strokeStyle = "#6a4e32";
  ctx.lineWidth = 2.5;
  const puntal = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) => {
    const a = P(x0, y0, z0);
    const b = P(x1, y1, z1);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  };
  puntal(x + dx * 0.18, y + dy + 0.7, 0, x + dx * 0.34, y + dy, h * 0.74);
  puntal(x + dx * 0.7, y + dy + 0.78, 0, x + dx * 0.52, y + dy, h * 0.8);
  puntal(x + dx + 0.68, y + dy * 0.32, 0, x + dx, y + dy * 0.46, h * 0.7);
  ctx.restore();
}

function candado(ctx: CanvasRenderingContext2D, P: Proy, x: number, y: number, alt: number) {
  const c = P(x, y, alt);
  const k = metro(P, x, y);
  const s = k * 0.045;
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.fillStyle = ORO;
  ctx.strokeStyle = TINTA;
  ctx.lineWidth = 1;
  ctx.fillRect(-s, -s * 0.2, s * 2, s * 1.5);
  ctx.strokeRect(-s, -s * 0.2, s * 2, s * 1.5);
  ctx.beginPath();
  ctx.arc(0, -s * 0.2, s * 0.55, Math.PI, 0);
  ctx.stroke();
  ctx.restore();
}

function pintarAlmacenM(
  ctx: CanvasRenderingContext2D,
  P: Proy,
  cx: number,
  cy: number,
  seed: number,
  cemento: number,
) {
  const dx = 2.45;
  const dy = 2.05;
  const h = 2.15;
  const x = cx - dx / 2;
  const y = cy - dy / 2;
  nave(ctx, P, x, y, dx, dy, h, seed, "#d7d1c6", "#c4bdb2");
  for (const alt of [0.55, 1.15]) {
    ink(ctx, [P(x + 0.12, y + 0.08, alt), P(x + dx - 0.35, y + 0.08, alt), P(x + dx - 0.35, y + 0.16, alt), P(x + 0.12, y + 0.16, alt)], {
      fill: "#8d6b3e",
      lw: 0.9,
      seed: seed + alt * 10,
      amp: 0.08,
    });
  }
  const fundas = cemento <= 0.2 ? 0 : cemento < 4 ? 2 : cemento < 12 ? 4 : 6;
  for (let i = 0; i < fundas; i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    isoBox(ctx, P, x + 0.28 + col * 0.38, y + 0.28, 0.08 + row * 0.16, 0.32, 0.22, 0.14, "#9a948a", "#7a756e", "#c8c2b8", seed + 20 + i);
  }
  candado(ctx, P, x + dx - 0.05, y + dy - 0.05, 1.15);
  techoZinc(ctx, P, x, y, dx, dy, h + 0.08, seed + 8);
}

function pintarOficinaM(ctx: CanvasRenderingContext2D, P: Proy, cx: number, cy: number, seed: number, conLuz = false) {
  const dx = 2.35;
  const dy = 1.9;
  const h = 2.15;
  const x = cx - dx / 2;
  const y = cy - dy / 2;
  nave(ctx, P, x, y, dx, dy, h, seed, "#efe4cf", "#e4d5bc", conLuz ? "#f3d7a0" : "#cfc6b4");
  const cal = [
    P(x + 0.35, y + 0.04, 1.25),
    P(x + 1.15, y + 0.04, 1.25),
    P(x + 1.15, y + 0.04, 1.85),
    P(x + 0.35, y + 0.04, 1.85),
  ];
  ink(ctx, cal, { fill: PAPEL, lw: 1, seed: seed + 12, amp: 0.08 });
  ctx.strokeStyle = TINTA;
  ctx.lineWidth = 0.8;
  for (let i = 1; i <= 3; i++) {
    const a = P(x + 0.35 + i * 0.2, y + 0.04, 1.25);
    const b = P(x + 0.35 + i * 0.2, y + 0.04, 1.85);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  techoZinc(ctx, P, x, y, dx, dy, h + 0.08, seed + 8);
  isoBox(ctx, P, x + 0.45, y + dy - 0.15, 0, 0.9, 0.55, 0.72, "#8d6b3e", "#6a4e32", "#e6d2a8", seed + 14);
  ink(
    ctx,
    [
      P(x + 0.55, y + dy + 0.05, 0.74),
      P(x + 1.25, y + dy + 0.05, 0.74),
      P(x + 1.25, y + dy + 0.42, 0.74),
      P(x + 0.55, y + dy + 0.42, 0.74),
    ],
    { fill: "#f4efe4", lw: 1, seed: seed + 15, amp: 0.06 },
  );
  ctx.strokeStyle = "#3d5f8a";
  ctx.lineWidth = 0.8;
  const p1 = P(x + 0.65, y + dy + 0.12, 0.75);
  const p2 = P(x + 1.15, y + dy + 0.28, 0.75);
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();
}

function pintarTanqueM(ctx: CanvasRenderingContext2D, P: Proy, cx: number, cy: number, q: number, seed: number) {
  const bw = 1.05;
  const bd = 0.78;
  isoBox(ctx, P, cx - bw / 2, cy - bd / 2, 0, bw, bd, 0.42, "#b5a48c", "#8d7b66", "#d9d0be", seed);
  const tw = 0.9;
  const td = 0.64;
  const th = 1.05;
  const x = cx - tw / 2;
  const y = cy - td / 2;
  const z0 = 0.42;
  isoBox(ctx, P, x, y, z0, tw, td, th, "#d9d3c7", "#b7b2a8", "#efeae2", seed + 1);
  const f = q <= 0.15 ? 0 : Math.min(1, q / 1.2);
  if (f > 0.02) {
    const z1 = z0 + 0.06 + f * (th - 0.12);
    ink(ctx, [P(x + tw, y + 0.04, z0 + 0.04), P(x + tw, y + td - 0.04, z0 + 0.04), P(x + tw, y + td - 0.04, z1), P(x + tw, y + 0.04, z1)], {
      fill: AGUA,
      lw: 0.9,
      seed: seed + 2,
      amp: 0.06,
    });
  }
}

function pintarTomaM(ctx: CanvasRenderingContext2D, P: Proy, x: number, y: number, seed: number) {
  isoBox(ctx, P, x - 0.18, y - 0.18, 0, 0.36, 0.36, 0.9, "#9a948a", "#6e6a64", "#d7d1c6", seed);
  const a = P(x, y, 0.9);
  const b = P(x + 0.28, y, 0.9);
  const c = P(x + 0.28, y, 0.72);
  ctx.strokeStyle = TINTA;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.lineTo(c.x, c.y);
  ctx.stroke();
}

function carretillaMundo(ctx: CanvasRenderingContext2D, P: Proy, x: number, y: number, seed: number) {
  isoBox(ctx, P, x, y, 0.28, 0.72, 0.46, 0.22, "#8d6b3e", "#6a4e32", "#c4a574", seed);
  const w = P(x + 0.8, y + 0.22, 0.16);
  const k = metro(P, x, y);
  ctx.strokeStyle = TINTA;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.arc(w.x, w.y, k * 0.16, 0, Math.PI * 2);
  ctx.stroke();
  const h1 = P(x - 0.05, y + 0.08, 0.42);
  const h2 = P(x - 0.48, y + 0.02, 0.62);
  const h3 = P(x - 0.05, y + 0.36, 0.42);
  const h4 = P(x - 0.48, y + 0.3, 0.62);
  ctx.beginPath();
  ctx.moveTo(h1.x, h1.y);
  ctx.lineTo(h2.x, h2.y);
  ctx.moveTo(h3.x, h3.y);
  ctx.lineTo(h4.x, h4.y);
  ctx.stroke();
}

function pintarTrompoM(
  ctx: CanvasRenderingContext2D,
  P: Proy,
  prog: number,
  lista: boolean,
  gira: boolean,
  t: number,
  seed: number,
) {
  const cx = TROMPO_CUERPO.x;
  const cy = TROMPO_CUERPO.y;
  const k = metro(P, cx, cy);
  const ang = lista ? -0.62 : -0.28;
  sombraIso(ctx, P, cx, cy + 0.2, 1.25, 0.85);
  const tubo = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) => {
    const a = P(x0, y0, z0);
    const b = P(x1, y1, z1);
    ctx.save();
    ctx.strokeStyle = "#d07a32";
    ctx.lineWidth = Math.max(3.4, k * 0.1);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.strokeStyle = TINTA;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
  };
  const rueda = (x: number, y: number) => {
    const p = P(x, y, 0.18);
    ctx.beginPath();
    ctx.fillStyle = "#241e18";
    ctx.strokeStyle = TINTA;
    ctx.lineWidth = 1.8;
    ctx.arc(p.x, p.y, Math.max(7, k * 0.22), 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.fillStyle = "#c4a574";
    ctx.arc(p.x, p.y, Math.max(2.4, k * 0.07), 0, Math.PI * 2);
    ctx.fill();
  };
  rueda(cx - 0.05, cy + 0.72);
  rueda(cx + 0.78, cy + 0.42);
  tubo(cx - 0.05, cy + 0.72, 0.18, cx + 0.05, cy + 0.02, 1.05);
  tubo(cx + 0.78, cy + 0.42, 0.18, cx + 0.18, cy - 0.02, 1.08);
  tubo(cx - 0.72, cy - 0.15, 0.05, cx - 0.15, cy, 0.72);
  const eje = P(cx + 0.05, cy, 1.02);
  const rx = Math.max(26, k * 0.78);
  const ry = rx * 0.62;
  ctx.save();
  ctx.translate(eje.x, eje.y);
  ctx.rotate(ang);
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#d5dee4";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = TINTA;
  ctx.stroke();
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, 0, rx - 2, ry - 2, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.strokeStyle = "#6e777f";
  ctx.lineWidth = 2.2;
  const spin = gira ? t * rx * 0.9 : 0;
  for (let i = -3; i <= 3; i++) {
    const x = ((i * rx * 0.32 + spin) % (rx * 1.3)) - rx * 0.65;
    ctx.beginPath();
    ctx.moveTo(x, -ry);
    ctx.lineTo(x, ry);
    ctx.stroke();
  }
  ctx.restore();
  const bocaR = ry * 0.7;
  ctx.beginPath();
  ctx.fillStyle = "#241e18";
  ctx.arc(-rx + 1, 0, bocaR, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = TINTA;
  ctx.stroke();
  if (prog > 0.02) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(-rx + 1, 0, bocaR - 1.5, 0, Math.PI * 2);
    ctx.clip();
    const alto = bocaR * 2 * Math.min(1, prog);
    ctx.fillStyle = mezclaTinta(Math.min(1, prog));
    ctx.fillRect(-rx - bocaR, bocaR - alto, bocaR * 3, alto + 3);
    ctx.restore();
  }
  ctx.restore();
  if (lista) {
    const cos = Math.cos(ang);
    const sin = Math.sin(ang);
    const lx = -rx + 2;
    const ly = 0;
    const mx = eje.x + lx * cos - ly * sin;
    const my = eje.y + lx * sin + ly * cos;
    const bar = P(cx - 1.05, cy + 0.42, 0.36);
    ctx.save();
    ctx.strokeStyle = mezclaTinta(1);
    ctx.lineWidth = Math.max(6, k * 0.22);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(mx, my);
    ctx.quadraticCurveTo((mx + bar.x) / 2, Math.max(my, bar.y) + 18, bar.x, bar.y);
    ctx.stroke();
    ctx.restore();
  }
  isoBox(ctx, P, cx + 0.62, cy + 0.28, 0.28, 0.5, 0.36, 0.46, "#4e565c", "#2e3438", "#8d949c", seed + 11);
  const mot = P(cx + 0.88, cy + 0.46, 0.7);
  ctx.beginPath();
  ctx.strokeStyle = TINTA;
  ctx.fillStyle = "#c5ced4";
  ctx.lineWidth = 1.5;
  ctx.arc(mot.x, mot.y, Math.max(5, k * 0.14), 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  const vol = P(cx + 0.42, cy + 0.62, 0.62);
  const vr = Math.max(10, k * 0.28);
  ctx.beginPath();
  ctx.strokeStyle = TINTA;
  ctx.lineWidth = 2.2;
  ctx.arc(vol.x, vol.y, vr, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(vol.x - vr * 0.7, vol.y);
  ctx.lineTo(vol.x + vr * 0.7, vol.y);
  ctx.moveTo(vol.x, vol.y - vr * 0.7);
  ctx.lineTo(vol.x, vol.y + vr * 0.7);
  ctx.stroke();
  carretillaMundo(ctx, P, cx - 1.15, cy + 0.28, seed + 12);
}
function conoTruncado(ctx: CanvasRenderingContext2D, P: Proy, x: number, y: number, m3: number, seed: number) {
  if (!(m3 > 0.05)) return;
  const u = Math.min(1.25, Math.sqrt(m3 / 4.2));
  const rb = 0.5 + u * 0.95;
  const rt = rb * 0.4;
  const h = 0.32 + u * 0.95;
  sombraIso(ctx, P, x, y + rb * 0.08, rb, rb * 0.72);
  const N = 8;
  const ring = (r: number, z: number) => {
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2 - 0.5;
      pts.push(P(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.72, z));
    }
    return pts;
  };
  const base = ring(rb, 0.03);
  const top = ring(rt, h);
  const tintas = ["#c4a46c", "#a88452", "#cbb58a", "#8d6b3e"];
  for (let i = 0; i < N; i++) {
    const j = (i + 1) % N;
    ink(ctx, [base[i]!, base[j]!, top[j]!, top[i]!], { fill: tintas[i % tintas.length]!, lw: 1, seed: seed + i, amp: 0.4 });
  }
  ink(ctx, top, { fill: "#d8c294", lw: 1, seed: seed + 12, amp: 0.3 });
}

function cementoConLona(ctx: CanvasRenderingContext2D, P: Proy, x: number, y: number, q: number, mojado: boolean, seed: number) {
  if (q < 0.4) return;
  const n = q < 4 ? 2 : q < 10 ? 4 : q < 18 ? 6 : 8;
  const cols = 3;
  const rows = Math.ceil(n / cols);
  isoBox(ctx, P, x, y, 0, 1.15, 0.78, 0.1, "#a8845c", "#6a4e32", "#c4a574", seed);
  const bolsa = mojado ? "#5e5952" : "#c9c3b6";
  const sombra = mojado ? "#3e3a34" : "#8a847c";
  for (let i = 0; i < n; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    isoBox(ctx, P, x + 0.08 + col * 0.34, y + 0.08, 0.1 + row * 0.16, 0.3, 0.42, 0.14, bolsa, sombra, mojado ? "#7a756e" : "#e4ded2", seed + 3 + i);
  }
  const z = 0.12 + rows * 0.16;
  ink(
    ctx,
    [P(x - 0.08, y - 0.06, z), P(x + 1.22, y - 0.02, z + 0.04), P(x + 1.18, y + 0.86, z), P(x - 0.04, y + 0.8, z + 0.02)],
    { fill: mojado ? "#24332c" : "#3f6b45", lw: 1.05, seed: seed + 30, amp: 0.35 },
  );
}

function pintarPilasEntrada(ctx: CanvasRenderingContext2D, P: Proy, s: Estado) {
  const block = s.entrada.block?.q ?? 0;
  const vara = (s.entrada.v38?.q ?? 0) + (s.entrada.v14?.q ?? 0);
  const cem = s.entrada.cemento?.q ?? 0;
  const arena = s.inv.arena?.q ?? 0;
  const grava = s.inv.grava?.q ?? 0;
  const mojado = s.lluviaOn || s.avisoNubes;
  if (arena > 0.02) pilaM(ctx, P, 8.55, 18.45, arena, 2.2, "#e4c98a", 31);
  if (grava > 0.02) {
    pilaM(ctx, P, 15.55, 19.15, grava, 2.2, "#7a756e", 32);
    ctx.save();
    ctx.fillStyle = "#4a453c";
    for (let i = 0; i < 5; i++) {
      const p = P(15.35 + (i % 3) * 0.22, 19.05 + Math.floor(i / 3) * 0.16, 0.35 + (i % 2) * 0.2);
      ctx.fillRect(p.x, p.y, 3.2, 2.4);
    }
    ctx.restore();
  }
  if (cem > 0.2) cementoConLona(ctx, P, 12.15, 18.75, cem, mojado, 33);
  if (block > 0.5) paletaBlock(ctx, P, 11.15, 20.55, block, 34);
  if (vara > 0.2) {
    burroPar(ctx, P, 14.55, 20.55, 35);
    varillasSobre(ctx, P, 14.55, 20.55, vara);
    ctx.save();
    ctx.strokeStyle = "#6a4e32";
    ctx.lineWidth = 1.3;
    const a = P(14.7, 20.5, 0.84);
    const b = P(15.55, 20.62, 0.84);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.restore();
  }
}

function pilaM(ctx: CanvasRenderingContext2D, P: Proy, x: number, y: number, q: number, max: number, color: string, seed: number) {
  if (q <= 0.02) return;
  const u = Math.min(1, q / max);
  const r = 0.55 + u * 0.7;
  const h = 0.55 + u * 1.1;
  sombraIso(ctx, P, x, y, r * 0.95, r * 0.72);
  const cima = P(x, y, h);
  const a = P(x - r, y - r * 0.15, 0);
  const b = P(x + r * 0.1, y - r * 0.8, 0);
  const c = P(x + r, y + r * 0.12, 0);
  const d = P(x - r * 0.12, y + r * 0.68, 0);
  ink(ctx, [a, b, cima], { fill: color, lw: 1.05, seed, amp: 0.12 });
  ink(ctx, [b, c, cima], { fill: color, lw: 1.05, seed: seed + 1, amp: 0.12 });
  ink(ctx, [c, d, cima], { fill: color, lw: 1.05, seed: seed + 2, amp: 0.12 });
  ink(ctx, [d, a, cima], { fill: color, lw: 1.05, seed: seed + 3, amp: 0.12 });
}

function burroPar(ctx: CanvasRenderingContext2D, P: Proy, x: number, y: number, seed: number) {
  sombraIso(ctx, P, x + 0.55, y, 0.7, 0.35);
  ctx.save();
  ctx.strokeStyle = "#6a4e32";
  ctx.lineWidth = 2.4;
  const pata = (px: number) => {
    const iz = P(px, y - 0.28, 0);
    const de = P(px, y + 0.28, 0);
    const tope = P(px, y, 0.78);
    ctx.beginPath();
    ctx.moveTo(iz.x, iz.y);
    ctx.lineTo(tope.x, tope.y);
    ctx.lineTo(de.x, de.y);
    ctx.stroke();
  };
  pata(x);
  pata(x + 1.15);
  const a = P(x - 0.08, y, 0.76);
  const b = P(x + 1.28, y, 0.76);
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  ctx.restore();
  void seed;
}

function varillasSobre(ctx: CanvasRenderingContext2D, P: Proy, x: number, y: number, q: number) {
  if (q <= 0.2) return;
  const n = q < 6 ? 3 : q < 16 ? 5 : 8;
  ctx.save();
  ctx.strokeStyle = "#3e4a55";
  ctx.lineWidth = 1.7;
  for (let i = 0; i < n; i++) {
    const yy = y - 0.16 + (i % 4) * 0.1;
    const alt = 0.82 + (i >= 4 ? 0.045 : 0);
    const a = P(x - 0.2, yy, alt);
    const b = P(x + 1.4, yy + 0.04, alt);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  ctx.restore();
}

function paletaBlock(ctx: CanvasRenderingContext2D, P: Proy, x: number, y: number, q: number, seed: number) {
  sombraIso(ctx, P, x + 0.55, y + 0.38, 0.7, 0.42);
  isoBox(ctx, P, x, y, 0, 1.2, 0.82, 0.12, "#a8845c", "#6a4e32", "#c4a574", seed);
  ctx.save();
  ctx.strokeStyle = TINTA;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 1;
  for (let i = 1; i <= 3; i++) {
    const a = P(x + (1.2 * i) / 4, y, 0.12);
    const b = P(x + (1.2 * i) / 4, y + 0.82, 0.12);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  ctx.restore();
  if (q <= 0.5) return;
  const capas = q < 20 ? 1 : q < 60 ? 2 : q < 140 ? 3 : q < 280 ? 4 : 5;
  const por = Math.min(6, Math.max(2, Math.round(Math.min(q, 80) / (capas * 4))));
  for (let c = 0; c < capas; c++) {
    for (let i = 0; i < por; i++) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      isoBox(
        ctx,
        P,
        x + 0.08 + col * 0.36,
        y + 0.08 + row * 0.34,
        0.12 + c * 0.2,
        0.32,
        0.28,
        0.18,
        c % 2 ? "#c4b49a" : "#d7c4a8",
        "#8d7b66",
        "#efe6d4",
        seed + 20 + c * 6 + i,
      );
    }
  }
}

function manguera(ctx: CanvasRenderingContext2D, P: Proy) {
  const a = SITIOS.tanque;
  const b = SITIOS.toma;
  const pts: [number, number, number][] = [
    [a.x, a.y, 0.52],
    [(a.x * 2 + b.x) / 3, (a.y * 2 + b.y) / 3 - 0.15, 0.08],
    [(a.x + b.x * 2) / 3, (a.y + b.y * 2) / 3 + 0.08, 0.05],
    [b.x, b.y, 0.12],
  ];
  ctx.save();
  ctx.strokeStyle = "#1e3d2f";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  pts.forEach((p, i) => {
    const q = P(p[0], p[1], p[2]);
    if (i === 0) ctx.moveTo(q.x, q.y);
    else ctx.lineTo(q.x, q.y);
  });
  ctx.stroke();
  ctx.restore();
}

function pintarEntradaM(ctx: CanvasRenderingContext2D, P: Proy, cx: number, cy: number, seed: number) {
  const y = cy;
  const postes = [cx - 1.45, cx + 1.45];
  for (const x of postes) isoBox(ctx, P, x - 0.07, y - 0.07, 0, 0.14, 0.14, 2.25, "#4a3824", "#2e2418", "#6a4e32", seed);
  ctx.strokeStyle = TINTA;
  ctx.lineWidth = 1.15;
  for (const alt of [0.55, 1.15, 1.75]) {
    const a = P(cx - 1.4, y, alt);
    const b = P(cx + 1.4, y, alt);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  for (let i = 0; i < 5; i++) {
    const x = cx - 1.15 + i * 0.48;
    const a = P(x, y, 0.15);
    const b = P(x, y, 1.7);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
}

function pintarFerreteriaM(ctx: CanvasRenderingContext2D, P: Proy, cx: number, cy: number, seed: number) {
  const dx = 4.1;
  const dy = 2.5;
  const h = 3.05;
  const x = cx - dx / 2;
  const y = cy - dy / 2;
  isoBox(ctx, P, x, y, 0, dx, dy, h, "#efe4cf", "#e0d2ba", "#d7d1c6", seed);
  ink(ctx, [P(x - 0.05, y + dy, h - 0.55), P(x + dx + 0.35, y + dy + 0.55, h - 0.7), P(x + dx + 0.35, y + dy + 0.55, h - 0.15), P(x - 0.05, y + dy, h)], {
    fill: "#b8432f",
    lw: 1,
    seed: seed + 2,
    amp: 0.1,
  });
  isoBox(ctx, P, x + 0.7, y + dy - 0.08, h - 0.15, 2.5, 0.12, 0.55, "#8d6b3e", "#6a4e32", "#c4a574", seed + 3);
  const m = P(x + dx / 2, y + dy + 0.02, h + 0.12);
  const k = metro(P, cx, cy);
  ctx.fillStyle = TINTA;
  ctx.font = `600 ${Math.max(13, Math.round(k * 0.42))}px 'Patrick Hand', cursive`;
  ctx.textAlign = "center";
  ctx.fillText("EL CRUCE", m.x, m.y);
  isoBox(ctx, P, x + dx / 2 - 0.28, y + dy - 0.06, 0, 0.56, 0.08, 2.15, "#3d342a", "#241e18", "#4a4034", seed + 4);
}

function pintarCamion(ctx: CanvasRenderingContext2D, x: number, y: number, z: number, age: number, seed: number) {
  const Sx = sxu(z);
  const Sy = syu(z);
  const V = 30 * z;
  const pt = (ix: number, iy: number, iz: number) => ({ x: x + (ix - iy) * Sx, y: y + (ix + iy) * Sy - iz * V });
  const tilt =
    age < 1.15 || age > 3.85
      ? 0
      : age < 1.75
        ? (age - 1.15) / 0.6
        : age < 3.15
          ? 1
          : (3.85 - age) / 0.7;
  const lift = tilt * 3.15;
  const tail = -5.35;
  const span = 3.85;
  const cama = (ix: number, iy: number, iz: number) => {
    const u = Math.max(0, Math.min(1, (ix - tail) / span));
    const p = pt(ix, iy, iz + lift * u);
    p.y -= tilt * u * 78;
    return p;
  };
  const x0 = -5.25;
  const x1 = -1.5;
  const y0 = -0.9;
  const y1 = 0.9;
  const z0 = 0.86;
  const z1 = 1.72;
  ctx.save();
  ctx.fillStyle = "rgba(29,23,18,0.2)";
  const sc = pt(-1.7, 0.2, 0.02);
  ctx.beginPath();
  ctx.ellipse(sc.x, sc.y + 6, V * 2.35, V * 0.7, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = "#241e18";
  ctx.lineWidth = Math.max(3.5, V * 0.1);
  ctx.lineCap = "butt";
  for (const iy of [-0.42, 0.42]) {
    const a = pt(x0 + 0.15, iy, 0.42);
    const b = pt(0.7, iy, 0.42);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  ctx.restore();
  const rueda = (ix: number, iy: number, r: number) => {
    const w = pt(ix, iy, r * 0.92);
    ctx.beginPath();
    ctx.fillStyle = "#1d1712";
    ctx.arc(w.x, w.y, r * V, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = TINTA;
    ctx.stroke();
    ctx.beginPath();
    ctx.fillStyle = "#5c5348";
    ctx.arc(w.x, w.y, r * V * 0.38, 0, Math.PI * 2);
    ctx.fill();
  };
  rueda(-4.35, 0.72, 0.38);
  rueda(-3.45, 0.72, 0.38);
  const cab = (ix: number, iy: number, iz = 0) => pt(ix, iy, iz);
  isoBox(ctx, cab, 0.05, -0.62, 0.48, 1.15, 1.24, 0.55, "#c9962e", "#a67c24", "#e0b44a", seed + 3);
  isoBox(ctx, cab, -1.05, -0.7, 0.48, 1.1, 1.4, 1.22, "#e0b44a", "#c9962e", "#f2d27a", seed + 4);
  ink(ctx, [cab(-0.15, 0.72, 0.95), cab(0.85, 0.72, 0.95), cab(0.85, 0.72, 1.48), cab(-0.15, 0.72, 1.48)], {
    fill: "#1a242c",
    lw: 1,
    seed: seed + 8,
    amp: 0.04,
  });
  ink(ctx, [cab(1.12, -0.35, 0.85), cab(1.12, 0.42, 0.85), cab(1.12, 0.42, 1.42), cab(1.12, -0.35, 1.42)], {
    fill: "#1a242c",
    lw: 1,
    seed: seed + 9,
    amp: 0.04,
  });
  const volcando = tilt > 0.2;
  if (!volcando) {
    ink(ctx, [cama(x0, y0, z0), cama(x1, y0, z0), cama(x1, y1, z0), cama(x0, y1, z0)], {
      fill: "#c4a574",
      lw: 1.4,
      seed,
      amp: 0.08,
    });
    ink(ctx, [cama(x0, y1, z0), cama(x1, y1, z0), cama(x1, y1, z1), cama(x0, y1, z1)], {
      fill: "#4e4a45",
      lw: 1.2,
      seed: seed + 1,
      amp: 0.08,
    });
    ink(ctx, [cama(x1, y0, z0), cama(x1, y1, z0), cama(x1, y1, z1 + 0.12), cama(x1, y0, z1 + 0.12)], {
      fill: "#5c5853",
      lw: 1.1,
      seed: seed + 2,
      amp: 0.06,
    });
  }
  const abre = Math.min(1, tilt / 0.45);
  if (!volcando) {
    ink(
      ctx,
      [
        cama(x0, y0, z0),
        cama(x0, y1, z0),
        cama(x0 - abre * 0.05, y1 + abre * 0.35, z1 - abre * 0.85),
        cama(x0 - abre * 0.05, y0 + abre * 0.35, z1 - abre * 0.85),
      ],
      { fill: "#3a3632", lw: 1.05, seed: seed + 6, amp: 0.05 },
    );
  }
  if (!volcando) {
    ctx.save();
    ctx.strokeStyle = "#cfc8bc";
    ctx.lineWidth = 1.4;
    const lipA = cama(x0, y1, z1);
    const lipB = cama(x1, y1, z1);
    ctx.beginPath();
    ctx.moveTo(lipA.x, lipA.y);
    ctx.lineTo(lipB.x, lipB.y);
    ctx.stroke();
    ctx.restore();
  }
  rueda(-4.35, 1.08, 0.46);
  rueda(-3.45, 1.08, 0.46);
  rueda(0.15, 1.02, 0.36);
  if (volcando) {
    const rear = pt(x0 + 0.05, 0.05, 0.95);
    const piso = -1.15 * tilt;
    const L = Math.max(92, 118 * z);
    const alto = Math.max(22, 34 * z);
    ctx.save();
    ctx.translate(rear.x, rear.y);
    ctx.rotate(piso);
    ctx.fillStyle = "#6a4e32";
    ctx.strokeStyle = TINTA;
    ctx.lineWidth = 2.4;
    ctx.fillRect(0, -alto * 0.55, L, alto * 0.55);
    ctx.strokeRect(0, -alto * 0.55, L, alto * 0.55);
    ctx.fillStyle = "#e8c98a";
    ctx.fillRect(0, -alto, L, alto * 0.5);
    ctx.strokeRect(0, -alto, L, alto * 0.5);
    ctx.fillStyle = "#c4a574";
    for (let i = 0; i < 3; i++) {
      const bx = 8 + i * (L * 0.22);
      ctx.fillRect(bx, -alto + 4, L * 0.16, alto * 0.28);
      ctx.strokeRect(bx, -alto + 4, L * 0.16, alto * 0.28);
    }
    ctx.rotate(1.15);
    ctx.fillStyle = "#3a2a1c";
    ctx.fillRect(-4, 0, 8, alto * 1.35);
    ctx.strokeRect(-4, 0, 8, alto * 1.35);
    ctx.restore();
    ctx.save();
    for (let i = 0; i < 6; i++) {
      const u = (age * 1.35 + i * 0.17) % 1;
      const s = pt(x0 - 0.15 - u * 1.15, i % 2 ? 0.55 : -0.15, 0.05);
      const w = Math.max(14, 18 * z);
      const h = Math.max(10, 12 * z);
      ctx.fillStyle = i % 2 ? "#c4b49a" : "#f2e2b8";
      ctx.strokeStyle = TINTA;
      ctx.lineWidth = 1.2;
      ctx.fillRect(s.x - u * 10, s.y + u * 46, w, h);
      ctx.strokeRect(s.x - u * 10, s.y + u * 46, w, h);
    }
    ctx.restore();
  }
}

function pintarMango(ctx: CanvasRenderingContext2D, P: Proy, x: number, y: number, seed: number) {
  const k = metro(P, x, y);
  const sombra: { x: number; y: number }[] = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    sombra.push(P(x + 0.35 + Math.cos(a) * 1.45, y + 0.28 + Math.sin(a) * 0.72, 0.02));
  }
  ctx.save();
  trazo(ctx, sombra, true);
  ctx.fillStyle = "rgba(29,23,18,0.2)";
  ctx.fill();
  ctx.restore();
  hatch(ctx, sombra, 5);

  const base = P(x, y, 0);
  const codo = P(x + 0.22, y - 0.08, 1.2);
  const copa = P(x - 0.06, y + 0.05, 2.25);
  ctx.save();
  ctx.strokeStyle = TINTA;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(7, k * 0.28);
  ctx.beginPath();
  ctx.moveTo(base.x, base.y);
  ctx.quadraticCurveTo(codo.x + k * 0.12, codo.y, copa.x, copa.y);
  ctx.stroke();
  const rama = P(x + 0.42, y - 0.12, 1.85);
  ctx.lineWidth = Math.max(3.5, k * 0.12);
  ctx.beginPath();
  ctx.moveTo(P(x + 0.04, y - 0.02, 1.55).x, P(x + 0.04, y - 0.02, 1.55).y);
  ctx.quadraticCurveTo((codo.x + rama.x) / 2, (codo.y + rama.y) / 2 - k * 0.08, rama.x, rama.y);
  ctx.stroke();
  ctx.restore();

  const lobulos: { dx: number; dy: number; z: number; r: number; fill: string }[] = [
    { dx: 0, dy: 0, z: 3.35, r: 0.92, fill: "#2f5a34" },
    { dx: -0.82, dy: -0.12, z: 3.05, r: 0.7, fill: "#3f6b45" },
    { dx: 0.78, dy: -0.22, z: 3.12, r: 0.74, fill: "#2f5a34" },
    { dx: 0.12, dy: 0.68, z: 2.78, r: 0.68, fill: "#3f6b45" },
    { dx: -0.52, dy: 0.42, z: 2.95, r: 0.64, fill: "#2f5a34" },
    { dx: 0.5, dy: 0.32, z: 3.28, r: 0.6, fill: "#3f6b45" },
    { dx: -0.1, dy: -0.52, z: 3.55, r: 0.66, fill: "#2f5a34" },
  ];
  lobulos.forEach((L, i) => {
    const pts: { x: number; y: number }[] = [];
    for (let n = 0; n < 7; n++) {
      const a = (n / 7) * Math.PI * 2;
      pts.push(P(x + L.dx + Math.cos(a) * L.r * 0.85, y + L.dy + Math.sin(a) * L.r * 0.52, L.z + Math.sin(a * 2) * 0.08));
    }
    ink(ctx, pts, { fill: L.fill, lw: 1.35, seed: seed + i * 3, amp: 1.1 });
  });
}

function monton(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string, seed: number) {
  ink(
    ctx,
    [
      { x: x - r, y },
      { x: x - r * 0.4, y: y - r * 0.85 },
      { x: x + r * 0.15, y: y - r },
      { x: x + r, y: y - r * 0.2 },
      { x: x + r * 0.7, y: y + r * 0.15 },
      { x, y: y + r * 0.2 },
    ],
    { fill, lw: 2.6, seed },
  );
}

function sombraPie(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number) {
  ctx.save();
  ctx.fillStyle = "rgba(29,23,18,0.34)";
  ctx.beginPath();
  ctx.ellipse(x, y + 5, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function saco(ctx: CanvasRenderingContext2D, x: number, y: number, seed: number) {
  ink(
    ctx,
    [
      { x: x - 12, y },
      { x: x - 14, y: y - 18 },
      { x, y: y - 24 },
      { x: x + 14, y: y - 16 },
      { x: x + 12, y: y + 2 },
    ],
    { fill: "#9a948a", lw: 2.6, seed },
  );
}

function pintarFerreteria(ctx: CanvasRenderingContext2D, x: number, y: number, seed: number) {
  sombraPie(ctx, x + 6, y, 96, 18);
  ink(
    ctx,
    [
      { x: x - 96, y: y + 8 },
      { x: x - 100, y: y - 62 },
      { x: x + 100, y: y - 68 },
      { x: x + 92, y: y + 10 },
    ],
    { fill: "#efe4cf", lw: 3.1, seed, amp: 1.1 },
  );
  ink(
    ctx,
    [
      { x: x - 108, y: y - 48 },
      { x: x - 72, y: y - 118 },
      { x: x + 112, y: y - 108 },
      { x: x + 84, y: y - 40 },
    ],
    { fill: "#3d5f8a", lw: 3.1, seed: seed + 1, amp: 1 },
  );
  ctx.save();
  ctx.strokeStyle = "#e8dcc2";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  for (let i = 0; i < 7; i++) {
    const t = (i + 0.5) / 7;
    ctx.beginPath();
    ctx.moveTo(x - 98 + t * 186, y - 52);
    ctx.lineTo(x - 68 + t * 164, y - 104);
    ctx.stroke();
  }
  ctx.restore();
  ink(
    ctx,
    [
      { x: x - 52, y: y - 22 },
      { x: x - 50, y: y - 52 },
      { x: x + 54, y: y - 56 },
      { x: x + 56, y: y - 20 },
    ],
    { fill: "#8d5a3c", lw: 2.8, seed: seed + 2 },
  );
  ctx.save();
  ctx.fillStyle = TINTA;
  ctx.font = "700 18px 'Patrick Hand', cursive";
  ctx.textAlign = "center";
  ctx.fillText("FERRETERÍA", x + 2, y - 32);
  ctx.restore();
  ink(
    ctx,
    [
      { x: x - 16, y: y + 8 },
      { x: x - 16, y: y - 30 },
      { x: x + 18, y: y - 34 },
      { x: x + 20, y: y + 8 },
    ],
    { fill: "#3d342a", lw: 2.8, seed: seed + 3 },
  );
  saco(ctx, x - 62, y + 4, seed + 4);
  saco(ctx, x + 58, y + 6, seed + 5);
}

function pintarAlmacen(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  seed: number,
  cemento: number,
  varilla: number,
  block: number,
) {
  sombraPie(ctx, x, y, 74, 16);
  ink(
    ctx,
    [
      { x: x - 74, y: y + 6 },
      { x: x - 78, y: y - 56 },
      { x: x + 72, y: y - 62 },
      { x: x + 66, y: y + 8 },
    ],
    { fill: "#d7d1c6", lw: 3, seed },
  );
  ink(
    ctx,
    [
      { x: x - 86, y: y - 46 },
      { x: x - 36, y: y - 104 },
      { x: x + 84, y: y - 96 },
      { x: x + 46, y: y - 42 },
    ],
    { fill: "#8d5a3c", lw: 3, seed: seed + 1 },
  );
  ctx.save();
  ctx.strokeStyle = TINTA;
  ctx.globalAlpha = 0.4;
  ctx.lineWidth = 1.8;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(x - 72 + i * 24, y - 50);
    ctx.lineTo(x - 28 + i * 18, y - 92);
    ctx.stroke();
  }
  ctx.restore();
  ink(
    ctx,
    [
      { x: x - 30, y: y + 6 },
      { x: x - 32, y: y - 42 },
      { x: x + 36, y: y - 46 },
      { x: x + 38, y: y + 6 },
    ],
    { fill: "#241e18", lw: 3, seed: seed + 2 },
  );
  const fundas = Math.min(8, Math.max(0, Math.round(cemento)));
  for (let i = 0; i < fundas; i++) {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const bx = x - 20 + col * 13;
    const by = y - 4 - row * 14;
    ctx.fillStyle = "#9a948a";
    ctx.strokeStyle = TINTA;
    ctx.lineWidth = 1.7;
    ctx.fillRect(bx, by - 12, 11, 13);
    ctx.strokeRect(bx, by - 12, 11, 13);
  }
  const rods = varilla <= 0.2 ? 0 : varilla < 6 ? 2 : varilla < 16 ? 4 : 6;
  ctx.strokeStyle = TINTA;
  ctx.lineWidth = 2.4;
  ctx.lineCap = "round";
  for (let i = 0; i < rods; i++) {
    ctx.beginPath();
    ctx.moveTo(x - 24 + i * 5, y + 2);
    ctx.lineTo(x - 34 + i * 5, y - 40);
    ctx.stroke();
  }
  const capas = block <= 1 ? 0 : block < 30 ? 1 : block < 100 ? 2 : block < 220 ? 3 : 5;
  for (let i = 0; i < capas; i++) {
    ctx.fillStyle = i % 2 ? "#c4b49a" : "#b5a48c";
    ctx.strokeStyle = TINTA;
    ctx.lineWidth = 1.7;
    ctx.fillRect(x + 42, y - 6 - i * 9, 24, 9);
    ctx.strokeRect(x + 42, y - 6 - i * 9, 24, 9);
  }
}

function pintarOficina(ctx: CanvasRenderingContext2D, x: number, y: number, seed: number) {
  sombraPie(ctx, x, y, 42, 12);
  ink(
    ctx,
    [
      { x: x - 42, y: y + 4 },
      { x: x - 46, y: y - 38 },
      { x: x + 38, y: y - 42 },
      { x: x + 34, y: y + 6 },
    ],
    { fill: "#efe4cf", lw: 3, seed },
  );
  ink(
    ctx,
    [
      { x: x - 50, y: y - 32 },
      { x: x - 6, y: y - 74 },
      { x: x + 46, y: y - 66 },
      { x: x + 14, y: y - 28 },
    ],
    { fill: "#3f6b45", lw: 3, seed: seed + 1 },
  );
  ink(
    ctx,
    [
      { x: x + 6, y: y - 16 },
      { x: x + 6, y: y - 32 },
      { x: x + 22, y: y - 34 },
      { x: x + 22, y: y - 14 },
    ],
    { fill: "#f2d27a", lw: 2.6, seed: seed + 2 },
  );
  ctx.strokeStyle = TINTA;
  ctx.lineWidth = 2.6;
  ctx.strokeRect(x - 18, y - 14, 20, 8);
  ctx.beginPath();
  ctx.moveTo(x - 62, y + 4);
  ctx.lineTo(x - 62, y - 18);
  ctx.moveTo(x - 72, y - 18);
  ctx.lineTo(x - 52, y - 18);
  ctx.moveTo(x - 70, y + 4);
  ctx.lineTo(x - 54, y + 4);
  ctx.moveTo(x - 70, y + 4);
  ctx.lineTo(x - 70, y - 8);
  ctx.moveTo(x - 54, y + 4);
  ctx.lineTo(x - 54, y - 8);
  ctx.stroke();
}

function pintarEntrada(ctx: CanvasRenderingContext2D, x: number, y: number, seed: number) {
  sombraPie(ctx, x, y + 4, 52, 12);
  ink(
    ctx,
    [
      { x: x - 50, y: y + 10 },
      { x: x - 22, y: y - 18 },
      { x: x + 52, y: y - 8 },
      { x: x + 24, y: y + 18 },
    ],
    { fill: "#6a4e32", lw: 2.8, seed, amp: 1 },
  );
  ctx.strokeStyle = TINTA;
  ctx.lineCap = "round";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(x - 36, y + 12);
  ctx.lineTo(x - 40, y - 52);
  ctx.moveTo(x + 36, y + 14);
  ctx.lineTo(x + 32, y - 56);
  ctx.stroke();
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x - 44, y - 48);
  ctx.lineTo(x + 40, y - 54);
  ctx.moveTo(x - 42, y - 30);
  ctx.lineTo(x + 38, y - 36);
  ctx.stroke();
}

function pintarToma(ctx: CanvasRenderingContext2D, x: number, y: number, seed: number) {
  sombraPie(ctx, x + 10, y, 32, 10);
  ink(ctx, ellipse(x + 18, y - 6, 26, 14), { fill: "#d9d3c7", lw: 2.8, seed, amp: 1 });
  ink(ctx, ellipse(x + 18, y - 22, 20, 9), { fill: AGUA, lw: 2.6, seed: seed + 1, amp: 0.8 });
  ctx.strokeStyle = TINTA;
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x - 22, y + 4);
  ctx.lineTo(x - 22, y - 40);
  ctx.lineTo(x - 4, y - 40);
  ctx.lineTo(x - 4, y - 30);
  ctx.stroke();
  ctx.fillStyle = AGUA;
  ctx.beginPath();
  ctx.moveTo(x - 4, y - 26);
  ctx.bezierCurveTo(x + 8, y - 16, x + 6, y - 4, x - 4, y);
  ctx.bezierCurveTo(x - 14, y - 4, x - 16, y - 16, x - 4, y - 26);
  ctx.fill();
  ctx.lineWidth = 2.2;
  ctx.stroke();
}

function gotaTinta(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.beginPath();
  ctx.moveTo(x, y - s * 0.58);
  ctx.bezierCurveTo(x + s * 0.46, y - s * 0.08, x + s * 0.4, y + s * 0.38, x, y + s * 0.58);
  ctx.bezierCurveTo(x - s * 0.4, y + s * 0.38, x - s * 0.46, y - s * 0.08, x, y - s * 0.58);
  ctx.closePath();
  ctx.fillStyle = AGUA;
  ctx.fill();
  ctx.strokeStyle = TINTA;
  ctx.lineWidth = Math.max(1.8, s * 0.14);
  ctx.stroke();
}

function figura(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  p: {
    camisa: string;
    casco: string;
    letra?: string;
    t: number;
    trabaja: boolean;
    cansancio: number;
    caminando: boolean;
    anim: string;
    semilla: number;
    z: number;
    oficio?: Oficio | "maestro";
  },
) {
  const k = 30 * p.z;
  const paso = p.cansancio >= 70 ? 0.55 : 1;
  const walk = p.caminando ? Math.sin(p.t * 9 + p.semilla) * paso : 0;
  const bob = Math.abs(walk) * k * 0.035;
  const quieto = !p.trabaja && !p.caminando && p.anim !== "papel" && p.anim !== "saco" && p.anim !== "varilla" && p.anim !== "carretilla";
  const swing = p.trabaja ? Math.sin(p.t * 8 + p.semilla) : 0;
  const lw = Math.max(1, k * 0.03);
  ctx.save();
  ctx.translate(sx, sy - bob);
  ctx.fillStyle = "rgba(29,23,18,0.28)";
  ctx.beginPath();
  ctx.ellipse(0, k * 0.02, k * 0.2, k * 0.07, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = TINTA;
  ctx.fillStyle = "#2a261f";
  ctx.lineWidth = lw;
  ctx.lineJoin = "bevel";
  const hip = -0.92 * k;
  const sho = -1.44 * k;
  const pierna = (x0: number, x1: number) => {
    ctx.beginPath();
    ctx.moveTo(x0, hip);
    ctx.lineTo(x1, -0.14 * k);
    ctx.stroke();
    ctx.fillStyle = "#1a1612";
    ctx.fillRect(x1 - 0.07 * k, -0.14 * k, 0.15 * k, 0.12 * k);
    ctx.strokeRect(x1 - 0.07 * k, -0.14 * k, 0.15 * k, 0.12 * k);
  };
  pierna(-0.07 * k, -0.07 * k - walk * 0.1 * k);
  pierna(0.07 * k, 0.07 * k + walk * 0.1 * k);
  ctx.fillStyle = p.camisa;
  ctx.beginPath();
  ctx.moveTo(-0.16 * k, hip);
  ctx.lineTo(0.16 * k, hip);
  ctx.lineTo(0.2 * k, sho);
  ctx.lineTo(-0.2 * k, sho);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  const brazo = (lado: number, akimbo: boolean) => {
    ctx.beginPath();
    ctx.moveTo(lado * 0.18 * k, sho + 0.04 * k);
    if (akimbo) {
      ctx.lineTo(lado * 0.32 * k, sho + 0.28 * k);
      ctx.lineTo(lado * 0.14 * k, hip + 0.06 * k);
    } else {
      ctx.lineTo(lado * 0.22 * k, hip + 0.18 * k + (lado > 0 ? swing * 0.08 * k : -walk * 0.04 * k));
    }
    ctx.stroke();
  };
  brazo(-1, quieto);
  brazo(1, quieto);
  ctx.fillStyle = "#c49a78";
  ctx.beginPath();
  ctx.moveTo(-0.09 * k, sho + 0.02 * k);
  ctx.lineTo(0.09 * k, sho + 0.02 * k);
  ctx.lineTo(0.08 * k, sho - 0.16 * k);
  ctx.lineTo(-0.08 * k, sho - 0.16 * k);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = TINTA;
  ctx.fillRect(-0.045 * k, sho - 0.08 * k, 0.025 * k, 0.025 * k);
  ctx.fillRect(0.02 * k, sho - 0.08 * k, 0.025 * k, 0.025 * k);
  ctx.fillStyle = p.casco;
  ctx.beginPath();
  ctx.moveTo(-0.11 * k, sho - 0.12 * k);
  ctx.lineTo(0.12 * k, sho - 0.12 * k);
  ctx.lineTo(0.1 * k, sho - 0.28 * k);
  ctx.lineTo(-0.09 * k, sho - 0.28 * k);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillRect(-0.13 * k, sho - 0.14 * k, 0.26 * k, 0.035 * k);
  if (p.letra) {
    ctx.fillStyle = TINTA;
    ctx.font = `700 ${Math.max(8, Math.round(k * 0.16))}px 'Patrick Hand', cursive`;
    ctx.textAlign = "center";
    ctx.fillText(p.letra, 0, sho - 0.16 * k);
  }
  if (p.oficio === "albanil" || p.oficio === "maestro") {
    ctx.fillStyle = ORO;
    ctx.fillRect(-0.14 * k, hip + 0.04 * k, 0.12 * k, 0.035 * k);
    ctx.strokeRect(-0.14 * k, hip + 0.04 * k, 0.12 * k, 0.035 * k);
  }
  const herramienta = () => {
    let kind = p.anim;
    if (kind === "cuchara" && p.oficio === "varillero") kind = "tenaza";
    if (kind === "nada" || kind === "") {
      if (p.oficio === "varillero") kind = "tenaza";
      else if (p.oficio === "carpintero") kind = "serrucho";
      else if (p.oficio === "albanil" || p.oficio === "maestro") kind = "cuchara";
      else if (p.oficio === "peon" || p.oficio === "ayudante") kind = "pala";
    }
    ctx.save();
    ctx.translate(0.24 * k, -1.2 * k);
    if (!quieto) ctx.rotate(swing * 0.65);
    ctx.strokeStyle = TINTA;
    ctx.lineWidth = Math.max(1.4, lw);
    if (kind === "pala") {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0.08 * k, 0.55 * k);
      ctx.stroke();
      ctx.fillStyle = "#8a8680";
      ctx.fillRect(0.02 * k, 0.5 * k, 0.16 * k, 0.07 * k);
      ctx.strokeRect(0.02 * k, 0.5 * k, 0.16 * k, 0.07 * k);
    } else if (kind === "martillo" || kind === "serrucho") {
      ctx.beginPath();
      ctx.moveTo(0, 0.05 * k);
      ctx.lineTo(0.02 * k, 0.32 * k);
      ctx.stroke();
      ctx.fillStyle = "#6a4e32";
      ctx.fillRect(-0.06 * k, -0.02 * k, 0.16 * k, 0.06 * k);
      ctx.strokeRect(-0.06 * k, -0.02 * k, 0.16 * k, 0.06 * k);
      if (p.oficio === "carpintero" || kind === "serrucho") {
        ctx.beginPath();
        ctx.moveTo(-0.22 * k, 0.15 * k);
        ctx.lineTo(-0.02 * k, 0.42 * k);
        ctx.lineTo(0.02 * k, 0.38 * k);
        ctx.lineTo(-0.18 * k, 0.11 * k);
        ctx.closePath();
        ctx.fillStyle = "#c4a574";
        ctx.fill();
        ctx.stroke();
      }
    } else if (kind === "cubeta") {
      ctx.fillStyle = AGUA;
      ctx.beginPath();
      ctx.moveTo(-0.02 * k, 0.05 * k);
      ctx.lineTo(0.16 * k, 0.05 * k);
      ctx.lineTo(0.13 * k, 0.2 * k);
      ctx.lineTo(0.01 * k, 0.2 * k);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (kind === "cuchara") {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0.12 * k, 0.16 * k);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0.08 * k, 0.12 * k);
      ctx.lineTo(0.2 * k, 0.16 * k);
      ctx.lineTo(0.14 * k, 0.24 * k);
      ctx.closePath();
      ctx.fillStyle = "#d7d2c8";
      ctx.fill();
      ctx.stroke();
    } else if (kind === "tenaza") {
      ctx.beginPath();
      ctx.moveTo(0, 0.05 * k);
      ctx.lineTo(0.1 * k, 0.2 * k);
      ctx.moveTo(0.08 * k, 0.05 * k);
      ctx.lineTo(0.16 * k, 0.2 * k);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-0.08 * k, 0.12 * k, 0.05 * k, 0, Math.PI * 1.6);
      ctx.stroke();
    } else if (kind === "saco") {
      ctx.fillStyle = "#9a948a";
      ctx.fillRect(-0.28 * k, -0.42 * k, 0.28 * k, 0.34 * k);
      ctx.strokeRect(-0.28 * k, -0.42 * k, 0.28 * k, 0.34 * k);
    } else if (kind === "varilla") {
      ctx.strokeStyle = "#3e4a55";
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-0.34 * k, -0.28 * k - i * 0.035 * k);
        ctx.lineTo(0.16 * k, -0.12 * k - i * 0.035 * k);
        ctx.stroke();
      }
    } else if (kind === "carretilla") {
      ctx.strokeStyle = TINTA;
      ctx.beginPath();
      ctx.arc(0.28 * k, 0.42 * k, 0.09 * k, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#c4b49a";
      ctx.fillRect(0.02 * k, 0.22 * k, 0.26 * k, 0.14 * k);
      ctx.strokeRect(0.02 * k, 0.22 * k, 0.26 * k, 0.14 * k);
    } else if (kind === "papel") {
      ctx.fillStyle = PAPEL;
      ctx.fillRect(0.02 * k, -0.02 * k, 0.14 * k, 0.18 * k);
      ctx.strokeRect(0.02 * k, -0.02 * k, 0.14 * k, 0.18 * k);
      ctx.beginPath();
      ctx.moveTo(0.04 * k, 0.04 * k);
      ctx.lineTo(0.14 * k, 0.04 * k);
      ctx.moveTo(0.04 * k, 0.08 * k);
      ctx.lineTo(0.14 * k, 0.08 * k);
      ctx.stroke();
    }
    ctx.restore();
  };
  herramienta();
  const gotas = p.cansancio >= 85 ? 3 : p.cansancio >= 70 ? 2 : p.cansancio >= 50 ? 1 : 0;
  if (gotas > 0) {
    const alto = Math.max(22, k * 0.55);
    for (let i = 0; i < gotas; i++) {
      const x = -0.46 * k - i * alto * 0.95;
      const y = sho - 0.2 * k + (i % 2) * alto * 0.28;
      gotaTinta(ctx, x, y, alto);
    }
  }
  ctx.restore();
}

function persona(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  p: {
    camisa: string;
    casco: string;
    letra?: string;
    t: number;
    trabaja: boolean;
    cansancio: number;
    caminando: boolean;
    anim: string;
    semilla: number;
    z?: number;
    oficio?: Oficio | "maestro";
  },
) {
  if (p.z) {
    figura(ctx, sx, sy, { ...p, z: p.z });
    return;
  }
  const pasoCorto = p.cansancio >= 70 ? 0.55 : 1;
  const walk = p.caminando ? Math.sin(p.t * 9 + p.semilla) * pasoCorto : 0;
  const bob = Math.abs(walk) * 4;
  const squash = p.caminando ? 1 + Math.sin(p.t * 9 + p.semilla) * 0.07 * pasoCorto : 1;
  const lean = p.cansancio >= 70 ? 0.34 : 0;
  const hv = Math.floor(p.t / 0.14);
  ctx.save();
  ctx.translate(sx, sy - bob);
  ctx.rotate(lean);
  ctx.scale(1.04 - (squash - 1) * 0.4, squash);
  ctx.fillStyle = "rgba(20,16,12,0.35)";
  ctx.beginPath();
  ctx.ellipse(0, 2, 11, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  const swing = p.trabaja ? Math.sin(p.t * 8 + p.semilla) : 0;
  // legs
  ctx.strokeStyle = TINTA;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-4, -2);
  ctx.lineTo(-6 - walk * 3, 8);
  ctx.moveTo(4, -2);
  ctx.lineTo(6 + walk * 3, 8);
  ctx.stroke();
  // pear body
  ink(ctx, [
    { x: -9, y: -6 },
    { x: -11, y: -18 },
    { x: -6, y: -28 },
    { x: 7, y: -27 },
    { x: 12, y: -16 },
    { x: 9, y: -4 },
  ], { fill: p.camisa, lw: 1.6, seed: p.semilla + hv * 13, amp: 1.6 });
  // arm + tool
  ctx.save();
  ctx.translate(8, -20);
  ctx.rotate(swing * 0.8);
  ctx.strokeStyle = TINTA;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(10, 8);
  ctx.stroke();
  if (p.anim === "pala") {
    ctx.fillStyle = "#8d8a84";
    ctx.fillRect(8, 6, 7, 4);
    ctx.strokeRect(8, 6, 7, 4);
  } else if (p.anim === "martillo") {
    ctx.fillStyle = "#6b4a32";
    ctx.fillRect(8, 2, 4, 10);
  } else if (p.anim === "cubeta") {
    ctx.fillStyle = p.trabaja ? "#9aa3a0" : AGUA;
    ink(ctx, [
      { x: 6, y: 4 },
      { x: 16, y: 4 },
      { x: 14, y: 12 },
      { x: 8, y: 12 },
    ], { fill: "#5f8a8b", lw: 1.2, seed: p.semilla + 4 + hv * 13, amp: 1.6 });
  } else if (p.anim === "cuchara") {
    ctx.fillStyle = "#d7d2c8";
    ctx.beginPath();
    ctx.ellipse(12, 8, 5, 3, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (p.anim === "saco") {
    ctx.fillStyle = "#9a948a";
    ctx.fillRect(-4, -16, 10, 12);
    ctx.strokeRect(-4, -16, 10, 12);
  } else if (p.anim === "varilla") {
    ctx.strokeStyle = "#6e5a4a";
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-8, -18 - i * 2);
      ctx.lineTo(14, -10 - i * 2);
      ctx.stroke();
    }
  } else if (p.anim === "carretilla") {
    ctx.strokeStyle = TINTA;
    ctx.beginPath();
    ctx.arc(16, 10, 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#c4b49a";
    ctx.fillRect(4, 2, 12, 7);
    ctx.strokeRect(4, 2, 12, 7);
  }
  ctx.restore();
  // head
  ink(ctx, [
    { x: -8, y: -30 },
    { x: -9, y: -42 },
    { x: 0, y: -48 },
    { x: 9, y: -42 },
    { x: 8, y: -30 },
  ], { fill: "#e6c2a4", lw: 1.5, seed: p.semilla + 2 + hv * 13, amp: 1.6 });
  // eyes uneven
  ctx.fillStyle = TINTA;
  ctx.beginPath();
  ctx.ellipse(-3, -38, 1.5, 1.8, 0, 0, Math.PI * 2);
  ctx.ellipse(3.5, -37, 1.1, 1.6, 0, 0, Math.PI * 2);
  ctx.fill();
  // nose
  ink(ctx, [
    { x: 0, y: -36 },
    { x: 4, y: -33 },
    { x: 1, y: -31 },
  ], { fill: "#d7a888", lw: 1, seed: p.semilla + 5 + hv * 13, amp: 1.2 });
  // helmet
  ink(ctx, [
    { x: -11, y: -42 },
    { x: -8, y: -50 },
    { x: 2, y: -53 },
    { x: 11, y: -47 },
    { x: 12, y: -41 },
    { x: -10, y: -40 },
  ], { fill: p.casco, lw: 1.4, seed: p.semilla + 8 + hv * 13, amp: 1.6 });
  if (p.letra) {
    ctx.fillStyle = TINTA;
    ctx.font = "700 11px 'Patrick Hand', cursive";
    ctx.textAlign = "center";
    ctx.fillText(p.letra, 1, -43);
  }
  const gotas = p.cansancio >= 85 ? 3 : p.cansancio >= 70 ? 2 : p.cansancio >= 50 ? 1 : 0;
  for (let i = 0; i < gotas; i++) gotaTinta(ctx, 20 + i * 18, -40 + (i % 2) * 8, 16);
  ctx.restore();
}

function luzPiso(ctx: CanvasRenderingContext2D, P: Proy, x: number, y: number) {
  // Charco en el piso, delante de la puerta. El techo queda arriba y no se mancha.
  const c = P(x + 0.12, y + 1.85, 0.03);
  const e = P(x + 2.8, y + 1.85, 0.03);
  const rx = Math.max(72, Math.hypot(e.x - c.x, e.y - c.y));
  const ry = rx * 0.42;
  const g = ctx.createRadialGradient(c.x, c.y, rx * 0.05, c.x, c.y, rx);
  g.addColorStop(0, "rgba(242,196,96,0.82)");
  g.addColorStop(0.42, "rgba(236,186,92,0.58)");
  g.addColorStop(0.72, "rgba(228,190,120,0.28)");
  g.addColorStop(1, "rgba(228,190,120,0)");
  ctx.save();
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(c.x, c.y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function dibujar(ctx: CanvasRenderingContext2D, w: number, h: number, s: Estado, vis: Vis, dpr = 1) {
  etiquetasVivas.length = 0;
  const z = zoomDe(w);
  vis.ancho = w;
  const sigue = 1 - Math.exp(-vis.dt * 4.5);
  vis.cam.x += (s.jugador.x - vis.cam.x) * sigue;
  vis.cam.y += (s.jugador.y - vis.cam.y) * sigue;
  const shake = vis.shake > 0 ? Math.sin(vis.t * 40) * vis.shake : 0;
  vis.shake = Math.max(0, vis.shake - vis.dt * 18);

  ctx.setTransform(dpr, 0, 0, dpr, shake, 0);
  ctx.fillStyle = PAPEL;
  ctx.fillRect(-20, 0, w + 40, h);

  const ter = asegurarTerreno(z, s.seed);
  const o = proyectar(vis.cam.x, vis.cam.y, 0, z);
  const blitX = w / 2 - o.sx + ter.ox;
  const blitY = h * 0.56 - o.sy + ter.oy;
  ctx.drawImage(ter.c, blitX, blitY);

  const to = (x: number, y: number, a = 0) => pantallaDe(x, y, a, vis, w, h, z);
  const alfa = (x: number, y: number) => {
    if (Math.hypot(s.jugador.x - x, s.jugador.y - y) <= 2) return 1;
    const m = vis.mira;
    if (m && Math.hypot(m.x - x, m.y - y) <= 2) return 1;
    return 0;
  };

  // river gone: the lot runs to the edge

  // cached building
  const bucket = Math.floor(progresoObra(s) * 50);
  const blocks = s.etapa === 4 ? Math.floor(hechoDe(s, 4, "block")) : s.etapa > 4 ? 469 : 0;
  const diagKey = s.etapa > 0 ? 8 : Math.floor(hechoDe(s, 0, "replantear") * 8);
  const key = `c|${bucket}|${blocks}|${s.plumbed.length}|${s.desplomes}|${z}|${s.curadoDias.length}|${s.curando ? 1 : 0}|${s.etapa}|${diagKey}|${Math.floor(hechoDe(s, 1, "excavar"))}|${Math.floor(hechoDe(s, 2, "acero"))}|${Math.floor(hechoDe(s, 3, "vaciar"))}|${Math.floor(hechoDe(s, 5, "encofrar") * 2)}|${Math.floor(hechoDe(s, 5, "vaciar") * 2)}|${Math.floor(hechoDe(s, 6, "encofrar") * 2)}|${Math.floor(hechoDe(s, 6, "acero") * 2)}|${Math.floor(hechoDe(s, 6, "vaciar") * 2)}|${Math.floor(hechoDe(s, 7, "relleno") * 2)}|${Math.floor(hechoDe(s, 7, "firme") * 2)}|${Math.floor(hechoDe(s, 7, "llano") * 2)}|${Math.floor(hechoDe(s, 8, "techo") * 2)}`;
  if (!obraCache || obraCache.key !== key) {
    const corners = [toWorldCorner(17, 13, z), toWorldCorner(21, 13, z), toWorldCorner(21, 16, z), toWorldCorner(17, 16, z), proyectar(19, 14.5, 4.2, z)];
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const c of corners) {
      minX = Math.min(minX, c.sx);
      minY = Math.min(minY, c.sy);
      maxX = Math.max(maxX, c.sx);
      maxY = Math.max(maxY, c.sy);
    }
    const pad = 64;
    const cnv = document.createElement("canvas");
    cnv.width = Math.max(8, Math.ceil(maxX - minX + pad * 2));
    cnv.height = Math.max(8, Math.ceil(maxY - minY + pad * 2));
    const g = cnv.getContext("2d")!;
    drawObraEn(g, s, z, minX - pad, minY - pad);
    obraCache = { key, c: cnv, ax: minX - pad, ay: minY - pad };
  }
  const bp = to(0, 0);
  const origin = proyectar(0, 0, 0, z);
  // blit using same camera transform as terrain: screen = center + (proj - camProj)
  ctx.drawImage(obraCache.c, w / 2 + (obraCache.ax - o.sx), h * 0.56 + (obraCache.ay - o.sy));
  void bp;
  void origin;

  type Sprite = { d: number; draw: () => void };
  const sprites: Sprite[] = [];

  const hv = Math.floor(vis.t / 0.14);
  void hv;
  sprites.push({
    d: SITIOS.tierra.x + SITIOS.tierra.y,
    draw: () => conoTruncado(ctx, to, SITIOS.tierra.x, SITIOS.tierra.y, s.tierraMonton ?? 0, 15),
  });
  sprites.push({
    d: BOTE_TIERRA.x + BOTE_TIERRA.y + 0.01,
    draw: () => conoTruncado(ctx, to, BOTE_TIERRA.x, BOTE_TIERRA.y, s.tierraBote ?? 0, 18),
  });
  {
    const lab = to(SITIOS.tierra.x, SITIOS.tierra.y, 1.3);
    sprites.push({
      d: SITIOS.tierra.x + SITIOS.tierra.y + 0.02,
      draw: () => etiqueta(ctx, lab.x, lab.y, "Tierra", alfa(SITIOS.tierra.x, SITIOS.tierra.y)),
    });
  }
  {
    const lab = to(SITIOS.monton.x, SITIOS.monton.y, 1.3);
    sprites.push({
      d: SITIOS.monton.x + SITIOS.monton.y + 0.02,
      draw: () => etiqueta(ctx, lab.x, lab.y, "Montón", alfa(SITIOS.monton.x, SITIOS.monton.y)),
    });
  }

  sprites.push({
    d: SITIOS.tanque.x + SITIOS.tanque.y,
    draw: () => {
      pintarTanqueM(ctx, to, SITIOS.tanque.x, SITIOS.tanque.y, s.inv.agua.q, 21);
      const lab = to(SITIOS.tanque.x, SITIOS.tanque.y, 1.7);
      etiqueta(ctx, lab.x, lab.y, "Tanque", alfa(SITIOS.tanque.x, SITIOS.tanque.y));
    },
  });
  sprites.push({
    d: SITIOS.toma.x + SITIOS.toma.y,
    draw: () => {
      pintarTomaM(ctx, to, SITIOS.toma.x, SITIOS.toma.y, 30);
      const lab = to(SITIOS.toma.x, SITIOS.toma.y, 1.3);
      etiqueta(ctx, lab.x, lab.y, "Toma", alfa(SITIOS.toma.x, SITIOS.toma.y));
    },
  });

  sprites.push({
    d: SITIOS.batea.x + SITIOS.batea.y,
    draw: () => {
      const cruda = s.mezclas.find((m) => !m.lista);
      const servida = s.mezclas.find((m) => m.lista && m.restante > 0.02);
      const prog = cruda ? cruda.prog : servida ? 1 : 0;
      const lista = !cruda && !!servida;
      const gira =
        !!cruda &&
        s.gente.some(
          (g) => g.activo && !g.fuera && !g.falto && Math.hypot(g.x - SITIOS.batea.x, g.y - SITIOS.batea.y) < 1.6,
        );
      pintarTrompoM(ctx, to, prog, lista, gira, vis.t, 40);
      const lab = to(SITIOS.batea.x, SITIOS.batea.y, 1.55);
      etiqueta(ctx, lab.x, lab.y, "Trompo", alfa(SITIOS.batea.x, SITIOS.batea.y));
    },
  });

  sprites.push({
    d: 6.55 + 13.55,
    draw: () => {
      burroPar(ctx, to, 6.55, 13.55, 120);
      varillasSobre(ctx, to, 6.55, 13.55, s.inv.v38.q + s.inv.v14.q);
    },
  });
  sprites.push({
    d: 6.7 + 15.35,
    draw: () => paletaBlock(ctx, to, 6.7, 15.35, s.inv.block.q, 130),
  });
  sprites.push({
    d: SITIOS.tanque.x + SITIOS.tanque.y - 0.02,
    draw: () => manguera(ctx, to),
  });

  sprites.push({
    d: SITIOS.almacen.x + SITIOS.almacen.y,
    draw: () => {
      pintarAlmacenM(ctx, to, SITIOS.almacen.x, SITIOS.almacen.y, 50, s.inv.cemento.q);
      const lab = to(SITIOS.almacen.x, SITIOS.almacen.y, 2.8);
      etiqueta(ctx, lab.x, lab.y, "Almacén", alfa(SITIOS.almacen.x, SITIOS.almacen.y));
    },
  });

  sprites.push({
    d: SITIOS.oficina.x + SITIOS.oficina.y,
    draw: () => {
      const marca = s.firmado && s.dia === 1 && s.gente.length + s.reserva.length === 0;
      pintarOficinaM(ctx, to, SITIOS.oficina.x, SITIOS.oficina.y, 60, marca);
      if (marca) luzPiso(ctx, to, SITIOS.oficina.x, SITIOS.oficina.y);
      const lab = to(SITIOS.oficina.x, SITIOS.oficina.y, 2.8);
      etiqueta(ctx, lab.x, lab.y, "Oficina", marca ? 1 : alfa(SITIOS.oficina.x, SITIOS.oficina.y), marca ? ORO : PAPEL);
    },
  });
  {
    const nx = SITIOS.oficina.x + 0.45;
    const ny = SITIOS.oficina.y + 0.62;
    const a = to(nx, ny);
    sprites.push({
      d: nx + ny,
      draw: () => {
        persona(ctx, a.x, a.y, {
          camisa: "#d9d3c7",
          casco: "#d4a73c",
          letra: "N",
          t: vis.t,
          trabaja: false,
          cansancio: 0,
          caminando: false,
          anim: "nada",
          semilla: 3,
          z,
          oficio: "maestro",
        });
        const lab = to(nx, ny, 2.05);
        etiqueta(ctx, lab.x, lab.y, LISTERO.nombre, alfa(SITIOS.oficina.x, SITIOS.oficina.y), PAPEL, true);
      },
    });
  }

  if (s.sita) {
    const enCasa = s.sita.fase === "casa";
    const sx = enCasa ? SITIOS.oficina.x - 0.35 : s.sita.x;
    const sy = enCasa ? SITIOS.oficina.y + 0.72 : s.sita.y;
    const camina = s.sita.fase === "yendo" || s.sita.fase === "vuelta";
    const conPapel = s.sita.fase === "yendo" || s.sita.fase === "nota";
    const p = to(sx, sy);
    sprites.push({
      d: sx + sy + 0.05,
      draw: () => {
        persona(ctx, p.x, p.y, {
          camisa: "#6e8f62",
          casco: "#3d5f8a",
          letra: "S",
          t: vis.t,
          trabaja: false,
          cansancio: 0,
          caminando: camina,
          anim: conPapel ? "papel" : "nada",
          semilla: 9,
          z,
        });
        const lab = to(sx, sy, 2.05);
        etiqueta(ctx, lab.x, lab.y, GUARDALMACEN.nombre, alfa(sx, sy), PAPEL, true);
      },
    });
  }

  {
    sprites.push({
      d: SITIOS.entrada.x + SITIOS.entrada.y,
      draw: () => {
        pintarEntradaM(ctx, to, SITIOS.entrada.x, SITIOS.entrada.y, 77);
        const lab = to(SITIOS.entrada.x, SITIOS.entrada.y, 2.5);
        etiqueta(ctx, lab.x, lab.y, "Entrada", alfa(SITIOS.entrada.x, SITIOS.entrada.y));
        pintarPilasEntrada(ctx, to, s);
      },
    });
  }

  if (trianguloEscuadra(s)) {
    const o = to(17.4, 13.3);
    const a = to(18.6, 13.3);
    const b = to(17.4, 14.5);
    sprites.push({
      d: 40,
      draw: () => {
        ctx.strokeStyle = TINTA;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(o.x, o.y);
        ctx.lineTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.closePath();
        ctx.stroke();
        ctx.font = "18px 'Patrick Hand', cursive";
        ctx.fillStyle = TINTA;
        ctx.fillText("3", (o.x + b.x) / 2 - 14, (o.y + b.y) / 2);
        ctx.fillText("4", (o.x + a.x) / 2, o.y - 6);
        ctx.fillText("5", (a.x + b.x) / 2 + 4, (a.y + b.y) / 2);
      },
    });
  }
  {
    sprites.push({
      d: SITIOS.ferreteria.x + SITIOS.ferreteria.y,
      draw: () => {
        pintarFerreteriaM(ctx, to, SITIOS.ferreteria.x, SITIOS.ferreteria.y, 70);
        const lab = to(SITIOS.ferreteria.x, SITIOS.ferreteria.y, 3.4);
        etiqueta(ctx, lab.x, lab.y, "Ferretería", alfa(SITIOS.ferreteria.x, SITIOS.ferreteria.y));
      },
    });
  }
  {
    const p = to(SITIOS.camion.x, SITIOS.camion.y);
    const age = vis.camion >= 0 ? vis.t - vis.camion : 99;
    if (age >= 0 && age < 5.4) {
      let off = 0;
      if (age < 1.05) off = (1 - age / 1.05) * 240;
      else if (age > 3.85) off = ((age - 3.85) / 1.55) * 280;
      sprites.push({
        d: SITIOS.camion.x + SITIOS.camion.y - 0.2,
        draw: () => {
          const x = p.x + off;
          pintarCamion(ctx, x, p.y, z, age, 80);
        },
      });
    }
  }

  // mango
  {
    sprites.push({
      d: SITIOS.sombra.x + SITIOS.sombra.y,
      draw: () => {
        pintarMango(ctx, to, SITIOS.sombra.x, SITIOS.sombra.y, 90);
        const lab = to(SITIOS.sombra.x, SITIOS.sombra.y, 3.7);
        etiqueta(ctx, lab.x, lab.y, "Sombra", alfa(SITIOS.sombra.x, SITIOS.sombra.y), PAPEL, true);
      },
    });
  }

  for (const g of s.gente) {
    if (!g.activo || g.fuera) continue;
    const p = to(g.x, g.y);
    const dest = ancla(s, g);
    const camina = !!dest && Math.hypot(g.x - dest.x, g.y - dest.y) > 0.4;
    sprites.push({
      d: g.x + g.y,
      draw: () => {
        const col = OFICIO_COLOR[g.oficio];
        persona(ctx, p.x, p.y, {
          camisa: col.camisa,
          casco: col.casco,
          t: vis.t,
          trabaja: g.trabajando,
          cansancio: g.cansancio,
          caminando: camina,
          anim: g.anim,
          semilla: g.nombre.length * 9,
          z,
          oficio: g.oficio,
        });
        const lab = to(g.x, g.y, 2.05);
        etiqueta(ctx, lab.x, lab.y, g.nombre, alfa(g.x, g.y), PAPEL, true);
      },
    });
  }

  const mp = to(s.jugador.x, s.jugador.y);
  const sitio = cercano(s);
  let animM = "nada";
  if (sitio?.id === "batea" || sitio?.id === "obra") animM = "cuchara";
  sprites.push({
    d: s.jugador.x + s.jugador.y + 0.01,
    draw: () => {
      const beat = vis.compas;
      const ventana = beat < 0.15 || beat > 0.85;
      const cerca = beat < 0.15 ? 1 - beat / 0.15 : beat > 0.85 ? 1 - (1 - beat) / 0.15 : 0;
      const pulso = ventana ? 1 + 0.26 * Math.sin(cerca * Math.PI) : 1;
      ctx.beginPath();
      ctx.strokeStyle = ventana ? ORO2 : TINTA;
      ctx.globalAlpha = ventana ? 0.95 : 0.4;
      ctx.lineWidth = ventana ? 1.6 : 1;
      const rad = 0.38 * 30 * z * pulso;
      ctx.ellipse(mp.x, mp.y + 2, rad, rad * 0.42, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      const mov = s.vel > 0.2;
      persona(ctx, mp.x, mp.y, {
        camisa: "#d7c4a3",
        casco: "#f7f3ea",
        letra: "M",
        t: vis.t,
        trabaja: !mov && animM !== "nada",
        cansancio: 0,
        caminando: mov,
        anim: animM,
        semilla: 4,
        z,
        oficio: "maestro",
      });
    },
  });

  sprites.sort((a, b) => a.d - b.d);
  for (const sp of sprites) sp.draw();

  if (s.plomo) {
    const curso = Math.max(1, Math.round(s.plomo.umbral / POR_HILADA));
    const alt = curso * 0.2 + 0.18;
    const top = to(20.15, 15.92, alt);
    const sway = Math.sin(vis.t * Math.PI * 2) * Math.max(10, 8 * z);
    const drop = Math.max(56, Math.min(92, 40 * z + curso * 3));
    const bw = Math.max(16, 12 * z);
    const bh = Math.max(34, 26 * z);
    ctx.save();
    ctx.lineCap = "round";
    ctx.strokeStyle = TINTA;
    ctx.fillStyle = TINTA;
    ctx.lineWidth = Math.max(2.4, 1.8 * z);
    ctx.beginPath();
    ctx.arc(top.x, top.y, Math.max(3.5, 2.6 * z), 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(top.x, top.y);
    ctx.lineTo(top.x + sway, top.y + drop);
    ctx.stroke();
    const bx = top.x + sway;
    const by = top.y + drop;
    ctx.beginPath();
    ctx.moveTo(bx, by - 2);
    ctx.bezierCurveTo(bx + bw, by + bh * 0.28, bx + bw * 0.78, by + bh, bx, by + bh);
    ctx.bezierCurveTo(bx - bw * 0.78, by + bh, bx - bw, by + bh * 0.28, bx, by - 2);
    ctx.closePath();
    ctx.fillStyle = ORO;
    ctx.fill();
    ctx.lineWidth = Math.max(2.2, 1.6 * z);
    ctx.stroke();
    ctx.fillStyle = ORO2;
    ctx.beginPath();
    ctx.ellipse(bx - bw * 0.28, by + bh * 0.38, bw * 0.22, bh * 0.14, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  vis.ondas = vis.ondas.filter((o) => vis.t - o.t < 0.7);
  for (const o of vis.ondas) {
    const age = vis.t - o.t;
    const p = to(o.x, o.y);
    const rad = 8 + age * 78;
    ctx.beginPath();
    ctx.strokeStyle = ORO;
    ctx.globalAlpha = Math.max(0, 1 - age / 0.7);
    ctx.lineWidth = 2;
    ctx.ellipse(p.x, p.y + 2, rad, rad * 0.48, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  for (const f of vis.floaters) {
    const alto = f.texto === "¡Plomo!" || f.texto === "El maestro le dio" ? 2.6 : 1;
    const p = to(f.x, f.y, alto);
    const k = Math.max(0, Math.min(1, f.vida / 0.9));
    ctx.globalAlpha = k;
    ctx.fillStyle = f.oro ? ORO2 : PAPEL;
    ctx.strokeStyle = TINTA;
    ctx.font = "20px 'Jolly Lodger', cursive";
    ctx.textAlign = "center";
    ctx.lineWidth = 3;
    let y = p.y - (1 - k) * 40;
    if (f.texto === "El maestro le dio") {
      const tw = ctx.measureText(f.texto).width;
      for (let i = 0; i < 8 && y > 36; i++) {
        const box = { x: p.x - tw / 2 - 6, y: y - 22, w: tw + 12, h: 26 };
        const toca = etiquetasVivas.some(
          (m) => box.x < m.x + m.w && box.x + box.w > m.x && box.y < m.y + m.h && box.y + box.h > m.y,
        );
        if (!toca) break;
        y -= 18;
      }
    }
    ctx.strokeText(f.texto, p.x, y);
    ctx.fillText(f.texto, p.x, y);
    ctx.globalAlpha = 1;
  }

  const hoyLl = s.lluvias.find((r) => r.dia === s.dia);
  let nubes = -1;
  if (hoyLl && s.minuto < hoyLl.ini && hoyLl.ini - s.minuto <= 120) nubes = 1 - (hoyLl.ini - s.minuto) / 120;
  if (hoyLl && s.minuto >= hoyLl.ini && s.minuto < hoyLl.fin) nubes = 1;
  if (nubes >= 0) pintarNubes(ctx, w, h, nubes, hv);

  const llueve = s.lluviaOn || (hoyLl != null && s.minuto >= hoyLl.ini && s.minuto < hoyLl.fin);
  if (llueve) {
    ctx.strokeStyle = "rgba(29,23,18,0.55)";
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 40; i++) {
      const x = ((hash2(s.seed, i) * w + vis.t * 180) % (w + 40)) - 20;
      const y = ((hash2(s.seed, i + 90) * h + vis.t * 420) % (h + 40)) - 20;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 6, y + 14);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(70,110,150,0.15)";
    ctx.fillRect(-30, -30, w + 60, h + 60);
  }
}

function toWorldCorner(x: number, y: number, z: number) {
  return proyectar(x, y, 0, z);
}

function ETAPA_ID(s: Estado): string {
  const e = etapaActual(s);
  return e?.trabajos[0]?.id ?? "limpiar";
}

function ellipse(x: number, y: number, rx: number, ry: number) {
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    pts.push({ x: x + Math.cos(a) * rx, y: y + Math.sin(a) * ry });
  }
  return pts;
}

function etiqueta(ctx: CanvasRenderingContext2D, x: number, y: number, texto: string, alpha = 1, fill = PAPEL, anota = false) {
  if (alpha <= 0.02) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = "15px 'Patrick Hand', cursive";
  ctx.textAlign = "center";
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#14100c";
  ctx.strokeText(texto, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(texto, x, y);
  if (anota) {
    const tw = ctx.measureText(texto).width;
    etiquetasVivas.push({ x: x - tw / 2 - 4, y: y - 16, w: tw + 8, h: 20 });
  }
  ctx.restore();
}

const etiquetasVivas: { x: number; y: number; w: number; h: number }[] = [];

type Glifo = "saco" | "reloj" | "pala" | "cubo" | "gota" | "escuadra" | "casco" | "luna";

function marcaCuello(s: Estado): { x: number; y: number; glifo: Glifo } | null {
  if (!s.firmado || s.entregada) return null;
  const c = cuello(s);
  if (c.startsWith("Obra entregada") || c.startsWith("Aguacero") || c.startsWith("Nadie en")) return null;
  if (c.startsWith("Toca plomear")) return { x: SITIOS.obra.x, y: SITIOS.obra.y, glifo: "casco" };
  if (c.startsWith("Toca regar") || c.startsWith("Sin agua")) return { x: SITIOS.tanque.x, y: SITIOS.tanque.y, glifo: "gota" };
  if (c.startsWith("Replanteo listo")) return { x: SITIOS.obra.x, y: SITIOS.obra.y, glifo: "escuadra" };
  if (c.startsWith("Replanteo") && c.includes("oficina")) return { x: SITIOS.oficina.x, y: SITIOS.oficina.y, glifo: "casco" };
  if (c.startsWith("Replanteo")) return { x: SITIOS.obra.x, y: SITIOS.obra.y, glifo: "casco" };
  if (c.startsWith("Curado") || c.includes("fragua") || c.includes("Fragua") || c.includes("hiladas"))
    return { x: SITIOS.obra.x, y: SITIOS.obra.y, glifo: "luna" };
  if (c.startsWith("Contrata")) return { x: SITIOS.oficina.x, y: SITIOS.oficina.y, glifo: "casco" };
  if (c.startsWith("Falta un líder")) return { x: SITIOS.obra.x, y: SITIOS.obra.y, glifo: "casco" };
  if (c.includes("camión") || c.startsWith("Hay cemento")) return { x: SITIOS.entrada.x, y: SITIOS.entrada.y, glifo: c.startsWith("Hay cemento") ? "saco" : "reloj" };
  if (c.includes("acarrear") || c.includes("en la entrada"))
    return { x: SITIOS.entrada.x, y: SITIOS.entrada.y, glifo: "saco" };
  if (c.includes("Ferretería")) return { x: SITIOS.oficina.x, y: SITIOS.oficina.y, glifo: "saco" };
  if (c.includes("trompo") || c.includes("Trompo") || c.includes("mezcla") || c.includes("ingredientes")) return { x: SITIOS.batea.x, y: SITIOS.batea.y, glifo: "cubo" };
  return null;
}

function mezclaTinta(t: number): string {
  const a = [0x9a, 0x94, 0x8a];
  const b = [0x6e, 0x58, 0x44];
  const c = a.map((v, i) => Math.round(v + (b[i]! - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

function pintarNubes(ctx: CanvasRenderingContext2D, w: number, h: number, u: number, hv: number) {
  const pulso = Math.min(1, Math.max(0, u));
  const techo = Math.max(72, Math.min(h * 0.16, 140));
  const fracs = [0.22, 0.48, 0.74].map((f, i) => f + (i - 1) * pulso * 0.04);
  const nube = (x: number, y: number, s: number, seed: number) => {
    ctx.beginPath();
    ctx.moveTo(x - 46 * s, y + 10 * s);
    ctx.bezierCurveTo(x - 58 * s, y + 10 * s, x - 62 * s, y - 8 * s, x - 40 * s, y - 12 * s);
    ctx.bezierCurveTo(x - 38 * s, y - 32 * s, x - 12 * s, y - 40 * s, x - 2 * s, y - 22 * s);
    ctx.bezierCurveTo(x + 8 * s, y - 46 * s, x + 40 * s, y - 40 * s, x + 42 * s, y - 16 * s);
    ctx.bezierCurveTo(x + 64 * s, y - 14 * s, x + 66 * s, y + 12 * s, x + 40 * s, y + 16 * s);
    ctx.bezierCurveTo(x + 18 * s, y + 28 * s, x - 20 * s, y + 26 * s, x - 46 * s, y + 10 * s);
    ctx.closePath();
    ctx.fillStyle = "#d9d4c8";
    ctx.fill();
    ctx.strokeStyle = TINTA;
    ctx.lineWidth = 2.4;
    ctx.stroke();
    void seed;
  };
  ctx.save();
  for (let i = 0; i < 3; i++) {
    const s = 1.15 + (i === 1 ? 0.35 : 0) + pulso * 0.15;
    nube(fracs[i]! * w, techo + (i === 1 ? 8 : 28), s, 300 + i + hv);
  }
  ctx.restore();
}

function pintarMarca(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  glifo: Glifo,
  hv: number,
) {
  const m = 64;
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  let sx = x;
  let sy = y;
  let fuera = false;
  let ang = 0;
  if (x < m || y < m || x > w - m || y > h - m) {
    fuera = true;
    const hw = w / 2 - m;
    const hh = h / 2 - m;
    let k = Infinity;
    if (dx !== 0) k = Math.min(k, hw / Math.abs(dx));
    if (dy !== 0) k = Math.min(k, hh / Math.abs(dy));
    if (!Number.isFinite(k)) k = 1;
    sx = cx + dx * k;
    sy = cy + dy * k;
    ang = Math.atan2(dy, dx);
  }
  ctx.save();
  ctx.translate(sx, sy);
  ctx.scale(4.8, 4.8);
  ink(ctx, ellipse(0, 0, 16, 16), { fill: PAPEL, lw: 3.2, seed: 420 + hv, amp: 1.3 });
  ctx.strokeStyle = TINTA;
  ctx.fillStyle = TINTA;
  ctx.lineWidth = 3.2;
  ctx.lineCap = "round";
  if (glifo === "saco") {
    ctx.fillStyle = "#9a948a";
    ctx.fillRect(-6, -6, 12, 14);
    ctx.strokeRect(-6, -6, 12, 14);
    ctx.beginPath();
    ctx.moveTo(-3, -6);
    ctx.lineTo(0, -1);
    ctx.lineTo(3, -6);
    ctx.stroke();
  } else if (glifo === "reloj") {
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -5);
    ctx.moveTo(0, 0);
    ctx.lineTo(4, 1);
    ctx.stroke();
  } else if (glifo === "pala") {
    ctx.beginPath();
    ctx.moveTo(-6, 8);
    ctx.lineTo(4, -8);
    ctx.stroke();
    ctx.fillRect(2, -12, 7, 5);
    ctx.strokeRect(2, -12, 7, 5);
  } else if (glifo === "cubo") {
    ctx.beginPath();
    ctx.moveTo(-7, -4);
    ctx.lineTo(7, -4);
    ctx.lineTo(5, 8);
    ctx.lineTo(-5, 8);
    ctx.closePath();
    ctx.stroke();
  } else if (glifo === "gota") {
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.bezierCurveTo(6, -1, 4, 8, 0, 8);
    ctx.bezierCurveTo(-4, 8, -6, -1, 0, -8);
    ctx.fillStyle = AGUA;
    ctx.fill();
    ctx.stroke();
  } else if (glifo === "escuadra") {
    ctx.beginPath();
    ctx.moveTo(-7, 6);
    ctx.lineTo(-7, -7);
    ctx.lineTo(7, -7);
    ctx.stroke();
  } else if (glifo === "casco") {
    ctx.beginPath();
    ctx.arc(0, 2, 7, Math.PI, 0);
    ctx.lineTo(8, 4);
    ctx.lineTo(-8, 4);
    ctx.closePath();
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(1, 0, 7, 0.6, Math.PI * 1.4);
    ctx.arc(-1, 0, 5, Math.PI * 1.3, 0.5, true);
    ctx.fill();
  }
  if (fuera) {
    ctx.save();
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(22, 0);
    ctx.lineTo(12, -6);
    ctx.lineTo(12, 6);
    ctx.closePath();
    ctx.fillStyle = ORO;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

void bloqueCount;
void OFICIO_COLOR;
type _Of = Oficio;
void (null as _Of | null);

// v28: capturas de los 5 hallazgos y la partida de «humano normal» en teléfono (375x667 y 667x375), sin errores de consola.
// Uso: node --experimental-strip-types pruebas_e2e/estados_v28.ts && URL_JUEGO=http://127.0.0.1:4181/ CAPTURAS=dir node pruebas_e2e/v28.e2e.mjs
import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";
const URL_ = process.env.URL_JUEGO || "http://127.0.0.1:4181/";
const OUT = process.env.CAPTURAS || ".";
const VPS = (process.env.VPS || "375x667,667x375").split(",");
const E = JSON.parse(readFileSync(new URL("./estados_v28.json", import.meta.url), "utf8"));
const b = await chromium.launch();
const res = [];
const sobre = (s) => JSON.stringify({ v: 2, partida: String(s.seed), rev: 1, t: Date.now(), s });
const espera = (p, ms) => p.waitForTimeout(ms);

async function abrir(st, w, h, { continuar = true } = {}) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: Math.min(w, h) < 500, isMobile: Math.min(w, h) < 500 });
  const p = await ctx.newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push(String(e)));
  p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  await ctx.addInitScript(([s]) => {
    if (!sessionStorage.getItem("ya")) {
      localStorage.clear();
      if (s) localStorage.setItem("obra-maestra-v2", s);
      sessionStorage.setItem("ya", "1");
    }
  }, [st ? sobre(st) : null]);
  await p.goto(URL_);
  await espera(p, 3500);
  if (continuar) {
    const c = p.getByRole("button", { name: /^Continuar$/ }).first();
    if (await c.count()) { await c.click(); await espera(p, 1200); }
  }
  return { ctx, p, errs };
}
async function revisar(p, errs, caso, ok, extra = {}) {
  const info = await p.evaluate(() => ({
    sw: document.documentElement.scrollWidth, iw: innerWidth,
    texto: document.body.innerText,
  }));
  const negativos = (info.texto.match(/[^\n]*(P\$-|-P\$|[−+]−P\$|−−|unos -\d)[^\n]*/g) || []);
  const r = { caso, ok: !!ok && errs.length === 0 && negativos.length === 0 && info.sw <= info.iw + 1, errores: [...errs], negativos, desborde: info.sw > info.iw + 1, ...extra };
  res.push(r);
  return r;
}
/** Lo guardado (cada pago, compra o fiado se guarda al instante). */
async function guardado(p) {
  return p.evaluate(() => {
    const raw = localStorage.getItem("obra-maestra-v2");
    if (!raw) return null;
    const s = JSON.parse(raw).s;
    return { caja: Math.round(s.caja), fiado: Math.round(s.fiado ?? 0), pedidos: s.pedidos.length };
  });
}
async function cerrarHojas(p) {
  for (let i = 0; i < 3 && (await p.locator(".velo-obra").count()); i++) { await p.keyboard.press("Escape"); await espera(p, 400); }
}
async function foto(p, n) { await p.screenshot({ path: `${OUT}/${n}.png` }); }

for (const vp of VPS) {
  const [w, h] = vp.split("x").map(Number);
  // Portada sin partida.
  {
    const { ctx, p, errs } = await abrir(null, w, h, { continuar: false });
    await foto(p, `${vp}-portada`);
    await revisar(p, errs, `${vp} portada`, await p.getByRole("button", { name: /^Jugar$/ }).count());
    await ctx.close();
  }
  const minuto = (p) => p.evaluate(() => window.__controlsTest?.estado().minuto ?? -1);
  // 1. La hoja pide cemento, arena y grava: «Pedir la siguiente etapa» no sale sola y «Antes de pedir» dice qué trae.
  {
    const { ctx, p, errs } = await abrir(E.viga, w, h);
    const primero = await p.locator("[data-primero-esta-etapa]").count();
    const sig = await p.locator("[data-pedir-siguiente]").count();
    const txtPrimero = primero ? await p.locator("[data-primero-esta-etapa]").first().innerText() : "";
    await foto(p, `${vp}-1-hoja-primero-esta-etapa`);
    await p.getByRole("button", { name: /^(Pedir|Pedir lo que alcanza)$/ }).first().click().catch(() => {});
    await espera(p, 700);
    const trae = await p.locator("[data-trae]").count() ? await p.locator("[data-trae]").first().innerText() : "";
    await foto(p, `${vp}-1-antes-de-pedir-trae`);
    await revisar(p, errs, `${vp} hallazgo 1: la siguiente etapa no sale sola mientras falte cemento; «Antes de pedir» dice qué trae`, primero && sig === 0 && /cemento/i.test(txtPrimero) && /Cemento/.test(trae), { txtPrimero, trae });
    await ctx.close();
  }
  // 2. Guardalmacén trabado detrás del almacén a las 14:00: la nota llega y el reloj sigue.
  {
    const { ctx, p, errs } = await abrir(E.reloj, w, h);
    await espera(p, 6000);
    const body = await p.locator("body").innerText();
    const llego = /Guardalmac[eé]n/i.test(body) && (await p.locator("[data-hoja-guardalmacen]").count()) > 0;
    await foto(p, `${vp}-2-reloj-nota-llega`);
    const m0 = await minuto(p);
    await cerrarHojas(p);
    await espera(p, 3000);
    const m1 = await minuto(p);
    await revisar(p, errs, `${vp} hallazgo 2: el reloj no se queda en 14:00 con el guardalmacén trabado`, llego && m1 > m0 && m0 >= 14 * 60, { m0, m1, llego });
    await ctx.close();
  }
  // 2b. «Reportar» para el reloj.
  {
    const { ctx, p, errs } = await abrir(E.reporte, w, h);
    await cerrarHojas(p);
    await p.getByRole("button", { name: /^Reportar$/ }).first().click();
    await espera(p, 600);
    const m0 = await minuto(p);
    await espera(p, 3000);
    const m1 = await minuto(p);
    await foto(p, `${vp}-2-reportar-reloj-parado`);
    await p.getByRole("button", { name: /^Cerrar$/ }).first().click();
    await espera(p, 2500);
    const m2 = await minuto(p);
    await revisar(p, errs, `${vp} hallazgo 2: con «Reportar» abierto el reloj está parado y al cerrar sigue`, m0 > 0 && m1 === m0 && m2 > m1, { m0, m1, m2 });
    await ctx.close();
  }
  // 3. Despedir pide confirmación con el costo.
  {
    const { ctx, p, errs } = await abrir(E.despedir, w, h);
    await cerrarHojas(p);
    await p.getByRole("button", { name: /^Cuadrilla$/ }).first().click(); await espera(p, 700);
    await p.locator("[data-despedir]").first().click(); await espera(p, 500);
    const conf = p.locator("[data-confirmar-despedir]");
    const n = await conf.count();
    const visible = n ? await conf.first().isVisible() : false;
    const txt = n ? (await conf.first().innerText()).replace(/\s+/g, " ") : "";
    await foto(p, `${vp}-3-despedir-confirmar`);
    const gente0 = (await p.locator("[data-despedir]").count());
    await p.getByRole("button", { name: /^No$/ }).first().click().catch(() => {});
    await espera(p, 300);
    const gente1 = (await p.locator("[data-despedir]").count());
    await revisar(p, errs, `${vp} hallazgo 3: «Despedir» muestra el costo y pide confirmación`, n && visible && /cuesta P\$[\d,]+/.test(txt) && gente0 === gente1, { texto: txt });
    await ctx.close();
  }
  // 5. «Libre mañana» se marca, se ve y se guarda.
  {
    const { ctx, p, errs } = await abrir(E.libre, w, h);
    await cerrarHojas(p);
    await p.getByRole("button", { name: /^Cuadrilla$/ }).first().click(); await espera(p, 700);
    await p.locator("[data-libre]").first().click(); await espera(p, 700);
    const marca = await p.locator("[data-libre-marca]").count();
    const boton = await p.locator("[data-libre]").first().innerText();
    if (marca) await p.locator("[data-libre-marca]").first().scrollIntoViewIfNeeded();
    await foto(p, `${vp}-5-libre-manana`);
    const g = await p.evaluate(() => { const s = JSON.parse(localStorage.getItem("obra-maestra-v2")).s; return s.gente.filter((x) => x.libre).length; });
    await revisar(p, errs, `${vp} hallazgo 5: «Libre mañana» queda marcado, se ve y se guarda`, marca === 1 && /Que venga mañana/.test(boton) && g === 1, { boton, guardados: g });
    await ctx.close();
  }
  // Partida de humano normal en teléfono: cada etapa cargada y jugando unos segundos, y la entrega.
  {
    const H = E.humano;
    const etapas = [];
    for (const [i, st] of H.hitos.entries()) {
      const { ctx, p, errs } = await abrir(st, w, h);
      await espera(p, 2500);
      if ([4, 8].includes(st.etapa) || i === 0) await foto(p, `${vp}-humano-etapa${st.etapa}`);
      const r = await revisar(p, errs, `${vp} humano semilla ${H.seed}: etapa ${st.etapa} día ${st.dia}`, !/Obra perdida/.test(await p.locator("body").innerText()));
      etapas.push(r.ok);
      await ctx.close();
    }
    const { ctx, p, errs } = await abrir(H.fin, w, h);
    await espera(p, 1000);
    const body = await p.locator("body").innerText();
    await foto(p, `${vp}-humano-entrega`);
    await revisar(p, errs, `${vp} humano semilla ${H.seed}: entrega el día ${H.dia}`, /Entrega|Informe final/.test(body) && /caja final/.test(body) && H.entregada, { caja: H.caja, ganancia: H.ganancia });
    await ctx.close();
  }
}
await b.close();
writeFileSync(`${OUT}/reporte.json`, JSON.stringify(res, null, 1));
const malos = res.filter((r) => !r.ok);
for (const r of res) console.log(r.ok ? "ok  " : "MAL ", r.caso, r.ok ? "" : JSON.stringify({ ...r, caso: undefined }).slice(0, 600));
console.log(`${res.length - malos.length}/${res.length}`);
process.exit(malos.length ? 1 : 0);

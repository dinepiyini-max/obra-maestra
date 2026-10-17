// v27: capturas de los 5 hallazgos y la partida de «humano normal» en teléfono (375x667 y 667x375), sin errores de consola.
// Uso: node --experimental-strip-types pruebas_e2e/estados_v27.ts && URL_JUEGO=http://127.0.0.1:4181/ CAPTURAS=dir node pruebas_e2e/v27.e2e.mjs
import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";
const URL_ = process.env.URL_JUEGO || "http://127.0.0.1:4181/";
const OUT = process.env.CAPTURAS || ".";
const VPS = (process.env.VPS || "375x667,667x375").split(",");
const E = JSON.parse(readFileSync(new URL("./estados_v27.json", import.meta.url), "utf8"));
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
  // 1. Pedir la siguiente etapa con la etapa sin compras y la caja en P$0.
  {
    const { ctx, p, errs } = await abrir(E.siguiente, w, h);
    const btn = p.locator("[data-pedir-siguiente]");
    const hay = await btn.count();
    const txt = hay ? await btn.first().innerText() : "";
    await foto(p, `${vp}-1-pedir-siguiente`);
    let fia = 0, avisoFiado = false;
    if (hay) {
      await btn.first().click(); await espera(p, 700);
      fia = await p.locator("[data-fiar-pedido]").count();
      await foto(p, `${vp}-1-antes-de-pedir-fiado`);
      if (fia) { await p.locator("[data-fiar-pedido]").first().click(); await espera(p, 900); }
      await foto(p, `${vp}-1-tras-fiar`);
      const g = await guardado(p);
      avisoFiado = !!g && g.fiado > 0 && g.caja === 0 && g.pedidos >= 1;
      res.push({ caso: `${vp} hallazgo 1 (guardado tras fiar)`, ok: avisoFiado, ...g });
    }
    await revisar(p, errs, `${vp} hallazgo 1: «Pedir la siguiente etapa» con Replanteo y caja P$0 → fiado`, hay && /siguiente etapa/.test(txt) && fia && avisoFiado, { boton: txt, fiado: fia > 0, avisoFiado });
    await ctx.close();
  }
  // 2. Ferretería con caja P$0.
  {
    const { ctx, p, errs } = await abrir(E.ferreteria, w, h);
    await cerrarHojas(p);
    await p.keyboard.press("Space"); await espera(p, 900);
    const enFerr = /Ferretería El Cruce/.test(await p.locator("body").innerText());
    const antes = await p.locator("[data-fiar-ferreteria]").count();
    await p.getByRole("button", { name: /^Lo que falta$/ }).first().click().catch(() => {});
    await espera(p, 700);
    const boton = p.locator("[data-fiar-ferreteria]");
    const n = await boton.count();
    const txt = n ? await boton.first().innerText() : "";
    await foto(p, `${vp}-2-ferreteria-fiado`);
    let fiado = false;
    if (n) { await boton.first().click(); await espera(p, 900); await foto(p, `${vp}-2-tras-fiar`); const g = await guardado(p); fiado = !!g && g.fiado > 0 && g.caja === 0 && g.pedidos >= 1; res.push({ caso: `${vp} hallazgo 2 (guardado tras fiar)`, ok: fiado, ...g }); }
    await revisar(p, errs, `${vp} hallazgo 2: Ferretería con caja P$0 ofrece fiado`, enFerr && n && fiado, { ferreteria: enFerr, aLaVistaSinCarrito: antes > 0, boton: txt, fiado });
    await ctx.close();
  }
  // 3. Dos nóminas cortas, un solo obrero: la obra sigue.
  {
    const { ctx, p, errs } = await abrir(E.nomina, w, h);
    await espera(p, 1500);
    const body = await p.locator("body").innerText();
    await foto(p, `${vp}-3-nomina-margen`);
    await revisar(p, errs, `${vp} hallazgo 3: tras dos nóminas cortas no hay «Obra perdida»`, !/Obra perdida/.test(body));
    await ctx.close();
  }
  // 4. Guardado con la obra perdida: la portada no ofrece «Continuar» y el guardado se archiva.
  {
    const { ctx, p, errs } = await abrir(E.perdida, w, h, { continuar: false });
    const cont = await p.getByRole("button", { name: /^Continuar$/ }).count();
    const ls = await p.evaluate(() => ({ v2: localStorage.getItem("obra-maestra-v2") != null, perdida: localStorage.getItem("obra-maestra-v2-perdida") != null }));
    await foto(p, `${vp}-4-portada-tras-perdida`);
    await revisar(p, errs, `${vp} hallazgo 4: tras «Obra perdida» no hay «Continuar»`, cont === 0 && !ls.v2 && ls.perdida, { continuar: cont, guardado: ls });
    await ctx.close();
  }
  // 5. Despedir pide confirmación con el costo.
  {
    const { ctx, p, errs } = await abrir(E.despedir, w, h);
    await cerrarHojas(p);
    await p.getByRole("button", { name: /^Cuadrilla$/ }).first().click(); await espera(p, 700);
    await p.locator("[data-despedir]").first().click(); await espera(p, 500);
    const conf = p.locator("[data-confirmar-despedir]");
    const n = await conf.count();
    if (n) await conf.first().scrollIntoViewIfNeeded();
    const txt = n ? (await conf.first().innerText()).replace(/\s+/g, " ") : "";
    await foto(p, `${vp}-5-despedir-confirmar`);
    const gente0 = (await p.locator("[data-despedir]").count());
    await p.getByRole("button", { name: /^No$/ }).first().click().catch(() => {});
    await espera(p, 300);
    const gente1 = (await p.locator("[data-despedir]").count());
    await revisar(p, errs, `${vp} hallazgo 5: «Despedir» muestra el costo y pide confirmación`, n && /cuesta P\$[\d,]+/.test(txt) && gente0 === gente1, { texto: txt });
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

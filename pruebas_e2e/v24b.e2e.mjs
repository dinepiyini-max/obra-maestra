// v24: (1) Safari iPhone/iPad en segundo plano (visibilitychange o pagehide) pausa el reloj y calla el sonido.
// (2) Cerrar la página a mitad de un pago, compra o fiado: al recargar ni se pierde la partida ni se duplica dinero/material.
// Uso: node --experimental-strip-types pruebas_e2e/estados_v23.ts && node pruebas_e2e/v24b.e2e.mjs (dev server en URL_JUEGO).
import { chromium, devices } from "playwright";
import { readFileSync } from "node:fs";
const URL_ = process.env.URL_JUEGO || "http://127.0.0.1:4178/";
const E = JSON.parse(readFileSync(new URL("./estados_v23.json", import.meta.url), "utf8"));
const b = await chromium.launch();
const res = [];
const errs = [];
const DISP = { iPhone: devices["iPhone 13"], iPad: devices["iPad Mini"] };
async function abrir(almacen, disp) {
  const ctx = await b.newContext({ ...disp });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errs.push(String(e)));
  p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  await ctx.addInitScript(([a]) => { if (!sessionStorage.getItem("ya")) { localStorage.clear(); for (const [k, v] of Object.entries(a)) localStorage.setItem(k, v); sessionStorage.setItem("ya", "1"); } }, [almacen]);
  await p.goto(URL_); await p.waitForTimeout(2500);
  const seguir = p.getByRole("button", { name: /Seguir|Continuar/ }).first();
  if (await seguir.count()) { await seguir.click(); await p.waitForTimeout(1000); }
  return { ctx, p };
}
const est = (p) => p.evaluate(() => { const s = window.__controlsTest.estado(); return { minuto: s.minuto, dia: s.dia, panel: s.panel, pausa: s.pausa, caja: s.caja, fiado: s.fiado ?? 0, pedidos: s.pedidos.length, cem: s.inv.cemento.q + (s.pedidos.reduce((a, x) => a + (x.items?.cemento ?? 0), 0)) }; });
const audio = (p) => p.evaluate(() => window.__controlsTest.audio());
const almacenDe = (p) => p.evaluate(() => Object.fromEntries(Object.keys(localStorage).map((k) => [k, localStorage.getItem(k)])));

for (const [nom, disp] of Object.entries(DISP).slice(0, Number(process.env.SOLO ?? 9))) {
  for (const evento of ["visibilitychange", "pagehide"]) {
    const { ctx, p } = await abrir({ "obra-maestra-v1": JSON.stringify(E.reloj) }, disp);
    await p.keyboard.press("Shift"); // primer gesto: desbloquea el audio
    await p.evaluate(() => { const s = window.__controlsTest.estado(); s.sita = null; s.panel = null; s.pausa = false; window.__controlsTest.setPos(10, 20); });
    const caminar = () => p.evaluate(() => window.__controlsTest.setKeys(["ArrowRight"]));
    await caminar();
    const mA = (await est(p)).minuto;
    await p.waitForTimeout(2500);
    const a0 = await audio(p);
    const m0 = (await est(p)).minuto; // control: a la vista el reloj corre
    await p.evaluate((ev) => {
      Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
      Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
      if (ev === "pagehide") window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: true }));
      document.dispatchEvent(new Event("visibilitychange"));
    }, evento === "pagehide" ? "pagehide" : "vis");
    await p.waitForTimeout(400);
    const s1 = await est(p); const a1 = await audio(p);
    await caminar(); // aunque siga «caminando», oculto no corre
    await p.waitForTimeout(4000);
    const s2 = await est(p);
    // vuelve al frente: sigue en pausa (no corre solo) y el audio puede reanudarse
    await p.evaluate(() => {
      Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
      Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await p.waitForTimeout(1500);
    const s3 = await est(p);
    res.push({ caso: `${nom} ${evento}: reloj en pausa y sonido callado`, ok: m0 > mA && a0 === "running" && a1 === "suspended" && s1.pausa && s1.panel === "pausa" && s2.minuto === s1.minuto && s3.minuto === s1.minuto, audio: [a0, a1], minutos: [mA, m0, s1.minuto, s2.minuto, s3.minuto] });
    await ctx.close();
  }
}

// (2) Cierre a mitad de una compra, un fiado o con el pedido a medio llenar.
async function ferreteria(p, cant) {
  await p.evaluate(() => window.__controlsTest.setPos(30, 20.4));
  await p.waitForTimeout(300);
  await p.keyboard.press("Space"); await p.waitForTimeout(800);
  const campo = p.locator("input:visible").first();
  if (await campo.count()) { await campo.fill(String(cant)); await campo.blur(); }
  await p.waitForTimeout(300);
}
for (const caso of ["compra", "fiado", "a medias"]) {
  const st = structuredClone(E.reloj);
  st.caja = caso === "fiado" ? 0 : 50000; st.minuto = 9 * 60; st.adelantoDia = 1; st.jugador = { x: 30, y: 20.4 }; st.sita = null;
  const { ctx, p } = await abrir({ "obra-maestra-v1": JSON.stringify(st) }, { viewport: { width: 1280, height: 800 } });
  const s0 = await est(p);
  await ferreteria(p, 5);
  if (caso !== "a medias") {
    const ped = p.getByRole("button", { name: /Flete normal/ }).first();
    if (await ped.count()) await ped.click();
    await p.waitForTimeout(400);
    if (caso === "compra") { const c = p.getByRole("button", { name: /^Confirmar$/ }).first(); if (await c.count()) await c.click(); }
    if (caso === "fiado") { const f = p.locator("[data-fiar-pedido]").first(); if (await f.count()) await f.click(); }
    await p.waitForTimeout(150);
  }
  const s1 = await est(p);
  // Cierre brusco: lo guardado AHORA, sin pagehide ni visibilitychange, es lo que queda.
  const alm = await almacenDe(p);
  await ctx.close();
  const r = await abrir(alm, { viewport: { width: 1280, height: 800 } });
  const s2 = await est(r.p);
  // Recarga otra vez: nada cambia de nuevo (no se duplica al volver a cargar).
  const alm2 = await almacenDe(r.p); await r.ctx.close();
  const r3 = await abrir(alm2, { viewport: { width: 1280, height: 800 } });
  const s3 = await est(r3.p); await r3.ctx.close();
  const hizo = caso === "a medias" ? s1.pedidos === s0.pedidos && s1.caja === s0.caja : s1.pedidos === s0.pedidos + 1;
  const igual = (x, y) => x.caja === y.caja && x.fiado === y.fiado && x.pedidos === y.pedidos && x.cem === y.cem;
  res.push({ caso: `cerrar a mitad: ${caso}`, ok: hizo && igual(s1, s2) && igual(s2, s3) && !!s2.dia, antes: s0, despues: s1, recarga: s2, recarga2: s3 });
}
console.log(JSON.stringify(res, null, 1));
console.log("ERRORES", JSON.stringify(errs));
await b.close();
process.exit(res.every((r) => r.ok) && !errs.length ? 0 : 1);

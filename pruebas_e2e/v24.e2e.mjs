// v24: (1) fiado del pedido suelto con caja P$0, (2) aviso de nómina visible, (3) APROBADO se cierra al primer toque.
// Uso: node --experimental-strip-types pruebas_e2e/estados_v23.ts && node pruebas_e2e/v24.e2e.mjs (con el juego en URL_JUEGO).
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
const URL_ = process.env.URL_JUEGO || "http://127.0.0.1:4178/";
const OUT = process.env.CAPTURAS || ".";
const E = JSON.parse(readFileSync(new URL("./estados_v23.json", import.meta.url), "utf8"));
const b = await chromium.launch();
const res = [];
const errs = [];
async function abrir(st, w, h) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: Math.min(w, h) < 500, isMobile: Math.min(w, h) < 500 });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errs.push(String(e)));
  p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  await ctx.addInitScript(([s]) => { if (!sessionStorage.getItem("ya")) { localStorage.clear(); localStorage.setItem("obra-maestra-v1", s); sessionStorage.setItem("ya", "1"); } }, [JSON.stringify(st)]);
  await p.goto(URL_); await p.waitForTimeout(2500);
  const seguir = p.getByRole("button", { name: /Seguir|Continuar/ }).first();
  if (await seguir.count()) { await seguir.click(); await p.waitForTimeout(1000); }
  return { ctx, p };
}
for (const [vp, w, h] of [["1280x800", 1280, 800], ["375x667", 375, 667]]) {
  // (3) APROBADO
  {
    const { ctx, p } = await abrir(E.sello, w, h);
    const t0 = Date.now();
    await p.getByText("APROBADO").first().waitFor({ timeout: 20000 }).catch(() => {});
    const visto = await p.getByText("APROBADO").count();
    await p.waitForTimeout(600);
    await p.screenshot({ path: `${OUT}/aprobado-${vp}.png` });
    const t1 = Date.now();
    // Toca encima de un botón del HUD (¡Dale! en móvil, Libreta en PC): un solo toque debe cerrar el cartel.
    const btn = p.getByRole("button", { name: w < 500 ? /Dale/ : /^Libreta$/ }).first();
    const bb = (await btn.count()) ? await btn.boundingBox() : null;
    const x = bb ? bb.x + bb.width / 2 : w / 2, y = bb ? bb.y + bb.height / 2 : h / 2;
    if (w < 500) await p.touchscreen.tap(x, y); else await p.mouse.click(x, y);
    await p.waitForTimeout(400);
    const queda = await p.getByText("APROBADO").count();
    res.push({ caso: `${vp} APROBADO se cierra al primer toque`, ok: visto > 0 && queda === 0, aparecio_s: ((t1 - t0) / 1000).toFixed(1), quedaTrasToque: queda });
    await ctx.close();
  }
  // (2) nómina visible y (1) fiado del pedido suelto: caja P$0 a la 1 pm.
  {
    const st = structuredClone(E.reloj);
    st.caja = 0; st.minuto = 13 * 60 + 50; st.adelantoDia = 1; st.jugador = { x: 30, y: 20.4 };
    const { ctx, p } = await abrir(st, w, h);
    await p.waitForTimeout(2500);
    const linea = p.locator("[data-nomina-visible]");
    const n = await linea.count();
    const visible = n ? await linea.first().isVisible() : false;
    const txt = n ? (await linea.first().innerText()).replace(/\s+/g, " ") : "";
    await p.screenshot({ path: `${OUT}/nomina-visible-${vp}.png` });
    res.push({ caso: `${vp} aviso de nómina visible sin plegar`, ok: visible && /Nómina de las 3/.test(txt) && !/▸/.test(txt), texto: txt.slice(0, 120) });
    // Abre la Ferretería y pide algo suelto.
    await p.keyboard.press("Space"); await p.waitForTimeout(800);
    const body = await p.locator("body").innerText();
    let fiar = 0;
    if (/Ferreter/.test(body)) {
      const campo = p.locator("input:visible").first();
      if (await campo.count()) { await campo.fill("5"); await campo.blur(); }
      await p.waitForTimeout(300);
      const ped = p.getByRole("button", { name: /Flete normal/ }).first();
      if (await ped.count()) await ped.click();
      await p.waitForTimeout(600);
      fiar = await p.locator("[data-fiar-pedido]").count();
      await p.screenshot({ path: `${OUT}/fiado-pedido-${vp}.png` });
    }
    res.push({ caso: `${vp} pedido suelto con caja P$0 ofrece fiado`, ok: fiar > 0, ferreteria: /Ferreter/.test(body) });
    await ctx.close();
  }
}
console.log(JSON.stringify(res, null, 1));
console.log("ERRORES", JSON.stringify(errs));
await b.close();
process.exit(res.every((r) => r.ok) && !errs.length ? 0 : 1);

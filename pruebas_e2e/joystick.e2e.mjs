// v23: el joystick móvil no se suelta con un segundo dedo, al perder foco/visibilidad, ni al tocar ¡Dale! o Terminar.
// Uso: node --experimental-strip-types pruebas_e2e/estados_v23.ts && npx vite dev --port 4178 && node pruebas_e2e/joystick.e2e.mjs (necesita el modo DEV por window.__controlsTest).
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
const URL_ = process.env.URL_JUEGO || "http://127.0.0.1:4178/";
const E = JSON.parse(readFileSync(new URL("./estados_v23.json", import.meta.url), "utf8")).reloj;
E.jugador = { x: 12, y: 14 };
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 375, height: 667 }, hasTouch: true, isMobile: true });
const p = await ctx.newPage();
const errs = [];
p.on("pageerror", (e) => errs.push(String(e)));
await ctx.addInitScript(([st]) => { if (!sessionStorage.getItem("ya")) { localStorage.clear(); localStorage.setItem("obra-maestra-v1", st); sessionStorage.setItem("ya", "1"); } }, [JSON.stringify(E)]);
await p.goto(URL_); await p.waitForTimeout(3000);
const seguir = p.getByRole("button", { name: /Seguir|Continuar/ }).first();
if (await seguir.count()) { await seguir.click(); await p.waitForTimeout(1200); }
for (let i = 0; i < 3; i++) { const x = p.getByRole("button", { name: /^X$|Ahora no/ }).first(); if (await x.count()) { await x.click().catch(() => {}); await p.waitForTimeout(300); } }
const cdp = await ctx.newCDPSession(p);
const pal = await p.locator("[data-palanca]").first().boundingBox();
if (!pal) throw new Error("no hay palanca");
const cx = pal.x + pal.width / 2, cy = pal.y + pal.height / 2;
const dale = await p.getByRole("button", { name: /Dale/ }).first().boundingBox();
const terminar = await p.getByRole("button", { name: /^Terminar/ }).first().boundingBox();
const t1 = { x: cx + pal.width * 0.4, y: cy, id: 1 };
const touch = (type, pts) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: pts.map((q) => ({ x: q.x, y: q.y, id: q.id })) });
const pos = () => p.evaluate(() => window.__controlsTest.getPos());
await touch("touchStart", [{ x: cx, y: cy, id: 1 }]);
await touch("touchMove", [t1]);
await p.waitForTimeout(400);
const res = [];
const paso = async (nombre, fn) => {
  const a = await pos();
  await fn();
  // El primer dedo queda quieto: no se manda ningún move que «arregle» la palanca.
  await p.waitForTimeout(700);
  const c = await pos();
  const ok = c.x - a.x > 0.3 || Math.hypot(c.x - a.x, c.y - a.y) > 0.3;
  res.push({ nombre, ok, avance: +(Math.hypot(c.x - a.x, c.y - a.y)).toFixed(2) });
};
await paso("solo el joystick", async () => {});
await paso("segundo dedo en el mapa", async () => { const d2 = { x: 250, y: 300, id: 2 }; await touch("touchStart", [t1, d2]); await p.waitForTimeout(80); await touch("touchEnd", [d2]); });
await paso("segundo dedo en el joystick", async () => { const d2 = { x: cx - 10, y: cy + 10, id: 3 }; await touch("touchStart", [t1, d2]); await p.waitForTimeout(80); await touch("touchEnd", [d2]); });
// Un aviso del sistema (notificación, Centro de control a medias) solo quita el foco: la palanca no se suelta.
await paso("pierde el foco (notificación)", async () => {
  await p.evaluate(() => window.dispatchEvent(new Event("blur")));
  await p.waitForTimeout(150);
  await p.evaluate(() => window.dispatchEvent(new Event("focus")));
});
// v24: a segundo plano (visibilitychange) el juego se pausa; al volver y quitar la pausa, el dedo que sigue en la palanca sigue mandando.
let pausoOculto = false;
await paso("segundo plano pausa y al volver la palanca sigue", async () => {
  await p.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => true }); document.dispatchEvent(new Event("visibilitychange")); });
  await p.waitForTimeout(150);
  pausoOculto = await p.evaluate(() => window.__controlsTest.estado().panel === "pausa");
  await p.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => false }); document.dispatchEvent(new Event("visibilitychange")); });
  await p.keyboard.press("Escape"); await p.waitForTimeout(200);
});
if (!pausoOculto) res[res.length - 1].ok = false;
if (dale) await paso("toca ¡Dale! con otro dedo", async () => { const d2 = { x: dale.x + dale.width / 2, y: dale.y + dale.height / 2, id: 4 }; await touch("touchStart", [t1, d2]); await p.waitForTimeout(80); await touch("touchEnd", [d2]); });
// Terminar abre un aviso (panel): el joystick se oculta con el panel abierto; al cerrar debe seguir si el dedo sigue.
if (terminar) await paso("toca Terminar con otro dedo y cierra el aviso", async () => {
  const d2 = { x: terminar.x + terminar.width / 2, y: terminar.y + terminar.height / 2, id: 5 }; await touch("touchStart", [t1, d2]); await p.waitForTimeout(80); await touch("touchEnd", [d2]);
  await p.waitForTimeout(300); await p.keyboard.press("Escape").catch(() => {}); await p.waitForTimeout(300);
});
await touch("touchEnd", []);
await p.waitForTimeout(500);
const a = await pos(); await p.waitForTimeout(600); const c = await pos();
res.push({ nombre: "al soltar el dedo se para", ok: Math.hypot(c.x - a.x, c.y - a.y) < 0.05, avance: +(Math.hypot(c.x - a.x, c.y - a.y)).toFixed(2) });
await p.screenshot({ path: process.env.CAPTURA || "joystick-375x667.png" });
console.log(JSON.stringify(res, null, 1));
console.log("ERRORES", JSON.stringify(errs));
await b.close();
process.exit(res.every((r) => r.ok) && !errs.length ? 0 : 1);

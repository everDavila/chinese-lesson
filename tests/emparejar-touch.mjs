// Prueba manual del piloto /lab/emparejar con toque real (CDP) y ratón. Requiere el servidor en localhost:3001. Uso: node tests/emparejar-touch.mjs
import { chromium } from "@playwright/test";

const url = "http://localhost:3001/es/lab/emparejar";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
page.setDefaultTimeout(30000);
await page.goto(url, { waitUntil: "networkidle" });

const slotsFilled = () => page.locator("[data-slot] [lang='zh-Hans']").count();
const center = async (loc) => { const b = await loc.boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; };

async function touchDrag(from, to) {
  const steps = 8;
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: from.x, y: from.y }] });
  for (let i = 1; i <= steps; i++) {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: from.x + ((to.x - from.x) * i) / steps, y: from.y + ((to.y - from.y) * i) / steps }] });
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
}

// Palabras de la página: pinyin de cada hueco y su hanzi correcto (se lee del DOM sin corregir: probamos arrastrando fichas al azar y luego corrigiendo).
const out = [];
// 1) Arrastre con el dedo: la primera ficha del banco al primer hueco.
let chip = page.locator("section[data-bank] button").first();
const hanzi = await chip.getAttribute("aria-label");
await touchDrag(await center(chip), await center(page.locator("[data-slot='0']")));
out.push(`dedo: ficha ${hanzi} → hueco 0: huecos llenos = ${await slotsFilled()} (esperado 1)`);

// 2) Mover la ficha del hueco 0 al hueco 3 con el dedo.
await touchDrag(await center(page.locator("[data-slot='0'] button")), await center(page.locator("[data-slot='3']")));
out.push(`dedo: mover hueco 0 → 3: en 3 = ${await page.locator("[data-slot='3'] button").count()}, en 0 = ${await page.locator("[data-slot='0'] button").count()} (esperado 1 y 0)`);

// 3) Devolver al banco arrastrando sobre el banco.
await touchDrag(await center(page.locator("[data-slot='3'] button")), await center(page.locator("section[data-bank]")));
out.push(`dedo: devolver al banco: huecos llenos = ${await slotsFilled()} (esperado 0)`);

// 4) Modo tocar: tocar ficha y tocar hueco.
chip = page.locator("section[data-bank] button").first();
await chip.tap();
await page.locator("[data-slot='1']").tap();
out.push(`toque: ficha + hueco 1: huecos llenos = ${await slotsFilled()} (esperado 1)`);

// 5) Llenar todo con toques y enviar.
for (let i = 0; i < 6; i++) {
  if (await page.locator(`[data-slot='${i}'] button`).count()) continue;
  await page.locator("section[data-bank] button").first().tap();
  await page.locator(`[data-slot='${i}']`).tap();
}
const full = await slotsFilled();
await page.getByRole("button", { name: "Enviar respuestas" }).tap();
const status = await page.getByRole("status").innerText();
out.push(`enviar: huecos llenos ${full}/6, resultado "${status}"`);

// 6) Ratón (escritorio): contexto aparte.
const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const p2 = await ctx2.newPage();
await p2.goto(url, { waitUntil: "networkidle" });
const c2 = p2.locator("section[data-bank] button").first();
await c2.dragTo(p2.locator("[data-slot='2']"));
out.push(`ratón: huecos llenos = ${await p2.locator("[data-slot] [lang='zh-Hans']").count()} (esperado 1)`);

await page.screenshot({ path: "test-results/emparejar-movil.png" });
console.log(out.join("\n"));
await browser.close();

// Prueba temporal (se borra tras ejecutarla): drag & drop de lecciones con la
// sesión guardada de la docente. Arrastra, verifica el cambio y restaura el
// orden original. Uso: node tests/drag-check.mjs
import { chromium } from "@playwright/test";

const base = "http://localhost:3000";
const browser = await chromium.launch();
const ctx = await browser.newContext({
  storageState: "tests/.auth/laoshi.json",
  viewport: { width: 1366, height: 768 },
});
const page = await ctx.newPage();
page.setDefaultTimeout(15_000);

const log = (m) => console.log(`[drag] ${m}`);
const order = async () => (await page.locator("ol > li a").allInnerTexts()).map((s) => s.trim());
const waitOrder = (expected) =>
  page.waitForFunction(
    (exp) => [...document.querySelectorAll("ol > li a")].map((a) => a.textContent.trim()).join("|") === exp.join("|"),
    expected,
  );

// 1) Sesión viva y primera colección con ≥2 lecciones.
await page.goto(`${base}/es/collections`);
await Promise.race([
  page.waitForURL(/\/login/, { timeout: 20_000 }).then(() => {
    throw new Error("La sesión guardada ya no vale: hay que regenerarla (npm run test:sesion laoshi).");
  }),
  page.getByRole("heading", { name: "Mis colecciones" }).waitFor({ timeout: 30_000 }),
]);
await page.locator('a[href^="/es/collections/"]').first().waitFor({ timeout: 30_000 });
const hrefs = await page.locator('a[href^="/es/collections/"]').evaluateAll((as) => [...new Set(as.map((a) => a.getAttribute("href")))]);
log(`colecciones visibles: ${hrefs.length}`);

let target = null;
let count = 0;
for (const href of hrefs) {
  await page.goto(base + href);
  count = await page.locator("ol > li").count();
  if (count >= 2) { target = href; break; }
}
if (!target) throw new Error("Ninguna colección con 2 lecciones o más.");
log(`colección de prueba: ${target} (${count} lecciones)`);

// 2) Estado original.
const rows = page.locator("ol > li");
const original = await order();
log(`orden original: ${original.join(" | ")}`);

// 3) Arrastre con ratón: primera lección al final (el número de la fila, que
//    no es un control, es el ancla de arrastre).
await rows.nth(0).locator("span").first().dragTo(rows.nth(count - 1));
const esperadoA = [...original.slice(1), original[0]];
await waitOrder(esperadoA);
log(`tras arrastrar 1ª → última: ${(await order()).join(" | ")}`);

// 4) Restaura arrastrando de vuelta: última → primera.
await rows.nth(count - 1).locator("span").first().dragTo(rows.nth(0));
await waitOrder(original);
log(`tras restaurar con el ratón: ${(await order()).join(" | ")}`);

// 5) Vía accesibilidad: asa + flecha ↓ mueve la primera lección una posición.
await rows.nth(0).getByRole("button", { name: /Reordenar/ }).focus();
await page.keyboard.press("ArrowDown");
const esperadoB = [original[1], original[0], ...original.slice(2)];
await waitOrder(esperadoB);
log(`tras ↓ con teclado: ${(await order()).join(" | ")}`);

// y ↑ la devuelve.
await rows.nth(1).getByRole("button", { name: /Reordenar/ }).focus();
await page.keyboard.press("ArrowUp");
await waitOrder(original);
log(`tras ↑ con teclado: ${(await order()).join(" | ")}`);

log("OK: arrastre con ratón y con teclado funcionan; orden original restaurado. ✔");
await browser.close();

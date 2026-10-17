import { existsSync } from "node:fs";
import { expect as baseExpect, test, type Page } from "@playwright/test";
import es from "../../messages/es.json";

// Biblioteca HSK por nivel completo: la tabla en orden oficial, "Mostrar más"
// sin repetir filas, la búsqueda con y sin tonos y los niveles de cada
// palabra. Con la sesión de la docente.

const auth = `${process.env.HANZI_AUTH_DIR ?? "tests/.auth"}/laoshi.json`;
test.skip(!existsSync(auth), "Falta la sesión de laoshi");
test.use({ storageState: auth });
// Tres niveles y varias búsquedas: con 8 tamaños en paralelo, 30 s no alcanzan.
test.describe.configure({ timeout: 90_000 });
// El servidor de desarrollo compila cada ruta la primera vez: 5 s no alcanzan.
const expect = baseExpect.configure({ timeout: 20_000 });

const H = es.HskLibrary;
const rows = (page: Page) => page.getByTestId("catalog-row");
// Filas cuyo hanzi es exactamente `h` (buscar 得 también trae 记得…).
const exact = (page: Page, h: string) =>
  rows(page).filter({ has: page.locator("td.font-hanzi", { hasText: new RegExp("^" + h + "$") }) });
const orders = (page: Page) => rows(page).evaluateAll((trs) => trs.map((tr) => Number(tr.querySelector("td")?.textContent)));

test("un nivel completo: orden oficial, mostrar más, búsqueda y niveles", async ({ page }, testInfo) => {
  await page.goto("/es/library/hsk/nivel/1");
  await page.waitForLoadState("networkidle");
  await expect(rows(page)).toHaveCount(50);
  await expect(page.getByText(H.showing.replace("{shown}", "50").replace("{total}", "300"))).toBeVisible();

  // Mostrar más: 100 filas, en orden oficial y sin repetidos.
  await page.getByRole("button", { name: H.showMore }).click();
  await expect(rows(page)).toHaveCount(100);
  const o = await orders(page);
  expect(new Set(o).size).toBe(100);
  expect([...o].sort((a, b) => a - b)).toEqual(o);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, "scroll horizontal").toBeLessThanOrEqual(1);

  // HSK 3: 得 tiene dos entradas (dé, děi) y aparece también en HSK 2.
  await page.goto("/es/library/hsk/nivel/3");
  await page.waitForLoadState("networkidle");
  await page.getByRole("searchbox", { name: H.searchVocabulary }).fill("得");
  await expect(exact(page, "得")).toHaveCount(2);
  await expect(exact(page, "得").first().getByRole("link", { name: "HSK 2" })).toBeVisible();
  await page.screenshot({ path: `tests/screens/${testInfo.project.name}/hsk-buscar.png`, fullPage: true });
  // Con tono, exacto: "dé" no trae děi.
  await page.getByRole("searchbox", { name: H.searchVocabulary }).fill("dé");
  await expect(exact(page, "得")).toHaveCount(1);

  // HSK 7–9: sin plantilla, sin botón de copiar; carga por páginas.
  await page.goto("/es/library/hsk/nivel/7");
  await page.waitForLoadState("networkidle");
  await expect(rows(page)).toHaveCount(50);
  await expect(page.getByText(H.showing.replace("{shown}", "50").replace("{total}", "5600"))).toBeVisible();
  await expect(page.getByRole("button", { name: H.copyTemplate.replace("{level}", "7–9") })).toHaveCount(0);
});

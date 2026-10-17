import { existsSync } from "node:fs";
import { expect as baseExpect, test, type Page } from "@playwright/test";
import es from "../../messages/es.json";

// Biblioteca HSK por nivel completo: la tabla en orden oficial, páginas
// numeradas (shadcn Pagination) de 25/50/100 sin repetir ni saltar filas, la
// búsqueda con y sin tonos y los niveles de cada palabra. Con la sesión de la
// docente.

const auth = `${process.env.HANZI_AUTH_DIR ?? "tests/.auth"}/laoshi.json`;
test.skip(!existsSync(auth), "Falta la sesión de laoshi");
test.use({ storageState: auth });
// Tres niveles y varias búsquedas: con 8 tamaños en paralelo, 30 s no alcanzan.
test.describe.configure({ timeout: 120_000 });
// El servidor de desarrollo compila cada ruta la primera vez: 5 s no alcanzan.
const expect = baseExpect.configure({ timeout: 20_000 });

const H = es.HskLibrary;
const rows = (page: Page) => page.getByTestId("catalog-row");
const range = (page: Page) => page.getByTestId("catalog-range");
const text = (from: number, to: number, total: number) =>
  H.range.replace("{from}", String(from)).replace("{to}", String(to)).replace("{total}", String(total));
// Filas cuyo hanzi es exactamente `h` (buscar 得 también trae 记得…).
const exact = (page: Page, h: string) =>
  rows(page).filter({ has: page.locator("td.font-hanzi", { hasText: new RegExp("^" + h + "$") }) });
const orders = (page: Page) =>
  page.getByTestId("catalog-order").evaluateAll((tds) => tds.map((td) => Number(td.textContent)));
const pageLink = (page: Page, n: number) => page.getByRole("link", { name: H.pageN.replace("{n}", String(n)), exact: true });

test("un nivel completo: orden oficial, páginas numeradas, búsqueda y niveles", async ({ page }, testInfo) => {
  await page.goto("/es/library/hsk/nivel/1");
  await page.waitForLoadState("networkidle");
  await expect(rows(page)).toHaveCount(25);
  await expect(range(page)).toHaveText(text(1, 25, 300));
  const first = await orders(page);
  expect([...first].sort((a, b) => a - b)).toEqual(first);

  // Siguiente: la página 2, todas las filas después de la primera.
  await page.getByRole("link", { name: H.next }).click();
  await expect(page).toHaveURL(/pagina=2/);
  await expect(range(page)).toHaveText(text(26, 50, 300));
  const second = await orders(page);
  expect(second).toHaveLength(25);
  expect(Math.min(...second)).toBeGreaterThan(Math.max(...first));

  // Número de página (desde la 2 se ven 1 2 3 … 12) y Anterior.
  await expect(pageLink(page, 12)).toBeVisible();
  await pageLink(page, 3).click();
  await expect(range(page)).toHaveText(text(51, 75, 300));
  await page.screenshot({ path: `tests/screens/${testInfo.project.name}/hsk-paginas.png`, fullPage: true });
  await page.getByRole("link", { name: H.previous }).click();
  await expect(range(page)).toHaveText(text(26, 50, 300));

  // Tamaño de página: 50 y 100 (vuelve a la página 1).
  await page.getByLabel(H.perPage).selectOption("50");
  await expect(page).toHaveURL(/tamano=50/);
  await expect(rows(page)).toHaveCount(50);
  await expect(range(page)).toHaveText(text(1, 50, 300));
  await page.getByLabel(H.perPage).selectOption("100");
  await expect(rows(page)).toHaveCount(100);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, "scroll horizontal").toBeLessThanOrEqual(1);

  // La última página se abre directo desde la dirección y no deja avanzar.
  await page.goto("/es/library/hsk/nivel/1?pagina=12");
  await expect(range(page)).toHaveText(text(276, 300, 300));
  await expect(page.getByRole("link", { name: H.next })).toHaveAttribute("aria-disabled", "true");

  // HSK 3: 得 tiene dos entradas (dé, děi) y aparece también en HSK 2.
  await page.goto("/es/library/hsk/nivel/3");
  await page.waitForLoadState("networkidle");
  await page.getByRole("searchbox", { name: H.searchVocabulary }).fill("得");
  await expect(page).toHaveURL(/q=/);
  await expect(exact(page, "得")).toHaveCount(2);
  await expect(exact(page, "得").first().getByRole("link", { name: "HSK 2" })).toBeVisible();
  await page.screenshot({ path: `tests/screens/${testInfo.project.name}/hsk-buscar.png`, fullPage: true });
  // Con tono, exacto: "dé" no trae děi.
  await page.getByRole("searchbox", { name: H.searchVocabulary }).fill("dé");
  await expect(exact(page, "得")).toHaveCount(1);

  // HSK 7–9: 224 páginas, con puntos suspensivos; sin botón de copiar.
  await page.goto("/es/library/hsk/nivel/7");
  await page.waitForLoadState("networkidle");
  await expect(rows(page)).toHaveCount(25);
  await expect(range(page)).toHaveText(text(1, 25, 5600));
  await expect(pageLink(page, 224)).toBeVisible();
  await expect(page.locator("[data-slot=pagination-ellipsis]")).toHaveCount(1);
  await expect(page.getByRole("button", { name: H.copyTemplate.replace("{level}", "7–9") })).toHaveCount(0);
});

test("selección múltiple: se mantiene entre páginas, niveles y al recargar", async ({ page }) => {
  const count = page.getByTestId("selection-count");
  const n = (k: number) => H.selectedCount.replace(/{count, plural, one {# ([^}]*)} other {# ([^}]*)}}/, (_, one, other) => `${k} ${k === 1 ? one : other}`);
  await page.goto("/es/library/hsk/nivel/1");
  await page.evaluate(() => sessionStorage.clear());
  await page.reload();
  await page.waitForLoadState("networkidle");
  await expect(count).toHaveCount(0);

  // Dos palabras de la página 1: la cabecera queda a medias.
  const boxes = rows(page).getByRole("checkbox");
  await boxes.nth(0).click();
  await boxes.nth(1).click();
  await expect(count).toHaveText(n(2));
  await expect(page.getByRole("checkbox", { name: H.selectPage })).toHaveAttribute("aria-checked", "mixed");

  // Página 2: la selección sigue; la cabecera marca las 25 de esta página.
  await page.getByRole("link", { name: H.next }).click();
  await expect(page.getByTestId("catalog-range")).toHaveText(H.range.replace("{from}", "26").replace("{to}", "50").replace("{total}", "300"));
  await expect(count).toHaveText(n(2));
  await page.getByRole("checkbox", { name: H.selectPage }).click();
  await expect(count).toHaveText(n(27));

  // Otro nivel: se suma; al recargar se conserva.
  await page.goto("/es/library/hsk/nivel/2");
  await page.waitForLoadState("networkidle");
  await expect(count).toHaveText(n(27));
  await rows(page).getByRole("checkbox").first().click();
  await expect(count).toHaveText(n(28));
  await page.reload();
  await page.waitForLoadState("networkidle");
  await expect(count).toHaveText(n(28));

  // Ver la selección, quitar una y quitar todas.
  await page.getByRole("button", { name: H.showSelection }).click();
  const selectionList = page.getByRole("region", { name: H.selectionTitle }).getByRole("listitem");
  await expect(selectionList).toHaveCount(28);
  await page.screenshot({ path: `tests/screens/${test.info().project.name}/hsk-seleccion.png` });
  await selectionList.first().getByRole("button").click();
  await expect(count).toHaveText(n(27));
  await page.getByRole("button", { name: H.clearSelection }).click();
  await expect(count).toHaveCount(0);
});

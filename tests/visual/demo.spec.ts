import { expect, test } from "@playwright/test";

// La demo pública es la lección de ejemplo de la base (20261018000000). En la
// nota cultural de 东西 se cita 东市: no es palabra del catálogo, así que se
// parte y 东 abre su ayuda con pinyin.

test("demo: las citas de la nota se parten y abren su ayuda", async ({ page }, testInfo) => {
  await page.goto("/es/present");
  await page.locator(".transform-3d").waitFor();
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: /Palabra siguiente/ }).click();
  await page.keyboard.press("Space");
  await page.getByRole("button", { name: /Más detalles/ }).click();
  const dong = page.locator("button").filter({ hasText: /^东$/ }).first();
  await dong.scrollIntoViewIfNeeded();
  await dong.click();
  await expect(page.getByRole("dialog").getByText("dōng", { exact: true })).toBeVisible();
  await page.screenshot({ path: `tests/screens/${testInfo.project.name}/demo-cita.png` });
});

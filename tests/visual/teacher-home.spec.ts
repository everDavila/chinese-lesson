import { existsSync } from "node:fs";
import { expect, test } from "@playwright/test";
import es from "../../messages/es.json";

const auth = "tests/.auth/laoshi.json";
test.skip(!existsSync(auth), "Falta la sesión de laoshi");
test.use({ storageState: auth });

test("el inicio docente sirve para preparar y conserva los flujos reales", async ({ page }, testInfo) => {
  await page.goto("/es");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Hola");
  await expect(page.getByRole("heading", { name: es.TeacherHome.continue })).toBeVisible();
  await expect(page.getByRole("heading", { name: es.TeacherHome.library })).toBeVisible();
  await expect(page.getByText("Accesos rápidos")).toHaveCount(0);
  await page.screenshot({ path: `tests/screens/${testInfo.project.name}/inicio-docente.png`, fullPage: true });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);

  await page.getByRole("link", { name: es.TeacherWorkspace.library }).first().click();
  await expect(page).toHaveURL(/\/es\/library$/);
  await expect(page.getByRole("heading", { level: 1, name: es.Manage.libraryTitle })).toBeVisible();

  await page.goto("/es");
  await page.getByRole("link", { name: new RegExp(es.TeacherHome.newCollection) }).first().click();
  await expect(page).toHaveURL(/\/es\/collections\?create=1$/);
  await expect(page.getByRole("textbox", { name: es.Manage.newCollection })).toBeVisible();
});

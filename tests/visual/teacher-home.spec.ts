import { existsSync } from "node:fs";
import { expect, test } from "@playwright/test";
import es from "../../messages/es.json";

const auth = `${process.env.HANZI_AUTH_DIR ?? "tests/.auth"}/laoshi.json`;
test.skip(!existsSync(auth), "Falta la sesión de laoshi");
test.use({ storageState: auth });

test("el inicio docente sirve para preparar y conserva los flujos reales", async ({ page }, testInfo) => {
  await page.goto("/es");
  await expect(page.getByRole("heading", { level: 1, name: es.TeacherHome.homeTitle })).toBeVisible();
  await expect(page.getByRole("heading", { name: es.TeacherHome.quickAccess })).toBeVisible();
  await expect(page.getByRole("heading", { name: es.TeacherHome.recentLessons })).toBeVisible();
  await expect(page.getByRole("heading", { name: es.TeacherHome.library })).toHaveCount(0);
  await page.screenshot({ path: `tests/screens/${testInfo.project.name}/inicio-docente.png`, fullPage: true });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);

  const desktop = page.viewportSize()!.width >= 1024;
  const libraryLink = desktop ? es.TeacherWorkspace.hsk : es.TeacherWorkspace.library;
  await page.getByRole("link", { name: libraryLink }).first().click();
  await expect(page).toHaveURL(desktop ? /\/es\/library\/hsk$/ : /\/es\/library$/);
  await expect(page.getByRole("heading", { level: 1, name: desktop ? es.HskLibrary.title : es.Manage.libraryTitle })).toBeVisible();
  if (desktop) await page.screenshot({ path: `tests/screens/${testInfo.project.name}/biblioteca-hsk.png`, fullPage: true });
  const hsk1 = page.getByRole("listitem").filter({ hasText: "HSK 1" });
  await hsk1.getByRole("link", { name: new RegExp(es.HskLibrary.seeLessons) }).click();
  await expect(page).toHaveURL(/\/es\/library\/hsk\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("button", { name: es.HskLibrary.copyCollection })).toBeVisible();
  await page.screenshot({ path: `tests/screens/${testInfo.project.name}/hsk-coleccion.png`, fullPage: true });
  await page.getByRole("link", { name: es.HskLibrary.viewWords }).first().click();
  await expect(page).toHaveURL(/\/es\/library\/hsk\/[0-9a-f-]{36}\/[0-9a-f-]{36}$/);
  await expect(page.getByText(es.HskLibrary.readOnly).first()).toBeVisible();
  if (desktop) await page.screenshot({ path: `tests/screens/${testInfo.project.name}/hsk-leccion.png`, fullPage: true });

  await page.goto("/es/collections");
  await expect(page.getByRole("button", { name: es.Manage.useTemplate })).toHaveCount(0);
  await page.getByRole("link", { name: es.TeacherWorkspace.lessons }).first().click();
  await expect(page).toHaveURL(/\/es\/lessons$/);
  await expect(page.getByRole("heading", { level: 1, name: es.TeacherLessons.title })).toBeVisible();

  // El menú «Crear» de la cabecera es solo de escritorio; en celular se crea
  // desde «Mis colecciones».
  if (desktop) {
    await page.goto("/es");
    await page.getByText(es.Manage.create, { exact: true }).click();
    await page.getByRole("link", { name: es.TeacherWorkspace.createCollection }).click();
    await expect(page).toHaveURL(/\/es\/collections\?create=1$/);
    await expect(page.getByRole("textbox", { name: es.Manage.newCollection })).toBeVisible();
  }
});

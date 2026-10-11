import { expect, test } from "@playwright/test";

// Recorre el prototipo de colecciones como lo haría una persona y guarda
// capturas en tests/screens/<proyecto>/prototipo-*.png. Cada test empieza con
// un navegador limpio, es decir, con los datos de ejemplo.

test("docente: copiar plantilla, armar lección y presentar", async ({ page }, info) => {
  const shot = (n: string) => page.screenshot({ path: `tests/screens/${info.project.name}/prototipo-${n}.png`, fullPage: true });

  await page.goto("/es/prototipo");
  await shot("01-entrada");
  await page.getByRole("link", { name: /Vista docente/ }).click();
  await expect(page.getByRole("heading", { name: "Mis colecciones" })).toBeVisible();
  await shot("02-colecciones");

  // Copiar la plantilla HSK 1 y renombrarla.
  await page.getByRole("button", { name: /Usar esta plantilla/ }).click();
  await expect(page.getByText("Copia de una plantilla")).toBeVisible();
  await page.getByRole("button", { name: /Renombrar/ }).click();
  await page.getByLabel("Nuevo nombre").fill("Básico 1");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByRole("heading", { name: "Básico 1" })).toBeVisible();
  await shot("03-coleccion");

  // Lección nueva: añadir buscando y pegando una lista.
  await page.getByLabel(/Nombre de la lección/).fill("Lección 1 del libro");
  await page.getByRole("button", { name: /Añadir lección/ }).click();
  await expect(page.getByRole("heading", { name: "Lección 1 del libro" })).toBeVisible();
  await page.getByLabel("Buscar palabra").fill("renshi");
  await page.getByRole("button", { name: "Añadir 认识" }).click();
  await page.getByRole("tab", { name: "Pegar lista" }).click();
  await page.getByLabel("Lista de hanzi").fill("家 东西 你 好 吗 他们");
  await shot("04-pegar-lista");
  await page.getByRole("button", { name: /Añadir \d+ palabras/ }).click();
  await expect(page.getByRole("heading", { name: /Palabras/ })).toContainText("7");
  await shot("05-leccion");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, "scroll horizontal en la lección").toBeLessThanOrEqual(1);

  // Presentar: solo las palabras con contenido curado.
  const present = page.getByRole("link", { name: /Presentar/ });
  await expect(present).toContainText("(3)");
  await present.click();
  await expect(page.locator(".transform-3d")).toBeVisible();
  await expect(page.getByRole("combobox")).toContainText("1 / 3");
  await shot("06-presentar");
});

test("admin: base común, editar palabra y plantillas", async ({ page }, info) => {
  const shot = (n: string) => page.screenshot({ path: `tests/screens/${info.project.name}/prototipo-${n}.png`, fullPage: true });

  await page.goto("/es/prototipo/admin");
  await expect(page.getByRole("heading", { name: "Base común" })).toBeVisible();
  await page.getByRole("button", { name: /Nivel/ }).click();
  await page.getByRole("menuitemcheckbox", { name: /HSK 1/ }).click();
  await page.keyboard.press("Escape");
  await shot("10-admin-base");

  // Editar una palabra del catálogo sin contenido: el control de nivel avisa.
  await page.getByLabel("Buscar en la base").fill("ài");
  await page.getByRole("link", { name: "Editar 爱" }).click();
  await page.getByLabel("Significado (español)").fill("amar; querer");
  await page.getByLabel("Chino").fill("我爱我的家。");
  await expect(page.getByText(/Nivel correcto/)).toBeVisible();
  await page.getByLabel("Chino").fill("我爱旅游。");
  await expect(page.getByText(/Por encima de HSK 1/)).toBeVisible();
  await shot("11-admin-editor");
  await page.getByLabel("Estado").selectOption("borrador");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText("Guardado")).toBeVisible();

  await page.goto("/es/prototipo/admin/plantillas");
  await expect(page.getByRole("heading", { name: "Plantillas" })).toBeVisible();
  await shot("12-admin-plantillas");
});

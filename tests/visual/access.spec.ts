import { expect, test } from "@playwright/test";

// Sin sesión, las vistas de docente y admin llevan al login (la redirección
// llega dentro del streaming, no como 302: hace falta un navegador).
for (const path of ["/es/collections", "/es/admin", "/es/admin/suggestions", "/zh/collections/x/y/z"]) {
  test(`sin sesión, ${path} lleva al login`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login$/);
  });
}

test("alumno: escribir el código en /v lleva a la votación", async ({ page }) => {
  await page.goto("/es/v");
  await page.getByRole("textbox").fill("abc234");
  await page.getByRole("button").filter({ hasText: /Entrar/ }).click();
  await expect(page).toHaveURL(/\/es\/v\/ABC234$/);
});

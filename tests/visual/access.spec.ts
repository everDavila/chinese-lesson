import { expect, test } from "@playwright/test";

// Sin sesión, las vistas de docente y admin llevan al login (la redirección
// llega dentro del streaming, no como 302: hace falta un navegador).
for (const path of ["/es/collections", "/es/admin", "/es/admin/suggestions", "/zh/collections/x/y/z"]) {
  test(`sin sesión, ${path} lleva al login`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login$/);
  });
}

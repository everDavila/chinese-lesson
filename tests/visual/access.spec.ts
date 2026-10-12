import { expect, test } from "@playwright/test";

// Sin sesión, las vistas de docente y admin llevan al login (la redirección
// llega dentro del streaming, no como 302: hace falta un navegador).
for (const path of ["/es/collections", "/es/admin", "/es/admin/suggestions", "/zh/collections/x/y/z"]) {
  test(`sin sesión, ${path} lleva al login`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login$/);
  });
}

test("alumno: un código inválido conserva el formulario y permite corregirlo", async ({ page }) => {
  await page.goto("/es/v");
  // Escribir antes de que la página se hidrate pierde el texto.
  await page.waitForLoadState("networkidle");
  const input = page.getByRole("textbox");
  await input.fill("IIIIII"); // I no forma parte del alfabeto de códigos generados.
  await page.getByRole("button").filter({ hasText: /Entrar/ }).click();
  await expect(page).toHaveURL(/\/es\/v$/);
  await expect(input).toHaveValue("IIIIII");
  await expect(input).toBeFocused();
  await expect(page.locator("#code-error")).toContainText("No encontramos una clase activa");
  await expect(page.getByTestId("panda-mascot")).toHaveAttribute("data-reaction", "confused");
});

test("alumno: el panda mira la casilla activa del código", async ({ page }) => {
  await page.goto("/es/v");
  await page.waitForLoadState("networkidle");

  const input = page.getByRole("textbox");
  const pupils = page.getByTestId("panda-pupils");
  await expect(pupils).toHaveAttribute("data-gaze-index", "rest");

  await input.focus();
  await expect(pupils).toHaveAttribute("data-gaze-index", "0");
  await input.fill("ABC");
  await expect(pupils).toHaveAttribute("data-gaze-index", "3");
  await input.fill("ABC234");
  await expect(pupils).toHaveAttribute("data-gaze-index", "5");
});

test("alumno: corregir una casilla permite seguir con las siguientes", async ({ page }) => {
  await page.goto("/es/v");
  await page.waitForLoadState("networkidle");

  const input = page.getByRole("textbox");
  await input.fill("PAMXB2");
  const bounds = await input.boundingBox();
  expect(bounds).not.toBeNull();

  // La M está en la tercera de seis casillas.
  await input.click({ position: { x: (bounds!.width * 2.5) / 6, y: bounds!.height / 2 } });
  await expect
    .poll(() =>
      input.evaluate((element) => {
        const field = element as HTMLInputElement;
        return [field.selectionStart, field.selectionEnd];
      }),
    )
    .toEqual([2, 3]);
  await input.press("N");

  await expect(input).toHaveValue("PANXB2");
  await expect
    .poll(() =>
      input.evaluate((element) => {
        const field = element as HTMLInputElement;
        return [field.selectionStart, field.selectionEnd];
      }),
    )
    .toEqual([3, 4]);

  await input.press("D");
  await input.press("A");

  await expect(input).toHaveValue("PANDA2");
  await expect(page.getByTestId("panda-pupils")).toHaveAttribute("data-gaze-index", "5");
});

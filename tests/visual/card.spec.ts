import { expect, test } from "@playwright/test";

// Recorre la tarjeta (anverso y reverso) de algunas palabras y guarda
// capturas en tests/screens/<proyecto>/ para revisarlas a ojo. Además
// comprueba lo básico: nada se sale de la pantalla en horizontal.

const WORDS = [1, 2, 4]; // 家 (1 carácter), 认识 (2), 知道 (2, frases largas)

test("tarjeta: anverso y reverso", async ({ page }, testInfo) => {
  const dir = `tests/screens/${testInfo.project.name}`;
  await page.goto("/es/present");
  await page.locator(".transform-3d").waitFor();

  for (const n of WORDS) {
    await page.getByRole("combobox").selectOption({ index: n - 1 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${dir}/${n}-anverso.png` });

    await page.keyboard.press("Space");
    await page.waitForTimeout(700);
    // El estado editorial no se enseña en clase (solo en el admin).
    await expect(page.getByText("Sin curar")).toHaveCount(0);
    await page.screenshot({ path: `${dir}/${n}-reverso.png` });

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `scroll horizontal en la palabra ${n}`).toBeLessThanOrEqual(1);
    await page.keyboard.press("Space");
  }
});

test("reverso: cabecera fija, frase maestra y traducción en español e inglés", async ({ page }, testInfo) => {
  const phone = testInfo.project.name.startsWith("phone");
  await page.goto("/es/present");
  await page.locator(".transform-3d").waitFor();
  // Elegir antes de que la página se hidrate pierde el cambio.
  await page.waitForLoadState("networkidle");
  await page.getByRole("combobox").selectOption({ index: 3 }); // 知道: frases largas
  await page.keyboard.press("Space");
  await page.waitForTimeout(700);

  await expect(page.getByText("Frase maestra", { exact: true })).toBeVisible();
  if (!phone) {
    const header = page.getByTestId("card-word-header");
    const before = await header.boundingBox();
    await page.getByTestId("card-examples").evaluate((el) => { el.scrollTop = el.scrollHeight; });
    const after = await header.boundingBox();
    expect(after?.y).toBe(before?.y);
  }
  await page.screenshot({ path: `tests/screens/${testInfo.project.name}/reverso-abajo.png` });

  // La traducción muestra español e inglés, en todos los tamaños (2026-10-20:
  // a veces se entiende mejor en inglés).
  await page.keyboard.press("t");
  const first = page.locator(".transform-3d ol > li").first();
  await expect(first.locator("p.text-muted-foreground").last()).toBeVisible();
});

test("cómo se forma: piezas con su pinyin, sin glosas", async ({ page }, testInfo) => {
  await page.goto("/es/present");
  await page.locator(".transform-3d").waitFor();
  // Elegir antes de que la página se hidrate pierde el cambio.
  await page.waitForLoadState("networkidle");
  const section = page.getByRole("region", { name: "Cómo se forma" });

  await page.getByRole("combobox").selectOption({ index: 3 }); // 知道 = 矢 + 口 · 辶 + 首
  await page.keyboard.press("Space");
  await page.waitForTimeout(700);
  for (const text of ["矢", "shǐ", "口", "kǒu", "首", "shǒu"]) await expect(section.getByText(text, { exact: true })).toBeVisible();
  await expect(section.getByText("boca")).toHaveCount(0);
  await expect(section.getByText(/sonido/)).toHaveCount(0);
  await page.screenshot({ path: `tests/screens/${testInfo.project.name}/composicion.png` });

  // 觉得: 得 = 彳 + ⿱旦寸 en los datos; se aplana en 彳 + 旦 + 寸.
  await page.keyboard.press("Space");
  await page.getByRole("combobox").selectOption({ index: 6 });
  await page.keyboard.press("Space");
  await page.waitForTimeout(700);
  for (const text of ["彳", "旦", "寸"]) await expect(section.getByText(text, { exact: true })).toBeVisible();
  await expect(section.getByText(/⿱/)).toHaveCount(0);
});

test("reverso: solo un detalle queda abierto", async ({ page }) => {
  await page.goto("/es/present");
  await page.locator(".transform-3d").waitFor();
  await page.waitForLoadState("networkidle");
  await page.keyboard.press("Space");

  const nuance = page.getByRole("button", { name: "Matiz", exact: true });
  const culture = page.getByRole("button", { name: "Nota cultural", exact: true });
  await nuance.click();
  await expect(nuance).toHaveAttribute("aria-expanded", "true");
  await culture.click();
  await expect(nuance).toHaveAttribute("aria-expanded", "false");
  await expect(culture).toHaveAttribute("aria-expanded", "true");
});

test("la barra se oculta con el ratón inactivo y el teclado la recupera", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.startsWith("phone"));
  await page.goto("/es/present");
  const controls = page.getByRole("navigation");
  await expect(controls).toHaveClass(/opacity-0/, { timeout: 5_000 });
  await page.keyboard.press("Space");
  await expect(controls).not.toHaveClass(/opacity-0/);
});

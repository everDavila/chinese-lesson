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

test("reverso: barra compacta al bajar y traducción en español e inglés", async ({ page }, testInfo) => {
  const phone = testInfo.project.name.startsWith("phone");
  await page.goto("/es/present");
  await page.locator(".transform-3d").waitFor();
  // Elegir antes de que la página se hidrate pierde el cambio.
  await page.waitForLoadState("networkidle");
  await page.getByRole("combobox").selectOption({ index: 3 }); // 知道: frases largas
  await page.keyboard.press("Space");
  await page.waitForTimeout(700);

  const bar = page.getByTestId("card-compact-header");
  await expect(bar).toHaveAttribute("aria-hidden", "true");
  // Baja hasta el final del reverso: la cabecera grande sale de vista.
  // Si el reverso cabe entero (pantallas grandes), no hay nada que bajar y la
  // barra no debe aparecer.
  const scrolled = await bar.evaluate((el) => {
    // La barra y la zona que se desplaza son hermanas; la cabecera grande es
    // lo primero de esa zona.
    const scroller = el.parentElement!.querySelector(".overflow-y-auto")!;
    scroller.scrollTop = scroller.scrollHeight;
    const header = scroller.querySelector("header")!;
    return scroller.scrollTop > header.offsetTop + header.offsetHeight;
  });
  await expect(bar).toHaveAttribute("aria-hidden", scrolled ? "false" : "true");
  await page.waitForTimeout(300); // fin de la transición de opacidad
  if (phone) expect(scrolled, "en celular el reverso de 知道 se desplaza").toBe(true);
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

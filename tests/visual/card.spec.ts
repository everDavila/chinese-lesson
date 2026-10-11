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

test("reverso: barra compacta al bajar y segundo idioma plegado en celular", async ({ page }, testInfo) => {
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

  // La traducción inglesa de apoyo (tras " · ") solo se ve desde sm.
  await page.keyboard.press("t");
  const support = page.locator("li span.text-muted-foreground", { hasText: /^ · / }).first();
  if (phone) await expect(support).toBeHidden();
  else await expect(support).toBeVisible();
});

test("cómo se forma: el detalle de cada parte sale al pasar el cursor o tocar", async ({ page }, testInfo) => {
  const phone = testInfo.project.name.startsWith("phone");
  await page.goto("/es/present");
  await page.locator(".transform-3d").waitFor();
  // Elegir antes de que la página se hidrate pierde el cambio.
  await page.waitForLoadState("networkidle");
  await page.getByRole("combobox").selectOption({ index: 3 }); // 知道 = 矢 + 口 · 辶 + 首
  await page.keyboard.press("Space");
  await page.waitForTimeout(700);

  const part = page.getByRole("button", { name: /^口: / });
  // Dentro de un botón el rol tooltip no se expone: se busca el elemento.
  const tip = part.locator("[role=tooltip]");
  const opacity = () => tip.evaluate((el) => getComputedStyle(el).opacity);
  expect(await opacity()).toBe("0");
  if (phone) await part.tap();
  else await part.hover();
  await expect.poll(opacity).toBe("1");
  await expect(tip).toHaveText("boca");
  await page.screenshot({ path: `tests/screens/${testInfo.project.name}/composicion-detalle.png` });
});

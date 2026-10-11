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
    await expect(page.getByText("Sin curar").first()).toBeVisible();
    await page.screenshot({ path: `${dir}/${n}-reverso.png` });

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `scroll horizontal en la palabra ${n}`).toBeLessThanOrEqual(1);
    await page.keyboard.press("Space");
  }
});

import { expect, test, type Locator, type Page } from "@playwright/test";

// Accesibilidad medida, no estimada (auditoría UX/UI 2026-10-12): foco de
// teclado visible en los botones hechos a mano y contraste WCAG del rojo de
// la palabra clave, en claro y oscuro (lo deciden los proyectos).

async function expectFocusRing(page: Page, target: Locator, label: string) {
  // Chrome muestra :focus-visible si la última interacción fue de teclado.
  await page.keyboard.press("Shift");
  await target.focus();
  const style = await target.evaluate((el) => {
    const cs = getComputedStyle(el);
    return { visible: el.matches(":focus-visible"), style: cs.outlineStyle, width: parseFloat(cs.outlineWidth) };
  });
  expect(style.visible, `${label}: con foco de teclado`).toBe(true);
  expect(style.style, `${label}: contorno de foco`).not.toBe("none");
  expect(style.width, `${label}: grosor del contorno`).toBeGreaterThanOrEqual(2);
}

test("foco de teclado visible en los botones hechos a mano", async ({ page }) => {
  await page.goto("/es/present");
  await page.locator(".transform-3d").waitFor();
  await page.waitForLoadState("networkidle");
  await page.keyboard.press("Space");
  await page.waitForTimeout(700);
  await expectFocusRing(page, page.getByRole("radio").first(), "valoración de la profesora");
  await expectFocusRing(page, page.locator(".transform-3d ol > li button[aria-expanded]").first(), "botón de la frase");

  await page.goto("/es/v");
  await page.getByRole("textbox").fill("ABC234");
  await expectFocusRing(page, page.getByRole("button").filter({ hasText: /Entrar/ }), "entrar con el código (alumno)");
});

test("contraste WCAG del rojo de la palabra clave", async ({ page }, testInfo) => {
  await page.goto("/es/present");
  await page.locator(".transform-3d").waitFor();
  await page.waitForLoadState("networkidle");
  await page.getByRole("combobox").selectOption({ index: 3 }); // 知道: matiz y nota con la palabra
  await page.keyboard.press("Space");
  await page.waitForTimeout(700);
  // Matiz y nota cultural: la palabra clave en texto de tamaño normal.
  await page.getByRole("button", { name: "Más detalles de la palabra" }).click();

  const results = await page.locator(".text-keyword, .text-keyword-text").evaluateAll((els) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    // Cualquier color CSS (oklch, con alfa) → sRGB, pintado sobre lo de abajo.
    const paint = (color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      return Array.from(ctx.getImageData(0, 0, 1, 1).data.slice(0, 3));
    };
    const lum = ([r, g, b]: number[]) => {
      const c = [r, g, b].map((v) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    };
    return els
      .filter((el) => el.getBoundingClientRect().width > 0)
      .map((el) => {
        // Fondo efectivo: los fondos de los ancestros, del más externo al más interno.
        const bgs: string[] = [];
        for (let p: Element | null = el; p; p = p.parentElement) bgs.unshift(getComputedStyle(p).backgroundColor);
        ctx.clearRect(0, 0, 1, 1);
        paint(getComputedStyle(document.documentElement).backgroundColor || "white");
        let bg = paint(getComputedStyle(document.body).backgroundColor);
        for (const c of bgs) bg = paint(c);
        const fg = paint(getComputedStyle(el).color);
        const [l1, l2] = [lum(fg), lum(bg)].sort((a, b) => b - a);
        const cs = getComputedStyle(el);
        const size = parseFloat(cs.fontSize);
        const large = size >= 24 || (size >= 18.66 && Number(cs.fontWeight) >= 700);
        return { text: el.textContent, size, ratio: Math.round(((l1 + 0.05) / (l2 + 0.05)) * 100) / 100, min: large ? 3 : 4.5 };
      });
  });

  expect(results.length, "hay palabras clave a la vista").toBeGreaterThan(0);
  expect(results.some((r) => r.min === 4.5), "se mide también en texto de tamaño normal").toBe(true);
  for (const r of results) {
    expect(r.ratio, `${testInfo.project.name}: "${r.text}" a ${r.size}px necesita ${r.min}:1`).toBeGreaterThanOrEqual(r.min);
  }
});

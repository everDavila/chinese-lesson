import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

// Barrido de la tarjeta de TODAS las palabras del catálogo (vista previa del
// admin), para cuando entra contenido en masa: descomposiciones largas, notas
// culturales, frases largas. Solo corre a pedido:
//   HANZI_BARRIDO=<lista.json> PLAYWRIGHT_PORT=3001 npx playwright test tests/barrido --project=phone-light
// con la lista de hanzi en un JSON y la sesión de admin de tests/.auth-dev.

const list = process.env.HANZI_BARRIDO;
const words: string[] = list ? JSON.parse(readFileSync(list, "utf8")) : [];
const CHUNKS = 8;

test.use({ storageState: "tests/.auth-dev/admin.json" });

for (let c = 0; c < CHUNKS; c++) {
  test(`barrido ${c + 1}/${CHUNKS}`, async ({ page }) => {
    test.skip(!list, "solo a pedido (HANZI_BARRIDO)");
    test.setTimeout(30 * 60_000);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const problems: string[] = [];
    let composed = 0;

    for (const hanzi of words.filter((_, i) => i % CHUNKS === c)) {
      const res = await page.goto(`/es/admin/words/${encodeURIComponent(hanzi)}/preview`);
      if (res?.status() === 404) continue; // palabra sin frases: no se presenta
      const card = page.locator(".transform-3d");
      if (!(await card.isVisible({ timeout: 15_000 }).catch(() => false))) {
        problems.push(`${hanzi}: no carga la tarjeta`);
        continue;
      }
      await page.waitForLoadState("networkidle");
      await page.keyboard.press("Space");
      await page.waitForTimeout(500);

      const r = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const page = document.documentElement.scrollWidth - vw;
        // Algo más ancho que su caja dentro de la tarjeta (no se ve como scroll
        // de la página): se nombra el elemento que se sale.
        const scroller = [...document.querySelectorAll<HTMLElement>(".overflow-y-auto")].find(
          (el) => el.scrollWidth - el.clientWidth > 1,
        );
        let inner = "";
        if (scroller) {
          const edge = scroller.getBoundingClientRect().right;
          const culprit = [...scroller.querySelectorAll<HTMLElement>("*")].find((el) => el.getBoundingClientRect().right > edge + 1);
          inner = `${scroller.scrollWidth - scroller.clientWidth}px, ${culprit?.tagName.toLowerCase()} «${culprit?.textContent?.slice(0, 40)}»`;
        }
        // Solo la composición: en las frases, "？" es un signo de interrogación.
        const section = document.querySelector('section[aria-label="Cómo se forma"]');
        return { page, inner, composed: !!section, brokenFormula: !!section?.textContent?.includes("？") };
      });
      if (r.page > 1) problems.push(`${hanzi}: scroll horizontal de ${r.page}px`);
      if (r.inner) problems.push(`${hanzi}: se sale de la tarjeta (${r.inner})`);
      if (r.brokenFormula) problems.push(`${hanzi}: fórmula con "？"`);
      if (r.composed) composed++;
      if (errors.length) problems.push(`${hanzi}: ${errors.splice(0).join(" | ")}`);
    }

    console.log(`[barrido ${c + 1}] con "Cómo se forma": ${composed}`);
    expect(problems, problems.join("\n")).toEqual([]);
  });
}

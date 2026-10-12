import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { expect, test, type Page } from "@playwright/test";
import es from "../../messages/es.json";
import zh from "../../messages/zh.json";

// Recorridos con sesión real: la profesora (en chino) copia una plantilla,
// escribe y sugiere una frase, hace una copia editada de una original y
// presenta; el admin revisa la base, el editor, la vista previa y rechaza
// la sugerencia. Escribe en la base de Supabase de verdad, así que todo lo
// que crea lleva una marca y se borra al empezar y al terminar.
//
// Sesiones: npm run test:sesion -- admin / laoshi (la clave la escribe la
// persona). Ejecutar: npm run test:recorridos

// Producción o desarrollo: lo decide playwright.config.ts según el proyecto.
const AUTH = process.env.HANZI_AUTH_DIR ?? "tests/.auth";
const ADMIN = `${AUTH}/admin.json`;
const LAOSHI = `${AUTH}/laoshi.json`;
const MARK = "Prueba automática";
const OWN = "我爱自动测试。";
const COPY = "我爱自动测试的副本。";
const Z = zh.Manage;
const SHOTS = "tests/screens/recorridos";

test.skip(!existsSync(ADMIN) || !existsSync(LAOSHI), "Faltan las sesiones: npm run test:sesion -- admin / laoshi");
test.describe.configure({ mode: "serial" });

// Limpieza con la clave de servicio (solo en este proceso, nunca se imprime).
function admin() {
  const env = Object.fromEntries(
    readFileSync(process.env.HANZI_ENV_FILE ?? ".env.local", "utf8")
      .split(/\r?\n/)
      .filter((l) => l && !l.startsWith("#") && l.includes("="))
      .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim().replace(/^"|"$/g, "")]),
  );
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
}
async function cleanup() {
  const db = admin();
  // Borrar la colección arrastra sus lecciones, ítems, sesiones y valoraciones.
  const c = await db.from("collections").delete().like("title", `${MARK}%`);
  const e = await db.from("teacher_examples").delete().like("zh", "%自动测试%");
  if (c.error || e.error) throw new Error(`Limpieza: ${c.error?.message ?? e.error?.message}`);
}
test.beforeAll(cleanup);
test.afterAll(cleanup);

/**
 * Supabase renueva el token cada hora e invalida el anterior: si el archivo
 * de sesión se queda con el viejo, la siguiente corrida entra sin sesión
 * (refresh_token_not_found). Tras cada paso se guarda la sesión renovada.
 */
function keepSession(path: string) {
  return async ({ context }: { context: import("@playwright/test").BrowserContext }) => {
    await context.storageState({ path });
  };
}

/** Captura en escritorio y en celular, y comprueba que no haya scroll horizontal. */
async function shoot(page: Page, name: string) {
  await page.screenshot({ path: `${SHOTS}/${name}-escritorio.png`, fullPage: true });
  const size = page.viewportSize()!;
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${SHOTS}/${name}-celular.png`, fullPage: true });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, `scroll horizontal en ${name} (celular)`).toBeLessThanOrEqual(1);
  await page.setViewportSize(size);
}

/** Ningún texto de la interfaz debe quedar como clave sin traducir. */
async function noMissingKeys(page: Page) {
  await expect(page.getByText(/\bManage\.[a-zA-Z.]+/)).toHaveCount(0);
}

let lessonUrl = "";
let examplesUrl = "";

test.describe("profesora", () => {
  test.use({ storageState: LAOSHI });
  test.afterEach(keepSession(LAOSHI));

  test("copia la plantilla HSK 1 y la renombra", async ({ page }) => {
    // El inicio lleva a la docente a sus colecciones.
    await page.goto("/zh");
    await page.waitForURL(/\/zh\/collections$/);
    await expect(page.getByRole("heading", { level: 1, name: Z.nav.collections })).toBeVisible();
    await noMissingKeys(page);
    await shoot(page, "1-colecciones");

    const hsk1 = page.getByRole("listitem").filter({ hasText: "HSK 1" }).filter({ has: page.getByRole("button", { name: Z.useTemplate }) });
    await hsk1.getByRole("button", { name: Z.useTemplate }).click();
    await page.waitForURL(/\/zh\/collections\/[0-9a-f-]{36}$/);

    await page.getByRole("button", { name: Z.rename }).click();
    await page.getByRole("textbox", { name: Z.newName }).fill(`${MARK} ${Date.now()}`);
    await page.getByRole("button", { name: Z.save }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(MARK);
    await expect(page.getByText(Z.copyNote)).toBeVisible();
    await shoot(page, "2-coleccion");

    await page.getByRole("link", { name: "HSK 1 · 1", exact: true }).click();
    await page.waitForURL(/\/zh\/collections\/[0-9a-f-]{36}\/[0-9a-f-]{36}$/);
    lessonUrl = page.url();
    await expect(page.getByRole("heading", { level: 2, name: new RegExp(`${Z.words}.*15`) })).toBeVisible();
    await noMissingKeys(page);
    await shoot(page, "3-leccion");
  });

  test("escribe una frase, la sugiere y hace una copia editada", async ({ page }) => {
    await page.goto(lessonUrl);
    const ai = page.getByRole("listitem").filter({ has: page.locator("span.font-hanzi", { hasText: /^爱$/ }) });
    await ai.getByRole("link").first().click();
    await page.waitForURL(/\/[0-9a-f-]{36}\/[0-9a-f-]{36}\/[0-9a-f-]{36}$/);
    examplesUrl = page.url();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("爱");
    await noMissingKeys(page);

    // Frase propia.
    await page.getByRole("button", { name: Z.newSentence }).click();
    await page.getByRole("textbox", { name: Z.fieldZh }).fill(OWN);
    await page.getByRole("textbox", { name: Z.fieldPinyin }).fill("Wǒ ài zìdòng cèshì.");
    await page.getByRole("textbox", { name: Z.fieldEn }).fill("I love automated tests.");
    await page.getByRole("button", { name: Z.save }).click();
    const own = page.getByRole("listitem").filter({ hasText: OWN });
    await expect(own.getByText(Z.exampleStatus.draft)).toBeVisible();

    await own.getByRole("button", { name: Z.suggest }).click();
    await expect(own.getByText(Z.exampleStatus.submitted)).toBeVisible();

    // Ocultar y volver a mostrar la primera original (deja todo como estaba).
    const original = page.getByRole("listitem").filter({ has: page.getByRole("button", { name: Z.editCopy }) }).first();
    await original.getByRole("button", { name: Z.hide }).click();
    await expect(original.getByText(Z.hiddenBadge)).toBeVisible();
    await original.getByRole("button", { name: Z.show }).click();
    await expect(original.getByText(Z.hiddenBadge)).toHaveCount(0);

    // Copia editada de esa original: en sus clases sale en su lugar.
    await original.getByRole("button", { name: Z.editCopy }).click();
    await page.getByRole("textbox", { name: Z.fieldZh }).fill(COPY);
    // Cambió el chino y no el pinyin: avisa, pero deja guardar.
    await expect(page.getByRole("status").filter({ hasText: Z.fieldPinyin })).toBeVisible();
    await page.getByRole("button", { name: Z.save }).click();
    await expect(page.getByText(Z.replacedBy)).toBeVisible();
    await expect(page.getByRole("listitem").filter({ hasText: COPY })).toBeVisible();
    await shoot(page, "4-frases");
  });

  test("presenta la lección con sus frases", async ({ page }) => {
    await page.goto(lessonUrl);
    await page.getByRole("button", { name: new RegExp(Z.present.replace(/（\{count\}）/, "")) }).click();
    await page.waitForURL(/\/present\/session\//);
    await page.locator(".transform-3d").waitFor();
    // 爱 es la primera palabra de la lección: en el reverso salen sus frases.
    await page.keyboard.press("Space");
    await expect(page.getByText(COPY)).toBeVisible();
    await expect(page.getByText(OWN)).toBeVisible();
    await page.screenshot({ path: `${SHOTS}/5-clase.png` });

    // La misma clase en un celular: anverso, reverso y la valoración al final.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.keyboard.press("Space");
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SHOTS}/5-clase-celular-anverso.png` });
    await page.keyboard.press("Space");
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${SHOTS}/5-clase-celular-reverso.png` });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, "scroll horizontal en la clase (celular)").toBeLessThanOrEqual(1);
    // Valoración en 2×2 con botones de al menos 44 px (auditoría UX, P0).
    const radios = page.getByRole("radiogroup").getByRole("radio");
    await radios.first().scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${SHOTS}/5-clase-celular-valoracion.png` });
    const boxes = await radios.evaluateAll((els) => els.map((e) => e.getBoundingClientRect()).map((r) => ({ x: Math.round(r.x), y: Math.round(r.y), h: r.height })));
    expect(boxes).toHaveLength(4);
    for (const b of boxes) expect(b.h, "alto del botón de valoración").toBeGreaterThanOrEqual(44);
    expect(new Set(boxes.map((b) => b.y)).size, "dos filas").toBe(2);
    expect(new Set(boxes.map((b) => b.x)).size, "dos columnas").toBe(2);
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.getByRole("button", { name: zh.Controls.endClass }).click();
    await page.waitForURL(/\/collections$/);
  });
});

test.describe("admin", () => {
  test.use({ storageState: ADMIN });
  test.afterEach(keepSession(ADMIN));

  test("base común, editor, vista previa y plantillas", async ({ page }) => {
    // El inicio lleva al admin directo a la base común.
    await page.goto("/es");
    await page.waitForURL(/\/es\/admin$/);
    await expect(page.getByRole("heading", { level: 1, name: "Base común" })).toBeVisible();
    await page.getByRole("textbox", { name: "Buscar en la base" }).fill("爱");
    await expect(page.getByRole("link", { name: "爱", exact: true })).toBeVisible();
    await shoot(page, "6-admin");

    // Solo se mira: no se guarda nada (Codex puede estar llenando la base).
    await page.goto(`/es/admin/words/${encodeURIComponent("爱")}`);
    await expect(page.getByRole("heading", { level: 2, name: "Sentido 1" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Guardar" })).toBeDisabled();
    await shoot(page, "7-editor");

    await page.goto(`/es/admin/words/${encodeURIComponent("爱")}/preview`);
    await page.locator(".transform-3d").waitFor();
    // La vista previa muestra la base: la copia de la profesora no sale.
    await page.keyboard.press("Space");
    await expect(page.getByText(COPY)).toHaveCount(0);

    await page.goto("/es/admin/templates");
    for (const t of ["HSK 1", "HSK 2", "HSK 3"]) await expect(page.getByRole("link", { name: t, exact: true })).toBeVisible();
    await expect(page.getByText(es.Manage.nav.admin).first()).toBeVisible();
  });

  test("rechaza la sugerencia con una nota", async ({ page }) => {
    await page.goto("/es/admin/suggestions");
    const item = page.getByRole("listitem").filter({ hasText: OWN });
    await expect(item).toBeVisible();
    await shoot(page, "8-sugerencias");
    await item.getByRole("button", { name: "Rechazar" }).click();
    await item.getByRole("textbox", { name: "Motivo del rechazo" }).fill(MARK);
    await item.getByRole("button", { name: "Rechazar" }).click();
    await expect(page.getByRole("listitem").filter({ hasText: OWN })).toHaveCount(0);
  });
});

test.describe("profesora tras la revisión", () => {
  test.use({ storageState: LAOSHI });
  test.afterEach(keepSession(LAOSHI));

  test("ve la frase rechazada con la nota y sigue siendo suya", async ({ page }) => {
    await page.goto(examplesUrl);
    const own = page.getByRole("listitem").filter({ hasText: OWN });
    await expect(own.getByText(Z.exampleStatus.rejected)).toBeVisible();
    await expect(own.getByText(MARK)).toBeVisible();
    await expect(own.getByRole("button", { name: Z.suggest })).toBeVisible();
  });
});

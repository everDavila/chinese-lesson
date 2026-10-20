import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { expect as baseExpect, test, type Page } from "@playwright/test";
import es from "../../messages/es.json";
import zh from "../../messages/zh.json";

// Contra un servidor local, cada página va y vuelve hasta São Paulo: el editor
// de lección tarda ~5 s en cargar (en producción, Vercel está junto a la base).
const expect = baseExpect.configure({ timeout: 15_000 });
test.describe.configure({ timeout: 120_000 });

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
const H = zh.HskLibrary;
const TL = zh.TeacherLessons;
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
  // Las lecciones sueltas (sin colección) no caen con la colección.
  const l = await db.from("lessons").delete().like("title", `${MARK}%`);
  const e = await db.from("teacher_examples").delete().like("zh", "%自动测试%");
  if (c.error || l.error || e.error) throw new Error(`Limpieza: ${c.error?.message ?? l.error?.message ?? e.error?.message}`);
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
let collectionUrl = "";
let examplesUrl = "";

test.describe("profesora", () => {
  test.use({ storageState: LAOSHI });
  test.afterEach(keepSession(LAOSHI));

  test("copia la plantilla HSK 1 y la renombra", async ({ page }) => {
    // El inicio separa el trabajo propio de la biblioteca original.
    await page.goto("/zh");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(zh.TeacherHome.homeTitle);
    await page.getByRole("link", { name: zh.TeacherWorkspace.hsk }).click();
    await page.waitForURL(/\/zh\/library\/hsk$/);
    await expect(page.getByRole("heading", { level: 1, name: H.title })).toBeVisible();
    await noMissingKeys(page);
    await shoot(page, "1-biblioteca-hsk");

    // El nivel se consulta completo (sin lecciones de 15); copiar la plantilla
    // en lecciones sigue disponible mientras no se creen lecciones desde aquí.
    const hsk1 = page.getByRole("listitem").filter({ hasText: /^HSK 1/ });
    await hsk1.getByRole("link", { name: new RegExp(H.viewVocabulary) }).click();
    await page.waitForURL(/\/zh\/library\/hsk\/nivel\/1$/);
    await expect(page.getByTestId("catalog-row")).toHaveCount(25);
    await page.getByRole("button", { name: H.copyTemplate.replace("{level}", "1") }).click();
    await page.waitForURL(/\/zh\/collections\/[0-9a-f-]{36}$/);

    await page.getByRole("button", { name: Z.rename }).click();
    await page.getByRole("textbox", { name: Z.newName }).fill(`${MARK} ${Date.now()}`);
    await page.getByRole("button", { name: Z.save }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(MARK);
    collectionUrl = page.url();
    await expect(page.getByText(Z.copyNote)).toBeVisible();
    await shoot(page, "2-coleccion");

    await page.getByRole("link", { name: "HSK 1 · 1", exact: true }).click();
    await page.waitForURL(/\/zh\/collections\/[0-9a-f-]{36}\/[0-9a-f-]{36}$/);
    lessonUrl = page.url();
    await expect(page.getByRole("heading", { level: 2, name: new RegExp(`${Z.words}.*15`) })).toBeVisible();
    await noMissingKeys(page);
    await shoot(page, "3-leccion");

    // Buscar y pegar consultan a la base (el catálogo no viaja entero).
    await page.getByRole("textbox", { name: Z.search }).fill("renshi");
    await expect(page.getByRole("checkbox", { name: Z.selectHanzi.replace("{hanzi}", "认识"), exact: true })).toBeVisible();
    await page.getByRole("tab", { name: Z.paste }).click();
    await page.getByRole("textbox", { name: Z.paste }).fill("你 好 龘");
    await expect(page.getByRole("button", { name: Z.addN.replace("{count}", "2") })).toBeVisible();
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
    // Todas las frases (la colección copiada trae 2 por palabra por defecto).
    await page.getByLabel(Z.examplesPerWord).selectOption("0");
    await expect(page.getByLabel(Z.examplesPerWord)).toHaveValue("0");
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
    // Terminar la clase vuelve al inicio docente.
    await page.waitForURL((u) => !u.pathname.includes("/present"));
  });

  test("con 1 frase por palabra, dos clases seguidas muestran frases distintas", async ({ page }) => {
    await page.goto(lessonUrl);
    await page.getByLabel(Z.examplesPerWord).selectOption("1");
    await expect(page.getByLabel(Z.examplesPerWord)).toHaveValue("1");

    // Da una clase y devuelve las frases de 爱 (primera palabra) en el reverso.
    const giveClass = async () => {
      await page.goto(lessonUrl);
      await page.getByRole("button", { name: new RegExp(Z.present.replace(/（\{count\}）/, "")) }).click();
      await page.waitForURL(/\/present\/session\//);
      await page.locator(".transform-3d").waitFor();
      await page.keyboard.press("Space");
      await page.waitForTimeout(700);
      // El chino de cada frase (desde ayudas-frase-notas ya no es un botón).
      const shown = (await page.locator(".transform-3d ol > li p[lang=\"zh-Hans\"]").allInnerTexts()).map((t) => t.trim());
      await page.getByRole("button", { name: zh.Controls.endClass }).click();
      await page.waitForURL((u) => !u.pathname.includes("/present"));
      return shown;
    };
    const first = await giveClass();
    const second = await giveClass();
    expect(first, "1 frase por palabra").toHaveLength(1);
    expect(second, "1 frase por palabra").toHaveLength(1);
    expect(second[0], "la segunda clase no repite la frase de la primera").not.toBe(first[0]);
  });
});

test.describe("votación de alumnos", () => {
  test.use({ storageState: LAOSHI });

  test("la profesora abre la votación y un alumno anónimo vota", async ({ page, browser }) => {
    // Hasta aplicar la migración 20261012010000, la base no tiene las funciones.
    const probe = await admin().rpc("student_vote_state", { code: "ZZZZZZ" });
    test.skip(Boolean(probe.error), "Falta aplicar la migración de votación en esta base");

    await page.goto(lessonUrl);
    await page.getByRole("button", { name: new RegExp(Z.present.replace(/（\{count\}）/, "")) }).click();
    await page.waitForURL(/\/present\/session\//);
    await page.locator(".transform-3d").waitFor();
    await page.keyboard.press("Space");
    await page.keyboard.press("v");
    const code = (await page.getByTestId("join-code").textContent())!.trim();
    expect(code).toMatch(/^[A-Z2-9]{6}$/);

    // Un alumno: otro navegador, sin sesión ni cookies.
    const student = await browser.newContext({ storageState: { cookies: [], origins: [] }, viewport: { width: 390, height: 844 } });
    const phone = await student.newPage();
    await phone.goto(`/es/v/${code}`);
    await expect(phone.getByText("爱").first()).toBeVisible();
    await phone.getByRole("radio", { name: es.Vote.ratings[2] }).click();
    await expect(phone.getByText(es.Vote.saved)).toBeVisible();
    await phone.screenshot({ path: `${SHOTS}/9-alumno-vota.png` });
    // Cambiar el voto no suma otro.
    await phone.getByRole("radio", { name: es.Vote.ratings[3] }).click();
    await expect(phone.getByRole("radio", { name: es.Vote.ratings[3] })).toHaveAttribute("aria-checked", "true");

    await expect(page.getByTestId("votes-total")).toHaveText(/^1 /, { timeout: 10_000 });
    await page.screenshot({ path: `${SHOTS}/9-profesora-ve-votos.png` });

    // La votación sigue a la tarjeta: la profesora pasa de palabra y el
    // celular cambia solo; al volver, la ronda se reabre con sus votos.
    const second = (await page.locator("nav select option").nth(1).textContent())!.split("·")[1].trim();
    await page.keyboard.press("ArrowRight");
    await expect(phone.getByText(second, { exact: true }).first()).toBeVisible({ timeout: 10_000 });
    await expect(phone.getByRole("radio").first()).toBeVisible();
    await phone.screenshot({ path: `${SHOTS}/9-alumno-siguiente-palabra.png` });
    await page.keyboard.press("ArrowLeft");
    await expect(phone.getByText("爱").first()).toBeVisible({ timeout: 10_000 });
    // En clase en vivo, cambiar de palabra vuelve al anverso (por defecto).
    await page.keyboard.press("Space");
    await expect(page.getByTestId("votes-total")).toHaveText(/^1 /, { timeout: 10_000 });

    // Pausada la votación, el alumno vuelve a esperar.
    await page.keyboard.press("v");
    await expect(phone.getByText(es.Vote.waiting)).toBeVisible({ timeout: 10_000 });
    await student.close();
    await page.getByRole("button", { name: zh.Controls.endClass }).click();
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

  test("crea una lección sin colección y la mueve entre colecciones", async ({ page }) => {
    const title = `${MARK} suelta ${Date.now()}`;
    const collectionId = collectionUrl.match(/collections\/([0-9a-f-]{36})/)![1];
    // Crear desde Mis lecciones, sin colección.
    await page.goto("/zh/lessons");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: TL.newLesson }).click();
    await page.getByRole("textbox", { name: TL.newLessonName }).fill(title);
    await page.getByRole("button", { name: Z.create, exact: true }).click();
    await page.waitForURL(/\/zh\/lessons\/[0-9a-f-]{36}$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(title);
    // Marcar en dos búsquedas distintas y añadir las dos de golpe.
    const pick = (hanzi: string) => page.getByRole("checkbox", { name: Z.selectHanzi.replace("{hanzi}", hanzi), exact: true });
    await page.getByRole("textbox", { name: Z.search }).fill("renshi");
    await pick("认识").click();
    await page.getByRole("textbox", { name: Z.search }).fill("pengyou");
    await pick("朋友").click();
    await page.getByRole("button", { name: Z.addN.replace("{count}", "2") }).click();
    await expect(page.getByRole("heading", { level: 2, name: new RegExp(`${Z.words}.*2`) })).toBeVisible();
    await shoot(page, "11-leccion-suelta");

    // Quitar en bloque desde la lista de la lección, con confirmación.
    await page.locator("ol").getByRole("checkbox", { name: Z.selectHanzi.replace("{hanzi}", "朋友"), exact: true }).click();
    await shoot(page, "11-quitar-seleccion");
    await page.getByRole("button", { name: Z.removeN.replace("{count}", "1") }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: Z.removeN.replace("{count}", "1") }).click();
    await expect(page.getByRole("heading", { level: 2, name: new RegExp(`${Z.words}.*1`) })).toBeVisible();

    // Mover desde el editor a la colección de prueba: cambia la dirección.
    await page.getByRole("combobox", { name: Z.moveToLabel }).selectOption(collectionId);
    await page.waitForURL((u) => u.pathname.startsWith(`/zh/collections/${collectionId}/`));
    await expect(page.getByRole("heading", { level: 2, name: new RegExp(`${Z.words}.*1`) })).toBeVisible();

    // En la colección aparece; desde su fila vuelve a quedar suelta.
    await page.goto(collectionUrl);
    const row = page.getByRole("listitem").filter({ hasText: title });
    await expect(row).toHaveCount(1);
    await row.getByRole("combobox", { name: Z.moveToLabel }).selectOption("");
    await expect(page.getByRole("listitem").filter({ hasText: title })).toHaveCount(0);

    // En Mis lecciones, entre las sueltas, con su palabra.
    await page.goto("/zh/lessons");
    await expect(page.getByRole("heading", { name: TL.loose })).toBeVisible();
    await expect(page.getByRole("listitem").filter({ hasText: title })).toContainText(TL.words.replace("{count}", "1"));
  });

  test("presenta desde el catálogo una selección y un nivel, sin lección visible", async ({ page }) => {
    const sessions: string[] = [];
    const present = async () => {
      await page.waitForURL(/\/present\/session\/[0-9a-f-]{36}/, { timeout: 60_000 });
      sessions.push(page.url().match(/session\/([0-9a-f-]{36})/)![1]);
      await page.locator(".transform-3d").waitFor();
    };
    const endClass = async () => {
      await page.getByRole("button", { name: zh.Controls.endClass }).click();
      await page.waitForURL((u) => !u.pathname.includes("/present"));
    };
    try {
      // Selección de dos palabras de HSK 2.
      await page.goto("/zh/library/hsk/nivel/2");
      await page.evaluate(() => sessionStorage.clear());
      await page.reload();
      await page.waitForLoadState("networkidle");
      const boxes = page.getByTestId("catalog-row").getByRole("checkbox");
      await boxes.nth(0).click();
      await boxes.nth(1).click();
      await page.getByRole("button", { name: H.presentSelection.replace("{count}", "2") }).click();
      await present();
      await expect(page.locator("nav select option")).toHaveCount(2);
      await shoot(page, "12-presentar-seleccion");
      await endClass();

      // Un nivel completo (HSK 1: 300): pasa de 100, así que pide confirmación.
      await page.goto("/zh/library/hsk/nivel/1");
      await page.waitForLoadState("networkidle");
      await page.getByRole("button", { name: H.presentLevelCount.replace("{count}", "300") }).click();
      await page.getByRole("alertdialog").getByRole("button", { name: H.presentLevel, exact: true }).click();
      await present();
      await expect(page.locator("nav select option")).toHaveCount(300);
      await endClass();

      // Las lecciones rápidas no son material propio: no salen en Mis lecciones.
      await page.goto("/zh/lessons");
      // Su título termina en la fecha ("HSK 1 · 2026-10-17"); las de la colección copiada son "HSK 1 · 1".
      await expect(page.getByRole("listitem").filter({ hasText: /(Selección · \d+|HSK [0-9–]+) · \d{4}-\d{2}-\d{2}/ })).toHaveCount(0);
    } finally {
      // Borra las lecciones rápidas de la prueba (arrastra sus clases).
      if (sessions.length) {
        const db = admin();
        const { data } = await db.from("class_sessions").select("lesson_id").in("id", sessions);
        const ids = (data ?? []).map((s) => s.lesson_id as string);
        if (ids.length) await db.from("lessons").delete().in("id", ids).eq("quick", true);
      }
      await page.evaluate(() => sessionStorage.clear()).catch(() => {});
    }
  });

  test("quita la colección: archivar, restaurar y borrar definitivamente", async ({ page }) => {
    const title = await (async () => {
      await page.goto(collectionUrl);
      return (await page.getByRole("heading", { level: 1 }).innerText()).trim();
    })();
    const dialog = page.getByRole("alertdialog");
    // Quitar abre la elección; cancelar no hace nada.
    await page.getByRole("button", { name: Z.remove, exact: true }).click();
    await expect(dialog).toContainText(MARK);
    await expect(dialog.getByRole("button", { name: Z.archive })).toBeVisible();
    await expect(dialog.getByRole("button", { name: Z.deleteForever })).toBeVisible();
    await page.screenshot({ path: `${SHOTS}/10-quitar.png` });
    await dialog.getByRole("button", { name: Z.cancel }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(MARK);

    // Archivar: sale de Mis colecciones y aparece en Archivadas.
    await page.getByRole("button", { name: Z.remove, exact: true }).click();
    await dialog.getByRole("button", { name: Z.archive }).click();
    await page.waitForURL(/\/collections$/);
    await expect(page.getByRole("main").getByText(title, { exact: true })).toHaveCount(0);
    await page.goto("/zh/archived");
    const archivedRow = page.getByRole("listitem").filter({ hasText: title });
    await expect(archivedRow).toHaveCount(1);
    await shoot(page, "10-archivadas");

    // Restaurar: vuelve a Mis colecciones con sus lecciones.
    await archivedRow.getByRole("button", { name: Z.restore }).click();
    await expect(page.getByRole("listitem").filter({ hasText: title })).toHaveCount(0);
    await page.goto(collectionUrl);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(MARK);
    await expect(page.getByRole("link", { name: "HSK 1 · 1", exact: true })).toBeVisible();

    // Borrar definitivamente: vuelve a la lista y ya no existe.
    await page.getByRole("button", { name: Z.remove, exact: true }).click();
    await dialog.getByRole("button", { name: Z.deleteForever }).click();
    await page.waitForURL(/\/collections$/);
    // Solo en el contenido: el anunciador de rutas de Next (oculto, para
    // lectores de pantalla) repite el título de la página anterior.
    await expect(page.getByRole("heading", { level: 1, name: Z.nav.collections })).toBeVisible();
    await expect(page.getByRole("main").getByText(MARK)).toHaveCount(0);
  });
});

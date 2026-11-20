import { randomBytes } from "node:crypto";
import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "@playwright/test";

// Prueba de Escritura en clase con alumnos simulados (docs/DISENO-ESCRITURA-EN-CLASE.md):
// una profesora y seis alumnos en navegadores distintos escriben la misma
// palabra a la vez con trazos reales. Crea y borra usuarios temporales con la
// clave de servicio, así que SOLO corre contra la base de desarrollo.
// Requiere `npm run dev:base-dev` en marcha. Uso: npm run test:clase:dev [carpeta de capturas]
const BASE = `http://localhost:${process.env.DEV_PORT ?? "3001"}`;
const U = process.env.NEXT_PUBLIC_SUPABASE_URL, SK = process.env.SUPABASE_SECRET_KEY;
if (!U || !SK || U.includes("lkcqvqzbjyuazpwaeiqq")) {
  console.error("Solo contra la base de desarrollo: node --env-file=.env.dev.local tests/scripts/escritura-en-clase.mjs");
  process.exit(1);
}
const OUT = process.argv[2] ?? join(tmpdir(), "renshi-clase");
mkdirSync(OUT, { recursive: true });
const admin = (path, init = {}) => fetch(`${U}${path}`, { ...init, headers: { apikey: SK, Authorization: `Bearer ${SK}`, "content-type": "application/json", ...init.headers } });
const rest = async (path) => (await admin(`/rest/v1${path}`)).json();
const ok = (c, m, extra = "") => { console.log(c ? "✓" : "✗", m, c ? "" : extra); if (!c) process.exitCode = 1; };
const hex = () => randomBytes(4).toString("hex");
const created = [];
const errors = [];

async function makeUser(prefix, role) {
  const email = `${prefix}-${hex()}@example.test`, password = randomBytes(18).toString("hex");
  const u = await (await admin("/auth/v1/admin/users", { method: "POST", body: JSON.stringify({ email, password, email_confirm: true }) })).json();
  created.push(u.id);
  if (role) await admin(`/rest/v1/profiles?id=eq.${u.id}`, { method: "PATCH", body: JSON.stringify({ role }) });
  return { id: u.id, email, password };
}
async function login(page, user) {
  await page.goto(`${BASE}/es/login`);
  await page.fill('input[name="email"]', user.email); await page.fill('input[name="password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.endsWith("/login"), { timeout: 90_000 });
}

// ── Dibujar trazos reales con el ratón, a partir de las líneas medias de Hanzi Writer ──
const dataCache = new Map();
async function strokesOf(char) {
  if (!dataCache.has(char)) dataCache.set(char, await (await fetch(`${BASE}/hanzi-writer/${encodeURIComponent(char)}.json`)).json());
  return dataCache.get(char).medians;
}
function densify(points, n = 7) {
  const out = [];
  for (let i = 0; i < points.length - 1; i++) for (let k = 0; k < n; k++) out.push([points[i][0] + ((points[i + 1][0] - points[i][0]) * k) / n, points[i][1] + ((points[i + 1][1] - points[i][1]) * k) / n]);
  out.push(points[points.length - 1]);
  return out;
}
async function cellBox(page, i, char) {
  const el = page.locator(`[aria-label="Casilla ${i + 1}: ${char}"]`);
  await el.scrollIntoViewIfNeeded();
  return await el.boundingBox();
}
async function drag(page, pts) {
  await page.mouse.move(pts[0][0], pts[0][1]);
  await page.mouse.down();
  for (const [x, y] of pts.slice(1)) await page.mouse.move(x, y);
  await page.mouse.up();
  await page.waitForTimeout(90);
}
async function goodStroke(page, box, median) {
  const size = box.width, P = 12, scale = (size - 2 * P) / 1024, yOff = 124 * scale + P;
  const toScreen = ([x, y]) => [box.x + P + x * scale, box.y + (size - yOff) - y * scale];
  await drag(page, densify(median).map(toScreen));
}
async function wrongStroke(page, box, n = 0) {
  const s = box.width, y = box.y + s * (0.08 + 0.02 * (n % 3));
  await drag(page, [[box.x + s * 0.08, y], [box.x + s * 0.2, y + 4], [box.x + s * 0.3, y + 2]]);
}
async function writeWord(page, chars, { errorsFirst = 0, scribble = false } = {}) {
  for (let ci = 0; ci < chars.length; ci++) {
    const medians = await strokesOf(chars[ci]);
    const box = await cellBox(page, ci, chars[ci]);
    if (scribble) { for (let k = 0; k < 40; k++) await wrongStroke(page, box, k); continue; }
    for (let k = 0; k < medians.length; k++) {
      if (ci === 0 && k === 0) for (let e = 0; e < errorsFirst; e++) await wrongStroke(page, box, e);
      await goodStroke(page, box, medians[k]);
    }
  }
}

let browser;
try {
  // ── Profesora, clase y alumnos ──
  const teacher = await makeUser("profe", "teacher");
  const lessons = await rest(`/lessons?select=id,title&teacher_id=eq.${teacher.id}&limit=1`);
  ok(lessons.length === 1, `la profesora temporal recibió su lección de ejemplo (${lessons[0]?.title})`);
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const code = Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  const [sess] = await (await admin("/rest/v1/class_sessions", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ lesson_id: lessons[0].id, teacher_id: teacher.id, join_code: code, expected_students: 8 }) })).json();
  ok(!!sess?.id, `clase creada (código ${code})`);
  const account = await makeUser("alumna", null);

  browser = await chromium.launch();
  const tctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const tp = await tctx.newPage();
  tp.on("pageerror", (e) => errors.push(`profe pageerror: ${e.message}`));
  tp.on("console", (m) => m.type() === "error" && errors.push(`profe console: ${m.text().slice(0, 900)}`));
  await login(tp, teacher);
  await tp.goto(`${BASE}/es/present/session/${sess.id}`);
  await tp.getByRole("button", { name: /Activar votación/ }).waitFor({ timeout: 90_000 }).catch(async () => {
    await tp.screenshot({ path: `${OUT}/20-profe-fallo.png` });
    console.log("  URL de la profesora:", tp.url());
    throw new Error("no apareció la barra de la clase");
  });
  await tp.screenshot({ path: `${OUT}/20-profe-barra.png` });

  // Modo escribir ANTES de abrir: sin ronda abierta. Se reintenta el clic hasta que la página termina de hidratar.
  let live;
  for (let i = 0; i < 8; i++) {
    await tp.waitForTimeout(1500);
    await tp.getByText("Escritura en clase", { exact: true }).first().click();
    await tp.waitForTimeout(1200);
    live = (await rest(`/class_sessions?select=live_mode&id=eq.${sess.id}`))[0];
    if (live.live_mode === "write") break;
  }
  ok(live.live_mode === "write", "la profesora elige «Escritura en clase» y queda en la clase");
  await tp.keyboard.press("v"); // activa la clase en vivo
  await tp.waitForTimeout(2500);
  const ev1 = (await rest(`/evaluations?select=id,kind,status,write_config,sense_id&session_id=eq.${sess.id}`))[0];
  ok(ev1?.kind === "write" && ev1.status === "open" && ev1.write_config?.perStroke === 3, "la ronda abierta es de escribir y guarda una copia de los límites", JSON.stringify(ev1));
  const word = (await rest(`/senses?select=words(hanzi)&id=eq.${ev1.sense_id}`))[0].words.hanzi;
  const chars = [...word];
  console.log(`  palabra de la ronda: ${word} (${chars.length} caracteres)`);

  // ── Alumnos: cada uno en su propio navegador (cookies distintas) ──
  const mk = async (viewport = { width: 900, height: 900 }, user = null) => {
    const ctx = await browser.newContext({ viewport });
    const page = await ctx.newPage();
    page.on("pageerror", (e) => errors.push(`alumno pageerror: ${e.message}`));
    page.on("console", (m) => m.type() === "error" && errors.push(`alumno console: ${m.text().slice(0, 140)}`));
    if (user) await login(page, user);
    await page.goto(`${BASE}/es/live/${code}`);
    return page;
  };
  const join = async (page, nick) => {
    await page.getByRole("heading", { name: /cómo quieres que te vea/i }).waitFor({ timeout: 90_000 });
    await page.getByLabel("Tu apodo").fill(nick);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await page.getByText("Escribe esta palabra").waitFor({ timeout: 60_000 });
  };
  const names = ["Ana", "ana", "Luis", "Mia", "Juguetón"];
  const pages = [];
  for (let i = 0; i < names.length; i++) pages.push(await mk());
  const pAccount = await mk({ width: 900, height: 900 }, account);
  await Promise.all(pages.map((p, i) => join(p, names[i])));
  await pAccount.getByRole("heading", { name: /cómo quieres que te vea/i }).waitFor({ timeout: 90_000 });
  const accountBtn = pAccount.getByRole("button", { name: /Con mi cuenta/ });
  ok(await accountBtn.isVisible(), "quien tiene cuenta ve la opción «Con mi cuenta» con su nombre");
  await accountBtn.click();
  await pAccount.getByText("Escribe esta palabra").waitFor({ timeout: 60_000 });
  await pages[0].screenshot({ path: `${OUT}/21-alumno-escribiendo.png` });
  const shownName = async (p) => ((await p.getByText(/Entraste como/).first().textContent()).match(/Entraste como (.*?)\./) ?? [])[1];
  const real = [];
  for (const p of pages) real.push(await shownName(p));
  console.log("  nombres con que entraron:", real.join(" | "));
  ok(real.every(Boolean), "cada alumno ve con qué nombre entró");
  const anas = real.filter((n) => /^ana( 2)?$/i.test(n));
  ok(anas.length === 2 && anas.some((n) => / 2$/.test(n)), "dos alumnos con el mismo apodo: el segundo queda con «2»", anas.join(","));
  const nameAna = real[0], nameLuis = real[2], nameMia = real[3], nameJug = real[4];

  // La ruta vieja sigue funcionando: /v/<código> redirige a /live/<código>.
  const viejo = await browser.newContext({ viewport: { width: 900, height: 700 } });
  const vp = await viejo.newPage();
  await vp.goto(`${BASE}/es/v/${code}`);
  await vp.waitForURL(new RegExp(`/es/live/${code}$`), { timeout: 30_000 });
  ok(true, "/v/<código> redirige a /live/<código>");
  await vp.goto(`${BASE}/es/v`);
  await vp.waitForURL(/\/es\/live$/, { timeout: 30_000 });
  ok(true, "/v redirige a /live");
  await viejo.close();

  // ── Todos escriben a la vez ──
  await Promise.all([
    writeWord(pages[0], chars),
    writeWord(pages[1], chars),
    writeWord(pages[2], chars, { errorsFirst: 2 }),
    writeWord(pages[3], chars),
    writeWord(pages[4], chars, { scribble: true }),
    writeWord(pAccount, chars),
  ]);
  for (const p of [...pages, pAccount]) await p.getByText("Tu resultado").waitFor({ timeout: 60_000 });
  await pages[0].waitForTimeout(1200);
  await pages[0].screenshot({ path: `${OUT}/22-alumno-resultado.png` });
  const espera = await pages[0].getByText("Esperando la siguiente palabra").waitFor({ timeout: 15_000 }).then(() => true, () => false);
  ok(espera, "tras entregar, el alumno ve que espera la siguiente palabra (sin «enviado a tu profesora»)");
  ok((await pages[0].getByText("Enviado a tu profesora").count()) === 0, "ya no dice «Enviado a tu profesora»");
  const frase = await pages[0].getByText(/trazos a la primera/).textContent();
  const m = frase.match(/(\d+) de (\d+) trazos/);
  ok(m && m[1] === m[2], `un alumno sin errores ve «${frase}»`);
  ok(await pages[0].getByText("Ningún trazo te falló").isVisible(), "y se le felicita");
  // Quien falló el primer trazo ve cuáles le costaron, marcados sobre el carácter.
  await pages[2].getByText("Tu resultado").waitFor();
  await pages[2].getByTestId("failed-strokes").waitFor({ timeout: 20_000 });
  ok(/trazos 1\b/.test(await pages[2].getByTestId("failed-strokes").innerText()), "quien falló el primer trazo ve «trazos 1» entre los que le costaron");
  ok((await pages[2].getByTestId("failed-strokes").locator("svg path").count()) > 3, "los trazos se dibujan con los fallados marcados");
  await pages[2].screenshot({ path: `${OUT}/26-alumno-trazos-que-costaron.png` });
  // Quien llegó al límite: mensaje claro y sin palomita verde.
  await pages[4].getByText(/Llegaste al límite de errores/).waitFor({ timeout: 20_000 });
  ok(true, "a quien llegó al límite se le dice claro que se le mostró el carácter");
  ok((await pages[4].locator("svg.lucide-eye").count()) >= 1 && (await pages[4].locator("svg.lucide-check").count()) === 0, "el carácter mostrado lleva un ojo, no la palomita verde");
  await pages[4].screenshot({ path: `${OUT}/27-alumno-limite.png` });

  // ── Lo que quedó guardado ──
  let writes = [];
  for (let i = 0; i < 15; i++) {
    writes = await rest(`/evaluation_writes?select=voter_hash,attempt&evaluation_id=eq.${ev1.id}`);
    if (writes.length >= 6) break;
    await tp.waitForTimeout(1000);
  }
  const parts = await rest(`/session_participants?select=voter_hash,display_name,student_id&session_id=eq.${sess.id}`);
  ok(writes.length === 6, `6 intentos guardados (${writes.length})`);
  const nameOf = Object.fromEntries(parts.map((p) => [p.voter_hash, p.display_name]));
  const by = Object.fromEntries(writes.map((w) => [nameOf[w.voter_hash], w.attempt]));
  ok(new Set(parts.map((p) => p.display_name)).size === 6, `nombres únicos: ${parts.map((p) => p.display_name).join(", ")}`);
  ok(parts.filter((p) => p.student_id === account.id).length === 1, "quien eligió su cuenta queda con su cuenta");
  const pr = (a) => { let t = 0, g = 0; for (const c of a.chars) { t += c.strokes; for (let i = 0; i < c.strokes; i++) if (i < c.done && c.errors[i] === 0) g++; } return Math.round((g / t) * 100); };
  ok(pr(by[nameAna]) === 100 && pr(by[nameMia]) === 100, `sin errores → 100 % (${nameAna} ${pr(by[nameAna])}, ${nameMia} ${pr(by[nameMia])})`);
  ok(pr(by[nameLuis]) < 100 && pr(by[nameLuis]) >= 80, `con 2 errores en el primer trazo baja un poco (${nameLuis} ${pr(by[nameLuis])} %)`);
  ok(by[nameJug].chars.some((c) => c.shown), "quien garabatea llega al límite y se le muestra el carácter");
  ok(pr(by[nameJug]) < 50, `el garabato no sube la precisión (${nameJug} ${pr(by[nameJug])} %)`);
  ok(by[nameAna].pointer === "mouse" && by[nameAna].guide === true && by[nameAna].events.length > 0, "se guarda el dispositivo, el modo y los instantes de cada trazo");
  const capped = Math.max(...by[nameJug].chars.flatMap((c) => c.errors));
  ok(capped <= 3, `ningún trazo pasó de 3 errores (máx. ${capped})`);

  // ── Lo que ve la profesora ──
  await tp.waitForTimeout(3000);
  const counter = await tp.getByTestId("write-counter").textContent();
  ok(/6 de 8/.test(counter), `el contador de arriba dice cuántos escribieron: «${counter}»`);
  await tp.keyboard.press(" ");
  await tp.getByTestId("write-panel").waitFor({ timeout: 30_000 });
  await tp.waitForTimeout(3000);
  const headline = await tp.getByTestId("write-headline").textContent();
  const passedExpected = Object.values(by).filter((a) => pr(a) >= 80).length;
  ok(headline.includes(`${passedExpected} de 6`), `titular «${headline}» (esperado ${passedExpected} de 6)`);
  const panelText = await tp.getByTestId("write-panel").innerText();
  ok(real.every((n) => panelText.includes(n)), "el panel lista a cada alumno por su nombre");
  ok(/dedo|ratón/.test(panelText) && /Precisión mediana/.test(panelText), "muestra el dispositivo y la mediana");
  await tp.screenshot({ path: `${OUT}/23-profe-panel.png` });
  const firstName = (await tp.getByTestId("write-panel").locator("li").first().locator("span").first().textContent()).trim();
  ok(firstName === nameJug, `arriba de la lista, quien más necesita ayuda: ${firstName}`);

  // ── Segundo intento del mismo alumno: solo práctica ──
  ok(await pages[0].getByRole("button", { name: "Practicar otra vez (no cuenta)" }).isVisible(), "el botón de repetir avisa que no cuenta");
  await pages[0].getByRole("button", { name: "Practicar otra vez (no cuenta)" }).click();
  await writeWord(pages[0], chars, { errorsFirst: 3 });
  await pages[0].getByText("este intento no se envía").waitFor({ timeout: 30_000 });
  ok(true, "repetir la palabra es práctica y no se envía");
  ok((await rest(`/evaluation_writes?select=voter_hash&evaluation_id=eq.${ev1.id}`)).length === 6, "en la base sigue habiendo 6 intentos: solo cuenta el primero");

  // ── Límites: se cambian con la clase en pausa y valen desde la siguiente palabra ──
  await tp.keyboard.press("Space"); // volver al anverso
  const limitsBtn = tp.getByRole("button", { name: "Límites" });
  ok(await limitsBtn.isDisabled(), "con la clase en vivo y una palabra abierta, los límites no se pueden cambiar");
  await tp.keyboard.press("v"); // pausar
  await tp.waitForTimeout(1200);
  ok(await limitsBtn.isEnabled(), "pausando la clase, los límites se pueden cambiar");
  await limitsBtn.click();
  await tp.getByRole("button", { name: "Estricto" }).click();
  await tp.screenshot({ path: `${OUT}/24-profe-limites.png` });
  await tp.getByRole("button", { name: "Guardar" }).click();
  await tp.waitForTimeout(1200);
  const cfg = (await rest(`/class_sessions?select=write_config&id=eq.${sess.id}`))[0].write_config;
  ok(cfg?.limits?.[0]?.max === 2 && cfg?.limits?.[8]?.max === 13, "los límites guardados son los del juego «Estricto»", JSON.stringify(cfg?.limits?.slice(0, 2)));
  await tp.keyboard.press("v"); // reanudar: reabre la misma palabra con su copia vieja
  await tp.waitForTimeout(2500);
  const evs = await rest(`/evaluations?select=id,write_config&session_id=eq.${sess.id}&kind=eq.write`);
  ok(evs.length === 1 && evs[0].write_config.limits[0].max === 3, "volver a la misma palabra conserva sus límites originales (no se cambian a mitad)");
  await tp.keyboard.press("ArrowRight");
  await tp.waitForTimeout(3000);
  const evs2 = await rest(`/evaluations?select=id,sense_id,write_config,opened_at&session_id=eq.${sess.id}&kind=eq.write&order=opened_at`);
  ok(evs2.length === 2 && evs2[1].write_config.limits[0].max === 2, "la siguiente palabra se abre con los límites nuevos");
  ok(await pages[2].getByText("Escribe esta palabra").isVisible(), "el celular sigue a la profesora a la siguiente palabra");
  // ── Palabra de varios caracteres, y un celular angosto ──
  const word2 = (await rest(`/senses?select=words(hanzi)&id=eq.${evs2[1].sense_id}`))[0].words.hanzi;
  const chars2 = [...word2];
  console.log(`  segunda palabra: ${word2} (${chars2.length} caracteres)`);
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mp = await phone.newPage();
  await mp.goto(`${BASE}/es/live/${code}`);
  await join(mp, "Celu");
  await mp.getByText("Escribe esta palabra").waitFor({ timeout: 60_000 });
  await mp.waitForTimeout(1500);
  ok(!(await mp.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)), "el celular angosto no se desborda con la palabra de varios caracteres");
  await mp.screenshot({ path: `${OUT}/25-celular-angosto.png` });
  const cellCount = await mp.locator('[aria-label^="Casilla"]').count();
  ok(cellCount === chars2.length, `una casilla por carácter (${cellCount})`);
  // El celular angosto escribe con el ratón (el dedo real no se simula aquí).
  await writeWord(mp, chars2);
  await mp.getByText("Tu resultado").waitFor({ timeout: 60_000 });
  await mp.waitForTimeout(800);
  const ev2w = await rest(`/evaluation_writes?select=attempt,voter_hash&evaluation_id=eq.${evs2[1].id}`);
  ok(ev2w.length === 1 && ev2w[0].attempt.chars.length === chars2.length, `el intento guarda un registro por carácter (${ev2w[0]?.attempt.chars.length})`);
  ok(pr(ev2w[0].attempt) === 100, `sin errores en ${word2} → 100 %`);


  console.log("errores de consola/página:", errors.length ? errors : "ninguno");
} catch (e) {
  console.log("✗ fallo:", e.message.split("\n").slice(0, 3).join(" | "));
  process.exitCode = 1;
  console.log("errores:", errors);
} finally {
  await browser?.close();
  for (const id of created) await admin(`/auth/v1/admin/users/${id}`, { method: "DELETE" });
  console.log("usuarios temporales borrados:", created.length);
}

// Guarda la sesión de una cuenta para los recorridos automáticos
// (tests/flows). Abre un navegador en el login: la contraseña la escribe la
// persona, nunca pasa por este script ni por el chat. Al entrar, guarda las
// cookies en tests/.auth/<nombre>.json (fuera de git: es una llave).
// Requiere `npm run dev` en marcha. Uso:
//   npm run test:sesion -- admin
//   npm run test:sesion -- laoshi
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const name = process.argv[2];
if (!["admin", "laoshi"].includes(name)) {
  console.error("Uso: npm run test:sesion -- admin   (o laoshi)");
  process.exit(1);
}
const base = `http://localhost:${process.env.PLAYWRIGHT_PORT ?? "3000"}`;

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext();
const page = await context.newPage();
await page.goto(`${base}/es/login`);
console.log(`Inicia sesión con la cuenta "${name}" en la ventana que se abrió (tienes 5 minutos).`);

// El login lleva a /collections cuando la clave es correcta (también al admin).
await page.waitForURL(/\/collections/, { timeout: 5 * 60_000 });
console.log("Sesión iniciada. Es normal ver primero «Mis colecciones»: compruebo el rol en /admin…");

// Comprueba que la cuenta es la que se pidió: el admin ve «Base común»; a
// cualquier otra cuenta /admin la devuelve a /collections. Se espera a una
// de las dos cosas (la primera carga en desarrollo puede tardar).
await page.goto(`${base}/es/admin`);
const isAdmin = await Promise.race([
  page.getByRole("heading", { name: "Base común" }).waitFor({ timeout: 120_000 }).then(() => true),
  page.waitForURL(/\/collections/, { timeout: 120_000 }).then(() => false),
]);
if ((name === "admin") !== isAdmin) {
  console.error(
    name === "admin"
      ? "Esa cuenta no es admin. No se guardó nada."
      : "Esa cuenta es admin; para laoshi usa la cuenta de la profesora. No se guardó nada.",
  );
  await browser.close();
  process.exit(1);
}

mkdirSync("tests/.auth", { recursive: true });
await context.storageState({ path: `tests/.auth/${name}.json` });
console.log(`Sesión guardada en tests/.auth/${name}.json`);
await browser.close();

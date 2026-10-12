// Guarda la sesión de una cuenta para los recorridos automáticos
// (tests/flows). Abre un navegador en el login: la contraseña la escribe la
// persona, nunca pasa por este script ni por el chat. Al entrar, guarda las
// cookies en tests/.auth/<nombre>.json (fuera de git: es una llave).
// Requiere `npm run dev` en marcha. Uso:
//   npm run test:sesion -- admin
//   npm run test:sesion -- laoshi
// Base de desarrollo (servidor `npm run dev:base-dev`, puerto 3001): añadir
// --dev; la sesión va a tests/.auth-dev/ y no pisa la de producción.
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const name = process.argv[2];
const dev = process.argv.includes("--dev");
const dir = dev ? "tests/.auth-dev" : "tests/.auth";
if (!["admin", "laoshi"].includes(name)) {
  console.error("Uso: npm run test:sesion -- admin   (o laoshi)");
  process.exit(1);
}
const base = `http://localhost:${process.env.PLAYWRIGHT_PORT ?? (dev ? "3001" : "3000")}`;

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext();
const page = await context.newPage();
await page.goto(`${base}/es/login`);
console.log(`Inicia sesión con la cuenta "${name}" en la ventana que se abrió (tienes 5 minutos).`);

// Con la clave correcta, el login lleva a /admin (admin) o a /collections.
await page.waitForURL(/\/(collections|admin)/, { timeout: 5 * 60_000 });
console.log("Sesión iniciada: compruebo el rol en /admin…");

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

mkdirSync(dir, { recursive: true });
await context.storageState({ path: `${dir}/${name}.json` });
console.log(`Sesión guardada en ${dir}/${name}.json`);
await browser.close();

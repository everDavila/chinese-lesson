import { existsSync } from "node:fs";
import { chromium, type FullConfig } from "@playwright/test";

// Antes de las pruebas, renueva UNA vez cada sesión guardada (admin, laoshi) y
// guarda el token nuevo. Sin esto, varios procesos en paralelo renuevan a la
// vez el mismo token vencido; Supabase detecta el reuso del refresh token y
// revoca la sesión entera (y hay que volver a iniciarla a mano).
export default async function globalSetup(config: FullConfig) {
  const dir = process.env.HANZI_AUTH_DIR ?? "tests/.auth";
  // El baseURL del primer proyecto que lo tenga (recorridos-dev usa su puerto).
  const devRun = process.argv.some((a) => a.includes("recorridos-dev"));
  const project = config.projects.find((p) => p.name === (devRun ? "recorridos-dev" : "recorridos")) ?? config.projects[0];
  const baseURL = project?.use.baseURL;
  if (!baseURL) return;
  const files = ["admin", "laoshi"].map((n) => `${dir}/${n}.json`).filter((f) => existsSync(f));
  if (!files.length) return;

  const browser = await chromium.launch();
  try {
    for (const file of files) {
      const context = await browser.newContext({ storageState: file });
      const page = await context.newPage();
      try {
        // Cualquier página con sesión pasa por el proxy, que renueva el token.
        await page.goto(`${baseURL}/es/collections`, { waitUntil: "networkidle", timeout: 60_000 });
        await context.storageState({ path: file });
      } catch {
        // Servidor caído o lento: las pruebas lo dirán; aquí no se rompe nada.
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
}

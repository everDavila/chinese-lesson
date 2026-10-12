import { defineConfig } from "@playwright/test";

// Capturas visuales de la tarjeta en los tamaños que importan: celular (para
// el futuro modo alumno) y los escritorios de referencia de la docente
// (DIAGNOSTICO-MODO-CLASE.md §2), en claro y oscuro. Lección de Nimbus.
const sizes = {
  phone: { width: 390, height: 844 },
  laptop: { width: 1366, height: 768 },
  desktop: { width: 1440, height: 900 },
  wide: { width: 1920, height: 1080 },
} as const;

// Cada worktree puede usar su propio puerto y no terminar probando, con mucha
// seguridad y cero utilidad, el servidor de otra sesión.
const port = process.env.PLAYWRIGHT_PORT ?? "3000";

// Recorridos contra la base de desarrollo: otras sesiones y otra base para
// limpiar. Se fija aquí porque los workers heredan el entorno del proceso
// principal y el spec lo lee al cargarse.
const devRun = process.argv.some((a) => a.includes("recorridos-dev"));
process.env.HANZI_AUTH_DIR ??= devRun ? "tests/.auth-dev" : "tests/.auth";
process.env.HANZI_ENV_FILE ??= devRun ? ".env.dev.local" : ".env.local";
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "tests",
  outputDir: "tests/.results",
  reporter: "list",
  use: {
    baseURL,
    // Sin animación: los hanzi salen ya dibujados y la captura no depende de la suerte.
    reducedMotion: "reduce",
  },
  projects: [
    ...Object.entries(sizes).flatMap(([name, viewport]) =>
      (["light", "dark"] as const).map((colorScheme) => ({
        name: `${name}-${colorScheme}`,
        // Los recorridos con sesión escriben en la base: no van aquí.
        testIgnore: "flows/**",
        use: {
          viewport,
          colorScheme,
          isMobile: name === "phone",
          hasTouch: name === "phone",
          deviceScaleFactor: name === "phone" ? 2 : 1,
        },
      })),
    ),
    // npm run test:recorridos. Una sola vez, en escritorio (las capturas de
    // celular las hace el propio recorrido).
    { name: "recorridos", testMatch: "flows/**/*.spec.ts", use: { viewport: sizes.desktop } },
    // npm run test:recorridos:dev: lo mismo contra la base de desarrollo
    // (servidor `npm run dev:base-dev` en el 3001, sesiones en tests/.auth-dev).
    {
      name: "recorridos-dev",
      testMatch: "flows/**/*.spec.ts",
      use: { viewport: sizes.desktop, baseURL: `http://localhost:${process.env.DEV_PORT ?? "3001"}` },
    },
  ],
  webServer: {
    command: `npm run dev -- -p ${port}`,
    url: `${baseURL}/es/present`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});

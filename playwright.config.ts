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

export default defineConfig({
  testDir: "tests",
  outputDir: "tests/.results",
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    // Sin animación: los hanzi salen ya dibujados y la captura no depende de la suerte.
    reducedMotion: "reduce",
  },
  projects: Object.entries(sizes).flatMap(([name, viewport]) =>
    (["light", "dark"] as const).map((colorScheme) => ({
      name: `${name}-${colorScheme}`,
      use: {
        viewport,
        colorScheme,
        isMobile: name === "phone",
        hasTouch: name === "phone",
        deviceScaleFactor: name === "phone" ? 2 : 1,
      },
    })),
  ),
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000/es/present",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});

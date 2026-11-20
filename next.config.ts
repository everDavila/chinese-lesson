import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // Solo en desarrollo: permite abrir el servidor desde otros dispositivos de
  // la red de casa (p. ej. el celular en http://192.168.x.x:3000).
  allowedDevOrigins: ["192.168.*.*"],
  partialPrefetching: true,
  // La entrada de los alumnos se llamaba /v (votar); ahora es /live (clase en
  // vivo: votar, escribir…). /v sigue funcionando para los códigos y enlaces ya
  // repartidos. Temporal (307): si algún día se quita, el navegador no la recuerda.
  async redirects() {
    return [
      { source: "/v", destination: "/live", permanent: false },
      { source: "/v/:code", destination: "/live/:code", permanent: false },
      { source: "/:locale(es|en|zh)/v", destination: "/:locale/live", permanent: false },
      { source: "/:locale(es|en|zh)/v/:code", destination: "/:locale/live/:code", permanent: false },
    ];
  },
  // «Aprende» lee los capítulos de contenido/etimologia en tiempo de ejecución:
  // sin esto, Vercel no los incluye en la función.
  outputFileTracingIncludes: { "/**/*": ["./contenido/etimologia/**/*"] },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default createNextIntlPlugin()(nextConfig);

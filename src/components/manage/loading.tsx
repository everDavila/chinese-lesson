// Lo que se ve mientras llegan los datos de una pantalla de docente o admin.
// Antes era un <main> vacío: con la base lejos, segundos de pantalla en
// blanco que parecían un fallo. Misma silueta que ManageShell, sin textos
// (no hay idioma resuelto aún) y animado solo si el sistema lo permite.
export function ManageLoading() {
  const bar = "rounded-lg bg-muted motion-safe:animate-pulse";
  return (
    <div className="flex flex-1 flex-col" aria-busy="true">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="font-hanzi text-xl text-muted-foreground">汉字</span>
          <span className={`${bar} h-4 w-28`} />
        </div>
        <span className={`${bar} h-9 w-24`} />
      </div>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
        <span className={`${bar} h-4 w-48`} />
        <span className={`${bar} h-9 w-72 max-w-full`} />
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={`${bar} h-20 w-full`} />
          ))}
        </div>
      </main>
    </div>
  );
}

// Página provisional de la fase 0: comprueba fuentes y tokens de color.
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
      <p className="font-hanzi text-9xl">
        <span className="text-radical">讠</span>
        <span className="text-phonetic">人</span>
      </p>
      <p className="font-hanzi text-3xl">
        我<span className="text-keyword">认识</span>他。
      </p>
      <p className="text-muted-foreground">
        rènshi · conocer (a alguien) · to know (someone)
      </p>
      <div className="flex gap-3 text-sm">
        <span className="rounded-md bg-rating-1/20 px-3 py-1">No la sé</span>
        <span className="rounded-md bg-rating-2/20 px-3 py-1">Me costó</span>
        <span className="rounded-md bg-rating-3/20 px-3 py-1">Bien</span>
        <span className="rounded-md bg-rating-4/20 px-3 py-1">Fácil</span>
      </div>
    </main>
  );
}

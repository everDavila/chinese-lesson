"use client";

import { useRef, useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { bankOrder, grade, pickBatch, place, remaining, type MatchWord } from "@/lib/matching";
import { cn } from "@/lib/utils";

// Piloto: emparejar hanzi con pinyin. En cada página se arrastra (o se toca)
// cada ficha de hanzi al hueco de su pinyin y se corrige al pulsar «Enviar».
// Dos maneras de colocar, las dos con el mismo estado: arrastrar con el dedo o
// el ratón, y tocar ficha + tocar hueco (también con teclado). Individual y
// sin base de datos. Todo en español.

const PER_PAGE = 6;
const PAGES = 2;
const DRAG_THRESHOLD = 6;

type Page = { batch: MatchWord[]; bank: string[]; slots: (string | null)[]; sent: boolean };
type Drag = { hanzi: string; x: number; y: number };

function newPages(words: MatchWord[]): Page[] {
  // Que las páginas no repitan palabras entre sí.
  const used = new Set<string>();
  return Array.from({ length: PAGES }, () => {
    const batch = pickBatch(words.filter((w) => !used.has(w.hanzi)), PER_PAGE, Math.random);
    batch.forEach((w) => used.add(w.hanzi));
    return { batch, bank: bankOrder(batch, Math.random), slots: batch.map(() => null), sent: false };
  });
}

const TONES = [
  "bg-red-100 text-red-950 border-red-300 dark:bg-red-950 dark:text-red-50 dark:border-red-800",
  "bg-blue-100 text-blue-950 border-blue-300 dark:bg-blue-950 dark:text-blue-50 dark:border-blue-800",
  "bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950 dark:text-amber-50 dark:border-amber-800",
  "bg-green-100 text-green-950 border-green-300 dark:bg-green-950 dark:text-green-50 dark:border-green-800",
  "bg-purple-100 text-purple-950 border-purple-300 dark:bg-purple-950 dark:text-purple-50 dark:border-purple-800",
  "bg-teal-100 text-teal-950 border-teal-300 dark:bg-teal-950 dark:text-teal-50 dark:border-teal-800",
] as const;

export function MatchingLab({ words }: { words: MatchWord[] }) {
  // Las tandas se arman al pulsar «Empezar» (no al renderizar): `Math.random` en el render haría que el servidor y el cliente no coincidan.
  const [pages, setPages] = useState<Page[] | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const start = useRef<{ hanzi: string; x: number; y: number } | null>(null);
  const moved = useRef(false);

  const [finished, setFinished] = useState(false);
  if (!pages) {
    return (
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center gap-6 px-4 py-10 text-center">
        <h1 className="text-3xl font-semibold">Empareja el hanzi con su pinyin</h1>
        <p className="text-muted-foreground">Dos páginas de {PER_PAGE} palabras de HSK 1. Arrastra cada ficha a su hueco, o tócala y toca el hueco.</p>
        <Button size="lg" onClick={() => setPages(newPages(words))}>Empezar</Button>
      </main>
    );
  }
  const page = pages[pageIndex];
  const toneOf = (hanzi: string) => TONES[page.batch.findIndex((w) => w.hanzi === hanzi) % TONES.length];
  const free = remaining(page.bank, page.slots);
  const result = page.sent ? grade(page.batch, page.slots) : null;
  const complete = page.slots.every((s) => s !== null);

  const update = (patch: Partial<Page>) => setPages((all) => (all ?? []).map((p, i) => (i === pageIndex ? { ...p, ...patch } : p)));
  const putInSlot = (hanzi: string, slot: number) => update({ slots: place(page.slots, hanzi, slot) });
  const backToBank = (hanzi: string) => update({ slots: page.slots.map((s) => (s === hanzi ? null : s)) });

  // Arrastre con Pointer Events: vale para dedo y ratón. El clic sin mover es el modo «tocar».
  const onPointerDown = (hanzi: string) => (e: React.PointerEvent) => {
    if (page.sent) return;
    start.current = { hanzi, x: e.clientX, y: e.clientY };
    moved.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const s = start.current;
    if (!s) return;
    if (!moved.current && Math.hypot(e.clientX - s.x, e.clientY - s.y) < DRAG_THRESHOLD) return;
    moved.current = true;
    setSelected(null);
    setDrag({ hanzi: s.hanzi, x: e.clientX, y: e.clientY });
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const s = start.current;
    start.current = null;
    if (!s) return;
    // Un toque sin mover es «tocar»: se resuelve aquí y no en `click`, porque
    // tras un arrastre algunos navegadores táctiles no emiten el clic.
    if (!moved.current) {
      if (!page.sent) setSelected((cur) => (cur === s.hanzi ? null : s.hanzi));
      return;
    }
    setDrag(null);
    const target = document.elementFromPoint(e.clientX, e.clientY);
    const slot = target?.closest<HTMLElement>("[data-slot]");
    if (slot) putInSlot(s.hanzi, Number(slot.dataset.slot));
    else if (target?.closest("[data-bank]")) backToBank(s.hanzi);
  };
  const onCancel = () => {
    start.current = null;
    setDrag(null);
  };
  // Teclado: Enter o Espacio sobre un botón emiten un clic con `detail` 0; el
  // dedo y el ratón ya se resolvieron en pointerup.
  const click = (hanzi: string) => (e: React.MouseEvent) => {
    if (e.detail !== 0 || page.sent) return;
    setSelected((cur) => (cur === hanzi ? null : hanzi));
  };
  const dropOnSlot = (i: number) => {
    if (page.sent || !selected) return;
    putInSlot(selected, i);
    setSelected(null);
  };

  const chip = (hanzi: string) => (
    <button
      key={hanzi}
      type="button"
      lang="zh-Hans"
      aria-pressed={selected === hanzi}
      aria-label={hanzi}
      onPointerDown={onPointerDown(hanzi)}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onCancel}
      onClick={click(hanzi)}
      className={cn(
        "min-h-12 min-w-14 touch-none select-none rounded-xl border-2 px-3 font-hanzi text-2xl",
        toneOf(hanzi),
        selected === hanzi && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        drag?.hanzi === hanzi && "opacity-40",
      )}
    >
      {hanzi}
    </button>
  );

  const totalHits = pages.reduce((n, p) => n + (p.sent ? grade(p.batch, p.slots).hits : 0), 0);
  const totalWords = pages.reduce((n, p) => n + p.batch.length, 0);

  if (finished) {
    return (
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center gap-6 px-4 py-10 text-center">
        <h1 className="text-3xl font-semibold">¡Terminaste!</h1>
        <p className="text-5xl font-semibold tabular-nums">{totalHits} / {totalWords}</p>
        <Button
          size="lg"
          onClick={() => {
            setPages(newPages(words));
            setPageIndex(0);
            setFinished(false);
            setSelected(null);
          }}
        >
          Otra tanda
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 px-4 py-6">
      <header>
        <h1 className="text-2xl font-semibold">Empareja el hanzi con su pinyin</h1>
        <p className="text-sm text-muted-foreground">
          Arrastra cada ficha a su hueco, o toca una ficha y luego el hueco. Se corrige al enviar. · Página {pageIndex + 1} de {PAGES}
        </p>
      </header>

      <section aria-label="Fichas" data-bank className="flex min-h-20 flex-wrap gap-2 rounded-2xl border border-dashed border-border bg-muted/40 p-3">
        {free.length === 0 && !page.sent && <p className="m-auto text-sm text-muted-foreground">Ya colocaste todas las fichas.</p>}
        {free.map((h) => chip(h))}
      </section>

      <ol className="flex flex-col gap-2">
        {page.batch.map((w, i) => {
          const placed = page.slots[i];
          const ok = result?.correct[i];
          return (
            <li key={w.hanzi} className="flex items-center gap-3">
              <span lang="zh-Latn" className="w-24 shrink-0 text-lg">{w.pinyin}</span>
              <div
                role="button"
                tabIndex={placed ? -1 : 0}
                data-slot={i}
                aria-label={`Hueco de ${w.pinyin}${placed ? `, ficha ${placed}` : ", vacío"}`}
                onPointerUp={() => dropOnSlot(i)}
                onKeyDown={(e) => {
                  if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    dropOnSlot(i);
                  }
                }}
                className={cn(
                  "flex min-h-14 flex-1 items-center justify-center rounded-xl border-2 border-dashed border-border",
                  selected && !page.sent && "border-primary",
                  ok === true && "border-solid border-green-600 bg-green-50 dark:bg-green-950",
                  ok === false && "border-solid border-red-600 bg-red-50 dark:bg-red-950",
                )}
              >
                {placed ? chip(placed) : <span className="text-sm text-muted-foreground">{selected && !page.sent ? "Soltar aquí" : ""}</span>}
              </div>
              <span className="flex w-24 shrink-0 items-center gap-1 whitespace-nowrap text-sm" aria-live="polite">
                {ok === true && (
                  <>
                    <Check className="size-5 text-green-600" aria-hidden />
                    <span className="sr-only">Bien</span>
                  </>
                )}
                {ok === false && (
                  <>
                    <X className="size-5 text-red-600" aria-hidden />
                    <span lang="zh-Hans" className="font-hanzi text-lg" title="Respuesta correcta">{w.hanzi}</span>
                  </>
                )}
              </span>
            </li>
          );
        })}
      </ol>

      <footer className="flex flex-wrap items-center justify-between gap-3">
        {result ? (
          <p className="font-medium" role="status">{result.hits} de {page.batch.length} bien</p>
        ) : (
          <p className="text-sm text-muted-foreground">{page.slots.filter(Boolean).length} de {page.batch.length} colocadas</p>
        )}
        {!page.sent ? (
          <Button size="lg" disabled={!complete} onClick={() => update({ sent: true })}>Enviar respuestas</Button>
        ) : pageIndex < PAGES - 1 ? (
          <Button size="lg" onClick={() => { setPageIndex(pageIndex + 1); setSelected(null); }}>Siguiente página</Button>
        ) : (
          <Button size="lg" onClick={() => setFinished(true)}>Ver resultado</Button>
        )}
      </footer>

      {drag && (
        <div aria-hidden className="pointer-events-none fixed z-50" style={{ left: drag.x, top: drag.y, transform: "translate(-50%, -50%)" }}>
          <span lang="zh-Hans" className={cn("flex min-h-12 min-w-14 items-center justify-center rounded-xl border-2 px-3 font-hanzi text-2xl shadow-lg", toneOf(drag.hanzi))}>{drag.hanzi}</span>
        </div>
      )}
    </main>
  );
}

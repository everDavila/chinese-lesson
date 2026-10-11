"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Pencil, Plus, Presentation, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { collectionsBase, homeCrumb, type Mode } from "./collections";
import { Empty, ProtoShell, StatusBadge } from "./shell";
import { parsePastedList, prototype, searchWords, usePrototype, type ProtoWord } from "./store";

const meaningOf = (w: ProtoWord, senseIndex: number) => {
  const s = w.senses[senseIndex] ?? w.senses[0];
  return s?.meaning.es || s?.meaning.en || w.meaningEn;
};

/** Editor de una lección: palabras, sentido elegido, orden y añadir. */
export function LessonEditor({ mode, collectionId, lessonId }: { mode: Mode; collectionId: string; lessonId: string }) {
  const state = usePrototype();
  const c = state.collections.find((x) => x.id === collectionId);
  const lesson = c?.lessons.find((l) => l.id === lessonId);
  const [tab, setTab] = useState<"buscar" | "pegar">("buscar");
  const [renaming, setRenaming] = useState<string | null>(null);

  if (!c || !lesson) {
    return (
      <ProtoShell crumbs={homeCrumb(mode)} title="Lección no encontrada">
        <Empty>Puede que la hayas borrado o restablecido el ejemplo.</Empty>
      </ProtoShell>
    );
  }

  const inLesson = new Set(lesson.items.map((i) => i.hanzi));
  type Items = typeof lesson.items;
  const setItems = (fn: (items: Items) => Items) =>
    prototype.updateLesson(c.id, lesson.id, (l) => ({ ...l, items: fn(l.items) }));
  const add = (hanzis: string[]) =>
    setItems((items) => [
      ...items,
      ...hanzis.filter((h) => !items.some((i) => i.hanzi === h)).map((h) => ({ hanzi: h, senseIndex: 0 })),
    ]);
  const presentable = lesson.items.filter((i) => prototype.word(state, i.hanzi)?.status === "curada");

  return (
    <ProtoShell
      crumbs={[...homeCrumb(mode), { label: c.title, href: `${collectionsBase(mode)}/${c.id}` }, { label: lesson.title }]}
      title={lesson.title}
      actions={
        <>
          <Button variant="ghost" onClick={() => setRenaming(lesson.title)}>
            <Pencil /> Renombrar
          </Button>
          {mode === "docente" && (
            presentable.length ? (
              <Link
                href={`/present?palabras=${encodeURIComponent(presentable.map((i) => i.hanzi).join(","))}`}
                className={buttonVariants()}
                title={
                  presentable.length < lesson.items.length
                    ? "Solo se presentan las palabras con contenido curado"
                    : undefined
                }
              >
                <Presentation /> Presentar ({presentable.length})
              </Link>
            ) : (
              <Button disabled>
                <Presentation /> Presentar (0)
              </Button>
            )
          )}
        </>
      }
    >
      {renaming !== null && (
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (renaming.trim()) prototype.updateLesson(c.id, lesson.id, (l) => ({ ...l, title: renaming.trim() }));
            setRenaming(null);
          }}
        >
          <input
            autoFocus
            value={renaming}
            onChange={(e) => setRenaming(e.target.value)}
            aria-label="Nuevo nombre de la lección"
            className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-background px-3"
          />
          <Button type="submit">Guardar</Button>
        </form>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,26rem)]">
        {/* Palabras de la lección */}
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">
            Palabras <span className="text-muted-foreground">({lesson.items.length})</span>
          </h2>
          {lesson.items.length ? (
            <ol className="flex flex-col gap-2">
              {lesson.items.map((it, i) => {
                const w = prototype.word(state, it.hanzi);
                return (
                  <li key={it.hanzi} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3">
                    <span className="w-5 text-center text-sm text-muted-foreground tabular-nums">{i + 1}</span>
                    <span className="font-hanzi text-3xl">{it.hanzi}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{w?.senses[it.senseIndex]?.pinyin ?? w?.pinyin}</span>{" "}
                        <span className="text-muted-foreground">{w ? meaningOf(w, it.senseIndex) : "—"}</span>
                      </p>
                      <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2">
                        {w ? <StatusBadge status={w.status} /> : <StatusBadge status="sin contenido" />}
                        {w && <span className="text-xs text-muted-foreground">HSK {w.hsk || "?"}</span>}
                        {w && w.senses.length > 1 && (
                          <select
                            aria-label={`Sentido de ${it.hanzi}`}
                            value={it.senseIndex}
                            onChange={(e) =>
                              setItems((items) =>
                                items.map((x) => (x.hanzi === it.hanzi ? { ...x, senseIndex: Number(e.target.value) } : x)),
                              )
                            }
                            className="h-7 w-full max-w-full min-w-0 truncate rounded-md border border-input bg-background px-1 text-xs sm:w-auto"
                          >
                            {w.senses.map((s, si) => (
                              <option key={si} value={si}>
                                Sentido {si + 1}: {s.meaning.es || s.meaning.en}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Subir"
                        disabled={i === 0}
                        onClick={() =>
                          setItems((items) => {
                            const n = [...items];
                            [n[i - 1], n[i]] = [n[i], n[i - 1]];
                            return n;
                          })
                        }
                      >
                        <ArrowUp />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Bajar"
                        disabled={i === lesson.items.length - 1}
                        onClick={() =>
                          setItems((items) => {
                            const n = [...items];
                            [n[i + 1], n[i]] = [n[i], n[i + 1]];
                            return n;
                          })
                        }
                      >
                        <ArrowDown />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Quitar ${it.hanzi}`}
                        onClick={() => setItems((items) => items.filter((x) => x.hanzi !== it.hanzi))}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <Empty>Añade palabras buscándolas o pegando la lista de tu libro.</Empty>
          )}
        </section>

        {/* Añadir */}
        <section className="flex flex-col gap-3 self-start rounded-xl border border-border bg-card p-4 lg:sticky lg:top-4">
          <div className="flex rounded-lg border border-border p-0.5" role="tablist" aria-label="Cómo añadir">
            {(["buscar", "pegar"] as const).map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={cn(
                  "flex-1 rounded-md px-3 py-1.5 text-sm",
                  tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                )}
              >
                {t === "buscar" ? "Buscar" : "Pegar lista"}
              </button>
            ))}
          </div>
          {tab === "buscar" ? (
            <SearchPanel words={prototype.allWords(state)} inLesson={inLesson} onAdd={(h) => add([h])} />
          ) : (
            <PastePanel
              lookup={(h) => prototype.word(state, h)}
              inLesson={inLesson}
              onAdd={(hanzis) => {
                // Las que no están en el catálogo se crean "sin contenido": en la
                // app real generan una petición para que el admin las cure.
                for (const h of hanzis) {
                  if (!prototype.word(state, h)) {
                    prototype.saveWord({
                      hanzi: h,
                      hsk: 0,
                      pinyin: "",
                      meaningEn: "",
                      status: "sin contenido",
                      senses: [{ pinyin: "", category: "", meaning: { es: "", en: "" }, sentences: [] }],
                    });
                  }
                }
                add(hanzis);
              }}
            />
          )}
        </section>
      </div>
    </ProtoShell>
  );
}

function SearchPanel({ words, inLesson, onAdd }: { words: ProtoWord[]; inLesson: Set<string>; onAdd: (h: string) => void }) {
  const [q, setQ] = useState("");
  const [hsk, setHsk] = useState<number | null>(null);
  const results = useMemo(() => searchWords(words, q, hsk).slice(0, 40), [words, q, hsk]);
  return (
    <div className="flex flex-col gap-3">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Hanzi, pinyin (renshi) o significado"
        aria-label="Buscar palabra"
        className="h-9 rounded-lg border border-input bg-background px-3"
      />
      <div className="flex gap-1" role="group" aria-label="Nivel HSK">
        {[null, 1, 2, 3].map((n) => (
          <button
            key={n ?? "todas"}
            onClick={() => setHsk(n)}
            aria-pressed={hsk === n}
            className={cn(
              "rounded-md border border-border px-2.5 py-1 text-xs",
              hsk === n ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
            )}
          >
            {n ? `HSK ${n}` : "Todas"}
          </button>
        ))}
      </div>
      <ul className="flex max-h-[28rem] flex-col gap-1 overflow-y-auto">
        {results.map((w) => (
          <li key={w.hanzi} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted">
            <span className="font-hanzi text-xl">{w.hanzi}</span>
            <span className="min-w-0 flex-1 truncate text-sm">
              <span className="font-medium">{w.pinyin}</span>{" "}
              <span className="text-muted-foreground">{w.senses[0]?.meaning.es || w.meaningEn}</span>
            </span>
            <StatusBadge status={w.status} />
            <Button
              size="icon-sm"
              variant="outline"
              aria-label={`Añadir ${w.hanzi}`}
              disabled={inLesson.has(w.hanzi)}
              onClick={() => onAdd(w.hanzi)}
            >
              <Plus />
            </Button>
          </li>
        ))}
        {!results.length && <li className="p-2 text-sm text-muted-foreground">Sin resultados.</li>}
      </ul>
    </div>
  );
}

function PastePanel({
  lookup,
  inLesson,
  onAdd,
}: {
  lookup: (h: string) => ProtoWord | null;
  inLesson: Set<string>;
  onAdd: (hanzis: string[]) => void;
}) {
  const [text, setText] = useState("");
  const parsed = parsePastedList(text);
  const fresh = parsed.filter((h) => !inLesson.has(h));
  return (
    <div className="flex flex-col gap-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        placeholder={"Pega aquí los hanzi de la lección de tu libro,\np. ej.: 你 好 吗 我 很 呢 也"}
        aria-label="Lista de hanzi"
        className="rounded-lg border border-input bg-background p-3 font-hanzi"
      />
      {parsed.length > 0 && (
        <>
          <ul className="flex flex-wrap gap-1.5">
            {parsed.map((h) => {
              const w = lookup(h);
              return (
                <li
                  key={h}
                  className={cn(
                    "rounded-md border px-2 py-1 font-hanzi",
                    inLesson.has(h) ? "border-border text-muted-foreground line-through" : "border-border",
                    w?.status === "curada" && "border-rating-3",
                    !w && "border-dashed",
                  )}
                  title={inLesson.has(h) ? "Ya está en la lección" : w ? w.status : "No está en el catálogo"}
                >
                  {h}
                </li>
              );
            })}
          </ul>
          <p className="text-xs text-muted-foreground">
            Borde verde: con contenido. Borde punteado: no está en el catálogo, se pedirá al admin. Tachado: ya está.
          </p>
          <Button disabled={!fresh.length} onClick={() => (onAdd(fresh), setText(""))}>
            <Plus /> Añadir {fresh.length} palabras
          </Button>
        </>
      )}
    </div>
  );
}

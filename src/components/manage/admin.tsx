"use client";

import { useMemo, useState } from "react";
import { Check, CircleCheck, CircleDashed, Eye, Inbox, Pencil, Plus, Replace, Save, Trash2, X } from "lucide-react";
import {
  acceptSuggestionAction,
  rejectSuggestionAction,
  saveWordAction,
  setWordPublishedAction,
} from "@/actions/manage";
import { Button, buttonVariants } from "@/components/ui/button";
import { MultiSelect } from "@/components/ui/multi-select";
import { Link } from "@/i18n/navigation";
import type { EditableSense, EditableSentence, EditableWord, Suggestion, WordStatus, WordSummary } from "@/lib/content";
import { toneless } from "@/lib/pinyin";
import { cn } from "@/lib/utils";
import { LevelNote, useLevelChecker } from "./level-check";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Empty, inputCls, ManageShell, useRunner } from "./shell";

// Vistas del admin: la base común (solo admin la edita), el editor de cada
// palabra y las sugerencias de las docentes. Solo en español: es para Ever.

const ADMIN = { label: "Administración", href: "/admin" };
const LEVEL_LABELS = {
  empty: "Escribe la frase en chino para comprobar su nivel.",
  ok: (l: number | string) => `Nivel correcto (≤ HSK ${l}).`,
  over: (l: number | string, pieces: string) => `Por encima de HSK ${l}: ${pieces}`,
  outside: "fuera de lista",
};

export function StatusBadge({ status }: { status: WordStatus }) {
  const style = {
    curada: "bg-rating-3/25 text-foreground",
    borrador: "bg-rating-2/25 text-foreground",
    "sin contenido": "bg-muted text-muted-foreground",
  }[status];
  return <span className={`rounded-md px-2 py-0.5 text-xs whitespace-nowrap ${style}`}>{status}</span>;
}

const plain = (s: string) => toneless(s).replace(/\s+/g, "");

/** Inicio del admin: la base común con filtros y acciones por fila. */
export function AdminWordsScreen({ words, pendingSuggestions }: { words: WordSummary[]; pendingSuggestions: number }) {
  const { pending, error, run } = useRunner();
  const [q, setQ] = useState("");
  const [hsk, setHsk] = useState<number[]>([]);
  const [status, setStatus] = useState<WordStatus[]>([]);
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return words.filter(
      (w) =>
        (!hsk.length || hsk.includes(w.hsk)) &&
        (!status.length || status.includes(w.status)) &&
        (!query ||
          w.hanzi.includes(query) ||
          w.senses.some(
            (s) =>
              plain(s.pinyin).includes(plain(query)) ||
              s.meaningEs.toLowerCase().includes(query) ||
              s.meaningEn.toLowerCase().includes(query),
          )),
    );
  }, [words, q, hsk, status]);
  const count = (s: WordStatus) => words.filter((w) => w.status === s).length;

  return (
    <ManageShell
      isAdmin
      wide
      crumbs={[]}
      title="Base común"
      error={error}
      actions={
        <>
          <Link href="/admin/suggestions" className={buttonVariants({ variant: pendingSuggestions ? "default" : "outline" })}>
            <Inbox /> Sugerencias{pendingSuggestions ? ` (${pendingSuggestions})` : ""}
          </Link>
          <Link href="/admin/templates" className={buttonVariants({ variant: "outline" })}>
            Plantillas
          </Link>
        </>
      }
    >
      <p className="text-sm text-muted-foreground">
        {words.length} palabras · {count("curada")} curadas · {count("borrador")} en borrador · {count("sin contenido")} sin
        contenido. Solo el admin edita esta base; las docentes la usan en sus colecciones y no ven su estado.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por hanzi, pinyin o significado"
          aria-label="Buscar en la base"
          className={cn(inputCls, "min-w-56 flex-1")}
        />
        <MultiSelect
          label="Nivel"
          selected={hsk}
          onChange={setHsk}
          options={[1, 2, 3].map((n) => ({ value: n, label: `HSK ${n}`, count: words.filter((w) => w.hsk === n).length }))}
        />
        <MultiSelect
          label="Estado"
          selected={status}
          onChange={setStatus}
          options={(["curada", "borrador", "sin contenido"] as WordStatus[]).map((s) => ({ value: s, label: s, count: count(s) }))}
        />
        {/* Siempre presente (deshabilitado si no hay filtros) para que la fila no salte. */}
        <Button variant="ghost" disabled={!q && !hsk.length && !status.length} onClick={() => (setQ(""), setHsk([]), setStatus([]))}>
          Limpiar
        </Button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Palabra</th>
              <th className="px-3 py-2 font-medium">Pinyin</th>
              <th className="px-3 py-2 font-medium">Significado</th>
              <th className="px-3 py-2 font-medium">HSK</th>
              <th className="px-3 py-2 font-medium">Sentidos / frases</th>
              <th className="px-3 py-2 font-medium">Estado</th>
              <th className="px-3 py-2 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 200).map((w) => {
              const href = `/admin/words/${encodeURIComponent(w.hanzi)}`;
              const sentences = w.senses.reduce((n, s) => n + s.sentences, 0);
              const icon = "inline-flex size-8 items-center justify-center rounded-md hover:bg-muted disabled:opacity-30";
              return (
                <tr key={w.id} className="border-t border-border hover:bg-muted/40">
                  <td className="px-3 py-2">
                    <Link href={href} className="font-hanzi text-xl hover:underline">
                      {w.hanzi}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{w.senses[0]?.pinyin}</td>
                  <td className="max-w-80 truncate px-3 py-2 text-muted-foreground">
                    {w.senses[0]?.meaningEs || w.senses[0]?.meaningEn}
                  </td>
                  <td className="px-3 py-2 tabular-nums">{w.hsk || "?"}</td>
                  <td className="px-3 py-2 tabular-nums text-muted-foreground">
                    {w.senses.length} / {sentences}
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge status={w.status} />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-0.5">
                      <Link href={href} className={icon} aria-label={`Editar ${w.hanzi}`} title="Editar">
                        <Pencil className="size-4" />
                      </Link>
                      {sentences ? (
                        <Link href={`${href}/preview`} className={icon} aria-label={`Vista previa de ${w.hanzi}`} title="Vista previa de la tarjeta">
                          <Eye className="size-4" />
                        </Link>
                      ) : (
                        <button className={icon} disabled aria-label={`Vista previa de ${w.hanzi} (sin frases)`} title="Vista previa: hace falta al menos una frase">
                          <Eye className="size-4" />
                        </button>
                      )}
                      {w.status === "curada" ? (
                        <button
                          className={icon}
                          disabled={pending}
                          aria-label={`Pasar ${w.hanzi} a borrador`}
                          title="Pasar a borrador"
                          onClick={() => run(() => setWordPublishedAction(w.id, false))}
                        >
                          <CircleDashed className="size-4" />
                        </button>
                      ) : (
                        <button
                          className={icon}
                          aria-label={`Publicar ${w.hanzi}`}
                          title={w.senses[0]?.meaningEs ? "Publicar (marcar como curada)" : "Publicar: falta el significado en español"}
                          disabled={!w.senses[0]?.meaningEs || pending}
                          onClick={() => run(() => setWordPublishedAction(w.id, true))}
                        >
                          <CircleCheck className="size-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {filtered.length > 200 && <p className="text-sm text-muted-foreground">Mostrando 200 de {filtered.length}; afina la búsqueda.</p>}
    </ManageShell>
  );
}

// ── Editor de palabra ───────────────────────────────────────────────────
const emptySentence = (): EditableSentence => ({ zh: "", pinyin: "", es: "", en: "" });
const emptySense = (pinyin: string): EditableSense => ({
  pinyin,
  category: "",
  meaningEs: "",
  meaningEn: "",
  nuanceEs: "",
  nuanceEn: "",
  sentences: [emptySentence()],
});

const CATEGORIES: [string, string][] = [
  ["noun", "sustantivo"],
  ["verb", "verbo"],
  ["adjective", "adjetivo"],
  ["adverb", "adverbio"],
  ["pronoun", "pronombre"],
  ["numeral", "numeral"],
  ["measure word", "clasificador"],
  ["preposition", "preposición"],
  ["conjunction", "conjunción"],
  ["interjection", "interjección"],
  ["particle", "partícula"],
  ["affix", "afijo"],
  ["set phrase", "expresión"],
];

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("flex flex-col gap-1 text-sm", className)}>
      <span className="text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export function AdminWordEditor({ word: stored }: { word: EditableWord }) {
  const { pending, error, run } = useRunner();
  const [confirm, confirmDialog] = useConfirm();
  // El admin va en español (solo lo usa Ever): textos fijos.
  const ask = (title: string, confirmLabel: string, description?: string) =>
    confirm({ title, description, confirmLabel, cancelLabel: "Cancelar", destructive: true });
  const checker = useLevelChecker();
  // Una palabra sin frases abre con una vacía, lista para escribir.
  const initial = (): EditableWord => ({
    ...stored,
    senses: stored.senses.map((s) => (s.sentences.length ? s : { ...s, sentences: [emptySentence()] })),
  });
  const [word, setWord] = useState<EditableWord>(initial);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  // Tras guardar, el servidor devuelve la palabra con los ids nuevos: se
  // toma esa versión para que el siguiente guardado no duplique filas.
  const [base, setBase] = useState(stored);
  if (base !== stored) {
    setBase(stored);
    setWord(initial());
    setDirty(false);
  }

  const edit = (fn: (w: EditableWord) => EditableWord) => {
    setWord((w) => fn(structuredClone(w)));
    setDirty(true);
    setSaved(false);
  };
  const editSense = (si: number, fn: (s: EditableSense) => EditableSense) =>
    edit((w) => ({ ...w, senses: w.senses.map((s, i) => (i === si ? fn(s) : s)) }));
  const editSentence = (si: number, ti: number, patch: Partial<EditableSentence>) =>
    editSense(si, (x) => ({ ...x, sentences: x.sentences.map((y, i) => (i === ti ? { ...y, ...patch } : y)) }));

  return (
    <ManageShell
      isAdmin
      crumbs={[ADMIN, { label: word.hanzi }]}
      title={
        <>
          <span className="font-hanzi">{word.hanzi}</span> · {word.senses[0]?.pinyin}
        </>
      }
      error={error}
      actions={
        <>
          {saved && <span className="text-sm text-muted-foreground">Guardado</span>}
          {dirty && (
            <Button
              variant="ghost"
              onClick={async () => {
                if (await ask("¿Descartar los cambios sin guardar?", "Descartar")) {
                  setWord(initial());
                  setDirty(false);
                }
              }}
            >
              Descartar
            </Button>
          )}
          <Link href={`/admin/words/${encodeURIComponent(word.hanzi)}/preview`} className={buttonVariants({ variant: "outline" })}>
            <Eye /> Vista previa
          </Link>
          <Button
            disabled={!dirty || pending}
            onClick={() =>
              run(
                () => saveWordAction(word),
                () => {
                  setDirty(false);
                  setSaved(true);
                },
              )
            }
          >
            <Save /> Guardar
          </Button>
        </>
      }
    >
      {dirty && <p className="text-sm text-muted-foreground">Cambios sin guardar. La vista previa muestra lo último guardado.</p>}
      <section className="grid gap-4 rounded-xl border border-border bg-card p-4 sm:grid-cols-3">
        <Field label="Nivel HSK">
          <input
            type="number"
            min={1}
            max={9}
            value={word.hsk || ""}
            onChange={(e) => edit((w) => ({ ...w, hsk: Number(e.target.value) }))}
            className={inputCls}
          />
        </Field>
        <Field label="Estado">
          <select
            value={word.published ? "1" : "0"}
            onChange={(e) => edit((w) => ({ ...w, published: e.target.value === "1" }))}
            className={inputCls}
          >
            <option value="0">borrador</option>
            <option value="1">curada (revisada)</option>
          </select>
        </Field>
        <div />
        <Field label="Nota cultural (español)">
          <textarea
            rows={3}
            value={word.culturalNoteEs}
            onChange={(e) => edit((w) => ({ ...w, culturalNoteEs: e.target.value }))}
            className="rounded-lg border border-input bg-background p-2"
          />
        </Field>
        <Field label="Nota cultural (inglés)">
          <textarea
            rows={3}
            value={word.culturalNoteEn}
            onChange={(e) => edit((w) => ({ ...w, culturalNoteEn: e.target.value }))}
            className="rounded-lg border border-input bg-background p-2"
          />
        </Field>
      </section>

      {word.senses.map((s, si) => (
        <section key={s.id ?? `new-${si}`} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Sentido {si + 1}</h2>
            {word.senses.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  const n = s.sentences.filter((t) => t.zh.trim()).length;
                  const label = s.meaningEs || s.meaningEn || `sentido ${si + 1}`;
                  if (
                    await ask(
                      `¿Quitar el sentido "${label}"${n ? ` y sus ${n} frase${n === 1 ? "" : "s"}` : ""}?`,
                      "Quitar sentido",
                      "El cambio se aplica al guardar. Si alguna lección lo usa, no se podrá guardar.",
                    )
                  )
                    edit((w) => ({ ...w, senses: w.senses.filter((_, i) => i !== si) }));
                }}
              >
                <Trash2 /> Quitar sentido
              </Button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <Field label="Pinyin">
              <input value={s.pinyin} onChange={(e) => editSense(si, (x) => ({ ...x, pinyin: e.target.value }))} className={inputCls} />
            </Field>
            <Field label="Categoría">
              <select value={s.category} onChange={(e) => editSense(si, (x) => ({ ...x, category: e.target.value }))} className={inputCls}>
                <option value="">—</option>
                {/* Valor que no está en la lista (p. ej. heredado del temario): se conserva. */}
                {s.category && !CATEGORIES.some(([v]) => v === s.category) && <option value={s.category}>{s.category}</option>}
                {CATEGORIES.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Significado (español)">
              <input value={s.meaningEs} onChange={(e) => editSense(si, (x) => ({ ...x, meaningEs: e.target.value }))} className={inputCls} />
            </Field>
            <Field label="Significado (inglés)">
              <input value={s.meaningEn} onChange={(e) => editSense(si, (x) => ({ ...x, meaningEn: e.target.value }))} className={inputCls} />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Matiz de uso (español)">
              <input value={s.nuanceEs} onChange={(e) => editSense(si, (x) => ({ ...x, nuanceEs: e.target.value }))} className={inputCls} />
            </Field>
            <Field label="Matiz de uso (inglés)">
              <input value={s.nuanceEn} onChange={(e) => editSense(si, (x) => ({ ...x, nuanceEn: e.target.value }))} className={inputCls} />
            </Field>
          </div>

          <h3 className="mt-2 font-medium">Frases</h3>
          {s.sentences.map((t, ti) => (
            <div key={t.id ?? `new-${ti}`} className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-2">
              <Field label="Chino">
                <input value={t.zh} onChange={(e) => editSentence(si, ti, { zh: e.target.value })} className={cn(inputCls, "font-hanzi text-lg")} />
              </Field>
              <Field label="Pinyin">
                <input value={t.pinyin} onChange={(e) => editSentence(si, ti, { pinyin: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Español">
                <input value={t.es} onChange={(e) => editSentence(si, ti, { es: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Inglés">
                <input value={t.en} onChange={(e) => editSentence(si, ti, { en: e.target.value })} className={inputCls} />
              </Field>
              <div className="flex items-center justify-between gap-2 sm:col-span-2">
                <LevelNote checker={checker} zh={t.zh} keyword={word.hanzi} level={word.hsk} labels={LEVEL_LABELS} />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    if (!t.zh.trim() || (await ask(`¿Quitar la frase "${t.zh}"?`, "Quitar frase", "El cambio se aplica al guardar.")))
                      editSense(si, (x) => ({ ...x, sentences: x.sentences.filter((_, i) => i !== ti) }));
                  }}
                >
                  <Trash2 /> Quitar
                </Button>
              </div>
            </div>
          ))}
          <Button
            variant="outline"
            className="self-start"
            onClick={() => editSense(si, (x) => ({ ...x, sentences: [...x.sentences, emptySentence()] }))}
          >
            <Plus /> Añadir frase
          </Button>
        </section>
      ))}

      <Button
        variant="outline"
        className="self-start"
        onClick={() => edit((w) => ({ ...w, senses: [...w.senses, emptySense(w.senses[0]?.pinyin ?? "")] }))}
      >
        <Plus /> Añadir sentido
      </Button>
      {confirmDialog}
    </ManageShell>
  );
}

// ── Sugerencias de las docentes ─────────────────────────────────────────
export function SuggestionsScreen({ suggestions }: { suggestions: Suggestion[] }) {
  const { pending, error, run } = useRunner();
  const [rejecting, setRejecting] = useState<{ id: string; note: string } | null>(null);

  return (
    <ManageShell isAdmin crumbs={[ADMIN, { label: "Sugerencias" }]} title="Sugerencias de las docentes" error={error}>
      <p className="text-sm text-muted-foreground">
        Frases que las docentes proponen para la base común. Mientras no decidas, siguen saliendo en las clases de quien las
        escribió. Si la rechazas, sigue siendo suya.
      </p>
      {suggestions.length ? (
        <ul className="flex flex-col gap-3">
          {suggestions.map((s) => (
            <li key={s.id} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">
                <Link href={`/admin/words/${encodeURIComponent(s.hanzi)}`} className="font-hanzi text-lg text-foreground hover:underline">
                  {s.hanzi}
                </Link>{" "}
                · HSK {s.hsk || "?"} · {s.senseMeaning || "sin significado"} · de {s.teacher || "una docente"}
              </p>
              <div className={cn("grid gap-3", s.original && "sm:grid-cols-2")}>
                {s.original && (
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground">Original</p>
                    <p className="font-hanzi text-xl">{s.original.zh}</p>
                    <p className="text-sm text-muted-foreground">{s.original.pinyin}</p>
                  </div>
                )}
                <div className="rounded-lg border border-primary/50 p-3">
                  <p className="text-xs text-muted-foreground">{s.original ? "Propuesta" : "Frase nueva"}</p>
                  <p className="font-hanzi text-xl">{s.zh}</p>
                  <p className="text-sm text-muted-foreground">{s.pinyin}</p>
                  {s.es && <p className="text-sm">{s.es}</p>}
                  {s.en && <p className="text-sm text-muted-foreground">{s.en}</p>}
                </div>
              </div>
              {rejecting?.id === s.id ? (
                <form
                  className="flex flex-wrap gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    run(() => rejectSuggestionAction(s.id, rejecting.note), () => setRejecting(null));
                  }}
                >
                  <input
                    autoFocus
                    value={rejecting.note}
                    onChange={(e) => setRejecting({ ...rejecting, note: e.target.value })}
                    placeholder="Motivo para la docente (opcional)"
                    aria-label="Motivo del rechazo"
                    className={cn(inputCls, "flex-1")}
                  />
                  <Button type="submit" variant="destructive" disabled={pending}>
                    Rechazar
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setRejecting(null)}>
                    Cancelar
                  </Button>
                </form>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {s.original && (
                    <Button disabled={pending} onClick={() => run(() => acceptSuggestionAction(s.id, true))}>
                      <Replace /> Aceptar y reemplazar la original
                    </Button>
                  )}
                  <Button
                    variant={s.original ? "outline" : "default"}
                    disabled={pending}
                    onClick={() => run(() => acceptSuggestionAction(s.id, false))}
                  >
                    <Check /> Aceptar como frase nueva
                  </Button>
                  <Button variant="ghost" disabled={pending} onClick={() => setRejecting({ id: s.id, note: "" })}>
                    <X /> Rechazar
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <Empty>No hay sugerencias pendientes.</Empty>
      )}
    </ManageShell>
  );
}

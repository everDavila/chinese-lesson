"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Check, CircleCheck, CircleDashed, Eye, Inbox, Pencil, Plus, Replace, Save, Star, Trash2, X } from "lucide-react";
import {
  acceptSuggestionAction,
  rejectSuggestionAction,
  saveWordAction,
  setWordPublishedAction,
} from "@/actions/manage";
import { Button, buttonVariants } from "@/components/ui/button";
import { MultiSelect } from "@/components/ui/multi-select";
import { Link } from "@/i18n/navigation";
import type { EditableSense, EditableSentence, EditableWord, Suggestion, WordSearch, WordStatus } from "@/lib/content";
import { cn } from "@/lib/utils";
import { LevelNote, useLevelChecker } from "./level-check";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Empty, inputCls, ManageShell, useRunner } from "./shell";
import { HSK_LEVELS, hskLabel, useWordSearch } from "./use-word-search";

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

/** Filas por página en la tabla del admin. */
export const ADMIN_PAGE = 200;

/** Inicio del admin: la base común con filtros y acciones por fila. */
export function AdminWordsScreen({ initial, pendingSuggestions }: { initial: WordSearch; pendingSuggestions: number }) {
  const { pending, error, run } = useRunner();
  const [q, setQ] = useState("");
  const [hsk, setHsk] = useState<number[]>([]);
  const [status, setStatus] = useState<WordStatus[]>([]);
  // Tras publicar o despublicar, se vuelve a pedir la página (cambia el estado).
  const [version, setVersion] = useState(0);
  const { result, loading, failed } = useWordSearch(q, hsk, status, ADMIN_PAGE, initial, version);
  const data = result ?? initial;
  const rows = data.rows;
  const count = (s: WordStatus) => data.statuses[s] ?? 0;
  const totalWords = Object.values(data.statuses).reduce((a, b) => a + (b ?? 0), 0);
  const act = (fn: () => ReturnType<typeof setWordPublishedAction>) => run(fn, () => setVersion((v) => v + 1));

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
        {totalWords} palabras · {count("curada")} curadas · {count("borrador")} en borrador · {count("sin contenido")} sin
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
          options={HSK_LEVELS.map((n) => ({ value: n, label: `HSK ${hskLabel(n)}`, count: data.levels[n] }))}
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
      {failed && <p className="text-sm text-destructive">No se pudo buscar. Revisa la conexión.</p>}
      <div className={cn("overflow-x-auto rounded-xl border border-border transition-opacity", loading && "opacity-60")} aria-busy={loading}>
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
            {rows.map((w) => {
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
                  <td className="px-3 py-2 whitespace-nowrap tabular-nums">{hskLabel(w.hsk)}</td>
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
                      <Link href={`${href}/preview`} className={icon} aria-label={`Vista previa de ${w.hanzi}`} title="Vista previa de la tarjeta">
                        <Eye className="size-4" />
                      </Link>
                      {w.status === "curada" ? (
                        <button
                          className={icon}
                          disabled={pending}
                          aria-label={`Pasar ${w.hanzi} a borrador`}
                          title="Pasar a borrador"
                          onClick={() => act(() => setWordPublishedAction(w.id, false))}
                        >
                          <CircleDashed className="size-4" />
                        </button>
                      ) : (
                        <button
                          className={icon}
                          aria-label={`Publicar ${w.hanzi}`}
                          title={w.senses[0]?.meaningEs ? "Publicar (marcar como curada)" : "Publicar: falta el significado en español"}
                          disabled={!w.senses[0]?.meaningEs || pending}
                          onClick={() => act(() => setWordPublishedAction(w.id, true))}
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
      {data.total > rows.length && (
        <p className="text-sm text-muted-foreground">
          Mostrando {rows.length} de {data.total}; afina la búsqueda.
        </p>
      )}
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

const textareaCls = cn(inputCls, "h-auto resize-y py-2 leading-relaxed");

/** Dónde aparece en la tarjeta lo que se edita: el admin usa los mismos nombres. */
function CardHint({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

/** Bloque del editor: título y pista, sin caja (las cajas anidadas confundían). */
function Block({ title, hint, children }: { title: React.ReactNode; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        {hint && <CardHint>{hint}</CardHint>}
      </div>
      {children}
    </section>
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

      <Block title="Palabra" hint="Vale para todos sus sentidos.">
        <div className="grid gap-4 sm:grid-cols-4">
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
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="font-medium">Nota cultural</h3>
          <CardHint>En la tarjeta: «Nota cultural», en cualquier sentido que se presente.</CardHint>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Español">
              <textarea rows={4} value={word.culturalNoteEs} onChange={(e) => edit((w) => ({ ...w, culturalNoteEs: e.target.value }))} className={textareaCls} />
            </Field>
            <Field label="Inglés">
              <textarea rows={4} value={word.culturalNoteEn} onChange={(e) => edit((w) => ({ ...w, culturalNoteEn: e.target.value }))} className={textareaCls} />
            </Field>
          </div>
        </div>
      </Block>

      <Block
        title="Sentidos"
        hint={
          <>
            Una lección presenta <strong className="font-medium text-foreground">un</strong> sentido: la tarjeta muestra su significado, su matiz y
            sus frases. Los demás sentidos salen abajo como «Otros usos (otras lecciones)».
          </>
        }
      >
        {word.senses.map((s, si) => (
          <SenseEditor
            key={s.id ?? `new-${si}`}
            sense={s}
            index={si}
            hanzi={word.hanzi}
            level={word.hsk}
            checker={checker}
            canRemove={word.senses.length > 1}
            onChange={(fn) => editSense(si, fn)}
            onRemove={async () => {
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
            onRemoveSentence={async (ti) => {
              const t = s.sentences[ti];
              if (!t.zh.trim() || (await ask(`¿Quitar la frase "${t.zh}"?`, "Quitar frase", "El cambio se aplica al guardar.")))
                editSense(si, (x) => ({ ...x, sentences: x.sentences.filter((_, i) => i !== ti) }));
            }}
          />
        ))}
        <Button
          variant="outline"
          className="h-11 border-dashed"
          onClick={() => edit((w) => ({ ...w, senses: [...w.senses, emptySense(w.senses[0]?.pinyin ?? "")] }))}
        >
          <Plus /> Añadir sentido
        </Button>
      </Block>
      {confirmDialog}
    </ManageShell>
  );
}

// ── Un sentido y sus frases ─────────────────────────────────────────────
type LevelChecker = ReturnType<typeof useLevelChecker>;

function SenseEditor({
  sense: s,
  index,
  hanzi,
  level,
  checker,
  canRemove,
  onChange,
  onRemove,
  onRemoveSentence,
}: {
  sense: EditableSense;
  index: number;
  hanzi: string;
  level: number;
  checker: LevelChecker;
  canRemove: boolean;
  onChange: (fn: (s: EditableSense) => EditableSense) => void;
  onRemove: () => void;
  onRemoveSentence: (ti: number) => void;
}) {
  const category = CATEGORIES.find(([v]) => v === s.category)?.[1] ?? s.category;
  const editSentence = (ti: number, patch: Partial<EditableSentence>) =>
    onChange((x) => ({ ...x, sentences: x.sentences.map((y, i) => (i === ti ? { ...y, ...patch } : y)) }));
  // Subir o bajar = orden de enseñanza (la rotación lo sigue; la maestra va primera igual).
  const move = (ti: number, to: number) =>
    onChange((x) => {
      const list = [...x.sentences];
      [list[ti], list[to]] = [list[to], list[ti]];
      return { ...x, sentences: list };
    });
  // Una sola maestra por sentido: marcar una desmarca las demás; volver a tocarla la quita.
  const toggleMaster = (ti: number) =>
    onChange((x) => ({ ...x, sentences: x.sentences.map((y, i) => ({ ...y, master: i === ti ? !y.master : false })) }));

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-4 sm:p-5" aria-label={`Sentido ${index + 1}`}>
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="rounded-md bg-muted px-2 py-0.5 text-sm text-muted-foreground">Sentido {index + 1}</span>
        <h3 className="min-w-0 text-lg font-semibold">{s.meaningEs || s.meaningEn || <span className="text-muted-foreground">Sin significado</span>}</h3>
        {category && <span className="text-sm text-muted-foreground">· {category}</span>}
        {canRemove && (
          <Button variant="ghost" size="sm" className="ml-auto text-muted-foreground hover:text-destructive" onClick={onRemove}>
            <Trash2 /> Quitar sentido
          </Button>
        )}
      </header>

      <div className="grid gap-4 sm:grid-cols-4">
        <Field label="Pinyin">
          <input value={s.pinyin} onChange={(e) => onChange((x) => ({ ...x, pinyin: e.target.value }))} className={inputCls} />
        </Field>
        <Field label="Categoría">
          <select value={s.category} onChange={(e) => onChange((x) => ({ ...x, category: e.target.value }))} className={inputCls}>
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
          <input value={s.meaningEs} onChange={(e) => onChange((x) => ({ ...x, meaningEs: e.target.value }))} className={inputCls} />
        </Field>
        <Field label="Significado (inglés)">
          <input value={s.meaningEn} onChange={(e) => onChange((x) => ({ ...x, meaningEn: e.target.value }))} className={inputCls} />
        </Field>
      </div>

      <div className="flex flex-col gap-2">
        <h4 className="font-medium">Matiz</h4>
        <CardHint>En la tarjeta: «Matiz», cuando se presenta este sentido.</CardHint>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Español">
            <textarea rows={2} value={s.nuanceEs} onChange={(e) => onChange((x) => ({ ...x, nuanceEs: e.target.value }))} className={textareaCls} />
          </Field>
          <Field label="Inglés">
            <textarea rows={2} value={s.nuanceEn} onChange={(e) => onChange((x) => ({ ...x, nuanceEn: e.target.value }))} className={textareaCls} />
          </Field>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h4 className="font-medium">Frases</h4>
        <CardHint>
          <Star className="inline size-3.5 fill-current align-[-2px] text-primary" /> marca la frase maestra: sale en todas las clases, la
          primera. Las flechas cambian el orden de enseñanza.
        </CardHint>
        <ol className="overflow-hidden rounded-xl border border-border bg-background/60">
          {s.sentences.map((t, ti) => (
            <SentenceEditor
              key={t.id ?? `new-${ti}`}
              sentence={t}
              index={ti}
              last={ti === s.sentences.length - 1}
              hanzi={hanzi}
              level={level}
              checker={checker}
              onChange={(patch) => editSentence(ti, patch)}
              onMove={(to) => move(ti, to)}
              onToggleMaster={() => toggleMaster(ti)}
              onRemove={() => onRemoveSentence(ti)}
            />
          ))}
        </ol>
        <Button
          variant="ghost"
          className="self-start"
          onClick={() => onChange((x) => ({ ...x, sentences: [...x.sentences, emptySentence()] }))}
        >
          <Plus /> Añadir frase
        </Button>
      </div>
    </section>
  );
}

function SentenceEditor({
  sentence: t,
  index,
  last,
  hanzi,
  level,
  checker,
  onChange,
  onMove,
  onToggleMaster,
  onRemove,
}: {
  sentence: EditableSentence;
  index: number;
  last: boolean;
  hanzi: string;
  level: number;
  checker: LevelChecker;
  onChange: (patch: Partial<EditableSentence>) => void;
  onMove: (to: number) => void;
  onToggleMaster: () => void;
  onRemove: () => void;
}) {
  const n = index + 1;
  return (
    // La maestra se ve como en la tarjeta: fondo claro y franja de acento.
    <li
      className={cn(
        "relative grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 border-t border-border p-3 first:border-t-0 sm:gap-4 sm:p-4",
        t.master && "bg-card before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-primary/70",
      )}
    >
      {/* Orden: a la izquierda, lejos de «Quitar». */}
      <div className="flex flex-col items-center gap-0.5">
        <Button variant="ghost" size="icon-sm" disabled={index === 0} onClick={() => onMove(index - 1)} aria-label={`Subir la frase ${n}`}>
          <ArrowUp />
        </Button>
        <span className="text-sm text-muted-foreground tabular-nums">{n}</span>
        <Button variant="ghost" size="icon-sm" disabled={last} onClick={() => onMove(index + 1)} aria-label={`Bajar la frase ${n}`}>
          <ArrowDown />
        </Button>
      </div>

      <div className="flex min-w-0 flex-col gap-2">
        <div>
          <Button
            variant={t.master ? "secondary" : "ghost"}
            size="sm"
            aria-pressed={Boolean(t.master)}
            onClick={onToggleMaster}
            className={cn(!t.master && "text-muted-foreground")}
          >
            <Star className={cn(t.master && "fill-current text-primary")} />
            {t.master ? "Frase maestra" : "Hacer maestra"}
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input
            value={t.zh}
            onChange={(e) => onChange({ zh: e.target.value })}
            placeholder="Frase en chino"
            aria-label={`Frase ${n} en chino`}
            className={cn(inputCls, "h-11 w-full font-hanzi text-xl")}
          />
          <input
            value={t.pinyin}
            onChange={(e) => onChange({ pinyin: e.target.value })}
            placeholder="Pinyin"
            aria-label={`Pinyin de la frase ${n}`}
            className={cn(inputCls, "h-11 w-full")}
          />
          <label className="flex min-w-0 items-center gap-2">
            <span className="w-6 text-xs font-medium text-muted-foreground">ES</span>
            <input value={t.es} onChange={(e) => onChange({ es: e.target.value })} placeholder="Traducción al español" aria-label={`Frase ${n} en español`} className={cn(inputCls, "w-full flex-1")} />
          </label>
          <label className="flex min-w-0 items-center gap-2">
            <span className="w-6 text-xs font-medium text-muted-foreground">EN</span>
            <input value={t.en} onChange={(e) => onChange({ en: e.target.value })} placeholder="English translation" aria-label={`Frase ${n} en inglés`} className={cn(inputCls, "w-full flex-1")} />
          </label>
        </div>
        <LevelNote checker={checker} zh={t.zh} keyword={hanzi} level={level} labels={LEVEL_LABELS} />
      </div>

      <Button
        variant="ghost"
        size="icon-sm"
        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        onClick={onRemove}
        aria-label={`Quitar la frase ${n}`}
        title="Quitar frase"
      >
        <Trash2 />
      </Button>
    </li>
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

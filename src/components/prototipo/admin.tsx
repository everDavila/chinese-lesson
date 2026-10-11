"use client";

import { useEffect, useMemo, useState } from "react";
import { CircleCheck, CircleDashed, Eye, Pencil, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { Sense, Sentence } from "@/lib/lesson-types";
import { makeLevelChecker, type Levels } from "@/lib/level-check";
import { cn } from "@/lib/utils";
import { Empty, ProtoShell, StatusBadge } from "./shell";
import { prototype, searchWords, usePrototype, type ProtoWord, type WordStatus } from "./store";

const ADMIN_CRUMBS = [
  { label: "Prototipo", href: "/prototipo" },
  { label: "Admin", href: "/prototipo/admin" },
];

/** Inicio del admin: la base común (catálogo) y acceso a plantillas. */
export function AdminWordsScreen() {
  const state = usePrototype();
  const [q, setQ] = useState("");
  const [hsk, setHsk] = useState<number | null>(null);
  const [status, setStatus] = useState<WordStatus | null>(null);
  const all = prototype.allWords(state);
  const filtered = useMemo(
    () => searchWords(all, q, hsk).filter((w) => !status || w.status === status),
    [all, q, hsk, status],
  );
  const count = (s: WordStatus) => all.filter((w) => w.status === s).length;

  return (
    <ProtoShell
      crumbs={[ADMIN_CRUMBS[0], { label: "Admin" }]}
      title="Base común"
      actions={
        <Link href="/prototipo/admin/plantillas" className={buttonVariants({ variant: "outline" })}>
          Plantillas
        </Link>
      }
    >
      <p className="text-sm text-muted-foreground">
        {all.length} palabras · {count("curada")} curadas · {count("borrador")} en borrador ·{" "}
        {count("sin contenido")} sin contenido. Solo el admin edita esta base; las docentes la usan en sus colecciones.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por hanzi, pinyin o significado"
          aria-label="Buscar en la base"
          className="h-9 min-w-56 flex-1 rounded-lg border border-input bg-background px-3"
        />
        <Filter value={hsk} onChange={setHsk} options={[null, 1, 2, 3]} label={(n) => (n ? `HSK ${n}` : "Todo HSK")} />
        <Filter
          value={status}
          onChange={setStatus}
          options={[null, "curada", "borrador", "sin contenido"] as (WordStatus | null)[]}
          label={(s) => s ?? "Todo estado"}
        />
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
              <th className="px-3 py-2 font-medium">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 200).map((w) => (
              <tr key={w.hanzi} className="border-t border-border hover:bg-muted/40">
                <td className="px-3 py-2">
                  <Link href={`/prototipo/admin/palabras/${encodeURIComponent(w.hanzi)}`} className="font-hanzi text-xl hover:underline">
                    {w.hanzi}
                  </Link>
                </td>
                <td className="px-3 py-2">{w.pinyin}</td>
                <td className="max-w-80 truncate px-3 py-2 text-muted-foreground">{w.senses[0]?.meaning.es || w.meaningEn}</td>
                <td className="px-3 py-2 tabular-nums">{w.hsk || "?"}</td>
                <td className="px-3 py-2 tabular-nums text-muted-foreground">
                  {w.senses.length} / {w.senses.reduce((n, s) => n + s.sentences.length, 0)}
                </td>
                <td className="px-3 py-2">
                  <StatusBadge status={w.status} />
                </td>
                <td className="px-3 py-2">
                  <RowActions word={w} edited={Boolean(state.words[w.hanzi])} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length > 200 && <p className="text-sm text-muted-foreground">Mostrando 200 de {filtered.length}; afina la búsqueda.</p>}
    </ProtoShell>
  );
}

// Acciones por fila: editar, vista previa, publicar/borrador y restablecer.
const DEMO_HANZI = new Set(["家", "东西", "认识", "知道", "了解", "意思", "觉得", "关心", "习惯", "文化"]);
function RowActions({ word, edited }: { word: ProtoWord; edited: boolean }) {
  const state = usePrototype();
  const href = `/prototipo/admin/palabras/${encodeURIComponent(word.hanzi)}`;
  const icon = "inline-flex size-8 items-center justify-center rounded-md hover:bg-muted disabled:opacity-30";
  const canPreview = DEMO_HANZI.has(word.hanzi) && word.status === "curada";
  return (
    <div className="flex items-center gap-0.5">
      <Link href={href} className={icon} aria-label={`Editar ${word.hanzi}`} title="Editar">
        <Pencil className="size-4" />
      </Link>
      {canPreview ? (
        <Link
          href={`/present?palabras=${encodeURIComponent(word.hanzi)}`}
          className={icon}
          aria-label={`Vista previa de ${word.hanzi}`}
          title="Vista previa de la tarjeta"
        >
          <Eye className="size-4" />
        </Link>
      ) : (
        <button className={icon} disabled aria-label={`Vista previa de ${word.hanzi} (sin contenido curado)`} title="Vista previa: solo con contenido curado">
          <Eye className="size-4" />
        </button>
      )}
      {word.status === "curada" ? (
        <button
          className={icon}
          aria-label={`Pasar ${word.hanzi} a borrador`}
          title="Pasar a borrador (deja de verse para las docentes)"
          onClick={() => prototype.setStatus(state, word.hanzi, "borrador")}
        >
          <CircleDashed className="size-4" />
        </button>
      ) : (
        <button
          className={icon}
          aria-label={`Publicar ${word.hanzi}`}
          title={word.senses[0]?.meaning.es ? "Publicar (marcar como curada)" : "Publicar: falta el significado en español"}
          disabled={!word.senses[0]?.meaning.es}
          onClick={() => prototype.setStatus(state, word.hanzi, "curada")}
        >
          <CircleCheck className="size-4" />
        </button>
      )}
      <button
        className={icon}
        aria-label={`Restablecer ${word.hanzi}`}
        title="Restablecer: descartar los cambios del admin"
        disabled={!edited}
        onClick={() => window.confirm(`¿Descartar los cambios de ${word.hanzi}?`) && prototype.resetWord(word.hanzi)}
      >
        <RotateCcw className="size-4" />
      </button>
    </div>
  );
}

function Filter<T>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: T[]; label: (v: T) => string }) {
  return (
    <div className="flex gap-1" role="group">
      {options.map((o) => (
        <button
          key={String(o)}
          onClick={() => onChange(o)}
          aria-pressed={value === o}
          className={cn(
            "rounded-md border border-border px-2.5 py-1 text-xs whitespace-nowrap",
            value === o ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
          )}
        >
          {label(o)}
        </button>
      ))}
    </div>
  );
}

// ── Editor de palabra ───────────────────────────────────────────────────
const emptySentence = (): Sentence => ({ zh: "", pinyin: "", es: "", en: "" });
const emptySense = (pinyin: string): Sense => ({ pinyin, category: "", meaning: { es: "", en: "" }, sentences: [emptySentence()] });

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
const inputCls = "h-9 rounded-lg border border-input bg-background px-3";

export function AdminWordEditor({ hanzi }: { hanzi: string }) {
  const state = usePrototype();
  const stored = prototype.word(state, hanzi);
  const [draft, setDraft] = useState<ProtoWord | null>(null);
  const [saved, setSaved] = useState(false);
  const [checker, setChecker] = useState<ReturnType<typeof makeLevelChecker> | null>(null);

  // La lista HSK completa pesa ~200 KB: se carga solo en el editor.
  useEffect(() => {
    import("../../../data/hsk-levels.json").then((m) => setChecker(() => makeLevelChecker(m.default as Levels)));
  }, []);

  const word =
    draft ??
    (stored && stored.senses.every((s) => !s.sentences.length)
      ? { ...stored, senses: stored.senses.map((s) => ({ ...s, sentences: [emptySentence()] })) }
      : stored);
  if (!word) {
    return (
      <ProtoShell crumbs={[...ADMIN_CRUMBS, { label: hanzi }]} title={hanzi}>
        <Empty>Esta palabra no está en el catálogo.</Empty>
      </ProtoShell>
    );
  }
  const edit = (fn: (w: ProtoWord) => ProtoWord) => {
    setDraft(fn(structuredClone(word)));
    setSaved(false);
  };
  const editSense = (si: number, fn: (s: Sense) => Sense) =>
    edit((w) => ({ ...w, senses: w.senses.map((s, i) => (i === si ? fn(s) : s)) }));

  return (
    <ProtoShell
      crumbs={[...ADMIN_CRUMBS, { label: hanzi }]}
      title={`${hanzi} · ${word.pinyin}`}
      actions={
        <>
          {saved && <span className="text-sm text-muted-foreground">Guardado</span>}
          <Button
            disabled={!draft}
            onClick={() => {
              if (!draft) return;
              prototype.saveWord(draft);
              setDraft(null);
              setSaved(true);
            }}
          >
            <Save /> Guardar
          </Button>
        </>
      }
    >
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
            value={word.status}
            onChange={(e) => edit((w) => ({ ...w, status: e.target.value as WordStatus }))}
            className={inputCls}
          >
            <option value="sin contenido">sin contenido</option>
            <option value="borrador">borrador</option>
            <option value="curada">curada (visible para las docentes)</option>
          </select>
        </Field>
        <Field label="Inglés (catálogo)">
          <input value={word.meaningEn} readOnly className={cn(inputCls, "text-muted-foreground")} />
        </Field>
        <Field label="Nota cultural (español)">
          <textarea
            rows={3}
            value={word.culturalNote?.es ?? ""}
            onChange={(e) => edit((w) => ({ ...w, culturalNote: { es: e.target.value, en: w.culturalNote?.en ?? "" } }))}
            className="rounded-lg border border-input bg-background p-2 sm:col-span-1"
          />
        </Field>
        <Field label="Nota cultural (inglés)">
          <textarea
            rows={3}
            value={word.culturalNote?.en ?? ""}
            onChange={(e) => edit((w) => ({ ...w, culturalNote: { es: w.culturalNote?.es ?? "", en: e.target.value } }))}
            className="rounded-lg border border-input bg-background p-2"
          />
        </Field>
      </section>

      {word.senses.map((s, si) => (
        <section key={si} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Sentido {si + 1}</h2>
            {word.senses.length > 1 && (
              <Button variant="ghost" size="sm" onClick={() => edit((w) => ({ ...w, senses: w.senses.filter((_, i) => i !== si) }))}>
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
                <option value="noun">sustantivo</option>
                <option value="verb">verbo</option>
                <option value="adjective">adjetivo</option>
                <option value="adverb">adverbio</option>
                <option value="pronoun">pronombre</option>
                <option value="particle">partícula</option>
                <option value="measure word">clasificador</option>
                <option value="set phrase">expresión</option>
              </select>
            </Field>
            <Field label="Significado (español)">
              <input
                value={s.meaning.es}
                onChange={(e) => editSense(si, (x) => ({ ...x, meaning: { ...x.meaning, es: e.target.value } }))}
                className={inputCls}
              />
            </Field>
            <Field label="Significado (inglés)">
              <input
                value={s.meaning.en}
                onChange={(e) => editSense(si, (x) => ({ ...x, meaning: { ...x.meaning, en: e.target.value } }))}
                className={inputCls}
              />
            </Field>
          </div>
          <Field label="Matiz de uso (español)">
            <input
              value={s.nuance?.es ?? ""}
              onChange={(e) => editSense(si, (x) => ({ ...x, nuance: { es: e.target.value, en: x.nuance?.en ?? "" } }))}
              className={inputCls}
            />
          </Field>

          <h3 className="mt-2 font-medium">Frases</h3>
          {s.sentences.map((t, ti) => {
            const over = checker && t.zh ? checker(t.zh, word.hanzi, word.hsk || 9) : [];
            return (
              <div key={ti} className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-2">
                <Field label="Chino">
                  <input
                    value={t.zh}
                    onChange={(e) =>
                      editSense(si, (x) => ({ ...x, sentences: x.sentences.map((y, i) => (i === ti ? { ...y, zh: e.target.value } : y)) }))
                    }
                    className={cn(inputCls, "font-hanzi text-lg")}
                  />
                </Field>
                <Field label="Pinyin">
                  <input
                    value={t.pinyin}
                    onChange={(e) =>
                      editSense(si, (x) => ({ ...x, sentences: x.sentences.map((y, i) => (i === ti ? { ...y, pinyin: e.target.value } : y)) }))
                    }
                    className={inputCls}
                  />
                </Field>
                <Field label="Español">
                  <input
                    value={t.es}
                    onChange={(e) =>
                      editSense(si, (x) => ({ ...x, sentences: x.sentences.map((y, i) => (i === ti ? { ...y, es: e.target.value } : y)) }))
                    }
                    className={inputCls}
                  />
                </Field>
                <Field label="Inglés">
                  <input
                    value={t.en}
                    onChange={(e) =>
                      editSense(si, (x) => ({ ...x, sentences: x.sentences.map((y, i) => (i === ti ? { ...y, en: e.target.value } : y)) }))
                    }
                    className={inputCls}
                  />
                </Field>
                <div className="flex items-center justify-between gap-2 sm:col-span-2">
                  <p className={cn("text-xs", over.length ? "text-destructive" : "text-muted-foreground")}>
                    {!t.zh
                      ? "Escribe la frase en chino para comprobar su nivel."
                      : over.length
                        ? `Por encima de HSK ${word.hsk || "?"}: ${over.map((o) => `${o.piece} (${o.level ?? "fuera de lista"})`).join(", ")}`
                        : `Nivel correcto (≤ HSK ${word.hsk || "?"}).`}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editSense(si, (x) => ({ ...x, sentences: x.sentences.filter((_, i) => i !== ti) }))}
                  >
                    <Trash2 /> Quitar
                  </Button>
                </div>
              </div>
            );
          })}
          <Button
            variant="outline"
            className="self-start"
            onClick={() => editSense(si, (x) => ({ ...x, sentences: [...x.sentences, emptySentence()] }))}
          >
            <Plus /> Añadir frase
          </Button>
        </section>
      ))}

      <Button variant="outline" className="self-start" onClick={() => edit((w) => ({ ...w, senses: [...w.senses, emptySense(w.pinyin)] }))}>
        <Plus /> Añadir sentido
      </Button>
    </ProtoShell>
  );
}

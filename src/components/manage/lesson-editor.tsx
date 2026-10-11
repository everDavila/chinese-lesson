"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowDown, ArrowUp, MessageSquareText, Pencil, Plus, Presentation, Trash2 } from "lucide-react";
import {
  addItemsAction,
  moveItemAction,
  removeItemAction,
  renameLessonAction,
  setItemSenseAction,
} from "@/actions/manage";
import { startSessionAction } from "@/actions/class";
import { Button } from "@/components/ui/button";
import { MultiSelect } from "@/components/ui/multi-select";
import { Link } from "@/i18n/navigation";
import type { EditableLesson, WordSummary } from "@/lib/content";
import { toneless } from "@/lib/pinyin";
import { cn } from "@/lib/utils";
import { collectionsBase, useHomeCrumbs, type Mode } from "./collections";
import { Empty, inputCls, ManageShell, meaningFor, useRunner } from "./shell";

/** Separa una lista pegada ("你 好\n吗，我") en hanzi; ignora números y signos. */
function parsePastedList(text: string): string[] {
  return [...new Set(text.match(/\p{Script=Han}+/gu) ?? [])];
}

const plain = (s: string) => toneless(s).replace(/\s+/g, "").toLowerCase();

function searchWords(words: WordSummary[], query: string, hsk: number[]) {
  const q = query.trim().toLowerCase();
  const p = plain(q);
  return words.filter((w) => {
    if (hsk.length && !hsk.includes(w.hsk)) return false;
    if (!q) return true;
    return (
      w.hanzi.includes(q) ||
      w.senses.some(
        (s) => plain(s.pinyin).includes(p) || s.meaningEs.toLowerCase().includes(q) || s.meaningEn.toLowerCase().includes(q),
      )
    );
  });
}

/** Editor de una lección: palabras, sentido elegido, orden y añadir. */
export function LessonEditor({
  mode,
  isAdmin,
  collection,
  lesson,
  words,
}: {
  mode: Mode;
  isAdmin: boolean;
  collection: { id: string; title: string };
  lesson: EditableLesson;
  words: WordSummary[];
}) {
  const t = useTranslations("Manage");
  const locale = useLocale();
  const crumbs = useHomeCrumbs(mode);
  const { pending, error, run } = useRunner();
  const [tab, setTab] = useState<"search" | "paste">("search");
  const [renaming, setRenaming] = useState<string | null>(null);
  const base = collectionsBase(mode);
  const lessonHref = `${base}/${collection.id}/${lesson.id}`;

  const inLesson = new Set(lesson.items.map((i) => i.hanzi));
  const byHanzi = useMemo(() => new Map(words.map((w) => [w.hanzi, w])), [words]);
  const add = (hanzis: string[]) => {
    const ids = hanzis.flatMap((h) => byHanzi.get(h)?.senses[0]?.id ?? []);
    if (ids.length) run(() => addItemsAction(lesson.id, ids));
  };
  const presentable = lesson.items.filter((i) => i.classSentences > 0).length;

  return (
    <ManageShell
      isAdmin={isAdmin}
      wide
      crumbs={[...crumbs, { label: collection.title, href: `${base}/${collection.id}` }, { label: lesson.title }]}
      title={lesson.title}
      error={error}
      actions={
        <>
          <Button variant="ghost" onClick={() => setRenaming(lesson.title)}>
            <Pencil /> {t("rename")}
          </Button>
          {mode === "teacher" && (
            <form action={startSessionAction.bind(null, lesson.id)}>
              <Button
                type="submit"
                disabled={!presentable}
                title={presentable < lesson.items.length ? t("presentHint") : undefined}
              >
                <Presentation /> {t("present", { count: presentable })}
              </Button>
            </form>
          )}
        </>
      }
    >
      {renaming !== null && (
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => renameLessonAction(lesson.id, renaming), () => setRenaming(null));
          }}
        >
          <input
            autoFocus
            value={renaming}
            onChange={(e) => setRenaming(e.target.value)}
            aria-label={t("newName")}
            className={cn(inputCls, "flex-1")}
          />
          <Button type="submit" disabled={pending}>
            {t("save")}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setRenaming(null)}>
            {t("cancel")}
          </Button>
        </form>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,26rem)]">
        {/* Palabras de la lección */}
        <section className="flex min-w-0 flex-col gap-2">
          <h2 className="text-lg font-semibold">
            {t("words")} <span className="text-muted-foreground">({lesson.items.length})</span>
          </h2>
          {lesson.items.length ? (
            <ol className="flex flex-col gap-2">
              {lesson.items.map((it, i) => {
                const sense = it.senses.find((s) => s.id === it.senseId) ?? it.senses[0];
                const sentencesHref =
                  mode === "teacher" ? `${lessonHref}/${it.senseId}` : `/admin/words/${encodeURIComponent(it.hanzi)}`;
                return (
                  <li key={it.senseId} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3">
                    <span className="w-5 text-center text-sm text-muted-foreground tabular-nums">{i + 1}</span>
                    <span className="font-hanzi text-3xl">{it.hanzi}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{sense?.pinyin}</span>{" "}
                        <span className="text-muted-foreground">{sense ? meaningFor(locale, sense) : "—"}</span>
                      </p>
                      <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2">
                        <span className="text-xs text-muted-foreground">HSK {it.hsk || "?"}</span>
                        <Link
                          href={sentencesHref}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs hover:bg-muted",
                            it.classSentences ? "text-muted-foreground" : "bg-rating-2/25 text-foreground",
                          )}
                        >
                          <MessageSquareText className="size-3.5" />
                          {it.classSentences ? t("sentencesCount", { count: it.classSentences }) : t("noSentences")}
                        </Link>
                        {it.senses.length > 1 && (
                          <select
                            aria-label={t("senseOf", { hanzi: it.hanzi })}
                            value={it.senseId}
                            disabled={pending}
                            onChange={(e) => run(() => setItemSenseAction(lesson.id, it.senseId, e.target.value))}
                            className="h-7 w-full max-w-full min-w-0 truncate rounded-md border border-input bg-background px-1 text-xs sm:w-auto"
                          >
                            {it.senses.map((s, si) => (
                              <option
                                key={s.id}
                                value={s.id}
                                disabled={s.id !== it.senseId && lesson.items.some((x) => x.senseId === s.id)}
                              >
                                {t("senseN", { n: si + 1, meaning: meaningFor(locale, s) || s.pinyin })}
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
                        aria-label={t("moveUp")}
                        disabled={i === 0 || pending}
                        onClick={() => run(() => moveItemAction(lesson.id, it.senseId, -1))}
                      >
                        <ArrowUp />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t("moveDown")}
                        disabled={i === lesson.items.length - 1 || pending}
                        onClick={() => run(() => moveItemAction(lesson.id, it.senseId, 1))}
                      >
                        <ArrowDown />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t("removeWord", { hanzi: it.hanzi })}
                        disabled={pending}
                        onClick={() => run(() => removeItemAction(lesson.id, it.senseId))}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <Empty>{t("emptyLesson")}</Empty>
          )}
        </section>

        {/* Añadir */}
        <section className="flex min-w-0 flex-col gap-3 self-start rounded-xl border border-border bg-card p-4 lg:sticky lg:top-4">
          <div className="flex rounded-lg border border-border p-0.5" role="tablist" aria-label={t("howToAdd")}>
            {(["search", "paste"] as const).map((k) => (
              <button
                key={k}
                role="tab"
                aria-selected={tab === k}
                onClick={() => setTab(k)}
                className={cn(
                  "flex-1 rounded-md px-3 py-1.5 text-sm",
                  tab === k ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                )}
              >
                {k === "search" ? t("search") : t("paste")}
              </button>
            ))}
          </div>
          {tab === "search" ? (
            <SearchPanel words={words} inLesson={inLesson} pending={pending} onAdd={(h) => add([h])} />
          ) : (
            <PastePanel byHanzi={byHanzi} inLesson={inLesson} pending={pending} onAdd={add} />
          )}
        </section>
      </div>
    </ManageShell>
  );
}

function SearchPanel({
  words,
  inLesson,
  pending,
  onAdd,
}: {
  words: WordSummary[];
  inLesson: Set<string>;
  pending: boolean;
  onAdd: (h: string) => void;
}) {
  const t = useTranslations("Manage");
  const locale = useLocale();
  const [q, setQ] = useState("");
  const [hsk, setHsk] = useState<number[]>([]);
  const results = useMemo(() => searchWords(words, q, hsk).slice(0, 40), [words, q, hsk]);
  return (
    <div className="flex flex-col gap-3">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t("searchPlaceholder")}
        aria-label={t("search")}
        className={inputCls}
      />
      <MultiSelect
        label={t("level")}
        allLabel={t("all")}
        clearLabel={t("clearFilter")}
        selectedLabel={(n) => t("selected", { count: n })}
        selected={hsk}
        onChange={setHsk}
        className="self-start"
        options={[1, 2, 3].map((n) => ({ value: n, label: `HSK ${n}`, count: words.filter((w) => w.hsk === n).length }))}
      />
      <ul className="flex max-h-[28rem] flex-col gap-1 overflow-y-auto">
        {results.map((w) => (
          <li key={w.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted">
            <span className="font-hanzi text-xl">{w.hanzi}</span>
            <span className="min-w-0 flex-1 truncate text-sm">
              <span className="font-medium">{w.senses[0]?.pinyin}</span>{" "}
              <span className="text-muted-foreground">{w.senses[0] ? meaningFor(locale, w.senses[0]) : ""}</span>
            </span>
            <span className="text-xs text-muted-foreground">HSK {w.hsk || "?"}</span>
            <Button
              size="icon-sm"
              variant="outline"
              aria-label={t("addWord", { hanzi: w.hanzi })}
              disabled={inLesson.has(w.hanzi) || pending}
              onClick={() => onAdd(w.hanzi)}
            >
              <Plus />
            </Button>
          </li>
        ))}
        {!results.length && <li className="p-2 text-sm text-muted-foreground">{t("noResults")}</li>}
      </ul>
    </div>
  );
}

function PastePanel({
  byHanzi,
  inLesson,
  pending,
  onAdd,
}: {
  byHanzi: Map<string, WordSummary>;
  inLesson: Set<string>;
  pending: boolean;
  onAdd: (hanzis: string[]) => void;
}) {
  const t = useTranslations("Manage");
  const [text, setText] = useState("");
  const parsed = parsePastedList(text);
  const fresh = parsed.filter((h) => !inLesson.has(h) && byHanzi.has(h));
  return (
    <div className="flex flex-col gap-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        placeholder={t("pastePlaceholder")}
        aria-label={t("paste")}
        className="rounded-lg border border-input bg-background p-3 font-hanzi"
      />
      {parsed.length > 0 && (
        <>
          <ul className="flex flex-wrap gap-1.5">
            {parsed.map((h) => {
              const known = byHanzi.has(h);
              return (
                <li
                  key={h}
                  className={cn(
                    "rounded-md border border-border px-2 py-1 font-hanzi",
                    inLesson.has(h) && "text-muted-foreground line-through",
                    !known && "border-dashed text-muted-foreground",
                  )}
                  title={inLesson.has(h) ? t("alreadyIn") : known ? undefined : t("notInCatalog")}
                >
                  {h}
                </li>
              );
            })}
          </ul>
          <p className="text-xs text-muted-foreground">{t("pasteLegend")}</p>
          <Button disabled={!fresh.length || pending} onClick={() => (onAdd(fresh), setText(""))}>
            <Plus /> {t("addN", { count: fresh.length })}
          </Button>
        </>
      )}
    </div>
  );
}

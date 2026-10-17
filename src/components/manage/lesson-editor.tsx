"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowDown, ArrowUp, GripVertical, MessageSquareText, Pencil, Plus, Presentation, Trash2, Undo2 } from "lucide-react";
import {
  addItemsAction,
  moveItemAction,
  removeItemAction,
  renameLessonAction,
  resetLessonOrderAction,
  setItemSenseAction,
  setLessonExamplesAction,
} from "@/actions/manage";
import { ExamplesSelect } from "./examples-select";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { startSessionAction } from "@/actions/class";
import { Button } from "@/components/ui/button";
import { MultiSelect } from "@/components/ui/multi-select";
import { Link } from "@/i18n/navigation";
import { lookupWordsAction } from "@/actions/search";
import type { EditableLesson } from "@/lib/content";
import { cn } from "@/lib/utils";
import { collectionsBase, useHomeCrumbs, type Mode } from "./collections";
import { useDragReorder } from "./drag-reorder";
import { Empty, inputCls, ManageShell, meaningFor, useRunner } from "./shell";
import { HSK_LEVELS, hskLabel, useWordSearch } from "./use-word-search";

/** Separa una lista pegada ("你 好\n吗，我") en hanzi; ignora números y signos. */
function parsePastedList(text: string): string[] {
  return [...new Set(text.match(/\p{Script=Han}+/gu) ?? [])];
}

/** Editor de una lección: palabras, sentido elegido, orden y añadir. */
export function LessonEditor({
  mode,
  isAdmin,
  collection,
  lesson,
}: {
  mode: Mode;
  isAdmin: boolean;
  collection: { id: string; title: string };
  lesson: EditableLesson;
}) {
  const t = useTranslations("Manage");
  const locale = useLocale();
  const crumbs = useHomeCrumbs(mode);
  const { pending, error, run } = useRunner();
  const [tab, setTab] = useState<"search" | "paste">("search");
  const [renaming, setRenaming] = useState<{ title: string; description: string } | null>(null);
  const base = collectionsBase(mode);
  const lessonHref = `${base}/${collection.id}/${lesson.id}`;

  const inLesson = new Set(lesson.items.map((i) => i.hanzi));
  const add = (senseIds: string[]) => {
    if (senseIds.length) run(() => addItemsAction(lesson.id, senseIds));
  };
  const withoutSentences = lesson.items.filter((i) => i.classSentences === 0).length;
  const [confirmReset, resetDialog] = useConfirm();

  // Arrastrar a la posición destino: como moveItemAction cambia con el vecino,
  // mover de la 2 a la 5 son tres intercambios encadenados en la misma acción.
  const reorder = useDragReorder(lesson.items.length, {
    disabled: pending,
    onReorder: (from, to) => {
      const senseId = lesson.items[from].senseId;
      const delta: -1 | 1 = to > from ? 1 : -1;
      run(async () => {
        for (let step = 0; step < Math.abs(to - from); step++) {
          const r = await moveItemAction(lesson.id, senseId, delta);
          if (!r.ok) return r;
        }
        return { ok: true } as const;
      });
    },
  });

  return (
    <ManageShell
      isAdmin={isAdmin}
      wide
      crumbs={[...crumbs, { label: collection.title, href: `${base}/${collection.id}` }, { label: lesson.title }]}
      title={lesson.title}
      subtitle={lesson.description}
      error={error}
      actions={
        <>
          <Button variant="ghost" onClick={() => setRenaming({ title: lesson.title, description: lesson.description ?? "" })}>
            <Pencil /> {t("rename")}
          </Button>
          {lesson.copiedFrom && (
            <Button
              variant="ghost"
              disabled={pending}
              onClick={async () => {
                if (await confirmReset({ title: t("confirmResetOrder", { title: lesson.title }), confirmLabel: t("resetOrder"), cancelLabel: t("cancel") }))
                  run(() => resetLessonOrderAction(lesson.id));
              }}
            >
              <Undo2 /> {t("resetOrder")}
            </Button>
          )}
          {mode === "teacher" && (
            <form action={startSessionAction.bind(null, lesson.id)}>
              <Button
                type="submit"
                disabled={!lesson.items.length}
                title={withoutSentences ? t("presentHint", { count: withoutSentences }) : undefined}
              >
                <Presentation /> {t("present", { count: lesson.items.length })}
              </Button>
            </form>
          )}
        </>
      }
    >
      {renaming !== null && (
        <form
          className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => renameLessonAction(lesson.id, renaming.title, renaming.description), () => setRenaming(null));
          }}
        >
          <input
            autoFocus
            value={renaming.title}
            onChange={(e) => setRenaming({ ...renaming, title: e.target.value })}
            aria-label={t("newName")}
            className={cn(inputCls, "w-full")}
          />
          <textarea
            value={renaming.description}
            onChange={(e) => setRenaming({ ...renaming, description: e.target.value })}
            placeholder={t("addDescription")}
            aria-label={t("description")}
            rows={2}
            className={cn(inputCls, "h-auto w-full resize-y py-2")}
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={pending}>
              {t("save")}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setRenaming(null)}>
              {t("cancel")}
            </Button>
          </div>
        </form>
      )}

      {mode === "teacher" && (
        <ExamplesSelect
          value={lesson.examplesShown}
          inherited={lesson.collectionExamplesShown}
          disabled={pending}
          onChange={(n) => run(() => setLessonExamplesAction(lesson.id, n))}
        />
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
                const rowProps = reorder.row(i);
                return (
                  <li
                    key={it.senseId}
                    {...rowProps}
                    className={cn(
                      "flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3",
                      rowProps.className,
                      !pending && "cursor-grab active:cursor-grabbing",
                    )}
                  >
                    <span className="w-5 text-center text-sm text-muted-foreground tabular-nums">{i + 1}</span>
                    <span className="font-hanzi text-3xl">{it.hanzi}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{sense?.pinyin}</span>{" "}
                        <span className="text-muted-foreground">{sense ? meaningFor(locale, sense) : "—"}</span>
                      </p>
                      <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2">
                        <span className="text-xs text-muted-foreground">HSK {hskLabel(it.hsk)}</span>
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
                        {...reorder.handle(i)}
                        aria-label={t("dragHandle", { name: it.hanzi })}
                        title={t("dragHint")}
                        disabled={pending}
                      >
                        <GripVertical />
                      </Button>
                      {/* El navegador no arrastra con el dedo: en móvil siguen las flechas. */}
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t("moveUp")}
                        disabled={i === 0 || pending}
                        onClick={() => run(() => moveItemAction(lesson.id, it.senseId, -1))}
                        className="sm:hidden"
                      >
                        <ArrowUp />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t("moveDown")}
                        disabled={i === lesson.items.length - 1 || pending}
                        onClick={() => run(() => moveItemAction(lesson.id, it.senseId, 1))}
                        className="sm:hidden"
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
          {resetDialog}
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
            <SearchPanel inLesson={inLesson} pending={pending} onAdd={(id) => add([id])} />
          ) : (
            <PastePanel inLesson={inLesson} pending={pending} onAdd={add} />
          )}
        </section>
      </div>
    </ManageShell>
  );
}

function SearchPanel({
  inLesson,
  pending,
  onAdd,
}: {
  inLesson: Set<string>;
  pending: boolean;
  onAdd: (senseId: string) => void;
}) {
  const t = useTranslations("Manage");
  const locale = useLocale();
  const [q, setQ] = useState("");
  const [hsk, setHsk] = useState<number[]>([]);
  // La búsqueda la hace la base: el catálogo completo no viaja al navegador.
  const { result, loading, failed } = useWordSearch(q, hsk);
  const results = result?.rows ?? [];
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
        options={HSK_LEVELS.map((n) => ({ value: n, label: `HSK ${hskLabel(n)}`, count: result?.levels[n] }))}
      />
      <ul className={cn("flex max-h-[28rem] flex-col gap-1 overflow-y-auto transition-opacity", loading && "opacity-60")} aria-busy={loading}>
        {results.map((w) => (
          <li key={w.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted">
            <span className="font-hanzi text-xl">{w.hanzi}</span>
            <span className="min-w-0 flex-1 truncate text-sm">
              <span className="font-medium">{w.senses[0]?.pinyin}</span>{" "}
              <span className="text-muted-foreground">{w.senses[0] ? meaningFor(locale, w.senses[0]) : ""}</span>
            </span>
            <span className="text-xs whitespace-nowrap text-muted-foreground">HSK {hskLabel(w.hsk)}</span>
            <Button
              size="icon-sm"
              variant="outline"
              aria-label={t("addWord", { hanzi: w.hanzi })}
              disabled={inLesson.has(w.hanzi) || pending || !w.senses[0]}
              onClick={() => w.senses[0] && onAdd(w.senses[0].id)}
            >
              <Plus />
            </Button>
          </li>
        ))}
        {failed && <li className="p-2 text-sm text-destructive">{t("searchFailed")}</li>}
        {!failed && !loading && result && !results.length && <li className="p-2 text-sm text-muted-foreground">{t("noResults")}</li>}
        {result && result.total > results.length && (
          <li className="p-2 text-xs text-muted-foreground">{t("moreResults", { shown: results.length, total: result.total })}</li>
        )}
      </ul>
    </div>
  );
}

function PastePanel({
  inLesson,
  pending,
  onAdd,
}: {
  inLesson: Set<string>;
  pending: boolean;
  onAdd: (senseIds: string[]) => void;
}) {
  const t = useTranslations("Manage");
  const [text, setText] = useState("");
  const parsed = parsePastedList(text);
  // Solo se pregunta a la base por los hanzi pegados.
  const [known, setKnown] = useState<Map<string, string>>(new Map());
  const parsedKey = parsed.join(" ");
  useEffect(() => {
    if (!parsedKey) return;
    const timer = window.setTimeout(() => {
      lookupWordsAction(parsedKey.split(" "))
        .then((found) => setKnown(new Map(found.map((f) => [f.hanzi, f.senseId]))))
        .catch(() => {});
    }, 250);
    return () => window.clearTimeout(timer);
  }, [parsedKey]);
  const fresh = parsed.filter((h) => !inLesson.has(h) && known.has(h));
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
              const isKnown = known.has(h);
              return (
                <li
                  key={h}
                  className={cn(
                    "rounded-md border border-border px-2 py-1 font-hanzi",
                    inLesson.has(h) && "text-muted-foreground line-through",
                    !isKnown && "border-dashed text-muted-foreground",
                  )}
                  title={inLesson.has(h) ? t("alreadyIn") : isKnown ? undefined : t("notInCatalog")}
                >
                  {h}
                </li>
              );
            })}
          </ul>
          <p className="text-xs text-muted-foreground">{t("pasteLegend")}</p>
          <Button disabled={!fresh.length || pending} onClick={() => (onAdd(fresh.map((h) => known.get(h)!)), setText(""))}>
            <Plus /> {t("addN", { count: fresh.length })}
          </Button>
        </>
      )}
    </div>
  );
}

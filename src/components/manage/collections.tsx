"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowDown, ArrowUp, Copy, GripVertical, Pencil, Plus, Trash2, Undo2 } from "lucide-react";
import {
  addLessonAction,
  copyTemplateAction,
  createCollectionAction,
  deleteCollectionAction,
  deleteLessonAction,
  moveLessonAction,
  renameCollectionAction,
  resetCollectionOrderAction,
  setCollectionExamplesAction,
} from "@/actions/manage";
import { ExamplesSelect } from "./examples-select";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/navigation";
import type { CollectionListItem, CollectionSummary } from "@/lib/content";
import { cn } from "@/lib/utils";
import { useDragReorder } from "./drag-reorder";
import { Empty, inputCls, ManageShell, NewTitleForm, SearchInput, useRunner, type Crumb } from "./shell";
import { PinButton } from "./pin-button";

// Colecciones y lecciones. Las comparten la docente (sus colecciones) y el
// admin (plantillas): cambia la base de las rutas y qué se puede copiar.

export type Mode = "teacher" | "admin";
export const collectionsBase = (mode: Mode) => (mode === "teacher" ? "/collections" : "/admin/templates");

export function useHomeCrumbs(mode: Mode): Crumb[] {
  const t = useTranslations("Manage");
  return mode === "teacher"
    ? [{ label: t("nav.collections"), href: "/collections" }]
    : [
        { label: t("nav.admin"), href: "/admin" },
        { label: t("templates"), href: "/admin/templates" },
      ];
}


function CollectionCard({
  c,
  mode,
  onCopy,
  pending,
  pinned,
}: {
  c: CollectionListItem;
  mode: Mode;
  onCopy?: () => void;
  pending?: boolean;
  pinned?: boolean;
}) {
  const t = useTranslations("Manage");
  return (
    <li className="flex min-h-40 flex-col rounded-xl border border-border bg-card p-5">
      <div className="flex min-w-0 items-start gap-2">
        <div className="min-w-0 flex-1">
        {onCopy ? (
          <p className="font-medium">{c.title}</p>
        ) : (
          <Link href={`${collectionsBase(mode)}/${c.id}`} className="font-medium hover:underline">
            {c.title}
          </Link>
        )}
        <p className="text-sm text-muted-foreground">
          {t("lessonsWords", { lessons: c.lessons, words: c.words })}
          {c.source ? ` · ${c.source}` : ""}
        </p>
        </div>
        {mode === "teacher" && !onCopy && <PinButton kind="collection" id={c.id} pinned={Boolean(pinned)} />}
      </div>
      <div className="mt-auto pt-5">
      {onCopy ? (
        <Button className="w-full" variant="outline" onClick={onCopy} disabled={pending}>
          <Copy /> {t("useTemplate")}
        </Button>
      ) : (
        <Link href={`${collectionsBase(mode)}/${c.id}`} className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
          {t("open")}
        </Link>
      )}
      </div>
    </li>
  );
}

/** Lista de colecciones: las propias de la docente o las plantillas del admin. */
export function CollectionsScreen({
  mode,
  isAdmin,
  mine,
  pinnedIds = [],
  initialQuery = "",
  createOnLoad = false,
}: {
  mode: Mode;
  isAdmin: boolean;
  mine: CollectionListItem[];
  pinnedIds?: string[];
  initialQuery?: string;
  createOnLoad?: boolean;
}) {
  const t = useTranslations("Manage");
  const router = useRouter();
  const { pending, error, run } = useRunner();
  const crumbs = useHomeCrumbs(mode);
  const teacher = mode === "teacher";
  const [query, setQuery] = useState(initialQuery);
  const q = query.trim().toLowerCase();
  // La búsqueda mira nombre y descripción.
  const matches = (title: string, description?: string | null) =>
    !q || title.toLowerCase().includes(q) || (description ?? "").toLowerCase().includes(q);
  const shownMine = mine.filter((c) => matches(c.title, c.description));

  return (
    <ManageShell
      isAdmin={isAdmin}
      crumbs={teacher ? [] : crumbs.slice(0, -1)}
      title={teacher ? t("nav.collections") : t("templates")}
      error={error}
    >
      <div className="flex flex-wrap items-start gap-2">
        <div className="min-w-56 flex-1">
          <SearchInput value={query} onChange={setQuery} label={teacher ? t("searchCollections") : t("searchTemplates")} />
        </div>
        <NewTitleForm
          initialOpen={createOnLoad}
          placeholder={teacher ? t("newCollection") : t("newTemplate")}
          descriptionPlaceholder={teacher ? t("newCollectionDesc") : t("newTemplateDesc")}
          label={
            <>
              <Plus /> {teacher ? t("createCollection") : t("createTemplate")}
            </>
          }
          disabled={pending}
          onCreate={(title, description) =>
            run(
              () => createCollectionAction(title, !teacher, description),
              (r) => router.push(`${collectionsBase(mode)}/${r.id}`),
            )
          }
        />
      </div>

      <section className="flex flex-col gap-3">
        {shownMine.length ? (
          <ul className="grid gap-3 md:grid-cols-2">
            {shownMine.map((c) => (
              <CollectionCard key={c.id} c={c} mode={mode} pinned={pinnedIds.includes(c.id)} />
            ))}
          </ul>
        ) : (
          <Empty>{mine.length ? t("noMatches", { query: query.trim() }) : teacher ? t("noCollections") : t("noTemplates")}</Empty>
        )}
      </section>

    </ManageShell>
  );
}

/** Una colección: sus lecciones en orden. */
/** Biblioteca de plantillas reales, separada del material que ya es de la docente. */
export function LibraryScreen({ isAdmin, templates }: { isAdmin: boolean; templates: CollectionListItem[] }) {
  const t = useTranslations("Manage");
  const th = useTranslations("HskLibrary");
  const router = useRouter();
  const { pending, error, run } = useRunner();
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  // Las plantillas HSK (lecciones de 15) ya no se listan aquí: el vocabulario
  // HSK se consulta completo por nivel en /library/hsk.
  const topics = templates.filter((item) => !/^HSK\s/i.test(item.title) && item.title.toLowerCase().includes(q));
  const showHsk = !q || "hsk".includes(q) || th("title").toLowerCase().includes(q);

  return (
    <ManageShell isAdmin={isAdmin} crumbs={[]} title={t("libraryTitle")} error={error} wide>
      <p className="max-w-3xl text-muted-foreground">{t("libraryHint")}</p>
      <SearchInput value={query} onChange={setQuery} label={t("searchTemplates")} />
      {showHsk && (
        <section id="hsk" className="scroll-mt-24 space-y-3">
          <div>
            <h2 className="text-xl font-semibold">{t("hskLibrary")}</h2>
            <p className="text-sm text-muted-foreground">{t("hskLibraryHint")}</p>
          </div>
          <ul className="grid gap-3 md:grid-cols-2">
            <li className="flex min-h-40 flex-col rounded-xl border border-border bg-card p-5">
              <h3 className="text-lg font-semibold">{th("title")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{th("allLevelsHint")}</p>
              <Link href="/library/hsk" className={cn(buttonVariants({ variant: "outline" }), "mt-auto w-full")}>{th("viewVocabulary")} →</Link>
            </li>
          </ul>
        </section>
      )}
      {topics.length > 0 && (
        <section id="topics" className="scroll-mt-24 space-y-3">
          <div>
            <h2 className="text-xl font-semibold">{t("topicLibrary")}</h2>
            <p className="text-sm text-muted-foreground">{t("topicLibraryHint")}</p>
          </div>
          <ul className="grid gap-3 md:grid-cols-2">
            {topics.map((item) => (
              <CollectionCard
                key={item.id}
                c={item}
                mode="teacher"
                pending={pending}
                onCopy={() => run(() => copyTemplateAction(item.id), (result) => router.push(`/collections/${result.id}`))}
              />
            ))}
          </ul>
        </section>
      )}
      {!showHsk && topics.length === 0 && <Empty>{t("noMatches", { query: query.trim() })}</Empty>}
    </ManageShell>
  );
}

export function CollectionScreen({ mode, isAdmin, collection: c }: { mode: Mode; isAdmin: boolean; collection: CollectionSummary }) {
  const t = useTranslations("Manage");
  const [confirm, confirmDialog] = useConfirm();
  const router = useRouter();
  const { pending, error, run } = useRunner();
  const crumbs = useHomeCrumbs(mode);
  const [editing, setEditing] = useState<{ title: string; description: string } | null>(null);
  const base = collectionsBase(mode);

  // Mismo arrastre que en el editor de lección: mover de la 2 a la 5 son tres
  // intercambios con el vecino encadenados en la misma acción.
  const reorder = useDragReorder(c.lessons.length, {
    disabled: pending,
    onReorder: (from, to) => {
      const lessonId = c.lessons[from].id;
      const delta: -1 | 1 = to > from ? 1 : -1;
      run(async () => {
        for (let step = 0; step < Math.abs(to - from); step++) {
          const r = await moveLessonAction(c.id, lessonId, delta);
          if (!r.ok) return r;
        }
        return { ok: true } as const;
      });
    },
  });

  return (
    <ManageShell
      isAdmin={isAdmin}
      crumbs={[...crumbs, { label: c.title }]}
      title={c.title}
      subtitle={c.description}
      error={error}
      actions={
        <>
          <Button variant="ghost" onClick={() => setEditing({ title: c.title, description: c.description ?? "" })}>
            <Pencil /> {t("rename")}
          </Button>
          {c.copiedFrom && (
            <Button
              variant="ghost"
              disabled={pending}
              onClick={async () => {
                if (await confirm({ title: t("confirmResetOrder", { title: c.title }), confirmLabel: t("resetOrder"), cancelLabel: t("cancel") })) {
                  const r = await run(() => resetCollectionOrderAction(c.id));
                  if (r?.ok) window.location.reload();
                }
              }}
            >
              <Undo2 /> {t("resetOrder")}
            </Button>
          )}
          <Button
            variant="ghost"
            disabled={pending}
            onClick={async () => {
              if (await confirm({ title: t("confirmDeleteCollection", { title: c.title }), confirmLabel: t("delete"), cancelLabel: t("cancel"), destructive: true }))
                run(() => deleteCollectionAction(c.id), () => router.push(base));
            }}
          >
            <Trash2 /> {t("delete")}
          </Button>
        </>
      }
    >
      {editing !== null && (
        <form
          className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => renameCollectionAction(c.id, editing.title, editing.description), () => setEditing(null));
          }}
        >
          <input
            autoFocus
            value={editing.title}
            onChange={(e) => setEditing({ ...editing, title: e.target.value })}
            aria-label={t("newName")}
            className={cn(inputCls, "w-full")}
          />
          <textarea
            value={editing.description}
            onChange={(e) => setEditing({ ...editing, description: e.target.value })}
            placeholder={t("addDescription")}
            aria-label={t("description")}
            rows={2}
            className={cn(inputCls, "h-auto w-full resize-y py-2")}
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={pending}>
              {t("save")}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
              {t("cancel")}
            </Button>
          </div>
        </form>
      )}
      {c.copiedFrom && <p className="text-sm text-muted-foreground">{t("copyNote")}</p>}
      {mode === "teacher" && (
        <ExamplesSelect
          value={c.examplesShown}
          disabled={pending}
          onChange={(n) => run(() => setCollectionExamplesAction(c.id, n ?? 0))}
        />
      )}

      <NewTitleForm
        placeholder={t("newLesson", { n: c.lessons.length + 1 })}
        descriptionPlaceholder={t("newLessonDesc")}
        label={
          <>
            <Plus /> {t("addLesson")}
          </>
        }
        disabled={pending}
        onCreate={(title, description) => run(() => addLessonAction(c.id, title, description), (r) => router.push(`${base}/${c.id}/${r.id}`))}
      />

      {c.lessons.length ? (
        <ol className="flex flex-col gap-2">
          {c.lessons.map((l, i) => {
            const rowProps = reorder.row(i);
            return (
            <li
              key={l.id}
              {...rowProps}
              className={cn(
                "flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4",
                rowProps.className,
                !pending && "cursor-grab active:cursor-grabbing",
              )}
            >
              <span className="w-6 text-center text-sm text-muted-foreground tabular-nums">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <Link href={`${base}/${c.id}/${l.id}`} className="font-medium hover:underline">
                  {l.title}
                </Link>
                <p className="truncate text-sm text-muted-foreground">
                  {t("wordsCount", { count: l.hanzi.length })}
                  {l.hanzi.length > 0 && <span className="font-hanzi"> · {l.hanzi.slice(0, 12).join(" ")}</span>}
                </p>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  {...reorder.handle(i)}
                  aria-label={t("dragHandle", { name: l.title })}
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
                  onClick={() => run(() => moveLessonAction(c.id, l.id, -1))}
                  className="sm:hidden"
                >
                  <ArrowUp />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t("moveDown")}
                  disabled={i === c.lessons.length - 1 || pending}
                  onClick={() => run(() => moveLessonAction(c.id, l.id, 1))}
                  className="sm:hidden"
                >
                  <ArrowDown />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t("deleteLesson")}
                  disabled={pending}
                  onClick={async () => (await confirm({ title: t("confirmDeleteLesson", { title: l.title }), confirmLabel: t("delete"), cancelLabel: t("cancel"), destructive: true })) && run(() => deleteLessonAction(l.id))}
                >
                  <Trash2 />
                </Button>
              </div>
            </li>
            );
          })}
        </ol>
      ) : (
        <Empty>{t("noLessons")}</Empty>
      )}
      {confirmDialog}
    </ManageShell>
  );
}

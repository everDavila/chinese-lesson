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
import { startSessionAction } from "@/actions/class";
import { Button, buttonVariants } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/navigation";
import type { CollectionListItem, CollectionSummary } from "@/lib/content";
import { cn } from "@/lib/utils";
import { useDragReorder } from "./drag-reorder";
import { Empty, inputCls, ManageShell, NewTitleForm, SearchInput, useRunner, type Crumb } from "./shell";

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
}: {
  c: CollectionListItem;
  mode: Mode;
  onCopy?: () => void;
  pending?: boolean;
}) {
  const t = useTranslations("Manage");
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
      <div className="min-w-0">
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
      {onCopy ? (
        <Button variant="outline" onClick={onCopy} disabled={pending}>
          <Copy /> {t("useTemplate")}
        </Button>
      ) : (
        <Link href={`${collectionsBase(mode)}/${c.id}`} className={buttonVariants({ variant: "ghost" })}>
          {t("open")}
        </Link>
      )}
    </li>
  );
}

/** Lista de colecciones: las propias de la docente o las plantillas del admin. */
export function CollectionsScreen({
  mode,
  isAdmin,
  mine,
  templates,
  looseLessons = [],
}: {
  mode: Mode;
  isAdmin: boolean;
  mine: CollectionListItem[];
  templates: CollectionListItem[];
  looseLessons?: { id: string; title: string; items: number }[];
}) {
  const t = useTranslations("Manage");
  const router = useRouter();
  const { pending, error, run } = useRunner();
  const crumbs = useHomeCrumbs(mode);
  const teacher = mode === "teacher";
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  // La búsqueda mira nombre y descripción; las lecciones sueltas no tienen.
  const matches = (title: string, description?: string | null) =>
    !q || title.toLowerCase().includes(q) || (description ?? "").toLowerCase().includes(q);
  const shownMine = mine.filter((c) => matches(c.title, c.description));
  const shownLoose = looseLessons.filter((l) => matches(l.title));
  const shownTemplates = templates.filter((c) => matches(c.title, c.description));

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
          <ul className="flex flex-col gap-2">
            {shownMine.map((c) => (
              <CollectionCard key={c.id} c={c} mode={mode} />
            ))}
          </ul>
        ) : (
          <Empty>{mine.length ? t("noMatches", { query: query.trim() }) : teacher ? t("noCollections") : t("noTemplates")}</Empty>
        )}
      </section>

      {teacher && shownLoose.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">{t("looseLessons")}</h2>
          <ul className="flex flex-col gap-2">
            {shownLoose.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
                <div>
                  <p className="font-medium">{l.title}</p>
                  <p className="text-sm text-muted-foreground">{t("wordsCount", { count: l.items })}</p>
                </div>
                <form action={startSessionAction.bind(null, l.id)}>
                  <Button type="submit">{t("startClass")}</Button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}

      {teacher && shownTemplates.length > 0 && (
        <section className="flex flex-col gap-3">
          <div>
            <h2 className="text-xl font-semibold">{t("fromTemplate")}</h2>
            <p className="text-sm text-muted-foreground">{t("fromTemplateHint")}</p>
          </div>
          <ul className="flex flex-col gap-2">
            {shownTemplates.map((c) => (
              <CollectionCard
                key={c.id}
                c={c}
                mode={mode}
                pending={pending}
                onCopy={() => run(() => copyTemplateAction(c.id), (r) => router.push(`/collections/${r.id}`))}
              />
            ))}
          </ul>
        </section>
      )}
    </ManageShell>
  );
}

/** Una colección: sus lecciones en orden. */
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

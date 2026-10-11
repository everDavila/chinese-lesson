"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowDown, ArrowUp, Copy, Pencil, Plus, Trash2 } from "lucide-react";
import {
  addLessonAction,
  copyTemplateAction,
  createCollectionAction,
  deleteCollectionAction,
  deleteLessonAction,
  moveLessonAction,
  renameCollectionAction,
} from "@/actions/manage";
import { startSessionAction } from "@/actions/class";
import { Button, buttonVariants } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/navigation";
import type { CollectionListItem, CollectionSummary } from "@/lib/content";
import { cn } from "@/lib/utils";
import { Empty, inputCls, ManageShell, NewTitleForm, useRunner, type Crumb } from "./shell";

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

  return (
    <ManageShell
      isAdmin={isAdmin}
      crumbs={teacher ? [] : crumbs.slice(0, -1)}
      title={teacher ? t("nav.collections") : t("templates")}
      error={error}
    >
      <section className="flex flex-col gap-3">
        <NewTitleForm
          placeholder={teacher ? t("newCollection") : t("newTemplate")}
          label={
            <>
              <Plus /> {t("create")}
            </>
          }
          disabled={pending}
          onCreate={(title) =>
            run(
              () => createCollectionAction(title, !teacher),
              (r) => router.push(`${collectionsBase(mode)}/${r.id}`),
            )
          }
        />
        {mine.length ? (
          <ul className="flex flex-col gap-2">
            {mine.map((c) => (
              <CollectionCard key={c.id} c={c} mode={mode} />
            ))}
          </ul>
        ) : (
          <Empty>{teacher ? t("noCollections") : t("noTemplates")}</Empty>
        )}
      </section>

      {teacher && looseLessons.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">{t("looseLessons")}</h2>
          <ul className="flex flex-col gap-2">
            {looseLessons.map((l) => (
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

      {teacher && (
        <section className="flex flex-col gap-3">
          <div>
            <h2 className="text-xl font-semibold">{t("fromTemplate")}</h2>
            <p className="text-sm text-muted-foreground">{t("fromTemplateHint")}</p>
          </div>
          <ul className="flex flex-col gap-2">
            {templates.map((c) => (
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
  const router = useRouter();
  const { pending, error, run } = useRunner();
  const crumbs = useHomeCrumbs(mode);
  const [editing, setEditing] = useState<string | null>(null);
  const base = collectionsBase(mode);

  return (
    <ManageShell
      isAdmin={isAdmin}
      crumbs={[...crumbs, { label: c.title }]}
      title={c.title}
      error={error}
      actions={
        <>
          <Button variant="ghost" onClick={() => setEditing(c.title)}>
            <Pencil /> {t("rename")}
          </Button>
          <Button
            variant="ghost"
            disabled={pending}
            onClick={() => {
              if (window.confirm(t("confirmDeleteCollection", { title: c.title })))
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
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => renameCollectionAction(c.id, editing), () => setEditing(null));
          }}
        >
          <input
            autoFocus
            value={editing}
            onChange={(e) => setEditing(e.target.value)}
            aria-label={t("newName")}
            className={cn(inputCls, "flex-1")}
          />
          <Button type="submit" disabled={pending}>
            {t("save")}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
            {t("cancel")}
          </Button>
        </form>
      )}
      {c.copiedFrom && <p className="text-sm text-muted-foreground">{t("copyNote")}</p>}

      <NewTitleForm
        placeholder={t("newLesson", { n: c.lessons.length + 1 })}
        label={
          <>
            <Plus /> {t("addLesson")}
          </>
        }
        disabled={pending}
        onCreate={(title) => run(() => addLessonAction(c.id, title), (r) => router.push(`${base}/${c.id}/${r.id}`))}
      />

      {c.lessons.length ? (
        <ol className="flex flex-col gap-2">
          {c.lessons.map((l, i) => (
            <li key={l.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
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
                  aria-label={t("moveUp")}
                  disabled={i === 0 || pending}
                  onClick={() => run(() => moveLessonAction(c.id, l.id, -1))}
                >
                  <ArrowUp />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t("moveDown")}
                  disabled={i === c.lessons.length - 1 || pending}
                  onClick={() => run(() => moveLessonAction(c.id, l.id, 1))}
                >
                  <ArrowDown />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t("deleteLesson")}
                  disabled={pending}
                  onClick={() => window.confirm(t("confirmDeleteLesson", { title: l.title })) && run(() => deleteLessonAction(l.id))}
                >
                  <Trash2 />
                </Button>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <Empty>{t("noLessons")}</Empty>
      )}
    </ManageShell>
  );
}

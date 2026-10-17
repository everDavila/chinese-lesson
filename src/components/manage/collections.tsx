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
  setCollectionExamplesAction,
} from "@/actions/manage";
import { ExamplesSelect } from "./examples-select";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/navigation";
import type { CollectionListItem, CollectionSummary } from "@/lib/content";
import { cn } from "@/lib/utils";
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
  const matches = (title: string) => !q || title.toLowerCase().includes(q);
  const shownMine = mine.filter((c) => matches(c.title));

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
          label={
            <>
              <Plus /> {teacher ? t("createCollection") : t("createTemplate")}
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
  const shown = templates.filter((item) => item.title.toLowerCase().includes(query.trim().toLowerCase()));
  const groups = [
    { id: "hsk", title: t("hskLibrary"), hint: t("hskLibraryHint"), items: shown.filter((item) => /^HSK\s/i.test(item.title)) },
    { id: "topics", title: t("topicLibrary"), hint: t("topicLibraryHint"), items: shown.filter((item) => !/^HSK\s/i.test(item.title)) },
  ];

  return (
    <ManageShell isAdmin={isAdmin} crumbs={[]} title={t("libraryTitle")} error={error} wide>
      <p className="max-w-3xl text-muted-foreground">{t("libraryHint")}</p>
      <SearchInput value={query} onChange={setQuery} label={t("searchTemplates")} />
      {groups.map((group) => group.items.length > 0 && (
        <section id={group.id} key={group.id} className="scroll-mt-24 space-y-3">
          <div>
            <h2 className="text-xl font-semibold">{group.title}</h2>
            <p className="text-sm text-muted-foreground">{group.hint}</p>
          </div>
          <ul className="grid gap-3 md:grid-cols-2">
            {group.items.map((item) => group.id === "hsk" ? (
              <li key={item.id} className="flex min-h-40 flex-col rounded-xl border border-border bg-card p-5">
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t("lessonsWords", { lessons: item.lessons, words: item.words })}</p>
                <Link href={`/library/hsk/${item.id}`} className={cn(buttonVariants({ variant: "outline" }), "mt-auto w-full")}>{th("seeLessons")} →</Link>
              </li>
            ) : (
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
      ))}
      {shown.length === 0 && <Empty>{t("noMatches", { query: query.trim() })}</Empty>}
    </ManageShell>
  );
}

export function CollectionScreen({ mode, isAdmin, collection: c }: { mode: Mode; isAdmin: boolean; collection: CollectionSummary }) {
  const t = useTranslations("Manage");
  const [confirm, confirmDialog] = useConfirm();
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
      {mode === "teacher" && (
        <ExamplesSelect
          value={c.examplesShown}
          disabled={pending}
          onChange={(n) => run(() => setCollectionExamplesAction(c.id, n ?? 0))}
        />
      )}

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
                  onClick={async () => (await confirm({ title: t("confirmDeleteLesson", { title: l.title }), confirmLabel: t("delete"), cancelLabel: t("cancel"), destructive: true })) && run(() => deleteLessonAction(l.id))}
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
      {confirmDialog}
    </ManageShell>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { ArchiveRestore, Trash2 } from "lucide-react";
import { deleteCollectionAction, deleteLessonAction, setArchivedAction } from "@/actions/manage";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import type { listArchived } from "@/lib/content";
import { Empty, ManageShell, useRunner } from "./shell";

type Archived = Awaited<ReturnType<typeof listArchived>>;

/**
 * Lo archivado por la docente: restaurar (vuelve a sus listas, con su
 * historial) o borrar definitivamente (también clases y votos).
 */
export function ArchivedScreen({ isAdmin, archived }: { isAdmin: boolean; archived: Archived }) {
  const t = useTranslations("Manage");
  const { pending, error, run } = useRunner();
  const [confirm, dialog] = useConfirm();

  const removeForever = async (kind: "lesson" | "collection", id: string, title: string, classes: number, lessons = 0) => {
    const ok = await confirm({
      title: t("confirmDeleteForever", { title }),
      description: [
        kind === "lesson" ? t("deleteLessonHint") : t("deleteCollectionHint", { lessons }),
        t("removeHistory", { count: classes }),
      ].join(" "),
      confirmLabel: t("deleteForever"),
      cancelLabel: t("cancel"),
      destructive: true,
    });
    if (ok) run(() => (kind === "lesson" ? deleteLessonAction(id) : deleteCollectionAction(id)));
  };

  const row = (
    key: string,
    title: string,
    detail: string,
    onRestore: () => void,
    onDelete: () => void,
  ) => (
    <li key={key} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
      <div className="min-w-0 flex-1">
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{detail}</p>
      </div>
      <div className="flex gap-1">
        <Button variant="outline" disabled={pending} onClick={onRestore}>
          <ArchiveRestore /> {t("restore")}
        </Button>
        <Button variant="ghost" disabled={pending} onClick={onDelete}>
          <Trash2 /> {t("deleteForever")}
        </Button>
      </div>
    </li>
  );

  const empty = !archived.collections.length && !archived.lessons.length;
  return (
    <ManageShell isAdmin={isAdmin} crumbs={[]} title={t("archivedTitle")} error={error} wide>
      <p className="max-w-3xl text-muted-foreground">{t("archivedIntro")}</p>
      {empty && <Empty>{t("archivedEmpty")}</Empty>}
      {archived.collections.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold">{t("archivedCollections")}</h2>
          <ul className="flex flex-col gap-2">
            {archived.collections.map((c) =>
              row(
                c.id,
                c.title,
                t("lessonsCount", { count: c.lessons }),
                () => run(() => setArchivedAction("collection", c.id, false)),
                () => removeForever("collection", c.id, c.title, c.classes, c.lessons),
              ),
            )}
          </ul>
        </section>
      )}
      {archived.lessons.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold">{t("archivedLessons")}</h2>
          <ul className="flex flex-col gap-2">
            {archived.lessons.map((l) =>
              row(
                l.id,
                l.title,
                `${l.collectionTitle ?? t("looseLabel")} · ${t("wordsCount", { count: l.items })}`,
                () => run(() => setArchivedAction("lesson", l.id, false)),
                () => removeForever("lesson", l.id, l.title, l.classes),
              ),
            )}
          </ul>
        </section>
      )}
      {dialog}
    </ManageShell>
  );
}

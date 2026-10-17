"use client";

import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { deleteCollectionAction, deleteLessonAction, setArchivedAction } from "@/actions/manage";
import { Button } from "@/components/ui/button";
import { useChoice } from "@/components/ui/confirm-dialog";
import { useRunner } from "./shell";

/**
 * «Quitar» una lección o colección propia: pregunta si archivarla (se oculta y
 * conserva su historial; se restaura desde Archivadas) o borrarla para siempre
 * (también sus clases y votos). Se usa en las listas, el detalle y el editor.
 */
export function RemoveButton({
  kind,
  id,
  title,
  classes,
  lessons = 0,
  compact = false,
  onDone,
}: {
  kind: "lesson" | "collection";
  id: string;
  title: string;
  /** Clases dadas (con la lección o con las de la colección). */
  classes: number;
  /** Solo colecciones: cuántas lecciones arrastra. */
  lessons?: number;
  /** En listas: solo el icono. */
  compact?: boolean;
  /** Tras archivar o borrar (p. ej. salir de la pantalla de lo que ya no existe). */
  onDone?: (action: "archive" | "delete") => void;
}) {
  const t = useTranslations("Manage");
  const [choose, dialog] = useChoice<"archive" | "delete">();
  const { pending, error, run } = useRunner();

  const remove = async () => {
    const description = [
      kind === "lesson" ? t("archiveLessonHint") : t("archiveCollectionHint"),
      kind === "lesson" ? t("deleteLessonHint") : t("deleteCollectionHint", { lessons }),
      t("removeHistory", { count: classes }),
    ].join("\n\n");
    const action = await choose({
      title: t("removeTitle", { title }),
      description,
      cancelLabel: t("cancel"),
      choices: [
        { value: "delete", label: t("deleteForever"), destructive: true },
        { value: "archive", label: t("archive"), primary: true },
      ],
    });
    if (!action) return;
    run(
      () =>
        action === "archive"
          ? setArchivedAction(kind, id, true)
          : kind === "lesson"
            ? deleteLessonAction(id)
            : deleteCollectionAction(id),
      () => onDone?.(action),
    );
  };

  return (
    <>
      <Button
        variant="ghost"
        size={compact ? "icon" : "default"}
        disabled={pending}
        aria-label={compact ? t("removeNamed", { title }) : undefined}
        title={error ?? (compact ? t("remove") : undefined)}
        onClick={remove}
      >
        <Trash2 />
        {!compact && t("remove")}
      </Button>
      {dialog}
    </>
  );
}

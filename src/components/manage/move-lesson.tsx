"use client";

import { useTranslations } from "next-intl";
import { FolderInput } from "lucide-react";
import { moveLessonToCollectionAction } from "@/actions/manage";
import { cn } from "@/lib/utils";
import { useRunner } from "./shell";

/**
 * "Mover a colección": cambia la colección de una lección propia o la deja
 * suelta. Se usa en el editor de la lección y en la lista de cada colección.
 * Mismo <select> nativo que el resto de selectores de la app.
 */
export function MoveLessonControl({
  lessonId,
  currentCollectionId,
  collections,
  onMoved,
  compact = false,
}: {
  lessonId: string;
  currentCollectionId: string | null;
  collections: { id: string; title: string }[];
  /** Tras mover (p. ej. ir a la dirección nueva de la lección). */
  onMoved?: (collectionId: string | null) => void;
  /** En listas: solo el icono y el selector, sin texto delante. */
  compact?: boolean;
}) {
  const t = useTranslations("Manage");
  const { pending, error, run } = useRunner();
  const LOOSE = "";
  return (
    <label className={cn("flex items-center gap-2 text-sm text-muted-foreground", compact && "gap-1")} title={error ?? undefined}>
      <FolderInput className="size-4 shrink-0" aria-hidden />
      <span className={cn(compact && "sr-only")}>{t("moveTo")}</span>
      <select
        aria-label={t("moveToLabel")}
        value={currentCollectionId ?? LOOSE}
        disabled={pending}
        onChange={(e) => {
          const target = e.target.value || null;
          run(() => moveLessonToCollectionAction(lessonId, target), (r) => onMoved?.(r.collectionId));
        }}
        className={cn(
          "h-9 max-w-48 truncate rounded-lg border border-input bg-background px-2 text-foreground",
          error && "border-destructive",
        )}
      >
        <option value={LOOSE}>{t("noCollection")}</option>
        {collections.map((c) => (
          <option key={c.id} value={c.id}>
            {c.title}
          </option>
        ))}
      </select>
    </label>
  );
}

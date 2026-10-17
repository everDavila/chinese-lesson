"use client";

import { Pin, PinOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { setTeacherPinAction } from "@/actions/manage";
import { Button } from "@/components/ui/button";
import { useRunner } from "./shell";

export function PinButton({ kind, id, pinned }: { kind: "lesson" | "collection"; id: string; pinned: boolean }) {
  const t = useTranslations("TeacherHome");
  const { pending, run } = useRunner();
  const label = pinned ? t("unpin") : t("pin");
  return (
    <Button type="button" variant="ghost" size="icon" disabled={pending} aria-label={label} title={label} onClick={() => run(() => setTeacherPinAction(kind, id, !pinned))}>
      {pinned ? <PinOff aria-hidden /> : <Pin aria-hidden />}
    </Button>
  );
}

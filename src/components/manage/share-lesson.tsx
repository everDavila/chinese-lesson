"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Popover } from "@base-ui/react/popover";
import { Check, Copy, ExternalLink, Link2Off, Share2 } from "lucide-react";
import { setLessonShareAction } from "@/actions/manage";
import { Button } from "@/components/ui/button";
import { useRunner } from "./shell";

// Compartir la lección con un enlace público (/l/<código>): quien lo abra la
// ve en modo presentación, con las frases propias de la docente y sin
// votación. Sin prefijo de idioma: el navegador de quien lo abra elige.
export function ShareLesson({ lessonId, token }: { lessonId: string; token: string | null }) {
  const t = useTranslations("Manage");
  const { pending, error, run } = useRunner();
  const [copied, setCopied] = useState(false);
  const url = token && typeof window !== "undefined" ? `${window.location.origin}/l/${token}` : "";
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {}
  };
  return (
    <Popover.Root>
      <Popover.Trigger
        render={<Button variant={token ? "secondary" : "ghost"} disabled={pending} />}
        onClick={() => {
          if (!token) run(() => setLessonShareAction(lessonId, true));
        }}
      >
        <Share2 /> {token ? t("shared") : t("share")}
      </Popover.Trigger>
      {token && (
        <Popover.Portal>
          <Popover.Positioner sideOffset={8} align="end" className="z-50">
            <Popover.Popup className="flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3 rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-xl outline-none">
              <Popover.Title className="font-medium">{t("shareTitle")}</Popover.Title>
              <Popover.Description className="text-sm text-muted-foreground">{t("shareHint")}</Popover.Description>
              <input readOnly value={url} aria-label={t("shareLink")} onFocus={(e) => e.currentTarget.select()} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm" />
              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={copy}>
                  {copied ? <Check /> : <Copy />} {copied ? t("copied") : t("copyLink")}
                </Button>
                <Button size="sm" variant="outline" render={<a href={url} target="_blank" rel="noreferrer" role="link" />}>
                  <ExternalLink /> {t("openLink")}
                </Button>
                <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => setLessonShareAction(lessonId, false))}>
                  <Link2Off /> {t("stopSharing")}
                </Button>
              </div>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      )}
    </Popover.Root>
  );
}

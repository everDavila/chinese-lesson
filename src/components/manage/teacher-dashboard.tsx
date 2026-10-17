import { Clock3, FolderOpen, PencilLine, Pin, Play } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { startSessionAction } from "@/actions/class";
import { Button, buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { TeacherPin } from "@/lib/content";
import { cn } from "@/lib/utils";
import { ManageShell } from "./shell";
import { PinButton } from "./pin-button";

type Lesson = { id: string; title: string; collectionId: string; collectionTitle: string; items: number; updatedAt: string };

export async function TeacherDashboard({ isAdmin, lessons, pins }: { isAdmin: boolean; lessons: Lesson[]; pins: TeacherPin[] }) {
  const t = await getTranslations("TeacherHome");
  const locale = await getLocale();
  const pinnedIds = new Set(pins.map((pin) => `${pin.kind}:${pin.id}`));
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  return (
    <ManageShell isAdmin={isAdmin} crumbs={[]} title={null} wide>
      <header>
        <h1 className="font-hanzi text-4xl font-semibold">{t("homeTitle")}</h1>
        <p className="mt-1 text-muted-foreground">{t("homeSubtitle")}</p>
      </header>

      <section className="space-y-4" aria-labelledby="pinned-title">
        <SectionTitle icon={<Pin />} id="pinned-title" title={t("quickAccess")} hint={t("quickAccessHint")} />
        {pins.length ? <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{pins.map((pin) => <PinnedCard key={`${pin.kind}:${pin.id}`} pin={pin} />)}</ul> : (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
            <p>{t("noPins")}</p>
            <Link href="/lessons" className={cn(buttonVariants({ variant: "outline" }), "mt-4")}>{t("browseLessons")}</Link>
          </div>
        )}
      </section>

      <section className="space-y-4" aria-labelledby="recent-title">
        <SectionTitle icon={<Clock3 />} id="recent-title" title={t("recentLessons")} hint={t("recentLessonsHint")} />
        {lessons.length ? <ul className="overflow-hidden rounded-xl border border-border bg-card">{lessons.slice(0, 6).map((lesson) => (
          <li key={lesson.id} className="flex flex-wrap items-center gap-3 border-b border-border p-3 last:border-b-0 hover:bg-accent/40">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-muted text-primary"><span className="font-hanzi text-xl">{lesson.title.slice(0, 1)}</span></div>
            <div className="min-w-48 flex-1"><h3 className="font-medium">{lesson.title}</h3><p className="text-sm text-muted-foreground">{t("recentMeta", { words: lesson.items, collection: lesson.collectionTitle, date: date.format(new Date(lesson.updatedAt)) })}</p></div>
            <PinButton kind="lesson" id={lesson.id} pinned={pinnedIds.has(`lesson:${lesson.id}`)} />
            <form action={startSessionAction.bind(null, lesson.id)}><Button type="submit" variant="outline" disabled={!lesson.items}><Play aria-hidden /> {t("present")}</Button></form>
            <Link href={`/collections/${lesson.collectionId}/${lesson.id}`} className={buttonVariants({ variant: "outline" })}><PencilLine aria-hidden /> {t("edit")}</Link>
          </li>
        ))}</ul> : <p className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">{t("noLessons")}</p>}
      </section>
    </ManageShell>
  );
}

function SectionTitle({ icon, id, title, hint }: { icon: React.ReactNode; id: string; title: string; hint: string }) {
  return <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3"><div className="flex items-center gap-3"><span className="text-primary [&_svg]:size-5" aria-hidden>{icon}</span><div><h2 id={id} className="text-lg font-semibold">{title}</h2><p className="text-xs text-muted-foreground">{hint}</p></div></div><Link href="/lessons" className="text-sm text-primary hover:underline">→</Link></div>;
}

async function PinnedCard({ pin }: { pin: TeacherPin }) {
  const t = await getTranslations("TeacherHome");
  const lesson = pin.kind === "lesson";
  return (
    <li className="flex min-h-44 flex-col rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">{lesson ? <span className="font-hanzi text-xl">{pin.title.slice(0, 1)}</span> : <FolderOpen aria-hidden />}</div>
        <div className="min-w-0 flex-1"><p className="text-xs text-primary">{lesson ? t("lesson") : t("collection")}</p><h3 className="truncate font-medium">{pin.title}</h3><p className="text-sm text-muted-foreground">{lesson ? t("lessonMeta", { words: pin.items, collection: pin.collectionTitle }) : t("collectionMeta", { lessons: pin.lessons, words: pin.words })}</p></div>
        <PinButton kind={pin.kind} id={pin.id} pinned />
      </div>
      <div className={cn("mt-auto grid gap-2 pt-4", lesson && "grid-cols-2")}>
        {lesson ? <><form action={startSessionAction.bind(null, pin.id)}><Button className="w-full" type="submit" disabled={!pin.items}><Play aria-hidden /> {t("present")}</Button></form><Link href={`/collections/${pin.collectionId}/${pin.id}`} className={cn(buttonVariants({ variant: "outline" }), "w-full")}><PencilLine aria-hidden /> {t("edit")}</Link></> : <Link href={`/collections/${pin.id}`} className={cn(buttonVariants(), "w-full")}><FolderOpen aria-hidden /> {t("openCollection")}</Link>}
      </div>
    </li>
  );
}

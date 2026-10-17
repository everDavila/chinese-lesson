"use client";

import { useState } from "react";
import { PencilLine, Play, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { startSessionAction } from "@/actions/class";
import { Button, buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Empty, ManageShell, SearchInput } from "./shell";
import { PinButton } from "./pin-button";

type Lesson = { id: string; title: string; collectionId: string; collectionTitle: string; items: number; updatedAt: string };
type LooseLesson = { id: string; title: string; items: number };

export function TeacherLessonsScreen({ isAdmin, lessons, loose, pinnedIds }: { isAdmin: boolean; lessons: Lesson[]; loose: LooseLesson[]; pinnedIds: string[] }) {
  const t = useTranslations("TeacherLessons");
  const [query, setQuery] = useState("");
  const match = (title: string) => title.toLowerCase().includes(query.trim().toLowerCase());
  const shown = lessons.filter((lesson) => match(`${lesson.title} ${lesson.collectionTitle}`));
  const shownLoose = loose.filter((lesson) => match(lesson.title));

  return (
    <ManageShell isAdmin={isAdmin} crumbs={[]} title={t("title")} wide actions={<Link href="/collections?create=1" className={buttonVariants()}><Plus /> {t("newCollection")}</Link>}>
      <p className="max-w-3xl text-muted-foreground">{t("intro")}</p>
      <SearchInput value={query} onChange={setQuery} label={t("search")} />
      {shown.length > 0 && <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{shown.map((lesson) => (
        <li key={lesson.id} className="relative flex min-h-40 flex-col rounded-xl border border-border bg-card p-5">
          <div className="pr-10"><h2 className="font-semibold">{lesson.title}</h2><p className="text-sm text-muted-foreground">{lesson.collectionTitle} · {t("words", { count: lesson.items })}</p></div>
          <div className="absolute top-3 right-3"><PinButton kind="lesson" id={lesson.id} pinned={pinnedIds.includes(lesson.id)} /></div>
          <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
            <Link href={`/collections/${lesson.collectionId}/${lesson.id}`} className={cn(buttonVariants({ variant: "outline" }), "w-full")}><PencilLine /> {t("edit")}</Link>
            <form action={startSessionAction.bind(null, lesson.id)}><Button className="w-full" type="submit" disabled={!lesson.items}><Play /> {t("present")}</Button></form>
          </div>
        </li>
      ))}</ul>}
      {shownLoose.length > 0 && <section className="space-y-3"><h2 className="text-xl font-semibold">{t("loose")}</h2><ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{shownLoose.map((lesson) => (
        <li key={lesson.id} className="flex min-h-40 flex-col rounded-xl border border-border bg-card p-5">
          <div><h3 className="font-semibold">{lesson.title}</h3><p className="text-sm text-muted-foreground">{t("words", { count: lesson.items })}</p></div>
          <form className="mt-auto pt-5" action={startSessionAction.bind(null, lesson.id)}><Button className="w-full" type="submit" disabled={!lesson.items}><Play /> {t("present")}</Button></form>
        </li>
      ))}</ul></section>}
      {shown.length === 0 && shownLoose.length === 0 && <Empty>{query.trim() ? t("noMatches") : t("empty")}</Empty>}
    </ManageShell>
  );
}

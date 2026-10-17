"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Copy, Eye, Play } from "lucide-react";
import { startSessionAction } from "@/actions/class";
import { copyTemplateAction } from "@/actions/manage";
import { Button, buttonVariants } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/navigation";
import type { CollectionListItem, CollectionSummary, EditableLesson } from "@/lib/content";
import { Empty, ManageShell, SearchInput, meaningFor, useRunner } from "./shell";

const LEVELS = ["1", "2", "3", "4", "5", "6", "7–9"] as const;

export function HskLevelsScreen({ isAdmin, templates }: { isAdmin: boolean; templates: CollectionListItem[] }) {
  const t = useTranslations("HskLibrary");
  const byLevel = new Map(templates.map((item) => [item.title.match(/^HSK\s+(.+)$/i)?.[1]?.replace("-", "–"), item]));

  return (
    <ManageShell isAdmin={isAdmin} crumbs={[{ label: t("library"), href: "/library" }, { label: t("title") }]} title={t("title")} wide>
      <p className="max-w-3xl text-muted-foreground">{t("intro")}</p>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {LEVELS.map((level) => {
          const collection = byLevel.get(level);
          return (
            <li key={level} className="flex min-h-44 flex-col rounded-xl border border-border bg-card p-5">
              <h2 className="text-2xl font-semibold">HSK {level}</h2>
              {collection ? (
                <>
                  <p className="mt-2 text-sm text-muted-foreground">{t("lessonsWords", { lessons: collection.lessons, words: collection.words })}</p>
                  <Link href={`/library/hsk/${collection.id}`} className="mt-auto pt-8 text-sm font-medium text-primary hover:underline">
                    {t("seeLessons")} →
                  </Link>
                </>
              ) : (
                <>
                  <p className="mt-2 text-sm text-muted-foreground">{t("unavailableHint")}</p>
                  <span className="mt-auto pt-8 text-sm font-medium text-muted-foreground">{t("unavailable")}</span>
                </>
              )}
            </li>
          );
        })}
      </ul>
      <p className="rounded-xl border-l-2 border-primary bg-card px-4 py-3 text-sm text-muted-foreground">{t("officialBand")}</p>
    </ManageShell>
  );
}

export function HskCollectionScreen({ isAdmin, collection }: { isAdmin: boolean; collection: CollectionSummary }) {
  const t = useTranslations("HskLibrary");
  const router = useRouter();
  const { pending, error, run } = useRunner();
  const [query, setQuery] = useState("");
  const lessons = collection.lessons.filter((lesson) => lesson.title.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <ManageShell
      isAdmin={isAdmin}
      wide
      crumbs={[{ label: t("library"), href: "/library" }, { label: t("title"), href: "/library/hsk" }, { label: collection.title }]}
      title={<>{collection.title} <span className="ml-2 align-middle text-sm font-medium text-primary">{t("original")}</span></>}
      error={error}
      actions={
        <Button disabled={pending} onClick={() => run(() => copyTemplateAction(collection.id), (result) => router.push(`/collections/${result.id}`))}>
          <Copy /> {t("copyCollection")}
        </Button>
      }
    >
      <p className="text-muted-foreground">{t("collectionSummary", { lessons: collection.lessons.length, words: collection.lessons.reduce((total, lesson) => total + lesson.hanzi.length, 0) })}</p>
      <p className="rounded-xl border border-border bg-card px-4 py-3 text-sm"><strong>{t("customizeTitle")}</strong> {t("customizeHint")}</p>
      <SearchInput value={query} onChange={setQuery} label={t("searchLesson")} />
      {lessons.length ? (
        <ol className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {lessons.map((lesson) => (
            <li key={lesson.id} className="flex min-h-44 flex-col rounded-xl border border-border bg-card p-5">
              <div>
                <h2 className="font-semibold">{lesson.title} <span className="ml-2 text-xs font-normal text-muted-foreground">{t("wordsCount", { count: lesson.hanzi.length })}</span></h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("prepared")} · <strong>{t("readOnly")}</strong></p>
              </div>
              <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
                <Link href={`/library/hsk/${collection.id}/${lesson.id}`} className={buttonVariants({ variant: "outline" })}>
                  <Eye /> {t("viewWords")}
                </Link>
                <form action={startSessionAction.bind(null, lesson.id)}>
                  <Button className="w-full" type="submit" disabled={!lesson.hanzi.length}><Play /> {t("present")}</Button>
                </form>
              </div>
            </li>
          ))}
        </ol>
      ) : <Empty>{t("noLessons")}</Empty>}
    </ManageShell>
  );
}

export function HskLessonScreen({ isAdmin, collection, lesson }: { isAdmin: boolean; collection: CollectionSummary; lesson: EditableLesson }) {
  const t = useTranslations("HskLibrary");
  const locale = useLocale();
  const router = useRouter();
  const { pending, error, run } = useRunner();

  return (
    <ManageShell
      isAdmin={isAdmin}
      wide
      crumbs={[{ label: t("library"), href: "/library" }, { label: t("title"), href: "/library/hsk" }, { label: collection.title, href: `/library/hsk/${collection.id}` }, { label: lesson.title }]}
      title={<>{lesson.title} <span className="ml-2 align-middle text-sm font-medium text-primary">{t("readOnly")}</span></>}
      error={error}
      actions={<>
        <Button variant="outline" disabled={pending} onClick={() => run(() => copyTemplateAction(collection.id), (result) => router.push(`/collections/${result.id}`))}>
          <Copy /> {t("copyCollection")}
        </Button>
        <form action={startSessionAction.bind(null, lesson.id)}>
          <Button type="submit" disabled={!lesson.items.length}><Play /> {t("presentCount", { count: lesson.items.length })}</Button>
        </form>
      </>}
    >
      <p className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">{t("lessonNotice")}</p>
      <section>
        <h2 className="mb-4 text-xl font-semibold">{t("wordsCount", { count: lesson.items.length })}</h2>
        <ul className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {lesson.items.map((item) => {
            const sense = item.senses.find((candidate) => candidate.id === item.senseId) ?? item.senses[0];
            return (
              <li key={item.senseId} className="rounded-xl border border-border bg-card p-4 text-center">
                <p className="font-hanzi text-4xl">{item.hanzi}</p>
                <p className="mt-2 font-medium">{sense?.pinyin}</p>
                {sense && <p className="mt-1 text-sm text-muted-foreground">{meaningFor(locale, sense)}</p>}
                <p className="mt-2 text-xs text-muted-foreground">HSK {item.hsk}</p>
              </li>
            );
          })}
        </ul>
      </section>
    </ManageShell>
  );
}

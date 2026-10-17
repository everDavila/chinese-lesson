import { BookOpen, FolderOpen, Layers3, PencilLine, Play, Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { startSessionAction } from "@/actions/class";
import { Button, buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { CollectionListItem } from "@/lib/content";
import { cn } from "@/lib/utils";
import { ManageShell } from "./shell";

type Lesson = { id: string; title: string; collectionId: string; collectionTitle: string; items: number };

export async function TeacherHome({
  isAdmin,
  name,
  lessons,
  templates,
}: {
  isAdmin: boolean;
  name: string;
  lessons: Lesson[];
  templates: CollectionListItem[];
}) {
  const t = await getTranslations("TeacherHome");
  const hsk = templates.filter((item) => /^HSK\s/i.test(item.title));
  const topics = templates.filter((item) => !/^HSK\s/i.test(item.title));

  return (
    <ManageShell isAdmin={isAdmin} crumbs={[]} title={null} wide>
      <section className="overflow-hidden rounded-2xl border border-border bg-card px-6 py-8 sm:px-8">
        <p className="mb-2 text-sm font-medium text-primary">{t("eyebrow")}</p>
        <h1 className="font-hanzi text-4xl font-semibold sm:text-5xl">{t("greeting", { name: name || t("teacher") })}</h1>
        <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{t("intro")}</p>
      </section>

      <section className="grid gap-3 sm:grid-cols-3" aria-label={t("actionsLabel")}>
        <ActionCard href="/collections?create=1" icon={<Plus />} title={t("newCollection")} hint={t("newCollectionHint")} />
        <ActionCard href="/library" icon={<Layers3 />} title={t("explore")} hint={t("exploreHint")} />
        <ActionCard href="/collections" icon={<FolderOpen />} title={t("collections")} hint={t("collectionsHint")} />
      </section>

      <section id="lessons" className="scroll-mt-24 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold">{t("continue")}</h2>
          <Link href="/lessons" className="text-sm text-primary hover:underline">{t("seeAll")}</Link>
        </div>
        {lessons.length ? (
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {lessons.slice(0, 3).map((lesson) => (
              <li key={lesson.id} className="flex min-h-52 flex-col rounded-xl border border-border bg-card p-5">
                <div className="mb-5 flex size-11 items-center justify-center rounded-lg border border-primary/40 bg-primary/10 text-primary">
                  <BookOpen aria-hidden />
                </div>
                <h3 className="text-lg font-semibold">{lesson.title}</h3>
                <p className="text-sm text-muted-foreground">{lesson.collectionTitle} · {t("words", { count: lesson.items })}</p>
                <div className="mt-auto flex gap-2 pt-5">
                  <Link href={`/collections/${lesson.collectionId}/${lesson.id}`} className={cn(buttonVariants(), "flex-1")}>
                    <PencilLine aria-hidden /> {t("keepPreparing")}
                  </Link>
                  <form action={startSessionAction.bind(null, lesson.id)}>
                    <Button type="submit" variant="outline" size="icon" aria-label={t("present")} title={t("present")}>
                      <Play aria-hidden />
                    </Button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
            <p>{t("noLessons")}</p>
            <Link href="/library" className={cn(buttonVariants(), "mt-4")}>{t("explore")}</Link>
          </div>
        )}
      </section>

      <section className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold">{t("library")}</h2>
          <Link href="/library" className="text-sm text-primary hover:underline">{t("seeLibrary")}</Link>
        </div>
        {hsk.length > 0 && <LibraryRow title={t("hsk")} items={hsk.slice(0, 3)} kind="hsk" />}
        {topics.length > 0 && <LibraryRow title={t("topics")} items={topics.slice(0, 3)} kind="topics" />}
      </section>
    </ManageShell>
  );
}

function ActionCard({ href, icon, title, hint }: { href: "/collections" | "/collections?create=1" | "/library"; icon: React.ReactNode; title: string; hint: string }) {
  return (
    <Link href={href} className="group rounded-xl border border-border bg-card p-5 transition-colors hover:bg-accent">
      <span className="mb-5 block size-8 text-primary [&_svg]:size-8" aria-hidden>{icon}</span>
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
    </Link>
  );
}

async function LibraryRow({ title, items, kind }: { title: string; items: CollectionListItem[]; kind: "hsk" | "topics" }) {
  const t = await getTranslations("TeacherHome");
  return (
    <div>
      <h3 className="mb-3 font-medium">{title}</h3>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <li key={item.id}>
            <Link href={kind === "hsk" ? `/library/hsk/${item.id}` : "/library#topics"} className="block rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent">
              <p className="font-semibold">{item.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("lessonsWords", { lessons: item.lessons, words: item.words })}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { LessonEditor } from "@/components/manage/lesson-editor";
import { ManageLoading } from "@/components/manage/loading";
import { redirect } from "@/i18n/navigation";
import { getEditableLesson, listCollections } from "@/lib/content";
import { requireProfile } from "@/lib/guard";

type Params = PageProps<"/[locale]/lessons/[lessonId]">["params"];

// Editor de una lección suelta (sin colección). Si la lección está en una
// colección, su dirección es la de la colección.
export default function Page({ params }: { params: Params }) {
  return <Suspense fallback={<ManageLoading />}><Content params={params} /></Suspense>;
}

async function Content({ params }: { params: Params }) {
  const { lessonId } = await params;
  const profile = await requireProfile();
  const [lesson, mine] = await Promise.all([getEditableLesson(lessonId), listCollections("mine")]);
  if (!lesson || lesson.template) notFound();
  if (lesson.collectionId) {
    redirect({ href: `/collections/${lesson.collectionId}/${lesson.id}`, locale: await getLocale() });
    return null;
  }
  return (
    <LessonEditor
      mode="teacher"
      isAdmin={profile.role === "admin"}
      collection={null}
      lesson={lesson}
      myCollections={mine.map((c) => ({ id: c.id, title: c.title }))}
    />
  );
}

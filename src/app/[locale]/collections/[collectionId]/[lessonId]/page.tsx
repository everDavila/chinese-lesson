import { ManageLoading } from "@/components/manage/loading";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { LessonEditor } from "@/components/manage/lesson-editor";
import { getCollection, getEditableLesson, listCollections } from "@/lib/content";
import { requireProfile } from "@/lib/guard";

type Params = PageProps<"/[locale]/collections/[collectionId]/[lessonId]">["params"];

export default function Page({ params }: { params: Params }) {
  return (
    <Suspense fallback={<ManageLoading />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: Params }) {
  const { collectionId, lessonId } = await params;
  const profile = await requireProfile();
  const [collection, lesson, mine] = await Promise.all([getCollection(collectionId), getEditableLesson(lessonId), listCollections("mine")]);
  if (!collection || collection.template || !lesson || lesson.collectionId !== collectionId) notFound();
  return (
    <LessonEditor
      mode="teacher"
      isAdmin={profile.role === "admin"}
      collection={{ id: collection.id, title: collection.title }}
      lesson={lesson}
      myCollections={mine.map((c) => ({ id: c.id, title: c.title }))}
    />
  );
}

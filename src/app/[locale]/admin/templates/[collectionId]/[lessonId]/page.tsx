import { Suspense } from "react";
import { notFound } from "next/navigation";
import { LessonEditor } from "@/components/manage/lesson-editor";
import { getCollection, getEditableLesson, listWords } from "@/lib/content";
import { requireAdmin } from "@/lib/guard";

type Params = PageProps<"/[locale]/admin/templates/[collectionId]/[lessonId]">["params"];

export default function Page({ params }: { params: Params }) {
  return (
    <Suspense fallback={<main className="flex-1" aria-busy />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: Params }) {
  const { collectionId, lessonId } = await params;
  await requireAdmin();
  const [collection, lesson, words] = await Promise.all([getCollection(collectionId), getEditableLesson(lessonId), listWords()]);
  if (!collection?.template || !lesson || lesson.collectionId !== collectionId) notFound();
  return (
    <LessonEditor mode="admin" isAdmin collection={{ id: collection.id, title: collection.title }} lesson={lesson} words={words} />
  );
}

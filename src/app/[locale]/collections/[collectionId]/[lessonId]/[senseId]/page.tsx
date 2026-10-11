import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ExamplesScreen } from "@/components/manage/examples";
import { getCollection, getEditableLesson, getSenseExamples } from "@/lib/content";
import { requireProfile } from "@/lib/guard";

type Params = PageProps<"/[locale]/collections/[collectionId]/[lessonId]/[senseId]">["params"];

// Frases de una palabra de la lección: las de la base y las de la docente.
export default function Page({ params }: { params: Params }) {
  return (
    <Suspense fallback={<main className="flex-1" aria-busy />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: Params }) {
  const { collectionId, lessonId, senseId } = await params;
  const profile = await requireProfile();
  const [collection, lesson, data] = await Promise.all([
    getCollection(collectionId),
    getEditableLesson(lessonId),
    getSenseExamples(senseId),
  ]);
  if (!collection || !lesson || !data || lesson.collectionId !== collectionId) notFound();
  return (
    <ExamplesScreen
      isAdmin={profile.role === "admin"}
      collection={{ id: collection.id, title: collection.title }}
      lesson={{ id: lesson.id, title: lesson.title }}
      data={data}
    />
  );
}

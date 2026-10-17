import { Suspense } from "react";
import { notFound } from "next/navigation";
import { HskLessonScreen } from "@/components/manage/library-hsk";
import { ManageLoading } from "@/components/manage/loading";
import { getCollection, getEditableLesson } from "@/lib/content";
import { requireProfile } from "@/lib/guard";

type Params = PageProps<"/[locale]/library/hsk/[collectionId]/[lessonId]">["params"];

export default function Page({ params }: { params: Params }) {
  return <Suspense fallback={<ManageLoading />}><Content params={params} /></Suspense>;
}

async function Content({ params }: { params: Params }) {
  const { collectionId, lessonId } = await params;
  const [profile, collection, lesson] = await Promise.all([requireProfile(), getCollection(collectionId), getEditableLesson(lessonId)]);
  if (!collection?.template || !/^HSK\s/i.test(collection.title) || !lesson?.template || lesson.collectionId !== collection.id) notFound();
  return <HskLessonScreen isAdmin={profile.role === "admin"} collection={collection} lesson={lesson} />;
}

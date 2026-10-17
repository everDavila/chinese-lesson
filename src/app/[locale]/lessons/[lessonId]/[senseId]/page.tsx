import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { ExamplesScreen } from "@/components/manage/examples";
import { ManageLoading } from "@/components/manage/loading";
import { redirect } from "@/i18n/navigation";
import { getEditableLesson, getSenseExamples } from "@/lib/content";
import { requireProfile } from "@/lib/guard";

type Params = PageProps<"/[locale]/lessons/[lessonId]/[senseId]">["params"];

// Frases de una palabra de una lección suelta: las de la base y las de la docente.
export default function Page({ params }: { params: Params }) {
  return <Suspense fallback={<ManageLoading />}><Content params={params} /></Suspense>;
}

async function Content({ params }: { params: Params }) {
  const { lessonId, senseId } = await params;
  const profile = await requireProfile();
  const [lesson, data] = await Promise.all([getEditableLesson(lessonId), getSenseExamples(senseId)]);
  if (!lesson || lesson.template || !data) notFound();
  if (lesson.collectionId) {
    redirect({ href: `/collections/${lesson.collectionId}/${lesson.id}/${senseId}`, locale: await getLocale() });
    return null;
  }
  return <ExamplesScreen isAdmin={profile.role === "admin"} collection={null} lesson={{ id: lesson.id, title: lesson.title }} data={data} />;
}

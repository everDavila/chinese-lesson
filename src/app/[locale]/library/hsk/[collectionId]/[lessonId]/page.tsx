import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getCollection } from "@/lib/content";
import { requireProfile } from "@/lib/guard";

type Params = PageProps<"/[locale]/library/hsk/[collectionId]/[lessonId]">["params"];

// Ruta vieja (una lección de 15 de una plantilla HSK): lleva al vocabulario
// completo del nivel. La plantilla y sus lecciones siguen en la base.
export default function Page({ params }: { params: Params }) {
  return <Suspense fallback={null}><Content params={params} /></Suspense>;
}

async function Content({ params }: { params: Params }) {
  const { collectionId } = await params;
  const [, collection] = await Promise.all([requireProfile(), getCollection(collectionId)]);
  const level = collection?.template ? Number(collection.title.match(/^HSK\s+(\d)$/)?.[1]) : NaN;
  if (!level) notFound();
  redirect({ href: `/library/hsk/nivel/${level}`, locale: await getLocale() });
  return null;
}

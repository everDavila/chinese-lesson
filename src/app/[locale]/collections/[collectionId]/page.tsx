import { ManageLoading } from "@/components/manage/loading";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CollectionScreen } from "@/components/manage/collections";
import { getCollection, listCollections } from "@/lib/content";
import { requireProfile } from "@/lib/guard";

type Params = PageProps<"/[locale]/collections/[collectionId]">["params"];

export default function Page({ params }: { params: Params }) {
  return (
    <Suspense fallback={<ManageLoading />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: Params }) {
  const { collectionId } = await params;
  const profile = await requireProfile();
  const [collection, mine] = await Promise.all([getCollection(collectionId), listCollections("mine")]);
  // Las plantillas se copian, no se editan desde aquí.
  if (!collection || collection.template) notFound();
  return <CollectionScreen mode="teacher" isAdmin={profile.role === "admin"} collection={collection} myCollections={mine.map((m) => ({ id: m.id, title: m.title }))} />;
}

import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CollectionScreen } from "@/components/manage/collections";
import { getCollection } from "@/lib/content";
import { requireAdmin } from "@/lib/guard";

type Params = PageProps<"/[locale]/admin/templates/[collectionId]">["params"];

export default function Page({ params }: { params: Params }) {
  return (
    <Suspense fallback={<main className="flex-1" aria-busy />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: Params }) {
  const { collectionId } = await params;
  await requireAdmin();
  const collection = await getCollection(collectionId);
  if (!collection?.template) notFound();
  return <CollectionScreen mode="admin" isAdmin collection={collection} />;
}

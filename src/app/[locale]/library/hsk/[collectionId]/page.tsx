import { Suspense } from "react";
import { notFound } from "next/navigation";
import { HskCollectionScreen } from "@/components/manage/library-hsk";
import { ManageLoading } from "@/components/manage/loading";
import { getCollection } from "@/lib/content";
import { requireProfile } from "@/lib/guard";

type Params = PageProps<"/[locale]/library/hsk/[collectionId]">["params"];

export default function Page({ params }: { params: Params }) {
  return <Suspense fallback={<ManageLoading />}><Content params={params} /></Suspense>;
}

async function Content({ params }: { params: Params }) {
  const { collectionId } = await params;
  const [profile, collection] = await Promise.all([requireProfile(), getCollection(collectionId)]);
  if (!collection?.template || !/^HSK\s/i.test(collection.title)) notFound();
  return <HskCollectionScreen isAdmin={profile.role === "admin"} collection={collection} />;
}

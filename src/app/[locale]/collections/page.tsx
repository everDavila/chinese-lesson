import { ManageLoading } from "@/components/manage/loading";
import { Suspense } from "react";
import { CollectionsScreen } from "@/components/manage/collections";
import { listCollections, listTeacherPins } from "@/lib/content";
import { requireProfile } from "@/lib/guard";

// Colecciones de la docente y plantillas para copiar.
export default function Page({ searchParams }: { searchParams: Promise<{ q?: string; create?: string }> }) {
  return (
    <Suspense fallback={<ManageLoading />}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}

async function Content({ searchParams }: { searchParams: Promise<{ q?: string; create?: string }> }) {
  const { q = "", create } = await searchParams;
  const profile = await requireProfile();
  const [mine, pins] = await Promise.all([listCollections("mine"), listTeacherPins()]);
  return (
    <CollectionsScreen mode="teacher" isAdmin={profile.role === "admin"} mine={mine} pinnedIds={pins.filter((pin) => pin.kind === "collection").map((pin) => pin.id)} initialQuery={q} createOnLoad={create === "1"} />
  );
}

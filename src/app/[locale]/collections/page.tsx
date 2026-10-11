import { Suspense } from "react";
import { CollectionsScreen } from "@/components/manage/collections";
import { listCollections, listLooseLessons } from "@/lib/content";
import { requireProfile } from "@/lib/guard";

// Colecciones de la docente y plantillas para copiar.
export default function Page() {
  return (
    <Suspense fallback={<main className="flex-1" aria-busy />}>
      <Content />
    </Suspense>
  );
}

async function Content() {
  const profile = await requireProfile();
  const [mine, templates, loose] = await Promise.all([listCollections("mine"), listCollections("templates"), listLooseLessons()]);
  return (
    <CollectionsScreen mode="teacher" isAdmin={profile.role === "admin"} mine={mine} templates={templates} looseLessons={loose} />
  );
}

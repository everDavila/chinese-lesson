import { Suspense } from "react";
import { CollectionsScreen } from "@/components/manage/collections";
import { listCollections } from "@/lib/content";
import { requireAdmin } from "@/lib/guard";

// Plantillas (colecciones sin dueña): las ve y copia cualquier docente.
export default function Page() {
  return (
    <Suspense fallback={<main className="flex-1" aria-busy />}>
      <Content />
    </Suspense>
  );
}

async function Content() {
  await requireAdmin();
  const templates = await listCollections("templates");
  return <CollectionsScreen mode="admin" isAdmin mine={templates} templates={[]} />;
}

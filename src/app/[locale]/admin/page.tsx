import { ManageLoading } from "@/components/manage/loading";
import { Suspense } from "react";
import { ADMIN_PAGE, AdminWordsScreen } from "@/components/manage/admin";
import { listSuggestions, searchWords } from "@/lib/content";
import { requireAdmin } from "@/lib/guard";

// Inicio del admin: la base común.
export default function Page() {
  return (
    <Suspense fallback={<ManageLoading />}>
      <Content />
    </Suspense>
  );
}

async function Content() {
  await requireAdmin();
  // La primera página viene del servidor; los filtros buscan en la base.
  const [initial, suggestions] = await Promise.all([searchWords({ limit: ADMIN_PAGE }), listSuggestions()]);
  return <AdminWordsScreen initial={initial} pendingSuggestions={suggestions.length} />;
}

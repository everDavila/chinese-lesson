import { ManageLoading } from "@/components/manage/loading";
import { Suspense } from "react";
import { AdminWordsScreen } from "@/components/manage/admin";
import { listSuggestions, listWords } from "@/lib/content";
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
  const [words, suggestions] = await Promise.all([listWords(), listSuggestions()]);
  return <AdminWordsScreen words={words} pendingSuggestions={suggestions.length} />;
}

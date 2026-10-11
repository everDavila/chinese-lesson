import { Suspense } from "react";
import { SuggestionsScreen } from "@/components/manage/admin";
import { listSuggestions } from "@/lib/content";
import { requireAdmin } from "@/lib/guard";

// Frases que las docentes proponen para la base común.
export default function Page() {
  return (
    <Suspense fallback={<main className="flex-1" aria-busy />}>
      <Content />
    </Suspense>
  );
}

async function Content() {
  await requireAdmin();
  return <SuggestionsScreen suggestions={await listSuggestions()} />;
}

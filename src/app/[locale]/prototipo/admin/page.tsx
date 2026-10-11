import { Suspense } from "react";
import { AdminWordsRoute } from "@/components/prototipo/routes";

export default function Page() {
  return (
    <Suspense fallback={<main className="flex-1" aria-busy />}>
      <AdminWordsRoute />
    </Suspense>
  );
}

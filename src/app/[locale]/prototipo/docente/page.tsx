import { Suspense } from "react";
import { CollectionsRoute } from "@/components/prototipo/routes";

export default function Page() {
  return (
    <Suspense fallback={<main className="flex-1" aria-busy />}>
      <CollectionsRoute mode="docente" />
    </Suspense>
  );
}

import { Suspense } from "react";
import { CollectionRoute } from "@/components/prototipo/routes";

export default function Page() {
  return (
    <Suspense fallback={<main className="flex-1" aria-busy />}>
      <CollectionRoute mode="admin" />
    </Suspense>
  );
}

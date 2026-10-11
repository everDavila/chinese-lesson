import { Suspense } from "react";
import { AdminWordRoute } from "@/components/prototipo/routes";

export default function Page() {
  return (
    <Suspense fallback={<main className="flex-1" aria-busy />}>
      <AdminWordRoute />
    </Suspense>
  );
}

import { Suspense } from "react";
import { LessonRoute } from "@/components/prototipo/routes";

export default function Page() {
  return (
    <Suspense fallback={<main className="flex-1" aria-busy />}>
      <LessonRoute mode="docente" />
    </Suspense>
  );
}

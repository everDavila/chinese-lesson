import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Presentation } from "@/components/present/presentation";
import { getWordPreview } from "@/lib/lessons";
import { requireAdmin } from "@/lib/guard";

export const metadata: Metadata = { title: "Hanzi" };

type Params = PageProps<"/[locale]/admin/words/[hanzi]/preview">["params"];

// Vista previa de la tarjeta tal como se verá en clase: una por sentido, con
// lo último guardado.
export default function Page({ params }: { params: Params }) {
  return (
    <Suspense fallback={<div className="h-dvh" aria-busy />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: Params }) {
  const { hanzi } = await params;
  await requireAdmin();
  const decoded = decodeURIComponent(hanzi);
  const lesson = await getWordPreview(decoded);
  if (!lesson?.items.length) notFound();
  return <Presentation lesson={lesson} exitHref={`/admin/words/${encodeURIComponent(decoded)}`} />;
}

import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AdminWordEditor } from "@/components/manage/admin";
import { getEditableWord } from "@/lib/content";
import { requireAdmin } from "@/lib/guard";

type Params = PageProps<"/[locale]/admin/words/[hanzi]">["params"];

export default function Page({ params }: { params: Params }) {
  return (
    <Suspense fallback={<main className="flex-1" aria-busy />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: Params }) {
  const { hanzi } = await params;
  await requireAdmin();
  const word = await getEditableWord(decodeURIComponent(hanzi));
  if (!word) notFound();
  return <AdminWordEditor word={word} />;
}

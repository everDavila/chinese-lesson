import { Suspense } from "react";
import { notFound } from "next/navigation";
import { HskCatalogScreen } from "@/components/manage/library-hsk";
import { ManageLoading } from "@/components/manage/loading";
import { hskCatalog, listCollections } from "@/lib/content";
import { requireProfile } from "@/lib/guard";

type Params = PageProps<"/[locale]/library/hsk/nivel/[level]">["params"];
type Search = PageProps<"/[locale]/library/hsk/nivel/[level]">["searchParams"];

// Vocabulario completo de un nivel HSK (7 = banda 7–9), en orden oficial.
export default function Page({ params, searchParams }: { params: Params; searchParams: Search }) {
  return <Suspense fallback={<ManageLoading />}><Content params={params} searchParams={searchParams} /></Suspense>;
}

async function Content({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { level: raw } = await params;
  const level = Number(raw);
  if (!Number.isInteger(level) || level < 1 || level > 7) notFound();
  const q = (await searchParams).q;
  const query = (typeof q === "string" ? q : "").slice(0, 100);
  const [profile, initial, templates] = await Promise.all([requireProfile(), hskCatalog(level, query), listCollections("templates")]);
  // Copia temporal en lecciones de 15, mientras no se pueda crear lecciones
  // desde el catálogo. Solo existe para los niveles con plantilla (HSK 1–3).
  const template = templates.find((c) => c.title === `HSK ${level}`) ?? null;
  return (
    <HskCatalogScreen
      isAdmin={profile.role === "admin"}
      level={level}
      initialQuery={query}
      initial={initial}
      template={template && { id: template.id, title: template.title }}
    />
  );
}

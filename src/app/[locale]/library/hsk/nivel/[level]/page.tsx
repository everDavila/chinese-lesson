import { Suspense } from "react";
import { notFound } from "next/navigation";
import { HskCatalogScreen } from "@/components/manage/library-hsk";
import { ManageLoading } from "@/components/manage/loading";
import { CATALOG_PAGE_SIZES, hskCatalog, hskLevelCounts, listCollections } from "@/lib/content";
import { requireProfile } from "@/lib/guard";

type Params = PageProps<"/[locale]/library/hsk/nivel/[level]">["params"];
type Search = PageProps<"/[locale]/library/hsk/nivel/[level]">["searchParams"];

// Vocabulario completo de un nivel HSK (7 = banda 7–9), en orden oficial. La
// búsqueda y la página van en la dirección (?q=…&pagina=…&tamano=…): cada
// página se puede recargar, compartir y volver con «atrás».
export default function Page({ params, searchParams }: { params: Params; searchParams: Search }) {
  return <Suspense fallback={<ManageLoading />}><Content params={params} searchParams={searchParams} /></Suspense>;
}

const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");

async function Content({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { level: raw } = await params;
  const level = Number(raw);
  if (!Number.isInteger(level) || level < 1 || level > 7) notFound();
  const sp = await searchParams;
  const query = one(sp.q).slice(0, 100);
  const sizeParam = Number(one(sp.tamano));
  const size = (CATALOG_PAGE_SIZES as readonly number[]).includes(sizeParam) ? sizeParam : CATALOG_PAGE_SIZES[0];
  const requested = Math.max(1, Math.floor(Number(one(sp.pagina)) || 1));

  const [profile, templates, counts] = await Promise.all([requireProfile(), listCollections("templates"), hskLevelCounts()]);
  let data = await hskCatalog(level, query, requested, size);
  // Una página que ya no existe (otro tamaño, otra búsqueda): la última.
  const last = Math.max(1, Math.ceil(data.total / size));
  const page = Math.min(requested, last);
  if (page !== requested) data = await hskCatalog(level, query, page, size);

  // Copia temporal en lecciones de 15, mientras no se pueda crear lecciones
  // desde el catálogo. Solo existe para los niveles con plantilla (HSK 1–3).
  const template = templates.find((c) => c.title === `HSK ${level}`) ?? null;
  return (
    <HskCatalogScreen
      key={level}
      isAdmin={profile.role === "admin"}
      level={level}
      query={query}
      page={page}
      size={size}
      sizes={[...CATALOG_PAGE_SIZES]}
      data={data}
      levelTotal={counts[level] ?? 0}
      template={template && { id: template.id, title: template.title }}
    />
  );
}

import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AprendeFrame } from "@/components/aprende/frame";
import { getPictogramList } from "@/lib/aprende";
import { requireTeacher } from "@/lib/guard";
import { cn } from "@/lib/utils";

// Herramienta de revisión para la docente: los pictogramas de HSK 1–3 con la
// clasificación propuesta (clara, dudosa, descartada). El alumno no la ve.
export const metadata: Metadata = {
  title: "Pictogramas de HSK 1–3 · Renshi",
  robots: { index: false },
};

export default function Page({ params }: PageProps<"/[locale]/aprende/pictogramas-lista">) {
  return (
    <Suspense fallback={<main className="flex-1" aria-busy />}>
      <List params={params} />
    </Suspense>
  );
}

const ROW = { claro: "bg-green-500/10", dudoso: "bg-amber-500/10", descartar: "bg-red-500/10" } as const;
const COLS = ["colHanzi", "colPinyin", "colLevel", "colClass", "colNote", "colHint"] as const;

async function List({ params }: { params: PageProps<"/[locale]/aprende/pictogramas-lista">["params"] }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const profile = await requireTeacher();
  const t = await getTranslations("Learn");
  const list = getPictogramList();
  const by = list.metadata.porClasificacion;
  return (
    <AprendeFrame profile={profile} title={t("listTitle")} crumbs={[{ label: t("title"), href: "/aprende" }, { label: t("listTitle") }]}>
      <p className="rounded-lg border border-border border-l-4 border-l-primary bg-muted/50 px-4 py-3 text-sm text-muted-foreground">{list.metadata.descripcion}</p>
      <p className="mt-4 text-sm">{t("listCounts", { clear: by.claro ?? 0, doubtful: by.dudoso ?? 0, dropped: by.descartar ?? 0 })}</p>
      <div className="mt-4 overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-max text-left text-sm">
          <thead className="bg-muted/60">
            <tr>
              {COLS.map((c) => (
                <th key={c} scope="col" className="px-3 py-2 font-medium">{t(c)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.caracteres.map((r) => (
              <tr key={r.hanzi} className={cn("border-t border-border align-top", ROW[r.clasificacion])}>
                <td lang="zh-Hans" className="px-3 py-2 font-hanzi text-2xl">{r.hanzi}</td>
                <td lang="zh-Latn" className="px-3 py-2">{r.pinyin}</td>
                <td className="px-3 py-2">{r.nivelMinimoHSK3}</td>
                <td className="px-3 py-2">{r.clasificacion}</td>
                <td className="px-3 py-2">{r.nota}</td>
                <td lang="en" className="px-3 py-2 text-muted-foreground">{r.pistaDatasetEn}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AprendeFrame>
  );
}

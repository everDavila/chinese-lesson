import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

// Dominio de una palabra de 0 a 3 estrellas (derivado de la etapa y el intervalo, ver masteryStars).
export function MasteryStars({ stars }: { stars: 0 | 1 | 2 | 3 }) {
  const t = useTranslations("StudentWorkspace");
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={t("stars", { n: stars })}>
      {[1, 2, 3].map((i) => (
        <Star key={i} className={cn("size-4", i <= stars ? "fill-primary text-primary" : "text-border")} aria-hidden />
      ))}
    </span>
  );
}

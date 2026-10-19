import { Suspense } from "react";
import { LabChrome } from "@/components/lab/lab-chrome";

// Toda página de /lab lleva la franja de laboratorio (piloto en prueba o ya
// implementado, según src/lib/labs.ts): Ever graba la pantalla y quien vea el
// video tiene que saber qué es cada cosa. Va en el layout para que una página
// nueva no pueda olvidarla. usePathname va dentro de <Suspense> (Cache
// Components); mientras tanto, la franja de piloto, que es la prudente.
export default function LabLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={<div role="note" className="sticky top-0 z-50 h-9 border-b border-rating-2 bg-rating-2" />}>
        <LabChrome />
      </Suspense>
      {children}
    </>
  );
}

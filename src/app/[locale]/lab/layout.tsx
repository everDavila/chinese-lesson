import { FlaskConical } from "lucide-react";

// Toda página de /lab lleva esta franja: Ever graba la pantalla y quien vea
// el video tiene que saber que es un experimento, no Renshi terminado.
// Va en el layout para que una página nueva de laboratorio no pueda olvidarla.
export default function LabLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div
        role="note"
        className="sticky top-0 z-50 flex items-center justify-center gap-2 border-b border-rating-2 bg-rating-2 px-4 py-2 text-center text-sm font-medium text-black"
      >
        <FlaskConical aria-hidden className="size-4 shrink-0" />
        <span>
          <strong className="uppercase tracking-wide">Laboratorio</strong> · Piloto en prueba, no es la versión final
        </span>
      </div>
      {children}
    </>
  );
}

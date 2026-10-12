import { Suspense } from "react";
import type { Metadata } from "next";
import { StudentVote } from "@/components/vote/student-vote";

export const metadata: Metadata = { title: "Hanzi" };

type Params = PageProps<"/[locale]/v/[code]">["params"];

// Votación del alumno: hanzi.davila.uno/v/K7M2QX, sin login. El código sale
// de la URL (dato de la petición: va dentro de <Suspense>); lo que cambia lo
// pide el cliente cada pocos segundos.
export default function Page({ params }: { params: Params }) {
  return (
    <Suspense fallback={<main className="min-h-dvh" aria-busy />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: Params }) {
  const { code } = await params;
  return <StudentVote code={decodeURIComponent(code).toUpperCase()} />;
}

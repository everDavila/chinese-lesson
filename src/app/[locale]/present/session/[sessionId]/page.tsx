import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { Presentation } from "@/components/present/presentation";
import { redirect } from "@/i18n/navigation";
import { currentUserId, getLesson } from "@/lib/lessons";
import { getSession } from "@/lib/sessions";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Renshi" };

type Params = PageProps<"/[locale]/present/session/[sessionId]">["params"];

// Clase en vivo: la lección viene de Supabase y la votación de los alumnos
// se guarda en la sesión. RLS garantiza que solo su docente la ve.
export default function SessionPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<div className="h-dvh" aria-busy />}>
      <SessionContent params={params} />
    </Suspense>
  );
}

async function SessionContent({ params }: { params: Params }) {
  const { sessionId } = await params;
  if (!(await currentUserId())) redirect({ href: "/login", locale: await getLocale() });

  const session = await getSession(sessionId);
  if (!session) notFound();
  const lesson = await getLesson(session.lessonId, { sessionId: session.id });
  // Sin palabras con frases no hay tarjetas que mostrar.
  if (!lesson?.items.length) notFound();

  // Una lección rápida (presentada desde el catálogo) se puede guardar sin salir de la clase.
  const supabase = await createClient();
  const { data: row } = await supabase.from("lessons").select("quick, title").eq("id", session.lessonId).maybeSingle();

  return (
    <Presentation
      lesson={lesson}
      session={{ id: session.id, joinCode: session.joinCode }}
      saveQuick={row?.quick ? { lessonId: session.lessonId, title: row.title as string } : undefined}
    />
  );
}

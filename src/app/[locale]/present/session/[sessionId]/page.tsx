import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { Presentation } from "@/components/present/presentation";
import { redirect } from "@/i18n/navigation";
import { currentUserId, getLesson } from "@/lib/lessons";
import { getSession } from "@/lib/sessions";

export const metadata: Metadata = { title: "Hanzi" };

type Params = PageProps<"/[locale]/present/session/[sessionId]">["params"];

// Clase en vivo: la lección viene de Supabase y las valoraciones se guardan
// en la sesión (teacher_ratings). RLS garantiza que solo su docente la ve.
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

  return (
    <Presentation
      lesson={lesson}
      session={{ id: session.id, joinCode: session.joinCode, ratings: session.ratings }}
    />
  );
}

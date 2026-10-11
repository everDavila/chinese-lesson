import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Presentation } from "@/components/present/presentation";
import { currentUserId, getLesson } from "@/lib/lessons";
import { getSession } from "@/lib/sessions";

export const metadata: Metadata = { title: "Clase · Hanzi" };

// Clase en vivo: la lección viene de Supabase y las valoraciones se guardan
// en la sesión (teacher_ratings). RLS garantiza que solo la dueña la ve.
export default function SessionPage({ params }: PageProps<"/present/session/[sessionId]">) {
  return (
    <Suspense fallback={<div className="h-dvh" aria-busy />}>
      <SessionContent params={params} />
    </Suspense>
  );
}

async function SessionContent({ params }: { params: PageProps<"/present/session/[sessionId]">["params"] }) {
  const { sessionId } = await params;
  if (!(await currentUserId())) redirect("/login");

  const session = await getSession(sessionId);
  if (!session) notFound();
  const lesson = await getLesson(session.lessonId);
  if (!lesson) notFound();

  return (
    <Presentation
      lesson={lesson}
      session={{ id: session.id, joinCode: session.joinCode, ratings: session.ratings }}
    />
  );
}

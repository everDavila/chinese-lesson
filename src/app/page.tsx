import { Suspense } from "react";
import Link from "next/link";
import { createDemoLessonAction, startSessionAction } from "@/app/(present)/actions";
import { signOut } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { getDemoLesson } from "@/lib/demo-lesson";
import { currentUserId, listLessons } from "@/lib/lessons";

// Inicio. Sin sesión: la lección de demo local. Con sesión: las lecciones de
// la profesora en Supabase y el botón para empezar una clase. Lo que lee la
// sesión va dentro de <Suspense> (Cache Components: el resto es estático).
export default function Home() {
  return (
    <Suspense fallback={<main className="flex-1" aria-busy />}>
      <HomeContent />
    </Suspense>
  );
}

async function HomeContent() {
  const teacherId = await currentUserId();
  if (!teacherId) return <Guest />;

  const lessons = await listLessons();
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-16">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Hanzi</p>
          <h1 className="text-3xl font-semibold">Mis lecciones</h1>
        </div>
        <form action={signOut}>
          <Button type="submit" variant="ghost">Salir</Button>
        </form>
      </header>

      {lessons.length === 0 ? (
        <section className="flex flex-col items-start gap-3 rounded-xl border border-border bg-card p-6">
          <p>Aún no tienes lecciones.</p>
          <form action={createDemoLessonAction}>
            <Button type="submit" size="lg">Crear la lección de demo</Button>
          </form>
        </section>
      ) : (
        <ul className="flex flex-col gap-3">
          {lessons.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
              <div>
                <p className="font-medium">{l.title}</p>
                <p className="text-sm text-muted-foreground">{l.items} palabras</p>
              </div>
              <form action={startSessionAction.bind(null, l.id)}>
                <Button type="submit" size="lg">Empezar clase</Button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <Shortcuts />
    </main>
  );
}

function Guest() {
  const lesson = getDemoLesson();
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-16">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Hanzi · demo</p>
          <h1 className="text-3xl font-semibold">{lesson.title}</h1>
        </div>
        <Link href="/login" className="text-sm underline-offset-4 hover:underline">
          Entrar como profesora
        </Link>
      </header>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {lesson.items.map((it) => (
          <li key={it.word.hanzi} className="rounded-lg border border-border bg-card p-3 text-center">
            <p className="font-hanzi text-3xl">{it.word.hanzi}</p>
            <p className="text-sm text-muted-foreground">{it.word.senses[it.senseIndex].pinyin}</p>
            <p className="text-xs text-muted-foreground">HSK {it.word.hsk}</p>
          </li>
        ))}
      </ul>
      <Link
        href="/present"
        className="self-start rounded-lg bg-primary px-5 py-3 text-primary-foreground hover:bg-primary/85"
      >
        Presentar la lección
      </Link>
      <Shortcuts />
    </main>
  );
}

function Shortcuts() {
  return (
    <p className="text-sm text-muted-foreground">
      Atajos en la presentación: ← → palabra · Espacio girar · P pausa · R repetir · Y pinyin · T traducciones ·
      1–4 valorar · F pantalla completa
    </p>
  );
}

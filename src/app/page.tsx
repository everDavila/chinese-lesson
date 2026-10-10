import Link from "next/link";
import { getDemoLesson } from "@/lib/demo-lesson";

// Inicio provisional (fase 0): acceso a la lección de demo.
export default function Home() {
  const lesson = getDemoLesson();
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-16">
      <header>
        <p className="text-sm text-muted-foreground">Hanzi · demo</p>
        <h1 className="text-3xl font-semibold">{lesson.title}</h1>
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
      <p className="text-sm text-muted-foreground">
        Atajos: ← → palabra · Espacio girar · P pausa · R repetir · Y pinyin · T traducciones · 1–4 valorar · F pantalla completa
      </p>
    </main>
  );
}

"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/navigation";
import { Empty, ProtoShell, type Crumb } from "./shell";
import { prototype, usePrototype, type ProtoCollection } from "./store";

// Pantallas de colecciones y lecciones. Las comparten la docente (sus
// colecciones) y el admin (plantillas): cambia la base de las rutas y qué
// colecciones se ven.

export type Mode = "docente" | "admin";
const base = (mode: Mode) => (mode === "docente" ? "/prototipo/docente" : "/prototipo/admin/plantillas");
const homeCrumb = (mode: Mode): Crumb[] =>
  mode === "docente"
    ? [{ label: "Prototipo", href: "/prototipo" }, { label: "Docente", href: "/prototipo/docente" }]
    : [
        { label: "Prototipo", href: "/prototipo" },
        { label: "Admin", href: "/prototipo/admin" },
        { label: "Plantillas", href: "/prototipo/admin/plantillas" },
      ];

function wordCount(c: ProtoCollection) {
  return c.lessons.reduce((n, l) => n + l.items.length, 0);
}

function NewTitleForm({ placeholder, onCreate, label }: { placeholder: string; onCreate: (t: string) => void; label: string }) {
  const [title, setTitle] = useState("");
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (title.trim()) {
          onCreate(title.trim());
          setTitle("");
        }
      }}
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-background px-3"
      />
      <Button type="submit" disabled={!title.trim()}>
        <Plus /> {label}
      </Button>
    </form>
  );
}

function CollectionCard({ c, mode, onCopy }: { c: ProtoCollection; mode: Mode; onCopy?: () => void }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
      <div className="min-w-0">
        <Link href={`${base(mode)}/${c.id}`} className="font-medium hover:underline">
          {c.title}
        </Link>
        <p className="text-sm text-muted-foreground">
          {c.lessons.length} lecciones · {wordCount(c)} palabras
          {c.source ? ` · ${c.source}` : ""}
        </p>
      </div>
      {onCopy ? (
        <Button variant="outline" onClick={onCopy}>
          <Copy /> Usar esta plantilla
        </Button>
      ) : (
        <Link href={`${base(mode)}/${c.id}`} className={buttonVariants({ variant: "ghost" })}>
          Abrir
        </Link>
      )}
    </li>
  );
}

/** Lista de colecciones: las propias de la docente o las plantillas del admin. */
export function CollectionsScreen({ mode }: { mode: Mode }) {
  const state = usePrototype();
  const router = useRouter();
  const mine = state.collections.filter((c) => (mode === "docente" ? !c.template : c.template));
  const templates = state.collections.filter((c) => c.template);

  return (
    <ProtoShell
      crumbs={homeCrumb(mode).slice(0, -1).concat({ label: mode === "docente" ? "Docente" : "Plantillas" })}
      title={mode === "docente" ? "Mis colecciones" : "Plantillas"}
    >
      <section className="flex flex-col gap-3">
        <NewTitleForm
          placeholder={mode === "docente" ? "Nombre de la colección (p. ej. Básico 1)" : "Nombre de la plantilla (p. ej. HSK 2)"}
          label="Crear"
          onCreate={(t) => router.push(`${base(mode)}/${prototype.createCollection(t, mode === "admin")}`)}
        />
        {mine.length ? (
          <ul className="flex flex-col gap-2">
            {mine.map((c) => (
              <CollectionCard key={c.id} c={c} mode={mode} />
            ))}
          </ul>
        ) : (
          <Empty>{mode === "docente" ? "Aún no tienes colecciones." : "No hay plantillas."}</Empty>
        )}
      </section>

      {mode === "docente" && (
        <section className="flex flex-col gap-3">
          <div>
            <h2 className="text-xl font-semibold">Empezar desde una plantilla</h2>
            <p className="text-sm text-muted-foreground">
              Se crea una copia tuya: puedes cambiarla sin afectar a la plantilla.
            </p>
          </div>
          <ul className="flex flex-col gap-2">
            {templates.map((c) => (
              <CollectionCard
                key={c.id}
                c={c}
                mode={mode}
                onCopy={() => router.push(`${base(mode)}/${prototype.copyCollection(c.id)}`)}
              />
            ))}
          </ul>
        </section>
      )}
    </ProtoShell>
  );
}

/** Una colección: sus lecciones en orden. */
export function CollectionScreen({ mode, collectionId }: { mode: Mode; collectionId: string }) {
  const state = usePrototype();
  const router = useRouter();
  const c = state.collections.find((x) => x.id === collectionId);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");

  if (!c) {
    return (
      <ProtoShell crumbs={homeCrumb(mode)} title="Colección no encontrada">
        <Empty>Puede que la hayas borrado o restablecido el ejemplo.</Empty>
      </ProtoShell>
    );
  }

  return (
    <ProtoShell
      crumbs={[...homeCrumb(mode), { label: c.title }]}
      title={c.title}
      actions={
        <>
          <Button
            variant="ghost"
            onClick={() => {
              setTitle(c.title);
              setEditing(true);
            }}
          >
            <Pencil /> Renombrar
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              if (window.confirm(`¿Borrar "${c.title}" y sus lecciones?`)) {
                prototype.deleteCollection(c.id);
                router.push(base(mode));
              }
            }}
          >
            <Trash2 /> Borrar
          </Button>
        </>
      }
    >
      {editing && (
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (title.trim()) prototype.updateCollection(c.id, { title: title.trim() });
            setEditing(false);
          }}
        >
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-label="Nuevo nombre"
            className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-background px-3"
          />
          <Button type="submit">Guardar</Button>
        </form>
      )}
      {c.copiedFrom && (
        <p className="text-sm text-muted-foreground">Copia de una plantilla: los cambios aquí no la afectan.</p>
      )}

      <NewTitleForm
        placeholder={`Nombre de la lección (p. ej. Lección ${c.lessons.length + 1})`}
        label="Añadir lección"
        onCreate={(t) => router.push(`${base(mode)}/${c.id}/${prototype.addLesson(c.id, t)}`)}
      />

      {c.lessons.length ? (
        <ol className="flex flex-col gap-2">
          {c.lessons.map((l, i) => (
            <li key={l.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
              <span className="w-6 text-center text-sm text-muted-foreground tabular-nums">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <Link href={`${base(mode)}/${c.id}/${l.id}`} className="font-medium hover:underline">
                  {l.title}
                </Link>
                <p className="truncate text-sm text-muted-foreground">
                  {l.items.length} palabras
                  {l.items.length > 0 && (
                    <span className="font-hanzi"> · {l.items.slice(0, 12).map((it) => it.hanzi).join(" ")}</span>
                  )}
                </p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" aria-label="Subir" disabled={i === 0} onClick={() => prototype.moveLesson(c.id, l.id, -1)}>
                  <ArrowUp />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Bajar"
                  disabled={i === c.lessons.length - 1}
                  onClick={() => prototype.moveLesson(c.id, l.id, 1)}
                >
                  <ArrowDown />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Borrar lección"
                  onClick={() => window.confirm(`¿Borrar "${l.title}"?`) && prototype.deleteLesson(c.id, l.id)}
                >
                  <Trash2 />
                </Button>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <Empty>Esta colección aún no tiene lecciones.</Empty>
      )}
    </ProtoShell>
  );
}

export { base as collectionsBase, homeCrumb };

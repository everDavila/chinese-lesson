"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Copy, Eye, EyeOff, Pencil, Plus, Send, Trash2, Undo2 } from "lucide-react";
import {
  createExampleAction,
  deleteExampleAction,
  hideSentenceAction,
  suggestExampleAction,
  updateExampleAction,
  type ExampleInput,
} from "@/actions/manage";
import { Button } from "@/components/ui/button";
import type { ExampleStatus, OwnSentence, SenseExamples } from "@/lib/content";
import { cn } from "@/lib/utils";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useHomeCrumbs } from "./collections";
import { LevelNote, useLevelChecker } from "./level-check";
import { Empty, inputCls, ManageShell, meaningFor, useRunner } from "./shell";

// Frases de un sentido para la docente. Las de la base las cura el admin;
// ella puede ocultarlas en sus clases, hacer su versión ("editar una copia")
// o escribir las suyas. Las propias son privadas y salen en sus clases; si
// las sugiere y el admin las acepta, pasan a la base para todos.

// initial: cómo estaba al abrir el formulario, para avisar de campos sin actualizar.
type Editing = { id?: string; basedOn: string | null; value: ExampleInput; initial: ExampleInput };

export function ExamplesScreen({
  isAdmin,
  collection,
  lesson,
  data,
}: {
  isAdmin: boolean;
  /** Null: la palabra es de una lección suelta (sin colección). */
  collection: { id: string; title: string } | null;
  lesson: { id: string; title: string };
  data: SenseExamples;
}) {
  const t = useTranslations("Manage");
  const locale = useLocale();
  const crumbs = useHomeCrumbs("teacher");
  const { pending, error, setError, run } = useRunner();
  const [confirm, confirmDialog] = useConfirm();
  const checker = useLevelChecker();
  const [editing, setEditing] = useState<Editing | null>(null);
  const open = (e: Omit<Editing, "initial">) => setEditing({ ...e, initial: e.value });
  const translation = (s: { es: string; en: string }) => (locale === "es" ? s.es || s.en : s.en || s.es);
  const copyOf = new Map(data.own.filter((o) => o.basedOn && o.status !== "accepted").map((o) => [o.basedOn!, o]));
  const lessonHref = collection ? `/collections/${collection.id}/${lesson.id}` : `/lessons/${lesson.id}`;

  const save = (e: Editing) =>
    run(
      () => (e.id ? updateExampleAction(e.id, e.value) : createExampleAction(data.senseId, e.value, e.basedOn)),
      () => setEditing(null),
    );

  const form = (key: string) =>
    editing && (editing.id ?? `new:${editing.basedOn ?? ""}`) === key ? (
      <SentenceForm
        value={editing.value}
        initial={editing.initial}
        hanzi={data.hanzi}
        level={data.hsk}
        checker={checker}
        pending={pending}
        onChange={(value) => setEditing({ ...editing, value })}
        onCancel={() => setEditing(null)}
        onSave={() => save(editing)}
      />
    ) : null;

  return (
    <ManageShell
      isAdmin={isAdmin}
      crumbs={[
        ...(collection ? [...crumbs, { label: collection.title, href: `/collections/${collection.id}` }] : [{ label: t("myLessons"), href: "/lessons" }]),
        { label: lesson.title, href: lessonHref },
        { label: data.hanzi },
      ]}
      title={
        <>
          <span className="font-hanzi">{data.hanzi}</span> · {data.pinyin}
        </>
      }
      error={error}
    >
      <p className="-mt-4 text-muted-foreground">
        {meaningFor(locale, data)} · HSK {data.hsk || "?"}
      </p>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-xl font-semibold">{t("originals")}</h2>
          <p className="text-sm text-muted-foreground">{t("originalsHint")}</p>
        </div>
        {data.originals.length ? (
          <ul className="flex flex-col gap-2">
            {data.originals.map((s) => {
              const copy = copyOf.get(s.id);
              return (
                <li
                  key={s.id}
                  className={cn("flex flex-col gap-2 rounded-xl border border-border bg-card p-4", (s.hidden || copy) && "opacity-60")}
                >
                  <SentenceText zh={s.zh} pinyin={s.pinyin} translation={translation(s)} />
                  <div className="flex flex-wrap items-center gap-2">
                    {s.hidden && <Badge>{t("hiddenBadge")}</Badge>}
                    {copy && <Badge>{t("replacedBy")}</Badge>}
                    <span className="flex-1" />
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={Boolean(copy) || pending}
                      onClick={() =>
                        open({ basedOn: s.id, value: { zh: s.zh, pinyin: s.pinyin, es: s.es, en: s.en } })
                      }
                    >
                      <Copy /> {t("editCopy")}
                    </Button>
                    <Button variant="ghost" size="sm" disabled={pending} onClick={() => run(() => hideSentenceAction(s.id, !s.hidden))}>
                      {s.hidden ? <Eye /> : <EyeOff />} {s.hidden ? t("show") : t("hide")}
                    </Button>
                  </div>
                  {form(`new:${s.id}`)}
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty>{t("noOriginals")}</Empty>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold">{t("mine")}</h2>
            <p className="text-sm text-muted-foreground">{t("mineHint")}</p>
          </div>
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => open({ basedOn: null, value: { zh: "", pinyin: "", es: "", en: "" } })}
          >
            <Plus /> {t("newSentence")}
          </Button>
        </div>
        {form("new:")}
        {data.own.length ? (
          <ul className="flex flex-col gap-2">
            {data.own.map((o) => (
              <OwnRow
                key={o.id}
                o={o}
                basedOnZh={data.originals.find((s) => s.id === o.basedOn)?.zh}
                translation={translation(o)}
                pending={pending}
                form={form(o.id)}
                onEdit={() => open({ id: o.id, basedOn: o.basedOn, value: { zh: o.zh, pinyin: o.pinyin, es: o.es, en: o.en } })}
                onDelete={async () => (await confirm({ title: t("confirmDeleteSentence", { zh: o.zh }), confirmLabel: t("delete"), cancelLabel: t("cancel"), destructive: true })) && run(() => deleteExampleAction(o.id))}
                onSuggest={(submit) => {
                  if (submit && !o.pinyin) return setError(t("pinyinNeeded"));
                  run(() => suggestExampleAction(o.id, submit));
                }}
              />
            ))}
          </ul>
        ) : (
          !editing && <Empty>{t("noMine")}</Empty>
        )}
      </section>
      {confirmDialog}
    </ManageShell>
  );
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground", className)}>{children}</span>;
}

function SentenceText({ zh, pinyin, translation }: { zh: string; pinyin: string; translation: string }) {
  return (
    <div>
      <p className="font-hanzi text-2xl">{zh}</p>
      {pinyin && <p className="text-sm text-muted-foreground">{pinyin}</p>}
      {translation && <p className="text-sm">{translation}</p>}
    </div>
  );
}

const STATUS_STYLE: Record<ExampleStatus, string> = {
  draft: "",
  submitted: "bg-rating-2/25 text-foreground",
  accepted: "bg-rating-3/25 text-foreground",
  rejected: "bg-destructive/10 text-destructive",
};

function OwnRow({
  o,
  basedOnZh,
  translation,
  pending,
  form,
  onEdit,
  onDelete,
  onSuggest,
}: {
  o: OwnSentence;
  basedOnZh?: string;
  translation: string;
  pending: boolean;
  form: React.ReactNode;
  onEdit: () => void;
  onDelete: () => void;
  onSuggest: (submit: boolean) => void;
}) {
  const t = useTranslations("Manage");
  return (
    <li className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
      {form ?? <SentenceText zh={o.zh} pinyin={o.pinyin} translation={translation} />}
      {basedOnZh && <p className="text-xs text-muted-foreground">{t("basedOn", { zh: basedOnZh })}</p>}
      {o.status === "rejected" && o.reviewNote && (
        <p className="text-sm text-destructive">{t("reviewNote", { note: o.reviewNote })}</p>
      )}
      {!form && (
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={STATUS_STYLE[o.status]}>{t(`exampleStatus.${o.status}`)}</Badge>
          <span className="flex-1" />
          {o.status !== "accepted" && (
            <>
              {o.status === "submitted" ? (
                <Button variant="ghost" size="sm" disabled={pending} onClick={() => onSuggest(false)}>
                  <Undo2 /> {t("withdraw")}
                </Button>
              ) : (
                <>
                  <Button variant="ghost" size="sm" disabled={pending} onClick={onEdit}>
                    <Pencil /> {t("edit")}
                  </Button>
                  <Button variant="ghost" size="sm" disabled={pending} onClick={() => onSuggest(true)}>
                    <Send /> {t("suggest")}
                  </Button>
                </>
              )}
              <Button variant="ghost" size="sm" disabled={pending} onClick={onDelete}>
                <Trash2 /> {t("delete")}
              </Button>
            </>
          )}
        </div>
      )}
    </li>
  );
}

function SentenceForm({
  value,
  initial,
  hanzi,
  level,
  checker,
  pending,
  onChange,
  onCancel,
  onSave,
}: {
  value: ExampleInput;
  initial: ExampleInput;
  hanzi: string;
  level: number;
  checker: ReturnType<typeof useLevelChecker>;
  pending: boolean;
  onChange: (v: ExampleInput) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const t = useTranslations("Manage");
  // Cambió el chino pero el pinyin o la traducción siguen como estaban
  // (típico al editar una copia): se avisa, sin impedir guardar.
  const stale =
    initial.zh.trim() !== "" && value.zh.trim() !== initial.zh.trim()
      ? (["pinyin", "es", "en"] as const).filter((k) => initial[k].trim() !== "" && value[k].trim() === initial[k].trim())
      : [];
  const labels = { pinyin: t("fieldPinyin"), es: t("fieldEs"), en: t("fieldEn") };
  const field = (key: keyof ExampleInput, label: string, extra?: string) => (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <input value={value[key]} onChange={(e) => onChange({ ...value, [key]: e.target.value })} className={cn(inputCls, extra)} />
    </label>
  );
  return (
    <form
      className="grid gap-2 rounded-lg border border-primary/50 p-3 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
    >
      {field("zh", t("fieldZh"), "font-hanzi text-lg")}
      {field("pinyin", t("fieldPinyin"))}
      {field("es", t("fieldEs"))}
      {field("en", t("fieldEn"))}
      {stale.length > 0 && (
        <p role="status" className="rounded-md bg-rating-2/25 px-2 py-1 text-sm sm:col-span-2">
          {t("staleFields", { fields: stale.map((k) => labels[k]).join(", ") })}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2 sm:col-span-2">
        <LevelNote
          checker={checker}
          zh={value.zh}
          keyword={hanzi}
          level={level}
          labels={{
            empty: t("levelEmpty"),
            ok: (l) => t("levelOk", { level: l }),
            over: (l, pieces) => t("levelOver", { level: l, pieces }),
            outside: t("outsideList"),
          }}
        />
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t("cancel")}
          </Button>
          <Button type="submit" disabled={!value.zh.trim() || pending}>
            {t("save")}
          </Button>
        </div>
      </div>
    </form>
  );
}

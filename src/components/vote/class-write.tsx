"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { joinClassAction, submitWriteAction, whoAmIAction, type WriteSubmitStatus } from "@/actions/vote";
import { StrokeCells, type CellsProgress, type StrokeCellsHandle } from "@/components/student/stroke-cells";
import { Button } from "@/components/ui/button";
import { activeMs, shownCount, strokeSummary, type Pointer, type WriteAttempt, type WriteConfig } from "@/lib/write-stats";
import { FailedStrokes } from "./failed-strokes";

// Escritura en clase, lado del alumno (docs/DISENO-ESCRITURA-EN-CLASE.md): la
// profesora abrió una palabra para escribir. El alumno elige cómo lo ve ella
// (su cuenta o un apodo), escribe en su dispositivo y entrega: solo cuenta su
// primer intento de la palabra; repetir es práctica.

type Open = { evaluation: string; hanzi: string; pinyin: string; config: WriteConfig };
type Identity = { name: string };
type Preference = { mode: "account" | "nick"; nick: string };

const joinedKey = (code: string) => `renshi:clase:${code}`;
const PREFERENCE_KEY = "renshi:clase:preferencia";

// El dispositivo recuerda cómo entró la última vez; no son datos sensibles.
function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

const pointerOf = (type: string): Pointer | null => (type === "touch" || type === "mouse" || type === "pen" ? type : null);

export function ClassWrite({ code, round }: { code: string; round: Open }) {
  const t = useTranslations("Vote");
  const [identity, setIdentity] = useState<Identity | null | undefined>(undefined); // undefined: aún leyendo
  const [account, setAccount] = useState<{ loggedIn: boolean; displayName: string | null } | null>(null);

  // Al abrirse la primera ronda de escribir: ¿ya entró a esta clase? Si no, y recuerda
  // cómo entró la última vez, entra solo; si no, se le pregunta.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const who = await whoAmIAction().catch(() => ({ loggedIn: false, displayName: null }));
      if (cancelled) return;
      setAccount(who);
      const joined = read<Identity>(joinedKey(code));
      if (joined) return setIdentity(joined);
      const pref = read<Preference>(PREFERENCE_KEY);
      if (pref && (pref.mode === "nick" ? pref.nick : who.loggedIn)) {
        try {
          const r = await joinClassAction(code, pref.nick, pref.mode === "account");
          if (cancelled) return;
          if (r.status === "ok") {
            write(joinedKey(code), { name: r.name });
            return setIdentity({ name: r.name });
          }
        } catch {}
      }
      if (!cancelled) setIdentity(null);
    })();
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (identity === undefined) return <p className="py-16 text-center text-muted-foreground" aria-busy>…</p>;
  if (identity === null) {
    return (
      <JoinGate
        code={code}
        account={account}
        onJoined={(name, pref) => {
          write(joinedKey(code), { name });
          write(PREFERENCE_KEY, pref);
          setIdentity({ name });
        }}
      />
    );
  }
  return (
    <>
      <p className="text-center text-sm text-muted-foreground">
        {t("joinedAs", { name: identity.name })}{" "}
        <button type="button" className="underline underline-offset-4" onClick={() => setIdentity(null)}>
          {t("change")}
        </button>
      </p>
      <Writer key={round.evaluation} code={code} round={round} />
      <p className="mt-auto text-center text-xs text-muted-foreground">{t("visibleNotice")}</p>
    </>
  );
}

function JoinGate({
  code,
  account,
  onJoined,
}: {
  code: string;
  account: { loggedIn: boolean; displayName: string | null } | null;
  onJoined: (name: string, pref: Preference) => void;
}) {
  const t = useTranslations("Vote");
  const [nick, setNick] = useState(() => read<Preference>(PREFERENCE_KEY)?.nick ?? "");
  const [error, setError] = useState<"name" | "net" | null>(null);
  const [pending, startTransition] = useTransition();

  const join = (useAccount: boolean) => {
    if (!useAccount && !nick.trim()) return setError("name");
    setError(null);
    startTransition(async () => {
      try {
        const r = await joinClassAction(code, nick.trim(), useAccount);
        if (r.status === "ok") onJoined(r.name, { mode: useAccount ? "account" : "nick", nick: nick.trim() });
        else setError(r.status === "name_required" ? "name" : "net");
      } catch {
        setError("net");
      }
    });
  };

  return (
    <section className="flex flex-col gap-4" aria-labelledby="join-title">
      <h1 id="join-title" className="text-center text-lg font-medium">{t("joinTitle")}</h1>
      {account?.loggedIn && (
        <Button size="lg" disabled={pending} onClick={() => join(true)}>
          {account.displayName ? t("joinAccount", { name: account.displayName }) : t("joinAccountNoName")}
        </Button>
      )}
      <form
        className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4"
        onSubmit={(e) => {
          e.preventDefault();
          join(false);
        }}
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">{t("joinNick")}</span>
          <input
            value={nick}
            onChange={(e) => setNick(e.target.value)}
            maxLength={24}
            placeholder={t("nickPlaceholder")}
            aria-label={t("nickLabel")}
            autoComplete="nickname"
            className="rounded-lg border border-border bg-background px-3 py-2 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <Button type="submit" size="lg" variant={account?.loggedIn ? "outline" : "default"} disabled={pending}>{t("joinGo")}</Button>
      </form>
      {error && (
        <p role="alert" className="text-center text-sm text-destructive">
          {error === "name" ? t("joinNameRequired") : t("joinError")}
        </p>
      )}
    </section>
  );
}

type Sent = "idle" | "sending" | "practice" | WriteSubmitStatus | "error";

function Writer({ code, round }: { code: string; round: Open }) {
  const t = useTranslations("Vote");
  const cells = useRef<StrokeCellsHandle>(null);
  const progress = useRef<CellsProgress | null>(null);
  const pointer = useRef<Pointer | null>(null);
  const [run, setRun] = useState(0); // cada «probar otra vez» remonta las casillas
  const [attempt, setAttempt] = useState<WriteAttempt | null>(null);
  const [sent, setSent] = useState<Sent>("idle");
  const everSent = useRef(false); // solo el primer intento de la palabra se envía
  const [counted, setCounted] = useState(false); // lo mismo, para mostrarlo en pantalla
  const resultRef = useRef<HTMLDivElement>(null);
  const finished = useRef(false); // el mismo intento no se entrega dos veces aunque el aviso llegue repetido

  const send = async (a: WriteAttempt) => {
    setSent("sending");
    try {
      const status = await submitWriteAction(code, round.evaluation, a);
      if (status === "ok" || status === "duplicate") {
        everSent.current = true;
        setCounted(true);
      }
      setSent(status);
    } catch {
      setSent("error");
    }
  };

  const onProgress = (p: CellsProgress) => {
    progress.current = p;
    if (p.completed < p.total || finished.current) return;
    finished.current = true;
    const done: WriteAttempt = {
      v: 1,
      chars: p.chars,
      events: p.events,
      msFirst: p.msToFirstAction,
      msTotal: p.msTotal,
      pointer: pointer.current,
      guide: round.config.guide,
    };
    setAttempt(done);
    if (everSent.current) setSent("practice");
    else void send(done);
  };

  const retry = () => {
    progress.current = null;
    finished.current = false;
    setAttempt(null);
    setSent("idle");
    setRun((r) => r + 1);
  };

  // El resultado queda bajo el carácter: en el celular baja solo para que no se pierda.
  useEffect(() => {
    if (attempt) resultRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "nearest" });
  }, [attempt]);

  const chars = [...round.hanzi];
  const summary = attempt ? strokeSummary(attempt) : null;
  const shown = attempt ? shownCount(attempt) : 0;

  return (
    <section className="flex flex-col gap-4" aria-live="polite">
      <div className="text-center">
        <h1 className="text-lg font-medium">{t("writeTitle")}</h1>
        <p lang="zh-Latn" className="text-3xl text-muted-foreground">{round.pinyin}</p>
        <p className="text-sm text-muted-foreground">{round.config.guide ? t("writeHintGuide") : t("writeHintMemory")}</p>
      </div>

      <div onPointerDownCapture={(e) => void (pointer.current ??= pointerOf(e.pointerType))}>
        <StrokeCells key={`${round.evaluation}:${run}`} ref={cells} chars={chars} guide={round.config.guide} config={round.config} onProgress={onProgress} />
      </div>

      {!attempt ? (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => cells.current?.reveal()}>{t("giveUp")}</Button>
        </div>
      ) : (
        <div ref={resultRef} className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-4 text-center">
          <h2 className="text-sm font-medium text-muted-foreground">{t("resultTitle")}</h2>
          {summary && summary.total > 0 && (
            <p className="text-3xl font-semibold tabular-nums">{t("resultStrokes", { good: summary.firstTry, total: summary.total })}</p>
          )}
          {summary && summary.chars.some((c) => c.failed.length > 0) ? (
            <>
              <h3 className="text-sm text-muted-foreground">{t("failedTitle")}</h3>
              <FailedStrokes chars={summary.chars} label={({ char, list }) => t("failedLabel", { char, list })} />
            </>
          ) : (
            summary && summary.total > 0 && <p className="text-sm">{t("noFails")}</p>
          )}
          {shown > 0 && <p className="text-sm">{t("limitReached", { n: shown })}</p>}
          <p className="text-sm text-muted-foreground">{t("resultTime", { s: Math.round(activeMs(attempt) / 1000) })}</p>
          <p className="text-sm" role="status">
            {sent === "sending" && "…"}
            {sent === "ok" && <span className="text-muted-foreground">{t("waitingNext")}</span>}
            {sent === "duplicate" && t("duplicateNote")}
            {sent === "closed" && t("closedNote")}
            {sent === "not_joined" && t("notJoinedNote")}
            {sent === "practice" && t("practiceNote")}
            {(sent === "error" || sent === "invalid") && (
              <span className="text-destructive">
                {t("sendError")}{" "}
                <button type="button" className="underline underline-offset-4" onClick={() => void send(attempt)}>{t("sendRetry")}</button>
              </span>
            )}
          </p>
          <Button variant="outline" onClick={retry}>{counted ? t("retryPractice") : t("retry")}</Button>
        </div>
      )}
    </section>
  );
}

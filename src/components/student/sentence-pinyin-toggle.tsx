"use client";

import { useSyncExternalStore } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { prefsStore } from "./student-store";

// Control general del pinyin de las frases: por defecto oculto, para leer el
// chino primero. Cada frase tiene además su propio botón para revelarlo.
export function SentencePinyinToggle() {
  const prefs = useSyncExternalStore(prefsStore.subscribe, prefsStore.snapshot, prefsStore.serverSnapshot);
  return (
    <div className="mb-2 flex justify-end">
      <Button variant="outline" size="sm" aria-pressed={prefs.sentencePinyin} onClick={() => prefsStore.set({ ...prefs, sentencePinyin: !prefs.sentencePinyin })}>
        {prefs.sentencePinyin ? <EyeOff /> : <Eye />} {prefs.sentencePinyin ? "Ocultar pinyin de las frases" : "Mostrar pinyin de las frases"}
      </Button>
    </div>
  );
}

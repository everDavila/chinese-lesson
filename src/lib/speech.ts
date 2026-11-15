// Audio con la síntesis de voz del navegador (gratis; la calidad depende de
// las voces chinas instaladas en el sistema). Se cambiará por TTS en la nube
// si no basta.
// Velocidad elegida por el alumno en sus ajustes (student-store, clave
// «renshi:alumno:preferencias», campo audioRate). Se lee aquí para que valga en
// todos los botones de audio sin pasar la preferencia por cada componente.
const RATES = [0.6, 0.8, 1];
function savedRate(): number {
  try {
    const raw = localStorage.getItem("renshi:alumno:preferencias");
    const rate = raw ? (JSON.parse(raw) as { audioRate?: unknown }).audioRate : undefined;
    if (typeof rate === "number" && RATES.includes(rate)) return rate;
  } catch {}
  return 0.8;
}

export function speakChinese(text: string, rate = savedRate()) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  utterance.rate = rate;
  const voice = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith("zh"));
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}

// Audio con la síntesis de voz del navegador (gratis; la calidad depende de
// las voces chinas instaladas en el sistema). Se cambiará por TTS en la nube
// si no basta.
export function speakChinese(text: string, rate = 0.8) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  utterance.rate = rate;
  const voice = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith("zh"));
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}

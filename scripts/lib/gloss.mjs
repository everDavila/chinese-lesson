// Acorta una glosa inglesa a un máximo de caracteres sin dejarla cortada a
// media palabra ni con un paréntesis abierto ("to tend to (happen").
export function tidyGloss(text, max = 90) {
  const balanced = (s) => (s.match(/\(/g) ?? []).length <= (s.match(/\)/g) ?? []).length;
  // Completa: más corta que el máximo o terminada en ")" / "." sin nada abierto.
  if ((text.length < max || /[).]$/.test(text)) && balanced(text)) return text;
  let s = text.slice(0, max);
  let cut = false;
  // Se descarta el último segmento, que es el que quedó cortado.
  if (s.includes("; ")) {
    s = s.slice(0, s.lastIndexOf("; "));
    cut = true;
  }
  // Un paréntesis sin cerrar: se corta antes de él.
  while (!balanced(s)) {
    s = s.slice(0, s.lastIndexOf("(")).trimEnd();
    cut = true;
  }
  if (cut && s.trim()) return s.trimEnd().replace(/[;,]$/, "");
  // Sin separador donde cortar: hasta la última palabra completa.
  const head = text.slice(0, max);
  return head.slice(0, head.lastIndexOf(" ")).replace(/[\s;,(]+$/, "") + "…";
}

import { stdin, stdout } from "node:process";

/** Lee una línea de la terminal sin mostrarla (claves). Requiere terminal interactiva. */
export function askHidden(prompt) {
  if (!stdin.isTTY) {
    console.error("Ejecútalo en tu propia terminal: la clave se escribe a mano y no se muestra.");
    process.exit(1);
  }
  return new Promise((resolve) => {
    stdout.write(prompt);
    stdin.setRawMode(true);
    stdin.resume();
    let value = "";
    const onData = (buf) => {
      for (const ch of buf.toString("utf8")) {
        if (ch === "\r" || ch === "\n") {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off("data", onData);
          stdout.write("\n");
          return resolve(value);
        }
        if (ch === "\u0003") process.exit(130); // Ctrl+C
        if (ch === "\u007f" || ch === "\b") value = value.slice(0, -1);
        else value += ch;
      }
    };
    stdin.on("data", onData);
  });
}

/** Pide una clave nueva dos veces, sin mostrarla; sale si no coinciden o es corta. */
export async function askNewPassword(label) {
  const password = await askHidden(`Clave para ${label}: `);
  if (password.length < 8) {
    console.error("Mínimo 8 caracteres. No se cambió nada.");
    process.exit(1);
  }
  if ((await askHidden("Repítela: ")) !== password) {
    console.error("No coinciden. No se cambió nada.");
    process.exit(1);
  }
  return password;
}

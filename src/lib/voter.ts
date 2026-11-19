import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

const VOTER_COOKIE = "hanzi_voter";

/**
 * Identidad del alumno en la clase: un token aleatorio en una cookie httpOnly;
 * en la base solo queda su hash. Borrar la cookie o usar otro navegador = un
 * alumno nuevo. La comparten la votación y la escritura en clase.
 */
export async function voterHash(): Promise<string> {
  const jar = await cookies();
  let token = jar.get(VOTER_COOKIE)?.value;
  if (!token || !/^[0-9a-f]{64}$/.test(token)) {
    token = randomBytes(32).toString("hex");
    jar.set(VOTER_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 6 * 60 * 60,
    });
  }
  return createHash("sha256").update(token).digest("hex");
}

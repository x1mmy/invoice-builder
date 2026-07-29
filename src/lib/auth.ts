import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionValue } from "@/lib/session";

export async function requireAuth(): Promise<void> {
  const jar = await cookies();
  if (!verifySessionValue(jar.get(SESSION_COOKIE)?.value)) {
    throw new Error("Unauthorized");
  }
}

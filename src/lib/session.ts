import { createHmac, timingSafeEqual } from "crypto";

export const SESSION_COOKIE = "rr_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function authSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("Missing AUTH_SECRET in env.");
  }
  return secret;
}

export function createSessionValue(): string {
  const issuedAt = String(Date.now());
  const payload = `ok.${issuedAt}`;
  const sig = createHmac("sha256", authSecret()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifySessionValue(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [flag, issuedAt, sig] = parts;
  if (flag !== "ok" || !issuedAt || !sig) return false;

  const issued = Number(issuedAt);
  if (!Number.isFinite(issued)) return false;
  if (Date.now() - issued > MAX_AGE_SECONDS * 1000) return false;

  const payload = `${flag}.${issuedAt}`;
  const expected = createHmac("sha256", authSecret())
    .update(payload)
    .digest("hex");

  try {
    const a = Buffer.from(sig, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  };
}

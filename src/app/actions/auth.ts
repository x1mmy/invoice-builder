"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  createSessionValue,
  sessionCookieOptions,
} from "@/lib/session";

export type LoginState = { error?: string } | null;

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");
  const expected = process.env.APP_PASSWORD;

  if (!expected) {
    return { error: "App password is not configured." };
  }

  if (password !== expected) {
    return { error: "Incorrect password. Try again." };
  }

  const jar = await cookies();
  jar.set(SESSION_COOKIE, createSessionValue(), sessionCookieOptions());
  redirect("/");
}

export async function logoutAction(): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
  redirect("/login");
}

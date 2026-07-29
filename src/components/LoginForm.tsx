"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/actions/auth";
import { Logo } from "@/components/Logo";

const initial: LoginState = null;

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initial);

  return (
    <form action={action} className="mx-auto w-full max-w-sm space-y-5">
      <div className="space-y-2 text-center">
        <Logo className="mx-auto h-14 w-auto object-contain" />
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-stone-800">
          Radiant Rooms Co
        </h1>
        <p className="text-sm text-stone-500">Enter the password to open Books</p>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-stone-600">Password</span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          required
          className="w-full rounded-lg border border-stone-300 bg-white px-4 py-3 text-base text-stone-800 shadow-sm outline-none focus:border-[#5f7a64] focus:ring-2 focus:ring-[#5f7a64]/25"
        />
      </label>

      {state?.error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-[#5f7a64] px-4 py-3 text-base font-semibold text-white shadow-sm hover:bg-[#4e6754] disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Open Books"}
      </button>
    </form>
  );
}

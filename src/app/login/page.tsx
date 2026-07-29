import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[#e8ebe4]"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 20% 10%, rgba(95,122,100,0.18), transparent 55%), radial-gradient(ellipse at 85% 90%, rgba(196,165,116,0.16), transparent 50%)",
        }}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-stone-300/70 bg-[#f4f2ec]/95 p-6 shadow-sm sm:p-8">
        <LoginForm />
      </div>
    </div>
  );
}

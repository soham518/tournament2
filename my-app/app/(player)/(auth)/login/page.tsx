import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="mx-auto w-full max-w-sm py-8">
      <span className="font-[family-name:var(--font-space-mono)] text-[11px] font-bold uppercase tracking-widest text-[var(--usw-secondary-fixed-dim)]">
        [Access Protocol]
      </span>
      <h1 className="font-[family-name:var(--font-space-grotesk)] mb-1 mt-1 text-2xl font-bold uppercase text-[var(--usw-on-surface)]">
        Log in
      </h1>
      <p className="font-[family-name:var(--font-space-mono)] mb-6 text-sm text-[var(--usw-on-surface-variant)]">
        Welcome back, warrior.
      </p>
      <LoginForm />
      <p className="font-[family-name:var(--font-space-mono)] mt-6 text-sm text-[var(--usw-on-surface-variant)]">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-[var(--usw-secondary-fixed-dim)] underline">
          Create one
        </Link>
      </p>
    </div>
  );
}

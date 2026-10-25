import Link from "next/link";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <div className="mx-auto w-full max-w-sm py-8">
      <span className="font-[family-name:var(--font-space-mono)] text-[11px] font-bold uppercase tracking-widest text-[var(--usw-secondary-fixed-dim)]">
        [New Recruit // Enlistment]
      </span>
      <h1 className="font-[family-name:var(--font-space-grotesk)] mb-1 mt-1 text-2xl font-bold uppercase text-[var(--usw-on-surface)]">
        Create your account
      </h1>
      <p className="font-[family-name:var(--font-space-mono)] mb-6 text-sm text-[var(--usw-on-surface-variant)]">
        Do you have it in you?
      </p>
      <RegisterForm />
      <p className="font-[family-name:var(--font-space-mono)] mt-6 text-sm text-[var(--usw-on-surface-variant)]">
        Already have an account?{" "}
        <Link href="/login" className="text-[var(--usw-secondary-fixed-dim)] underline">
          Log in
        </Link>
      </p>
    </div>
  );
}

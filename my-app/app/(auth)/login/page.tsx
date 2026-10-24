import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="mx-auto w-full max-w-sm py-16">
      <h1 className="mb-1 text-2xl font-semibold">Log in</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Welcome back to the Shadow Fight Arena tournament platform.
      </p>
      <LoginForm />
      <p className="mt-6 text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="underline">
          Create one
        </Link>
      </p>
    </div>
  );
}

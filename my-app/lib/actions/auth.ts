"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { registerSchema } from "@/lib/validations/auth";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";

// On success these redirect() rather than returning — a thrown redirect
// inside a Server Action forces Next to re-render the whole layout tree
// (including the session-dependent NavBar) in one request. Returning a
// "success" value and navigating with client-side router.push() left the
// NavBar showing the stale signed-out state, since push() doesn't re-run
// shared layouts. Callers only ever see the error branch.
export type ActionResult = { success: false; error: string };

export async function registerAction(input: {
  username: string;
  email: string;
  password: string;
}): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { username, email, password } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
    select: { email: true, username: true },
  });
  if (existing) {
    const field = existing.email === email ? "Email" : "Username";
    return { success: false, error: `${field} is already taken` };
  }

  const passwordHash = await hashPassword(password);
  try {
    await prisma.user.create({
      data: { username, email, passwordHash, role: "PLAYER" },
    });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return { success: false, error: "Email or username is already taken" };
    }
    throw error;
  }

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: false, error: "Account created, but sign-in failed. Please log in." };
    }
    throw error;
  }

  redirect("/onboarding");
}

export async function loginAction(input: {
  email: string;
  password: string;
}): Promise<ActionResult> {
  try {
    await signIn("credentials", { ...input, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: false, error: "Invalid email or password" };
    }
    throw error;
  }

  redirect("/dashboard");
}

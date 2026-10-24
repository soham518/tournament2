import type { NextAuthConfig } from "next-auth";

// Edge-safe subset of the auth config: no providers with Node-only deps
// (Credentials' authorize() uses the pg driver + bcrypt). This is what
// proxy.ts uses for optimistic redirects; the full config with providers
// lives in auth.ts and only runs in route handlers / server components.
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "PLAYER" | "TOURNAMENT_ADMIN" | "SUPER_ADMIN";
      }
      return session;
    },
  },
};

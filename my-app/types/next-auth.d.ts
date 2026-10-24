import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "PLAYER" | "TOURNAMENT_ADMIN" | "SUPER_ADMIN";
    } & DefaultSession["user"];
  }

  interface User {
    role: "PLAYER" | "TOURNAMENT_ADMIN" | "SUPER_ADMIN";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "PLAYER" | "TOURNAMENT_ADMIN" | "SUPER_ADMIN";
  }
}

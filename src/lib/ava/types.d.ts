import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: "admin" | "professor" | "aluno";
  }

  interface Session {
    user: {
      id: string;
      role: "admin" | "professor" | "aluno";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "admin" | "professor" | "aluno";
  }
}

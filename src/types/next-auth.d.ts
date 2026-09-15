import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      accountId: string;
      role: string;
      tokenVersion: number;
    } & DefaultSession["user"];
  }

  interface User {
    accountId: string;
    role: string;
    tokenVersion: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accountId: string;
    role: string;
    tokenVersion: number;
  }
}

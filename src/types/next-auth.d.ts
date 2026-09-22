import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      accountId: string;
      tokenVersion: number;
    } & DefaultSession["user"];
  }

  interface User {
    accountId: string;
    tokenVersion: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accountId: string;
    tokenVersion: number;
  }
}

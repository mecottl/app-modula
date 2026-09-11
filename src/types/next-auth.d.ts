import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      accountId: string;
      role: string;
    } & DefaultSession["user"];
  }

  interface User {
    accountId: string;
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accountId: string;
    role: string;
  }
}

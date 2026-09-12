import crypto from "node:crypto";

export function generateProjectToken(): string {
  return crypto.randomBytes(24).toString("hex");
}

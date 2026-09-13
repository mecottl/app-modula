import fs from "node:fs";
import path from "node:path";

/**
 * Vitest no carga automáticamente .env.local como sí lo hace Next.js.
 * Cargamos manualmente (sin pisar variables ya definidas, ej. por CI)
 * para que las pruebas de integración tengan un DATABASE_URL real.
 */
function loadEnvFile(filename: string) {
  const filePath = path.resolve(process.cwd(), filename);
  if (!fs.existsSync(filePath)) return;

  for (const line of fs.readFileSync(filePath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL no está definido. Copia .env.example a .env.local o exporta la variable antes de correr las pruebas.",
  );
}

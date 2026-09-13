import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setupEnv.ts"],
    testTimeout: 20000,
    hookTimeout: 30000,
    // Las pruebas de aislamiento multi-tenant comparten fixtures reales en
    // Postgres — correrlas en paralelo entre archivos es seguro (cada
    // archivo crea sus propias cuentas), pero dentro de un mismo archivo
    // conviene serializar para que las aserciones de "no cambió nada" no
    // compitan entre sí.
    fileParallelism: true,
  },
});

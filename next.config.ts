import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  async headers() {
    // Solo /widget/* está pensado para vivir dentro de un <iframe> ajeno
    // (README.md sección 6.3). El resto de la app (dashboard, login)
    // bloquea el framing por defecto para evitar clickjacking.
    return [
      {
        source: "/dashboard/:path*",
        headers: [{ key: "X-Frame-Options", value: "SAMEORIGIN" }],
      },
      {
        source: "/login",
        headers: [{ key: "X-Frame-Options", value: "SAMEORIGIN" }],
      },
    ];
  },
};

export default nextConfig;

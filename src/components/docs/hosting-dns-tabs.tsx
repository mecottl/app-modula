"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Provider = {
  id: string;
  label: string;
  steps: string[];
};

const PROVIDERS: Provider[] = [
  {
    id: "vercel",
    label: "Vercel",
    steps: [
      "Ve a vercel.com/domains → tu dominio → pestaña \"DNS Records\".",
      "Agrega un registro CNAME: nombre = tu subdominio (ej. cotiza), valor = cname.vercel-dns.com.",
      "Agrega un registro TXT: nombre = _modula-verify.<subdominio>, valor = el token que te dé MODULA en el paso siguiente.",
    ],
  },
  {
    id: "cloudflare",
    label: "Cloudflare",
    steps: [
      "Ve a DNS → Records → Add record.",
      "Tipo CNAME, nombre = tu subdominio, destino = cname.vercel-dns.com. Pon el \"Proxy status\" en DNS only (nube gris): si queda en modo proxy (nube naranja), Vercel no puede emitir el certificado.",
      "Agrega otro registro tipo TXT con el nombre y valor exactos que te dé MODULA.",
    ],
  },
  {
    id: "otro",
    label: "Otro (Namecheap, GoDaddy, etc.)",
    steps: [
      "Entra a \"Manage DNS\" / \"Zona DNS\" de tu dominio en el panel de tu proveedor.",
      "Agrega un registro CNAME con host = tu subdominio, apuntando a cname.vercel-dns.com.",
      "Agrega un registro TXT con host = _modula-verify.<subdominio> y el valor exacto que te dé MODULA.",
    ],
  },
];

/**
 * Pasos de DNS por tipo de proveedor (issue "dame paso a paso igual
 * por opciones los pasos a seguir por tipo de hosting"): el registro a
 * agregar es el mismo en el fondo (CNAME + TXT), pero dónde se
 * configura y qué detalles importan (ej. el modo proxy de Cloudflare)
 * cambia según dónde vive el DNS del dominio.
 */
export function HostingDnsTabs() {
  const [active, setActive] = useState(0);
  const provider = PROVIDERS[active];

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="flex overflow-x-auto border-b border-border">
        {PROVIDERS.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setActive(i)}
            className={cn(
              "shrink-0 border-b-2 px-4 py-2.5 text-sm transition-colors",
              i === active
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
      <ol className="flex flex-col gap-2 p-4 text-sm text-muted-foreground">
        {provider.steps.map((step, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-foreground">{i + 1}.</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

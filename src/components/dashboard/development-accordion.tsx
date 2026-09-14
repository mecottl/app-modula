"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type DevelopmentRow = {
  id: string;
  name: string;
  slug: string;
  status: "BORRADOR" | "PUBLICADO";
  models: { id: string; name: string; basePrice: string }[];
};

/**
 * Lista de desarrollos como acordeón (issue "que se desplieguen sus
 * modelos a modo de vista previa, para abrir y cerrar así como lo
 * tenemos en Q&A del landing"): mismo patrón de FAQItem
 * (src/components/ui/faq-tabs.tsx) — clic en la fila expande/contrae
 * una vista previa del catálogo sin salir de la página. Abrir el
 * desarrollo completo es una acción aparte (botón con flecha), para no
 * mezclar "ver un vistazo" con "ir a editar".
 */
export function DevelopmentAccordion({ developments }: { developments: DevelopmentRow[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {developments.map((d) => (
        <DevelopmentAccordionItem key={d.id} development={d} />
      ))}
    </ul>
  );
}

function DevelopmentAccordionItem({ development }: { development: DevelopmentRow }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <li className={cn("rounded-xl border border-border transition-colors", isOpen && "bg-muted/30")}>
      <div className="flex items-center gap-2 p-4">
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          aria-expanded={isOpen}
          className="flex flex-1 items-center justify-between gap-4 text-left"
        >
          <div>
            <p className="font-medium">{development.name}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              /{development.slug}{" "}
              <span className={development.status === "PUBLICADO" ? "text-green-400" : "text-amber-400"}>
                · {development.status === "PUBLICADO" ? "Publicado" : "Borrador"}
              </span>
            </p>
          </div>
          <motion.span
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.2 }}
            className="shrink-0"
          >
            <Plus className="h-5 w-5 text-muted-foreground" />
          </motion.span>
        </button>
        <Link
          href={`/dashboard/developments/${development.id}/general`}
          aria-label={`Abrir ${development.name}`}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
        >
          Abrir
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <motion.div
        initial={false}
        animate={{ height: isOpen ? "auto" : "0px" }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <div className="flex flex-col gap-2 border-t border-border px-4 py-4">
          {development.models.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin modelos aún.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {development.models.map((model) => (
                <li key={model.id} className="flex items-center justify-between text-sm">
                  <span>{model.name}</span>
                  <span className="text-muted-foreground">${model.basePrice}</span>
                </li>
              ))}
            </ul>
          )}
          <Link
            href={`/dashboard/developments/${development.id}/models`}
            className="mt-1 self-start text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Ver catálogo completo →
          </Link>
        </div>
      </motion.div>
    </li>
  );
}

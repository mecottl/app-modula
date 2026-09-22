import { Info } from "lucide-react";

/** Icono "i" con tooltip al hover — para texto de ayuda que no necesita estar siempre visible. */
export function InfoTooltip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex align-middle">
      <Info className="h-3.5 w-3.5 text-muted-foreground" />
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 w-56 -translate-x-1/2 scale-95 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-normal normal-case text-foreground opacity-0 shadow-md transition-[opacity,transform] duration-150 group-hover:scale-100 group-hover:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}

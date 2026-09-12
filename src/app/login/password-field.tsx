"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export function PasswordField() {
  const [visible, setVisible] = useState(false);

  return (
    <label className="flex flex-col gap-1 text-sm">
      Contraseña
      <div className="relative">
        <input
          name="password"
          type={visible ? "text" : "password"}
          required
          className="w-full rounded-md border border-border bg-transparent px-3 py-2 pr-10 outline-none focus:border-foreground"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition-colors hover:text-foreground"
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </label>
  );
}

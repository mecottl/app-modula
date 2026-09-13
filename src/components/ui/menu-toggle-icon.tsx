import * as React from "react";

interface MenuToggleIconProps extends React.ComponentProps<"svg"> {
  open: boolean;
  duration?: number;
}

/**
 * Ícono de hamburguesa que se transforma en X (usado por Header en
 * header-2.tsx para el botón de menú móvil).
 */
export function MenuToggleIcon({ open, duration = 300, style, ...props }: MenuToggleIconProps) {
  const transition = `transform ${duration}ms ease, opacity ${duration}ms ease`;

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...props}>
      <line
        x1="4"
        y1="7"
        x2="20"
        y2="7"
        style={{
          transition,
          transformOrigin: "center",
          transform: open ? "translateY(5px) rotate(45deg)" : "none",
          ...style,
        }}
      />
      <line
        x1="4"
        y1="12"
        x2="20"
        y2="12"
        style={{ transition, opacity: open ? 0 : 1 }}
      />
      <line
        x1="4"
        y1="17"
        x2="20"
        y2="17"
        style={{
          transition,
          transformOrigin: "center",
          transform: open ? "translateY(-5px) rotate(-45deg)" : "none",
        }}
      />
    </svg>
  );
}

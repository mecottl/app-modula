import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Texto claro u oscuro según qué se lea mejor sobre un color de fondo
 * (fórmula YIQ) — usado donde el color viene de la marca de una
 * desarrolladora (color de acento) y no se puede asumir que siempre
 * sea oscuro, como el botón de cotizar del configurador público.
 */
export function getContrastText(hex: string): string {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return "#fafaf7";
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 150 ? "#121111" : "#fafaf7";
}

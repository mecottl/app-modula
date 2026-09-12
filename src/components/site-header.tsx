"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-10 border-b transition-all duration-300",
        scrolled
          ? "border-border bg-background/90 backdrop-blur"
          : "border-transparent bg-transparent",
      )}
    >
      <div
        className={cn(
          "mx-auto flex max-w-5xl items-center justify-between px-6 transition-all duration-300",
          scrolled ? "py-3" : "py-5",
        )}
      >
        <span className="text-sm font-semibold tracking-tight">MODULA</span>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground sm:flex">
          <a href="#producto" className="transition-colors hover:text-foreground">
            Producto
          </a>
          <a href="#como-funciona" className="transition-colors hover:text-foreground">
            Cómo funciona
          </a>
          <a href="#planes" className="transition-colors hover:text-foreground">
            Planes
          </a>
        </nav>
        <div className="flex items-center gap-5">
          <Link
            href="/login"
            className="hidden text-sm font-medium text-foreground transition-colors hover:text-muted-foreground sm:block"
          >
            Iniciar sesión
          </Link>
          <a
            href="#planes"
            className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Comenzar
          </a>
        </div>
      </div>
    </header>
  );
}

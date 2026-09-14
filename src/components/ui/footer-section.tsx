"use client";

import type { ComponentProps, ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import React from "react";
import { getCurrentTheme } from "@/lib/theme";

interface FooterLink {
  title: string;
  href: string;
}

interface FooterSectionData {
  label: string;
  links: FooterLink[];
}

/**
 * Footer (componente de 21st.dev, implementado al pie de la letra —
 * degradado radial, línea con blur, animación de entrada). Los enlaces
 * y la marca son los reales de MODULA; se omite la sección de redes
 * sociales del original porque no existen cuentas reales todavía.
 */
const footerLinks: FooterSectionData[] = [
  {
    label: "Producto",
    links: [
      { title: "Producto", href: "/#producto" },
      { title: "Cómo funciona", href: "/#como-funciona" },
      { title: "Planes", href: "/#planes" },
    ],
  },
  {
    label: "Cuenta",
    links: [{ title: "Entrar al dashboard", href: "/login" }],
  },
  {
    label: "Recursos",
    links: [
      { title: "Documentación", href: "/docs" },
      { title: "Código en GitHub", href: "https://github.com/mecottl/app-modula" },
      {
        title: "Instalación del widget",
        href: "https://github.com/mecottl/app-modula/blob/master/docs/widget-installation.md",
      },
    ],
  },
];

export function Footer() {
  const [logoSrc, setLogoSrc] = React.useState("/ICONO-BLANCO.svg");

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza con data-theme fijado por el script inline de layout.tsx, no con el montaje
    setLogoSrc(getCurrentTheme() === "light" ? "/ICONO-NEGRO.svg" : "/ICONO-BLANCO.svg");
    const observer = new MutationObserver(() => {
      setLogoSrc(getCurrentTheme() === "light" ? "/ICONO-NEGRO.svg" : "/ICONO-BLANCO.svg");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  return (
    <footer className="md:rounded-t-6xl relative mx-auto flex w-full max-w-6xl flex-col items-center justify-center rounded-t-4xl border-t bg-[radial-gradient(35%_128px_at_50%_0%,theme(backgroundColor.white/8%),transparent)] px-6 py-12 lg:py-16">
      <div className="bg-foreground/20 absolute top-0 right-1/2 left-1/2 h-px w-1/3 -translate-x-1/2 -translate-y-1/2 rounded-full blur" />

      <div className="grid w-full gap-8 xl:grid-cols-3 xl:gap-8">
        <AnimatedContainer className="space-y-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} alt="MODULA" className="size-8" />
          <p className="text-muted-foreground mt-8 text-sm md:mt-0">
            © {new Date().getFullYear()} MODULA. Todos los derechos reservados.
          </p>
        </AnimatedContainer>

        <div className="mt-10 grid grid-cols-2 gap-8 sm:grid-cols-3 xl:col-span-2 xl:mt-0">
          {footerLinks.map((section, index) => (
            <AnimatedContainer key={section.label} delay={0.1 + index * 0.1}>
              <div className="mb-10 md:mb-0">
                <h3 className="text-xs">{section.label}</h3>
                <ul className="text-muted-foreground mt-4 space-y-2 text-sm">
                  {section.links.map((link) => (
                    <li key={link.title}>
                      <a
                        href={link.href}
                        target={link.href.startsWith("http") ? "_blank" : undefined}
                        rel={link.href.startsWith("http") ? "noreferrer" : undefined}
                        className="hover:text-foreground inline-flex items-center transition-all duration-300"
                      >
                        {link.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </AnimatedContainer>
          ))}
        </div>
      </div>
    </footer>
  );
}

type ViewAnimationProps = {
  delay?: number;
  className?: ComponentProps<typeof motion.div>["className"];
  children: ReactNode;
};

function AnimatedContainer({ className, delay = 0.1, children }: ViewAnimationProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ filter: "blur(4px)", translateY: -8, opacity: 0 }}
      whileInView={{ filter: "blur(0px)", translateY: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.8 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}


"use client";

import type { ComponentProps, ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

interface FooterLink {
  title: string;
  href: string;
}

interface FooterSectionData {
  label: string;
  links: FooterLink[];
}

/**
 * Footer (adaptado de un componente de 21st.dev). Solo enlaces reales:
 * nada de redes sociales inventadas ni secciones (blog, changelog) que
 * no existen todavía en el sitio.
 */
const footerLinks: FooterSectionData[] = [
  {
    label: "Producto",
    links: [
      { title: "Producto", href: "#producto" },
      { title: "Cómo funciona", href: "#como-funciona" },
      { title: "Planes", href: "#planes" },
    ],
  },
  {
    label: "Cuenta",
    links: [{ title: "Entrar al dashboard", href: "/login" }],
  },
  {
    label: "Recursos",
    links: [
      { title: "Código en GitHub", href: "https://github.com/mecottl/app-modula" },
      {
        title: "Instalación del widget",
        href: "https://github.com/mecottl/app-modula/blob/master/docs/widget-installation.md",
      },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative w-full border-t bg-background px-6 py-12 lg:py-16">
      <div className="mx-auto grid w-full max-w-5xl gap-8 sm:grid-cols-2 md:grid-cols-4">
        <AnimatedContainer className="space-y-4">
          <span className="text-sm font-semibold tracking-tight">MODULA</span>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} MODULA. Todos los derechos reservados.
          </p>
        </AnimatedContainer>

        {footerLinks.map((section, index) => (
          <AnimatedContainer key={section.label} delay={0.1 + index * 0.1}>
            <h3 className="text-xs font-medium text-muted-foreground">{section.label}</h3>
            <ul className="mt-4 space-y-2 text-sm">
              {section.links.map((link) => (
                <li key={link.title}>
                  <a
                    href={link.href}
                    target={link.href.startsWith("http") ? "_blank" : undefined}
                    rel={link.href.startsWith("http") ? "noreferrer" : undefined}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.title}
                  </a>
                </li>
              ))}
            </ul>
          </AnimatedContainer>
        ))}
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
      transition={{ delay, duration: 0.6 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

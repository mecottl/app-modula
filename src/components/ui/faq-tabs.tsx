"use client";

import { useState, type HTMLAttributes } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FAQItemData {
  question: string;
  answer: string;
}

export interface FAQProps extends HTMLAttributes<HTMLElement> {
  title?: string;
  subtitle?: string;
  categories: Record<string, string>;
  faqData: Record<string, FAQItemData[]>;
}

/**
 * FAQ con pestañas por categoría (adaptado de un componente de 21st.dev,
 * ver docs/widget-installation.md para contexto de qué preguntas
 * responde). Sin gradientes ni glow decorativo — sigue el sistema de
 * diseño monocromático de MODULA (Swiss/Minimalism, ver globals.css).
 */
export function FAQ({
  title = "FAQs",
  subtitle = "Preguntas frecuentes",
  categories,
  faqData,
  className,
  ...props
}: FAQProps) {
  const categoryKeys = Object.keys(categories);
  const [selectedCategory, setSelectedCategory] = useState(categoryKeys[0]);

  return (
    <section className={cn("bg-background px-4 py-12 text-foreground", className)} {...props}>
      <div className="flex flex-col items-center justify-center">
        <span className="mb-3 text-sm font-medium text-muted-foreground">{subtitle}</span>
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
      </div>
      <FAQTabs categories={categories} selected={selectedCategory} setSelected={setSelectedCategory} />
      <FAQList faqData={faqData} selected={selectedCategory} />
    </section>
  );
}

function FAQTabs({
  categories,
  selected,
  setSelected,
}: {
  categories: Record<string, string>;
  selected: string;
  setSelected: (key: string) => void;
}) {
  return (
    <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
      {Object.entries(categories).map(([key, label]) => (
        <button
          key={key}
          type="button"
          onClick={() => setSelected(key)}
          className={cn(
            "relative overflow-hidden whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition-colors duration-300",
            selected === key
              ? "border-primary text-primary-foreground"
              : "border-border bg-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <span className="relative z-10">{label}</span>
          <AnimatePresence>
            {selected === key && (
              <motion.span
                initial={{ y: "100%" }}
                animate={{ y: "0%" }}
                exit={{ y: "100%" }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="absolute inset-0 z-0 bg-primary"
              />
            )}
          </AnimatePresence>
        </button>
      ))}
    </div>
  );
}

function FAQList({
  faqData,
  selected,
}: {
  faqData: Record<string, FAQItemData[]>;
  selected: string;
}) {
  return (
    <div className="mx-auto mt-10 max-w-2xl">
      <AnimatePresence mode="wait">
        {Object.entries(faqData).map(([category, questions]) => {
          if (selected !== category) return null;
          return (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="space-y-3"
            >
              {questions.map((faq) => (
                <FAQItem key={faq.question} {...faq} />
              ))}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function FAQItem({ question, answer }: FAQItemData) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={cn("rounded-xl border transition-colors", isOpen ? "bg-muted/50" : "bg-card")}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 p-4 text-left"
      >
        <span
          className={cn(
            "text-base font-medium transition-colors",
            isOpen ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {question}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0"
        >
          <Plus
            aria-hidden="true"
            className={cn("h-5 w-5 transition-colors", isOpen ? "text-foreground" : "text-muted-foreground")}
          />
        </motion.span>
      </button>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? "auto" : "0px", marginBottom: isOpen ? "16px" : "0px" }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="overflow-hidden px-4"
      >
        <p className="text-sm text-muted-foreground">{answer}</p>
      </motion.div>
    </div>
  );
}

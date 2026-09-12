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
 * FAQ con pestañas por categoría (componente de 21st.dev, implementado
 * al pie de la letra — gradiente, glow y animaciones originales — solo
 * con tipado TypeScript real y motion/react en vez de framer-motion
 * para no duplicar librería de animación).
 */
export function FAQ({
  title = "FAQs",
  subtitle = "Frequently Asked Questions",
  categories,
  faqData,
  className,
  ...props
}: FAQProps) {
  const categoryKeys = Object.keys(categories);
  const [selectedCategory, setSelectedCategory] = useState(categoryKeys[0]);

  return (
    <section
      className={cn("relative overflow-hidden bg-background px-4 py-12 text-foreground", className)}
      {...props}
    >
      <FAQHeader title={title} subtitle={subtitle} />
      <FAQTabs categories={categories} selected={selectedCategory} setSelected={setSelectedCategory} />
      <FAQList faqData={faqData} selected={selectedCategory} />
    </section>
  );
}

function FAQHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="relative z-10 flex flex-col items-center justify-center">
      <span className="mb-8 bg-gradient-to-r from-primary to-primary/60 bg-clip-text font-medium text-transparent">
        {subtitle}
      </span>
      <h2 className="mb-8 text-5xl font-bold">{title}</h2>
      <span className="absolute -top-[350px] left-[50%] z-0 h-[500px] w-[600px] -translate-x-[50%] rounded-full bg-gradient-to-r from-primary/10 to-primary/5 blur-3xl" />
    </div>
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
    <div className="relative z-10 flex flex-wrap items-center justify-center gap-4">
      {Object.entries(categories).map(([key, label]) => (
        <button
          key={key}
          type="button"
          onClick={() => setSelected(key)}
          className={cn(
            "relative overflow-hidden whitespace-nowrap rounded-md border px-3 py-1.5 text-sm font-medium transition-colors duration-500",
            selected === key
              ? "border-primary text-background"
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
                transition={{ duration: 0.5, ease: "backIn" }}
                className="absolute inset-0 z-0 bg-gradient-to-r from-primary to-primary/80"
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
    <div className="mx-auto mt-12 max-w-3xl">
      <AnimatePresence mode="wait">
        {Object.entries(faqData).map(([category, questions]) => {
          if (selected !== category) return null;
          return (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5, ease: "backIn" }}
              className="space-y-4"
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
    <motion.div
      animate={isOpen ? "open" : "closed"}
      className={cn("rounded-xl border transition-colors", isOpen ? "bg-muted/50" : "bg-card")}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 p-4 text-left"
      >
        <span
          className={cn(
            "text-lg font-medium transition-colors",
            isOpen ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {question}
        </span>
        <motion.span
          variants={{ open: { rotate: "45deg" }, closed: { rotate: "0deg" } }}
          transition={{ duration: 0.2 }}
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
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="overflow-hidden px-4"
      >
        <p className="text-muted-foreground">{answer}</p>
      </motion.div>
    </motion.div>
  );
}

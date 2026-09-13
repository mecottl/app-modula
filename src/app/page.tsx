import Link from "next/link";
import { FAQ } from "@/components/ui/faq-tabs";
import { Footer } from "@/components/ui/footer-section";
import { Header } from "@/components/ui/header-2";
import { Starfield } from "@/components/ui/starfield-1";

const planAFeatures = [
  "Página propia: nosotros.com/tu-desarrollo",
  "Marca personalizable: logo, colores, texto del CTA",
  "Publicación con un clic",
];

const planBFeatures = [
  "Widget embebido en tu propio sitio vía iframe",
  "Hereda la identidad visual de tu sitio",
  "Dominios autorizados y entorno de vista previa",
];

const features = [
  {
    title: "Catálogo configurable",
    description:
      "Modelos, niveles de acabado y extras, cada uno con su propio impacto en el precio. Sin tocar código.",
  },
  {
    title: "Precio en tiempo real",
    description:
      "El comprador ve el total actualizarse en cada selección — el mismo principio que usa Tesla para vender autos.",
  },
  {
    title: "Reglas de precio",
    description: "Promociones con vigencia por fechas, aplicadas automáticamente por el motor.",
  },
  {
    title: "Cotizaciones calificadas",
    description:
      "Cada envío queda registrado con el detalle exacto de la configuración — nada de hojas de cálculo.",
  },
  {
    title: "Analítica de conversión",
    description: "Visitas, configuraciones completadas y ranking de modelos más cotizados.",
  },
  {
    title: "Aislamiento por cuenta",
    description: "Cada desarrolladora ve únicamente sus propios datos, siempre.",
  },
];

const steps = [
  {
    number: "01",
    title: "Configura tu catálogo",
    description: "Modelos, acabados, extras y promociones desde el dashboard.",
  },
  {
    number: "02",
    title: "Publica tu configurador",
    description: "Como página propia (Plan A) o embebido en tu sitio (Plan B).",
  },
  {
    number: "03",
    title: "Recibe cotizaciones",
    description: "Cada lead llega con su configuración exacta y notificación inmediata.",
  },
];

const faqCategories = {
  general: "General",
  "plan-a": "Plan Básico",
  "plan-b": "Plan Profesional",
  seguridad: "Seguridad y datos",
};

const faqData = {
  general: [
    {
      question: "¿Qué es MODULA?",
      answer:
        "Un configurador de vivienda con cotización en tiempo real para desarrolladoras inmobiliarias, con dos formas de entrega — página propia o widget embebido — sobre el mismo motor de precio.",
    },
    {
      question: "¿Necesito saber programar para configurar mi catálogo?",
      answer:
        "No. Modelos, niveles de acabado, extras y promociones se configuran desde el dashboard, sin tocar código.",
    },
    {
      question: "¿MODULA procesa pagos de mis compradores?",
      answer:
        "No. El alcance del producto es generación de cotizaciones y captura de leads calificados, no procesamiento de pagos.",
    },
  ],
  "plan-a": [
    {
      question: "¿Cómo entrego el configurador a mis compradores?",
      answer: "Como página propia bajo nosotros.com/tu-desarrollo, publicada por nosotros.",
    },
    {
      question: "¿Puedo personalizar la marca?",
      answer: "Sí: logo, colores y el texto del botón de cotizar.",
    },
    {
      question: "¿Qué necesito para empezar?",
      answer: "Nada — el Plan Básico no requiere sitio propio ni equipo técnico.",
    },
  ],
  "plan-b": [
    {
      question: "¿Cómo se instala el widget en mi sitio?",
      answer:
        "Copiando un snippet (iframe + script) desde el dashboard. Hay instructivo paso a paso para WordPress, Wix, Webflow y HTML a la medida.",
    },
    {
      question: "¿Qué pasa si alguien copia mi snippet a otro sitio?",
      answer:
        "En modo producción el widget valida el dominio de origen contra tu lista autorizada y lo bloquea si no coincide.",
    },
    {
      question: "¿Puedo probar cambios antes de publicarlos?",
      answer: "Sí, el modo vista previa omite esa validación para que pruebes libremente.",
    },
  ],
  seguridad: [
    {
      question: "¿Mis datos se mezclan con los de otras desarrolladoras?",
      answer: "No. Cada cuenta ve únicamente sus propios datos — el aislamiento se aplica en cada consulta.",
    },
    {
      question: "¿Puedo eliminar los datos de un lead si me lo piden?",
      answer:
        "Sí, desde la bandeja de cotizaciones puedes borrar los datos personales de un lead a solicitud del titular.",
    },
    {
      question: "¿Los datos viajan cifrados?",
      answer: "Sí, toda la comunicación de la plataforma es HTTPS.",
    },
  ],
};

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border">
          <Starfield quantity={400} speed={0.3} opacity={0.15} />
          <div className="relative z-10 flex w-full flex-col items-center px-6 pb-24 pt-20 text-center sm:pt-28">
            <h1 className="max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl">
              Cotización en tiempo real para preventa inmobiliaria
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Tu comprador elige modelo, acabados y extras, y ve el precio actualizarse al
              instante sin depender de un asesor disponible.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/login"
                className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Entrar al dashboard
              </Link>
              <a
                href="#como-funciona"
                className="text-sm font-medium text-foreground underline underline-offset-4"
              >
                Ver cómo funciona
              </a>
            </div>

            <div className="relative mt-20 flex justify-center">
              <div className="absolute inset-x-0 bottom-0 z-0 h-40 bg-[radial-gradient(50%_100%_at_50%_100%,theme(colors.white/12%),transparent)]" />
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="producto" className="border-t border-border">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <h2 className="text-sm font-medium text-muted-foreground">Producto</h2>
            <p className="mt-2 max-w-2xl text-2xl font-semibold tracking-tight sm:text-3xl">
              Un motor. Dos formas de entregarlo.
            </p>
            <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.title} className="bg-background p-6">
                  <h3 className="font-medium">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Cómo funciona */}
        <section id="como-funciona" className="border-t border-border">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <h2 className="text-sm font-medium text-muted-foreground">Cómo funciona</h2>
            <div className="mt-8 grid gap-10 sm:grid-cols-3">
              {steps.map((step) => (
                <div key={step.number}>
                  <span className="font-mono text-sm text-muted-foreground">{step.number}</span>
                  <h3 className="mt-3 font-medium">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Planes */}
        <section id="planes" className="border-t border-border">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <h2 className="text-sm font-medium text-muted-foreground">Planes</h2>
            <p className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              El mismo motor, dos modalidades de entrega.
            </p>
            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              <div className="rounded-xl border border-border p-8">
                <h3 className="font-medium">Plan Básico</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Para desarrolladoras sin sitio propio o sin equipo técnico.
                </p>
                <ul className="mt-6 flex flex-col gap-3 text-sm">
                  {planAFeatures.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span aria-hidden="true">—</span>
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-foreground p-8">
                <h3 className="font-medium">Plan Profesional</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Para desarrolladoras con tráfico propio que no quieren perder su marca.
                </p>
                <ul className="mt-6 flex flex-col gap-3 text-sm">
                  {planBFeatures.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span aria-hidden="true">—</span>
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="border-t border-border">
          <FAQ
            title="Preguntas frecuentes"
            subtitle="¿Tienes dudas?"
            categories={faqCategories}
            faqData={faqData}
            className="mx-auto max-w-5xl py-20"
          />
        </section>

        {/* CTA final */}
        <section className="border-t border-border">
          <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-6 px-6 py-20 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Configura tu primer desarrollo hoy.
              </h2>
              <p className="mt-2 text-muted-foreground">
                Sin instalación para el Plan Básico, sin fricción de marca para el Profesional.
              </p>
            </div>
            <Link
              href="/login"
              className="shrink-0 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Entrar al dashboard
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

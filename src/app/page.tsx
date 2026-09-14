import Link from "next/link";
import { FAQ } from "@/components/ui/faq-tabs";
import { Footer } from "@/components/ui/footer-section";
import { Header } from "@/components/ui/header-2";
import { Starfield } from "@/components/ui/starfield-1";

// Antes cada sección tenía su propio glow (SectionGlow), reiniciado y
// recortado por el `overflow-hidden` de esa sección: al hacer scroll se
// veía "cortado" entre una sección y la siguiente en vez de continuo.
// Este glow es uno solo, del tamaño de todo el bloque de secciones
// planas (Producto → CTA final), con el mismo gradiente repetido cada
// 640px (bg-repeat-y + bg-[length:...]) para que se vea uniforme sin
// importar cuánto mida el contenido.
function PageGlow() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 bg-repeat-y bg-[length:100%_640px] bg-[radial-gradient(560px_460px_at_50%_0%,theme(colors.primary/8%),transparent_70%)] blur-3xl"
    />
  );
}

const planAFeatures = [
  "Página propia: modula.com/tu-desarrollo",
  "Marca personalizable: logo, colores, texto del CTA",
  "Publicación con un click",
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
      "El comprador ve el total actualizarse en cada selección.",
  },
  {
    title: "Reglas de precio",
    description: "Cupones con código y vigencia por fechas, validados en tiempo real al cotizar.",
  },
  {
    title: "Cotizaciones calificadas",
    description:
      "Cada envío queda registrado con el detalle exacto de la configuración nada de hojas de cálculo.",
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
        "Un configurador de vivienda con cotización en tiempo real para desarrolladoras inmobiliarias, con dos formas de entrega: página propia o widget embebido sobre el mismo motor de precio.",
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
      answer: "Como página propia bajo modula.com/tu-desarrollo, publicada por nosotros.",
    },
    {
      question: "¿Puedo personalizar la marca?",
      answer: "Sí: logo, colores y el texto del botón de cotizar.",
    },
    {
      question: "¿Qué necesito para empezar?",
      answer: "Nada. El Plan Básico no requiere sitio propio ni equipo técnico.",
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
      answer: "No. Cada cuenta ve únicamente sus propios datos, el aislamiento se aplica en cada consulta.",
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
        <section className="relative flex min-h-screen items-center overflow-hidden border-b border-border">
          <Starfield quantity={400} speed={0.3} opacity={0.15} />
          <div className="relative z-10 flex w-full flex-col items-center px-6 py-24 text-center">
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
                Registrate ahora!
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

        {/* Producto → CTA final: un solo glow continuo detrás de todo el bloque,
            en vez de uno por sección, para que no se vea cortado al hacer scroll. */}
        <div className="relative overflow-hidden">
          <PageGlow />

          {/* Features */}
          <section id="producto" className="relative border-t border-border">
            <div className="relative z-10 mx-auto max-w-5xl px-6 py-20">
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
          <section id="como-funciona" className="relative border-t border-border">
            <div className="relative z-10 mx-auto max-w-5xl px-6 py-20">
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
          <section id="planes" className="relative border-t border-border">
            <div className="relative z-10 mx-auto max-w-5xl px-6 py-20">
              <h2 className="text-sm font-medium text-muted-foreground">Planes</h2>
              <p className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                El mismo motor, dos modalidades de entrega.
              </p>
              <div className="mt-12 grid gap-6 sm:grid-cols-2">
                <div className="flex flex-col rounded-xl border border-border p-8">
                  <h3 className="font-medium">Plan Básico</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Para desarrolladoras sin sitio propio o sin equipo técnico.
                  </p>
                  <p className="mt-6 text-3xl font-semibold tracking-tight">
                    $499 <span className="text-base font-normal text-muted-foreground">MXN/mes</span>
                  </p>
                  <ul className="mt-6 flex flex-1 flex-col gap-3 text-sm">
                    {planAFeatures.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/register?plan=BASICO"
                    className="mt-8 rounded-full border border-foreground px-6 py-3 text-center text-sm font-medium transition-colors hover:bg-foreground hover:text-background"
                  >
                    Contratar Plan Básico
                  </Link>
                </div>
                <div className="flex flex-col rounded-xl border border-foreground p-8">
                  <h3 className="font-medium">Plan Profesional</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Para desarrolladoras con tráfico propio que no quieren perder su marca.
                  </p>
                  <p className="mt-6 text-3xl font-semibold tracking-tight">
                    $999 <span className="text-base font-normal text-muted-foreground">MXN/mes</span>
                  </p>
                  <ul className="mt-6 flex flex-1 flex-col gap-3 text-sm">
                    {planBFeatures.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/register?plan=PROFESIONAL"
                    className="mt-8 rounded-full bg-primary px-6 py-3 text-center text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    Contratar Plan Profesional
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="relative border-t border-border">
            <FAQ
              title="Preguntas frecuentes"
              subtitle="¿Tienes dudas?"
              categories={faqCategories}
              faqData={faqData}
              className="relative z-10 mx-auto max-w-5xl py-20"
            />
          </section>

          {/* CTA final */}
          <section className="relative border-t border-border">
            <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-start justify-between gap-6 px-6 py-20 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  Configura tu primer desarrollo hoy.
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Sin instalación para el Plan Básico, sin fricción de marca para el Profesional.
                </p>
              </div>
              <Link
                href="/register"
                className="shrink-0 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Crear mi cuenta
              </Link>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

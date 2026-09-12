import Link from "next/link";

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

function Nav() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
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
        <Link
          href="/login"
          className="rounded-full border border-border px-4 py-1.5 text-sm transition-colors hover:border-foreground"
        >
          Entrar
        </Link>
      </div>
    </header>
  );
}

function ConfiguratorPreview() {
  return (
    <div className="w-full max-w-sm rounded-xl border border-border bg-background p-5 shadow-[0_1px_0_0_rgba(0,0,0,0.04)]">
      <p className="text-xs text-muted-foreground">Residencial Los Encinos</p>
      <p className="mt-1 text-sm font-medium">Modelo Roble — Acabados Premium</p>
      <div className="mt-4 flex flex-col gap-2 text-xs text-muted-foreground">
        <div className="flex justify-between">
          <span>Base</span>
          <span>$1,850,000.00</span>
        </div>
        <div className="flex justify-between">
          <span>Acabado</span>
          <span>+$150,000.00</span>
        </div>
        <div className="flex justify-between text-foreground">
          <span>Lanzamiento</span>
          <span>-$92,500.00</span>
        </div>
      </div>
      <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
        <span className="text-xs text-muted-foreground">Total</span>
        <span className="text-2xl font-semibold tracking-tight">$1,907,500.00</span>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Nav />

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-5xl px-6 pb-20 pt-20 sm:pt-28">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl">
                Cotización en tiempo real para preventa inmobiliaria
              </h1>
              <p className="mt-6 max-w-xl text-lg text-muted-foreground">
                Tu comprador elige modelo, acabados y extras, y ve el precio actualizarse al
                instante — sin depender de un asesor disponible. Página propia o widget en tu
                sitio, un solo motor detrás de los dos.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
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
            </div>
            <div className="flex justify-center lg:justify-end">
              <ConfiguratorPreview />
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

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
          <span>MODULA</span>
          <a
            href="https://github.com/mecottl/app-modula"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-foreground"
          >
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}

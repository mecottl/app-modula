import Link from "next/link";
import { Header } from "@/components/ui/header-2";
import { Footer } from "@/components/ui/footer-section";
import { HostingDnsTabs } from "@/components/docs/hosting-dns-tabs";

export const metadata = {
  title: "Documentación — MODULA",
  description: "Cómo funciona MODULA y cómo usarlo, para desarrolladoras inmobiliarias.",
};

const nav = [
  { href: "#que-es", label: "¿Qué es MODULA?" },
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#primeros-pasos", label: "Primeros pasos" },
  { href: "#catalogo", label: "Configurar tu catálogo" },
  { href: "#plan-basico", label: "Plan Básico: publicar tu página" },
  { href: "#plan-profesional", label: "Plan Profesional: el widget" },
  { href: "#dominio-personalizado", label: "Dominio personalizado" },
  { href: "#cotizaciones", label: "Cotizaciones (leads)" },
  { href: "#analitica", label: "Analítica" },
  { href: "#miembros", label: "Miembros y roles" },
  { href: "#facturacion", label: "Facturación" },
  { href: "#seguridad", label: "Seguridad y datos" },
  { href: "#solucion-problemas", label: "Solución de problemas" },
];

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-border pt-10 first:border-t-0 first:pt-0">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-4 flex flex-col gap-4 text-sm leading-relaxed text-muted-foreground [&_strong]:text-foreground [&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-xs [&_code]:text-foreground">
        {children}
      </div>
    </section>
  );
}

function Step({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border text-xs font-mono text-muted-foreground">
        {number}
      </span>
      <div>
        <p className="font-medium text-foreground">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{children}</p>
      </div>
    </div>
  );
}

export default function DocsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Documentación</h1>
            <p className="mt-3 text-muted-foreground">
              Guía completa de cómo funciona MODULA y cómo usarlo desde el dashboard de tu
              desarrolladora — desde crear tu primer desarrollo hasta recibir tu primera
              cotización.
            </p>
          </div>

          <div className="mt-12 grid gap-12 lg:grid-cols-[220px_1fr]">
            <nav aria-label="Contenido" className="hidden lg:block">
              <ul className="sticky top-24 flex flex-col gap-1 text-sm">
                {nav.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      className="block rounded px-2 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="flex flex-col gap-10">
              <Section id="que-es" title="¿Qué es MODULA?">
                <p>
                  MODULA es un configurador de vivienda con cotización en tiempo real para
                  desarrolladoras inmobiliarias en preventa. Tu comprador elige modelo, nivel de
                  acabado y extras, y ve el precio total actualizarse al instante — sin depender
                  de un asesor disponible. El mismo principio que usa un configurador de autos.
                </p>
                <p>
                  Cada envío del formulario de cotización queda registrado como un lead
                  calificado, con el detalle exacto de la configuración elegida: modelo, acabado,
                  extras y precio total en el momento del envío.
                </p>
              </Section>

              <Section id="como-funciona" title="Cómo funciona">
                <p>
                  Todo corre sobre <strong>un único motor</strong> de catálogo y cálculo de
                  precio. Configuras tu catálogo una sola vez desde el dashboard, y ese mismo
                  motor se entrega al comprador final de dos formas distintas, según tu plan:
                </p>
                <ul className="flex flex-col gap-2">
                  <li>
                    <strong>Plan Básico</strong> — una página propia que nosotros hospedamos, en{" "}
                    <code>tudominio.com/tu-desarrollo/cotizacion-cliente</code>. No requiere sitio
                    propio ni instalación.
                  </li>
                  <li>
                    <strong>Plan Profesional</strong> — el mismo configurador embebido como widget
                    (<code>iframe</code>) dentro de tu propio sitio, con tu marca y tu dominio.
                  </li>
                </ul>
                <p>
                  Nunca duplicas configuración entre planes: modelos, acabados, extras y
                  promociones se editan en un solo lugar y se reflejan igual en ambos.
                </p>
              </Section>

              <Section id="primeros-pasos" title="Primeros pasos">
                <div className="flex flex-col gap-5">
                  <Step number="1" title="Crea tu cuenta">
                    Desde{" "}
                    <Link href="/register" className="underline underline-offset-4">
                      /register
                    </Link>
                    , elige tu plan (Básico o Profesional), completa el nombre de tu
                    desarrolladora, tu nombre, correo y contraseña. Al confirmar pagas
                    directamente con Stripe.
                  </Step>
                  <Step number="2" title="Crea tu primer desarrollo">
                    En <strong>Desarrollos → Nuevo desarrollo</strong> das de alta un proyecto con
                    solo su nombre. Un desarrollo es un proyecto inmobiliario — puedes tener
                    varios bajo la misma cuenta. Tu URL pública se genera automáticamente a partir
                    del nombre; la moneda (por defecto MXN) se ajusta después desde{" "}
                    <strong>General → Configuración avanzada</strong>.
                  </Step>
                  <Step number="3" title="Configura tu catálogo">
                    Modelos, acabados y extras, y opcionalmente promociones (ver la sección{" "}
                    <a href="#catalogo" className="underline underline-offset-4">
                      Configurar tu catálogo
                    </a>
                    ).
                  </Step>
                  <Step number="4" title="Publica">
                    Cambia el estado de “Borrador” a “Publicado” desde la cabecera del desarrollo.
                    Solo un desarrollo publicado es visible para compradores.
                  </Step>
                  <Step number="5" title="Comparte o instala">
                    En Plan Básico, comparte el enlace de tu página. En Plan Profesional, copia el
                    snippet desde <strong>Integración</strong> y pégalo en tu sitio.
                  </Step>
                </div>
              </Section>

              <Section id="catalogo" title="Configurar tu catálogo">
                <p>
                  Dentro de cada desarrollo, el catálogo se configura en pestañas — los cambios se
                  guardan de inmediato pero solo son visibles al público cuando el desarrollo está
                  publicado:
                </p>
                <ul className="flex flex-col gap-3">
                  <li>
                    <strong>General y marca</strong> — nombre, descripción, moneda, logo, color
                    primario/acento y el texto del botón de cotizar.
                  </li>
                  <li>
                    <strong>Catálogo</strong> — tus modelos de vivienda: nombre, m², recámaras y
                    precio base. Puedes marcar un modelo como inactivo sin borrarlo.
                  </li>
                  <li>
                    <strong>Acabados y extras</strong> — niveles de acabado (cada uno con un delta
                    de precio sobre el precio base) y extras opcionales, que puedes asociar solo a
                    los modelos donde aplican.
                  </li>
                  <li>
                    <strong>Reglas de precio</strong> — promociones con vigencia (fecha de inicio
                    y fin) y descuento porcentual o fijo, aplicadas automáticamente por el motor
                    mientras estén vigentes.
                  </li>
                </ul>
                <p>
                  El precio final que ve el comprador siempre es:{" "}
                  <code>precio base del modelo + delta del acabado + suma de extras − promoción vigente</code>.
                </p>
              </Section>

              <Section id="plan-basico" title="Plan Básico: publicar tu página">
                <p>
                  El Plan Básico entrega tu configurador como una página propia que nosotros
                  hospedamos, sin que tengas que instalar nada. El flujo del comprador es: elegir
                  modelo → elegir acabado → elegir extras → ver el precio total en vivo → dejar
                  sus datos de contacto.
                </p>
                <p>
                  Antes de publicar, usa <strong>Ver vista previa</strong> (arriba en la ficha del
                  desarrollo) para probar el configurador exactamente como lo vería un comprador,
                  sin que esté visible públicamente todavía.
                </p>
                <p>
                  Un desarrollo en estado <strong>Borrador</strong> no es accesible públicamente;
                  al <strong>Publicar</strong>, su URL queda activa para cualquiera con el enlace.
                </p>
              </Section>

              <Section id="plan-profesional" title="Plan Profesional: el widget embebible">
                <p>
                  El Plan Profesional agrega la pestaña <strong>Integración</strong>, exclusiva de
                  este plan, donde obtienes un snippet (<code>iframe</code> + un pequeño script)
                  para pegar en tu propio sitio (WordPress, Wix, Webflow, o HTML a la medida). El
                  widget hereda el ancho de su contenedor y ajusta su propia altura
                  automáticamente, así que no queda scroll doble.
                </p>
                <ul className="flex flex-col gap-3">
                  <li>
                    <strong>Entorno — Vista previa</strong>: no valida el dominio de origen, para
                    que pruebes libremente antes de publicar el cambio en tu sitio real.
                  </li>
                  <li>
                    <strong>Entorno — Producción</strong>: valida que la solicitud venga de uno de
                    tus <strong>dominios autorizados</strong> (uno por línea). Si alguien copia tu
                    snippet a un sitio no autorizado, el widget no carga ahí.
                  </li>
                  <li>
                    <strong>Token del proyecto</strong>: identifica tu desarrollo ante el widget.
                    Si sospechas que se filtró, puedes regenerarlo — esto invalida el anterior de
                    inmediato.
                  </li>
                </ul>
                <p>
                  Si tu cuenta está en Plan Básico, tanto la pestaña Integración como la URL
                  pública del widget muestran un mensaje para subir de plan — el control de
                  acceso se aplica en el servidor, no solo ocultando el botón.
                </p>
              </Section>

              <Section id="dominio-personalizado" title="Dominio personalizado">
                <p>
                  Exclusivo de Plan Profesional. Sirve tu página propia del configurador (Plan
                  Básico) bajo un dominio tuyo — ej. <code>cotiza.tuempresa.com</code> — en vez de
                  la URL de MODULA. Se configura desde{" "}
                  <strong>Integración → Dominio personalizado</strong>.
                </p>
                <div className="flex flex-col gap-5">
                  <Step number="1" title="Guarda el dominio en MODULA">
                    En <strong>Integración → Dominio personalizado</strong>, escribe el subdominio
                    que vas a usar (ej. <code>cotiza.tuempresa.com</code>) y guarda. MODULA genera
                    un token único y te muestra el registro <strong>TXT</strong> exacto que falta
                    agregar — sin verificarlo, el dominio no sirve nada, para que nadie pueda
                    apuntar el dominio de otra desarrolladora.
                  </Step>
                  <Step number="2" title="Agrega los registros DNS">
                    Con el TXT del paso anterior a la mano, agrega los registros en el proveedor
                    donde administras el dominio. Los pasos exactos varían según dónde vive tu DNS:
                  </Step>
                </div>
                <HostingDnsTabs />
                <div className="flex flex-col gap-5">
                  <Step number="3" title="Conecta el dominio al proyecto en Vercel">
                    En el proyecto de Vercel, <code>Settings → Domains</code>, agrega el subdominio
                    completo (ej. <code>cotiza.tuempresa.com</code>). Vercel emite el certificado
                    HTTPS automáticamente en cuanto el CNAME resuelve — puede tardar desde minutos
                    hasta un par de horas según el proveedor de DNS.
                  </Step>
                  <Step number="4" title="Verifica">
                    De vuelta en Integración, dale clic a <strong>Verificar</strong>. Si el TXT ya
                    propagó, el dominio pasa a &quot;Verificado&quot; de inmediato y queda activo.
                    Si no lo encuentra, espera unos minutos (propagación DNS) e inténtalo de nuevo.
                  </Step>
                </div>
                <p>
                  Cualquier visitante que entre a ese dominio ve directamente el configurador de
                  ese desarrollo — el dominio de MODULA (y el resto de tus desarrollos) siguen
                  funcionando normal, sin verse afectados.
                </p>
              </Section>

              <Section id="cotizaciones" title="Cotizaciones (leads)">
                <p>
                  Cada cotización enviada por un comprador —desde Plan Básico o Profesional— llega
                  a la bandeja de <strong>Cotizaciones</strong> del desarrollo correspondiente, con
                  el modelo, acabado, extras, precio total, datos de contacto y el plan de origen.
                </p>
                <ul className="flex flex-col gap-3">
                  <li>
                    Puedes marcar cada una como <strong>Nueva</strong>, <strong>Contactada</strong>{" "}
                    o <strong>Cerrada</strong>, y filtrar la lista por estado.
                  </li>
                  <li>
                    <strong>Exportar CSV</strong> descarga las cotizaciones filtradas para
                    llevarlas a tu CRM o una hoja de cálculo.
                  </li>
                  <li>
                    <strong>Eliminar datos del lead</strong> borra los datos personales de una
                    cotización a solicitud del titular, sin borrar el registro de conversión.
                  </li>
                </ul>
              </Section>

              <Section id="analitica" title="Analítica">
                <p>
                  Cada desarrollo tiene su propia pestaña de <strong>Analítica</strong> con
                  visitas al configurador, configuraciones completadas y cotizaciones enviadas, más
                  un ranking de los modelos más cotizados — útil para saber qué combinaciones
                  interesan más a tus compradores.
                </p>
              </Section>

              <Section id="miembros" title="Miembros y roles">
                <p>
                  Desde <strong>Miembros</strong> invitas a tu equipo a la misma cuenta, con uno de
                  tres roles:
                </p>
                <ul className="flex flex-col gap-2">
                  <li>
                    <strong>Administrador</strong> — acceso completo, incluyendo miembros y
                    facturación.
                  </li>
                  <li>
                    <strong>Editor de catálogo</strong> — puede configurar desarrollos y catálogo,
                    sin acceso a miembros ni facturación.
                  </li>
                  <li>
                    <strong>Solo lectura</strong> — puede ver la información pero no modificarla.
                  </li>
                </ul>
                <p>
                  Al invitar a alguien se le crea una cuenta con una contraseña temporal, enviada
                  por correo. Solo un administrador puede invitar o quitar miembros, y siempre debe
                  quedar al menos un administrador en la cuenta.
                </p>
              </Section>

              <Section id="facturacion" title="Facturación">
                <p>
                  MODULA se cobra por suscripción mensual: <strong>Plan Básico $499 MXN/mes</strong>{" "}
                  y <strong>Plan Profesional $999 MXN/mes</strong>. Desde{" "}
                  <strong>Facturación</strong> puedes:
                </p>
                <ul className="flex flex-col gap-2">
                  <li>
                    Ver tu plan y estado actuales, y tu historial de facturas.
                  </li>
                  <li>
                    <strong>Subir o bajar de plan</strong> en cualquier momento — si ya tienes una
                    suscripción activa, el cambio se aplica de inmediato y Stripe cobra o abona
                    solo la diferencia prorrateada del periodo restante, no el precio completo de
                    nuevo.
                  </li>
                  <li>
                    <strong>Gestionar suscripción</strong> abre el portal de Stripe, donde
                    actualizas tu método de pago o cancelas.
                  </li>
                </ul>
              </Section>

              <Section id="seguridad" title="Seguridad y datos">
                <ul className="flex flex-col gap-3">
                  <li>
                    <strong>Aislamiento entre cuentas</strong>: cada consulta al backend queda
                    acotada a tu cuenta autenticada — ninguna desarrolladora puede ver o modificar
                    el catálogo o las cotizaciones de otra.
                  </li>
                  <li>
                    <strong>Datos personales de leads</strong>: nombre, correo y teléfono capturados
                    en una cotización viajan siempre cifrados (HTTPS), y puedes eliminarlos a
                    solicitud del titular desde la bandeja de Cotizaciones.
                  </li>
                  <li>
                    <strong>MODULA no procesa pagos de tus compradores finales</strong>: el alcance
                    del producto es generación de cotizaciones y captura de leads calificados,
                    nunca cobro a tus clientes. La facturación de Stripe es únicamente tu
                    suscripción a MODULA.
                  </li>
                </ul>
              </Section>

              <Section id="solucion-problemas" title="Solución de problemas comunes">
                <div className="flex flex-col gap-5">
                  <div>
                    <p className="font-medium text-foreground">Mi configurador no aparece</p>
                    <ul className="mt-1 flex flex-col gap-1.5">
                      <li>
                        ¿Tienes al menos un <strong>modelo activo</strong> en Catálogo? Sin uno, no
                        hay nada que mostrar.
                      </li>
                      <li>
                        ¿El desarrollo está en <strong>Publicado</strong>? Revísalo en la cabecera
                        de General — en Borrador solo tú puedes verlo con Vista previa.
                      </li>
                      <li>
                        La ficha de General muestra un checklist con estos mismos pasos y enlaces
                        directos mientras falte alguno.
                      </li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Mi widget dice &quot;no autorizado&quot;</p>
                    <ul className="mt-1 flex flex-col gap-1.5">
                      <li>
                        ¿Tu cuenta está en <strong>Plan Profesional</strong>? El widget embebible
                        es exclusivo de ese plan.
                      </li>
                      <li>
                        ¿El <strong>Entorno</strong> en Integración está en{" "}
                        <strong>Producción</strong>? Solo ese modo valida el dominio — Vista previa
                        nunca lo bloquea.
                      </li>
                      <li>
                        ¿El dominio exacto donde pegaste el snippet está en la lista de{" "}
                        <strong>dominios autorizados</strong> (uno por línea, sin{" "}
                        <code>https://</code>)?
                      </li>
                    </ul>
                  </div>
                </div>
              </Section>

              <div className="border-t border-border pt-8">
                <p className="text-sm text-muted-foreground">
                  ¿Tienes más dudas? Revisa las{" "}
                  <Link href="/#faq" className="underline underline-offset-4">
                    preguntas frecuentes
                  </Link>{" "}
                  en la página principal.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

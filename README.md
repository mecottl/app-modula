# Configurador de cotización para desarrollos inmobiliarios · Modelo híbrido A + B

**Versión:** 1.0 · **Fecha:** Septiembre 2026 · **Estado:** Para iniciar desarrollo

---

## 1. Resumen ejecutivo

Crear un software como servicio (SaaS) que permite a desarrolladoras inmobiliarias ofrecer a sus clientes un configurador de vivienda con cotización en tiempo real. El mismo principio que usa Tesla para vender autos: el cliente elige modelo, acabados y extras, y ve el precio actualizarse al instante, sin depender de un asesor disponible.

El producto se entrega bajo un **modelo híbrido de dos planes**, construidos sobre un único motor de configuración y precios:

- **Plan Básico (Opción A):** página de cotización hospedada por nosotros, bajo la ruta `nosotros.com/[nombre-desarrolladora/desarrollo]`.
- **Plan Profesional (Opción B):** el mismo configurador, embebido como widget dentro del sitio propio de la desarrolladora mediante un `iframe`.

Este documento consolida la problemática, los requerimientos funcionales y no funcionales, el modelo de datos, la propuesta tecnológica y el plan de fases necesarios para comenzar el desarrollo.

> Este documento no cubre procesamiento de pagos ni transacciones financieras. El alcance del producto es **generación de cotizaciones y captura de leads calificados**  no se procesa dinero de compradores finales en ninguna fase descrita aquí.

---

## 2. Problemática

La venta de vivienda en preventa sigue operando, en la gran mayoría de desarrolladoras, de forma manual:

1. **Cotizaciones hechas a mano.** Cada combinación de modelo, acabados y extras se calcula por un asesor, en llamada, correo o una hoja de Excel. No hay dos asesores que coticen exactamente igual, y el proceso no escala fuera del horario de atención.
2. **El comprador decide a ciegas.** El cliente final explora opciones (acabados, extras, ubicación dentro del desarrollo) sin saber el impacto real en el precio hasta que alguien se lo calcula — lo opuesto a la experiencia de compra a la que ya está acostumbrado en casi cualquier otra categoría (autos, viajes, seguros).
3. **La venta depende de una persona, no de un sistema.** Si el asesor no está disponible, el proceso se detiene. No existe una experiencia digital de autoservicio que capture al comprador en el momento en que está interesado.
4. **Herramientas genéricas, no especializadas.** Existen CRMs inmobiliarios, pero pocos están diseñados específicamente para personalizar y cotizar una unidad en preventa con reglas de precio dinámicas (niveles de acabado, extras, promociones vigentes).

El software ataca directamente estos cuatro puntos con un producto de autoservicio, disponible 24/7, sin fricción de instalación para el plan básico y sin fricción de marca para el plan profesional.

---

## 3. Objetivo del producto

Ofrecer a desarrolladoras inmobiliarias una herramienta de autoservicio que:

- Permita configurar su catálogo de modelos, acabados, extras y reglas de precio sin intervención técnica.
- Genere una experiencia de cotización en tiempo real para el comprador final, en dos modalidades de entrega (página propia o widget embebido).
- Capture cada cotización como un lead calificado, con el detalle exacto de la configuración elegida.
- Sea económicamente viable de operar por una sola persona en su fase inicial (sin equipo de soporte técnico dedicado por cliente).

**Fuera de alcance en esta primera versión:** procesamiento de pagos, gestión de inventario en tiempo real ligada a un ERP externo, firma electrónica de contratos, y dominios personalizados (`cotiza.desarrolladora.com`) quedan documentados como evolución futura en la sección 12.

---

## 4. Modelo de negocio y empaquetado de planes

| | Plan Básico (A) | Plan Profesional (B) |
|---|---|---|
| Entrega | Página hospedada: `nosotros.com/[slug]` | Widget embebido vía `iframe` en el sitio propio de la desarrolladora |
| Marca visible | La de nosotros (parcialmente personalizable: logo, colores, texto de CTA) | Principalmente la de la desarrolladora el widget hereda su identidad |
| Fricción técnica de instalación | Ninguna: nosotros publicamos la página | Media: alguien debe pegar el snippet en su sitio (WordPress, Wix, Webflow, HTML propio) |
| Requisitos previos del cliente | Ninguno | Debe tener un sitio propio donde instalar el widget |
| Dominios autorizados / whitelist | No aplica | Sí. obligatorio por seguridad (sección 9.3) |
| Cobro | Suscripción mensual, tarifa única | Suscripción mensual, tarifa superior |
| Cliente ideal | Desarrolladora sin sitio propio o sin equipo técnico | Desarrolladora con tráfico propio que no quiere perder su marca |

**Justificación técnica de la viabilidad del híbrido:** ambos planes consumen el **mismo motor de datos y de cálculo de precio** (catálogo, acabados, extras, reglas de precio). La diferencia entre A y B es exclusivamente la capa de entrega (renderizado como página propia vs. contenido embebido). Esto implica que no se duplica lógica de negocio entre planes — se construye una vez y se sirve de dos formas. El esfuerzo incremental de B sobre A se concentra en: responsividad del contenido embebido, comunicación con el documento padre (ver sección 9.2) y control de dominios autorizados (ver sección 9.3), no en reconstruir el motor.

---

## 5. Arquitectura general

```
                         ┌──────────────────────────┐
                         │   Motor                  │
                         │  (catálogo, acabados,    │
                         │   extras, reglas de      │
                         │   precio, marca, leads)  │
                         └────────────┬─────────────┘
                                      │
                     ┌────────────────┴─────────────────┐
                     │                                  │
           ┌─────────▼─────────┐              ┌─────────▼──────────┐
           │  Plan A           │              │  Plan B            │
           │  Página hospedada │              │  Widget embebido   │
           │  nosotros.com/slug│              │  <iframe> en sitio │
           │                   │              │  del cliente       │
           └───────────────────┘              └────────────────────┘
```

**Componentes principales:**

1. **Dashboard administrativo** (uso interno de la desarrolladora) — donde se configura todo lo descrito en la sección 6.1.
2. **API del motor** — expone el catálogo, calcula precios y recibe cotizaciones. Es el mismo backend consumido por ambos planes.
3. **Renderer de página hospedada (Plan A)** — aplicación web que resuelve la ruta `/[slug]` y renderiza el configurador con los datos del desarrollo correspondiente.
4. **Renderer de widget embebible (Plan B)** — versión del mismo configurador optimizada para vivir dentro de un `iframe` ajeno: sin navegación propia, comunicación de altura vía `postMessage`, y validación de dominio de origen.
5. **Servicio de notificaciones** — envía la cotización recibida al correo o webhook configurado por la desarrolladora.

---

## 6. Requerimientos funcionales

### 6.1 Dashboard de la desarrolladora

Basado en la jerarquía de configuración ya definida, agrupada en tres áreas:

**Configurar**
| Módulo | Función | Disponible en |
|---|---|---|
| General y marca | Nombre, descripción, estado (borrador/publicado), moneda, logo, colores, texto del CTA | A y B |
| Catálogo | Alta/edición/baja de modelos: nombre, m², recámaras, precio base, estado activo | A y B |
| Categorías | Árbol de hasta 5 niveles (categorías > subcategorías > opciones); elige una o varias por nivel; delta de precio solo en las opciones; restricción opcional por modelo | A y B |
| Reglas de precio | Promociones con vigencia (fecha inicio/fin), descuento por forma de pago | A y B |
| **Integración** | Snippet de instalación, entorno (vista previa/producción), dominios autorizados, token del proyecto | **Solo B** |

**Operar**
| Módulo | Función |
|---|---|
| Cotizaciones | Bandeja de leads recibidos, con estado (nueva/contactada/cerrada), notificación por correo, webhook opcional a CRM externo |
| Analítica | Visitas al configurador, configuraciones completadas, cotizaciones enviadas, ranking de modelos más cotizados |

**Cuenta**
| Módulo | Función |
|---|---|
| Miembros | Invitar/quitar usuarios del equipo de la desarrolladora, con rol (administrador, editor de catálogo, solo lectura) |
| Facturación | Plan contratado, método de pago, historial de facturas, cambio de plan |

### 6.2 Configurador público — Plan A (página hospedada)

- Renderiza en `nosotros.com/[slug]/cotizacion-cliente`.
- Solo accesible si el desarrollo está en estado "Publicado".
- Aplica la marca configurada (logo, colores, texto del CTA).
- Flujo: selección de modelo → selección de opciones por categoría → precio total en vivo → formulario de contacto → confirmación.
- Debe funcionar correctamente en dispositivos móviles como flujo principal (la mayoría del tráfico de un enlace compartido en redes o WhatsApp llega desde celular).

### 6.3 Widget embebible — Plan B

- Mismo flujo funcional que 6.2, adaptado a un contenedor de ancho variable definido por el sitio anfitrión.
- Debe comunicar su altura real al documento padre para evitar scroll doble (`iframe` dentro de `iframe` de scroll).
- Debe validar, en el servidor, que el dominio que solicita el widget está en la lista blanca configurada por la desarrolladora (sección 9.3) antes de servir contenido.
- Debe incluir una atribución visible pero discreta ("Cotizador creado con ... "), consistente con el patrón de otros SaaS embebibles (Calendly, Typeform).
- Debe soportar un modo **vista previa** que no valida dominio (para que la desarrolladora pruebe cambios antes de publicarlos) y un modo **producción** que sí lo valida.

### 6.4 Sistema de cotizaciones (leads)

- Cada envío del formulario de cotización debe registrar: fecha, datos de contacto, modelo, opciones seleccionadas, precio total calculado en el momento, y plan de origen (A o B).
- Debe notificar por correo a la desarrolladora de forma inmediata.
- Debe permitir exportar a CSV y, opcionalmente, enviar a un webhook configurado (para integraciones futuras con CRMs sin construir integraciones nativas una por una).

---

## 7. Requerimientos no funcionales

| Categoría | Requisito |
|---|---|
| **Rendimiento** | El cálculo de precio debe reflejarse en la interfaz en menos de 300ms tras cada selección del usuario. |
| **Disponibilidad** | El configurador público (A y B) debe operar de forma independiente al dashboard — una caída del panel administrativo no debe tumbar el configurador que ya está en producción. |
| **Multi-tenencia** | Aislamiento estricto de datos entre desarrolladoras: ninguna consulta debe poder cruzar accidentalmente el catálogo de una cuenta con el de otra. |
| **Compatibilidad** | El widget (Plan B) debe renderizar correctamente embebido en los CMS más comunes: WordPress, Wix, Webflow, y sitios HTML a la medida. |
| **Responsividad** | Ambos planes deben funcionar correctamente desde 360px de ancho (móvil) hasta escritorio. |
| **Seguridad** | Ver sección 9 completa. |
| **Accesibilidad** | Formularios navegables por teclado y compatibles con lectores de pantalla (mínimo: etiquetas asociadas a campos, roles ARIA en elementos interactivos personalizados). |
| **Internacionalización de moneda** | El sistema debe soportar múltiples monedas por cuenta desde el día uno, aunque el lanzamiento inicial sea solo en MXN. |

---

## 8. Modelo de datos (entidades principales)

| Entidad | Campos clave | Relación |
|---|---|---|
| `accounts` | id, nombre, plan (básico/profesional), estado de facturación | 1 cuenta → N desarrollos |
| `developments` | id, account_id, nombre, slug, descripción, estado (borrador/publicado), moneda, logo, color_primario, color_acento, texto_cta | 1 desarrollo → N modelos |
| `models` | id, development_id, nombre, descripción, m², recámaras, precio_base, activo | 1 modelo → N nodos de catálogo aplicables |
| `catalog_nodes` | id, development_id, parent_id, nombre, descripción, delta_precio, modo_selección (única/múltiple), orden, restringir_a_modelos | árbol autorreferenciado (máx. 5 niveles); raíz = categoría, hoja no raíz = opción con precio |
| `catalog_node_model` | node_id, model_id | tabla puente N a N con `models` (aplica al nodo y a todo su subárbol) |
| `promotions` | id, development_id, nombre, tipo (%/fijo), valor, fecha_inicio, fecha_fin, activo | — |
| `integration_settings` | id, development_id, modo (widget/hospedada), entorno, token, dominios_autorizados[] | 1 a 1 con `developments` |
| `quotes` | id, development_id, modelo, ids de opciones elegidas (`finish_option_ids`; `extra_ids` queda vacío en cotizaciones nuevas), total, nombre_cliente, correo, teléfono, estado, plan_origen, fecha | — |
| `members` | id, account_id, nombre, correo, rol | — |

Este modelo es deliberadamente el mismo sin importar si el desarrollo se sirve por Plan A o Plan B — la tabla `integration_settings` es la única que introduce diferencias específicas del plan (dominios autorizados, token), consistente con el principio de arquitectura de la sección 5.

---

## 9. Seguridad y consideraciones específicas de multi-tenencia

### 9.1 Aislamiento de datos
Cada consulta al backend debe ir acotada por `development_id` derivado del contexto de autenticación o del slug/token de la solicitud — nunca confiar en un identificador enviado libremente por el cliente sin validarlo contra la cuenta autenticada.

### 9.2 Comunicación del widget con el sitio anfitrión
El widget embebido corre dentro de un `iframe`, en un origen distinto al del sitio que lo contiene. La única comunicación segura entre ambos documentos es mediante `window.postMessage`, usada para:
- Informar la altura real del contenido, para que el sitio anfitrión ajuste el tamaño del `iframe` dinámicamente.
- (Opcional, fase futura) Notificar eventos como "cotización enviada" para que el sitio anfitrión pueda disparar sus propios eventos de analítica (Google Analytics, Meta Pixel del cliente).

### 9.3 Lista blanca de dominios
El snippet de instalación por sí solo no impide que alguien copie el código y lo use en un sitio no autorizado. La validación real debe ocurrir en el servidor: cada solicitud al widget en modo producción debe verificar el encabezado de origen (`Referer` u origen del `postMessage` inicial) contra la lista de dominios autorizados configurada por la desarrolladora. En modo vista previa esta validación se omite intencionalmente para permitir pruebas.

### 9.4 Tokens de proyecto
Cada desarrollo tiene un token único que lo identifica ante el backend. Debe ser regenerable desde el dashboard (invalidando el anterior) en caso de que se filtre.

### 9.5 Datos personales de leads
Los datos capturados en el formulario de cotización (nombre, correo, teléfono) son datos personales. Se requiere, como mínimo: cifrado en tránsito (HTTPS en todo el sistema), y un mecanismo para que una desarrolladora pueda eliminar los datos de un lead a solicitud del titular, en línea con principios generales de protección de datos aplicables en México (LFPDPPP).

---

## 10. Propuesta tecnológica

| Capa | Tecnología propuesta | Justificación |
|---|---|---|
| Frontend (dashboard + configurador) | React (Next.js) | Permite renderizado híbrido: páginas del configurador público pueden generarse del lado del servidor para carga rápida y buen SEO en el Plan A, mientras el dashboard funciona como aplicación de cliente. Ecosistema maduro, curva de aprendizaje razonable para un equipo pequeño. |
| Widget embebible | Mismo código base de React, compilado a un bundle ligero independiente | Evita mantener dos implementaciones del configurador; el widget es una variante de "modo de renderizado", no una aplicación aparte. |
| Backend / API | Node.js con un framework como NestJS o Express | Comparte lenguaje (JavaScript/TypeScript) con el frontend, lo que reduce el costo de contexto para un desarrollador único al inicio del proyecto. |
| Base de datos | PostgreSQL | El modelo de datos (sección 8) es fuertemente relacional (desarrollos → modelos → extras, con relaciones N a N). Postgres además soporta bien el aislamiento multi-tenant mediante `development_id` indexado o, más adelante, esquemas separados si se requiere mayor aislamiento. |
| Autenticación | Proveedor gestionado (ej. Auth0, Clerk, o Supabase Auth) en vez de construir autenticación propia | Reduce riesgo de seguridad y tiempo de desarrollo en un área donde los errores son costosos; un solo desarrollador no debería construir su propio sistema de sesiones/roles desde cero en la primera versión. |
| Hosting / infraestructura | Vercel (frontend/Next.js) + base de datos gestionada (ej. Supabase o RDS) | Minimiza trabajo de DevOps al inicio; Vercel además maneja de forma nativa el concepto de "preview deployments", que mapea bien al modo "vista previa" del dashboard. |
| Notificaciones por correo | Servicio transaccional gestionado (ej. Resend, Postmark) | Evita la complejidad de administrar servidores de correo propios y su reputación de envío (deliverability). |
| Almacenamiento de imágenes (renders, logos) | Almacenamiento de objetos gestionado (ej. S3 o equivalente) con CDN | Las imágenes de modelos y logos deben servirse rápido y de forma independiente al backend de la aplicación. |
| Analítica interna | Eventos propios almacenados en la base de datos (visitas, configuraciones completadas, cotizaciones) | No se requiere una herramienta de analítica de terceros para el MVP; los conteos mostrados en el dashboard son agregaciones simples sobre tablas propias. |

**Nota sobre alcance de esta propuesta:** estas son tecnologías recomendadas para un equipo de un solo desarrollador que necesita llegar a producción rápido sin sacrificar una base sólida para escalar. No son la única combinación viable — el criterio de selección priorizó consistentemente **reducir superficie de mantenimiento propio** (usar servicios gestionados donde el riesgo de construirlo mal es alto: autenticación, correo, hosting) sobre optimizar cada pieza de forma independiente.

---

## 11. Plan de fases

| Fase | Contenido | Depende de |
|---|---|---|
| **Fase 0 — Fundación** | Modelo de datos, API del motor de cálculo de precio, autenticación básica | — |
| **Fase 1 — Plan A (MVP comercial)** | Dashboard (General/Marca, Catálogo, Acabados y extras, Reglas de precio, Cotizaciones), página hospedada pública | Fase 0 |
| **Fase 2 — Plan B (Profesional)** | Módulo de Integración en el dashboard, widget embebible, validación de dominios, comunicación por `postMessage` | Fase 1 |
| **Fase 3 — Operación y crecimiento** | Analítica, roles de miembros, facturación/suscripciones, exportación y webhooks de leads | Fase 1 (parcialmente en paralelo a Fase 2) |
| **Fase 4 — Evolución futura** | Dominios personalizados (`cotiza.desarrolladora.com`), inventario en tiempo real, integraciones nativas con CRMs específicos | Fase 2 y 3 completas |

Esta secuencia es consistente con la estrategia de negocio ya definida: comercializar primero el Plan A (menor fricción de venta e implementación) y usar los primeros clientes reales para validar qué tan necesario es, en la práctica, el Plan B antes de invertirle el esfuerzo adicional que describe la sección 9.

---

## 12. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Un cliente del Plan B copia el snippet y lo usa en un dominio no autorizado, generando leads que no le pertenecen o saturando el servicio | Medio | Validación de dominio en servidor (sección 9.3), no solo cosmética en el dashboard |
| El widget se ve roto dentro de un CMS específico no probado (ej. constructor de páginas de Wix con su propio sandboxing de iframes) | Medio-alto | Probar la integración contra los 3–4 CMS más comunes antes de anunciar el Plan B como disponible |
| Un solo desarrollador no puede sostener soporte técnico de instalación para clientes del Plan B | Alto | Priorizar Plan A primero (Fase 1), y documentar un instructivo de instalación paso a paso con capturas antes de vender el Plan B activamente |
| Fuga de datos entre cuentas por un error de aislamiento multi-tenant | Alto | Pruebas automatizadas específicas que verifiquen que ninguna consulta cruza `development_id` de distintas cuentas |
| Cambios de precio mal configurados se publican sin querer y afectan a un cliente real navegando el sitio | Medio | El modo "vista previa" del dashboard (ya contemplado en el diseño de Integración) debe ser el flujo por defecto antes de "publicar" cualquier cambio de catálogo o precio |

---

## 13. Criterios de éxito para la primera versión

- Una desarrolladora puede configurar completamente su catálogo (modelos, acabados, extras).
- Un comprador final puede completar una cotización de principio a fin, en menos de 3 minutos, desde un teléfono móvil.
- El Plan A puede publicarse y recibir su primera cotización real sin intervención manual de código.
- El Plan B puede embeberse en al menos un CMS de prueba (ej. WordPress) sin romper el diseño del sitio anfitrión.
- Cero incidentes de datos cruzados entre cuentas durante el periodo de pruebas.

---

## 14. Documentos relacionados

Este documento se apoya en decisiones ya tomadas en documentos y prototipos previos del proyecto:

- **Brief de decisión — Modelo de negocio** (software integrado vs. plataforma SaaS propia).
- **Simulación del configurador público** (demo funcional del flujo del comprador).
- **Demo del dashboard administrativo** (demo funcional del panel de la desarrolladora, incluyendo el módulo de Integración).
- **Demo del widget embebido** (sitio de ejemplo de una desarrolladora con el configurador integrado vía `iframe`).

Estos prototipos ya validaron, en código funcional, gran parte de lo descrito en las secciones 6 y 9 de este documento — este documento formaliza esas decisiones para servir como punto de partida del desarrollo real.

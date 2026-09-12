# Instalación del widget (Plan Profesional)

Esta guía es para el equipo de la desarrolladora: cómo instalar el
cotizador embebido en su propio sitio vía `<iframe>`.

## 1. Obtén tu snippet

En el dashboard de MODULA, entra a tu desarrollo → pestaña **Integración**.
Ahí encontrarás un bloque de código listo para copiar, algo así:

```html
<iframe
  id="modula-widget-los-encinos"
  src="https://tuapp.com/widget/los-encinos"
  style="width:100%;border:0;display:block;"
  title="Cotizador Residencial Los Encinos"
></iframe>
<script>
  window.addEventListener("message", function (event) {
    if (event.data && event.data.type === "modula:resize" && event.data.slug === "los-encinos") {
      var frame = document.getElementById("modula-widget-los-encinos");
      if (frame) frame.style.height = event.data.height + "px";
    }
  });
</script>
```

## 2. Configura el entorno antes de publicar

En la misma pestaña de Integración:

- **Modo vista previa**: no valida el dominio de origen. Úsalo mientras
  pruebas la instalación.
- **Modo producción**: valida que el sitio que carga el widget esté en tu
  lista de **dominios autorizados**. Agrega ahí tu dominio real
  (ej. `midesarrollo.com`) antes de cambiar a este modo — si no, el widget
  mostrará "no autorizado" en tu propio sitio.

## 3. Instalación por plataforma

### WordPress

1. Edita la página donde quieres el cotizador.
2. Agrega un bloque **HTML personalizado** (Custom HTML).
3. Pega el snippet completo (el `<iframe>` y el `<script>`).
4. Publica y verifica en modo vista previa antes de pasar a producción.

### Wix

1. En el editor, agrega un elemento **Embed HTML / iFrame**.
2. Algunos planes de Wix ejecutan el contenido embebido dentro de un
   `<iframe>` propio con sandboxing adicional — si el `<script>` de
   redimensionado no corre, el widget seguirá funcionando pero con una
   altura fija; ajusta manualmente la altura del elemento embed.
3. Pega el snippet en el editor de código del elemento.

### Webflow

1. Agrega un elemento **Embed** (Add Elements → Embed).
2. Pega el snippet completo.
3. Publica el sitio (el embed no se previsualiza en el editor de Webflow,
   solo al publicar).

### Sitio HTML a la medida

Pega el snippet directamente donde quieras que aparezca el cotizador,
antes del cierre de `</body>`.

## 4. Limitaciones conocidas

- El botón "Ver vista previa" del dashboard usa tu sesión de administrador
  para mostrar desarrollos en borrador. Si pruebas el widget embebido
  (no la página hospedada) desde un sitio de otro dominio mientras el
  desarrollo sigue en borrador, tu sesión del dashboard puede no viajar
  al `iframe` por las políticas de cookies de terceros del navegador —
  para probar con datos reales de un borrador, usa primero la página
  hospedada (`/[slug]/cotizacion-cliente?preview=1`) en la misma pestaña
  donde iniciaste sesión.
- Antes de anunciar el Plan Profesional a un cliente, verifica manualmente
  la instalación en al menos WordPress, Wix y Webflow — el comportamiento
  exacto de cada constructor de páginas con contenido embebido puede
  variar entre versiones.

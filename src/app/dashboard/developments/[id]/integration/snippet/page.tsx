import { requireDevelopmentForSession } from "@/lib/tenant";
import { getBaseUrl } from "@/lib/baseUrl";
import { CopyButton } from "@/components/ui/copy-button";

export const dynamic = "force-dynamic";

export default async function IntegrationSnippetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const development = await requireDevelopmentForSession(id);
  const baseUrl = await getBaseUrl();
  const widgetUrl = `${baseUrl}/widget/${development.slug}`;

  const snippet = `<iframe
  id="modula-widget-${development.slug}"
  src="${widgetUrl}"
  style="width:100%;border:0;display:block;"
  title="Cotizador ${development.name}"
></iframe>
<script>
  window.addEventListener("message", function (event) {
    if (event.data && event.data.type === "modula:resize" && event.data.slug === "${development.slug}") {
      var frame = document.getElementById("modula-widget-${development.slug}");
      if (frame) frame.style.height = event.data.height + "px";
    }
  });
</script>`;

  return (
    <section>
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-medium">Snippet de instalación</h3>
        <CopyButton value={snippet} label="Copiar snippet" />
      </div>
      <pre className="mt-2 overflow-x-auto rounded border bg-muted p-3 text-xs">{snippet}</pre>
    </section>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <li className="rounded-xl border border-dashed border-border p-8 text-center text-sm">
      <p className="font-medium text-foreground">{title}</p>
      {description && <p className="mt-1 text-muted-foreground">{description}</p>}
    </li>
  );
}

export function PageIndex({ items, label = "On this page" }: { items: { href: string; label: string }[]; label?: string }) {
  return (
    <nav aria-label={label} className="page-index">
      <span className="shrink-0 text-caption font-semibold uppercase tracking-widest text-label-3">{label}</span>
      <ul className="flex flex-wrap gap-x-5 gap-y-1">
        {items.map((item) => <li key={item.href}><a href={item.href} className="pressable inline-flex min-h-11 items-center text-subhead font-semibold text-label-2 hover:text-tint">{item.label}</a></li>)}
      </ul>
    </nav>
  );
}

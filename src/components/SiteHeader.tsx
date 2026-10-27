import { useLocale } from "./LocaleContext";

export function SiteHeader({ current }: { current: "explore" | "sources" | "about" }) {
  const { locale, setLocale, t } = useLocale();
  const links = [
    { href: "/", id: "explore" as const, label: t.navExplore },
    { href: "/sources", id: "sources" as const, label: t.navSources },
    { href: "/about", id: "about" as const, label: t.navAbout },
  ];

  return (
    <header className="flex items-center justify-between gap-6 border-b border-line px-5 py-4 md:px-8">
      <a href="/" className="font-mono text-[11px] tracking-[0.22em] text-accent uppercase">
        {t.brand}
      </a>
      <nav className="flex items-center gap-5 text-sm text-muted">
        {links.map((link) => (
          <a
            key={link.id}
            href={link.href}
            className={current === link.id ? "text-fog" : "hover:text-fog"}
          >
            {link.label}
          </a>
        ))}
        <div className="ml-2 flex overflow-hidden rounded border border-line font-mono text-[11px]">
          <button
            type="button"
            className={`px-2 py-1 ${locale === "en" ? "bg-panel-2 text-accent" : "text-muted"}`}
            onClick={() => setLocale("en")}
          >
            {t.langEn}
          </button>
          <button
            type="button"
            className={`px-2 py-1 ${locale === "es" ? "bg-panel-2 text-accent" : "text-muted"}`}
            onClick={() => setLocale("es")}
          >
            {t.langEs}
          </button>
        </div>
      </nav>
    </header>
  );
}

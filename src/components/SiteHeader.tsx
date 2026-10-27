import { explorerHref } from "../lib/deepLinks";
import { useLocale } from "./LocaleContext";

export function SiteHeader({ current }: { current: "explore" | "sources" | "about" | "stories" | "stats" }) {
  const { locale, setLocale, t, theme, setTheme } = useLocale();
  const links = [
    { href: "/", id: "explore" as const, label: t.navExplore },
    { href: explorerHref({ guides: true, lang: locale }), id: "stories" as const, label: t.navStories },
    { href: "/stats", id: "stats" as const, label: t.navStats },
    { href: "/sources", id: "sources" as const, label: t.navSources },
    { href: "/about", id: "about" as const, label: t.navAbout },
  ];

  return (
    <header className="flex items-center justify-between gap-6 border-b border-line px-5 py-4 md:px-8">
      <a href="/" className="font-mono text-[11px] tracking-[0.22em] text-accent uppercase">
        {t.brand}
      </a>
      <nav className="flex flex-wrap items-center justify-end gap-4 text-sm text-muted">
        {links.map((link) => (
          <a
            key={link.id}
            href={link.href}
            className={current === link.id ? "text-fog" : "hover:text-fog"}
          >
            {link.label}
          </a>
        ))}
        <div className="flex overflow-hidden rounded border border-line font-mono text-[11px]">
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
        <div className="flex overflow-hidden rounded border border-line font-mono text-[11px]">
          <button
            type="button"
            className={`px-2 py-1 ${theme === "light" ? "bg-panel-2 text-accent" : "text-muted"}`}
            onClick={() => setTheme("light")}
          >
            {t.themeLight}
          </button>
          <button
            type="button"
            className={`px-2 py-1 ${theme === "dark" ? "bg-panel-2 text-accent" : "text-muted"}`}
            onClick={() => setTheme("dark")}
          >
            {t.themeDark}
          </button>
        </div>
      </nav>
    </header>
  );
}

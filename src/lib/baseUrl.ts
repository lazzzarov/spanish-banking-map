/** Astro `base` prefix; `/` locally, `/spanish-banking-map/` on GitHub Pages. */
export function getBaseUrl(): string {
  const base = import.meta.env.BASE_URL;
  if (typeof base === "string" && base.length > 0) return base;
  return "/";
}

export function withBase(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = getBaseUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (base === "/") return normalized;
  const trimmed = base.endsWith("/") ? base.slice(0, -1) : base;
  if (normalized === "/") return `${trimmed}/`;
  return `${trimmed}${normalized}`;
}

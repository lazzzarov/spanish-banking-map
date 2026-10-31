import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

/** GitHub Actions sets CI=true; project Pages need this subpath. Local dev uses `/`. */
const base = process.env.CI ? "/spanish-banking-map" : "/";

export default defineConfig({
  site: "https://lazzzarov.github.io",
  base,
  integrations: [react()],
  // Stories have no code blocks; Shiki's inline styles would also clash with the CSP below.
  markdown: { syntaxHighlight: false },
  security: {
    // Astro hashes the page's own scripts and styles into a CSP <meta> tag. GitHub Pages
    // cannot send headers, so frame-ancestors is not available here.
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ],
      styleDirective: {
        resources: [
          { resource: "'self'", kind: "element" },
          // React renders layout values as style attributes (bar widths, positions).
          { resource: "'unsafe-inline'", kind: "attribute" },
        ],
      },
    },
  },
  vite: {
    plugins: [tailwindcss()],
    assetsInclude: ["**/*.geojson"],
    build: {
      // Keep fonts as files: inlined data: fonts would be blocked by the CSP's font-src 'self'.
      assetsInlineLimit: (filePath) => (/\.(woff2?|ttf|otf)$/.test(filePath) ? false : undefined),
    },
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
        "@data": fileURLToPath(new URL("./data", import.meta.url)),
      },
    },
  },
});

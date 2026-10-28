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
  vite: {
    plugins: [tailwindcss()],
    assetsInclude: ["**/*.geojson"],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
        "@data": fileURLToPath(new URL("./data", import.meta.url)),
      },
    },
  },
});

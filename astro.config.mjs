import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
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

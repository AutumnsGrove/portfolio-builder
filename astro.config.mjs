import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
import cloudflare from "@astrojs/cloudflare";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  integrations: [svelte()],
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
  output: "server",
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      noExternal: ["svelte-sonner"],
    },
  },
});

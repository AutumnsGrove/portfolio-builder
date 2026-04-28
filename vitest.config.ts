import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@blocks": path.resolve(__dirname, "./src/blocks"),
      "@lib": path.resolve(__dirname, "./src/lib"),
      "@agents": path.resolve(__dirname, "./src/agents"),
    },
  },
  test: {
    globals: false,
    include: ["tests/**/*.test.ts"],
  },
});

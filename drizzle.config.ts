import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./migrations",
  schema: ["./src/lib/db/schema.ts", "./src/lib/db/auth-schema.ts"],
  dialect: "sqlite",
});

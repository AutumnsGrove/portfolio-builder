/// <reference path=".astro/types.d.ts" />
/// <reference types="astro/client" />

type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
  OPENROUTER_API_KEY: string;
  // AI_GATEWAY: Fetcher; // v2 — Cloudflare AI Gateway
}

declare namespace App {
  interface Locals extends Runtime {}
}

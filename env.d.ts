/// <reference path=".astro/types.d.ts" />
/// <reference types="astro/client" />

type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
  AI_GATEWAY: Fetcher;
}

declare namespace App {
  interface Locals extends Runtime {}
}

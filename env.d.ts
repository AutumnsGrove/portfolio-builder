/// <reference path=".astro/types.d.ts" />
/// <reference types="astro/client" />

interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
  OPENROUTER_API_KEY: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  // AI_GATEWAY: Fetcher; // v2 — Cloudflare AI Gateway
}

declare namespace App {
  interface Locals {
    cfContext: ExecutionContext;
  }
}

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { createAuth } from "@/lib/auth";

export const ALL: APIRoute = async (ctx) => {
  const auth = createAuth(env as Env, ctx.request.cf as any);
  return auth.handler(ctx.request);
};

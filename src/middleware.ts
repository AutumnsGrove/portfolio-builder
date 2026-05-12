import { defineMiddleware } from "astro:middleware";
import { env } from "cloudflare:workers";
import { createAuth } from "@/lib/auth";

const PUBLIC_PATHS = ["/", "/api/auth", "/login", "/privacy", "/terms"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

// AUTH_BYPASS: Auth gating is disabled while login flow is unbuilt.
// When auth is ready, remove this flag and the bypass branch below.
const AUTH_BYPASS = true;

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  const auth = createAuth(env as Env, context.request.cf as any);
  const result = await auth.api.getSession({
    headers: context.request.headers,
  });

  if (AUTH_BYPASS || isPublicPath(pathname)) {
    context.locals.user = result?.user ?? null;
    context.locals.session = result?.session ?? null;
    return next();
  }

  if (!result) {
    return context.redirect("/login");
  }

  context.locals.user = result.user;
  context.locals.session = result.session;
  return next();
});

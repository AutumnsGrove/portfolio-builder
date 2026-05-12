import { defineMiddleware } from "astro:middleware";
import { env } from "cloudflare:workers";
import { createAuth } from "@/lib/auth";

const PUBLIC_PATHS = ["/", "/api/auth"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  if (isPublicPath(pathname)) {
    const auth = createAuth(env as Env, context.request.cf as any);
    const result = await auth.api.getSession({
      headers: context.request.headers,
    });
    context.locals.user = result?.user ?? null;
    context.locals.session = result?.session ?? null;
    return next();
  }

  const auth = createAuth(env as Env, context.request.cf as any);
  const result = await auth.api.getSession({
    headers: context.request.headers,
  });

  if (!result) {
    return context.redirect("/");
  }

  context.locals.user = result.user;
  context.locals.session = result.session;
  return next();
});

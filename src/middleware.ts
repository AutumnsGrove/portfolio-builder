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

const DEV_USER = {
  id: "dev",
  name: "Developer",
  email: "dev@localhost",
  emailVerified: true,
  image: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  customInstructions: "",
};

let devUserSeeded = false;

async function ensureDevUser(db: D1Database) {
  if (devUserSeeded) return;
  try {
    const existing = await db.prepare("SELECT id FROM user WHERE id = 'dev'").first();
    if (!existing) {
      await db
        .prepare(
          `INSERT INTO user (id, name, email, email_verified, created_at, updated_at)
           VALUES ('dev', 'Developer', 'dev@localhost', 1, ?, ?)`,
        )
        .bind(Date.now(), Date.now())
        .run();
    }
    devUserSeeded = true;
  } catch (e) {
    console.error("[Middleware] Failed to seed dev user:", e);
    devUserSeeded = true;
  }
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  const auth = createAuth(env as Env, context.request.cf as any);
  const result = await auth.api.getSession({
    headers: context.request.headers,
  });

  if (AUTH_BYPASS || isPublicPath(pathname)) {
    if (AUTH_BYPASS && !result?.user) {
      const db = (env as Env).DB;
      await ensureDevUser(db);
      context.locals.user = DEV_USER as any;
      context.locals.session = null;
    } else {
      context.locals.user = result?.user ?? null;
      context.locals.session = result?.session ?? null;
    }
    return next();
  }

  if (!result) {
    return context.redirect("/login");
  }

  context.locals.user = result.user;
  context.locals.session = result.session;
  return next();
});

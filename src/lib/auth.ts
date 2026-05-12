import { betterAuth } from "better-auth";
import { withCloudflare } from "better-auth-cloudflare";
import type { CloudflareGeolocation } from "better-auth-cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { schema } from "./db/auth-schema";

export function createAuth(env: Env, cf?: CloudflareGeolocation) {
  const isLocalDev = (env.BETTER_AUTH_URL ?? "").startsWith("http://localhost");
  const db = drizzle(env.DB, { schema });

  return betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    ...withCloudflare(
      {
        autoDetectIpAddress: true,
        cf: cf || {},
        d1: {
          db: db as any,
          options: {
            usePlural: false,
          },
        },
      },
      {},
    ),

    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },

    user: {
      additionalFields: {
        customInstructions: {
          type: "string",
          required: false,
          input: true,
        },
      },
    },

    session: {
      expiresIn: 30 * 24 * 60 * 60,
      updateAge: 24 * 60 * 60,
    },

    advanced: {
      defaultCookieAttributes: {
        httpOnly: true,
        secure: !isLocalDev,
        sameSite: "lax",
        path: "/",
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { z } from "zod";

const UpdateSchema = z.object({
  customInstructions: z.string().max(2000),
});

export const PUT: APIRoute = async ({ request }) => {
  const db = (env as Env).DB;
  const userId = "mock-user-id"; // TODO: BetterAuth session

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid request" }), { status: 400 });
  }

  await db
    .prepare("UPDATE users SET custom_instructions = ?, updated_at = ? WHERE id = ?")
    .bind(parsed.data.customInstructions, Date.now(), userId)
    .run();

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

/**
 * POST /api/sites — Create a new portfolio site.
 *
 * Returns the new site's ID so the client can redirect to /builder/{id}.
 * Zones are scaffolded with the Generalist template defaults.
 */

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { z } from "zod";
import { generateSlug } from "@/lib/sites/slug";
import { getDefaultZones } from "@/lib/sites/defaults";

const CreateSiteSchema = z.object({
  name: z.string().min(1).max(100).optional().default("Untitled Portfolio"),
});

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const POST: APIRoute = async ({ request, locals }) => {
  let body: unknown = {};
  try {
    const text = await request.text();
    if (text) body = JSON.parse(text);
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }

  const parsed = CreateSiteSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse({ error: "Invalid request", details: parsed.error.issues }, 400);
  }

  const { name } = parsed.data;
  const db = (env as Env).DB;
  const userId = locals.user?.id ?? "dev";

  const siteId = crypto.randomUUID();
  const slug = generateSlug(name) + "-" + siteId.slice(0, 8);
  const now = Date.now();

  await db
    .prepare(
      `INSERT INTO sites (id, user_id, name, slug, template_id, style_layer_id, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(siteId, userId, name, slug, "generalist", "minimal", "draft", now, now)
    .run();

  const zones = getDefaultZones();
  await db.batch(
    zones.map((zone) =>
      db
        .prepare(
          `INSERT INTO zones (id, site_id, zone_id, label, "order", created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(crypto.randomUUID(), siteId, zone.id, zone.label, zone.order, now, now),
    ),
  );

  return jsonResponse({ id: siteId, name, slug }, 201);
};

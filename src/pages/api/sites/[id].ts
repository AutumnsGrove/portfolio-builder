/**
 * /api/sites/:id — Portfolio site operations.
 *
 * PATCH: Update site (rename, change status, archive)
 * DELETE: Remove site and all associated data (zones, blocks, conversations)
 */

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { z } from "zod";

const PatchSiteSchema = z.object({
  action: z.enum(["save", "rename", "archive", "unarchive"]).optional(),
  name: z.string().min(1).max(100).optional(),
  status: z.enum(["draft", "published"]).optional(),
});

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const { id } = params;
  const db = (env as Env).DB;
  const userId = locals.user?.id ?? "dev";

  const site = await db
    .prepare("SELECT id FROM sites WHERE id = ? AND user_id = ?")
    .bind(id, userId)
    .first();

  if (!site) {
    return jsonResponse({ error: "Site not found" }, 404);
  }

  let body: unknown = {};
  try {
    const text = await request.text();
    if (text) body = JSON.parse(text);
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }

  const parsed = PatchSiteSchema.safeParse(body);
  if (!parsed.success) {
    return jsonResponse({ error: "Invalid request", details: parsed.error.issues }, 400);
  }

  const { action, name, status } = parsed.data;
  const now = Date.now();

  if (action === "rename" && name) {
    await db
      .prepare("UPDATE sites SET name = ?, updated_at = ? WHERE id = ?")
      .bind(name, now, id)
      .run();
  }

  if (action === "archive") {
    await db
      .prepare("UPDATE sites SET status = 'draft', updated_at = ? WHERE id = ?")
      .bind(now, id)
      .run();
  }

  if (status) {
    await db
      .prepare("UPDATE sites SET status = ?, updated_at = ? WHERE id = ?")
      .bind(status, now, id)
      .run();
  }

  // "save" action just touches updated_at
  if (action === "save") {
    await db
      .prepare("UPDATE sites SET updated_at = ? WHERE id = ?")
      .bind(now, id)
      .run();
  }

  return jsonResponse({ ok: true });
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const { id } = params;
  const db = (env as Env).DB;
  const userId = locals.user?.id ?? "dev";

  const site = await db
    .prepare("SELECT id FROM sites WHERE id = ? AND user_id = ?")
    .bind(id, userId)
    .first();

  if (!site) {
    return jsonResponse({ error: "Site not found" }, 404);
  }

  // Gather IDs for cascading deletes
  const { results: zoneRows } = await db
    .prepare("SELECT id FROM zones WHERE site_id = ?")
    .bind(id)
    .all<{ id: string }>();

  const { results: convRows } = await db
    .prepare("SELECT id FROM ai_conversations WHERE site_id = ?")
    .bind(id)
    .all<{ id: string }>();

  // Delete in FK dependency order: deepest refs first
  await db.batch([
    // Agent metrics reference conversations
    ...convRows.map((c) => db.prepare("DELETE FROM agent_metrics WHERE conversation_id = ?").bind(c.id)),
    // Blocks reference zones
    ...zoneRows.map((z) => db.prepare("DELETE FROM blocks WHERE zone_id = ?").bind(z.id)),
    // Everything that references sites directly
    db.prepare("DELETE FROM zones WHERE site_id = ?").bind(id),
    db.prepare("DELETE FROM ai_conversations WHERE site_id = ?").bind(id),
    db.prepare("DELETE FROM versions WHERE site_id = ?").bind(id),
    db.prepare("DELETE FROM analytics_events WHERE site_id = ?").bind(id),
    db.prepare("DELETE FROM hosted_sites WHERE site_id = ?").bind(id),
    db.prepare("DELETE FROM style_configs WHERE site_id = ?").bind(id),
    // Finally the site itself
    db.prepare("DELETE FROM sites WHERE id = ?").bind(id),
  ]);

  return jsonResponse({ ok: true });
};

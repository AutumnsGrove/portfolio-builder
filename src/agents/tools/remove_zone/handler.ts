import type { ToolHandler } from "../types";

interface RemoveZoneParams {
  zone_id: number;
}

export const handler: ToolHandler<RemoveZoneParams> = async (params, context) => {
  const { db, siteId } = context;
  const { zone_id } = params;

  const zone = await db
    .prepare('SELECT id, "order" FROM zones WHERE site_id = ? AND zone_id = ?')
    .bind(siteId, zone_id)
    .first<{ id: string; order: number }>();

  if (!zone) {
    return { success: false, error: `Zone ${zone_id} not found` };
  }

  // Delete blocks in this zone first
  await db.prepare("DELETE FROM blocks WHERE zone_id = ?").bind(zone.id).run();
  await db.prepare("DELETE FROM zones WHERE id = ?").bind(zone.id).run();

  // Reorder remaining zones
  await db
    .prepare('UPDATE zones SET "order" = "order" - 1 WHERE site_id = ? AND "order" > ?')
    .bind(siteId, zone.order)
    .run();

  return { success: true, data: { removed_zone: zone_id } };
};

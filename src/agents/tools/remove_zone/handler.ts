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

  await db.batch([
    db.prepare("DELETE FROM blocks WHERE zone_id = ?").bind(zone.id),
    db.prepare("DELETE FROM zones WHERE id = ?").bind(zone.id),
    db.prepare('UPDATE zones SET "order" = "order" - 1 WHERE site_id = ? AND "order" > ?').bind(siteId, zone.order),
  ]);

  return { success: true, data: { removed_zone: zone_id } };
};

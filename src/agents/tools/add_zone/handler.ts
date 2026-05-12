import type { ToolHandler } from "../types";

interface AddZoneParams {
  label: string;
}

export const handler: ToolHandler<AddZoneParams> = async (params, context) => {
  const { db, siteId } = context;
  const { label } = params;

  // Get next zone_id and order
  const max = await db
    .prepare('SELECT MAX(zone_id) as max_id, MAX("order") as max_order FROM zones WHERE site_id = ?')
    .bind(siteId)
    .first<{ max_id: number | null; max_order: number | null }>();

  const zoneId = (max?.max_id ?? 0) + 1;
  const order = (max?.max_order ?? -1) + 1;
  const dbId = crypto.randomUUID();
  const now = Date.now();

  await db
    .prepare(
      `INSERT INTO zones (id, site_id, zone_id, label, "order", created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(dbId, siteId, zoneId, label, order, now, now)
    .run();

  return {
    success: true,
    data: { zone_id: zoneId, label, order },
  };
};

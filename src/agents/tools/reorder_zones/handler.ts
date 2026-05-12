import type { ToolHandler } from "../types";

interface ReorderZonesParams {
  zone_ids: number[];
}

export const handler: ToolHandler<ReorderZonesParams> = async (params, context) => {
  const { db, siteId } = context;
  const { zone_ids } = params;

  const now = Date.now();

  for (let i = 0; i < zone_ids.length; i++) {
    await db
      .prepare('UPDATE zones SET "order" = ?, updated_at = ? WHERE site_id = ? AND zone_id = ?')
      .bind(i, now, siteId, zone_ids[i])
      .run();
  }

  return {
    success: true,
    data: { order: zone_ids },
  };
};

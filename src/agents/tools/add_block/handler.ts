import type { ToolHandler } from "../types";

interface AddBlockParams {
  zone_id: number;
  type: string;
  size: string;
  content: Record<string, unknown>;
}

export const handler: ToolHandler<AddBlockParams> = async (params, context) => {
  const { db, siteId } = context;
  const { zone_id, type, size, content } = params;

  const zone = await db
    .prepare("SELECT id FROM zones WHERE site_id = ? AND zone_id = ?")
    .bind(siteId, zone_id)
    .first<{ id: string }>();

  if (!zone) {
    return { success: false, error: `Zone ${zone_id} not found for this site` };
  }

  const maxOrder = await db
    .prepare('SELECT MAX("order") as max_order FROM blocks WHERE zone_id = ?')
    .bind(zone.id)
    .first<{ max_order: number | null }>();

  const order = (maxOrder?.max_order ?? -1) + 1;
  const blockId = crypto.randomUUID();
  const now = Date.now();

  const contentJson = JSON.stringify({ type, data: content });

  await db
    .prepare(
      `INSERT INTO blocks (id, zone_id, "order", type, size, content_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(blockId, zone.id, order, type, size, contentJson, now, now)
    .run();

  return {
    success: true,
    data: { block_id: blockId, zone_id, order, type, size },
  };
};

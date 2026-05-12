import type { ToolHandler } from "../types";

interface RemoveBlockParams {
  block_id: string;
}

export const handler: ToolHandler<RemoveBlockParams> = async (params, context) => {
  const { db } = context;
  const { block_id } = params;

  const block = await db
    .prepare('SELECT id, zone_id, "order" FROM blocks WHERE id = ?')
    .bind(block_id)
    .first<{ id: string; zone_id: string; order: number }>();

  if (!block) {
    return { success: false, error: `Block ${block_id} not found` };
  }

  await db.prepare("DELETE FROM blocks WHERE id = ?").bind(block_id).run();

  // Reorder remaining blocks to close the gap
  await db
    .prepare('UPDATE blocks SET "order" = "order" - 1 WHERE zone_id = ? AND "order" > ?')
    .bind(block.zone_id, block.order)
    .run();

  return { success: true, data: { removed: block_id } };
};

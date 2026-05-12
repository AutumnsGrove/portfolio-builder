import type { ToolHandler } from "../types";

interface MoveBlockParams {
  block_id: string;
  direction?: "up" | "down";
  target_zone_id?: number;
}

export const handler: ToolHandler<MoveBlockParams> = async (params, context) => {
  const { db, siteId } = context;
  const { block_id, direction, target_zone_id } = params;

  const block = await db
    .prepare('SELECT id, zone_id, "order" FROM blocks WHERE id = ?')
    .bind(block_id)
    .first<{ id: string; zone_id: string; order: number }>();

  if (!block) {
    return { success: false, error: `Block ${block_id} not found` };
  }

  // Move to a different zone
  if (target_zone_id !== undefined) {
    const targetZone = await db
      .prepare("SELECT id FROM zones WHERE site_id = ? AND zone_id = ?")
      .bind(siteId, target_zone_id)
      .first<{ id: string }>();

    if (!targetZone) {
      return { success: false, error: `Zone ${target_zone_id} not found` };
    }

    // Append to target zone — read max order first, then batch the writes
    const maxOrder = await db
      .prepare('SELECT MAX("order") as max_order FROM blocks WHERE zone_id = ?')
      .bind(targetZone.id)
      .first<{ max_order: number | null }>();

    const newOrder = (maxOrder?.max_order ?? -1) + 1;

    await db.batch([
      // Close gap in source zone
      db.prepare('UPDATE blocks SET "order" = "order" - 1 WHERE zone_id = ? AND "order" > ?').bind(block.zone_id, block.order),
      // Move block to target zone
      db.prepare('UPDATE blocks SET zone_id = ?, "order" = ?, updated_at = ? WHERE id = ?').bind(targetZone.id, newOrder, Date.now(), block_id),
    ]);

    return { success: true, data: { block_id, moved_to_zone: target_zone_id, order: newOrder } };
  }

  // Move within current zone
  if (!direction) {
    return { success: false, error: "Provide direction (up/down) or target_zone_id" };
  }

  const swapOrder = direction === "up" ? block.order - 1 : block.order + 1;

  const neighbor = await db
    .prepare('SELECT id FROM blocks WHERE zone_id = ? AND "order" = ?')
    .bind(block.zone_id, swapOrder)
    .first<{ id: string }>();

  if (!neighbor) {
    return { success: false, error: `Cannot move ${direction}: already at boundary` };
  }

  const now = Date.now();
  await db.batch([
    db.prepare('UPDATE blocks SET "order" = ?, updated_at = ? WHERE id = ?').bind(swapOrder, now, block_id),
    db.prepare('UPDATE blocks SET "order" = ?, updated_at = ? WHERE id = ?').bind(block.order, now, neighbor.id),
  ]);

  return { success: true, data: { block_id, direction, new_order: swapOrder } };
};

import type { ToolHandler } from "../types";

interface UpdateBlockParams {
  block_id: string;
  size?: string;
  content?: Record<string, unknown>;
  style_overrides?: Record<string, string>;
}

export const handler: ToolHandler<UpdateBlockParams> = async (params, context) => {
  const { db } = context;
  const { block_id, size, content, style_overrides } = params;

  const block = await db
    .prepare("SELECT id, type, size, content_json, style_overrides FROM blocks WHERE id = ?")
    .bind(block_id)
    .first<{ id: string; type: string; size: string; content_json: string; style_overrides: string | null }>();

  if (!block) {
    return { success: false, error: `Block ${block_id} not found` };
  }

  const now = Date.now();
  const updates: string[] = [];
  const bindings: unknown[] = [];

  if (size) {
    updates.push("size = ?");
    bindings.push(size);
  }

  if (content) {
    const contentJson = JSON.stringify({ type: block.type, data: content });
    updates.push("content_json = ?");
    bindings.push(contentJson);
  }

  if (style_overrides) {
    updates.push("style_overrides = ?");
    bindings.push(JSON.stringify(style_overrides));
  }

  if (updates.length === 0) {
    return { success: true, data: { block_id, message: "No changes" } };
  }

  updates.push("updated_at = ?");
  bindings.push(now);
  bindings.push(block_id);

  await db
    .prepare(`UPDATE blocks SET ${updates.join(", ")} WHERE id = ?`)
    .bind(...bindings)
    .run();

  return { success: true, data: { block_id, updated: updates.length - 1 } };
};

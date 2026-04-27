/**
 * done tool — signal turn completion.
 *
 * The AI calls this when it's finished responding to the user's message.
 */

import type { ToolHandler } from "../types";

export interface DoneParams {
  reason?: string; // Why the turn is ending (for trace logs)
}

export const handler: ToolHandler<DoneParams, void> = async (params) => {
  console.log(`[AI Turn Complete] ${params.reason || "No reason provided"}`);

  return {
    success: true,
    data: null,
  };
};

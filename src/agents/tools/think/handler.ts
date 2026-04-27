/**
 * think tool — internal reasoning visible in trace panel.
 *
 * The AI uses this to "think out loud" before responding.
 * Thoughts are logged but not shown to the user directly.
 */

import type { ToolHandler } from "../types";

export interface ThinkParams {
  thought: string; // Internal reasoning
}

export const handler: ToolHandler<ThinkParams, void> = async (params) => {
  // Log thought for trace panel (in production, this goes to conversation log)
  console.log(`[AI Thinking] ${params.thought}`);

  return {
    success: true,
    data: null,
  };
};

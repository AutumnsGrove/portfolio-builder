/**
 * reply tool — send a message to the user.
 *
 * This is how the AI communicates. Messages support markdown formatting.
 */

import type { ToolHandler } from "../types";

export interface ReplyParams {
  message: string; // Markdown-formatted message to user
  typing?: boolean; // Show typing indicator first (default: true)
}

export const handler: ToolHandler<ReplyParams, { message: string }> = async (
  params,
) => {
  // In production, this would add the message to the conversation
  // and trigger the UI to display it
  console.log(`[AI Reply] ${params.message}`);

  return {
    success: true,
    data: {
      message: params.message,
    },
  };
};

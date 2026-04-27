/**
 * use_tools tool — load deferred tool categories on demand.
 *
 * The AI calls this when it needs tools that aren't hot-loaded.
 * For example: "I need to add a block" → use_tools(["blocks"])
 */

import type { ToolHandler } from "../types";

export interface UseToolsParams {
  categories: string[]; // Category names to load
}

export interface UseToolsResult {
  loaded: string[]; // Successfully loaded categories
  tool_count: number; // Total number of tools now available
}

// Available deferred categories (per SPEC_v1.md §4.4)
const VALID_CATEGORIES = ["blocks", "zones", "content", "publish"];

export const handler: ToolHandler<UseToolsParams, UseToolsResult> = async (
  params,
) => {
  // Validate categories
  const invalid = params.categories.filter(
    (cat) => !VALID_CATEGORIES.includes(cat),
  );
  if (invalid.length > 0) {
    return {
      success: false,
      error: `Invalid tool categories: ${invalid.join(", ")}. Valid: ${VALID_CATEGORIES.join(", ")}`,
    };
  }

  // In production:
  // 1. Load tool definitions from each category
  // 2. Register them in the active tool set
  // 3. Return updated tool list to AI

  console.log(`[AI Loaded Tools] Categories: ${params.categories.join(", ")}`);

  // Mock result (actual implementation will load from registry)
  const loaded = params.categories;
  const tool_count = loaded.length * 4; // Rough estimate: 4 tools per category

  return {
    success: true,
    data: {
      loaded,
      tool_count,
    },
  };
};

/**
 * Tool Registry — Runtime tool lookup and execution.
 *
 * Consumes the build-time generated tool definitions and provides:
 * - getHotTools() — always-available tools for the system prompt
 * - getDeferredTools() — tools loaded on-demand by category
 * - executeTool() — run a tool by name with validated context
 * - validateCategories() — check if category names are valid
 */

import { TOOL_DEFINITIONS } from "./registry.generated";
import type { Tool, ToolContext, ToolResult } from "./types";

const VALID_CATEGORIES = [
  "hot",
  "blocks",
  "zones",
  "content",
  "publish",
] as const;

type ToolCategory = (typeof VALID_CATEGORIES)[number];

// Build the registry map on module load
const TOOL_REGISTRY = new Map<string, Tool>();

for (const def of TOOL_DEFINITIONS) {
  TOOL_REGISTRY.set(def.name, def as unknown as Tool);
}

/**
 * Get all hot tools (always in the AI's context).
 */
export function getHotTools(): Tool[] {
  return Array.from(TOOL_REGISTRY.values()).filter(
    (t) => t.category === "hot",
  );
}

/**
 * Get deferred tools for specific categories.
 *
 * Called when the AI invokes use_tools to load a category.
 * Returns empty array for categories with no tools registered.
 */
export function getDeferredTools(categories: string[]): Tool[] {
  return Array.from(TOOL_REGISTRY.values()).filter((t) =>
    categories.includes(t.category),
  );
}

/**
 * Execute a tool by name.
 *
 * Looks up the tool in the registry, then calls its handler.
 * Returns a structured result (success or error) — never throws.
 */
export async function executeTool(
  name: string,
  params: unknown,
  context: ToolContext,
): Promise<ToolResult> {
  const tool = TOOL_REGISTRY.get(name);

  if (!tool) {
    return {
      success: false,
      error: `Unknown tool: ${name}. Available: ${Array.from(TOOL_REGISTRY.keys()).join(", ")}`,
    };
  }

  try {
    return await tool.handler(params as any, context);
  } catch (error: any) {
    console.error(`[Tool Error] ${name}:`, error);
    return {
      success: false,
      error: `Tool "${name}" failed: ${error.message || "Unknown error"}`,
    };
  }
}

/**
 * Validate category names.
 *
 * Used by use_tools handler and the orchestrator.
 */
export function validateCategories(categories: string[]): {
  valid: string[];
  invalid: string[];
} {
  const valid = categories.filter((c) =>
    VALID_CATEGORIES.includes(c as ToolCategory),
  );
  const invalid = categories.filter(
    (c) => !VALID_CATEGORIES.includes(c as ToolCategory),
  );
  return { valid, invalid };
}

/**
 * Get all registered tool names (for debugging).
 */
export function getRegisteredToolNames(): string[] {
  return Array.from(TOOL_REGISTRY.keys());
}

/**
 * Get total tool count by category.
 */
export function getToolCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const tool of TOOL_REGISTRY.values()) {
    counts[tool.category] = (counts[tool.category] ?? 0) + 1;
  }
  return counts;
}

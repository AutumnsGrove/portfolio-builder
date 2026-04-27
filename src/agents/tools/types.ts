/**
 * Type definitions for the AI agent tool system.
 *
 * Tools are the interface between the AI and the application.
 * Each tool has a schema (params) and a handler (implementation).
 */

import type { D1Database } from "@cloudflare/workers-types";
import type { ManifestV1 } from "@/lib/manifest";

/**
 * Context available to all tool handlers.
 *
 * This is dependency injection for tools — they get access to:
 * - Database (D1)
 * - Current user session
 * - Current site being edited
 * - OpenRouter API for nested AI calls (if needed)
 */
export interface ToolContext {
  db: D1Database;
  userId: string;
  siteId: string;
  conversationId: string;
  // Future: OpenRouter client, R2 bucket, etc.
}

/**
 * Result of executing a tool.
 *
 * Tools can succeed or fail. Failures include error messages
 * that the AI can see and respond to.
 */
export type ToolResult =
  | { success: true; data: any }
  | { success: false; error: string };

/**
 * Tool handler function signature.
 *
 * All tools are async functions that take validated params and context,
 * and return a result (success or error).
 */
export type ToolHandler<TParams = any, TResult = any> = (
  params: TParams,
  context: ToolContext,
) => Promise<ToolResult>;

/**
 * Tool definition (combines schema + handler).
 *
 * This is what gets registered in the tool registry.
 */
export interface Tool {
  name: string;
  description: string;
  category: "hot" | "blocks" | "zones" | "content" | "publish";
  parameters: Record<string, any>; // JSON Schema for parameters
  required: string[]; // Required parameter names
  handler: ToolHandler;
}

/**
 * Structured question for ask_user tool.
 *
 * Based on SPEC_v1.md §4.8 — the primary interaction pattern.
 */
export interface StructuredQuestion {
  question: string; // The question text
  context?: string; // Optional explanation of why we're asking
  header?: string; // Optional section header
  options: Array<{
    label: string; // Option text (e.g., "Software / code")
    description?: string; // Subtext (e.g., "GitHub repos, apps...")
    value?: string; // Custom value (defaults to label)
  }>;
  multi_select?: boolean; // Allow multiple selections (default: false)
  allow_other?: boolean; // Show "Other" with freeform text (default: true)
}

/**
 * User's response to structured questions.
 *
 * Returned from the UI after user makes selections.
 */
export interface StructuredResponse {
  questionIndex: number; // Which question (0-based)
  selected: string[]; // Selected option values
  other?: string; // Freeform text if "Other" selected
}

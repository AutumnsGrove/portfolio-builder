/**
 * Tool Schema Converters — Transform internal tool definitions
 * to the format expected by OpenRouter / OpenAI function calling API.
 *
 * OpenRouter uses the OpenAI-compatible tool format:
 * {
 *   type: "function",
 *   function: {
 *     name: "tool_name",
 *     description: "...",
 *     parameters: { type: "object", properties: {...}, required: [...] }
 *   }
 * }
 */

import type { Tool } from "./types";

/**
 * OpenRouter tool schema format (OpenAI-compatible).
 */
export interface OpenRouterToolSchema {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, any>;
      required: string[];
    };
  };
}

/**
 * Convert an internal Tool definition to OpenRouter's format.
 */
export function toOpenRouterToolSchema(tool: Tool): OpenRouterToolSchema {
  return {
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: {
        type: "object",
        properties: tool.parameters,
        required: tool.required,
      },
    },
  };
}

/**
 * Convert multiple tools to OpenRouter format.
 */
export function toOpenRouterToolSchemas(tools: Tool[]): OpenRouterToolSchema[] {
  return tools.map(toOpenRouterToolSchema);
}

/**
 * Guide Agent — Turn pipeline orchestrator.
 *
 * Processes a user message through a tool-calling loop:
 * 1. Build system prompt + tool schemas
 * 2. Call OpenRouter with conversation history
 * 3. Parse and execute tool calls
 * 4. Feed results back, repeat until 'done' or terminal tool
 *
 * v1: Single sync phase, no background specialists.
 * Follows her-go patterns: driver agent is sync and user-facing.
 */

import {
  OpenRouterClient,
  OpenRouterError,
  type OpenRouterMessage,
  type ToolCall,
  type OpenRouterToolSchema,
} from "./openrouter";
import { getHotTools, getDeferredTools, executeTool } from "@/agents/tools/registry";
import { toOpenRouterToolSchema } from "@/agents/tools/schemas";
import type { ToolContext, ToolResult } from "@/agents/tools/types";
import { buildSystemPrompt, type HelpLevel } from "./prompts";

// --- Types ---

export interface AgentContext {
  conversationId: string;
  userId: string;
  siteId: string;
  db: D1Database;
  apiKey: string;
  history: OpenRouterMessage[];
  helpLevel: HelpLevel;
}

export interface ToolTrace {
  tool: string;
  params: Record<string, unknown>;
  result: unknown;
  durationMs: number;
}

export interface AgentResponse {
  conversationId: string;
  /** Text reply from the agent (from 'reply' tool). */
  reply?: string;
  /** Structured questions (from 'ask_user' tool). */
  questions?: unknown;
  /** Full trace of tool calls for debugging/UI. */
  trace: ToolTrace[];
  metrics: AgentMetrics;
}

export interface AgentMetrics {
  /** Number of AI API calls made this turn. */
  turnCount: number;
  /** Total tool calls executed. */
  toolCallCount: number;
  /** Input tokens across all API calls. */
  tokensIn: number;
  /** Output tokens across all API calls. */
  tokensOut: number;
  /** Estimated cost in USD. */
  costUsd: number;
  /** Total time from user message to response. */
  latencyMs: number;
  /** Whether the turn hit the max call limit. */
  deadEnd: boolean;
}

// --- Constants ---

/** Max tool call loop iterations before forced halt. */
const MAX_TOOL_CALLS = 20;

/** Tools that end the turn when called. */
const TERMINAL_TOOLS = new Set(["reply", "ask_user", "done"]);

// --- Orchestrator ---

/**
 * Process a user message and return the agent's response.
 *
 * This is the main entry point for the Guide Agent. It:
 * 1. Loads conversation history
 * 2. Builds the system prompt with available tools
 * 3. Runs the tool-call loop until a terminal tool is hit
 * 4. Returns the response with trace and metrics
 */
export async function processMessage(
  userMessage: string,
  context: AgentContext,
): Promise<AgentResponse> {
  const startTime = Date.now();
  const client = new OpenRouterClient(context.apiKey);

  const trace: ToolTrace[] = [];
  let totalTokensIn = 0;
  let totalTokensOut = 0;
  let reply: string | undefined;
  let questions: unknown | undefined;
  const loadedCategories = new Set<string>();

  // Build the tool context for handler execution
  const toolContext: ToolContext = {
    db: context.db,
    userId: context.userId,
    siteId: context.siteId,
    conversationId: context.conversationId,
  };

  // Build messages: system prompt + history + new user message
  const messages: OpenRouterMessage[] = [
    { role: "system", content: buildSystemPrompt(context.helpLevel) },
    ...context.history.slice(-20), // Sliding window
    { role: "user", content: userMessage },
  ];

  // --- Tool Call Loop ---
  let loopCount = 0;
  let shouldContinue = true;

  while (shouldContinue && loopCount < MAX_TOOL_CALLS) {
    loopCount++;

    // Build available tools: hot + any loaded deferred categories
    const availableTools = [
      ...getHotTools(),
      ...getDeferredTools(Array.from(loadedCategories)),
    ];
    const toolSchemas: OpenRouterToolSchema[] =
      availableTools.map(toOpenRouterToolSchema);

    // Call OpenRouter
    let response;
    try {
      response = await client.chatCompletion(messages, toolSchemas);
    } catch (error) {
      // If the AI call fails, log it and break
      console.error("[GuideAgent] OpenRouter call failed:", error);

      // Give the user a fallback reply
      if (!reply) {
        reply =
          "I'm having trouble thinking right now. Could you try again in a moment?";
      }
      break;
    }

    totalTokensIn += response.usage.prompt_tokens;
    totalTokensOut += response.usage.completion_tokens;

    const choice = response.choices[0];

    // If the model returned tool calls, execute them
    if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
      // Add the assistant's tool-calling message to history
      messages.push({
        role: "assistant",
        content: choice.message.content,
        tool_calls: choice.message.tool_calls,
      });

      // Execute each tool call
      for (const toolCall of choice.message.tool_calls) {
        const toolStart = Date.now();
        const toolName = toolCall.function.name;

        let params: Record<string, unknown>;
        try {
          params = JSON.parse(toolCall.function.arguments);
        } catch {
          // Bad JSON from the model — tell it
          params = {};
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify({
              success: false,
              error: "Invalid JSON in tool arguments",
            }),
          });

          trace.push({
            tool: toolName,
            params: {},
            result: { error: "Invalid JSON in tool arguments" },
            durationMs: Date.now() - toolStart,
          });
          continue;
        }

        // Execute the tool
        const result = await executeTool(toolName, params, toolContext);

        const traceEntry: ToolTrace = {
          tool: toolName,
          params,
          result: result.success ? result.data : { error: result.error },
          durationMs: Date.now() - toolStart,
        };
        trace.push(traceEntry);

        // Feed result back to the model
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });

        // Handle special tools

        // use_tools: track loaded categories for next iteration
        if (toolName === "use_tools" && result.success) {
          const loaded = (result.data as { loaded?: string[] }).loaded;
          if (loaded) {
            for (const cat of loaded) {
              loadedCategories.add(cat);
            }
          }
        }

        // reply: capture the message text
        if (toolName === "reply" && result.success) {
          reply = params.message as string;
        }

        // ask_user: capture the structured questions
        if (toolName === "ask_user" && result.success) {
          questions = result.data;
        }

        // Terminal tools end the loop
        if (TERMINAL_TOOLS.has(toolName)) {
          shouldContinue = false;
        }
      }
    } else {
      // Model responded with text only (no tool calls)
      // This shouldn't happen with tool_choice: auto, but handle it gracefully
      if (choice.message.content) {
        reply = choice.message.content;
      }
      shouldContinue = false;
    }
  }

  // Dead-end detection
  const deadEnd = loopCount >= MAX_TOOL_CALLS && shouldContinue;
  if (deadEnd) {
    console.error(
      `[GuideAgent] Dead-end: turn exceeded ${MAX_TOOL_CALLS} tool calls`,
    );
    if (!reply) {
      reply =
        "I got a bit lost in my thinking. Let me try a different approach — what would you like to focus on?";
    }
  }

  const latencyMs = Date.now() - startTime;
  const costUsd = client.calculateCost({
    prompt_tokens: totalTokensIn,
    completion_tokens: totalTokensOut,
  });

  return {
    conversationId: context.conversationId,
    reply,
    questions,
    trace,
    metrics: {
      turnCount: loopCount,
      toolCallCount: trace.length,
      tokensIn: totalTokensIn,
      tokensOut: totalTokensOut,
      costUsd,
      latencyMs,
      deadEnd,
    },
  };
}

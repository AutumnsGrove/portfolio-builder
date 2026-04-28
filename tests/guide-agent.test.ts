/**
 * Guide Agent Tests
 *
 * Tests the turn pipeline orchestrator: tool-call loop, dead-end
 * detection, error handling, and terminal tool behavior.
 *
 * Mocks OpenRouter responses to test orchestration logic
 * without real API calls.
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { processMessage, type AgentContext } from "@/lib/ai/guide-agent";
import type { OpenRouterResponse } from "@/lib/ai/openrouter";

// --- Helpers ---

function mockContext(overrides?: Partial<AgentContext>): AgentContext {
  return {
    conversationId: "conv-123",
    userId: "user-123",
    siteId: "site-123",
    db: {} as any,
    apiKey: "test-key",
    history: [],
    helpLevel: "guide_me",
    ...overrides,
  };
}

/** Build a mock response where the model calls a single tool. */
function toolCallResponse(
  toolName: string,
  args: Record<string, unknown>,
  usage = { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
): OpenRouterResponse {
  return {
    id: `gen-${Math.random().toString(36).slice(2)}`,
    model: "anthropic/claude-haiku-4-5-20251001",
    choices: [
      {
        message: {
          role: "assistant",
          content: null,
          tool_calls: [
            {
              id: `call-${Math.random().toString(36).slice(2)}`,
              type: "function",
              function: {
                name: toolName,
                arguments: JSON.stringify(args),
              },
            },
          ],
        },
        finish_reason: "tool_calls",
      },
    ],
    usage,
  };
}

/** Build a mock response where the model calls multiple tools. */
function multiToolCallResponse(
  calls: Array<{ name: string; args: Record<string, unknown> }>,
): OpenRouterResponse {
  return {
    id: `gen-${Math.random().toString(36).slice(2)}`,
    model: "anthropic/claude-haiku-4-5-20251001",
    choices: [
      {
        message: {
          role: "assistant",
          content: null,
          tool_calls: calls.map((call) => ({
            id: `call-${Math.random().toString(36).slice(2)}`,
            type: "function" as const,
            function: {
              name: call.name,
              arguments: JSON.stringify(call.args),
            },
          })),
        },
        finish_reason: "tool_calls",
      },
    ],
    usage: { prompt_tokens: 200, completion_tokens: 100, total_tokens: 300 },
  };
}

/** Build a mock response with plain text (no tool calls). */
function textResponse(text: string): OpenRouterResponse {
  return {
    id: `gen-${Math.random().toString(36).slice(2)}`,
    model: "anthropic/claude-haiku-4-5-20251001",
    choices: [
      {
        message: {
          role: "assistant",
          content: text,
        },
        finish_reason: "stop",
      },
    ],
    usage: { prompt_tokens: 100, completion_tokens: 30, total_tokens: 130 },
  };
}

// --- Tests ---

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("Guide Agent - processMessage", () => {
  describe("basic turn flow", () => {
    it("should handle think → reply → done sequence", async () => {
      let callCount = 0;

      globalThis.fetch = vi.fn().mockImplementation(async () => {
        callCount++;
        let response: OpenRouterResponse;

        if (callCount === 1) {
          // First call: model calls think
          response = toolCallResponse("think", {
            thought: "User wants to build a portfolio. I should ask what kind of work they do.",
          });
        } else if (callCount === 2) {
          // Second call: model calls reply + done
          response = multiToolCallResponse([
            { name: "reply", args: { message: "Welcome! What kind of work do you do?" } },
            { name: "done", args: { reason: "Greeted user and asked first question" } },
          ]);
        } else {
          response = toolCallResponse("done", {});
        }

        return { ok: true, json: async () => response };
      });

      const result = await processMessage("Hello!", mockContext());

      expect(result.reply).toBe("Welcome! What kind of work do you do?");
      expect(result.trace.length).toBeGreaterThanOrEqual(2);
      expect(result.metrics.turnCount).toBe(2); // 2 API calls
      expect(result.metrics.deadEnd).toBe(false);
    });

    it("should handle ask_user as terminal tool", async () => {
      globalThis.fetch = vi.fn().mockImplementation(async () => ({
        ok: true,
        json: async () =>
          toolCallResponse("ask_user", {
            questions: [
              {
                question: "What kind of work do you do?",
                options: [
                  { label: "Software" },
                  { label: "Design" },
                  { label: "Writing" },
                ],
              },
            ],
          }),
      }));

      const result = await processMessage("Help me build a portfolio", mockContext());

      expect(result.questions).toBeDefined();
      expect(result.metrics.deadEnd).toBe(false);
    });

    it("should handle text-only response (no tool calls)", async () => {
      globalThis.fetch = vi.fn().mockImplementation(async () => ({
        ok: true,
        json: async () => textResponse("Hi there!"),
      }));

      const result = await processMessage("Hey", mockContext());

      expect(result.reply).toBe("Hi there!");
      expect(result.trace).toHaveLength(0); // No tools called
      expect(result.metrics.turnCount).toBe(1);
    });
  });

  describe("dead-end detection", () => {
    it("should halt after 20 tool calls", async () => {
      // Model keeps calling think forever
      globalThis.fetch = vi.fn().mockImplementation(async () => ({
        ok: true,
        json: async () =>
          toolCallResponse("think", { thought: "Still thinking..." }),
      }));

      const result = await processMessage("Help", mockContext());

      expect(result.metrics.deadEnd).toBe(true);
      expect(result.metrics.turnCount).toBe(20);
      expect(result.reply).toContain("got a bit lost"); // Fallback message
    });
  });

  describe("error handling", () => {
    it("should provide fallback reply on API failure", async () => {
      globalThis.fetch = vi.fn().mockImplementation(async () => ({
        ok: false,
        status: 500,
        json: async () => ({ error: { message: "Internal error" } }),
      }));

      const result = await processMessage("Hello", mockContext());

      expect(result.reply).toContain("trouble thinking");
      expect(result.metrics.turnCount).toBe(1); // 1 attempted call (failed after retries)
    });

    it("should handle invalid JSON in tool arguments", async () => {
      let callCount = 0;

      globalThis.fetch = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          // Return a response with bad JSON arguments
          return {
            ok: true,
            json: async () => ({
              id: "gen-bad",
              model: "test",
              choices: [
                {
                  message: {
                    role: "assistant",
                    content: null,
                    tool_calls: [
                      {
                        id: "call-bad",
                        type: "function",
                        function: {
                          name: "think",
                          arguments: "not valid json {{{",
                        },
                      },
                    ],
                  },
                  finish_reason: "tool_calls",
                },
              ],
              usage: { prompt_tokens: 50, completion_tokens: 20, total_tokens: 70 },
            }),
          };
        }
        // Second call: model recovers and replies
        return {
          ok: true,
          json: async () =>
            toolCallResponse("reply", { message: "Let me try again!" }),
        };
      });

      const result = await processMessage("Hi", mockContext());

      // Should have a trace entry for the bad JSON
      const badEntry = result.trace.find((t) => t.tool === "think");
      expect(badEntry?.result).toEqual({ error: "Invalid JSON in tool arguments" });

      // Should have recovered
      expect(result.reply).toBe("Let me try again!");
    });
  });

  describe("deferred tool loading", () => {
    it("should track loaded categories via use_tools", async () => {
      let callCount = 0;

      globalThis.fetch = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            ok: true,
            json: async () =>
              toolCallResponse("use_tools", { categories: ["blocks"] }),
          };
        }
        return {
          ok: true,
          json: async () =>
            toolCallResponse("reply", { message: "Tools loaded, ready to edit!" }),
        };
      });

      const result = await processMessage("I want to add a block", mockContext());

      // Should have called use_tools successfully
      const useToolsTrace = result.trace.find((t) => t.tool === "use_tools");
      expect(useToolsTrace).toBeDefined();

      expect(result.reply).toBe("Tools loaded, ready to edit!");
    });
  });

  describe("metrics", () => {
    it("should accumulate tokens across multiple API calls", async () => {
      let callCount = 0;

      globalThis.fetch = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            ok: true,
            json: async () =>
              toolCallResponse("think", { thought: "Planning..." }, {
                prompt_tokens: 500,
                completion_tokens: 50,
                total_tokens: 550,
              }),
          };
        }
        return {
          ok: true,
          json: async () =>
            toolCallResponse("reply", { message: "Done!" }, {
              prompt_tokens: 600,
              completion_tokens: 30,
              total_tokens: 630,
            }),
        };
      });

      const result = await processMessage("Help", mockContext());

      expect(result.metrics.tokensIn).toBe(1100); // 500 + 600
      expect(result.metrics.tokensOut).toBe(80); // 50 + 30
      expect(result.metrics.costUsd).toBeGreaterThan(0);
      expect(result.metrics.latencyMs).toBeGreaterThanOrEqual(0);
    });
  });
});

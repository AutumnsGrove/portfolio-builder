/**
 * OpenRouter Client Tests
 *
 * Tests the API client's retry logic, error handling, and cost calculation.
 * Uses mocked fetch — no real API calls.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { OpenRouterClient, OpenRouterError } from "@/lib/ai/openrouter";
import type { OpenRouterResponse } from "@/lib/ai/openrouter";

// Helper: build a mock successful response
function mockResponse(overrides?: Partial<OpenRouterResponse>): OpenRouterResponse {
  return {
    id: "gen-test-123",
    model: "anthropic/claude-haiku-latest",
    choices: [
      {
        message: {
          role: "assistant",
          content: "Hello!",
        },
        finish_reason: "stop",
      },
    ],
    usage: {
      prompt_tokens: 100,
      completion_tokens: 20,
      total_tokens: 120,
    },
    ...overrides,
  };
}

// Helper: build a mock tool-calling response
function mockToolCallResponse(): OpenRouterResponse {
  return {
    id: "gen-test-456",
    model: "anthropic/claude-haiku-latest",
    choices: [
      {
        message: {
          role: "assistant",
          content: null,
          tool_calls: [
            {
              id: "call_abc123",
              type: "function",
              function: {
                name: "think",
                arguments: JSON.stringify({ thought: "Let me plan..." }),
              },
            },
          ],
        },
        finish_reason: "tool_calls",
      },
    ],
    usage: {
      prompt_tokens: 200,
      completion_tokens: 50,
      total_tokens: 250,
    },
  };
}

describe("OpenRouterClient", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
  });

  describe("chatCompletion", () => {
    it("should make a successful request", async () => {
      const expected = mockResponse();

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => expected,
      });

      const client = new OpenRouterClient("test-key");
      const result = await client.chatCompletion([
        { role: "user", content: "Hi" },
      ]);

      expect(result.choices[0].message.content).toBe("Hello!");
      expect(result.usage.total_tokens).toBe(120);
    });

    it("should include tools in request when provided", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockToolCallResponse(),
      });

      const client = new OpenRouterClient("test-key");
      const tools = [
        {
          type: "function" as const,
          function: {
            name: "think",
            description: "Think about something",
            parameters: {
              type: "object" as const,
              properties: {
                thought: { type: "string" },
              },
              required: ["thought"],
            },
          },
        },
      ];

      const result = await client.chatCompletion(
        [{ role: "user", content: "Hi" }],
        tools,
      );

      // Verify tools were sent in request body
      const fetchCall = vi.mocked(globalThis.fetch).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1]?.body as string);
      expect(requestBody.tools).toHaveLength(1);
      expect(requestBody.tool_choice).toBe("auto");

      // Verify tool call response
      expect(result.choices[0].message.tool_calls).toHaveLength(1);
      expect(result.choices[0].message.tool_calls![0].function.name).toBe("think");
    });

    it("should not include tools fields when no tools provided", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse(),
      });

      const client = new OpenRouterClient("test-key");
      await client.chatCompletion([{ role: "user", content: "Hi" }]);

      const fetchCall = vi.mocked(globalThis.fetch).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1]?.body as string);
      expect(requestBody.tools).toBeUndefined();
      expect(requestBody.tool_choice).toBeUndefined();
    });

    it("should send correct headers", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse(),
      });

      const client = new OpenRouterClient("my-api-key");
      await client.chatCompletion([{ role: "user", content: "Hi" }]);

      const fetchCall = vi.mocked(globalThis.fetch).mock.calls[0];
      const headers = fetchCall[1]?.headers as Record<string, string>;
      expect(headers["Authorization"]).toBe("Bearer my-api-key");
      expect(headers["Content-Type"]).toBe("application/json");
      expect(headers["HTTP-Referer"]).toBe("https://portfoliobuilder.com");
      expect(headers["X-Title"]).toBe("Portfolio Builder");
    });
  });

  describe("retry logic", () => {
    it("should retry on 429 (rate limit)", async () => {
      let callCount = 0;

      globalThis.fetch = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount < 2) {
          return {
            ok: false,
            status: 429,
            json: async () => ({ error: { message: "Rate limited" } }),
          };
        }
        return {
          ok: true,
          json: async () => mockResponse(),
        };
      });

      const client = new OpenRouterClient("test-key");
      const result = await client.chatCompletion([
        { role: "user", content: "Hi" },
      ]);

      expect(callCount).toBe(2);
      expect(result.choices[0].message.content).toBe("Hello!");
    });

    it("should retry on 500 (server error)", async () => {
      let callCount = 0;

      globalThis.fetch = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount < 2) {
          return {
            ok: false,
            status: 500,
            json: async () => ({ error: { message: "Internal error" } }),
          };
        }
        return {
          ok: true,
          json: async () => mockResponse(),
        };
      });

      const client = new OpenRouterClient("test-key");
      const result = await client.chatCompletion([
        { role: "user", content: "Hi" },
      ]);

      expect(callCount).toBe(2);
      expect(result.choices[0].message.content).toBe("Hello!");
    });

    it("should give up after 3 attempts", async () => {
      globalThis.fetch = vi.fn().mockImplementation(async () => ({
        ok: false,
        status: 429,
        json: async () => ({ error: { message: "Rate limited" } }),
      }));

      const client = new OpenRouterClient("test-key");

      await expect(
        client.chatCompletion([{ role: "user", content: "Hi" }]),
      ).rejects.toThrow(OpenRouterError);

      expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledTimes(3);
    });

    it("should not retry on 400 (client error)", async () => {
      globalThis.fetch = vi.fn().mockImplementation(async () => ({
        ok: false,
        status: 400,
        json: async () => ({ error: { message: "Bad request" } }),
      }));

      const client = new OpenRouterClient("test-key");

      await expect(
        client.chatCompletion([{ role: "user", content: "Hi" }]),
      ).rejects.toThrow("Bad request");

      // Should NOT retry — only 1 call
      expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledTimes(1);
    });

    it("should not retry on 401 (unauthorized)", async () => {
      globalThis.fetch = vi.fn().mockImplementation(async () => ({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: "Invalid API key" } }),
      }));

      const client = new OpenRouterClient("bad-key");

      await expect(
        client.chatCompletion([{ role: "user", content: "Hi" }]),
      ).rejects.toThrow("Invalid API key");

      expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledTimes(1);
    });
  });

  describe("error handling", () => {
    it("should throw OpenRouterError with status code", async () => {
      globalThis.fetch = vi.fn().mockImplementation(async () => ({
        ok: false,
        status: 402,
        json: async () => ({ error: { message: "Quota exceeded" } }),
      }));

      const client = new OpenRouterClient("test-key");

      try {
        await client.chatCompletion([{ role: "user", content: "Hi" }]);
        expect.unreachable("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(OpenRouterError);
        expect((error as OpenRouterError).statusCode).toBe(402);
        expect((error as OpenRouterError).message).toBe("Quota exceeded");
      }
    });

    it("should handle timeout (AbortError)", async () => {
      // Simulate fetch throwing AbortError directly (as if signal fired)
      const abortError = new Error("The operation was aborted");
      abortError.name = "AbortError";
      globalThis.fetch = vi.fn().mockRejectedValue(abortError);

      const client = new OpenRouterClient("test-key");

      await expect(
        client.chatCompletion([{ role: "user", content: "Hi" }]),
      ).rejects.toThrow("Request timeout");
    });

    it("should handle network errors", async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      const client = new OpenRouterClient("test-key");

      await expect(
        client.chatCompletion([{ role: "user", content: "Hi" }]),
      ).rejects.toThrow("Network error");
    });

    it("should handle malformed error response body", async () => {
      globalThis.fetch = vi.fn().mockImplementation(async () => ({
        ok: false,
        status: 503,
        json: async () => {
          throw new Error("Not JSON");
        },
      }));

      const client = new OpenRouterClient("test-key");

      // Should still retry on 503, then fail with fallback message
      await expect(
        client.chatCompletion([{ role: "user", content: "Hi" }]),
      ).rejects.toThrow(OpenRouterError);
    });
  });

  describe("calculateCost", () => {
    it("should calculate cost for Haiku 4.5 pricing", () => {
      const client = new OpenRouterClient("test-key");
      const cost = client.calculateCost({
        prompt_tokens: 1000,
        completion_tokens: 200,
      });

      // 1000 * $0.000001 + 200 * $0.000005 = $0.001 + $0.001 = $0.002
      expect(cost).toBeCloseTo(0.002, 6);
    });

    it("should handle zero tokens", () => {
      const client = new OpenRouterClient("test-key");
      const cost = client.calculateCost({
        prompt_tokens: 0,
        completion_tokens: 0,
      });

      expect(cost).toBe(0);
    });

    it("should handle typical turn costs", () => {
      const client = new OpenRouterClient("test-key");
      // Typical turn: 6K input, 300 output
      const cost = client.calculateCost({
        prompt_tokens: 6000,
        completion_tokens: 300,
      });

      // 6000 * 0.000001 + 300 * 0.000005 = 0.006 + 0.0015 = 0.0075
      expect(cost).toBeCloseTo(0.0075, 6);
    });
  });

  describe("custom options", () => {
    it("should allow custom model", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse(),
      });

      const client = new OpenRouterClient("test-key", {
        model: "anthropic/claude-sonnet-4-20250514",
      });
      await client.chatCompletion([{ role: "user", content: "Hi" }]);

      const fetchCall = vi.mocked(globalThis.fetch).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1]?.body as string);
      expect(requestBody.model).toBe("anthropic/claude-sonnet-4-20250514");
    });

    it("should allow custom temperature", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse(),
      });

      const client = new OpenRouterClient("test-key");
      await client.chatCompletion(
        [{ role: "user", content: "Hi" }],
        undefined,
        { temperature: 0.2 },
      );

      const fetchCall = vi.mocked(globalThis.fetch).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1]?.body as string);
      expect(requestBody.temperature).toBe(0.2);
    });
  });
});

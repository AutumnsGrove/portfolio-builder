/**
 * OpenRouter API Client
 *
 * Lightweight wrapper for OpenRouter's OpenAI-compatible chat completions API.
 * Handles authentication, retries, timeouts, and cost calculation.
 *
 * Uses native fetch() — no SDK needed for Cloudflare Workers.
 *
 * v1: Single model (Claude Haiku), non-streaming, batched responses.
 * v2: Multi-provider, streaming, Cloudflare AI Gateway.
 */

// --- Types ---

export interface OpenRouterMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string; // JSON string — must be parsed by caller
  };
}

export interface OpenRouterToolSchema {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, unknown>;
      required: string[];
    };
  };
}

interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  tools?: OpenRouterToolSchema[];
  tool_choice?: "auto" | "none";
  temperature?: number;
  max_tokens?: number;
}

export interface OpenRouterResponse {
  id: string;
  model: string;
  choices: [
    {
      message: {
        role: "assistant";
        content: string | null;
        tool_calls?: ToolCall[];
      };
      finish_reason: "stop" | "tool_calls" | "length";
    },
  ];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ChatCompletionOptions {
  temperature?: number;
  maxTokens?: number;
}

// --- Error class ---

export class OpenRouterError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "OpenRouterError";
  }
}

// --- Client ---

/** Default model for v1. $1/MTok in, $5/MTok out. Good at tool calling. */
const DEFAULT_MODEL = "anthropic/claude-haiku-4-5-20251001";

/** Max retries for transient errors (429, 5xx). */
const MAX_RETRIES = 3;

/** Timeout per API call in ms. */
const REQUEST_TIMEOUT_MS = 30_000;

export class OpenRouterClient {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(
    apiKey: string,
    options?: { model?: string; baseUrl?: string },
  ) {
    this.apiKey = apiKey;
    this.model = options?.model ?? DEFAULT_MODEL;
    this.baseUrl = options?.baseUrl ?? "https://openrouter.ai/api/v1";
  }

  /**
   * Send a chat completion request with optional tool definitions.
   *
   * When tools are provided, tool_choice defaults to "auto" — the model
   * decides whether to call a tool or respond with text.
   */
  async chatCompletion(
    messages: OpenRouterMessage[],
    tools?: OpenRouterToolSchema[],
    options?: ChatCompletionOptions,
  ): Promise<OpenRouterResponse> {
    const request: OpenRouterRequest = {
      model: this.model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens,
    };

    // Only include tools fields if we actually have tools
    if (tools && tools.length > 0) {
      request.tools = tools;
      request.tool_choice = "auto";
    }

    return this.makeRequest("/chat/completions", request);
  }

  /**
   * Calculate cost from token usage.
   *
   * Default pricing: Haiku 4.5 ($1/MTok input, $5/MTok output).
   * This is a rough estimate — actual cost depends on the model
   * selected in OpenRouter. v2 will read pricing from the API.
   */
  calculateCost(usage: {
    prompt_tokens: number;
    completion_tokens: number;
  }): number {
    const promptCost = usage.prompt_tokens * 0.000001;
    const completionCost = usage.completion_tokens * 0.000005;
    return promptCost + completionCost;
  }

  // --- Internal ---

  private async makeRequest(
    endpoint: string,
    body: OpenRouterRequest,
    attempt = 1,
  ): Promise<OpenRouterResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://portfoliobuilder.com",
          "X-Title": "Portfolio Builder",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.ok) {
        return (await response.json()) as OpenRouterResponse;
      }

      // Parse error body
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = (await response.json()) as {
          error?: { message?: string };
        };
        errorMessage = errorData.error?.message ?? errorMessage;
      } catch {
        // Ignore JSON parse failures on error responses
      }

      // Retry on transient errors: 429 (rate limit) or 5xx (server errors)
      if (
        (response.status === 429 || response.status >= 500) &&
        attempt < MAX_RETRIES
      ) {
        const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
        console.warn(
          `[OpenRouter] ${response.status} on attempt ${attempt}, retrying in ${delay}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.makeRequest(endpoint, body, attempt + 1);
      }

      throw new OpenRouterError(response.status, errorMessage);
    } catch (error: any) {
      clearTimeout(timeout);

      // Re-throw our own errors
      if (error instanceof OpenRouterError) {
        throw error;
      }

      // Handle fetch abort (timeout)
      if (error.name === "AbortError") {
        throw new OpenRouterError(
          408,
          `Request timeout after ${REQUEST_TIMEOUT_MS / 1000}s`,
        );
      }

      // Handle network errors
      throw new OpenRouterError(0, `Network error: ${error.message}`);
    }
  }
}

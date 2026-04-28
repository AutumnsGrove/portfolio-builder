/**
 * POST /api/chat — Guide Agent conversation endpoint.
 *
 * Receives a user message, runs it through the Guide Agent orchestrator,
 * persists conversation state in D1, tracks metrics, and returns the
 * agent's response (reply text or structured questions).
 *
 * Auth is mocked for v1 — WorkOS integration is a separate task.
 */

import type { APIRoute } from "astro";
import { z } from "zod";
import { processMessage } from "@/lib/ai/guide-agent";
import {
  trackEvent,
  trackAgentMetrics,
  hasTriggeredEvent,
} from "@/lib/analytics/track";

// --- Request validation ---

const ChatRequestSchema = z.object({
  message: z.string().min(1).max(5000),
  conversationId: z.string().optional(),
  siteId: z.string(),
});

// --- Helpers ---

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function jsonError(status: number, message: string, details?: unknown): Response {
  return jsonResponse({ error: message, details }, status);
}

// --- Handler ---

export const POST: APIRoute = async ({ request, locals }) => {
  // 1. Parse and validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "Invalid JSON in request body");
  }

  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "Invalid request", parsed.error.issues);
  }

  const { message, conversationId, siteId } = parsed.data;

  // 2. Get environment bindings
  const env = locals.runtime.env as Env;
  const db = env.DB;
  const apiKey = env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.error("[Chat API] OPENROUTER_API_KEY not configured");
    return jsonError(500, "AI service not configured");
  }

  // 3. Auth (mock for v1 — WorkOS integration is separate)
  const userId = "mock-user-id"; // TODO: Extract from session cookie

  try {
    // 4. Load or create conversation
    let conversation: {
      id: string;
      messages_json: string;
      help_level: string;
    };

    if (conversationId) {
      const existing = await db
        .prepare(
          "SELECT id, messages_json, help_level FROM ai_conversations WHERE id = ? AND site_id = ?",
        )
        .bind(conversationId, siteId)
        .first<{ id: string; messages_json: string; help_level: string }>();

      if (!existing) {
        return jsonError(404, "Conversation not found");
      }
      conversation = existing;
    } else {
      // Create new conversation
      const newId = crypto.randomUUID();
      await db
        .prepare(
          `INSERT INTO ai_conversations (id, site_id, messages_json, help_level, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .bind(newId, siteId, "[]", "guide_me", Date.now(), Date.now())
        .run();

      conversation = {
        id: newId,
        messages_json: "[]",
        help_level: "guide_me",
      };

      // Track "started_build" event (first conversation = started building)
      const hasStarted = await hasTriggeredEvent(db, "started_build", userId);
      if (!hasStarted) {
        await trackEvent(db, "started_build", { userId, siteId });
      }
    }

    const history = JSON.parse(conversation.messages_json);

    // 5. Run Guide Agent
    const response = await processMessage(message, {
      conversationId: conversation.id,
      userId,
      siteId,
      db,
      apiKey,
      history,
      helpLevel: conversation.help_level as "guide_me" | "do_it_for_me",
    });

    // 6. Save updated conversation history
    const updatedHistory = [
      ...history,
      { role: "user", content: message },
      ...(response.reply
        ? [{ role: "assistant", content: response.reply }]
        : []),
    ];

    await db
      .prepare(
        "UPDATE ai_conversations SET messages_json = ?, updated_at = ? WHERE id = ?",
      )
      .bind(
        JSON.stringify(updatedHistory),
        Date.now(),
        conversation.id,
      )
      .run();

    // 7. Track agent metrics (fire-and-forget, don't block response)
    const failedToolCalls = response.trace.filter(
      (t) => t.result && typeof t.result === "object" && "error" in (t.result as object),
    ).length;

    trackAgentMetrics(db, {
      conversationId: conversation.id,
      turnCount: response.metrics.turnCount,
      toolCallCount: response.metrics.toolCallCount,
      toolFailures: failedToolCalls,
      replyLatencyMs: response.metrics.latencyMs,
      tokensIn: response.metrics.tokensIn,
      tokensOut: response.metrics.tokensOut,
      costUsd: response.metrics.costUsd.toFixed(6),
    }).catch((err) => {
      console.error("[Chat API] Failed to track metrics:", err);
    });

    // 8. Return response
    return jsonResponse({
      conversationId: conversation.id,
      reply: response.reply,
      questions: response.questions,
      trace: response.trace,
    });
  } catch (error: any) {
    console.error("[Chat API] Unhandled error:", error);
    return jsonError(500, "Something went wrong. Please try again.");
  }
};

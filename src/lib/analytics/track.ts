/**
 * Analytics event tracking for v1 validation.
 *
 * Tracks funnel events (signup → build → publish) and AI agent metrics
 * to measure v1 acceptance criteria. Events are written to D1 for querying.
 *
 * Works in both local dev and production.
 */

import type { D1Database } from "@cloudflare/workers-types";

/**
 * Funnel events for measuring user behavior (acceptance criterion #1)
 */
export type FunnelEvent =
  | "signup" // User created account
  | "started_build" // First chat message sent
  | "first_block_added" // Any block added to any zone
  | "first_publish" // Site published to subdomain
  | "returned_after_publish" // User came back after publishing
  | "session_abandoned"; // User left mid-build (detect via inactivity)

/**
 * Metadata for funnel events (optional, event-specific)
 */
export interface FunnelEventMetadata {
  blockType?: string; // For first_block_added
  siteSlug?: string; // For first_publish
  daysSincePublish?: number; // For returned_after_publish
  lastActivity?: string; // For session_abandoned
  [key: string]: any; // Extensible
}

/**
 * Track a funnel event (user behavior)
 *
 * @example
 * ```typescript
 * await trackEvent(env.DB, 'first_block_added', {
 *   userId: session.userId,
 *   siteId: site.id,
 *   metadata: { blockType: 'hero' }
 * });
 * ```
 */
export async function trackEvent(
  db: D1Database,
  event: FunnelEvent,
  data: {
    userId?: string;
    siteId?: string;
    metadata?: FunnelEventMetadata;
  },
): Promise<void> {
  try {
    await db
      .prepare(
        `INSERT INTO analytics_events (id, user_id, site_id, event, metadata, timestamp)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        crypto.randomUUID(),
        data.userId ?? null,
        data.siteId ?? null,
        event,
        data.metadata ? JSON.stringify(data.metadata) : null,
        Date.now(), // SQLite integer timestamp
      )
      .run();
  } catch (error) {
    // Don't crash the app if analytics fails
    console.error(`[Analytics] Failed to track event "${event}":`, error);
  }
}

/**
 * Track AI agent performance metrics (acceptance criterion #3 & #6)
 *
 * Call this after each AI turn completes.
 *
 * @example
 * ```typescript
 * await trackAgentMetrics(env.DB, {
 *   conversationId: conversation.id,
 *   turnCount: 5,
 *   toolCallCount: 3,
 *   toolFailures: 0,
 *   replyLatencyMs: 1250,
 *   tokensIn: 1500,
 *   tokensOut: 300,
 *   costUsd: '0.00042'
 * });
 * ```
 */
export async function trackAgentMetrics(
  db: D1Database,
  metrics: {
    conversationId: string;
    turnCount: number;
    toolCallCount: number;
    toolFailures?: number;
    replyLatencyMs?: number;
    tokensIn?: number;
    tokensOut?: number;
    costUsd?: string; // Decimal as string to avoid float precision issues
  },
): Promise<void> {
  try {
    await db
      .prepare(
        `INSERT INTO agent_metrics (
          id, conversation_id, turn_count, tool_call_count, tool_failures,
          reply_latency_ms, tokens_in, tokens_out, cost_usd, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        crypto.randomUUID(),
        metrics.conversationId,
        metrics.turnCount,
        metrics.toolCallCount,
        metrics.toolFailures ?? 0,
        metrics.replyLatencyMs ?? null,
        metrics.tokensIn ?? null,
        metrics.tokensOut ?? null,
        metrics.costUsd ?? null,
        Date.now(),
      )
      .run();
  } catch (error) {
    console.error("[Analytics] Failed to track agent metrics:", error);
  }
}

/**
 * Helper: Check if user has already triggered a one-time event
 *
 * Use this to prevent duplicate tracking of "first_X" events.
 *
 * @example
 * ```typescript
 * const hasPublished = await hasTriggeredEvent(env.DB, 'first_publish', userId);
 * if (!hasPublished) {
 *   await trackEvent(env.DB, 'first_publish', { userId, siteId });
 * }
 * ```
 */
export async function hasTriggeredEvent(
  db: D1Database,
  event: FunnelEvent,
  userId: string,
): Promise<boolean> {
  try {
    const result = await db
      .prepare(
        `SELECT COUNT(*) as count FROM analytics_events
         WHERE event = ? AND user_id = ?`,
      )
      .bind(event, userId)
      .first<{ count: number }>();

    return (result?.count ?? 0) > 0;
  } catch (error) {
    console.error(
      `[Analytics] Failed to check event "${event}" for user:`,
      error,
    );
    return false; // Assume not triggered if check fails
  }
}

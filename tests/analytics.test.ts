/**
 * Tests for analytics tracking functions.
 *
 * NOTE: These tests use a mock D1 database since we can't easily
 * access the real local D1 instance from Vitest. In actual usage,
 * the tracking functions work with the real D1 database.
 */

import { describe, it, expect, vi } from "vitest";
import { trackEvent, trackAgentMetrics, hasTriggeredEvent } from "../src/lib/analytics";

// Mock D1Database
function createMockDb() {
  const statements: any[] = [];

  return {
    prepare: (sql: string) => {
      const stmt = {
        sql,
        params: [] as any[],
        bind: (...params: any[]) => {
          stmt.params = params;
          return stmt;
        },
        run: async () => {
          statements.push({ sql: stmt.sql, params: stmt.params });
          return { success: true };
        },
        first: async () => {
          // Mock response for hasTriggeredEvent
          if (sql.includes("COUNT(*)")) {
            return { count: 0 };
          }
          return null;
        },
      };
      return stmt;
    },
    getStatements: () => statements,
  } as any;
}

describe("Analytics tracking", () => {
  it("should track funnel events", async () => {
    const db = createMockDb();

    await trackEvent(db, "signup", {
      userId: "user-123",
    });

    const statements = db.getStatements();
    expect(statements).toHaveLength(1);
    expect(statements[0].sql).toContain("INSERT INTO analytics_events");
    expect(statements[0].params[1]).toBe("user-123"); // userId
    expect(statements[0].params[3]).toBe("signup"); // event
  });

  it("should track funnel events with metadata", async () => {
    const db = createMockDb();

    await trackEvent(db, "first_block_added", {
      userId: "user-123",
      siteId: "site-456",
      metadata: { blockType: "hero" },
    });

    const statements = db.getStatements();
    expect(statements[0].params[1]).toBe("user-123");
    expect(statements[0].params[2]).toBe("site-456");
    expect(statements[0].params[4]).toBe(JSON.stringify({ blockType: "hero" }));
  });

  it("should track agent metrics", async () => {
    const db = createMockDb();

    await trackAgentMetrics(db, {
      conversationId: "conv-123",
      turnCount: 5,
      toolCallCount: 3,
      toolFailures: 0,
      replyLatencyMs: 1250,
      tokensIn: 1500,
      tokensOut: 300,
      costUsd: "0.00042",
    });

    const statements = db.getStatements();
    expect(statements).toHaveLength(1);
    expect(statements[0].sql).toContain("INSERT INTO agent_metrics");
    expect(statements[0].params[1]).toBe("conv-123");
    expect(statements[0].params[2]).toBe(5); // turnCount
    expect(statements[0].params[8]).toBe("0.00042"); // costUsd
  });

  it("should check if event was triggered", async () => {
    const db = createMockDb();

    const hasPublished = await hasTriggeredEvent(db, "first_publish", "user-123");

    // Should return false since mock returns count: 0
    expect(hasPublished).toBe(false);
  });

  it("should not crash if tracking fails", async () => {
    const db = {
      prepare: () => {
        throw new Error("Database error");
      },
    } as any;

    // Should not throw
    await expect(trackEvent(db, "signup", { userId: "user-123" })).resolves.not.toThrow();
  });
});

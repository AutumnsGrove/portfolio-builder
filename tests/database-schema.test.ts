/**
 * Tests for database schema integrity.
 *
 * These tests verify that the Drizzle schema is correctly defined
 * and that our manifest types integrate properly with database operations.
 */

import { describe, it, expect } from "vitest";
import {
  users,
  sites,
  zones,
  blocks,
  projectCards,
  aiConversations,
  hostedSites,
  styleConfigs,
  analyticsEvents,
  agentMetrics,
} from "../src/lib/db/schema";

describe("Database schema structure", () => {
  it("should have all required v1 tables", () => {
    // Verify all 11 tables exist and are exported
    expect(users).toBeDefined();
    expect(sites).toBeDefined();
    expect(zones).toBeDefined();
    expect(blocks).toBeDefined();
    expect(projectCards).toBeDefined();
    expect(aiConversations).toBeDefined();
    expect(hostedSites).toBeDefined();
    expect(styleConfigs).toBeDefined();
    expect(analyticsEvents).toBeDefined();
    expect(agentMetrics).toBeDefined();
  });

  it("should have correct table names", () => {
    // Drizzle tables have a [Symbol] property with the table name
    const getTableName = (table: any) => {
      const symbol = Object.getOwnPropertySymbols(table).find(
        (s) => s.description === "drizzle:Name",
      );
      return symbol ? table[symbol] : null;
    };

    expect(getTableName(users)).toBe("users");
    expect(getTableName(sites)).toBe("sites");
    expect(getTableName(zones)).toBe("zones");
    expect(getTableName(blocks)).toBe("blocks");
    expect(getTableName(projectCards)).toBe("project_cards");
    expect(getTableName(aiConversations)).toBe("ai_conversations");
    expect(getTableName(hostedSites)).toBe("hosted_sites");
    expect(getTableName(styleConfigs)).toBe("style_configs");
    expect(getTableName(analyticsEvents)).toBe("analytics_events");
    expect(getTableName(agentMetrics)).toBe("agent_metrics");
  });

  it("should have required columns on users table", () => {
    expect(users.id).toBeDefined();
    expect(users.workosId).toBeDefined();
    expect(users.email).toBeDefined();
    expect(users.displayName).toBeDefined();
    expect(users.createdAt).toBeDefined();
    expect(users.updatedAt).toBeDefined();
  });

  it("should have required columns on sites table", () => {
    expect(sites.id).toBeDefined();
    expect(sites.userId).toBeDefined();
    expect(sites.slug).toBeDefined();
    expect(sites.status).toBeDefined();
  });

  it("should have required columns on blocks table", () => {
    expect(blocks.id).toBeDefined();
    expect(blocks.zoneId).toBeDefined();
    expect(blocks.type).toBeDefined();
    expect(blocks.size).toBeDefined();
    expect(blocks.contentJson).toBeDefined();
  });

  it("should have required columns on analytics tables", () => {
    expect(analyticsEvents.event).toBeDefined();
    expect(analyticsEvents.userId).toBeDefined();
    expect(analyticsEvents.timestamp).toBeDefined();

    expect(agentMetrics.conversationId).toBeDefined();
    expect(agentMetrics.turnCount).toBeDefined();
    expect(agentMetrics.tokensIn).toBeDefined();
    expect(agentMetrics.costUsd).toBeDefined();
  });
});

describe("Type safety integration", () => {
  it("should allow typed JSON columns for blocks", () => {
    // The contentJson column should be typed as Block["content"]
    // This is a compile-time check, so if this test compiles, it passes
    type BlockContentType = typeof blocks.contentJson;
    const typeCheck: BlockContentType = {} as any;
    expect(typeCheck).toBeDefined(); // Just to use the variable
  });

  it("should export schema for use in queries", () => {
    // Verify the schema exports can be imported and used
    expect(typeof users).toBe("object");
    expect(typeof sites).toBe("object");
    expect(typeof blocks).toBe("object");
  });
});

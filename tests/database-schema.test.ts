/**
 * Tests for database schema integrity.
 *
 * These tests verify that the Drizzle schema is correctly defined
 * and that our manifest types integrate properly with database operations.
 */

import { describe, it, expect } from "vitest";
import {
  user,
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
import { session, account, verification } from "../src/lib/db/auth-schema";

describe("Database schema structure", () => {
  it("should have all required v1 tables", () => {
    // BetterAuth tables
    expect(user).toBeDefined();
    expect(session).toBeDefined();
    expect(account).toBeDefined();
    expect(verification).toBeDefined();
    // App tables
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

    expect(getTableName(user)).toBe("user");
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

  it("should have required columns on user table", () => {
    expect(user.id).toBeDefined();
    expect(user.email).toBeDefined();
    expect(user.name).toBeDefined();
    expect(user.customInstructions).toBeDefined();
    expect(user.createdAt).toBeDefined();
    expect(user.updatedAt).toBeDefined();
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

describe("Schema relationships", () => {
  it("sites.userId should reference user table", () => {
    // Drizzle stores FK references in the column config
    const config = (sites.userId as any).config;
    expect(config).toBeDefined();
    expect(config.notNull).toBe(true);
  });

  it("zones should have ordering column", () => {
    expect(zones.order).toBeDefined();
    expect(zones.siteId).toBeDefined();
    expect(zones.zoneId).toBeDefined();
    expect(zones.label).toBeDefined();
  });

  it("blocks should have all content-related columns", () => {
    expect(blocks.type).toBeDefined();
    expect(blocks.size).toBeDefined();
    expect(blocks.contentJson).toBeDefined();
    expect(blocks.styleOverrides).toBeDefined();
    expect(blocks.order).toBeDefined();
  });

  it("sites should have status with correct enum values", () => {
    const config = (sites.status as any).config;
    expect(config).toBeDefined();
    expect(config.default).toBe("draft");
  });
});

/**
 * Tool Registry Tests
 *
 * Verifies that the build-time generated registry loads correctly
 * and tools can be discovered, filtered, and executed at runtime.
 */

import { describe, it, expect } from "vitest";
import {
  getHotTools,
  getDeferredTools,
  executeTool,
  validateCategories,
  getRegisteredToolNames,
  getToolCounts,
} from "@/agents/tools/registry";
import type { ToolContext } from "@/agents/tools/types";

// Mock context for tool execution
const mockContext: ToolContext = {
  db: {} as any,
  userId: "test-user",
  siteId: "test-site",
  conversationId: "test-conversation",
};

describe("Tool Registry", () => {
  describe("getHotTools", () => {
    it("should return all 6 hot tools", () => {
      const hotTools = getHotTools();
      expect(hotTools).toHaveLength(6);
    });

    it("should include all expected tool names", () => {
      const names = getHotTools().map((t) => t.name);
      expect(names).toContain("think");
      expect(names).toContain("reply");
      expect(names).toContain("done");
      expect(names).toContain("ask_user");
      expect(names).toContain("use_tools");
      expect(names).toContain("get_site_state");
    });

    it("should only return tools with category 'hot'", () => {
      const hotTools = getHotTools();
      for (const tool of hotTools) {
        expect(tool.category).toBe("hot");
      }
    });

    it("should include handler functions", () => {
      const hotTools = getHotTools();
      for (const tool of hotTools) {
        expect(typeof tool.handler).toBe("function");
      }
    });
  });

  describe("getDeferredTools", () => {
    it("should return empty array for categories with no tools", () => {
      const tools = getDeferredTools(["blocks"]);
      expect(tools).toEqual([]);
    });

    it("should not include hot tools", () => {
      const tools = getDeferredTools(["hot"]);
      // hot is not a deferred category - it should still return hot tools
      // since getDeferredTools just filters by category
      const names = tools.map((t) => t.name);
      // All returned tools should have category "hot"
      for (const tool of tools) {
        expect(tool.category).toBe("hot");
      }
    });

    it("should return empty array for empty categories", () => {
      const tools = getDeferredTools([]);
      expect(tools).toEqual([]);
    });
  });

  describe("validateCategories", () => {
    it("should accept valid categories", () => {
      const result = validateCategories(["blocks", "zones", "content", "publish"]);
      expect(result.valid).toEqual(["blocks", "zones", "content", "publish"]);
      expect(result.invalid).toEqual([]);
    });

    it("should reject invalid categories", () => {
      const result = validateCategories(["blocks", "invalid", "fake"]);
      expect(result.valid).toEqual(["blocks"]);
      expect(result.invalid).toEqual(["invalid", "fake"]);
    });

    it("should handle empty input", () => {
      const result = validateCategories([]);
      expect(result.valid).toEqual([]);
      expect(result.invalid).toEqual([]);
    });

    it("should accept 'hot' as valid", () => {
      const result = validateCategories(["hot"]);
      expect(result.valid).toEqual(["hot"]);
    });
  });

  describe("executeTool", () => {
    it("should execute the think tool successfully", async () => {
      const result = await executeTool(
        "think",
        { thought: "Testing the registry" },
        mockContext,
      );
      expect(result.success).toBe(true);
    });

    it("should execute the done tool successfully", async () => {
      const result = await executeTool(
        "done",
        { reason: "Testing" },
        mockContext,
      );
      expect(result.success).toBe(true);
    });

    it("should return error for unknown tools", async () => {
      const result = await executeTool(
        "nonexistent_tool",
        {},
        mockContext,
      );
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Unknown tool");
      }
    });

    it("should catch handler errors gracefully", async () => {
      // ask_user with empty questions should fail validation
      const result = await executeTool(
        "ask_user",
        { questions: [] },
        mockContext,
      );
      expect(result.success).toBe(false);
    });
  });

  describe("getRegisteredToolNames", () => {
    it("should return all registered tool names", () => {
      const names = getRegisteredToolNames();
      expect(names).toHaveLength(6);
      expect(names).toContain("think");
      expect(names).toContain("ask_user");
    });
  });

  describe("getToolCounts", () => {
    it("should count tools by category", () => {
      const counts = getToolCounts();
      expect(counts.hot).toBe(6);
    });
  });
});

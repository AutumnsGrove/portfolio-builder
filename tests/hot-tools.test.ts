/**
 * Tests for hot tools — the 6 always-available AI tools.
 */

import { describe, it, expect } from "vitest";
import {
  thinkHandler,
  replyHandler,
  doneHandler,
  askUserHandler,
  useToolsHandler,
  getSiteStateHandler,
} from "../src/agents/tools";
import type { ToolContext } from "../src/agents/tools";

// Minimal D1 mock that returns empty results for query chains
function createMockDb() {
  const stmt = {
    bind: (..._args: unknown[]) => stmt,
    first: async () => null,
    all: async () => ({ results: [] }),
    run: async () => ({ success: true }),
  };
  return { prepare: (_sql: string) => stmt, batch: async (stmts: unknown[]) => stmts } as any;
}

// Mock context for testing
const mockContext: ToolContext = {
  db: createMockDb(),
  userId: "user-123",
  siteId: "site-456",
  conversationId: "conv-789",
};

describe("think tool", () => {
  it("should accept thought and return success", async () => {
    const result = await thinkHandler(
      { thought: "I need to figure out what block to add next" },
      mockContext,
    );

    expect(result.success).toBe(true);
  });
});

describe("reply tool", () => {
  it("should accept message and return success", async () => {
    const result = await replyHandler(
      { message: "Hello! I'm here to help you build your portfolio." },
      mockContext,
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.message).toBe(
        "Hello! I'm here to help you build your portfolio.",
      );
    }
  });

  it("should support markdown formatting", async () => {
    const result = await replyHandler(
      { message: "## Heading\n\n**Bold text**" },
      mockContext,
    );

    expect(result.success).toBe(true);
  });
});

describe("done tool", () => {
  it("should accept optional reason and return success", async () => {
    const result = await doneHandler(
      { reason: "User answered all questions" },
      mockContext,
    );

    expect(result.success).toBe(true);
  });

  it("should work without reason", async () => {
    const result = await doneHandler({}, mockContext);

    expect(result.success).toBe(true);
  });
});

describe("ask_user tool", () => {
  it("should accept structured questions", async () => {
    const result = await askUserHandler(
      {
        questions: [
          {
            question: "What kind of work do you want to showcase?",
            options: [
              { label: "Software / code", description: "Apps, tools, libraries" },
              { label: "Visual design", description: "UI/UX, graphics" },
            ],
          },
        ],
      },
      mockContext,
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.questions).toHaveLength(1);
      expect(result.data.questionId).toBeDefined();
    }
  });

  it("should reject empty questions array", async () => {
    const result = await askUserHandler({ questions: [] }, mockContext);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("1-4 questions");
    }
  });

  it("should reject questions with too few options", async () => {
    const result = await askUserHandler(
      {
        questions: [
          {
            question: "Test question?",
            options: [{ label: "Only one option" }],
          },
        ],
      },
      mockContext,
    );

    expect(result.success).toBe(false);
  });

  it("should support multi-select questions", async () => {
    const result = await askUserHandler(
      {
        questions: [
          {
            question: "Which technologies do you use?",
            options: [
              { label: "JavaScript" },
              { label: "Python" },
              { label: "Go" },
            ],
            multi_select: true,
          },
        ],
      },
      mockContext,
    );

    expect(result.success).toBe(true);
  });
});

describe("use_tools tool", () => {
  it("should load valid tool categories", async () => {
    const result = await useToolsHandler(
      { categories: ["blocks", "zones"] },
      mockContext,
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.loaded).toEqual(["blocks", "zones"]);
      expect(result.data.tool_count).toBeGreaterThan(0);
    }
  });

  it("should reject invalid categories", async () => {
    const result = await useToolsHandler(
      { categories: ["invalid_category"] },
      mockContext,
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Invalid tool categories");
    }
  });

  it("should accept all valid categories", async () => {
    const result = await useToolsHandler(
      { categories: ["blocks", "zones", "content", "publish"] },
      mockContext,
    );

    expect(result.success).toBe(true);
  });
});

describe("get_site_state tool", () => {
  it("should return error when site is not found", async () => {
    // Mock DB returns null for site lookup
    const result = await getSiteStateHandler({}, mockContext);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("not found");
    }
  });

  it("should return manifest when site exists", async () => {
    const siteRow = { id: "site-456", name: "Test", slug: "test", template_id: "generalist", style_layer_id: "minimal" };

    // Track query calls to return appropriate data per query
    let queryCount = 0;
    const mockStmt = {
      bind: (..._args: unknown[]) => mockStmt,
      first: async () => {
        queryCount++;
        if (queryCount === 1) return siteRow;  // sites lookup
        return null;  // style_configs lookup — returns null, triggering default
      },
      all: async () => ({ results: [] }),
      run: async () => ({ success: true }),
    };
    const dbWithSite = { prepare: (_sql: string) => mockStmt, batch: async (s: unknown[]) => s } as any;
    const ctxWithSite: ToolContext = { ...mockContext, db: dbWithSite };

    const result = await getSiteStateHandler({}, ctxWithSite);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.manifest).toBeDefined();
      expect(result.data.manifest.version).toBe("1.0");
      expect(result.data.manifest.site?.title).toBe("Test");
      expect(result.data.manifest.style).toBeDefined();
    }
  });

  it("should accept include filter parameter", async () => {
    // Even with no site found, the handler should accept the param shape
    const result = await getSiteStateHandler(
      { include: ["zones", "blocks"] },
      mockContext,
    );
    // Returns error because mock DB has no site, but validates param acceptance
    expect(result.success).toBe(false);
  });
});

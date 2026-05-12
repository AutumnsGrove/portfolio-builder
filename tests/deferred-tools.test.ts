/**
 * Tests for deferred tool categories (blocks, zones).
 *
 * Phase 4: Each deferred tool has a manifest and handler,
 * and follows the shared ToolHandler interface.
 */

import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import yaml from "yaml";

const TOOLS_DIR = path.resolve(__dirname, "../src/agents/tools");

const BLOCK_TOOLS = ["add_block", "update_block", "remove_block", "move_block"];
const ZONE_TOOLS = ["add_zone", "remove_zone", "reorder_zones"];

describe("Block tool manifests and handlers", () => {
  for (const tool of BLOCK_TOOLS) {
    it(`${tool}/tool.yaml should exist`, () => {
      expect(existsSync(path.join(TOOLS_DIR, tool, "tool.yaml"))).toBe(true);
    });

    it(`${tool}/handler.ts should exist`, () => {
      expect(existsSync(path.join(TOOLS_DIR, tool, "handler.ts"))).toBe(true);
    });

    it(`${tool} should be in the "blocks" category`, () => {
      const yamlContent = readFileSync(
        path.join(TOOLS_DIR, tool, "tool.yaml"),
        "utf-8",
      );
      const manifest = yaml.parse(yamlContent);
      expect(manifest.category).toBe("blocks");
    });

    it(`${tool} handler should export a handler function`, async () => {
      const mod = await import(
        `../src/agents/tools/${tool}/handler`
      );
      expect(typeof mod.handler).toBe("function");
    });
  }
});

describe("Zone tool manifests and handlers", () => {
  for (const tool of ZONE_TOOLS) {
    it(`${tool}/tool.yaml should exist`, () => {
      expect(existsSync(path.join(TOOLS_DIR, tool, "tool.yaml"))).toBe(true);
    });

    it(`${tool}/handler.ts should exist`, () => {
      expect(existsSync(path.join(TOOLS_DIR, tool, "handler.ts"))).toBe(true);
    });

    it(`${tool} should be in the "zones" category`, () => {
      const yamlContent = readFileSync(
        path.join(TOOLS_DIR, tool, "tool.yaml"),
        "utf-8",
      );
      const manifest = yaml.parse(yamlContent);
      expect(manifest.category).toBe("zones");
    });

    it(`${tool} handler should export a handler function`, async () => {
      const mod = await import(
        `../src/agents/tools/${tool}/handler`
      );
      expect(typeof mod.handler).toBe("function");
    });
  }
});

describe("Registry includes deferred tools after rebuild", () => {
  it("registry.generated.ts should include block tools", () => {
    const source = readFileSync(
      path.join(TOOLS_DIR, "registry.generated.ts"),
      "utf-8",
    );
    for (const tool of BLOCK_TOOLS) {
      expect(source).toContain(`"${tool}"`);
    }
  });

  it("registry.generated.ts should include zone tools", () => {
    const source = readFileSync(
      path.join(TOOLS_DIR, "registry.generated.ts"),
      "utf-8",
    );
    for (const tool of ZONE_TOOLS) {
      expect(source).toContain(`"${tool}"`);
    }
  });
});

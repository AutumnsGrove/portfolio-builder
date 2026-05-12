/**
 * Tests for builder routes and portfolio CRUD API.
 *
 * Phase 2: Builder pages exist, site API validates input correctly,
 * and slug generation produces URL-safe strings.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const PAGES_DIR = path.resolve(__dirname, "../src/pages");

function readPage(file: string): string {
  return readFileSync(path.join(PAGES_DIR, file), "utf-8");
}

describe("Builder page routes", () => {
  it("/builder/new should POST to /api/sites (not GET-mutate)", () => {
    const content = readPage("builder/new.astro");
    expect(content).toContain("fetch('/api/sites'");
    expect(content).toContain("method: 'POST'");
    // Should NOT have server-side INSERT statements
    expect(content).not.toContain("INSERT INTO sites");
  });

  it("/builder/[id] should load site data and have three-panel layout", () => {
    const content = readPage("builder/[id].astro");
    expect(content).toContain("SELECT id, name, slug, status");
    expect(content).toContain("ChatPanel");
    expect(content).toContain("editor-canvas");
    expect(content).toContain("Live Preview");
  });

  it("/builder/[id] should have skip-to-content and aria-live", () => {
    const content = readPage("builder/[id].astro");
    expect(content).toContain("Skip to editor");
    expect(content).toContain('aria-live="polite"');
    expect(content).toContain('role="status"');
  });
});

describe("Site API routes", () => {
  it("POST /api/sites should validate input with Zod", () => {
    const content = readFileSync(
      path.join(PAGES_DIR, "api", "sites", "index.ts"),
      "utf-8",
    );
    expect(content).toContain("CreateSiteSchema");
    expect(content).toContain("safeParse");
  });

  it("PATCH/DELETE /api/sites/[id] should verify user ownership", () => {
    const content = readFileSync(
      path.join(PAGES_DIR, "api", "sites", "[id].ts"),
      "utf-8",
    );
    expect(content).toContain("user_id = ?");
    expect(content).toContain("locals.user");
  });

  it("DELETE /api/sites/[id] should use batch() for atomic deletion", () => {
    const content = readFileSync(
      path.join(PAGES_DIR, "api", "sites", "[id].ts"),
      "utf-8",
    );
    expect(content).toContain("db.batch(");
  });
});

/**
 * Slug generation logic — extracted and tested in isolation.
 * Slugs must be URL-safe, lowercase, and unique-ish.
 */
import { generateSlug } from "../src/lib/sites/slug";

describe("Slug generation", () => {
  it("should lowercase and hyphenate a name", () => {
    expect(generateSlug("My Cool Portfolio")).toBe("my-cool-portfolio");
  });

  it("should strip non-alphanumeric characters", () => {
    expect(generateSlug("Jane's Portfolio!")).toBe("janes-portfolio");
  });

  it("should collapse multiple hyphens", () => {
    expect(generateSlug("too  ---  many   spaces")).toBe("too-many-spaces");
  });

  it("should trim leading and trailing hyphens", () => {
    expect(generateSlug("  --hello-- ")).toBe("hello");
  });

  it("should handle empty string with fallback", () => {
    const slug = generateSlug("");
    expect(slug).toBe("portfolio");
  });

  it("should handle unicode by stripping it", () => {
    const slug = generateSlug("日本語テスト project");
    expect(slug).toBe("project");
  });

  it("should handle all-special-characters with fallback", () => {
    const slug = generateSlug("!@#$%^&*()");
    expect(slug).toBe("portfolio");
  });
});

/**
 * Default zone scaffolding for new sites.
 */
import { getDefaultZones } from "../src/lib/sites/defaults";

describe("Default zone scaffolding", () => {
  const zones = getDefaultZones();

  it("should create 5 default zones for Generalist template", () => {
    expect(zones).toHaveLength(5);
  });

  it("should include Hero, Projects, About, Contact, Footer in order", () => {
    const labels = zones.map((z) => z.label);
    expect(labels).toEqual(["Hero", "Projects", "About", "Contact", "Footer"]);
  });

  it("should assign sequential numeric IDs starting at 1", () => {
    const ids = zones.map((z) => z.id);
    expect(ids).toEqual([1, 2, 3, 4, 5]);
  });

  it("should assign sequential order starting at 0", () => {
    const orders = zones.map((z) => z.order);
    expect(orders).toEqual([0, 1, 2, 3, 4]);
  });

  it("should start each zone with an empty blocks array", () => {
    for (const zone of zones) {
      expect(zone.blocks).toEqual([]);
    }
  });
});

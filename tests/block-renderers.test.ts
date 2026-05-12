/**
 * Tests for block renderer components and zone layout.
 *
 * Phase 3: Each block type has a renderer component, and the zone
 * layout system composes them correctly.
 */

import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";

const BLOCKS_DIR = path.resolve(__dirname, "../src/blocks");

describe("Block renderer components exist", () => {
  const blockTypes = [
    "HeroBlock",
    "TextBlock",
    "ImageBlock",
    "ProjectCardBlock",
    "SocialLinksBlock",
    "FooterBlock",
    "SpacerBlock",
  ];

  for (const name of blockTypes) {
    it(`${name}.svelte should exist`, () => {
      expect(existsSync(path.join(BLOCKS_DIR, `${name}.svelte`))).toBe(true);
    });
  }
});

/**
 * Registry validation via source text — avoids importing .svelte files
 * which Vitest can't parse without the Svelte compiler plugin.
 */
import { readFileSync } from "node:fs";

describe("Block registry maps types to renderers", () => {
  const registrySource = readFileSync(
    path.resolve(__dirname, "../src/blocks/index.ts"),
    "utf-8",
  );

  it("should export a BLOCK_COMPONENTS map", () => {
    expect(registrySource).toContain("export const BLOCK_COMPONENTS");
  });

  it("should have entries for all 7 v1 block types", () => {
    const expectedTypes = [
      "hero",
      "text",
      "image",
      "project-card",
      "social-links",
      "footer",
      "spacer",
    ];
    for (const type of expectedTypes) {
      // Keys with hyphens are quoted, others are bare identifiers
      const hasQuoted = registrySource.includes(`"${type}"`);
      const hasBare = registrySource.includes(`${type}:`);
      expect(hasQuoted || hasBare).toBe(true);
    }
  });
});

describe("Zone layout component exists", () => {
  it("ZoneRenderer.svelte should exist", () => {
    expect(
      existsSync(path.resolve(__dirname, "../src/components/editor/ZoneRenderer.svelte")),
    ).toBe(true);
  });

  it("BlockRenderer.svelte should exist", () => {
    expect(
      existsSync(path.resolve(__dirname, "../src/components/editor/BlockRenderer.svelte")),
    ).toBe(true);
  });
});

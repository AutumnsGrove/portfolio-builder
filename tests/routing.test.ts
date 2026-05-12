/**
 * Tests for route accessibility and middleware logic.
 *
 * Phase 1: All routes should be accessible without auth during development.
 * When auth is re-enabled, these tests document which routes are public vs protected.
 */

import { describe, it, expect } from "vitest";

/**
 * Extracted from src/middleware.ts — the public path check logic.
 * We test the function in isolation since the full middleware depends on Cloudflare runtime.
 */
const PUBLIC_PATHS = ["/", "/api/auth", "/login", "/privacy", "/terms"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

describe("Public path matching", () => {
  it("should treat landing page as public", () => {
    expect(isPublicPath("/")).toBe(true);
  });

  it("should treat auth API routes as public", () => {
    expect(isPublicPath("/api/auth")).toBe(true);
    expect(isPublicPath("/api/auth/callback/google")).toBe(true);
    expect(isPublicPath("/api/auth/session")).toBe(true);
  });

  it("should treat login page as public", () => {
    expect(isPublicPath("/login")).toBe(true);
  });

  it("should treat legal pages as public", () => {
    expect(isPublicPath("/privacy")).toBe(true);
    expect(isPublicPath("/terms")).toBe(true);
  });

  it("should treat other API routes as non-public", () => {
    expect(isPublicPath("/api/chat")).toBe(false);
    expect(isPublicPath("/api/sites")).toBe(false);
  });

  it("should treat dashboard as non-public", () => {
    expect(isPublicPath("/dashboard")).toBe(false);
  });

  it("should treat builder routes as non-public", () => {
    expect(isPublicPath("/builder/new")).toBe(false);
    expect(isPublicPath("/builder/abc-123")).toBe(false);
  });
});

/**
 * Page content validation.
 * Reads page files and verifies they contain required structural elements,
 * not just that they exist on disk.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

const PAGES_DIR = path.resolve(__dirname, "../src/pages");

function readPage(file: string): string {
  return readFileSync(path.join(PAGES_DIR, file), "utf-8");
}

describe("Required pages have correct structure", () => {
  const requiredPages = [
    { route: "/", file: "index.astro" },
    { route: "/dashboard", file: "dashboard.astro" },
    { route: "/login", file: "login.astro" },
    { route: "/privacy", file: "privacy.astro" },
    { route: "/terms", file: "terms.astro" },
  ];

  for (const { route, file } of requiredPages) {
    it(`${route} should have <html lang="en">`, () => {
      expect(readPage(file)).toContain('<html lang="en">');
    });

    it(`${route} should have a <title>`, () => {
      expect(readPage(file)).toMatch(/<title>.+<\/title>/);
    });

    it(`${route} should have viewport meta tag`, () => {
      expect(readPage(file)).toContain('name="viewport"');
    });
  }
});

describe("Accessibility structure in pages", () => {
  it("all pages should have skip-to-content links", () => {
    const pages = ["index.astro", "dashboard.astro", "login.astro", "privacy.astro", "terms.astro"];
    for (const file of pages) {
      const content = readPage(file);
      expect(content).toContain("Skip to");
    }
  });

  it("privacy and terms should have <main> landmarks", () => {
    expect(readPage("privacy.astro")).toContain("<main");
    expect(readPage("terms.astro")).toContain("<main");
  });

  it("landing page nav should have aria-label", () => {
    expect(readPage("index.astro")).toContain('aria-label="Main navigation"');
  });
});

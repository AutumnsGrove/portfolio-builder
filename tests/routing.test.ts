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
 * Route existence assertions.
 * These validate that the expected pages exist as files in the project.
 * A lightweight check that catches broken links before runtime.
 */
import { existsSync } from "node:fs";
import path from "node:path";

const PAGES_DIR = path.resolve(__dirname, "../src/pages");

describe("Required page routes exist", () => {
  const requiredPages = [
    { route: "/", file: "index.astro" },
    { route: "/dashboard", file: "dashboard.astro" },
    { route: "/login", file: "login.astro" },
    { route: "/privacy", file: "privacy.astro" },
    { route: "/terms", file: "terms.astro" },
  ];

  for (const { route, file } of requiredPages) {
    it(`${route} → src/pages/${file} should exist`, () => {
      expect(existsSync(path.join(PAGES_DIR, file))).toBe(true);
    });
  }
});

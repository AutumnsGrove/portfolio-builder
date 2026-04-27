/**
 * Core manifest types for Portfolio Builder v1.
 *
 * The manifest is the portfolio — all content lives in structured JSON.
 * Components are renderers that translate this data, never describe it.
 */

import type { BlockContent } from "./blocks";

export type SemanticSize = "S" | "M" | "L";
export type SiteStatus = "draft" | "published";

/**
 * Top-level manifest structure (v1.0)
 */
export interface ManifestV1 {
  version: "1.0";
  site: SiteMetadata;
  style: StyleConfig;
  zones: Zone[];
  meta: MetaTags;
}

/**
 * Site-level metadata
 */
export interface SiteMetadata {
  title: string;
  description: string;
  slug: string;
  template: "generalist"; // v1 only has one template
  style_layer: "minimal"; // v1 only has one style
}

/**
 * Global style configuration
 */
export interface StyleConfig {
  fonts: {
    heading: string;
    body: string;
  };
  colors: {
    primary: string;
    background: string;
    text: string;
  };
  spacing: "compact" | "comfortable" | "spacious";
  custom_css: string;
}

/**
 * Zone: Top-level layout container with semantic meaning
 *
 * Zones are numbered for AI addressability ("Place this in zone 3")
 * and labeled for human understanding ("Hero", "Projects", etc.)
 */
export interface Zone {
  id: number; // Numeric ID for AI addressability
  label: string; // Semantic name (Hero, Projects, About, etc.)
  order: number; // Display order (0-indexed)
  blocks: Block[];
  style_overrides?: Partial<StyleConfig>; // Optional zone-level styles
}

/**
 * Block: Content unit inside a zone
 *
 * Each block has a type-specific content payload defined in blocks.ts
 */
export interface Block {
  id: string; // UUID for stable references
  type: BlockType;
  size: SemanticSize;
  content: BlockContent; // Type-discriminated union based on block type
  style_overrides?: Record<string, string>; // Optional block-level CSS overrides
}

/**
 * All v1 block types (7 total)
 */
export type BlockType =
  | "hero"
  | "text"
  | "image"
  | "project-card"
  | "social-links"
  | "footer"
  | "spacer";

/**
 * SEO and social metadata
 */
export interface MetaTags {
  og_image?: string; // R2 URI
  keywords: string[];
  canonical: string; // Full URL
}

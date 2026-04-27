/**
 * Manifest type system — the single source of truth for portfolio data.
 *
 * Import from here to get types, schemas, and validation:
 * ```typescript
 * import { ManifestV1, ManifestV1Schema, type Block } from '@/lib/manifest';
 * ```
 */

// Core types
export type {
  ManifestV1,
  SiteMetadata,
  StyleConfig,
  Zone,
  Block,
  BlockType,
  SemanticSize,
  SiteStatus,
  MetaTags,
} from "./types";

// Block content types
export type {
  BlockContent,
  HeroContent,
  TextContent,
  ImageContent,
  ProjectCardContent,
  SocialLinksContent,
  FooterContent,
  SpacerContent,
} from "./blocks";

// Project card types
export type {
  ProjectCard,
  ProjectStatus,
  ProjectSource,
} from "./project-card";

// Zod schemas for runtime validation
export {
  ManifestV1Schema,
  BlockSchema,
  ZoneSchema,
  SiteMetadataSchema,
  StyleConfigSchema,
  MetaTagsSchema,
  BlockContentSchema,
  HeroContentSchema,
  TextContentSchema,
  ImageContentSchema,
  ProjectCardContentSchema,
  SocialLinksContentSchema,
  FooterContentSchema,
  SpacerContentSchema,
  ProjectCardSchema,
  SemanticSizeSchema,
  BlockTypeSchema,
} from "./schemas";

// Validated types (inferred from Zod schemas)
export type {
  ManifestV1Validated,
  BlockValidated,
  ZoneValidated,
  ProjectCardValidated,
} from "./schemas";

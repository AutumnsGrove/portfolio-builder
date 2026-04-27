/**
 * Zod validation schemas for manifest data.
 *
 * These schemas provide runtime validation at API boundaries (editor inputs,
 * AI tool outputs) and enable type inference to keep TypeScript types and
 * Zod schemas in sync.
 */

import { z } from "zod";

// ============================================================================
// Primitive schemas
// ============================================================================

export const SemanticSizeSchema = z.enum(["S", "M", "L"]);

export const BlockTypeSchema = z.enum([
  "hero",
  "text",
  "image",
  "project-card",
  "social-links",
  "footer",
  "spacer",
]);

// ============================================================================
// Block content schemas (one per block type)
// ============================================================================

export const HeroContentSchema = z.object({
  heading: z.string().min(1).max(100),
  subheading: z.string().max(200).optional(),
  image: z.string().startsWith("r2://").optional(),
  cta: z
    .object({
      text: z.string().min(1).max(30),
      href: z.string().min(1), // Anchor link or URL
    })
    .optional(),
});

export const TextContentSchema = z.object({
  markdown: z.string().min(1),
});

export const ImageContentSchema = z.object({
  src: z.string().startsWith("r2://"),
  alt: z.string().min(1), // Required for WCAG AA
  caption: z.string().optional(),
});

export const ProjectCardContentSchema = z.object({
  project_id: z.string().uuid("v4"),
});

export const SocialLinksContentSchema = z.object({
  links: z
    .array(
      z.object({
        platform: z.string().min(1),
        url: z.string().min(1), // URL validation happens at runtime
        label: z.string().optional(),
      }),
    )
    .min(1),
});

export const FooterContentSchema = z.object({
  text: z.string().optional(),
  links: z
    .array(
      z.object({
        label: z.string().min(1),
        href: z.string(),
      }),
    )
    .optional(),
});

export const SpacerContentSchema = z.object({
  as_divider: z.boolean(),
});

// ============================================================================
// Composite schemas
// ============================================================================

export const BlockContentSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("hero"), data: HeroContentSchema }),
  z.object({ type: z.literal("text"), data: TextContentSchema }),
  z.object({ type: z.literal("image"), data: ImageContentSchema }),
  z.object({ type: z.literal("project-card"), data: ProjectCardContentSchema }),
  z.object({
    type: z.literal("social-links"),
    data: SocialLinksContentSchema,
  }),
  z.object({ type: z.literal("footer"), data: FooterContentSchema }),
  z.object({ type: z.literal("spacer"), data: SpacerContentSchema }),
]);

export const StyleConfigSchema = z.object({
  fonts: z.object({
    heading: z.string(),
    body: z.string(),
  }),
  colors: z.object({
    primary: z.string(),
    background: z.string(),
    text: z.string(),
  }),
  spacing: z.enum(["compact", "comfortable", "spacious"]),
  custom_css: z.string(),
});

export const BlockSchema = z.object({
  id: z.string().uuid("v4"),
  type: BlockTypeSchema,
  size: SemanticSizeSchema,
  content: BlockContentSchema,
  style_overrides: z.record(z.string(), z.string()).optional(),
});

export const ZoneSchema = z.object({
  id: z.number().int().positive(),
  label: z.string().min(1).max(50),
  order: z.number().int().nonnegative(),
  blocks: z.array(BlockSchema),
  style_overrides: StyleConfigSchema.partial().optional(),
});

export const SiteMetadataSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/), // URL-safe
  template: z.literal("generalist"),
  style_layer: z.literal("minimal"),
});

export const MetaTagsSchema = z.object({
  og_image: z.string().startsWith("r2://").optional(),
  keywords: z.array(z.string()),
  canonical: z.string().min(1), // URL validation happens at runtime
});

export const ManifestV1Schema = z.object({
  version: z.literal("1.0"),
  site: SiteMetadataSchema,
  style: StyleConfigSchema,
  zones: z.array(ZoneSchema),
  meta: MetaTagsSchema,
});

// ============================================================================
// ProjectCard schema (stored in DB, referenced by project-card blocks)
// ============================================================================

export const ProjectCardSchema = z.object({
  id: z.string().uuid("v4"),
  title: z.string().min(1).max(100),
  description: z.string().min(1),
  stack: z.array(z.string()),
  status: z.enum(["active", "archived", "wip"]),
  links: z.object({
    repo: z.string().optional(),
    live: z.string().optional(),
    docs: z.string().optional(),
  }),
  media: z.array(z.string().startsWith("r2://")),
  tags: z.array(z.string()),
  date_range: z.string().optional(),
  highlights: z.array(z.string()).optional(),
  source: z.enum(["manual", "conversation"]),
});

// ============================================================================
// Type inference from Zod schemas
// ============================================================================

export type ManifestV1Validated = z.infer<typeof ManifestV1Schema>;
export type BlockValidated = z.infer<typeof BlockSchema>;
export type ZoneValidated = z.infer<typeof ZoneSchema>;
export type ProjectCardValidated = z.infer<typeof ProjectCardSchema>;

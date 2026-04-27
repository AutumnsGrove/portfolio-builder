/**
 * Block-specific content types for all v1 block types.
 *
 * Each block type has its own content interface defining what data it holds.
 * The BlockContent discriminated union ensures type safety when rendering.
 */

/**
 * Hero block: Page heading with optional CTA
 */
export interface HeroContent {
  heading: string;
  subheading?: string;
  image?: string; // R2 URI: r2://uploads/user/file.jpg
  cta?: {
    text: string;
    href: string; // Anchor link (#projects) or external URL
  };
}

/**
 * Text block: Rich text content as markdown
 */
export interface TextContent {
  markdown: string;
}

/**
 * Image block: Single image with caption
 */
export interface ImageContent {
  src: string; // R2 URI
  alt: string; // Required for WCAG AA
  caption?: string;
}

/**
 * Project card block: References a ProjectCard by ID
 *
 * Content is pulled from the project_cards table, not duplicated here.
 * This prevents data duplication and makes updates easier.
 */
export interface ProjectCardContent {
  project_id: string; // UUID referencing project_cards table
}

/**
 * Social links block: Icon row with external links
 */
export interface SocialLinksContent {
  links: Array<{
    platform: string; // GitHub, LinkedIn, Twitter, etc.
    url: string;
    label?: string; // Optional accessible label
  }>;
}

/**
 * Footer block: Site attribution and nav links
 */
export interface FooterContent {
  text?: string; // Copyright, attribution text
  links?: Array<{
    label: string;
    href: string;
  }>;
}

/**
 * Spacer block: Empty block for layout breathing room
 *
 * Takes S/M/L sizing. Optional as_divider flag renders it as <hr>.
 */
export interface SpacerContent {
  as_divider: boolean; // If true, renders as horizontal rule
}

/**
 * Type-discriminated union for Block.content
 *
 * The `type` field allows TypeScript to narrow the type automatically:
 * ```
 * if (block.content.type === 'hero') {
 *   // TypeScript knows block.content.data is HeroContent
 * }
 * ```
 */
export type BlockContent =
  | { type: "hero"; data: HeroContent }
  | { type: "text"; data: TextContent }
  | { type: "image"; data: ImageContent }
  | { type: "project-card"; data: ProjectCardContent }
  | { type: "social-links"; data: SocialLinksContent }
  | { type: "footer"; data: FooterContent }
  | { type: "spacer"; data: SpacerContent };

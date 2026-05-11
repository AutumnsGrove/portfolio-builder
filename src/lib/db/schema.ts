import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import type { Zone, Block, ProjectCard } from "@/lib/manifest";

// Database schema for Portfolio Builder v1.
// Maps to SPEC_v1.md §11.2 with typed JSON columns for manifest data.

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  displayName: text("display_name"),
  customInstructions: text("custom_instructions"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const sites = sqliteTable("sites", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  templateId: text("template_id"),
  styleLayerId: text("style_layer_id"),
  status: text("status", { enum: ["draft", "published"] })
    .notNull()
    .default("draft"),
  publishedAt: integer("published_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const versions = sqliteTable("versions", {
  id: text("id").primaryKey(),
  siteId: text("site_id")
    .notNull()
    .references(() => sites.id),
  name: text("name").notNull(),
  snapshotJson: text("snapshot_json").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Zones: Top-level layout containers with semantic meaning
export const zones = sqliteTable("zones", {
  id: text("id").primaryKey(),
  siteId: text("site_id")
    .notNull()
    .references(() => sites.id),
  zoneId: integer("zone_id").notNull(), // Numeric ID for AI addressability
  label: text("label").notNull(),
  order: integer("order").notNull(),
  styleOverrides: text("style_overrides"), // JSON: Partial<StyleConfig>
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Blocks: Content units inside zones
export const blocks = sqliteTable("blocks", {
  id: text("id").primaryKey(),
  zoneId: text("zone_id")
    .notNull()
    .references(() => zones.id),
  order: integer("order").notNull(),
  type: text("type").notNull(), // BlockType enum
  size: text("size").notNull(), // SemanticSize: S/M/L
  contentJson: text("content_json")
    .notNull()
    .$type<Block["content"]>(), // Typed JSON column
  styleOverrides: text("style_overrides"), // JSON: Record<string, string>
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Project cards: Universal intermediate format for portfolio projects
export const projectCards = sqliteTable("project_cards", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  stack: text("stack").notNull(), // JSON: string[]
  status: text("status", { enum: ["active", "archived", "wip"] })
    .notNull()
    .default("active"),
  links: text("links").notNull(), // JSON: ProjectCard["links"]
  media: text("media").notNull(), // JSON: string[] (R2 URIs)
  tags: text("tags").notNull(), // JSON: string[]
  dateRange: text("date_range"),
  highlights: text("highlights"), // JSON: string[]
  source: text("source", { enum: ["manual", "conversation"] }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// AI conversations: Chat history with Guide Agent
export const aiConversations = sqliteTable("ai_conversations", {
  id: text("id").primaryKey(),
  siteId: text("site_id")
    .notNull()
    .references(() => sites.id),
  messagesJson: text("messages_json").notNull(), // JSON: ChatMessage[]
  helpLevel: text("help_level", { enum: ["guide_me", "do_it_for_me"] })
    .notNull()
    .default("guide_me"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Hosted sites: Metadata for portfolios hosted on our infrastructure
export const hostedSites = sqliteTable("hosted_sites", {
  id: text("id").primaryKey(),
  siteId: text("site_id")
    .notNull()
    .references(() => sites.id),
  r2Prefix: text("r2_prefix").notNull(), // Path in R2 bucket
  lastDeployedAt: integer("last_deployed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Style configs: Global style settings (fonts, colors, spacing)
export const styleConfigs = sqliteTable("style_configs", {
  id: text("id").primaryKey(),
  siteId: text("site_id")
    .notNull()
    .references(() => sites.id),
  fonts: text("fonts").notNull(), // JSON: { heading: string, body: string }
  colors: text("colors").notNull(), // JSON: { primary, background, text }
  spacing: text("spacing", { enum: ["compact", "comfortable", "spacious"] })
    .notNull()
    .default("comfortable"),
  customCss: text("custom_css").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Analytics: Funnel events for measuring v1 acceptance criteria
export const analyticsEvents = sqliteTable("analytics_events", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  siteId: text("site_id").references(() => sites.id),
  event: text("event").notNull(), // signup, started_build, first_block_added, etc.
  metadata: text("metadata"), // JSON: event-specific data
  timestamp: integer("timestamp", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Agent metrics: Instrumentation for Guide Agent performance
export const agentMetrics = sqliteTable("agent_metrics", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => aiConversations.id),
  turnCount: integer("turn_count").notNull(),
  toolCallCount: integer("tool_call_count").notNull(),
  toolFailures: integer("tool_failures").notNull().default(0),
  replyLatencyMs: integer("reply_latency_ms"),
  tokensIn: integer("tokens_in"),
  tokensOut: integer("tokens_out"),
  costUsd: text("cost_usd"), // Decimal as string
  timestamp: integer("timestamp", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

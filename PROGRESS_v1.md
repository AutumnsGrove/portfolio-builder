# v1 Implementation Progress

Track what's built, what's in progress, and what's still TODO. Links to SPEC_v1.md sections.

**Last updated:** 2026-04-27

---

## ✅ Completed (Ready for Integration)

### Foundation
- [x] **Manifest type system** (§6, §8.3, §9.3)
  - `src/lib/manifest/types.ts` — Core types (ManifestV1, Site, Zone, Block)
  - `src/lib/manifest/blocks.ts` — All 7 block content types
  - `src/lib/manifest/schemas.ts` — Zod validation schemas
  - `src/lib/manifest/project-card.ts` — ProjectCard type
  - `src/lib/manifest/examples/generalist.json` — Reference manifest

### Database & Analytics
- [x] **D1 schema** (§11)
  - 11 tables: users, sites, site_versions, zones, blocks, project_cards, ai_conversations, ai_conversation_turns, hosted_sites, style_configs, analytics_events
  - Migration: `migrations/0000_easy_maelstrom.sql`
  - `src/lib/db/schema.ts` with Drizzle ORM types

- [x] **Analytics tracking** (§1 — Analytics)
  - `src/lib/analytics/track.ts` — trackEvent, trackAgentMetrics
  - `src/lib/analytics/TRACKING_GUIDE.md` — Implementation guide with SQL queries
  - Funnel events: signup, started_build, first_block_added, first_publish, returned_after_publish, session_abandoned
  - Agent metrics: turn counts, tool calls, failures, latency, cost tracking

### Testing
- [x] **Test infrastructure**
  - Vitest configured
  - `tests/block-schemas.test.ts` — 21 tests for all 7 block types
  - `tests/database-schema.test.ts` — 8 tests for schema integrity
  - `tests/README.md` — Testing philosophy

### AI Agent System — Hot Tools
- [x] **6 hot tools** (§4.3, §4.4)
  - `src/agents/tools/think/` — Internal reasoning
  - `src/agents/tools/reply/` — Send messages to user
  - `src/agents/tools/done/` — Signal turn completion
  - `src/agents/tools/ask_user/` — Structured Q&A (primary pattern)
  - `src/agents/tools/use_tools/` — Load deferred tool categories
  - `src/agents/tools/get_site_state/` — Read current manifest
  - Each tool has `handler.ts` + `tool.yaml` manifest

- [x] **Tool type system**
  - `src/agents/tools/types.ts` — ToolContext, ToolResult, ToolHandler, StructuredQuestion, StructuredResponse

### Chat Panel UI
- [x] **Chat interface components** (§4.8, §5)
  - `src/components/chat/ChatPanel.svelte` — Main sidebar with message history
  - `src/components/chat/ChatMessage.svelte` — Individual message display
  - `src/components/chat/ChatInput.svelte` — Auto-expanding textarea with keyboard shortcuts
  - `src/components/chat/StructuredQuestions.svelte` — Renders ask_user tool as UI
  - `src/pages/chat-demo.astro` — Dev preview page

- [x] **Error handling**
  - Sonner toast notifications (svelte-sonner)
  - Try/catch with retry mechanism
  - Progressive thinking messages ("Reading your work…" → "Thinking through options…" → "Crafting suggestions…")
  - User-friendly error messages with one-click retry

- [x] **Design refinements**
  - Compass icon (navigation metaphor)
  - `context` field in structured questions (explains "why" we're asking)
  - Exponential easing on animations (no bounce)
  - Typography hierarchy (text-lg header with tracking-tight)
  - Patient Workshop aesthetic: warm amber accents, Outfit/Lexend fonts, tinted neutrals

---

## 🚧 In Progress

Nothing actively in progress (session ended).

---

## 📋 TODO (High Priority)

### AI Agent System
- [ ] **Tool registry & loader**
  - Auto-discover tools from directories
  - Load tool.yaml manifests
  - Register handlers
  - Hot vs deferred tool routing

- [ ] **Deferred tool categories** (§4.4)
  - `blocks/` — add_block, update_block, delete_block, reorder_blocks
  - `zones/` — add_zone, rename_zone, reorder_zones, delete_zone
  - `content/` — upload_image, create_project_card, update_project_card
  - `publish/` — publish_site, unpublish_site

- [ ] **Turn pipeline** (§4.1, §4.2)
  - Phase 1: Driver (sync, user-facing, manages conversation)
  - Phase 2: Specialists (async, background tasks)
  - Conversation state management
  - Tool call orchestration
  - Dead-end detection

- [ ] **OpenRouter integration** (§4.6)
  - API client wrapper
  - Model selection (single model for v1)
  - Streaming responses
  - Token counting for cost tracking
  - Error handling (rate limits, timeouts)

### Auth & Identity
- [ ] **WorkOS AuthKit** (§12)
  - Google sign-in only
  - Session cookie storage
  - User creation in D1
  - Redirect flow

### Editor UI
- [ ] **Zone/block manipulation** (§5)
  - Zone list with add/rename/delete/reorder
  - Block list with add/edit/delete
  - Up/down reorder buttons (no drag-and-drop)
  - Live preview (split-pane desktop, toggle mobile)
  - Auto-save to D1

- [ ] **Help-level dial** (§5.2)
  - 2 levels: "Guide me" and "Do it for me"
  - Affects AI guidance verbosity

- [ ] **Session undo/redo** (§5)
  - Manifest snapshot on each change
  - In-memory undo stack
  - No named version history

### Template & Style System
- [ ] **Generalist template** (§7)
  - Default zones: Hero, Projects, About, Contact, Footer
  - Zone configuration
  - Block type restrictions per zone

- [ ] **Minimal style layer** (§7)
  - Color palette
  - Typography scale
  - Spacing system
  - Component styles

### Content Pipeline
- [ ] **R2 image upload** (§8)
  - Upload to R2 bucket
  - Return `r2://` URI
  - Resize/optimize images
  - Alt text prompt enforcement

- [ ] **Project card creation** (§8.3)
  - Conversational extraction
  - Store in project_cards table
  - Reference from blocks

### Output Sites
- [ ] **Astro SSG generator** (§9)
  - Read manifest from D1
  - Render with Astro templates
  - Generate static HTML/CSS/assets
  - Build to `dist/`

- [ ] **Output components** (§9.2)
  - Render each block type
  - Semantic HTML
  - Zero JS by default
  - WCAG 2.1 AA compliant

- [ ] **Metadata generation** (§9.3, §13)
  - `manifest.json` (always shipped)
  - `llms.txt` and `llms-full.txt`
  - Auto-generated `<title>`, `<meta description>`, OG tags
  - `sitemap.xml` and `robots.txt`
  - Canonical URLs

### Hosting
- [ ] **Subdomain hosting** (§10)
  - `*.portfoliobuilder.com` (domain TBD)
  - Upload `dist/` to R2
  - Edge-cache prewarming on publish
  - Serve via Cloudflare Workers

- [ ] **Export as .zip** (§10)
  - Bundle `dist/` + source `manifest.json`
  - Download endpoint

---

## 📋 TODO (Lower Priority / Nice to Have)

- [ ] **Session abandonment detection** (§4.5)
  - Track inactivity
  - Save draft state
  - Recovery flow on return

- [ ] **Trace visualization** (§4.8)
  - Collapsible thinking + tool calls in chat UI
  - Per-turn observability

- [ ] **Advanced SEO** (§13)
  - JSON-LD structured data (v2)
  - Advanced meta tags (v2)

- [ ] **Dark mode** (v2)
  - Toggle on output sites

---

## 🎯 v1 Acceptance Criteria Progress

From SPEC_v1.md §3. These are the gates to v2.

### 1. Core loop works end-to-end
- [ ] 5+ strangers sign up → publish without intervention
- [ ] 3+ of those return after publishing
- [ ] Median time-to-publish < 60 minutes
- [ ] Drop-off rate signup → first-block-added < 50%

**Status:** Cannot test until full loop is implemented.

### 2. Someone has tried to break it
- [ ] Adversarial test session completed
- [ ] Breakage logged and either fixed or documented

**Status:** Not yet tested.

### 3. Guide Agent doesn't get stuck
- [ ] <5% session stall rate (no reply for 30s)
- [ ] <2% infinite loop rate (>20 tool calls/turn)

**Status:** Agent not integrated yet.

### 4. Output sites meet quality bar
- [ ] WCAG 2.1 AA compliance verified
- [ ] Lighthouse Performance > 90
- [ ] Lighthouse Accessibility = 100
- [ ] Works on mobile (iPhone SE, Pixel 5)

**Status:** No output sites generated yet.

### 5. Analytics instrumentation works
- [x] Funnel events tracked
- [x] Agent metrics logged
- [ ] Dashboards/queries ready for analysis

**Status:** Tracking code ready, not wired up to real flows yet.

### 6. Cost per portfolio is sustainable
- [ ] Measured AI token cost per published portfolio
- [ ] R2 storage cost per portfolio
- [ ] Worker request cost per portfolio

**Status:** Cannot measure until full loop exists.

---

## 📝 Notes

- **Error handling:** Production-ready with Sonner toasts + retry. Just needs real API integration.
- **Manifest types:** Complete and validated with tests. Ready for consumption.
- **Hot tools:** All 6 implemented. Need tool registry to wire them up.
- **Design:** Passed /impeccable critique with score 35/40 (Excellent band).
- **Next session focus:** Tool registry + turn pipeline or OpenRouter integration.

---

## 🔗 Related Files

- [SPEC_v1.md](SPEC_v1.md) — Full v1 specification
- [SPEC.md](SPEC.md) — Overview and navigation hub
- [CLAUDE.md](CLAUDE.md) — Project instructions for Claude Code
- [DESIGN.md](DESIGN.md) — Patient Workshop design system
- [PRODUCT.md](PRODUCT.md) — Product context and register

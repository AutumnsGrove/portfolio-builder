# v1 — Validate the Core Loop

> **Hypothesis:** An AI guide can take a person who has been avoiding their portfolio for months — someone with ADHD, executive-function challenges, or just blank-page paralysis — and walk them from sign-in to published portfolio in a single session, without giving up partway.

---

## Table of Contents

1. [What's IN v1](#whats-in-v1)
2. [What's CUT from v1](#whats-cut-from-v1)
3. [v1 Acceptance Criteria](#v1-acceptance-criteria)
4. [AI Agent System](#ai-agent-system)
5. [Editor Experience](#editor-experience)
6. [Zone & Block Architecture](#zone--block-architecture)
7. [Template & Style System](#template--style-system)
8. [Content Pipeline](#content-pipeline)
9. [Output Sites](#output-sites)
10. [Deployment Options](#deployment-options)
11. [Infrastructure & Data Model](#infrastructure--data-model)
12. [Auth & Identity](#auth--identity)
13. [SEO & Accessibility](#seo--accessibility)
14. [Tech Stack Summary](#tech-stack-summary)

---

## 1. What's IN v1

**Auth & identity**
- WorkOS AuthKit with Google sign-in only
- Simple session cookie storage (no Durable Objects)

**Editor**
- Single-page portfolio only (anchor nav for sections; no multi-page)
- Zone-based block layout, semantic sizing (S/M/L)
- Block reordering via up/down buttons (no drag-and-drop)
- Live preview (split-pane on desktop, toggle on mobile)
- Help-level dial — 2 levels: "Guide me" and "Do it for me"
- Session-scoped undo/redo (no named version history)
- Auto-save to D1

**AI Agent System**
- Guide Agent only (no Repo Explorer, no HTML Import, no Content Advisor)
- Hot tools: `think`, `reply`, `done`, `ask_user`, `use_tools`, `get_site_state`
- Deferred tool categories: `blocks`, `zones`, `content`, `publish`
- Single AI provider — OpenRouter (no Cloudflare AI Gateway)
- Conversational content extraction only (no bulk upload, no repo URL ingestion)
- Structured Q&A (`ask_user`) is the primary interaction pattern
- Trace system in chat (collapsible thinking + tool calls)

**Block types (7)**
- Hero
- Text block (rich text)
- Image (single, with caption)
- Project card
- Social links
- Footer
- Spacer (empty block for layout breathing room — takes S/M/L sizing, optional `as_divider: true` flag)

**Templates & styles**
- 1 structural template (Generalist) with default zones: Hero, Projects, About, Contact, Footer
- Zones are fully manipulatable — add, remove, rename, reorder
- 1 style layer (Minimal)
- No template/style picker UI — everyone starts with Generalist + Minimal

**Content pipeline**
- Image upload to R2
- Conversational project card creation only

**Output sites**
- Astro SSG only (static export)
- `manifest.json`, `llms.txt`, `llms-full.txt` always shipped
- Zero JavaScript by default
- Built at publish time to static files in R2, edge-cached

**Hosting**
- Subdomain hosting on `*.portfoliobuilder.com` (domain TBD)
- Pre-warm cache on publish

**Export**
- `.zip` download with full `dist/` + source `manifest.json`

**Analytics & instrumentation**
- Event tracking: `signup`, `started_build`, `first_block_added`, `first_publish`, `returned_after_publish`, `session_abandoned`
- Agent instrumentation: turn counts, tool call counts, tool failures, reply latency, dead-end detection
- Per-session funnel data
- Cost tracking per session (AI tokens in/out per published portfolio)
- Lightweight — Cloudflare Analytics Engine + D1 event tables

**SEO (minimal)**
- Auto-generated `<title>`, `<meta description>`, OG tags
- Basic `sitemap.xml` and `robots.txt`
- Canonical URLs

**Accessibility**
- WCAG 2.1 AA baseline for output sites (non-negotiable)
- bits-ui primitives in editor for keyboard nav and focus management
- Alt text prompts for every image

---

## 2. What's CUT from v1

| Item | Rationale | Goes to |
|------|-----------|---------|
| Repo Explorer agent | Only relevant to one persona (devs); doesn't validate broader thesis | v2 |
| HTML Import agent | v1 doesn't need import-from-existing-site | v2 |
| Content Advisor agent | Optimization, not validation | v2 |
| Drag-and-drop block reordering | Expensive to build well (mobile + a11y + animation); up/down buttons cover 80% of value | v2 |
| Animated real-time AI editing | Engineering complexity high; static rerenders are fine for validation | v2 or v3 |
| Multi-page support | Free tier is single-page anyway; anchor nav covers most portfolios | v2 |
| Named version history (git-style) | Power-user feature; session undo/redo is enough for v1 | v2 |
| Wizard flow as separate UI | The wizard IS the Guide Agent's first conversation; build as a system prompt, not a parallel flow | v2 (if needed) |
| 5-10 structural templates | Validating loop, not template choice; ship 1, learn what users actually want | v2 |
| 5-10 style layers | Same logic — ship 1, expand based on real data | v2 |
| Custom components | Power user feature | v2+ |
| All ~14 non-essential block types | Validation requires the loop, not block variety | v2 |
| Custom domain via CF for SaaS | Subdomain works for validation | v2 |
| Stripe / billing / paid tiers | No monetization until product is validated | v2 |
| Watermark + removal flow | Suppresses publishing (the very thing we're measuring) | v2 |
| BYOK | Power-user feature; hardcode one provider in v1 | v2 |
| Cloudflare AI Gateway | Adds latency variance + debug surface for no v1 value | v2 |
| Multi-provider routing | One provider is enough to test the loop | v2 |
| Durable Objects for session state | D1 + session cookies are enough at v1 scale | v2 (if scale demands) |
| Domain finder (Forage-style) | Optimization | v2 |
| Deploy wizard | Static `.zip` + a docs page is enough for v1 | v2 |
| JSON-LD / advanced SEO | Polish | v2 |
| A11y checker UI | Enforce in components, not via UI in v1 | v2 |
| 3-level help dial | 2 levels validates the core question; expand later if needed | v2 (if validated) |
| Dark mode toggle on output sites | Polish | v2 |

---

## 3. v1 Acceptance Criteria

All of these must pass with concrete evidence before any v2 work begins. Not "I think it works" — **measured** outcomes.

1. **The core loop works end-to-end without intervention.**
   - At least 5 strangers (not friends, not the author) sign up, complete onboarding, and publish a portfolio without intervention.
   - At least 3 of those return at least once after publishing.
   - Median time-to-publish < 60 minutes for users who publish.
   - Drop-off rate from signup to first-block-added < 50%.

2. **Someone has tried to break it.**
   - At least one adversarial test session: a friend or beta tester is asked to actively break the flow — weird inputs, abandoning mid-flow, unicode in fields, very long messages, very short messages, switching help levels mid-build, etc.
   - All discovered breakage is logged and either fixed or filed as a known limitation with a workaround.

3. **The Guide Agent doesn't get stuck.**
   - <5% of sessions stall on the agent (defined as: no `reply` tool call for 30+ seconds during an active conversation).
   - <2% of sessions hit a tool-call infinite loop (>20 tool calls in a single user turn).
   - When the agent does get stuck, the trace is preserved for debugging.

4. **Hosting works reliably.**
   - 99% uptime over 7 consecutive days for at least 10 hosted portfolios.
   - SSR latency p95 < 500ms cold cache, p95 < 100ms warm cache.
   - Pre-warming on publish demonstrably reduces first-visitor latency.

5. **Output quality holds.**
   - Every published portfolio passes WCAG 2.1 AA (axe-core or equivalent automated check, plus one manual screen reader pass).
   - Lighthouse performance score 90+ on a representative published site.
   - `llms.txt` and `llms-full.txt` validate against the standard.

6. **Cost economics are knowable.**
   - Average AI cost per published portfolio is calculable from logged token data.
   - That number can be plugged into a v2 pricing model that survives basic napkin math (e.g. cost per portfolio < target ARPU / 4).

7. **The author hasn't spiraled.**
   - This is a soft gate, but a real one. If v1 took 6 months to ship, v1 scope was wrong and the lesson is more important than the launch.
   - Track build velocity; if it's stalling for >2 weeks on any single feature, stop and re-scope.

**If any of #1–#6 fails, the answer is iterate on v1, not move to v2.**

---

## 4. AI Agent System

### 4.1 Guide Agent (Only Agent in v1)

The Guide Agent is the sync, user-facing chat AI. It interviews, suggests, orchestrates. Calls tools to modify the editor. Responds immediately.

### 4.2 Tool Architecture

Follows the her-go pattern: each tool is its own folder with a YAML manifest (schema, description, category) and a handler module. Tools auto-register at startup via the init pattern.

```
agents/tools/
├── registry.ts          — tool map, Register(), Execute()
├── context.ts           — Context type with all deps
├── categories.yaml      — groups tools into categories
├── loader.ts            — loads YAML manifests, builds schemas
├── think/
│   ├── tool.yaml
│   └── handler.ts
├── reply/
│   ├── tool.yaml
│   └── handler.ts
└── ...
```

### 4.3 Hot Tools (Always in Prompt)

Tool schemas use `*` to mark required params.

```
think
  *thought:      string         — internal reasoning (visible in trace panel if expanded)

reply
  *message:      string         — markdown-formatted message to the user
   typing:       boolean        — show typing indicator first (default: true)

done
   reason:       string         — why the turn is ending (for traces)

ask_user
  *questions:    object[]       — structured Q&A (see §4.6)

use_tools
  *categories:   string[]       — which categories to load
  Returns: { loaded: string[], tool_count: number }
  Categories in v1: "blocks", "zones", "content", "publish"

get_site_state
   page:         string         — specific page slug (default: all pages)
   include:      string[]       — filter: ["zones","blocks","nav","style","meta"]
```

### 4.4 Deferred Tool Categories (v1)

**Category "blocks":**
- `add_block` — add a block to a zone
- `move_block` — move a block between zones
- `remove_block` — delete a block
- `update_block` — modify block size/content/style

**Category "zones":**
- `add_zone` — create a new zone
- `remove_zone` — delete a zone (and all its blocks)
- `reorder_zones` — change zone order

**Category "content":**
- `list_uploads` — see uploaded files
- `list_project_cards` — see all project cards
- `get_project_card` — get full project card data
- `create_project_card` — create a new project card

**Category "publish":**
- `publish_site` — publish to subdomain (v1: subdomain only)
- `export_site` — generate .zip download

### 4.5 Turn Tracker

v1 only runs the Guide Agent, so the tracker is trivial. The parallel-phase coordination matters once background specialists land in v2.

```
User message arrives
  → Guide Agent phase begins (sync)
  → Guide responds to user
  → Session state updated, UI refreshes
```

### 4.6 Structured Q&A Tool (`ask_user`)

The primary interaction pattern for interviews and decision points. Inspired by Claude Code's `AskUserQuestion` tool.

**Why structured Q&A over freeform chat:**
- Reduces cognitive load — choosing is easier than generating
- Prevents blank-page paralysis
- Speeds up the process — tap an option instead of typing
- Gives the AI better signal — discrete choices are unambiguous

**Tool schema:**
```json
{
  "tool": "ask_user",
  "params": {
    "questions": [
      {
        "question": "What kind of work do you want to showcase?",
        "header": "Work type",
        "options": [
          {
            "label": "Software / code",
            "description": "GitHub repos, apps, tools, libraries"
          },
          {
            "label": "Visual art / design",
            "description": "Illustrations, UI/UX, brand work, photography"
          },
          {
            "label": "Something else",
            "description": "Music, games, research, consulting, etc."
          }
        ],
        "multi_select": false
      }
    ]
  }
}
```

**Rules:**
- 1-4 questions per call
- 2-4 options per question
- **"Other" with freeform text is ALWAYS available**
- `multi_select: true` when choices aren't mutually exclusive

### 4.7 Help-Level Dial (v1: 2 Levels)

| Level | AI Behavior |
|-------|-------------|
| **Guide me** | Asks questions, suggests structure, highlights areas. Never writes content. Pure coaching. |
| **Do it for me** | AI writes content, places blocks, structures sections. User reviews and approves. |

Adjustable at any point mid-conversation. v1 ships with 2 levels; the middle "Draft for me" tier is added in v2 only if v1 data shows users actually want it.

### 4.8 Trace System

Agent activity is displayed in the chat as collapsible trace blocks:

```
Default view (collapsed):
┌─────────────────────────────────────┐
│  ▸ Thinking...                      │
│  ▸ Reading current site state       │
│  ▸ Loading block editing tools      │
│  ▸ Adding project card to zone 2    │
└─────────────────────────────────────┘
```

Each trace entry maps to a tool call. Background agent activity (v2+) appears as separate trace blocks.

### 4.9 AI Cost Model (v1)

- **Free tier:** Platform-provided OpenRouter key with limits (N turns per session, cheaper models). Enough to build one portfolio.
- v1 hardcodes OpenRouter as the single provider — keeps debug surface small while still allowing model experimentation behind that one API.
- BYOK is v2.

---

## 5. Editor Experience

### 5.1 Layout

**Desktop:** Three-panel layout.
- **Left:** Chat sidebar (collapsible). AI guide lives here.
- **Center:** Editor canvas. Zone-based block editor. Blocks reorder via up/down buttons.
- **Right:** Live preview (real-time updates).

**Mobile/Tablet:** Toggle between editor and preview. Chat is an overlay sheet that slides up from the bottom.

### 5.2 Editor ↔ Preview

Side-by-side on desktop. Changes in the editor reflect instantly in the preview. On smaller screens, a toggle switches between full-screen editor and full-screen preview.

### 5.3 Block Reordering (v1: Up/Down Buttons)

Drag-and-drop is v2. v1 uses simple up/down arrow buttons on each block. Covers 80% of the value without the complexity of proper mobile + a11y + animation.

### 5.4 Undo/Redo (v1: Session-Scoped)

Standard undo/redo (Ctrl+Z / Ctrl+Shift+Z) for granular changes within a session. Named versions that persist across sessions are v2.

---

## 6. Zone & Block Architecture

### 6.1 Zones

Zones are the top-level layout containers. They define **semantic regions** of the portfolio (hero, projects, about, contact, etc.). Each zone:

- Has a numeric ID (for AI addressability: "Place this in zone 3")
- Uses CSS Grid internally
- Can be reordered via up/down buttons
- Can be created by the user or AI (custom zones)
- Has its own style overrides (background, padding, max-width)

The Generalist template defines default zones (Hero, Projects, About, Contact, Footer), but users can add, remove, and reorder freely from v1.

### 6.2 Blocks

Blocks are the content units inside zones. Each block has:
- A **type** (text, image, project-card, etc.)
- A **semantic size**: S, M, or L
- Content-specific properties (text content, image URL, etc.)

### 6.3 Responsive Grid (Semantic Sizing)

Blocks use abstract sizes that map to CSS Grid fractions per breakpoint:

| Size | Desktop (3-col) | Tablet (2-col) | Mobile (1-col) |
|------|-----------------|-----------------|-----------------|
| **S** | 1fr | 1fr | 1fr |
| **M** | 2fr | 2fr (full row) | 1fr |
| **L** | 3fr (full row) | 2fr (full row) | 1fr |

Rules:
- Two S blocks sit side-by-side on all screens except mobile.
- An S + M fills a desktop row, stacks on mobile.
- An L always takes the full row width.

Users never think about breakpoints. They say "this is a small thing" or "this is a big thing" and the grid handles the rest.

### 6.4 Block Types (v1: 7 types)

**Content Essentials:**
- **Hero / header** — page heading with optional CTA
- **Text block** — rich text (markdown)
- **Image** — single image with caption
- **Project card** — thumbnail, title, description, tags, links
- **Social links** — icon row with external links
- **Footer** — site attribution, nav links
- **Spacer** — empty block for layout breathing room. Takes S/M/L sizing. Optional `as_divider: true` flag renders it as a horizontal rule. Lets users and the AI compose asymmetric layouts and vertical rhythm without forcing every cell to have content.

All other block types (gallery, video, audio, code, testimonial, stats, timeline, contact form, before/after slider, 3D viewer, map, iframe embed, PDF) are v2.

### 6.5 Single-Page Only (v1)

v1 is single-page only — anchor nav (`#projects`, `#about`, `#contact`) covers most portfolios. Multi-page is v2.

### 6.6 Navigation (v1)

Every portfolio has a top nav (header) and bottom nav (footer). Nav items can be:

| Type | Example | Behavior |
|------|---------|----------|
| **Anchor link** | `#skills` | Scroll to a section on the page |
| **External link** | `ko-fi.com/jane` | Open in new tab |

**Responsive behavior:**
- Desktop: horizontal nav bar
- When items exceed available width: overflow into hamburger menu
- Mobile: always hamburger menu (slide-out drawer or bottom sheet)

---

## 7. Template & Style System

### 7.1 Architecture

Templates are composed of two independent layers:

1. **Structural templates** — define zone layouts, default block types, content flow
2. **Style layers** — define typography, color palette, spacing, decorative elements

These are mix-and-match, but v1 ships only one of each.

### 7.2 Structural Templates (v1: 1 template)

- **Generalist** — flexible multi-purpose layout with default zones: Hero, Projects, About, Contact, Footer. Zones are fully manipulatable from day one; the default set is a starting point, not a constraint.

No template picker UI in v1 — everyone starts with Generalist and the AI evolves it through conversation.

All other templates (Developer, Photographer, Artist, Designer, Writer, Musician, Game Dev, Minimal, Creative) are v2.

### 7.3 Style Layers (v1: 1 style)

- **Minimal** — clean, lots of whitespace, system fonts

All other style layers (Bold, Art Deco, Brutalist, Soft, Dark, Nature, Retro, Professional, Playful) are v2.

---

## 8. Content Pipeline

### 8.1 Ingestion Path (v1: Conversational Only)

**Path B: Conversational Extraction**
1. AI interviews the user about each project one at a time
2. User pastes links, uploads files (images), or just describes their work
3. AI builds project cards incrementally from conversation
4. More guided, less overwhelming

v1 ships Path B only. Bulk upload and repo URL ingestion (Path A) ride on the Repo Explorer agent, which is v2.

### 8.2 Supported File Formats (v1)

| Format | Parser |
|--------|--------|
| Images (PNG, JPG, SVG, WebP) | Direct upload to R2, metadata extraction |

All other formats (Markdown/README, HTML, plain text, PDF, git repo URL) are v2. Office formats (DOCX, PPTX, XLSX) and media formats (audio, video, 3D models) are v3.

### 8.3 Project Cards (v1)

The universal intermediate format. v1 only writes cards via the conversational path (`source: "manual" | "conversation"`).

```json
{
  "id": "uuid",
  "title": "Project Name",
  "description": "What it does and why it matters",
  "stack": ["Svelte", "Cloudflare Workers", "D1"],
  "status": "active | archived | wip",
  "links": {
    "repo": "https://github.com/...",
    "live": "https://...",
    "docs": "https://..."
  },
  "media": ["r2://uploads/screenshot1.png"],
  "tags": ["web", "ai", "open-source"],
  "date_range": "2024-01 to present",
  "highlights": ["Built for 1000+ users", "Featured on HN"],
  "source": "manual | conversation"
}
```

---

## 9. Output Sites

### 9.1 Core Principle: Code Translates Data, Never Describes It

**The manifest is the portfolio.** Components are renderers, not containers. All content — every title, description, image path, tag, and link — lives in a structured JSON manifest. The Astro/Svelte components read the manifest and display it. They never hold content as source.

**Why this matters:**
- A non-coder can open `manifest.json`, find their project title, change it, save. Done.
- The AI editor modifies the manifest, not code. Clean separation.
- Version history is manifest snapshots — trivially diffable.
- Import/export is copying a JSON file.

### 9.2 Rendering Mode (v1: SSG Only)

v1 uses **Astro SSG** (static export). Built at publish time to static files in R2, edge-cached.

Per-request SSR with stale-while-revalidate is v2.

### 9.3 Manifest Structure (v1)

```json
{
  "version": "1.0",
  "site": {
    "title": "Jane Doe — Software Engineer",
    "description": "Full-stack developer specializing in...",
    "slug": "janedoe",
    "template": "generalist",
    "style_layer": "minimal"
  },
  "style": {
    "fonts": { "heading": "Inter", "body": "Inter" },
    "colors": { "primary": "#2563eb", "background": "#ffffff", "text": "#1f2937" },
    "spacing": "comfortable",
    "custom_css": ""
  },
  "zones": [
    {
      "id": 1,
      "label": "Hero",
      "order": 0,
      "blocks": [
        {
          "id": "b1",
          "type": "hero",
          "size": "L",
          "content": {
            "heading": "Hi, I'm Jane",
            "subheading": "I build tools for developers",
            "image": "r2://uploads/janedoe/hero.jpg",
            "cta": { "text": "See my work", "href": "#projects" }
          }
        }
      ]
    }
  ],
  "meta": {
    "og_image": "r2://assets/janedoe/og.png",
    "keywords": ["software engineer", "full-stack", "cloudflare"],
    "canonical": "https://janedoe.portfoliobuilder.com"
  }
}
```

### 9.4 What Ships (Exported)

```
dist/
├── index.html              # Rendered from manifest
├── assets/
│   ├── style.[hash].css    # Tailwind (compiled + purged)
│   └── ...
├── images/                 # Optimized user assets
├── sitemap.xml
├── robots.txt
├── llms.txt                # AI-readable index
├── llms-full.txt           # Full content dump for AI
└── manifest.json           # Source manifest (for re-import)
```

### 9.5 Interactive Islands (v1: None)

None of the v1 block types require JavaScript, so v1 portfolios ship **zero JavaScript** by default.

Interactive islands (gallery, contact form, audio player, etc.) land alongside their corresponding block types in v2.

### 9.6 AI-Readable Output (v1: llms.txt)

78% of design recruiters use AI screening before a human sees a portfolio. Output sites must be optimized for AI consumption.

**`llms.txt` (auto-generated at build time):**

Following the [llms.txt standard](https://llmstxt.org/), every output site includes a `/llms.txt` file — a curated Markdown index of the portfolio:

```markdown
# Jane Doe — Software Engineer

> Full-stack developer specializing in distributed systems and developer
> tools. 5 years of experience building for scale.

## Projects
- [Lattice](/projects/lattice): Monorepo framework powering grove.place
- [her-go](/projects/her-go): Privacy-first AI companion bot in Go

## Skills
- Languages: Go, TypeScript, Python, Svelte
- Infrastructure: Cloudflare Workers, D1, R2, Durable Objects

## Contact
- Email: jane@example.com
- GitHub: github.com/janedoe
```

**`llms-full.txt`:** A single-file dump of ALL portfolio content — every project description, skill, and bio concatenated into one Markdown document.

---

## 10. Deployment Options

### 10.1 Download Bundle (Always Free)

Export as a `.zip` containing the full `dist/` folder plus `manifest.json`. User deploys wherever they want. v1 ships the bundle plus a docs page.

Per-platform deploy wizard is v2.

### 10.2 Managed Hosting (Subdomain)

We host the site on R2, served via a Worker. User gets a subdomain: `you.portfoliobuilder.com` (domain TBD).

v1 has no billing — managed hosting is free for everyone until the loop is proven. Paid hosting (~$3/mo) is v2.

Built at publish time to static files in R2, edge-cached. Pre-warming on publish ensures first-visitor latency is low.

### 10.3 Custom Domain

v2 only. Paid (~$2/mo) via Cloudflare for SaaS.

---

## 11. Infrastructure & Data Model

### 11.1 Cloudflare Services (v1)

| Service | Role |
|---------|------|
| **Workers** | Single entry point for all requests. Serves builder app, API, and hosted portfolio sites. |
| **D1** | All queryable relational data. One database (or per-tenant if needed at scale). |
| **R2** | Binary blob storage. User uploads, generated sites, export bundles. Zero egress fees. |

Durable Objects and CF AI Gateway are v2. v1 keeps editor session state in D1 + an encrypted session cookie.

### 11.2 D1 Schema (Core Tables - v1)

```sql
-- Users & Auth
users (id, workos_id, email, display_name, created_at, updated_at)

-- Sites & Content
sites (id, user_id, name, slug, template_id, style_layer_id, status, published_at)
zones (id, site_id, order, type, label, style_overrides)
blocks (id, zone_id, order, type, size, content_json, style_overrides)
project_cards (id, user_id, title, description, stack, links, media, tags, source)

-- AI
ai_conversations (id, site_id, messages_json, help_level, created_at, updated_at)

-- Hosting
hosted_sites (id, site_id, r2_prefix, last_deployed_at)

-- Config
style_configs (id, site_id, fonts, colors, spacing, custom_css)

-- Analytics & instrumentation (v1 — load-bearing for validation)
-- Event tables for funnel events, agent metrics (turn counts,
-- tool call counts, tool failures, reply latency, dead-ends),
-- and AI cost tracking. Backed by Cloudflare Analytics Engine + D1.
```

### 11.3 R2 Structure (v1)

```
r2-bucket/
├── uploads/{user_id}/{site_id}/       # Raw user uploads
├── sites/{site_id}/dist/              # Generated static sites
├── exports/{user_id}/{export_id}.zip  # Download bundles
└── assets/{user_id}/                  # Processed/optimized assets
```

---

## 12. Auth & Identity

### 12.1 Provider: WorkOS AuthKit

- **1,000,000 MAUs free** — covers the project for years
- Native Cloudflare Workers support (Fetch API + Web Crypto, no Node deps)
- Google OAuth as primary sign-in method

### 12.2 Flow

1. User clicks "Sign in with Google"
2. Popup/redirect to Google OAuth (handled by WorkOS AuthKit)
3. Return to app with session token
4. Worker validates token on every request via WorkOS SDK
5. Session stored in encrypted cookie (httpOnly, secure, sameSite)

### 12.3 Authorization (v1)

Simple role model:

- **Free user** — can build, export, limited AI turns. v1 has no watermark and no rate-limiting tiers; everyone is on this role.
- **Admin** — platform management (internal only).

---

## 13. SEO & Accessibility

### 13.1 SEO (v1: Minimal-But-Correct)

- **Meta tags** — `<title>`, `<meta description>`
- **Open Graph** — OG tags
- **sitemap.xml** — auto-generated from page structure
- **robots.txt** — sensible defaults
- **Canonical URLs** — proper canonical for hosted sites

Auto-generated social preview images, JSON-LD structured data, AI keyword coaching, and SEO score panel are v2.

### 13.2 Accessibility (WCAG AA)

Accessibility is **load-bearing infrastructure**, not a checkbox.

- All output sites meet **WCAG 2.1 AA** by default
- bits-ui provides accessible primitives (ARIA, keyboard nav, focus management)
- Semantic HTML throughout (proper headings, landmarks, labels)
- Alt text prompts for every image ("This image needs a description")
- Keyboard navigation for all interactive components
- Screen reader testing as part of QA

Color contrast validation and A11y checker UI in the editor are v2.

**Dual purpose:** The accessibility tree doubles as the AI agent's navigation system. A well-structured a11y tree gives the agent a flat, labeled list of landmarks, headings, and components — much easier to reason about than raw HTML.

---

## 14. Tech Stack Summary

```
BUILDER APP (SaaS editor)
├─ Framework:     Astro 6 + Svelte 5 (islands architecture)
├─ UI Primitives: bits-ui v2 (headless, accessible, Svelte 5 native)
├─ Styling:       Tailwind CSS v4 (Vite plugin, CSS-based config)
├─ Validation:    Zod v4 (manifest schemas, API boundaries, tool params)
├─ Auth:          WorkOS AuthKit (1M free MAU, Google OAuth)

BACKEND (Cloudflare)
├─ Compute:       Cloudflare Workers (not Pages)
├─ Database:      D1 (relational data) via Drizzle ORM
├─ Storage:       R2 (binary blobs, zero egress)
├─ State:         D1 + session cookies (no DOs in v1)

TOOLING
├─ Package Mgr:   pnpm
├─ Language:      TypeScript 5.9 (strict mode)
├─ ORM:           Drizzle (sqlite dialect, D1 driver)
├─ Testing:       Vitest
├─ Formatting:    Prettier (astro + svelte + tailwind plugins)
├─ Linting:       ESLint

AI AGENT SYSTEM
├─ Pattern:       Multi-agent (her-go inspired, v1: driver only)
├─ Guide Agent:   Sync, user-facing chat
├─ Tool Registry: Auto-registering, per-agent active sets
├─ Provider:      OpenRouter (v1 single integration)

OUTPUT SITES (generated portfolios)
├─ Framework:     Astro SSG (static)
├─ Islands:       Svelte 5 (v1: none needed — zero JS)
├─ Styling:       Tailwind CSS (compiled + purged)
├─ Export:        Static .zip
├─ Hosting:       R2 via subdomain (built at publish time, edge-cached)
```

# Portfolio Builder — Technical Specification

> An AI-guided portfolio builder that helps people showcase their work,
> especially those who struggle to get started.

---

## Table of Contents

1. [Vision & Positioning](#vision--positioning)
2. [User Personas](#user-personas)
3. [User Flows](#user-flows)
4. [AI Agent System](#ai-agent-system)
5. [Editor Experience](#editor-experience)
6. [Zone & Block Architecture](#zone--block-architecture)
7. [Template & Style System](#template--style-system)
8. [Content Pipeline](#content-pipeline)
9. [Output Sites](#output-sites)
10. [Deployment Options](#deployment-options)
11. [Infrastructure & Data Model](#infrastructure--data-model)
12. [Auth & Identity](#auth--identity)
13. [Billing & Pricing](#billing--pricing)
14. [SEO & Accessibility](#seo--accessibility)
15. [Tech Stack Summary](#tech-stack-summary)
16. [MVP Scope](#mvp-scope)
17. [Future Phases](#future-phases)

---

## 1. Vision & Positioning

A managed, AI-guided portfolio builder for people who have the work but
struggle to present it. The AI is a **helper, not a doer** — it interviews
you, organizes your material, suggests structure, and coaches you through
every step. You stay in control of the narrative.

**Core beliefs:**

- Portfolios should take a day to build, not a month.
- The hardest part is getting started, not the technology.
- Every profession deserves purpose-built templates, not generic pages.
- The output should be fast, accessible, and yours to own.

**Relationship to the Grove ecosystem:** Standalone project. Not part of
Lattice. May support Grove/Heartwood accounts in the future (v4+), and
could integrate as a subpage in Aspen eventually, but this is its own
product with its own identity.

**Market gap:** No existing tool (Framer, Webflow, Wix, Squarespace)
offers a guided, conversational onboarding that extracts your actual work
and builds around it. They all say "describe a site" — this says "tell me
about your work." 78% of design recruiters use AI screening before human
review; no builder optimizes for this.

---

## 2. User Personas

The day-one user is **anyone who struggles to get started**, regardless of
profession. The ADHD/executive-function-block experience is the core
design constraint.

### Primary Personas

| Persona | Brings | Needs |
|---------|--------|-------|
| **Developer** | Git repos, READMEs, deploy links, code samples | Project extraction, tech stack highlighting, live demo embeds |
| **Visual Artist** | Image folders, Behance/ArtStation links, process photos | Gallery layouts, high-res display, series/collection grouping |
| **Photographer** | Photo galleries, EXIF data, series | Full-bleed image layouts, lightbox, metadata display |
| **Musician** | Audio files, SoundCloud/Spotify links, album art | Audio player blocks, discography timeline, embed support |
| **Writer** | Docs, PDFs, published bylines, blog links | Text-forward layouts, reading-friendly typography, byline cards |
| **Game Dev** | Executables, trailers, screenshots, itch.io links | Video embeds, screenshot galleries, download/play links |
| **Designer** | Figma links, case studies, brand work | Before/after sliders, case study templates, process documentation |
| **"I just have words"** | Nothing but their own description | Maximum AI guidance, conversational extraction, suggested structure |

### Experience Spectrum

- **Beginner:** Needs the wizard, full AI guidance, never touches code.
- **Intermediate:** Skips the wizard, uses drag-and-drop, asks the AI for help when stuck.
- **Power user:** Wants full control, custom zones, manual block placement, AI as a fast assistant.

## 3. User Flows

### 3.1 First-Time User (Full Guided Flow)

```
Landing Page
  → Sign in with Google (WorkOS AuthKit)
  → Welcome screen: "What do you do?"
  → Optional: wizard starts (skippable anytime)
  │
  ├─ Step 1: "Tell me about yourself"
  │   AI interviews about profession, style, goals
  │
  ├─ Step 2: "Show me your work"
  │   Upload files, paste repo URLs, or just describe projects
  │   Background agents process uploads asynchronously
  │   Everything becomes structured project cards
  │
  ├─ Step 3: "Pick a look"
  │   Choose a starter template + style layer
  │   AI suggests based on profession and content
  │
  ├─ Step 4: "Let's build"
  │   Editor opens with pre-populated zones and blocks
  │   AI highlights areas that need attention (overlay highlights)
  │   User edits, rearranges, adds content
  │
  └─ Step 5: "Ship it"
      Preview → Publish or Export
      Domain finder if needed (Forage-style)
      Deploy wizard for self-hosting options
```

### 3.2 Returning User

```
Sign in → Dashboard shows existing portfolios
  → Open editor (exact same interface as initial build)
  → AI chat sidebar available
  → Can import new projects, change templates, restructure
  → Version history: "Show me v2, that was the best one"
```

### 3.3 Export & Re-Import

```
Export:
  → Download .zip (static HTML/CSS/JS/assets + source manifest JSON)
  → Manifest preserves full editor state (zones, blocks, styles, versions)

Re-import:
  → Upload .zip → editor restores from manifest
  → OR sign in → cloud-persisted state is always there
  → OR paste external HTML → AI Import Agent analyzes and maps to zones/blocks
```

### 3.4 Post-Publish Editing (Paid)

```
Published site has "Edit" button (visible to owner only)
  → Opens the exact same builder interface
  → Same AI chat, same tools, same capabilities
  → BYOK model for ongoing AI access
```

---

## 4. AI Agent System

Inspired by the multi-agent architecture in
[her-go](https://github.com/AutumnsGrove/her-go). A driver agent
orchestrates specialist sub-agents that run in parallel.

### 4.1 Agent Overview

| Agent | Mode | Role |
|-------|------|------|
| **Guide Agent** | Sync (user-facing) | Main chat AI. Interviews, suggests, orchestrates. Calls tools to modify the editor. Responds immediately. |
| **Repo Explorer** | Async (background) | Scans git repos: README, root .md files, package manifests, docs/ folder. Produces structured project cards. |
| **HTML Import Agent** | Async (background) | Analyzes external HTML pages. Extracts content (headings, images, text, links). Maps to zone/block structure. |
| **Content Advisor** | Async (background) | Writing tips, description suggestions, keyword coaching. Only active when help dial is set to "Draft for me" or higher. |

### 4.2 Tool Registry

Each tool lives in its own module with a manifest and handler. Tools
auto-register at startup (init pattern from her-go). Both the Guide Agent
and specialist agents share the same registry but have different active
tool sets.

**Guide Agent tools (sync):**
- `add_block` — insert a block into a zone at a position
- `move_block` — reorder or relocate a block between zones
- `remove_block` — delete a block
- `update_block` — change block content or properties
- `change_style` — modify style layer or zone styling
- `add_zone` — create a new zone
- `suggest` — propose a change for user approval
- `highlight` — draw overlay highlight on an element
- `ask_user` — structured Q&A with multiple-choice options (see 4.6)
- `search_templates` — find relevant templates/components
- `trigger_explorer` — kick off a background Repo Explorer run
- `trigger_import` — kick off a background HTML Import run

**Repo Explorer tools:**
- `read_readme` — fetch and parse README from a repo URL
- `read_manifest` — parse package.json / Cargo.toml / pyproject.toml / etc.
- `read_root_files` — scan root-level .md files
- `read_docs` — optionally scan docs/ folder
- `create_project_card` — write structured project card to D1

**HTML Import Agent tools:**
- `fetch_page` — download an HTML page
- `parse_structure` — extract semantic structure (headings, sections, media)
- `map_to_zones` — propose a zone/block mapping from parsed HTML
- `extract_assets` — download and store referenced images/media

### 4.3 Turn Tracker

Coordinates parallel agent phases. Prevents UI updates from firing before
all agents complete. Same pattern as her-go's `turn.Tracker`:

```
User message arrives
  → Guide Agent phase begins (sync)
  → Guide responds to user
  → Background agents launch (Repo Explorer, HTML Import, Content Advisor)
  → Each registers a phase with the tracker
  → Tracker waits for all phases to complete
  → Session state updated, UI refreshes
```

### 4.4 AI Cost Model

- **Free tier:** Platform-provided keys with limits (N turns per session,
  cheaper models via CF AI Gateway routing). Enough to build one portfolio.
- **Paid tier:** More turns, better models, ongoing access.
- **BYOK:** Power users bring their own API keys (OpenRouter, OpenAI,
  Anthropic, Gemini, xAI). Managed via CF AI Gateway for unified routing.

Supported providers: OpenRouter, OpenAI, Anthropic, Google Gemini, xAI.
CF AI Gateway handles routing, rate limiting, response caching, and
fallback between providers.

### 4.5 Help-Level Dial

A fluid, always-visible slider in the UI:

| Level | AI Behavior |
|-------|-------------|
| **Guide me** | Asks questions, suggests structure, highlights areas. Never writes content. Pure coaching. |
| **Draft for me** | Suggests draft text ("Here's a possible description — edit it to sound like you"). User reviews and modifies. |
| **Do it for me** | AI writes content, places blocks, structures sections. User reviews and approves. |

Adjustable at any point mid-conversation. The AI adapts immediately.

### 4.6 Structured Q&A Tool (`ask_user`)

The primary interaction pattern for the Guide Agent during interviews and
decision points. Inspired by Claude Code's `AskUserQuestion` tool — the
exact pattern used to design this spec.

**Why structured Q&A over freeform chat:**
- **Reduces cognitive load** — choosing is easier than generating, especially
  for users with ADHD or decision fatigue.
- **Prevents blank-page paralysis** — the whole point of this tool is to
  help people who freeze when faced with open-ended prompts.
- **Speeds up the process** — tap an option instead of typing a paragraph.
- **Gives the AI better signal** — discrete choices are unambiguous input.

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
            "label": "Writing / content",
            "description": "Articles, blog posts, copywriting, publications"
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
- 1-4 questions per call (batched for efficiency, not overwhelming)
- 2-4 options per question
- **"Other" with freeform text is ALWAYS available** — never box the user in
- Options should have short labels (1-5 words) and helpful descriptions
- `multi_select: true` when choices aren't mutually exclusive
- The AI should mix structured Q&A (for decisions) with natural language
  chat (for open-ended exploration, storytelling, emotional support)

**When to use structured Q&A vs. freeform:**

| Use structured Q&A | Use freeform chat |
|---------------------|-------------------|
| Template/style selection | "Tell me about this project" |
| Layout decisions | "What are you most proud of?" |
| Feature toggles | "What's the story behind this work?" |
| Yes/no confirmations | Encouragement, coaching, writing tips |
| Color/font preferences | When the user is in flow and talking freely |

**UI rendering:**
- Options appear as tappable cards/chips in the chat sidebar
- Selected option highlights, freeform "Other" expands an input field
- On mobile, options render as a bottom sheet for easy thumb reach

---

## 5. Editor Experience

### 5.1 Layout

**Desktop:** Three-panel layout.
- **Left:** Chat sidebar (collapsible). AI guide lives here. Wizard steps
  appear here when active.
- **Center:** Editor canvas. Zone-based block editor with drag-and-drop.
- **Right:** Live preview (real-time updates).

**Mobile/Tablet:** Toggle between editor and preview. Chat is an overlay
sheet that slides up from the bottom.

### 5.2 Editor ↔ Preview

Side-by-side on desktop. Changes in the editor reflect instantly in the
preview. On smaller screens, a toggle switches between full-screen editor
and full-screen preview.

### 5.3 AI Editing Visualization

When the AI modifies the canvas (via tools like `add_block`, `move_block`,
`update_block`), changes are **animated in real-time**:

- Blocks slide into position (CSS transitions on zone grid)
- Text appears with a typing animation (character-by-character stream)
- Style changes morph smoothly (color/font transitions)
- The user watches it happen, like someone editing a shared Google Doc

### 5.4 Visual Guidance (Overlay Highlights)

The AI can highlight zones and elements with colored overlays:

- Pulsing border on a zone: "This is where your hero image goes"
- Subtle glow on an empty block: "This section needs content"
- Arrow annotations pointing to specific elements

Highlights are non-intrusive and disappear on click or after a timeout.

### 5.5 Version History (Git-Style Commits)

Users manually save named versions:

```
v1 — "Initial layout"
v2 — "Added project gallery"
v3 — "Tried dark theme"
v4 — "Went back to light, new hero"
```

Each version is a full JSON snapshot of the zone/block/style state, stored
in D1. The AI can:

- Compare any two versions semantically
- Reference specific versions by name ("Look at v2, that was the best")
- Cherry-pick elements from different versions
- Suggest reverting specific changes without losing others

### 5.6 Undo/Redo

Within a session, standard undo/redo (Ctrl+Z / Ctrl+Shift+Z) for
granular changes. Named versions serve as the persistent, cross-session
history.

---

## 6. Zone & Block Architecture

### 6.1 Zones

Zones are the top-level layout containers. They define **semantic regions**
of the portfolio (hero, projects, about, contact, etc.). Each zone:

- Has a numeric ID (for AI addressability: "Place this in zone 3")
- Uses CSS Grid internally
- Can be reordered via drag-and-drop
- Can be created by the user or AI (custom zones)
- Has its own style overrides (background, padding, max-width)

Templates define default zones, but users can add, remove, and reorder
freely.

### 6.2 Blocks

Blocks are the content units inside zones. Each block has:

- A **type** (text, image, gallery, project-card, etc.)
- A **semantic size**: S, M, or L
- Content-specific properties (text content, image URL, gallery items, etc.)

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

Users never think about breakpoints. They say "this is a small thing" or
"this is a big thing" and the grid handles the rest. The AI understands
these sizes natively.

### 6.4 MVP Block Types (~20)

**Content Essentials:**
- Hero / header
- Text block (rich text)
- Image (single, with caption)
- Image gallery (grid or carousel)
- Project card (thumbnail, title, description, tags, links)
- Skills / tags list
- Timeline / experience
- Contact form
- Social links
- Footer

**Media:**
- Video embed (YouTube, Vimeo, direct)
- Audio player (SoundCloud, Spotify, direct MP3)
- PDF viewer (inline)
- Code snippet (syntax highlighted)
- Testimonial / quote
- Stats / metrics display

**Interactive:**
- Before/after slider (for designers)
- 3D model viewer (GLB/GLTF)
- Interactive map
- Embedded iframe (for live demos)

---

## 7. Template & Style System

### 7.1 Architecture

Templates are composed of two independent layers:

1. **Structural templates** — define zone layouts, default block types, and
   content flow. "Photography portfolio" has different zones than "Developer
   portfolio."

2. **Style layers** — define typography, color palette, spacing, decorative
   elements. "Art Deco" is a style layer. "Minimal" is a style layer.

These are **mix-and-match**. A developer can use musician-style aesthetics.
A photographer can use a writer's clean typography. Structure and style
are independent axes.

### 7.2 Starter Templates (Structural)

Curated, profession-specific starting points:

- Developer (project grid, tech stack, GitHub activity)
- Photographer (full-bleed gallery, series view, lightbox)
- Visual Artist (portfolio grid, process documentation, exhibition list)
- Designer (case study layout, before/after, brand showcase)
- Writer (reading-focused, byline cards, publication list)
- Musician (discography timeline, audio player, tour dates)
- Game Dev (screenshot gallery, trailer embed, download links)
- Generalist (flexible multi-purpose layout)
- Minimal (single-page, text-forward)
- Creative (experimental layout, large typography, bold colors)

### 7.3 Style Layers

Independent aesthetic presets:

- Minimal — clean, lots of whitespace, system fonts
- Bold — large type, high contrast, strong colors
- Art Deco — geometric patterns, gold accents, serif fonts
- Brutalist — raw, monospace, exposed grid
- Soft — rounded corners, pastels, gentle gradients
- Dark — dark backgrounds, light text, accent colors
- Nature — earth tones, organic shapes, textured backgrounds
- Retro — pixel fonts, CRT effects, neon accents
- Professional — neutral palette, conservative typography
- Playful — bright colors, hand-drawn elements, bouncy animations

### 7.4 Custom Fonts

A curated library of web fonts users can choose from, organized by vibe.
Loaded via `@fontsource` or similar for self-hosting (no Google Fonts
dependency in output).

### 7.5 Custom Components

**Deferred to v2+.** MVP ships with the built-in block library only.
Future: users can create custom blocks in Svelte or HTML/CSS/JS.

---

## 8. Content Pipeline

### 8.1 Ingestion Paths

Two paths, both producing the same output (structured project cards):

**Path A: Bulk Upload + Background Agent (power users)**
1. User drops files or pastes a repo URL
2. Upload goes to R2
3. Background Repo Explorer or file parser runs asynchronously
4. Produces structured project cards in D1
5. Guide Agent notifies user: "I found 5 projects in your repo"

**Path B: Conversational Extraction (beginners)**
1. AI interviews the user about each project one at a time
2. User pastes links, uploads files, or just describes their work
3. AI builds project cards incrementally from conversation
4. More guided, less overwhelming

### 8.2 Supported File Formats (MVP)

| Format | Parser |
|--------|--------|
| Images (PNG, JPG, SVG, WebP) | Direct upload to R2, metadata extraction |
| Markdown / README | Parse to structured text, extract headings and links |
| HTML | AI Import Agent analysis |
| Plain text | Direct ingest |
| PDF | Text extraction for content |
| Git repo URL | Repo Explorer Agent (README + root files + manifests) |

Office formats (DOCX, PPTX, XLSX) and media formats (audio, video, 3D)
are deferred to later phases.

### 8.3 Repo Explorer Behavior

For a git repo URL, the agent reads:
- `README.md` — what the project is
- `package.json` / `Cargo.toml` / `pyproject.toml` / `go.mod` — tech stack
- `LICENSE` — open source status
- `CHANGELOG.md` — maturity signal
- Other root-level `.md` files — architecture decisions, contributing guides
- `docs/` folder (if present) — documentation depth signal

Does NOT read source code, test files, or CI configs. The goal is *what
the project does and why it matters*, not how the code works.

### 8.4 HTML Import Behavior

For external HTML (existing sites, exported pages):
1. Fetch the page
2. AI analyzes semantic structure (headings, sections, images, links)
3. Map extracted content to zone/block structure (lossy but useful)
4. Download and store referenced assets
5. Present the mapping to the user for review and adjustment

### 8.5 Project Cards

The universal intermediate format. Every ingestion path produces project
cards stored in D1:

```json
{
  "id": "uuid",
  "title": "Project Name",
  "description": "What it does and why it matters",
  "tech_stack": ["Svelte", "Cloudflare Workers", "D1"],
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
  "source": "repo_explorer | html_import | manual | conversation"
}
```

## 9. Output Sites

### 9.1 Framework

Output portfolios are **Astro SSG** sites — fully static HTML/CSS/JS with
Svelte 5 islands for interactive components. No server required. No
runtime cost. Fastest possible load times.

### 9.2 What Ships

```
dist/
├── index.html              # Main page
├── assets/
│   ├── style.[hash].css    # Tailwind (compiled + purged)
│   ├── gallery.[hash].js   # Svelte island (photo gallery)
│   ├── contact.[hash].js   # Svelte island (contact form)
│   └── ...
├── images/                 # Optimized user assets
├── sitemap.xml
├── robots.txt
└── manifest.json           # Source manifest (for re-import)
```

The `manifest.json` contains the full editor state (zones, blocks, styles,
project cards, version history) so the site can be re-imported into the
builder at any time.

### 9.3 Interactive Islands

Only components that need JavaScript get hydrated:

- **Photo gallery** — carousel, lightbox, lazy loading
- **Contact form** — validation, submission (Cloudflare Turnstile for spam)
- **Audio player** — play/pause, progress, playlist
- **Before/after slider** — drag handle comparison
- **3D model viewer** — orbit controls, zoom
- **Dark mode toggle** — theme switching

Everything else is static HTML. A portfolio with no interactive blocks
ships **zero JavaScript**.

### 9.4 Single-File Export

For users who want to add a portfolio to an existing website, the
`astro-single-file` integration can inline CSS into a single HTML file.
This is an optional export format.

### 9.5 AI-Readable Output (Markdown for Agents + llms.txt)

78% of design recruiters use AI screening before a human sees a portfolio.
Output sites must be optimized for AI consumption, not just human viewing.

**Layer 1: Cloudflare Markdown for Agents (automatic)**

Cloudflare's zone-level feature (launched March 2026). When an AI agent
sends `Accept: text/markdown`, CF's edge auto-converts the HTML to clean
Markdown and serves it directly. No code changes needed.

- Available on Pro+ plans and **SSL for SaaS** (our custom domain path)
- Strips CSS, nav, scripts, styling — preserves heading hierarchy, body
  text, links, images as Markdown references
- 80%+ token reduction (16k HTML tokens → 3k Markdown tokens)
- Response includes `x-markdown-tokens` header with estimated token count

**This is why semantic HTML matters three times over:** good for a11y,
good for the AI editor agent, AND good for Markdown conversion. Clean
`<h1>`-`<h3>` hierarchy with meaningful `<section>` elements means the
auto-converted Markdown is structured and readable.

**Layer 2: `llms.txt` (auto-generated at build time)**

Following the [llms.txt standard](https://llmstxt.org/), every output site
includes a `/llms.txt` file — a curated Markdown index of the portfolio:

```markdown
# Jane Doe — Software Engineer

> Full-stack developer specializing in distributed systems and developer
> tools. 5 years of experience building for scale.

## Projects
- [Lattice](/projects/lattice): Monorepo framework powering grove.place
- [her-go](/projects/her-go): Privacy-first AI companion bot in Go
- [Seedling](/projects/seedling): AI-powered job discovery agent

## Skills
- Languages: Go, TypeScript, Python, Svelte
- Infrastructure: Cloudflare Workers, D1, R2, Durable Objects

## Contact
- Email: jane@example.com
- GitHub: github.com/janedoe
```

**Layer 3: `llms-full.txt` (auto-generated at build time)**

A single-file dump of ALL portfolio content — every project description,
skill, experience entry, and bio concatenated into one Markdown document.
An AI screening tool can ingest the entire portfolio in a single HTTP
request.

**Implementation notes:**
- Both files are generated by the Astro build as static assets in `dist/`
- Content is sourced from the same project cards, zone/block data, and
  user profile that drive the HTML output
- Each block type has a Markdown serialization (e.g., a gallery block
  becomes a list of image links with alt text, a code snippet block
  becomes a fenced code block)
- The `manifest.json` export also includes the Markdown serializations

---

## 10. Deployment Options

### 10.1 Download Bundle (Always Free)

Export as a `.zip` containing the full `dist/` folder plus `manifest.json`.
User deploys wherever they want. We provide step-by-step guides for:

- Cloudflare Pages/Workers
- Vercel
- Netlify
- GitHub Pages

### 10.2 Managed Hosting (Paid: ~$3/mo)

We host the site on R2, served via a Worker. User gets a subdomain:
`you.portfoliobuilder.com` (domain TBD).

### 10.3 Custom Domain (Paid: ~$2/mo)

Via Cloudflare for SaaS. User CNAMEs their domain to our zone. We handle
TLS certificate provisioning and renewal automatically.

Pricing: first 100 custom hostnames free to us ($0.10/hostname after that).

### 10.4 Deploy Wizard

A guided flow that walks users through deploying to their platform of
choice:

1. Select platform (CF, Vercel, Netlify, GitHub Pages)
2. Step-by-step instructions with screenshots
3. Where possible, API integration for one-click deploy

### 10.5 Domain Finder (Built-In)

Forage-style domain discovery integrated into the publish flow:

- User enters natural language terms + vibe indicators
- AI agents swarm and check massive batches of domains via RDAP
- Results ranked by relevance, price, and availability
- Can register through Cloudflare Registrar (or link to other registrars)

---

## 11. Infrastructure & Data Model

### 11.1 Cloudflare Services

| Service | Role |
|---------|------|
| **Workers** | Single entry point for all requests. Serves builder app, API, and hosted portfolio sites. |
| **Durable Objects** | Per-session editing state. Active editor state, undo stack, AI conversation context. Hibernates when inactive. |
| **D1** | All queryable relational data. One database (or per-tenant if needed at scale). |
| **R2** | Binary blob storage. User uploads, generated sites, export bundles. Zero egress fees. |
| **CF for SaaS** | Custom domain routing. Worker reads hostname → looks up site → serves from R2. |
| **CF AI Gateway** | AI provider routing, rate limiting, response caching, fallback. |

### 11.2 D1 Schema (Core Tables)

```sql
-- Users & Auth
users (id, workos_id, email, display_name, created_at, updated_at)
api_keys (id, user_id, provider, encrypted_key, created_at)

-- Sites & Content
sites (id, user_id, name, slug, template_id, style_layer_id, status, published_at)
zones (id, site_id, order, type, label, style_overrides)
blocks (id, zone_id, order, type, size, content_json, style_overrides)
project_cards (id, user_id, title, description, tech_stack, links, media, tags, source)

-- Versions
versions (id, site_id, name, snapshot_json, created_at)

-- AI
ai_conversations (id, site_id, messages_json, help_level, created_at, updated_at)

-- Billing
subscriptions (id, user_id, stripe_customer_id, stripe_subscription_id, status, features)
purchases (id, user_id, type, stripe_payment_id, created_at)

-- Hosting & Domains
domain_mappings (id, site_id, hostname, cf_hostname_id, status, created_at)
hosted_sites (id, site_id, r2_prefix, last_deployed_at)

-- Config
style_configs (id, site_id, fonts, colors, spacing, custom_css)
```

### 11.3 R2 Structure

```
r2-bucket/
├── uploads/{user_id}/{site_id}/       # Raw user uploads
├── sites/{site_id}/dist/              # Generated static sites
├── exports/{user_id}/{export_id}.zip  # Download bundles
└── assets/{user_id}/                  # Processed/optimized assets
```

### 11.4 Durable Object (Editor Session)

One DO per active editing session. Contains:

- Current zone/block state (working copy)
- Undo/redo stack (session-scoped)
- Active AI conversation context
- Background agent phase tracking

Hibernates when the user closes the editor. Reconstituted from D1 on
next session open.

---

## 12. Auth & Identity

### 12.1 Provider: WorkOS AuthKit

- **1,000,000 MAUs free** — covers the project for years
- Native Cloudflare Workers support (Fetch API + Web Crypto, no Node deps)
- Google OAuth as primary sign-in method
- Additional social providers can be added via WorkOS dashboard

### 12.2 Flow

1. User clicks "Sign in with Google"
2. Popup/redirect to Google OAuth (handled by WorkOS AuthKit)
3. Return to app with session token
4. Worker validates token on every request via WorkOS SDK
5. Session stored in encrypted cookie (httpOnly, secure, sameSite)

### 12.3 Authorization

Simple role model:

- **Free user** — can build, export (with watermark), limited AI turns
- **Paid user** — features unlocked based on à la carte purchases
- **Admin** — platform management (internal only)

---

## 13. Billing & Pricing

### 13.1 Model: Freemium + À La Carte

Users pick what they want. No forced bundles.

### 13.2 Pricing

| Feature | Price | Type |
|---------|-------|------|
| Build + export (with watermark) | Free | — |
| Watermark removal | ~$5 | One-time |
| Managed hosting (subdomain) | ~$3/mo | Subscription |
| AI editor (post-publish) | ~$5/mo | Subscription |
| Custom domain | ~$2/mo | Subscription |
| Analytics | ~$1/mo | Subscription |
| Domain finder | Free (registration cost is user's) | — |

### 13.3 Implementation

- Stripe for all payments (subscriptions + one-time)
- Stripe Customer Portal for self-service management
- Webhook-driven status updates to D1

---

## 14. SEO & Accessibility

### 14.1 SEO (Full Suite, Auto-Generated)

Every published portfolio includes:

- **Meta tags** — title, description (AI-optimized from content)
- **Open Graph** — social preview cards with auto-generated images
- **JSON-LD** — structured data (Person, CreativeWork, WebSite schemas)
- **sitemap.xml** — auto-generated from page structure
- **robots.txt** — sensible defaults
- **Canonical URLs** — proper canonical for custom domains
- **Alt text** — AI suggests alt text for all images
- **AI keyword coaching** — "Your project description could rank better if
  you mentioned these terms"
- **SEO score** — built-in checker in the editor

### 14.2 Accessibility (WCAG AA + Active Checker)

Accessibility is **load-bearing infrastructure**, not a checkbox:

- All output sites meet **WCAG 2.1 AA** by default
- bits-ui provides accessible primitives (ARIA, keyboard nav, focus management)
- Semantic HTML throughout (proper headings, landmarks, labels)
- Color contrast validation in the editor
- Alt text prompts for every image ("This image needs a description")
- Keyboard navigation for all interactive components
- Screen reader testing as part of QA

**Dual purpose:** The accessibility tree doubles as the AI agent's
navigation system. A well-structured a11y tree gives the agent a flat,
labeled list of landmarks, headings, and components — much easier to
reason about than raw HTML.

## 15. Tech Stack Summary

```
BUILDER APP (SaaS editor)
├─ Framework:     Astro + Svelte 5 (islands architecture)
├─ UI Primitives: bits-ui (headless, accessible, Svelte 5 native)
├─ Styling:       Tailwind CSS v4
├─ Auth:          WorkOS AuthKit (1M free MAU, Google OAuth)
├─ Payments:      Stripe (subscriptions + one-time)
├─ AI Gateway:    Cloudflare AI Gateway

BACKEND (Cloudflare)
├─ Compute:       Cloudflare Workers
├─ State:         Durable Objects (per-session, SQLite backend)
├─ Database:      D1 (relational data)
├─ Storage:       R2 (binary blobs, zero egress)
├─ Domains:       Cloudflare for SaaS (custom hostnames)
├─ Rate Limiting: Durable Objects (per-user)

AI AGENT SYSTEM
├─ Pattern:       Multi-agent (driver + specialists, her-go inspired)
├─ Guide Agent:   Sync, user-facing chat
├─ Specialists:   Async background (Repo Explorer, HTML Import, Content Advisor)
├─ Tool Registry: Auto-registering, per-agent active sets
├─ Providers:     OpenRouter, OpenAI, Anthropic, Gemini, xAI (via CF AI Gateway)

OUTPUT SITES (generated portfolios)
├─ Framework:     Astro SSG (static)
├─ Islands:       Svelte 5 (interactive components only)
├─ Styling:       Tailwind CSS (compiled + purged)
├─ Export:        Static .zip or hosted on R2
├─ Single-file:   Optional via astro-single-file integration
```

---

## 16. MVP Scope

### What Ships in v1

- [ ] WorkOS AuthKit integration (Google sign-in)
- [ ] Editor: zone-based block editor with drag-and-drop
- [ ] Editor: live preview (responsive split/toggle)
- [ ] Editor: chat sidebar with Guide Agent
- [ ] Editor: wizard flow (skippable)
- [ ] Editor: overlay highlights for visual guidance
- [ ] Editor: real-time animated AI editing
- [ ] Editor: named version saves (git-style)
- [ ] Editor: help-level dial (Guide / Draft / Do it)
- [ ] Zone system: numbered, AI-addressable, custom creation
- [ ] Block system: ~20 block types (essentials + media + interactive)
- [ ] Semantic sizing: S/M/L with responsive CSS Grid
- [ ] Template system: 5-10 structural templates + 5-10 style layers
- [ ] Content pipeline: file upload (images, markdown, HTML, text, PDF)
- [ ] Content pipeline: git repo URL ingestion (Repo Explorer agent)
- [ ] Content pipeline: conversational extraction
- [ ] AI Agent: Guide Agent with editor tools
- [ ] AI Agent: Repo Explorer (background)
- [ ] AI Agent: turn tracker for parallel coordination
- [ ] Output: Astro SSG generation
- [ ] Export: .zip download (with source manifest)
- [ ] Hosting: managed hosting on subdomain
- [ ] SEO: auto-generated meta tags, OG, JSON-LD, sitemap
- [ ] Accessibility: WCAG AA baseline + active checker
- [ ] Billing: Stripe integration (watermark removal, hosting)
- [ ] Free tier: build + export with watermark

### What Does NOT Ship in v1

- Custom components (v2)
- HTML Import Agent (v2)
- Content Advisor Agent (v2)
- Custom domain support (v2)
- Domain finder / Forage integration (v2)
- Deploy wizard (v2)
- Analytics add-on (v2)
- Office format ingestion — DOCX, PPTX, XLSX (v3)
- Media format ingestion — audio, video, 3D (v3)
- Grove/Heartwood integration (v4+)
- Aspen subpage transfer (v4+)

---

## 17. Future Phases

### v2 — Expand

- HTML Import Agent (smart external site analysis)
- Content Advisor Agent (writing tips, keyword coaching)
- Custom domain support via CF for SaaS
- Domain finder (Forage-style, built into publish flow)
- Deploy wizard (CF, Vercel, Netlify, GitHub Pages)
- Analytics add-on (CF Analytics Engine, privacy-respecting)
- Custom components (Svelte + HTML/CSS/JS)
- More templates and style layers
- Social preview card generator

### v3 — Deepen

- Office format ingestion (DOCX, PPTX, XLSX)
- Media format ingestion (audio, video, 3D models)
- Multi-page portfolio support
- Collaboration (share editor access with others)
- Portfolio analytics dashboard (who's viewing, what's popular)
- A/B testing for portfolio variants
- Multi-language support

### v4 — Integrate

- Grove/Heartwood account support
- Aspen subpage transfer
- Grove ecosystem integration
- API for programmatic portfolio generation
- White-label option for agencies
- Template marketplace (community-created templates)

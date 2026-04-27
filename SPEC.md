# Portfolio Builder — Technical Specification

> An AI-guided portfolio builder that helps people showcase their work,
> especially those who struggle to get started.

> **Scope discipline note:** Features in this spec are tagged (v1),
> (v2), or (v3). v1 is the smallest scope that validates the core
> product hypothesis. Do not pull v2 or v3 features into v1 without
> explicit re-scoping. See §2 and §18 for the rationale.

---

## Table of Contents

1. [Vision & Positioning](#vision--positioning)
2. [User Personas](#user-personas)
3. [User Flows](#user-flows)
4. [AI Agent System](#ai-agent-system)
5. [App Surfaces & Routes](#app-surfaces--routes)
6. [Editor Experience](#editor-experience)
7. [Zone & Block Architecture](#zone--block-architecture)
8. [Template & Style System](#template--style-system)
9. [Content Pipeline](#content-pipeline)
10. [Output Sites](#output-sites)
11. [Deployment Options](#deployment-options)
12. [Infrastructure & Data Model](#infrastructure--data-model)
13. [Auth & Identity](#auth--identity)
14. [Billing & Pricing](#billing--pricing)
15. [SEO & Accessibility](#seo--accessibility)
16. [Tech Stack Summary](#tech-stack-summary)
17. [MVP Scope](#mvp-scope)
18. [Future Phases](#future-phases)

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

## 2. Versioned Roadmap & Acceptance Gates

This product is built solo, and scope discipline is the single biggest
risk. Features are tagged (v1), (v2), or (v3) throughout this spec.
v1 is the validation phase — minimum viable to prove the core
hypothesis. v2 expands once v1 is proven. v3 deepens once v2 is
monetized.

See sections 18, 19, 20 for the full v1/v2/v3 breakdowns and
acceptance criteria.

---

## 3. User Personas

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

## 4. User Flows

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

## 5. AI Agent System

Inspired by the multi-agent architecture in
[her-go](https://github.com/AutumnsGrove/her-go). A driver agent
orchestrates specialist sub-agents that run in parallel.

### 4.1 Agent Overview

| Agent | Mode | Role | Version |
|-------|------|------|---------|
| **Guide Agent** | Sync (user-facing) | Main chat AI. Interviews, suggests, orchestrates. Calls tools to modify the editor. Responds immediately. | (v1) |
| **Repo Explorer** | Async (background) | Scans git repos: README, root .md files, package manifests, docs/ folder. Produces structured project cards. | (v2) |
| **HTML Import Agent** | Async (background) | Analyzes external HTML pages. Extracts content (headings, images, text, links). Maps to zone/block structure. | (v2) |
| **Content Advisor** | Async (background) | Writing tips, description suggestions, keyword coaching. Only active when help dial is set to "Draft for me" or higher. | (v2) |

### 4.2 Tool Architecture

Follows the her-go pattern: each tool is its own folder with a YAML
manifest (schema, description, category) and a handler module. Tools
auto-register at startup via the init pattern. The registry is shared
across all agents, but each agent has a different **active set**.

```
agents/tools/
├── registry.ts          — tool map, Register(), Execute()
├── context.ts           — Context type with all deps
├── categories.yaml      — groups tools into categories
├── loader.ts            — loads YAML manifests, builds schemas
├── think/
│   ├── tool.yaml        — name, description, params schema, category: "hot"
│   └── handler.ts
├── reply/
│   ├── tool.yaml
│   └── handler.ts
├── done/
│   ├── tool.yaml
│   └── handler.ts
├── add_block/
│   ├── tool.yaml        — category: "blocks"
│   └── handler.ts
└── ...
```

#### Hot vs. Deferred Tools

**Hot tools** are always in the system prompt — they define the agent's
core loop. **Deferred tools** are loaded on demand via `use_tools` to
keep the base prompt small (~500 tokens of schema vs. ~4k if everything
were hot).

Tool schemas below use `*` to mark required params. Everything else is
optional with the noted defaults.

**Hot tools (always in prompt) — all (v1):**

```
think
  *thought:      string         — internal reasoning (not shown to user,
                                  visible in trace panel if expanded)
  Returns: { ok: true }

reply
  *message:      string         — markdown-formatted message to the user
   typing:       boolean        — show typing indicator first (default: true)
  Returns: { delivered: true }
  NOTE: ALL user-facing messages go through reply. The agent never
  "just talks." Every message is explicit, traceable, interceptable.

done
   reason:       string         — why the turn is ending (for traces)
  Returns: { ok: true }
  NOTE: Agent MUST call done to end every turn. The turn tracker
  uses this to know the Guide Agent is finished.

ask_user — see section 4.8 for full schema

use_tools
  *categories:   string[]       — which categories to load
  Returns: { loaded: string[], tool_count: number }
  NOTE: Loads deferred tool schemas into context for this turn.
  Categories: "blocks" (v1), "zones" (v1), "style" (v2),
  "pages" (v2), "content" (v1), "versions" (v2),
  "publish" (v1), "guidance" (v2), "preview" (v2)

get_site_state
   page:         string         — specific page slug (default: all pages)
   include:      string[]       — filter: ["zones","blocks","nav","style","meta"]
                                  (default: all)
  Returns: { manifest (filtered to requested scope) }
  NOTE: The agent's eyes. Must be hot because the agent needs to
  see the current state before almost any action.
```

**Deferred tool categories (loaded via `use_tools`):**

Category **"blocks"** (v1):
```
add_block
  *zone_id:      number         — target zone
  *type:         string         — block type ("text", "image", "project-card", etc.)
   size:         "S" | "M" | "L"    — default: "M"
   position:     number         — index within zone (default: append)
   page:         string         — page slug (default: current page)
   content:      object         — block-specific content
  Returns: { block_id, zone_id }

move_block
  *block_id:     string         — which block to move
  *to_zone_id:   number         — destination zone
   to_position:  number         — index in destination (default: append)
   to_page:      string         — move across pages (default: same page)
  Returns: { block_id, from_zone_id, to_zone_id }

remove_block
  *block_id:     string
  Returns: { removed: true, block_id }

update_block
  *block_id:     string
   size:         "S" | "M" | "L"
   content:      object         — partial merge into existing content
   style:        object         — block-level style overrides
  Returns: { block_id, updated_fields[] }
```

Category **"zones"** (v1):
```
add_zone
  *label:        string         — human name ("Projects", "Hero", etc.)
   position:     number         — order index (default: append)
   page:         string         — which page (default: current)
   style:        object         — zone-level style overrides
  Returns: { zone_id, label }

remove_zone
  *zone_id:      number
  Returns: { removed: true, zone_id, blocks_removed }

reorder_zones
  *zone_ids:     number[]       — IDs in desired order
   page:         string         — default: current
  Returns: { reordered: true, order[] }
```

Category **"style"** (v2):
```
change_style (at least one field besides zone_id required)
   style_layer:  string         — switch whole layer ("minimal", "art-deco")
   zone_id:      number         — target zone (omit for site-wide)
   fonts:        { heading?, body? }
   colors:       { primary?, background?, text?, accent? }
   spacing:      "compact" | "comfortable" | "spacious"
   custom_css:   string         — raw CSS (power users)
  Returns: { applied_to: "site" | "zone", changes[] }

apply_template
  *template_id:  string
   preserve_content: boolean    — keep content, rearrange into new zone
                                  layout (default: true)
  Returns: { applied: true, template_id, zones_created, content_preserved }

search_templates
   query:        string         — natural language ("photography gallery")
   type:         "structural" | "style" | "both"  — default: "both"
   limit:        number         — default: 5
  Returns: { results: [{ id, name, description, preview_url }] }

list_fonts
   category:     string         — "serif", "sans", "mono", "display", "handwritten"
   vibe:         string         — "art-deco", "minimal", "bold", "playful"
   limit:        number         — default: 20
  Returns: { fonts: [{ name, category, preview_url, vibe_tags[] }] }

list_style_layers
  Returns: { layers: [{ id, name, description, preview_url, vibe_tags[] }] }
```

Category **"pages"** (v2):
```
add_page
  *title:        string         — "Projects", "About", etc.
   slug:         string         — auto-generated from title if omitted
   clone_from:   string         — copy zones from existing page slug
  Returns: { slug, title, page_count }

remove_page
  *slug:         string         — cannot remove "/"
  Returns: { removed: true, slug }

update_nav
  *position:     "top" | "bottom"
  *items:        object[]       — full replacement of nav items
                   Each: { label, href, type: "internal"|"external"|"anchor", icon? }
  Returns: { position, item_count }
```

Category **"content"** (v1; `trigger_explorer` and `trigger_import` are v2 — they depend on the Repo Explorer and HTML Import agents):
```
trigger_explorer
  *url:          string         — git repo URL
   depth:        "shallow" | "standard"   — default: "shallow"
                                  shallow = README only
                                  standard = README + root files + manifests + docs/
  Returns: { job_id, status: "started" }

trigger_import
  *url:          string         — HTML page URL
   extract_assets: boolean      — download images/media (default: true)
  Returns: { job_id, status: "started" }

list_uploads
   site_id:      string         — default: current site
   type:         "image" | "document" | "all"  — default: "all"
   sort:         "recent" | "name" | "size"    — default: "recent"
   limit:        number         — default: 20
  Returns: { files: [{ path, filename, type, size, dimensions?, uploaded_at }] }

list_project_cards
   status:       "active" | "archived" | "wip" | "all"  — default: "all"
   limit:        number         — default: 20
  Returns: { cards: [{ card_id, title, description, stack, tags }] }

get_project_card
  *card_id:      string
  Returns: full project card object

create_project_card
  *title:        string
  *description:  string
   stack:        string[]       — tools/tech used (universal, not dev-specific)
   status:       "active" | "archived" | "wip"  — default: "active"
   links:        { repo?, live?, docs? }
   media:        string[]       — R2 paths or external URLs
   tags:         string[]
   date_range:   string
   highlights:   string[]
  Returns: { card_id, title }
```

Category **"versions"** (v2):
```
save_version
  *name:         string         — "v1 — initial layout"
  Returns: { version_id, name, snapshot_size }

restore_version
  *version_id:   string
  Returns: { restored: true, version_id, name }

list_versions
   site_id:      string         — default: current
   limit:        number         — default: 20
  Returns: { versions: [{ version_id, name, created_at, snapshot_size }] }

diff_versions
  *version_a:    string         — version ID
  *version_b:    string         — version ID
  Returns: { changes: [{ type: "added"|"removed"|"modified", target, details }] }
```

Category **"publish"** (v1; `target: "custom_domain"` is v2):
```
publish_site
  *site_id:      string
   target:       "subdomain" | "custom_domain"  — default: "subdomain"
  Returns: { url, status: "published", published_at }

export_site
  *site_id:      string
   format:       "zip" | "single_file"          — default: "zip"
  Returns: { download_url, size, expires_at }
```

Category **"guidance"** (v2):
```
suggest
  *description:  string         — what the suggestion is
  *actions:      object[]       — tool calls that execute if approved
   preview:      string         — markdown preview of the change
  Returns: { suggestion_id, status: "pending" }

highlight
  *target:       string         — "zone:3", "block:b12", "nav:top"
   message:      string         — tooltip text
   style:        "pulse" | "glow" | "arrow"    — default: "pulse"
   duration:     number         — seconds, 0 = until clicked (default: 10)
  Returns: { highlighted: true, target }
```

Category **"preview"** (v2):
```
set_preview
  *viewport:     "desktop" | "tablet" | "mobile" | number
                                  (number = custom width in px)
  Returns: { viewport, width }
```

**Repo Explorer tools (background, v2):**

Uses the GitHub REST API for structured data (file listing, repo metadata)
and `raw.githubusercontent.com` for file content. Unauthenticated: 60
req/hr. With a user-provided GitHub PAT (via BYOK): 5,000 req/hr. For
non-GitHub repos (GitLab, Codeberg), provider-specific adapters are
needed (deferred to v2+).

```
read_readme
  *repo_url:     string
  Returns: { content, format: "md"|"txt"|"rst", length }

read_manifest
  *repo_url:     string
   file:         string         — specific file (auto-detected if omitted)
  Returns: { name, stack[], description?, scripts? }

read_root_files
  *repo_url:     string
   extensions:   string[]       — default: [".md"]
  Returns: { files: [{ name, content, length }] }

read_docs
  *repo_url:     string
   max_files:    number         — default: 10
  Returns: { files: [{ path, content }], truncated }

create_project_card
  *title:        string
  *description:  string
   stack:        string[]       — tools/tech used (universal, not dev-specific)
   status:       "active" | "archived" | "wip"  — default: "active"
   links:        { repo?, live?, docs? }
   media:        string[]       — R2 paths or external URLs
   tags:         string[]
   date_range:   string
   highlights:   string[]
  Returns: { card_id, title }
```

**HTML Import Agent tools (background, v2):**

```
fetch_page
  *url:          string
  Returns: { html, status, content_type, length }

parse_structure
  *html:         string
  Returns: { sections: [{ tag, text, children, media }], heading_tree }

map_to_zones
  *sections:     object[]       — output from parse_structure
  Returns: { proposed_zones: [{ label, blocks: [{ type, content }] }] }

extract_assets
  *urls:         string[]       — asset URLs to download
  *site_id:      string
  Returns: { downloaded: [{ original_url, r2_path }], failed[] }
```

### 4.3 Turn Tracker (v1; full background coordination v2)

Coordinates parallel agent phases. Prevents UI updates from firing before
all agents complete. Same pattern as her-go's `turn.Tracker`. v1 only
runs the Guide Agent, so the tracker is trivial; the parallel-phase
coordination matters once background specialists land in v2.

```
User message arrives
  → Guide Agent phase begins (sync)
  → Guide responds to user
  → Background agents launch (Repo Explorer, HTML Import, Content Advisor)
  → Each registers a phase with the tracker
  → Tracker waits for all phases to complete
  → Session state updated, UI refreshes
```

### 4.4 Chat Input Model (v1)

The chat sidebar uses an **attachment-first** flow. Users compose a
message with optional file attachments, then send everything together.
Files upload to R2 on attach (no delay on send) but the agent sees
nothing until the user presses send.

```
┌──────────────────────────────────────────┐
│ [sunset.png] [studio.jpg]               │  ← attached, uploading to R2
│                                          │
│ "The first one is my best piece, the    │
│  second is my studio setup"             │
│                                          │
│                             [Send ▶]     │
└──────────────────────────────────────────┘
```

The agent receives ONE message with text + attachments:

```json
{
  "text": "The first one is my best piece, the second is my studio setup",
  "attachments": [
    {
      "path": "r2://uploads/jane/site_abc/sunset.png",
      "filename": "sunset.png",
      "type": "image/png",
      "size": 2100000,
      "dimensions": [3200, 2400]
    },
    {
      "path": "r2://uploads/jane/site_abc/studio.jpg",
      "filename": "studio.jpg",
      "type": "image/jpeg",
      "size": 1800000,
      "dimensions": [2400, 1600]
    }
  ]
}
```

No orphan uploads. No guessing what an image is for. The agent gets
files AND context in one atomic message.

### 4.5 Trace System (v1)

Agent activity is displayed in the chat as collapsible trace blocks,
similar to how Claude Code shows thinking and tool calls. This serves
two purposes: user reassurance ("the agent is working") and developer
debugging.

```
Default view (collapsed):
┌─────────────────────────────────────┐
│  ▸ Thinking...                      │
│  ▸ Reading current site state       │
│  ▸ Loading block editing tools      │
│  ▸ Adding project card to zone 2    │
└─────────────────────────────────────┘

Expanded view (click any line):
┌─────────────────────────────────────┐
│  ▾ Thinking...                      │
│    "User wants to add a project.    │
│     I should check get_site_state   │
│     to see what zones exist first." │
│                                     │
│  ▾ Reading current site state       │
│    get_site_state({ page: "/" })    │
│    → 3 zones: Hero, Projects, Bio  │
│                                     │
│  ▾ Loading block editing tools      │
│    use_tools({ categories:          │
│      ["blocks"] })                  │
│    → Loaded 4 tools                 │
│                                     │
│  ▾ Adding project card to zone 2    │
│    add_block({ zone_id: 2,          │
│      type: "project-card",          │
│      size: "M", content: {...} })   │
│    → { block_id: "b7", zone_id: 2 }│
└─────────────────────────────────────┘
```

Each trace entry maps to a tool call:
- `think` → shows reasoning (collapsed by default, expandable)
- `use_tools` → "Loading [category] tools"
- `get_site_state` → "Reading current site state"
- Any deferred tool → shows the tool name and summarized result
- `reply` → the actual message (always visible, never collapsed)
- `done` → not shown (internal signal)

Background agent activity (Repo Explorer, HTML Import) appears as a
separate trace block: "Exploring github.com/jane/cool-app..." with
progress updates as each sub-tool completes.

### 4.6 AI Cost Model

- **Free tier (v1):** Platform-provided OpenRouter key with limits (N
  turns per session, cheaper models). Enough to build one portfolio.
  v1 hardcodes a single provider — OpenRouter — to keep the debug
  surface small while still allowing model experimentation behind that
  one API.
- **Paid tier (v2):** More turns, better models, ongoing access.
- **BYOK (v2):** Power users bring their own API keys (OpenRouter,
  OpenAI, Anthropic, Gemini, xAI). Managed via CF AI Gateway for
  unified routing.

Supported providers (v2): OpenRouter, OpenAI, Anthropic, Google Gemini,
xAI. CF AI Gateway handles routing, rate limiting, response caching,
and fallback between providers. v1 ships with OpenRouter only and no
CF AI Gateway in front of it.

### 4.7 Help-Level Dial

A fluid, always-visible slider in the UI. v1 ships two levels — the
middle "Draft for me" tier is added in v2 only if v1 data shows users
actually want it.

| Level | AI Behavior | Version |
|-------|-------------|---------|
| **Guide me** | Asks questions, suggests structure, highlights areas. Never writes content. Pure coaching. | (v1) |
| **Draft for me** | Suggests draft text ("Here's a possible description — edit it to sound like you"). User reviews and modifies. | (v2) |
| **Do it for me** | AI writes content, places blocks, structures sections. User reviews and approves. | (v1) |

Adjustable at any point mid-conversation. The AI adapts immediately.

### 4.8 Structured Q&A Tool (`ask_user`) (v1)

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

## 6. App Surfaces & Routes

The application has four distinct surfaces, each with its own layout,
auth requirements, and routing.

### 5.1 Landing Page (Public)

```
Route: /
Auth:  None
```

Marketing site. What the product is, showcase examples, sign-in CTA.
Fully static, no interactivity beyond the sign-in button.

### 5.2 Dashboard (Authenticated)

```
Routes:
  /dashboard              — Portfolio list, create new
  /dashboard/settings     — Account: display name, email, preferences
  /dashboard/billing      — Stripe Customer Portal, current plan, purchases
  /dashboard/api-keys     — BYOK management (OpenRouter, OpenAI, Anthropic, etc.)
Auth: Required (WorkOS AuthKit, Google OAuth)
```

The home base after sign-in. Shows all your portfolios with status
(draft / published), quick actions (edit, preview, publish, export),
and links to account management.

### 5.3 Editor (Authenticated, Per-Site)

```
Route: /edit/:site-id
Auth:  Required (must own the site)
```

The core product. Three-panel layout (chat + canvas + preview) on
desktop, toggle on mobile. Same interface for first-time builds AND
returning edits. Contains:

- Chat sidebar with Guide Agent
- Wizard flow (skippable/summonable)
- Zone/block canvas with drag-and-drop
- Live preview with responsive toggle
- Template/style picker
- Version history
- Help-level dial
- Page management (add/remove/reorder pages, edit nav)

### 5.4 Published Site (Public, Separate Origin)

```
Routes:
  you.portfoliobuilder.com/*    — Managed hosting (subdomain)
  yourcustomdomain.com/*        — CF for SaaS (custom domain)
Auth: None (public). "Edit" button visible to owner via session cookie.
```

SSR from manifest, cached at edge with stale-while-revalidate. Includes
`llms.txt`, `llms-full.txt`, and `manifest.json`. Owner sees an "Edit"
button that redirects back to `/edit/:site-id` on the builder app.

---

## 7. Editor Experience

### 6.1 Layout (v1)

**Desktop:** Three-panel layout.
- **Left:** Chat sidebar (collapsible). AI guide lives here. Wizard steps
  appear here when active.
- **Center:** Editor canvas. Zone-based block editor. v1 reorders blocks
  via up/down buttons; drag-and-drop is v2.
- **Right:** Live preview (real-time updates).

**Mobile/Tablet:** Toggle between editor and preview. Chat is an overlay
sheet that slides up from the bottom.

### 6.2 Editor ↔ Preview (v1)

Side-by-side on desktop. Changes in the editor reflect instantly in the
preview. On smaller screens, a toggle switches between full-screen editor
and full-screen preview.

### 6.3 AI Editing Visualization (v2)

When the AI modifies the canvas (via tools like `add_block`, `move_block`,
`update_block`), changes are **animated in real-time**:

- Blocks slide into position (CSS transitions on zone grid)
- Text appears with a typing animation (character-by-character stream)
- Style changes morph smoothly (color/font transitions)
- The user watches it happen, like someone editing a shared Google Doc

v1 just rerenders the canvas after each tool call — no animation. The
animated experience is a v2 polish layer once the core loop is proven.

### 6.4 Visual Guidance (Overlay Highlights) (v2)

The AI can highlight zones and elements with colored overlays:

- Pulsing border on a zone: "This is where your hero image goes"
- Subtle glow on an empty block: "This section needs content"
- Arrow annotations pointing to specific elements

Highlights are non-intrusive and disappear on click or after a timeout.
Backed by the `highlight` tool in the "guidance" category, which is v2.

### 6.5 Version History (Git-Style Commits) (v2)

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

### 6.6 Undo/Redo

Within a session, standard undo/redo (Ctrl+Z / Ctrl+Shift+Z) for
granular changes. Session-scoped undo/redo ships in (v1). Named versions
that serve as persistent, cross-session history are (v2).

---

## 8. Zone & Block Architecture

### 7.1 Zones (v1)

Zones are the top-level layout containers. They define **semantic regions**
of the portfolio (hero, projects, about, contact, etc.). Each zone:

- Has a numeric ID (for AI addressability: "Place this in zone 3")
- Uses CSS Grid internally
- Can be reordered (v1: up/down buttons; v2: drag-and-drop)
- Can be created by the user or AI (custom zones)
- Has its own style overrides (background, padding, max-width)

Templates define default zones, but users can add, remove, and reorder
freely. Zones are the fundamental layout primitive — the AI must be
able to add, remove, and reorder them from v1.

### 7.2 Blocks (v1)

Blocks are the content units inside zones. Each block has:

- A **type** (text, image, gallery, project-card, etc.)
- A **semantic size**: S, M, or L
- Content-specific properties (text content, image URL, gallery items, etc.)

### 7.3 Responsive Grid (Semantic Sizing) (v1)

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

### 7.4 Block Types

v1 ships seven block types — the smallest set that lets a user build a
recognizable portfolio. The remaining types ship in v2 once the core
loop is proven.

**Content Essentials:**
- Hero / header (v1)
- Text block (rich text) (v1)
- Image (single, with caption) (v1)
- Image gallery (grid or carousel) (v2)
- Project card (thumbnail, title, description, tags, links) (v1)
- Skills / tags list (v2)
- Timeline / experience (v2)
- Contact form (v2)
- Social links (v1)
- Footer (v1)
- Spacer (v1) — empty block for layout breathing room. Takes S/M/L
  sizing like any other block. Optional `as_divider: true` flag renders
  it as a horizontal rule. Lets users and the AI compose asymmetric
  layouts and vertical rhythm without forcing every cell to have
  content.

**Media:**
- Video embed (YouTube, Vimeo, direct) (v2)
- Audio player (SoundCloud, Spotify, direct MP3) (v2)
- PDF viewer (inline) (v2)
- Code snippet (syntax highlighted) (v2)
- Testimonial / quote (v2)
- Stats / metrics display (v2)

**Interactive:**
- Before/after slider (for designers) (v2)
- 3D model viewer (GLB/GLTF) (v2 — viewer only; GLB/GLTF file
  ingestion is v3)
- Interactive map (v2)
- Embedded iframe (for live demos) (v2)

### 7.5 Multi-Page Support (v2)

v1 is single-page only — anchor nav (`#projects`, `#about`, `#contact`)
covers most portfolios and removes a whole class of routing, nav, and
SEO complexity from the validation phase.

Portfolios can have multiple pages, each with its own set of zones and
blocks. Pages are tiered by plan:

| Plan | Pages |
|------|-------|
| Free | 1 page (single-page portfolio with anchor nav) |
| Paid | Up to 10 pages |

Each page has:
- A URL slug (`/projects`, `/about`, `/contact`)
- Its own zone set (independent layout per page)
- A title and optional description (for nav labels and SEO)

Pages are managed in the editor via a page list panel. The AI can
create, rename, and reorder pages via tools.

### 7.6 Navigation

Every portfolio has a top nav (header) and bottom nav (footer). Nav
items can be:

| Type | Example | Behavior | Version |
|------|---------|----------|---------|
| **Internal page** | `/projects` | Navigate within the portfolio | (v2) |
| **Anchor link** | `#skills` | Scroll to a section on the current page | (v1) |
| **External link** | `ko-fi.com/jane` | Open in new tab | (v1) |

**Responsive behavior:**
- Desktop: horizontal nav bar with all items visible
- When items exceed available width: overflow into a hamburger menu
- Mobile: always hamburger menu (slide-out drawer or bottom sheet)

**Manifest structure for nav:**

```json
{
  "nav": {
    "top": [
      { "label": "Projects", "href": "/projects", "type": "internal" },
      { "label": "About", "href": "/about", "type": "internal" },
      { "label": "Music", "href": "https://soundcloud.com/jane", "type": "external" },
      { "label": "Support", "href": "https://ko-fi.com/jane", "type": "external" }
    ],
    "bottom": [
      { "label": "GitHub", "href": "https://github.com/jane", "type": "external", "icon": "github" },
      { "label": "Email", "href": "mailto:jane@example.com", "type": "external", "icon": "mail" }
    ]
  },
  "pages": [
    {
      "slug": "/",
      "title": "Home",
      "zones": [ ... ]
    },
    {
      "slug": "/projects",
      "title": "Projects",
      "zones": [ ... ]
    }
  ]
}
```

The footer also includes a social icons row and the watermark/attribution
line (v2 — removable on paid plans). v1 has no watermark and no paid
plans, so the footer just shows attribution if anything.

---

## 9. Template & Style System

### 8.1 Architecture (v1)

Templates are composed of two independent layers:

1. **Structural templates** — define zone layouts, default block types, and
   content flow. "Photography portfolio" has different zones than "Developer
   portfolio."

2. **Style layers** — define typography, color palette, spacing, decorative
   elements. "Art Deco" is a style layer. "Minimal" is a style layer.

These are **mix-and-match**. A developer can use musician-style aesthetics.
A photographer can use a writer's clean typography. Structure and style
are independent axes.

### 8.2 Starter Templates (Structural)

Curated, profession-specific starting points. v1 ships only Generalist
and starts every user there — no template picker UI in v1; the AI
evolves the layout through conversation. The rest land in v2.

- Developer (project grid, tech stack, GitHub activity) (v2)
- Photographer (full-bleed gallery, series view, lightbox) (v2)
- Visual Artist (portfolio grid, process documentation, exhibition list) (v2)
- Designer (case study layout, before/after, brand showcase) (v2)
- Writer (reading-focused, byline cards, publication list) (v2)
- Musician (discography timeline, audio player, tour dates) (v2)
- Game Dev (screenshot gallery, trailer embed, download links) (v2)
- Generalist (flexible multi-purpose layout) (v1) — default zones:
  Hero, Projects, About, Contact, Footer. Zones are fully manipulatable
  from day one; the default set is a starting point, not a constraint.
- Minimal (single-page, text-forward) (v2)
- Creative (experimental layout, large typography, bold colors) (v2)

### 8.3 Style Layers

Independent aesthetic presets. v1 ships only Minimal — same logic as
the structural templates: validate the loop before expanding the menu.

- Minimal — clean, lots of whitespace, system fonts (v1)
- Bold — large type, high contrast, strong colors (v2)
- Art Deco — geometric patterns, gold accents, serif fonts (v2)
- Brutalist — raw, monospace, exposed grid (v2)
- Soft — rounded corners, pastels, gentle gradients (v2)
- Dark — dark backgrounds, light text, accent colors (v2)
- Nature — earth tones, organic shapes, textured backgrounds (v2)
- Retro — pixel fonts, CRT effects, neon accents (v2)
- Professional — neutral palette, conservative typography (v2)
- Playful — bright colors, hand-drawn elements, bouncy animations (v2)

### 8.4 Custom Fonts (v2)

A curated library of web fonts users can choose from, organized by vibe.
Loaded via `@fontsource` or similar for self-hosting (no Google Fonts
dependency in output).

### 8.5 Custom Components (v2+)

**Deferred to v2+.** v1 ships with the built-in block library only.
Future: users can create custom blocks in Svelte or HTML/CSS/JS.

---

## 10. Content Pipeline

### 9.1 Ingestion Paths

Two paths, both producing the same output (structured project cards):

**Path A: Bulk Upload + Background Agent (power users) (v2)**
1. User drops files or pastes a repo URL
2. Upload goes to R2
3. Background Repo Explorer or file parser runs asynchronously
4. Produces structured project cards in D1
5. Guide Agent notifies user: "I found 5 projects in your repo"

**Path B: Conversational Extraction (beginners) (v1)**
1. AI interviews the user about each project one at a time
2. User pastes links, uploads files (images), or just describes their work
3. AI builds project cards incrementally from conversation
4. More guided, less overwhelming

v1 ships Path B only. Bulk upload and repo URL ingestion ride on the
Repo Explorer / HTML Import agents, which are v2.

### 9.2 Supported File Formats

| Format | Parser | Version |
|--------|--------|---------|
| Images (PNG, JPG, SVG, WebP) | Direct upload to R2, metadata extraction | (v1) |
| Markdown / README | Parse to structured text, extract headings and links | (v2) |
| HTML | AI Import Agent analysis | (v2) |
| Plain text | Direct ingest | (v2) |
| PDF | Text extraction for content | (v2) |
| Git repo URL | Repo Explorer Agent (README + root files + manifests) | (v2) |

Office formats (DOCX, PPTX, XLSX) (v3) and media formats (audio, video,
3D — GLB/GLTF) (v3) are deferred to later phases.

### 9.3 Repo Explorer Behavior (v2)

For a git repo URL, the agent reads:
- `README.md` — what the project is
- `package.json` / `Cargo.toml` / `pyproject.toml` / `go.mod` — tech stack
- `LICENSE` — open source status
- `CHANGELOG.md` — maturity signal
- Other root-level `.md` files — architecture decisions, contributing guides
- `docs/` folder (if present) — documentation depth signal

Does NOT read source code, test files, or CI configs. The goal is *what
the project does and why it matters*, not how the code works.

### 9.4 HTML Import Behavior (v2)

For external HTML (existing sites, exported pages):
1. Fetch the page
2. AI analyzes semantic structure (headings, sections, images, links)
3. Map extracted content to zone/block structure (lossy but useful)
4. Download and store referenced assets
5. Present the mapping to the user for review and adjustment

### 9.5 Project Cards (v1)

The universal intermediate format. Every ingestion path produces project
cards stored in D1. v1 only writes cards via the conversational path
(`source: "manual" | "conversation"`); the `repo_explorer` and
`html_import` sources land with their respective agents in v2.

```json
{
  "id": "uuid",
  "title": "Project Name",
  "description": "What it does and why it matters",
  "stack": ["Svelte", "Cloudflare Workers", "D1"],  // or: ["Procreate", "Watercolors"] for an artist
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

## 11. Output Sites

### 10.1 Core Principle: Code Translates Data, Never Describes It (v1)

**The manifest is the portfolio.** Components are renderers, not
containers. All content — every title, description, image path, tag, and
link — lives in a structured JSON manifest. The Astro/Svelte components
read the manifest and display it. They never hold content as source.

**Why this matters:**
- A non-coder can open `manifest.json`, find their project title, change
  it, save. Done. No Svelte knowledge, no file hunting.
- The AI editor modifies the manifest, not code. Clean separation.
- Version history is manifest snapshots — trivially diffable.
- Import/export is copying a JSON file.
- The same manifest powers both hosted (SSR) and exported (SSG) sites.

**The manifest is JSON internally.** Non-coders never need to touch it
raw — the builder provides a clean, labeled web UI for editing. Power
users who want to hand-edit JSON can.

### 10.2 Two Rendering Modes

| Mode | When | How | Version |
|------|------|-----|---------|
| **SSR (hosted sites)** | User's site is hosted by us (subdomain or custom domain) | Worker reads manifest from D1/R2 → Astro renders on request → cached at edge | (v2) |
| **SSG (exported sites)** | User downloads .zip or self-deploys | Manifest baked into static HTML at build time → no server needed | (v1) |

Both modes use the same Astro components and Svelte islands. The only
difference is where the manifest comes from (D1 vs. baked-in).

> [agent: confirm v1 or v2?] — v1 spec lists "Astro SSG only" under
> Output but also describes hosted sites as "Worker reads manifest
> from D1, renders Astro, caches at edge" with pre-warm on publish.
> Read here as: v1 hosted subdomain sites are built at publish time
> to static files in R2 and edge-cached; per-request SSR with
> stale-while-revalidate is v2.

**Caching strategy for SSR (stale-while-revalidate) (v2):**
- First request: render from manifest, cache at the edge
- Subsequent requests: serve cached version immediately
- When manifest changes (user publishes): revalidate in the background
- Visitors always get near-static speed, edits propagate within seconds

### 10.3 Manifest Structure (v1)

```json
{
  "version": "1.0",
  "site": {
    "title": "Jane Doe — Software Engineer",
    "description": "Full-stack developer specializing in...",
    "slug": "janedoe",
    "template": "developer",
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
      "style_overrides": {},
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
    },
    {
      "id": 2,
      "label": "Projects",
      "order": 1,
      "blocks": [
        {
          "id": "b2",
          "type": "project-card",
          "size": "M",
          "content": {
            "title": "Lattice",
            "description": "Monorepo framework powering grove.place",
            "stack": ["Svelte", "Cloudflare Workers"],
            "links": { "repo": "https://github.com/...", "live": "https://..." },
            "image": "r2://uploads/janedoe/lattice-thumb.png"
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

Every field is a plain string, array, or nested object. No code, no
markup, no framework syntax. A non-technical user can scan this and
understand what maps to what — or better, use the web UI and never see
it at all.

### 10.4 What Ships (Exported) (v1)

```
dist/
├── index.html              # Rendered from manifest
├── assets/
│   ├── style.[hash].css    # Tailwind (compiled + purged)
│   ├── gallery.[hash].js   # Svelte island (photo gallery)
│   ├── contact.[hash].js   # Svelte island (contact form)
│   └── ...
├── images/                 # Optimized user assets
├── sitemap.xml
├── robots.txt
├── llms.txt                # AI-readable index
├── llms-full.txt           # Full content dump for AI
└── manifest.json           # Source manifest (for re-import + hand-editing)
```

### 10.5 Interactive Islands

Only components that need JavaScript get hydrated. None of the v1 block
types require JS, so v1 portfolios ship zero JavaScript by default. The
islands below land alongside their corresponding block types in v2.

- **Photo gallery** — carousel, lightbox, lazy loading (v2)
- **Contact form** — validation, submission (Cloudflare Turnstile for spam) (v2)
- **Audio player** — play/pause, progress, playlist (v2)
- **Before/after slider** — drag handle comparison (v2)
- **3D model viewer** — orbit controls, zoom (v2)
- **Dark mode toggle** — theme switching (v2)

Everything else is static HTML. A portfolio with no interactive blocks
ships **zero JavaScript**.

### 10.6 Single-File Export (v2)

For users who want to add a portfolio to an existing website, the
`astro-single-file` integration can inline CSS into a single HTML file.
This is an optional export format.

### 10.7 AI-Readable Output (Markdown for Agents + llms.txt)

78% of design recruiters use AI screening before a human sees a portfolio.
Output sites must be optimized for AI consumption, not just human viewing.

**Layer 1: Cloudflare Markdown for Agents (automatic)**

> [agent: confirm v1 or v2?] — feature is automatic at the CF zone
> level on Pro+ plans and SSL for SaaS. v1 only ships the subdomain
> path; SSL for SaaS is v2. If our v1 zone is on Pro+, this layer is
> effectively v1; otherwise treat as v2 alongside custom domains.

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

**Layer 2: `llms.txt` (auto-generated at build time) (v1)**

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

**Layer 3: `llms-full.txt` (auto-generated at build time) (v1)**

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

## 12. Deployment Options

### 10.1 Download Bundle (Always Free) (v1)

Export as a `.zip` containing the full `dist/` folder plus `manifest.json`.
User deploys wherever they want. v1 ships the bundle plus a docs page;
the per-platform deploy wizard below is v2.

- Cloudflare Pages/Workers
- Vercel
- Netlify
- GitHub Pages

### 10.2 Managed Hosting (Subdomain) (v1)

We host the site on R2, served via a Worker. User gets a subdomain:
`you.portfoliobuilder.com` (domain TBD). v1 has no billing — managed
hosting is free for everyone until the loop is proven. The ~$3/mo
price is a v2 plan once Stripe lands.

### 10.3 Custom Domain (v2)

Paid: ~$2/mo. Via Cloudflare for SaaS. User CNAMEs their domain to our
zone. We handle TLS certificate provisioning and renewal automatically.

Pricing: first 100 custom hostnames free to us ($0.10/hostname after that).

### 10.4 Deploy Wizard (v2)

A guided flow that walks users through deploying to their platform of
choice:

1. Select platform (CF, Vercel, Netlify, GitHub Pages)
2. Step-by-step instructions with screenshots
3. Where possible, API integration for one-click deploy

### 10.5 Domain Finder (Built-In) (v2)

Forage-style domain discovery integrated into the publish flow:

- User enters natural language terms + vibe indicators
- AI agents swarm and check massive batches of domains via RDAP
- Results ranked by relevance, price, and availability
- Can register through Cloudflare Registrar (or link to other registrars)

---

## 13. Infrastructure & Data Model

### 11.1 Cloudflare Services

| Service | Role | Version |
|---------|------|---------|
| **Workers** | Single entry point for all requests. Serves builder app, API, and hosted portfolio sites. | (v1) |
| **Durable Objects** | Per-session editing state. Active editor state, undo stack, AI conversation context. Hibernates when inactive. | (v2) |
| **D1** | All queryable relational data. One database (or per-tenant if needed at scale). | (v1) |
| **R2** | Binary blob storage. User uploads, generated sites, export bundles. Zero egress fees. | (v1) |
| **CF for SaaS** | Custom domain routing. Worker reads hostname → looks up site → serves from R2. | (v2) |
| **CF AI Gateway** | AI provider routing, rate limiting, response caching, fallback. | (v2) |

v1 keeps editor session state in D1 + an encrypted session cookie. DOs
arrive in v2 only if scale demands them.

### 11.2 D1 Schema (Core Tables)

Tables marked `-- v2` aren't created in v1; their features ship later.

```sql
-- Users & Auth
users (id, workos_id, email, display_name, created_at, updated_at)         -- v1
api_keys (id, user_id, provider, encrypted_key, created_at)                -- v2 (BYOK)

-- Sites & Content
sites (id, user_id, name, slug, template_id, style_layer_id, status, published_at)  -- v1
zones (id, site_id, order, type, label, style_overrides)                   -- v1
blocks (id, zone_id, order, type, size, content_json, style_overrides)     -- v1
project_cards (id, user_id, title, description, stack, links, media, tags, source)  -- v1

-- Versions
versions (id, site_id, name, snapshot_json, created_at)                    -- v2 (named history)

-- AI
ai_conversations (id, site_id, messages_json, help_level, created_at, updated_at)   -- v1

-- Billing
subscriptions (id, user_id, stripe_customer_id, stripe_subscription_id, status, features)  -- v2
purchases (id, user_id, type, stripe_payment_id, created_at)               -- v2

-- Hosting & Domains
domain_mappings (id, site_id, hostname, cf_hostname_id, status, created_at)  -- v2 (custom domains)
hosted_sites (id, site_id, r2_prefix, last_deployed_at)                    -- v1

-- Config
style_configs (id, site_id, fonts, colors, spacing, custom_css)            -- v1

-- Analytics & instrumentation (v1 — load-bearing for validation)
-- A few event tables for funnel events, agent metrics (turn counts,
-- tool call counts, tool failures, reply latency, dead-ends), and
-- AI cost tracking. Backed by Cloudflare Analytics Engine + D1.
-- Exact column shape TBD; see §18 for the v1 instrumentation list.
```

### 11.3 R2 Structure (v1)

```
r2-bucket/
├── uploads/{user_id}/{site_id}/       # Raw user uploads
├── sites/{site_id}/dist/              # Generated static sites
├── exports/{user_id}/{export_id}.zip  # Download bundles
└── assets/{user_id}/                  # Processed/optimized assets
```

### 11.4 Durable Object (Editor Session) (v2)

One DO per active editing session. Contains:

- Current zone/block state (working copy)
- Undo/redo stack (session-scoped)
- Active AI conversation context
- Background agent phase tracking

Hibernates when the user closes the editor. Reconstituted from D1 on
next session open.

v1 keeps this state in D1 directly + an encrypted session cookie — DOs
only land in v2 if scale demands them.

---

## 14. Auth & Identity

### 12.1 Provider: WorkOS AuthKit (v1)

- **1,000,000 MAUs free** — covers the project for years
- Native Cloudflare Workers support (Fetch API + Web Crypto, no Node deps)
- Google OAuth as primary sign-in method
- Additional social providers can be added via WorkOS dashboard

### 12.2 Flow (v1)

1. User clicks "Sign in with Google"
2. Popup/redirect to Google OAuth (handled by WorkOS AuthKit)
3. Return to app with session token
4. Worker validates token on every request via WorkOS SDK
5. Session stored in encrypted cookie (httpOnly, secure, sameSite)

### 12.3 Authorization

Simple role model:

- **Free user (v1)** — can build, export, limited AI turns. v1 has no
  watermark and no rate-limiting tiers; everyone is on this role.
- **Paid user (v2)** — features unlocked based on subscription / à la
  carte purchases.
- **Admin (v1)** — platform management (internal only).

---

## 15. Billing & Pricing

**Entire section: (v2).** v1 has no billing — the product is free for
everyone until the loop is proven and v1 acceptance gates pass. The
shape below is the planned v2 model.

### 13.1 Model: Freemium + À La Carte (v2)

Users pick what they want. No forced bundles.

### 13.2 Pricing (v2)

| Feature | Price | Type |
|---------|-------|------|
| Build + export (with watermark) | Free | — |
| Watermark removal | ~$5 | One-time |
| Managed hosting (subdomain) | ~$3/mo | Subscription |
| AI editor (post-publish) | ~$5/mo | Subscription |
| Custom domain | ~$2/mo | Subscription |
| Analytics | ~$1/mo | Subscription |
| Domain finder | Free (registration cost is user's) | — |

### 13.3 Implementation (v2)

- Stripe for all payments (subscriptions + one-time)
- Stripe Customer Portal for self-service management
- Webhook-driven status updates to D1

---

## 16. SEO & Accessibility

### 14.1 SEO (Auto-Generated)

v1 ships the minimal-but-correct slice; the polish layers (JSON-LD, AI
coaching, SEO score panel, AI alt text) land in v2.

- **Meta tags** — `<title>`, `<meta description>` (v1)
- **Open Graph** — OG tags (v1); auto-generated social preview images (v2)
- **JSON-LD** — structured data (Person, CreativeWork, WebSite schemas) (v2)
- **sitemap.xml** — auto-generated from page structure (v1)
- **robots.txt** — sensible defaults (v1)
- **Canonical URLs** — proper canonical for hosted/custom domains (v1)
- **Alt text** — AI suggests alt text for all images (v2); v1 prompts
  the user to write alt text for any uploaded image
- **AI keyword coaching** — "Your project description could rank better if
  you mentioned these terms" (v2)
- **SEO score** — built-in checker in the editor (v2)

### 14.2 Accessibility (WCAG AA + Active Checker)

Accessibility is **load-bearing infrastructure**, not a checkbox. v1
enforces a11y in components but doesn't ship a checker UI in the editor
yet — that comes with the editor surface in v2.

- All output sites meet **WCAG 2.1 AA** by default (v1)
- bits-ui provides accessible primitives (ARIA, keyboard nav, focus management) (v1)
- Semantic HTML throughout (proper headings, landmarks, labels) (v1)
- Color contrast validation in the editor (v2)
- Alt text prompts for every image ("This image needs a description") (v1)
- Keyboard navigation for all interactive components (v1)
- Screen reader testing as part of QA (v1)
- A11y checker UI in the editor (v2)

**Dual purpose:** The accessibility tree doubles as the AI agent's
navigation system. A well-structured a11y tree gives the agent a flat,
labeled list of landmarks, headings, and components — much easier to
reason about than raw HTML.

## 17. Tech Stack Summary

```
BUILDER APP (SaaS editor)
├─ Framework:     Astro 6 + Svelte 5 (islands architecture)         (v1)
├─ UI Primitives: bits-ui v2 (headless, accessible, Svelte 5 native) (v1)
├─ Styling:       Tailwind CSS v4 (Vite plugin, CSS-based config)    (v1)
├─ Validation:    Zod v4 (manifest schemas, API boundaries, tool params) (v1)
├─ Auth:          WorkOS AuthKit (1M free MAU, Google OAuth)         (v1)
├─ Payments:      Stripe (subscriptions + one-time)                  (v2)
├─ AI Gateway:    Cloudflare AI Gateway                              (v2)

BACKEND (Cloudflare)
├─ Compute:       Cloudflare Workers (not Pages)                     (v1)
├─ State:         Durable Objects (per-session, SQLite backend)      (v2 — v1 uses D1 + session cookies)
├─ Database:      D1 (relational data) via Drizzle ORM               (v1)
├─ Storage:       R2 (binary blobs, zero egress)                     (v1)
├─ Domains:       Cloudflare for SaaS (custom hostnames)             (v2)
├─ Rate Limiting: Durable Objects (per-user)                         (v2)

TOOLING                                                              (v1)
├─ Package Mgr:   pnpm
├─ Language:      TypeScript 5.9 (strict mode)
├─ ORM:           Drizzle (sqlite dialect, D1 driver)
├─ Testing:       Vitest
├─ Formatting:    Prettier (astro + svelte + tailwind plugins)
├─ Linting:       ESLint

AI AGENT SYSTEM
├─ Pattern:       Multi-agent (driver + specialists, her-go inspired) (v1 driver only; v2 specialists)
├─ Guide Agent:   Sync, user-facing chat                             (v1)
├─ Specialists:   Async background (Repo Explorer, HTML Import, Content Advisor) (v2)
├─ Tool Registry: Auto-registering, per-agent active sets            (v1)
├─ Providers:     OpenRouter (v1, single integration). OpenAI,
│                 Anthropic, Gemini, xAI (v2, via CF AI Gateway).
│                 BYOK is v2.

OUTPUT SITES (generated portfolios)
├─ Framework:     Astro SSG (static)                                 (v1)
├─ Islands:       Svelte 5 (interactive components only)             (v1 capability; concrete islands ship v2 with their block types)
├─ Styling:       Tailwind CSS (compiled + purged)                   (v1)
├─ Export:        Static .zip                                        (v1)
├─                Hosted on R2 via subdomain                         (v1)
├─                Custom domain via CF for SaaS                      (v2)
├─ Single-file:   Optional via astro-single-file integration         (v2)
```

---

## 18. MVP Scope

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
- [ ] Multi-page support: page list, per-page zones (free: 1 page, paid: up to 10)
- [ ] Navigation: top nav + footer, internal/external/anchor links, hamburger overflow
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

## 19. Future Phases

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

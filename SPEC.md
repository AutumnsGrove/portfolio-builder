# Portfolio Builder — Technical Specification

> An AI-guided portfolio builder that helps people showcase their work,
> especially those who struggle to get started.

---

## Quick Links

- **[v1 — Validate the Core Loop](SPEC_v1.md)** ← **Start here. This is what we're building now.**
- [v2 — Expand](SPEC_v2.md) (ships after v1 acceptance gates pass)
- [v3 — Deepen](SPEC_v3.md) (ships after v2 monetization)

---

## Vision & Positioning

A managed, AI-guided portfolio builder for people who have the work but struggle to present it. The AI is a **helper, not a doer** — it interviews you, organizes your material, suggests structure, and coaches you through every step. You stay in control of the narrative.

**Core beliefs:**

- Portfolios should take a day to build, not a month.
- The hardest part is getting started, not the technology.
- Every profession deserves purpose-built templates, not generic pages.
- The output should be fast, accessible, and yours to own.

**Market gap:** No existing tool (Framer, Webflow, Wix, Squarespace) offers a guided, conversational onboarding that extracts your actual work and builds around it. They all say "describe a site" — this says "tell me about your work." 78% of design recruiters use AI screening before human review; no builder optimizes for this.

---

## Versioned Roadmap

This product is built solo, and **scope discipline is the single biggest risk**. The spec is split into three phases with acceptance gates between each.

### v1 — Validate the Core Loop

> **Hypothesis:** An AI guide can take a person who has been avoiding their portfolio for months — someone with ADHD, executive-function challenges, or just blank-page paralysis — and walk them from sign-in to published portfolio in a single session, without giving up partway.

If this hypothesis fails, no amount of templates, custom domains, or agent specialists will save the product. v1 exists to prove or disprove this — nothing else.

**Read the full spec: [SPEC_v1.md](SPEC_v1.md)**

### v2 — Expand

> **Goal:** Scale the proven loop to more personas and more polish.

> **Prerequisites:** All v1 acceptance criteria must pass before any v2 work begins.

v2 adds multi-page support, drag-and-drop, custom domains, Stripe billing, Repo Explorer agent, HTML Import agent, and ~14 additional block types.

**Read the full spec: [SPEC_v2.md](SPEC_v2.md)**

### v3 — Deepen

> **Goal:** Post-validation, post-monetization. The bet has paid off; now the work is broadening the surface area and serving deeper use cases.

> **Prerequisites:** All v2 acceptance criteria must pass before any v3 work begins.

v3 adds office format ingestion, media format ingestion, collaboration, analytics dashboards, multi-language support, API access, and white-label options.

**Read the full spec: [SPEC_v3.md](SPEC_v3.md)**

---

## User Personas

The day-one user is **anyone who struggles to get started**, regardless of profession. The ADHD/executive-function-block experience is the core design constraint.

| Persona | Brings | Needs |
|---------|--------|-------|
| **Developer** | Git repos, READMEs, deploy links | Project extraction, tech stack highlighting |
| **Visual Artist** | Image folders, Behance/ArtStation links | Gallery layouts, high-res display |
| **Photographer** | Photo galleries, EXIF data | Full-bleed layouts, lightbox |
| **Musician** | Audio files, SoundCloud/Spotify links | Audio player blocks, discography timeline |
| **Writer** | Docs, PDFs, published bylines | Text-forward layouts, reading-friendly typography |
| **Game Dev** | Executables, trailers, screenshots | Video embeds, screenshot galleries |
| **Designer** | Figma links, case studies | Before/after sliders, case study templates |
| **"I just have words"** | Nothing but their own description | Maximum AI guidance, conversational extraction |

---

## User Flows

### First-Time User (Full Guided Flow)

```
Landing Page
  → Sign in with Google (BetterAuth)
  → Welcome screen: "What do you do?"
  → Chat with Guide Agent (wizard IS the first conversation)
  → Editor opens with pre-populated zones and blocks
  → Publish or Export
```

### Returning User

```
Sign in → Dashboard shows existing portfolios
  → Open editor (exact same interface as initial build)
  → AI chat sidebar available
```

---

## Core Architectural Principles

### The Manifest Is the Portfolio

**Code translates data, never describes it.** This is the foundational architectural principle.

- ALL content lives in a structured JSON manifest — never in component props, template strings, or hardcoded in Svelte/Astro files.
- Components read the manifest and render it. They hold zero content.
- The AI editor modifies the manifest, not code.
- A non-coder can open `manifest.json`, find any string, change it.
- Version history = manifest snapshots. Import/export = copying JSON.

If you're writing a component and the content is a string literal instead of a manifest reference, you're doing it wrong.

### Zone & Block Model

- **Zones** are numbered, AI-addressable semantic regions (Hero, Projects, About, etc.).
- **Blocks** are content units inside zones with semantic sizing (S/M/L).
- Responsiveness comes from CSS Grid + semantic sizes — no manual breakpoints.
- The accessibility tree IS the AI's navigation system.

### Multi-Agent System

Inspired by [her-go](https://github.com/AutumnsGrove/her-go):

- **Driver agent** (Guide) is sync and time-critical (user-facing).
- **Specialist agents** (Repo Explorer, HTML Import, Content Advisor) run async in the background (v2+).
- Agents communicate through the **shared database**, not direct calls.
- Each tool lives in its own module with a manifest and handler.
- Tools auto-register at startup (init pattern).

### Output Quality

- **Hosted sites** are SSR — Worker reads manifest from D1, Astro renders, cached at edge with stale-while-revalidate (v2; v1 builds at publish time).
- **Exported sites** are SSG — manifest baked into static HTML at build time.
- Both modes use the same components. Only the manifest source differs.
- Zero JS unless an island requires it.
- All output must meet WCAG 2.1 AA.
- SEO metadata is auto-generated, never skipped.
- `manifest.json`, `llms.txt`, and `llms-full.txt` must always be included.

---

## Tech Stack

```
BUILDER APP
├─ Framework:     Astro 6 + Svelte 5
├─ UI Primitives: bits-ui v2
├─ Styling:       Tailwind CSS v4
├─ Validation:    Zod v4
├─ Auth:          BetterAuth (self-hosted, D1-backed)

BACKEND (Cloudflare)
├─ Compute:       Workers
├─ Database:      D1 (Drizzle ORM)
├─ Storage:       R2
├─ State:         D1 + session cookies (v1); Durable Objects (v2)

AI AGENT SYSTEM
├─ Pattern:       Multi-agent (her-go inspired)
├─ Provider:      OpenRouter (v1); multi-provider via CF AI Gateway (v2)

OUTPUT SITES
├─ Framework:     Astro SSG (v1) / SSR (v2)
├─ Islands:       Svelte 5
├─ Styling:       Tailwind CSS
```

---

## Where to Go Next

- **Building v1?** Read [SPEC_v1.md](SPEC_v1.md) in full.
- **Project guidance?** Read [CLAUDE.md](CLAUDE.md).
- **Brand & positioning?** Read [PRODUCT.md](PRODUCT.md).
- **Design system?** Read [DESIGN.md](DESIGN.md).

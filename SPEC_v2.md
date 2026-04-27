# v2 — Expand

> **Goal:** Scale the proven loop to more personas and more polish.

> **Prerequisites:** All v1 acceptance criteria must pass before any v2 work begins.

---

## Table of Contents

1. [What's IN v2](#whats-in-v2)
2. [v2 Acceptance Criteria](#v2-acceptance-criteria)

---

## 1. What's IN v2

**Agent system**
- Repo Explorer agent (background, dev persona)
- HTML Import agent (import existing sites)
- Content Advisor agent (writing tips, keyword coaching)
- Three-level help dial (Guide / Draft / Do — only if v1 data shows the middle tier is meaningfully different)
- Cloudflare AI Gateway integration
- Multi-provider routing (OpenAI, Anthropic, Gemini, xAI, OpenRouter)
- BYOK for power users

**Editor**
- Multi-page support (up to 10 pages on paid tier)
- Named version history (git-style commits, semantic diffs)
- Drag-and-drop block reordering (with proper a11y + mobile support)
- Animated real-time AI editing (blocks slide into place, text streams)
- Wizard flow as a structured UI (if v1 data shows users want it)
- Visual guidance overlays (`highlight` tool — pulse, glow, arrow)
- A11y checker UI in editor
- Color contrast validation for user content

**Block types**
- All ~14 v1-deferred types: gallery, video, audio, code, testimonial, stats, timeline, contact form, before/after slider, 3D viewer, map, iframe embed, PDF, dark mode toggle

**Templates & styles**
- 5-10 structural templates (developer, photographer, artist, designer, writer, musician, game dev, generalist, minimal, creative)
- 5-10 style layers (minimal, bold, art deco, brutalist, soft, dark, nature, retro, professional, playful)
- Template/style picker UI
- Custom font library (curated, organized by vibe)

**Hosting & domains**
- Custom domain support via Cloudflare for SaaS
- Domain finder (Forage-style) integrated into publish flow
- Deploy wizard (CF Pages, Vercel, Netlify, GitHub Pages)
- TLS provisioning and renewal automation
- Per-request SSR with stale-while-revalidate (vs. v1's build-at-publish)

**Billing**
- Stripe integration (subscriptions + one-time)
- Flat-fee Pro tier (single price; no à la carte fragmentation)
- Stripe Customer Portal for self-service
- Watermark on free tier (only AFTER v1 validates that watermarked sites still get published)

**Output**
- Astro SSR for hosted sites (with stale-while-revalidate)
- Single-file HTML export option
- Social preview card auto-generation
- JSON-LD structured data (Person, CreativeWork, WebSite)
- AI-suggested alt text for all images
- SEO score panel in editor

**Content pipeline**
- File upload (markdown, HTML, text, PDF)
- Git repo URL ingestion (Repo Explorer agent)
- Bulk upload + background agent processing

**Infrastructure**
- Durable Objects for editor session state (only if v1 D1+cookies hits a ceiling)
- Per-user rate limiting via DOs

---

## 2. v2 Acceptance Criteria

All of these must pass before v3 work begins:

1. **Real revenue.**
   - At least 20 paying customers (not friends, not comp'd accounts).
   - Stripe-verified MRR > monthly Cloudflare + WorkOS + AI provider costs.

2. **Custom domains work in production.**
   - At least 5 customers running on custom domains for 30+ consecutive days with no support intervention.

3. **Repo Explorer is reliable.**
   - Successfully extracts project cards from 10+ diverse public repos (Go, Rust, Python, JS/TS, Svelte, Astro, monorepo, single-file) without supervision.
   - >80% of extracted cards require zero edits before user is satisfied.

4. **No perf regression from added complexity.**
   - Multi-page sites within 10% latency of single-page.
   - Animated AI editing doesn't cause layout shift (CLS < 0.1).
   - SSR p95 latency unchanged from v1.

5. **The product still feels patient and warm.**
   - Soft gate, but real. Spec author should re-read the brand personality section in `PRODUCT.md` and audit every v2 surface against it.

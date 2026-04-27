# CLAUDE.md

Project-specific instructions for Claude Code when working in this repo.

## Project Overview

AI-guided portfolio builder. Helps people showcase their work — especially
those who struggle to get started. The AI is a helper, not a doer.

Read `SPEC.md` for the full technical specification.

## Tech Stack

- **Builder app:** Astro + Svelte 5 + bits-ui + Tailwind v4
- **Backend:** Cloudflare Workers + D1 + R2
  - Durable Objects (v2 — v1 uses D1 + session cookies)
- **Auth:** WorkOS AuthKit
- **Payments:** Stripe (v2 — no billing in v1)
- **AI routing:** OpenRouter (v1 single provider); Cloudflare AI Gateway (v2)
- **Output sites:** Astro SSG (v1 builds at publish time); Astro SSR with stale-while-revalidate (v2)

## Commands

```bash
# Development
pnpm install             # Install dependencies
pnpm dev                 # Start dev server (Astro)
pnpm build               # Production build
pnpm preview             # Preview production build locally (wrangler)

# Cloudflare
pnpm exec wrangler dev         # Run Worker locally
pnpm exec wrangler deploy      # Deploy to production
pnpm exec wrangler d1 execute  # Run D1 migrations

# Testing
pnpm test                # Run test suite
pnpm test:watch          # Watch mode

# Linting & Formatting
pnpm lint                # ESLint
pnpm format              # Prettier
pnpm check               # Svelte check (type checking)
```

## Git Conventions

Use [Conventional Commits](https://www.conventionalcommits.org/) with **descriptive commit bodies** that explain purpose and impact, not just restate the type.

### Format

```
type(scope): short title (50 chars max)

1-2 lines explaining why this change matters and what it enables or fixes.
Focus on impact and motivation, not mechanical description.
```

### Good Examples

```
feat(editor): add zone reordering via up/down buttons

Gives users control over layout structure without the complexity of drag-and-drop.
Covers 80% of reordering value for v1 validation.

fix(agent): prevent infinite loop in tool call chain

Adds circuit breaker after 20 tool calls in a single turn. Trace is preserved
for debugging. Addresses v1 acceptance criterion #3 (agent reliability).

docs(spec): split SPEC.md into versioned files (v1/v2/v3)

Original 1700-line doc was too dense to parse. Separate files let you focus on
one phase at a time. SPEC.md becomes a navigation hub.

refactor(blocks): extract grid sizing logic into shared util

DRY up S/M/L → CSS Grid mapping. Makes it easier to adjust responsive behavior
across all block types from one place.
```

### Poor Examples (Don't Do This)

```
docs(spec): add versioned roadmap section
docs(spec): tag features by version (v1/v2/v3)
```

These just restate the type and title. They don't explain **why** or **what impact** the change has.

### Types

`feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`, `perf`

Scope is optional but encouraged: `feat(editor):`, `fix(agent):`, `test(blocks):`

## Architecture Principles

### Versioned Scope

This spec is split into v1, v2, v3 with acceptance gates between each. **When working on this codebase, default to v1 scope only.**

- Read [SPEC_v1.md](SPEC_v1.md) for what ships in v1.
- If a feature request maps to v2 or v3, flag it and ask before implementing.
- The biggest risk to this project is scope creep — the spec was rewritten specifically to prevent it. Do not undo that work.

### Think Before Coding

- State assumptions explicitly. If uncertain, ask.
- If multiple approaches exist, present tradeoffs — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.

### Simplicity First

- No features beyond what was asked.
- No abstractions for single-use code.
- No speculative "flexibility" or "configurability."
- If you write 200 lines and it could be 50, rewrite it.

### Surgical Changes

- Don't "improve" adjacent code, comments, or formatting.
- Match existing style, even if you'd do it differently.
- Every changed line should trace directly to the request.

### AI Agent Design

The multi-agent system follows patterns from
[her-go](https://github.com/AutumnsGrove/her-go):

- **Driver agent** is sync and time-critical (user-facing).
- **Specialist agents** run async in the background.
- Agents communicate through the **shared database**, not direct calls.
- Each tool lives in its own module with a manifest and handler.
- Tools auto-register at startup (init pattern).
- The turn tracker coordinates parallel agent phases.

### Code Translates Data, Never Describes It

This is the foundational architectural principle. **The manifest is the
portfolio.** Components are renderers, not containers.

- ALL content lives in a structured JSON manifest — never in component props,
  template strings, or hardcoded in Svelte/Astro files.
- Components read the manifest and render it. They hold zero content.
- The AI editor modifies the manifest, not code.
- A non-coder can open `manifest.json`, find any string, change it.
- Version history = manifest snapshots. Import/export = copying JSON.

If you're writing a component and the content is a string literal instead
of a manifest reference, you're doing it wrong.

### Zone & Block Model

- Zones are numbered, AI-addressable semantic regions.
- Blocks use semantic sizing (S/M/L), never pixel values.
- Responsiveness comes from CSS Grid + semantic sizes — no manual breakpoints.
- The accessibility tree IS the AI's navigation system.

### Output Quality

- **Hosted sites** are SSR — Worker reads manifest from D1, Astro renders,
  cached at edge with stale-while-revalidate.
- **Exported sites** are SSG — manifest baked into static HTML at build time.
- Both modes use the same components. Only the manifest source differs.
- Zero JS unless an island requires it.
- All output must meet WCAG 2.1 AA.
- SEO metadata is auto-generated, never skipped.
- `manifest.json`, `llms.txt`, and `llms-full.txt` must always be included.

## File Structure (Planned)

```
portfolio-builder/
├── src/
│   ├── components/        # Svelte components (editor UI)
│   ├── blocks/            # Block type definitions and renderers
│   ├── zones/             # Zone layout system
│   ├── agents/            # AI agent system
│   │   ├── guide/         # Guide agent (sync, user-facing) — v1
│   │   ├── explorer/      # Repo explorer (async) — v2
│   │   ├── importer/      # HTML import (async) — v2
│   │   ├── advisor/       # Content advisor (async) — v2
│   │   └── tools/         # Shared tool registry — v1
│   ├── templates/         # Structural templates
│   ├── styles/            # Style layers
│   ├── lib/               # Shared utilities
│   └── pages/             # Astro pages (builder app routes)
├── worker/                # Cloudflare Worker entry point
│   ├── api/               # API routes
│   ├── auth/              # WorkOS integration — v1
│   ├── billing/           # Stripe integration — v2
│   └── hosting/           # Site serving from R2 — v1
├── output/                # Astro SSG output templates
│   ├── templates/         # Output site templates
│   └── islands/           # Svelte islands for output sites
├── migrations/            # D1 schema migrations
├── tests/                 # Test files
├── SPEC.md                # Overview & navigation hub
├── SPEC_v1.md             # v1 — Validate the Core Loop
├── SPEC_v2.md             # v2 — Expand
├── SPEC_v3.md             # v3 — Deepen
├── CLAUDE.md              # This file
└── wrangler.jsonc         # Cloudflare config
```

## Key Decisions

- **Astro over SvelteKit** for output sites: portfolios are mostly static.
  Islands handle the few interactive pieces. Zero JS by default.
- **SSG for v1, SSR for v2**: v1 builds sites at publish time to static files
  in R2 and edge-caches them. v2 adds per-request SSR with stale-while-revalidate.
  Same components, different manifest source.
- **Manifest-driven architecture**: code translates data, never describes it.
  All content lives in JSON manifests. Components are pure renderers.
- **WorkOS over Clerk** for auth: 1M free MAU, native CF Workers support,
  no `node:async_hooks` issues.
- **D1 + session cookies for v1; DOs for v2**: v1 keeps it simple. DOs only
  land if scale demands them.
- **OpenRouter for v1; multi-provider for v2**: v1 hardcodes one AI provider
  to minimize debug surface while still allowing model experimentation. CF AI
  Gateway (proxy layer for caching, observability, fallback) and BYOK are v2.
- **Single-page for v1; multi-page for v2**: anchor nav covers most portfolios.
  Removes routing, nav, and SEO complexity from validation phase.
- **No billing in v1**: free for everyone until the loop is proven. Stripe lands
  in v2 once we know the economics.
- **Semantic sizing (S/M/L) over pixels**: responsive by design, AI-friendly,
  user-friendly.
- **Zone-based editor over freeform canvas**: keeps layout structured for AI
  addressability and automatic responsiveness.

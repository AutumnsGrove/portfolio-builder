# CLAUDE.md

Project-specific instructions for Claude Code when working in this repo.

## Project Overview

AI-guided portfolio builder. Helps people showcase their work — especially
those who struggle to get started. The AI is a helper, not a doer.

Read `SPEC.md` for the full technical specification.

## Tech Stack

- **Builder app:** Astro + Svelte 5 + bits-ui + Tailwind v4
- **Backend:** Cloudflare Workers + D1 + R2 + Durable Objects
- **Auth:** WorkOS AuthKit
- **Payments:** Stripe
- **AI routing:** Cloudflare AI Gateway
- **Output sites:** Astro SSG + Svelte 5 islands

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

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add gallery block component
fix: correct zone reordering on mobile
docs: update SPEC with v2 deployment section
style: format block editor styles
refactor: extract zone grid into shared util
test: add unit tests for project card parser
chore: update astro to 5.x
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`, `perf`

Scope is optional but encouraged: `feat(editor):`, `fix(agent):`, `test(blocks):`

## Architecture Principles

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
│   │   ├── guide/         # Guide agent (sync, user-facing)
│   │   ├── explorer/      # Repo explorer (async)
│   │   ├── importer/      # HTML import (async, v2)
│   │   ├── advisor/       # Content advisor (async, v2)
│   │   └── tools/         # Shared tool registry
│   ├── templates/         # Structural templates
│   ├── styles/            # Style layers
│   ├── lib/               # Shared utilities
│   └── pages/             # Astro pages (builder app routes)
├── worker/                # Cloudflare Worker entry point
│   ├── api/               # API routes
│   ├── auth/              # WorkOS integration
│   ├── billing/           # Stripe integration
│   └── hosting/           # Site serving from R2
├── output/                # Astro SSG output templates
│   ├── templates/         # Output site templates
│   └── islands/           # Svelte islands for output sites
├── migrations/            # D1 schema migrations
├── tests/                 # Test files
├── SPEC.md                # Full technical specification
├── CLAUDE.md              # This file
└── wrangler.jsonc         # Cloudflare config
```

## Key Decisions

- **Astro over SvelteKit** for output sites: portfolios are mostly static.
  Islands handle the few interactive pieces. Zero JS by default.
- **SSR for hosted, SSG for exported**: same components, different manifest
  source. Hosted sites use stale-while-revalidate caching for near-static speed.
- **Manifest-driven architecture**: code translates data, never describes it.
  All content lives in JSON manifests. Components are pure renderers.
- **WorkOS over Clerk** for auth: 1M free MAU, native CF Workers support,
  no `node:async_hooks` issues.
- **D1 over DO SQLite** for primary data: simpler to query, back up, and
  reason about. DOs are for ephemeral session state only.
- **Semantic sizing (S/M/L) over pixels**: responsive by design, AI-friendly,
  user-friendly.
- **Zone-based editor over freeform canvas**: keeps layout structured for AI
  addressability and automatic responsiveness.

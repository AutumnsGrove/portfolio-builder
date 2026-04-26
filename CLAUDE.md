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
npm install              # Install dependencies
npm run dev              # Start dev server (Astro)
npm run build            # Production build
npm run preview          # Preview production build locally (wrangler)

# Cloudflare
npx wrangler dev         # Run Worker locally
npx wrangler deploy      # Deploy to production
npx wrangler d1 execute  # Run D1 migrations

# Testing
npm run test             # Run test suite
npm run test:watch       # Watch mode

# Linting & Formatting
npm run lint             # ESLint
npm run format           # Prettier
npm run check            # Svelte check (type checking)
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

### Zone & Block Model

- Zones are numbered, AI-addressable semantic regions.
- Blocks use semantic sizing (S/M/L), never pixel values.
- Responsiveness comes from CSS Grid + semantic sizes — no manual breakpoints.
- The accessibility tree IS the AI's navigation system.

### Output Quality

- Output sites must be Astro SSG — zero JS unless an island requires it.
- All output must meet WCAG 2.1 AA.
- SEO metadata is auto-generated, never skipped.
- The source manifest (`manifest.json`) must always be included in exports.

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
- **WorkOS over Clerk** for auth: 1M free MAU, native CF Workers support,
  no `node:async_hooks` issues.
- **D1 over DO SQLite** for primary data: simpler to query, back up, and
  reason about. DOs are for ephemeral session state only.
- **Semantic sizing (S/M/L) over pixels**: responsive by design, AI-friendly,
  user-friendly.
- **Zone-based editor over freeform canvas**: keeps layout structured for AI
  addressability and automatic responsiveness.

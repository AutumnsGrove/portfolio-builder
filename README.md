# Portfolio Builder

An AI-guided portfolio builder for people who have the work but struggle to present it.

## What Is This?

Building a portfolio is hard — especially if you have ADHD or just freeze at blank pages. You might have dozens of projects, years of work, and no idea how to showcase any of it.

This tool fixes that. An AI guide interviews you about your work, helps you organize it, and coaches you through building a portfolio site. It's a **helper, not a doer** — you stay in control of the narrative.

## How It Works

1. **Sign in** and tell the AI what you do
2. **Drop in your work** — repos, images, files, links, or just your words
3. **Pick a look** — choose a template and style that fits you
4. **Build with guidance** — the AI highlights what needs attention, suggests structure, and helps you write
5. **Ship it** — export as a static site, host it with us, or deploy anywhere

## Key Features

- **AI-guided experience** with adjustable help levels (coach me / draft for me / do it for me)
- **Works for everyone** — devs, artists, photographers, musicians, writers, designers, or anyone with a story to tell
- **Zone-based editor** — drag-and-drop blocks into semantic zones, no pixel pushing
- **Smart ingestion** — paste a GitHub repo URL and the AI extracts your project details automatically
- **Beautiful output** — static Astro sites with zero JavaScript by default, fast everywhere
- **Accessible by design** — WCAG 2.1 AA output with a built-in accessibility checker
- **Your work, your way** — export anytime, host anywhere, bring your own domain

## Tech Stack

- **Frontend:** Astro + Svelte 5 + bits-ui + Tailwind v4
- **Backend:** Cloudflare Workers + D1 + R2 + Durable Objects
- **Auth:** BetterAuth (self-hosted, D1-backed)
- **AI:** Multi-provider via Cloudflare AI Gateway

## Status

Early development. See [SPEC.md](SPEC.md) for the full technical specification.

## License

TBD

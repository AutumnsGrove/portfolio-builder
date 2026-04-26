# Product

## Register

product

## Users

People who have the work but struggle to present it. The core design
constraint is ADHD and executive-function challenges: blank pages are
paralyzing, too many options cause shutdown, and momentum is fragile.

The spectrum runs from complete beginners (never built a website, need
the AI to guide every step) to power users (skip the wizard, want full
control, treat the AI as a fast assistant). Day-one users include
developers, visual artists, photographers, musicians, writers, game devs,
designers, and people who just have words and nothing else.

Context: they're building a portfolio, probably after putting it off for
months. They might be job-hunting, freelancing, or just want their work
to exist somewhere. The mood is a mix of "I should have done this ages
ago" and cautious optimism.

## Product Purpose

An AI-guided portfolio builder that interviews you about your work,
organizes your material, suggests structure, and coaches you through
building a portfolio. The AI is a helper, not a doer. You stay in
control of the narrative.

Success looks like: someone who's been avoiding this for months opens the
app, has a conversation, and walks away with a published portfolio in a
single session. They feel proud of it. It looks like them, not like a
template.

## Brand Personality

**Warm, patient, capable.**

The product feels like a talented friend who's good at design sitting
next to you, never rushing, never condescending. It knows what it's doing
(capable) but lets you drive (patient) and makes you feel good about the
process (warm).

Voice: encouraging but not performative. No fake enthusiasm ("Amazing
portfolio!"), no corporate polish ("Leverage your professional brand").
Speaks like a real person who genuinely wants to help.

Emotional goals: reduce anxiety, build momentum, create pride in the
output.

## Anti-references

- **Wix / Squarespace**: bloated, template-mall aesthetic. Too many
  options crammed into busy sidebars. The paradox of choice made visual.
  Our editor should feel spacious and focused, not like a catalog.

- **Generic SaaS landing pages**: hero with gradient, feature grid,
  testimonial carousel, pricing table. The "AI made this" look. If
  someone could guess our landing page from the category name, we've
  failed. (See: impeccable's AI slop test.)

- **Dev-tool aesthetic**: dark-mode-everything, monospace-everywhere,
  intimidating to non-technical users. Our primary users include artists,
  writers, and musicians. The UI must welcome them, not gatekeep.

- **Overly playful/cute tools**: confetti on every action, mascot
  characters, emoji-heavy UI. Warm is not the same as childish. Our
  users are professionals showcasing real work.

## Design Principles

1. **Momentum over options.** Every screen should have one obvious next
   step. Progressive disclosure, not feature walls. If you have to think
   about what to click, the UI failed.

2. **The work is the star.** The editor UI should recede when the
   portfolio content is on screen. Chrome is minimal. The user's work
   (images, projects, writing) gets the visual weight, not our interface.

3. **Show, don't describe.** Live preview is always visible. Changes
   animate in real time. The user watches their portfolio take shape, not
   a loading spinner followed by a result.

4. **Calm confidence.** The interface communicates "I know what I'm
   doing" through polish, not through showing off. Smooth transitions,
   precise alignment, deliberate spacing. No jank, no layout shift, no
   half-states.

5. **Practice what we preach.** We're a portfolio builder. Our own
   product is our portfolio. Every surface (landing page, editor,
   dashboard, output sites) should be something we'd proudly put in a
   case study.

## Accessibility & Inclusion

- WCAG 2.1 AA baseline, targeting AAA where practical.
- Respect `prefers-reduced-motion` throughout. No essential information
  conveyed only through animation.
- Color contrast validated in the editor for user-created content, not
  just our UI.
- Keyboard navigation for all interactive components (bits-ui provides
  this foundation).
- Screen reader support: the accessibility tree doubles as the AI
  agent's navigation system, so it's load-bearing infrastructure.
- Support for color blindness: never rely on color alone to convey state
  (use icons, labels, patterns as secondary signals).

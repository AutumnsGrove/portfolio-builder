<!-- SEED — re-run /impeccable document once there's code to capture the actual tokens and components. -->
---
name: Portfolio Builder
description: AI-guided portfolio builder with warm, patient, capable energy.
---

# Design System: Portfolio Builder

## 1. Overview

**Creative North Star: "The Patient Workshop"**

A warm, well-lit workspace where the tools are sharp but never
intimidating. Everything has a place. The surfaces are natural, the
lighting is even, and the focus is always on the thing being made, not
the tools making it. The interface recedes; the work advances.

This system draws from the purposeful clarity of Notion, the personality
of Arc, and the polish of Linear. It rejects the visual overload of
Canva: too many options, too many colors, too much competing for
attention at once. It rejects generic SaaS aesthetics, template-mall
energy, and dev-tool gatekeeping. Every surface earns its space.

The visual language is restrained on purpose. A warm amber accent
appears sparingly, like a well-placed lamp in a quiet room. Neutrals
carry the weight. The user's portfolio content (images, projects,
writing) always has the most visual presence on any given screen.

**Key Characteristics:**
- Warm neutrals tinted toward amber, never pure gray
- One accent color used with discipline (10% or less of any surface)
- Rounded, friendly geometry in both type and UI elements
- Generous whitespace that gives content room to breathe
- Motion that responds to interaction, never performs unprompted

## 2. Colors: The Warm Workshop Palette

A restrained palette: tinted neutrals carry the interface, with a warm
amber accent reserved for interactive moments.

**The Lamp Rule.** The amber accent is a lamp, not a flood light. It
appears on primary CTAs, active states, focus rings, and progress
indicators. It never fills a surface, never appears as a background,
never competes with user content. Its rarity is the point.

### Primary
- **Workshop Amber** [to be resolved during implementation]: the accent.
  CTAs, focus rings, active nav items, progress states. Warm ochre
  leaning toward golden, not orange. Think aged brass, not traffic cone.

### Neutral
- **Canvas Cream** [to be resolved]: primary background. Warm,
  paper-like, never clinical white. Tinted toward the amber hue family
  (chroma 0.005-0.01 in OKLCH).
- **Warm Stone** [to be resolved]: secondary surfaces, card backgrounds,
  sidebar. Slightly darker than Canvas Cream. Distinguishes layers
  without shadows.
- **Charcoal Ink** [to be resolved]: primary text. Deep and warm, never
  pure black. High contrast against Canvas Cream (WCAG AAA).
- **Soft Graphite** [to be resolved]: secondary text, labels, metadata.
  Readable but clearly subordinate to Charcoal Ink.
- **Ash Border** [to be resolved]: dividers, input borders, subtle
  separators. Barely visible, just enough structure.

### Named Rules
**The No Pure Gray Rule.** Every neutral is tinted toward the amber hue
family. `oklch(L C H)` where H stays in the 70-90 range and C is at
least 0.005. Pure desaturated grays are prohibited; they feel cold and
break the warmth.

## 3. Typography

**Display Font:** Outfit (with system-ui, sans-serif fallback)
**Body Font:** Lexend (with system-ui, sans-serif fallback)

**Character:** Two rounded geometrics that share DNA but serve different
roles. Outfit brings presence and confidence at display sizes, especially
at ExtraBold (800) and Black (900). Lexend was literally designed to
reduce reading effort, making it ideal for body text in a product built
around the ADHD/executive-function constraint. Together they feel warm,
modern, and effortlessly readable.

### Hierarchy
- **Display** (Outfit 800, [clamp to be resolved], line-height 1.05):
  Hero headlines, marketing H1s, page titles on the landing page.
- **Headline** (Outfit 700, [size to be resolved], line-height 1.1):
  Section headings in the editor and dashboard.
- **Title** (Outfit 600, [size to be resolved], line-height 1.2):
  Card titles, dialog headers, zone labels.
- **Body** (Lexend 400, [size to be resolved], line-height 1.6, max 70ch):
  All running text. Chat messages, descriptions, form help text.
- **Label** (Lexend 500, [size to be resolved], letter-spacing 0.01em):
  Button labels, nav items, metadata, tags.

### Named Rules
**The Breathing Room Rule.** Body text never exceeds 70 characters per
line. Headings never exceed 20 words. If a heading needs a second line,
it's too long; split or rewrite.

## 4. Elevation

This system is flat by default. Depth is conveyed through tonal
layering (Canvas Cream vs. Warm Stone) rather than shadows. Shadows
appear only as a response to state: hover elevation on interactive
cards, focus rings on inputs, and the chat overlay on mobile.

**The Flat-By-Default Rule.** Surfaces are flat at rest. If you're
adding a shadow, you need a state-change reason: hover, focus, drag, or
overlay. Decorative shadows are prohibited.

### Shadow Vocabulary
- **Hover lift** [values to be resolved]: subtle upward lift on
  interactive elements. Diffuse, warm-tinted, barely perceptible.
- **Overlay** [values to be resolved]: chat panel on mobile, dropdowns,
  popovers. Slightly stronger, anchors floating UI to the surface below.
- **Focus ring** [values to be resolved]: visible keyboard focus. Uses
  the amber accent color, not a shadow. Offset ring, not glow.

## 5. Components

[Components to be designed during implementation. This section will be
populated on the next `/impeccable document` run once the component
library exists.]

## 6. Do's and Don'ts

### Do:
- **Do** tint every neutral toward amber. Check OKLCH chroma is at least
  0.005 with hue in the 70-90 range.
- **Do** let user content (portfolio images, project screenshots,
  writing) be the most visually prominent element on any editor screen.
- **Do** use Outfit at 700+ weight for any heading that needs to command
  attention. Lexend at 400 for body.
- **Do** respect `prefers-reduced-motion`. Every animation must have a
  reduced-motion fallback that still communicates the state change.
- **Do** use the amber accent exclusively for interactive affordances:
  buttons, focus rings, active states, progress. Nothing decorative.
- **Do** test every surface at mobile width. The editor toggles between
  panels; nothing should require side-by-side viewing to function.

### Don't:
- **Don't** use pure black (`#000`) or pure white (`#fff`) anywhere.
  Every extreme is tinted.
- **Don't** use the amber accent on more than 10% of any surface. If
  it's everywhere, it means nothing.
- **Don't** show all options at once. Progressive disclosure, not feature
  walls. (Anti-reference: Canva's overwhelming option panels.)
- **Don't** use border-left or border-right greater than 1px as colored
  accents on cards, list items, or alerts.
- **Don't** use gradient text (`background-clip: text` with gradients).
- **Don't** use glassmorphism decoratively. Blurs are for functional
  overlays (mobile chat panel) only.
- **Don't** build identical card grids. Vary block sizes, content
  density, and visual weight.
- **Don't** reach for a modal as the first solution. Inline and
  progressive alternatives first.
- **Don't** add bounce or elastic easing. Ease-out-quart/quint/expo
  only.
- **Don't** use em dashes in UI copy. Commas, colons, semicolons,
  periods, or parentheses.
- **Don't** let the interface look like "AI made this." If someone could
  guess the design from the category name ("portfolio builder"), rework
  it. (Anti-reference: generic SaaS landing pages.)
- **Don't** intimidate non-technical users. No monospace-everything, no
  dark-mode-by-default, no jargon in labels. (Anti-reference: dev-tool
  aesthetic.)

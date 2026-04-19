# idol-platform design system v1

## Product Direction

`idol-platform` should feel like a market-intelligence product for the idol industry, not a generic entertainment site and not a developer console.

Three goals:
- make rankings and formulas feel trustworthy
- keep analytical tools clear without losing pop-culture energy
- help users understand what they can do on each page within a few seconds

## Visual Keywords

- night newsroom
- market intelligence
- editorial dashboard
- pop-culture signal

## Color System

### Core

- `Ink 950`: `#050816`
- `Slate 900`: `#111827`
- `Panel Blue`: `#172033`
- `Cyan Accent`: `#22d3ee`
- `Amber Accent`: `#fbbf24`
- `Signal Coral`: `#f97316`

### Rules

- use layered dark gradients instead of flat black
- use cyan for actions, current state, and analytical emphasis
- use amber or coral only for supporting emphasis
- keep each page to one primary accent and one secondary accent

## Shape System

- primary panels: `28px - 32px`
- secondary cards: `20px - 24px`
- controls: `16px - 22px`

Rounded geometry is part of the product feel. Avoid sharp admin-panel corners.

## Layout Principles

### Hero

The hero must answer:
- what this page is for
- what the user can do next
- where the key entry points are

### Workspace Pages

Pages like `/agent` should use:
- left: primary workflow and main content
- right: supporting actions, status, and follow-up tools

### Reading Pages

Pages like `/about`, `/insights`, and `/brain` should feel editorial:
- stronger reading rhythm
- fewer dashboard fragments
- more trust-building context

## Content Rules

### Good

- explain what the user can do
- turn technical logic into decision-support language
- surface freshness, confidence, and evidence near scores

### Avoid

- progress-report wording
- raw internal labels as user-facing language
- opening a page with provider/runtime jargon

## Component Voice

Preferred labels:
- `工作狀態`
- `目前角色`
- `追蹤同步`
- `分析工作台`
- `模型來源`
- `市場觀察`

Avoid labels like:
- `runtime`
- `provider`
- `adapted`
- `mode`

unless they are genuinely necessary for the user

## /agent v1 Application

This version of `/agent` should:
- present itself as an analysis workspace
- make role cards feel like analytical entry points
- keep compare, watchlist, and alerts in the same visual language
- treat tool traces as supporting context, not the headline

## Next Steps

1. Apply the same panel, badge, and signal system to the homepage ranking cards.
2. Refactor `/about` into a stronger editorial explainer page.
3. Redesign `/forum/admin` with a denser moderation dashboard language.
4. Move color, radius, spacing, and surface rules into reusable global tokens.

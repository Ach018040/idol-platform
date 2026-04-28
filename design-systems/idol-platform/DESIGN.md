# idol-platform Design System

## 1. Brand

idol-platform is a Bloomberg-like intelligence product for idols: credible, fast to scan, culturally fluent, and able to shift from fan warmth to investor-grade analysis.

## 2. Color

- Ink: `#181514`
- Paper: `#fdfaf4`
- Warm surface: `#f6f1e8`
- Strawberry signal: `#ba3f5a`
- Data blue: `#2f6fed`
- Stage cyan: `#23d5ff`
- Cheki amber: `#f59e0b`

## 3. Typography

- UI: `Noto Sans TC`, `Microsoft JhengHei`, `Arial`
- Display: heavy weight, tight line-height, no negative letter spacing
- Reports: short headings, dense but breathable paragraphs

## 4. Layout

- Use dashboard density for analysis surfaces.
- Use full-width hero bands for landing artifacts.
- Use cards only for repeated objects, exports, templates, and project rows.
- Keep preview surfaces inside a sandbox iframe.

## 5. Components

- Template cards
- Design direction picker
- Source selector
- Artifact preview frame
- Export action bar
- Evidence/source footnotes

## 6. Motion

- Motion should support review and generation progress.
- Avoid decorative motion that hides data.

## 7. Voice

- Traditional Chinese by default.
- Product copy should explain what the user can do now, not report internal implementation progress.
- For fan-facing artifacts, preserve idol culture vocabulary such as 生日祭, チェキ, 物販, 推し.

## 8. Accessibility

- Text contrast must remain readable on both paper and dark artifact previews.
- Buttons require visible focus and clear labels.

## 9. Anti-patterns

- Generic AI landing page copy.
- Purple-only dashboards.
- Hero cards that look like SaaS boilerplate.
- Claims about official data without source badges.

## 10. AI Generation Guardrails

- Use only licensed, owned, public-domain, or explicitly authorized assets.
- Any generated material depicting a real idol must be labeled `AI generated`.
- Do not fabricate or impersonate the idol's own speech, endorsement, or private opinion.
- Do not create unauthorized deepfake, face-swap, voice clone, or misleading identity simulation.
- Do not generate adultized, maliciously humiliating, politically misleading, or deceptive commercial propaganda content.
- Preserve the prompt, selected template, data source, generation provider, and timestamp for every generated artifact.

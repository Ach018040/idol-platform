# API Source Catalog

## Purpose

idol-platform needs an API Source Catalog so external data integrations can be planned before they become production dependencies. The catalog keeps candidate APIs visible across product, data, and engineering decisions:

- Social listening: public posts, mentions, discussion threads, engagement signals.
- Events: ticketing, venue, city, and schedule discovery.
- News: idol industry coverage, incident monitoring, and risk context.
- Open Data: venue geography, transportation, city context, and government datasets.
- Weather: event-day attendance risk and expedition planning.
- Finance: macro context for pricing sensitivity and consumer demand signals.

The goal is not to connect every API immediately. The goal is to rank candidates, check risk, and decide which integrations are worth a proper connector.

## Data Flow

1. Candidate APIs are seeded into `public.api_sources` through `supabase/migrations/20260513090000_create_api_sources.sql`.
2. The Next.js route `GET /api/admin/api-sources` reads `api_sources` from Supabase when `NEXT_PUBLIC_SUPABASE_URL` and a key are available.
3. If Supabase is not configured, the route falls back to `public/data/api_sources.json`.
4. Each API source is enriched with `suitability_score` from `frontend-next/lib/api-sources.ts`.
5. The admin UI at `/admin/api-sources` displays filters, badges, tags, source links, and score bars.

## Selecting APIs From public-apis

Use public-apis as the discovery index, then apply idol-platform-specific filters:

- Prefer APIs that directly improve social heat, event discovery, attendance forecasting, or risk monitoring.
- Prefer HTTPS and clear documentation.
- Prefer no-auth or API-key APIs for early prototypes.
- Treat OAuth, unclear CORS, unclear terms, and unclear rate limits as integration risks.
- Avoid collecting private user data unless a future privacy review explicitly approves it.

## Pre-Integration Checklist

Before moving an API from `candidate` to `approved`, verify:

- Auth: no auth, API key, OAuth, required scopes, token refresh rules.
- CORS: browser-safe or server-only integration.
- Rate limit: free quota, burst limits, paid thresholds, retry behavior.
- License: whether data can be stored, transformed, displayed, or redistributed.
- Terms of Use: scraping restrictions, attribution requirements, commercial-use limits.
- Data shape: stable IDs, timestamps, pagination, locale/language coverage.
- Reliability: uptime, changelog, versioning, maintenance signals.
- Privacy: whether posts, usernames, or user-generated content require masking.
- Product fit: which dashboard, model, or pipeline consumes it.

## Suitability Scoring

`suitability_score` is a 25-point score:

- `relevance`: 1-5, fit to idol-platform use cases.
- `technical_feasibility`: 1-5, HTTPS, CORS, and integration difficulty.
- `cost_accessibility`: 1-5, no-auth/free/API-key/OAuth cost of adoption.
- `stability`: 1-5, risk-level proxy for reliability and policy uncertainty.
- `product_value`: 1-5, expected value for heat, conversion, risk, or event intelligence.

The score is intentionally simple. It is a triage tool, not a procurement decision.

## Recommended Priority

1. Open-Meteo: high utility, no auth, good event-risk fit.
2. Open Government Taiwan: venue, transport, and local market context.
3. Eventbrite / Ticketmaster / SeatGeek: activity discovery and ticketing context after terms review.
4. Bluesky / Reddit: social listening expansion after privacy and moderation review.
5. Currents / GNews: news and incident monitoring.
6. Finance APIs: useful for market context, but lower immediate value than events and social signals.

## Supabase Notes

The migration enables RLS and adds a public read policy for catalog browsing. If the project Data API settings do not expose new tables automatically, grant `select` to the relevant roles in Supabase after applying the migration.

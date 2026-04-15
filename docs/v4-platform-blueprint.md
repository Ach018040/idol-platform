# v4 Platform Blueprint

## Product goal

Build `idol-platform` into a true idol industry data platform:

- rankings
- entity intelligence
- market signals
- research pages
- workflow tools
- AI agent explanations

This is the closest product direction to a `Bloomberg for idols`.

## Target architecture

```text
idol-platform/
├── crawler/
├── analytics/
├── database/
├── api/
├── frontend/
└── agent/
```

## Mapping from the current repo

- `pipeline/` -> future `crawler/` + `analytics/`
- `supabase/` -> future `database/`
- `frontend-next/app/api/` -> future `api/`
- `frontend-next/` -> future `frontend/`
- `frontend-next/lib/agent.ts` -> first production slice of `agent/`

## Production slice shipped in this round

- `/agent`
- `/api/agent/query`
- homepage entry to the agent
- deterministic retrieval over rankings, insights, and brain fallback content

## What should be improved next

1. connect a real LLM provider
2. add compare / watchlist / alerts
3. expand entity intelligence pages
4. improve social freshness coverage
5. separate crawler and analytics responsibilities more clearly

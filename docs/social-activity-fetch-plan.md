# Social Activity Fetch Plan

## Goal

Upgrade `freshness_score` from database-only recency to a mixed signal that can
use real public social post timestamps from Instagram and Threads.

## Phase 1: Schema and pipeline

1. Add `last_post_at_instagram`
2. Add `last_post_at_threads`
3. Add `last_social_signal_at`
4. Add `days_since_social_signal`
5. Add `data_refresh_score`
6. Add `social_post_score`

## Phase 2: Instagram fetch

1. Normalize Instagram handles from profile URLs
2. Fetch public Instagram profile HTML
3. Extract latest detectable post timestamp from embedded metadata
4. Merge `last_post_at_instagram` into `fetch_members.py`
5. Record coverage in `insights.json`

## Phase 3: Threads fetch

1. Normalize Threads handles from profile URLs
2. Fetch public Threads profile HTML
3. Extract latest detectable post timestamp from embedded metadata
4. Merge `last_post_at_threads` into `fetch_members.py`
5. Record coverage in `insights.json`

## Phase 4: Score integration

1. Blend database recency with social recency
2. Keep a conservative fallback when public social timestamps are unavailable
3. Recompute ranking deltas and inspect edge cases like `Ruka Banana`

## Acceptance Criteria

1. `member_rankings.json` contains non-null `last_social_signal_at` for at least some public profiles
2. `insights.json` reports social post timestamp coverage
3. `temperature_index_v2` changes are explainable via `data_refresh_score` and `social_post_score`
4. Frontend `/about` explains the mixed freshness model accurately

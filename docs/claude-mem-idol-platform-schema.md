# claude-mem -> idol-platform memory schema

## 轉換原則

`claude-mem` 的核心概念可簡化成三層：

1. `session`
2. `observation`
3. `search / recall`

轉到 `idol-platform` 時，不需要完整搬入 CLI workflow，只需要保留最有價值的兩層：

- `agent_sessions`
  - 表示一段可延續的分析脈絡
- `agent_observations`
  - 表示一次具體的提問、回答與證據記錄

## 為什麼這樣切

- `/agent` 需要「延續上次問題」：這是 session
- `/agent` 需要「最近分析紀錄」：這是 observations
- `brain / insights / watchlist / alerts` 之後要接回分析上下文：可從 observations 的 entity / evidence / traces 擴充

## 表結構

### `agent_sessions`

- `user_id`
- `role_id`
- `last_question`
- `last_intent`
- `summary`
- `entity_id`
- `entity_kind`
- `entity_name`
- `created_at`
- `updated_at`

用途：
- 代表目前正在延續的一段分析脈絡
- 方便 `/agent` 在下次提問時帶入最近上下文

### `agent_observations`

- `session_id`
- `user_id`
- `role_id`
- `question`
- `answer`
- `summary`
- `intent`
- `provider`
- `mode`
- `entity_id`
- `entity_kind`
- `entity_name`
- `evidence`
- `traces`
- `suggested_questions`
- `created_at`

用途：
- 保存每一次問答的可檢索紀錄
- 讓 `/agent` 顯示最近分析、快速續問、未來可做搜尋與回顧

## 與現有 v4 功能的關係

- `watchlist`
  - 表示「想持續追蹤誰」
- `alerts`
  - 表示「想被哪些變化提醒」
- `agent_observations`
  - 表示「我曾經怎麼分析過這些對象」

三者合起來後，`idol-platform` 的 agent 就不只是回答器，而是帶有分析記憶的工作台。

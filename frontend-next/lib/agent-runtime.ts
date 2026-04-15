import { type AgentResult, runIdolAgent } from "@/lib/agent";

type AgentIntent = "freshness_explain" | "formula_explain" | "group_vs_member" | "ranking_reason" | "general";

type RuntimeAgentResult = AgentResult & {
  intent: AgentIntent;
  mode: "local" | "provider";
  provider: "local" | "openai" | "anthropic";
};

function inferIntent(question: string): AgentIntent {
  const q = question.toLowerCase();
  if (/(更新|不常更新|活躍|freshness|近期|資料)/.test(q)) return "freshness_explain";
  if (/(公式|計算|v2|溫度|分數|score|temperature)/.test(q)) return "formula_explain";
  if (/(團體|成員).*(不同|不一樣|差異|為何|為什麼)|group.*member/.test(q)) return "group_vs_member";
  if (/(為何|為什麼|排行|排名|靠前|原因)/.test(q)) return "ranking_reason";
  return "general";
}

function hasUsefulHit(result: AgentResult) {
  return result.traces.some((trace) => trace.tool.startsWith("search_") && trace.hits > 0);
}

function intentFallback(intent: AgentIntent, base: AgentResult): Pick<AgentResult, "answer" | "summary" | "suggestedQuestions"> {
  if (intent === "freshness_explain") {
    return {
      answer:
        "你問的是更新頻率與排行的關係。目前平台的 freshness 不是只看社群真實發文，還包含資料庫更新時間、社群最後發文訊號與資料可信度。若某位成員看起來不常發文但仍靠前，常見原因是：社群覆蓋完整、照片與基本資料完整、資料庫近期被更新，或社群最後發文時間尚未成功抓到。這類問題不能只看排行榜名次，應同時看 freshness_score、days_since_update、last_social_signal_at 與 data_confidence。",
      summary: "這題屬於 freshness / 更新頻率解釋，不應回通用排行榜摘要。",
      suggestedQuestions: [
        "哪些成員是資料近期更新但社群訊號不足？",
        "freshness_score 目前如何計算？",
        "如何降低資料庫更新時間對排名的影響？",
      ],
    };
  }

  if (intent === "formula_explain") {
    return {
      answer:
        "你問的是 V2 溫度公式。平台目前會把社群覆蓋、資料完整度、混合 freshness、團體關聯與資料可信度一起判讀。這代表分數不是單一欄位造成，而是多個訊號加權後的結果。若要判斷分數是否合理，應檢查 social_activity、profile completeness、freshness_score、temperature_index_v2 與 data_confidence 是否一致。",
      summary: "這題屬於公式解釋，回答會優先說明計算邏輯與可驗證欄位。",
      suggestedQuestions: [
        "temperature_index_v2 和 social_activity 差在哪？",
        "為何社群覆蓋分高不代表總排名最高？",
        "V2 公式目前最需要補強的資料來源是什麼？",
      ],
    };
  }

  if (intent === "group_vs_member") {
    return {
      answer:
        "你問的是團體榜與成員榜為何不一致。這兩個榜單不是同一種排序：成員榜看個體 temperature_index_v2，團體榜則聚合成員平均、團內最高成員、成員數深度與官方社群覆蓋。因此團體排名靠前，不一定代表該團一定有成員進入成員 Top 10。",
      summary: "這題屬於團體與成員排行差異，回答會聚焦聚合邏輯。",
      suggestedQuestions: [
        "團體分數由哪些成員拉高？",
        "哪個團體成員平均高但沒有單一明星？",
        "團體排行是否應降低官方社群權重？",
      ],
    };
  }

  if (intent === "ranking_reason") {
    return {
      answer:
        "你問的是排行原因。若問題沒有命中具體成員或團體名稱，我會先用整體規則回答：排名通常由 V2 溫度、freshness、社群覆蓋、資料完整度與資料可信度共同影響。請指定成員或團體名稱，我可以進一步拆解該對象是被哪個欄位拉高或拉低。",
      summary: "這題屬於排行原因分析，但目前沒有命中具體對象。",
      suggestedQuestions: [
        "請分析真白 レモン 為何排行靠前",
        "請分析幻獸為何團體排名高",
        "請列出 Top 10 中 freshness 最弱的成員",
      ],
    };
  }

  return {
    answer: base.answer,
    summary: base.summary,
    suggestedQuestions: base.suggestedQuestions,
  };
}

async function askOpenAI(question: string, base: AgentResult, intent: AgentIntent) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL;
  if (!apiKey || !model) return null;

  const response = await fetch(process.env.OPENAI_BASE_URL || "https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "你是 idol-platform 的資料分析 Agent。請用繁體中文回答，只能根據提供的 evidence 與平台公式說明，不要編造不存在的數據。",
        },
        {
          role: "user",
          content: [
            `問題：${question}`,
            `意圖：${intent}`,
            `本地初稿：${base.answer}`,
            `證據：${base.evidence.map((item) => `${item.type}:${item.title}:${item.snippet}`).join("\n")}`,
          ].join("\n\n"),
        },
      ],
    }),
  });

  if (!response.ok) return null;
  const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content?.trim() || null;
}

async function askAnthropic(question: string, base: AgentResult, intent: AgentIntent) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL;
  if (!apiKey || !model) return null;

  const response = await fetch(process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 900,
      system: "你是 idol-platform 的資料分析 Agent。請用繁體中文回答，只根據 evidence，不要編造數據。",
      messages: [
        {
          role: "user",
          content: [
            `問題：${question}`,
            `意圖：${intent}`,
            `本地初稿：${base.answer}`,
            `證據：${base.evidence.map((item) => `${item.type}:${item.title}:${item.snippet}`).join("\n")}`,
          ].join("\n\n"),
        },
      ],
    }),
  });

  if (!response.ok) return null;
  const data = (await response.json()) as { content?: Array<{ type?: string; text?: string }> };
  return data.content?.find((item) => item.type === "text")?.text?.trim() || null;
}

export async function runRuntimeAgent(question: string): Promise<RuntimeAgentResult> {
  const base = await runIdolAgent(question);
  const intent = inferIntent(question);
  const fallback = !hasUsefulHit(base) ? intentFallback(intent, base) : null;

  const local: RuntimeAgentResult = {
    ...base,
    ...(fallback || {}),
    intent,
    mode: "local",
    provider: "local",
    traces: [...base.traces, { tool: "infer_intent", input: intent, hits: 1 }],
  };

  const openAiAnswer = await askOpenAI(question, local, intent);
  if (openAiAnswer) {
    return {
      ...local,
      answer: openAiAnswer,
      summary: "OpenAI provider 已根據平台 evidence 重新整理回答。",
      mode: "provider",
      provider: "openai",
      traces: [...local.traces, { tool: "provider_openai", input: process.env.OPENAI_MODEL || "unset", hits: 1 }],
    };
  }

  const anthropicAnswer = await askAnthropic(question, local, intent);
  if (anthropicAnswer) {
    return {
      ...local,
      answer: anthropicAnswer,
      summary: "Claude provider 已根據平台 evidence 重新整理回答。",
      mode: "provider",
      provider: "anthropic",
      traces: [...local.traces, { tool: "provider_anthropic", input: process.env.ANTHROPIC_MODEL || "unset", hits: 1 }],
    };
  }

  return local;
}

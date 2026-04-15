export type MoodMeterZone = "red" | "blue" | "green" | "yellow";

export type EmotionCheckinInput = {
  text: string;
  context?: string;
  spendLevel?: number;
  sleepHours?: number;
  recentEventConflict?: boolean;
};

export type EmotionCheckinResult = {
  primaryEmotion: string;
  secondaryEmotion: string[];
  moodZone: MoodMeterZone;
  energy: number;
  pleasantness: number;
  riskScore: number;
  riskLevel: "low" | "medium" | "high";
  signals: string[];
  guidance: string[];
  suggestedMode: "quick_checkin" | "deep_exploration" | "rain";
};

const LEXICON: Record<string, { emotion: string; energy: number; pleasantness: number; weight: number; signal?: string }> = {
  "累": { emotion: "耗竭", energy: 20, pleasantness: 25, weight: 2, signal: "疲憊" },
  "好累": { emotion: "耗竭", energy: 18, pleasantness: 20, weight: 3, signal: "疲憊" },
  "空虛": { emotion: "空虛", energy: 28, pleasantness: 18, weight: 3, signal: "情緒落差" },
  "焦慮": { emotion: "焦慮", energy: 72, pleasantness: 18, weight: 3, signal: "高張焦慮" },
  "害怕": { emotion: "害怕", energy: 70, pleasantness: 15, weight: 2, signal: "不安全感" },
  "生氣": { emotion: "憤怒", energy: 80, pleasantness: 10, weight: 3, signal: "攻擊性情緒" },
  "崩潰": { emotion: "失控", energy: 88, pleasantness: 8, weight: 4, signal: "情緒失衡" },
  "想哭": { emotion: "悲傷", energy: 40, pleasantness: 15, weight: 3, signal: "悲傷" },
  "難過": { emotion: "悲傷", energy: 35, pleasantness: 18, weight: 2, signal: "悲傷" },
  "煩": { emotion: "煩躁", energy: 68, pleasantness: 25, weight: 2, signal: "刺激過載" },
  "壓力": { emotion: "壓力", energy: 65, pleasantness: 22, weight: 2, signal: "壓力" },
  "失望": { emotion: "失望", energy: 30, pleasantness: 16, weight: 3, signal: "期待落空" },
  "不值得": { emotion: "失落", energy: 32, pleasantness: 14, weight: 3, signal: "價值感受損" },
  "後悔": { emotion: "懊悔", energy: 45, pleasantness: 16, weight: 2, signal: "消費後悔" },
  "花太多": { emotion: "失控", energy: 62, pleasantness: 20, weight: 3, signal: "高消費壓力" },
  "燒": { emotion: "憤怒", energy: 85, pleasantness: 8, weight: 4, signal: "破壞衝動" },
  "毀掉": { emotion: "憤怒", energy: 85, pleasantness: 10, weight: 4, signal: "破壞衝動" },
  "嫉妒": { emotion: "嫉妒", energy: 72, pleasantness: 14, weight: 3, signal: "佔有與比較" },
  "討厭": { emotion: "排斥", energy: 75, pleasantness: 12, weight: 2, signal: "敵意" },
  "捨不得": { emotion: "依戀", energy: 48, pleasantness: 42, weight: 2, signal: "依附加深" },
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function scoreRisk(text: string, spendLevel?: number, sleepHours?: number, recentEventConflict?: boolean) {
  let risk = 18;
  const signals = new Set<string>();

  if (/燒|毀|砸|報復|公開/.test(text)) {
    risk += 38;
    signals.add("有外顯破壞或報復字眼");
  }
  if (/崩潰|失控|受不了|真的不行/.test(text)) {
    risk += 24;
    signals.add("情緒失控訊號");
  }
  if (/花太多|刷卡|課金|all in|榨乾/.test(text)) {
    risk += 18;
    signals.add("高消費壓力");
  }
  if (/嫉妒|比較|偏心|不公平/.test(text)) {
    risk += 12;
    signals.add("強烈比較與不公平感");
  }
  if ((spendLevel ?? 0) >= 8) {
    risk += 12;
    signals.add("自評高消費強度");
  }
  if ((sleepHours ?? 8) < 5) {
    risk += 10;
    signals.add("睡眠不足");
  }
  if (recentEventConflict) {
    risk += 14;
    signals.add("近期現場衝突");
  }

  return { risk: clamp(risk), signals: [...signals] };
}

export function analyzeEmotion(input: EmotionCheckinInput): EmotionCheckinResult {
  const text = `${input.text} ${input.context ?? ""}`.trim();
  const hits = Object.entries(LEXICON)
    .filter(([keyword]) => text.includes(keyword))
    .map(([, value]) => value);

  const defaultState: { emotion: string; energy: number; pleasantness: number; weight: number; signal?: string } = {
    emotion: "複雜",
    energy: 45,
    pleasantness: 40,
    weight: 1,
  };
  const totalWeight = hits.reduce((sum, item) => sum + item.weight, 0) || defaultState.weight;
  const weighted = hits.length ? hits : [defaultState];

  const energy = clamp(
    Math.round(weighted.reduce((sum, item) => sum + item.energy * item.weight, 0) / totalWeight),
  );
  const pleasantness = clamp(
    Math.round(weighted.reduce((sum, item) => sum + item.pleasantness * item.weight, 0) / totalWeight),
  );

  const counts = new Map<string, number>();
  for (const item of weighted) {
    counts.set(item.emotion, (counts.get(item.emotion) ?? 0) + item.weight);
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([emotion]) => emotion);
  const primaryEmotion = ranked[0] ?? "複雜";
  const secondaryEmotion = ranked.slice(1, 4);

  const moodZone: MoodMeterZone =
    energy >= 50 && pleasantness < 50 ? "red" :
    energy < 50 && pleasantness < 50 ? "blue" :
    energy < 50 && pleasantness >= 50 ? "green" : "yellow";

  const riskInfo = scoreRisk(text, input.spendLevel, input.sleepHours, input.recentEventConflict);
  const riskLevel = riskInfo.risk >= 70 ? "high" : riskInfo.risk >= 40 ? "medium" : "low";

  const lexiconSignals = weighted.map(item => item.signal).filter((signal): signal is string => Boolean(signal));
  const signals = [...new Set([...riskInfo.signals, ...lexiconSignals])];

  const guidance = riskLevel === "high"
    ? [
        "先暫停任何衝動消費、公開發文或丟棄物品 24 小時。",
        "把現在最強烈的感受寫成一句：我其實在痛的是什麼？",
        "找一位可信任的人或專業支持對象同步你的狀態。",
      ]
    : riskLevel === "medium"
      ? [
          "先做 3 次慢呼吸，再區分：你現在是難過、失望，還是生氣？",
          "把觸發點拆成事件、身體感受、想法三欄。",
          "今天避免高額推活決策，先延後到明天。",
        ]
      : [
          "先替情緒命名，不急著處理它。",
          "記下觸發點與身體反應，建立自己的情緒地圖。",
          "若想繼續整理，可以用 2 分鐘 quick check-in。",
        ];

  const suggestedMode = riskLevel === "high" ? "rain" : riskLevel === "medium" ? "deep_exploration" : "quick_checkin";

  return {
    primaryEmotion,
    secondaryEmotion,
    moodZone,
    energy,
    pleasantness,
    riskScore: riskInfo.risk,
    riskLevel,
    signals,
    guidance,
    suggestedMode,
  };
}

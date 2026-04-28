import { getTemplate, getVisualDirection } from "../templates";
import type { DesignProjectInput } from "../schemas";

export function composeDesignStudioPrompt(input: DesignProjectInput) {
  const template = getTemplate(input.templateId);
  const direction = getVisualDirection(input.visualDirectionId);
  const member = input.member;
  const event = input.event;

  return [
    "你是 idol-platform v5 的 AI Design Studio 代理。",
    "請先確認設計用途、受眾、資料來源、視覺方向與輸出格式，再生成 artifact。",
    "安全規範：僅使用授權素材；真人偶像生成素材需標註 AI generated；不得冒用本人發言；不得產生未授權 deepfake；不得成人化、惡意醜化、誤導性政治或商業宣傳；保留 prompt 與時間紀錄。",
    `模板：${template.title}`,
    `技能：${template.skillId}`,
    `視覺方向：${direction.name}，色票 ${direction.palette.join(" / ")}`,
    `資料來源：${input.dataSource}`,
    member
      ? `成員：${member.name} / ${member.nickname ?? ""} / ${member.color ?? ""} / ${(member.tags ?? []).join("、")}`
      : "",
    event
      ? `活動：${event.name ?? ""} / ${event.date ?? ""} / ${event.venue ?? ""} / ${event.groups ?? ""}`
      : "",
    `需求：${input.brief}`,
    "輸出需包含：HTML artifact、Markdown 摘要、可匯出格式建議、資料來源註記。",
  ]
    .filter(Boolean)
    .join("\n");
}

export function renderDesignArtifact(input: DesignProjectInput) {
  const template = getTemplate(input.templateId);
  const direction = getVisualDirection(input.visualDirectionId);
  const member = input.member;
  const event = input.event;
  const title = input.title || template.title;
  const tags = member?.tags?.join(" / ") || "ranking / events / fan culture";
  const primary = direction.palette[0];
  const secondary = direction.palette[1];
  const light = direction.palette[2];
  const dark = direction.palette[3];

  const heroTitle = member?.name || event?.name || title;
  const subtitle =
    member?.nickname
      ? `${member.nickname} · ${member.color ?? "idol color"} · ${tags}`
      : event?.venue
        ? `${event.date ?? "日期待定"} · ${event.venue}`
        : template.description;

  const generatedAt = new Date().toISOString();
  const html = `<!doctype html>
<html lang="zh-TW">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <meta name="generator" content="idol-platform v5 AI Design Studio" />
  <meta name="generated-at" content="${generatedAt}" />
  <meta name="policy-version" content="idol-design-policy-v1" />
  <style>
    :root { --primary: ${primary}; --secondary: ${secondary}; --light: ${light}; --dark: ${dark}; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: "Noto Sans TC", "Yu Gothic", Arial, sans-serif; background: var(--dark); color: var(--light); }
    main { min-height: 100vh; display: grid; grid-template-rows: auto 1fr auto; }
    .hero { padding: 56px 7vw 34px; background: linear-gradient(135deg, color-mix(in srgb, var(--primary) 34%, transparent), transparent 58%), var(--dark); border-bottom: 1px solid rgba(255,255,255,.16); }
    .kicker { color: var(--secondary); font-size: 12px; letter-spacing: .22em; text-transform: uppercase; font-weight: 800; }
    h1 { margin: 16px 0 10px; font-size: clamp(42px, 8vw, 104px); line-height: .92; letter-spacing: 0; }
    .subtitle { max-width: 820px; font-size: clamp(16px, 2vw, 24px); line-height: 1.7; color: rgba(255,255,255,.78); }
    .grid { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(280px, .8fr); gap: 24px; padding: 34px 7vw 54px; }
    section { border: 1px solid rgba(255,255,255,.14); border-radius: 8px; padding: 24px; background: rgba(255,255,255,.055); }
    h2 { margin: 0 0 16px; font-size: 20px; }
    .chips { display: flex; flex-wrap: wrap; gap: 10px; }
    .chip { border: 1px solid color-mix(in srgb, var(--primary) 55%, white); color: var(--light); padding: 8px 12px; border-radius: 999px; background: rgba(255,255,255,.07); }
    .metric { display: grid; gap: 6px; padding: 16px 0; border-bottom: 1px solid rgba(255,255,255,.12); }
    .metric strong { font-size: 28px; color: var(--secondary); }
    .cta { display: inline-flex; margin-top: 24px; background: var(--primary); color: var(--dark); padding: 13px 18px; border-radius: 6px; font-weight: 900; text-decoration: none; }
    .notice { margin-top: 18px; font-size: 12px; color: rgba(255,255,255,.66); }
    footer { padding: 20px 7vw; color: rgba(255,255,255,.58); border-top: 1px solid rgba(255,255,255,.12); }
    @media (max-width: 820px) { .grid { grid-template-columns: 1fr; } h1 { font-size: 48px; } }
  </style>
</head>
<body>
  <main>
    <header class="hero">
      <div class="kicker">idol-platform design studio · ${template.output}</div>
      <h1>${heroTitle}</h1>
      <p class="subtitle">${subtitle}</p>
      <p class="notice">AI generated draft · 僅使用授權素材 · 不代表本人發言或官方背書</p>
      <a class="cta" href="#">前往官方資料</a>
    </header>
    <div class="grid">
      <section>
        <h2>企劃重點</h2>
        <p>${input.brief}</p>
        <div class="chips">
          ${(member?.tags ?? ["活動", "社群", "物販", "粉絲文化"]).map((tag) => `<span class="chip">${tag}</span>`).join("")}
        </div>
      </section>
      <section>
        <h2>資料訊號</h2>
        <div class="metric"><span>模板</span><strong>${template.title}</strong></div>
        <div class="metric"><span>視覺方向</span><strong>${direction.name}</strong></div>
        <div class="metric"><span>資料來源</span><strong>${input.dataSource}</strong></div>
      </section>
    </div>
    <footer>Generated by idol-platform v5 AI Design Studio at ${generatedAt}. Policy: idol-design-policy-v1.</footer>
  </main>
</body>
</html>`;

  const markdown = `# ${title}

- 模板：${template.title}
- 視覺方向：${direction.name}
- 資料來源：${input.dataSource}
- 主要對象：${heroTitle}
- 輸出格式：${template.output}
- 生成時間：${generatedAt}
- 規範版本：idol-design-policy-v1
- 標註：AI generated draft，不代表本人發言或官方背書

## Brief

${input.brief}
`;

  return { html, markdown };
}

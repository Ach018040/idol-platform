"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { composeDesignStudioPrompt, renderDesignArtifact } from "@/lib/design/prompts";
import type { DesignProjectInput, DesignTemplateId, IdolDesignSource, VisualDirectionId } from "@/lib/design/schemas";
import { DEFAULT_PROJECT, DESIGN_TEMPLATES, VISUAL_DIRECTIONS, getTemplate } from "@/lib/design/templates";

const dataSources: { id: IdolDesignSource; label: string }[] = [
  { id: "member", label: "成員資料" },
  { id: "group", label: "團體資料" },
  { id: "event", label: "活動資料" },
  { id: "market", label: "市場分析" },
  { id: "manual", label: "手動輸入" },
];

function downloadBlob(filename: string, content: BlobPart, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function DesignStudioWorkbench({
  view = "dashboard",
}: {
  view?: "dashboard" | "projects" | "templates" | "preview" | "export";
}) {
  const [project, setProject] = useState<DesignProjectInput>(DEFAULT_PROJECT);
  const [activePanel, setActivePanel] = useState(view);
  const [policyAccepted, setPolicyAccepted] = useState(true);
  const [generated, setGenerated] = useState<{
    projectId: string;
    artifactId: string | null;
    persisted: boolean;
    html: string;
    markdown: string;
  } | null>(null);
  const [status, setStatus] = useState("本機預覽已就緒");

  const artifact = useMemo(() => renderDesignArtifact(project), [project]);
  const prompt = useMemo(() => composeDesignStudioPrompt(project), [project]);
  const selectedTemplate = getTemplate(project.templateId);

  function updateProject(next: Partial<DesignProjectInput>) {
    setProject((current) => ({ ...current, ...next }));
  }

  function updateMember(key: keyof NonNullable<DesignProjectInput["member"]>, value: string) {
    setProject((current) => ({
      ...current,
      member: {
        name: current.member?.name ?? "",
        ...current.member,
        [key]: key === "tags" ? value.split(/[、,]/).map((item) => item.trim()).filter(Boolean) : value,
      },
    }));
  }

  function updateEvent(key: keyof NonNullable<DesignProjectInput["event"]>, value: string) {
    setProject((current) => ({
      ...current,
      event: {
        ...current.event,
        [key]: value,
      },
    }));
  }

  async function generateArtifact() {
    if (!policyAccepted) {
      setStatus("請先確認 idol-platform 生成規範");
      return;
    }

    setStatus("正在產生 artifact...");
    const response = await fetch("/api/design/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project, provider: "local-template" }),
    });
    const data = await response.json();
    if (!response.ok) {
      setStatus(data?.error || "生成失敗");
      return;
    }

    setGenerated({
      projectId: data.projectId,
      artifactId: data.artifactId,
      persisted: Boolean(data.persisted),
      html: data.artifact.html,
      markdown: data.artifact.markdown,
    });
    setStatus(data.persisted ? "已生成並寫入 Supabase" : "已本機生成；Supabase migration 或環境變數尚未啟用");
  }

  async function exportArtifact(format: "html" | "markdown" | "zip" | "pdf" | "pptx") {
    const current = generated ?? {
      projectId: "",
      artifactId: null,
      persisted: false,
      html: artifact.html,
      markdown: artifact.markdown,
    };
    const response = await fetch("/api/design/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        format,
        title: project.title || "idol-design-artifact",
        projectId: current.projectId,
        artifactId: current.artifactId,
        html: current.html,
        markdown: current.markdown,
      }),
    });

    if (format === "pdf" || format === "pptx") {
      const data = await response.json();
      setStatus(data?.message || `${format.toUpperCase()} 匯出工作已建立`);
      return;
    }

    const ext = format === "markdown" ? "md" : format === "zip" ? "zip" : "html";
    const type = format === "markdown" ? "text/markdown" : format === "zip" ? "application/zip" : "text/html";
    const payload = format === "zip" ? await response.blob() : await response.text();
    downloadBlob(`${project.title || "idol-design-artifact"}.${ext}`, payload, type);
    setStatus(`${format.toUpperCase()} 已匯出`);
  }

  const navItems: [typeof activePanel, string][] = [
    ["dashboard", "Dashboard"],
    ["projects", "新增專案"],
    ["templates", "模板庫"],
    ["preview", "即時預覽"],
    ["export", "匯出"],
  ];

  return (
    <main className="min-h-screen bg-[#f6f1e8] text-[#181514]">
      <header className="border-b border-[#181514]/10 bg-[#fdfaf4]">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.28em] text-[#ba3f5a]">idol-platform v5</div>
            <h1 className="mt-3 text-4xl font-black leading-tight md:text-6xl">AI Design Studio</h1>
            <p className="mt-3 max-w-3xl text-base leading-8 text-[#514a44]">
              以偶像成員、團體、活動、物販與市場分析資料，快速產生 Landing Page、成員介紹頁、活動頁、簡報、PDF 草稿、社群圖卡與虛擬展場頁面。
            </p>
          </div>
          <nav className="flex flex-wrap gap-2 text-sm font-bold">
            <Link className="rounded-md border border-[#181514]/15 px-4 py-2 hover:bg-white" href="/">返回首頁</Link>
            <Link className="rounded-md border border-[#181514]/15 px-4 py-2 hover:bg-white" href="/creative-studio">Creative Studio</Link>
            <Link className="rounded-md bg-[#181514] px-4 py-2 text-white hover:bg-[#2b2724]" href="/design-studio/preview">開啟預覽</Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <section className="rounded-lg border border-[#181514]/10 bg-white p-4">
            <h2 className="text-sm font-black">工作區</h2>
            <div className="mt-3 grid gap-2">
              {navItems.map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setActivePanel(id)}
                  className={`rounded-md px-3 py-2 text-left text-sm font-bold transition ${
                    activePanel === id ? "bg-[#181514] text-white" : "bg-[#f6f1e8] text-[#514a44] hover:bg-[#eee3d4]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-[#181514]/10 bg-white p-4">
            <h2 className="text-sm font-black">Runtime</h2>
            <dl className="mt-3 grid gap-2 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-[#756b62]">Skill</dt><dd className="font-bold">{selectedTemplate.skillId}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-[#756b62]">Design System</dt><dd className="font-bold">{project.designSystemId}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-[#756b62]">Preview</dt><dd className="font-bold">sandbox iframe</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-[#756b62]">Storage</dt><dd className="font-bold">Supabase-ready</dd></div>
            </dl>
          </section>
        </aside>

        <div className="space-y-6">
          {activePanel === "dashboard" && (
            <section className="grid gap-4 md:grid-cols-3">
              {[
                ["7", "預設模板", "Profile、活動、生日祭、物販、週報、展場、簡報"],
                ["5", "專用 Skills", "idol-profile、event、virtual exhibition、market report、pitch deck"],
                ["5", "匯出格式", "HTML、Markdown、ZIP 已可用；PDF / PPTX 先建立 job"],
              ].map(([value, label, text]) => (
                <div key={label} className="rounded-lg border border-[#181514]/10 bg-white p-5">
                  <div className="text-4xl font-black text-[#ba3f5a]">{value}</div>
                  <div className="mt-2 font-black">{label}</div>
                  <p className="mt-2 text-sm leading-6 text-[#655d55]">{text}</p>
                </div>
              ))}
            </section>
          )}

          {(activePanel === "dashboard" || activePanel === "projects") && (
            <section className="rounded-lg border border-[#181514]/10 bg-[#fffaf0] p-5">
              <label className="flex items-start gap-3 text-sm leading-7 text-[#514a44]">
                <input
                  type="checkbox"
                  checked={policyAccepted}
                  onChange={(event) => setPolicyAccepted(event.target.checked)}
                  className="mt-1 h-4 w-4"
                />
                <span>
                  我確認本次生成僅使用授權素材；真人偶像生成素材會標註 AI generated；不冒用本人發言、不製作未授權 deepfake、不生成成人化、惡意醜化、誤導性政治或商業宣傳內容；並保留 prompt 與時間紀錄。
                </span>
              </label>
            </section>
          )}

          {(activePanel === "dashboard" || activePanel === "projects") && (
            <section className="rounded-lg border border-[#181514]/10 bg-white p-5">
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-2xl font-black">新增設計專案</h2>
                  <p className="mt-1 text-sm text-[#655d55]">先鎖定用途、資料來源與視覺方向，再產生 artifact。</p>
                </div>
                <button
                  onClick={() => void generateArtifact().then(() => setActivePanel("preview"))}
                  className="rounded-md bg-[#ba3f5a] px-4 py-2 text-sm font-black text-white hover:bg-[#a6334c]"
                >
                  產生 Preview
                </button>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-bold">
                  專案名稱
                  <input value={project.title} onChange={(event) => updateProject({ title: event.target.value })} className="rounded-md border border-[#181514]/15 px-3 py-2 font-normal text-[#181514]" />
                </label>
                <label className="grid gap-2 text-sm font-bold">
                  設計類型
                  <select
                    value={project.templateId}
                    onChange={(event) => {
                      const template = getTemplate(event.target.value as DesignTemplateId);
                      updateProject({ templateId: template.id, skillId: template.skillId });
                    }}
                    className="rounded-md border border-[#181514]/15 px-3 py-2 font-normal text-[#181514]"
                  >
                    {DESIGN_TEMPLATES.map((template) => (
                      <option key={template.id} value={template.id}>{template.title}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-bold">
                  資料來源
                  <select value={project.dataSource} onChange={(event) => updateProject({ dataSource: event.target.value as IdolDesignSource })} className="rounded-md border border-[#181514]/15 px-3 py-2 font-normal text-[#181514]">
                    {dataSources.map((source) => <option key={source.id} value={source.id}>{source.label}</option>)}
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-bold">
                  視覺方向
                  <select value={project.visualDirectionId} onChange={(event) => updateProject({ visualDirectionId: event.target.value as VisualDirectionId })} className="rounded-md border border-[#181514]/15 px-3 py-2 font-normal text-[#181514]">
                    {VISUAL_DIRECTIONS.map((direction) => <option key={direction.id} value={direction.id}>{direction.name}</option>)}
                  </select>
                </label>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-bold">
                  成員名稱
                  <input value={project.member?.name ?? ""} onChange={(event) => updateMember("name", event.target.value)} className="rounded-md border border-[#181514]/15 px-3 py-2 font-normal text-[#181514]" />
                </label>
                <label className="grid gap-2 text-sm font-bold">
                  標籤
                  <input value={(project.member?.tags ?? []).join("、")} onChange={(event) => updateMember("tags", event.target.value)} className="rounded-md border border-[#181514]/15 px-3 py-2 font-normal text-[#181514]" />
                </label>
                <label className="grid gap-2 text-sm font-bold">
                  活動名稱
                  <input value={project.event?.name ?? ""} onChange={(event) => updateEvent("name", event.target.value)} className="rounded-md border border-[#181514]/15 px-3 py-2 font-normal text-[#181514]" />
                </label>
                <label className="grid gap-2 text-sm font-bold">
                  日期 / 地點
                  <input value={`${project.event?.date ?? ""} ${project.event?.venue ?? ""}`} onChange={(event) => updateEvent("venue", event.target.value)} className="rounded-md border border-[#181514]/15 px-3 py-2 font-normal text-[#181514]" />
                </label>
              </div>

              <label className="mt-4 grid gap-2 text-sm font-bold">
                需求輸入
                <textarea value={project.brief} onChange={(event) => updateProject({ brief: event.target.value })} rows={4} className="rounded-md border border-[#181514]/15 px-3 py-2 font-normal leading-7 text-[#181514]" />
              </label>
            </section>
          )}

          {activePanel === "templates" && (
            <section className="grid gap-4 md:grid-cols-2">
              {DESIGN_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => {
                    updateProject({ templateId: template.id, skillId: template.skillId });
                    setActivePanel("projects");
                  }}
                  className="rounded-lg border border-[#181514]/10 bg-white p-5 text-left hover:border-[#ba3f5a]"
                >
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-[#ba3f5a]">{template.output}</div>
                  <h3 className="mt-2 text-xl font-black">{template.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#655d55]">{template.description}</p>
                </button>
              ))}
            </section>
          )}

          {(activePanel === "preview" || activePanel === "dashboard") && (
            <section className="rounded-lg border border-[#181514]/10 bg-white p-5">
              <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-black">即時 Preview</h2>
                  <p className="mt-1 text-sm text-[#655d55]">以 sandbox iframe 預覽 HTML artifact。</p>
                </div>
                <button onClick={() => setActivePanel("export")} className="rounded-md bg-[#181514] px-4 py-2 text-sm font-black text-white">前往匯出</button>
              </div>
              <div className="overflow-hidden rounded-lg border border-[#181514]/15 bg-[#111827]">
                <iframe title="Design Studio Preview" srcDoc={generated?.html ?? artifact.html} className="h-[620px] w-full bg-white" sandbox="allow-same-origin" />
              </div>
              <p className="mt-3 text-xs font-bold text-[#655d55]">{status}</p>
            </section>
          )}

          {activePanel === "export" && (
            <section className="rounded-lg border border-[#181514]/10 bg-white p-5">
              <h2 className="text-2xl font-black">匯出</h2>
              <p className="mt-1 text-sm text-[#655d55]">HTML、Markdown、ZIP 已可下載；PDF / PPTX 目前建立匯出工作，下一階段接正式 renderer。</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => void exportArtifact("html")} className="rounded-md bg-[#ba3f5a] px-4 py-2 text-sm font-black text-white">下載 HTML</button>
                <button onClick={() => void exportArtifact("markdown")} className="rounded-md bg-[#181514] px-4 py-2 text-sm font-black text-white">下載 Markdown</button>
                <button onClick={() => void exportArtifact("zip")} className="rounded-md border border-[#181514]/15 px-4 py-2 text-sm font-black text-[#514a44] hover:bg-[#f6f1e8]">ZIP Bundle</button>
                <button onClick={() => void exportArtifact("pdf")} className="rounded-md border border-[#181514]/15 px-4 py-2 text-sm font-black text-[#514a44] hover:bg-[#f6f1e8]">PDF Job</button>
                <button onClick={() => void exportArtifact("pptx")} className="rounded-md border border-[#181514]/15 px-4 py-2 text-sm font-black text-[#514a44] hover:bg-[#f6f1e8]">PPTX Job</button>
              </div>
              <p className="mt-3 text-xs font-bold text-[#655d55]">{status}</p>
              <pre className="mt-5 max-h-80 overflow-auto rounded-lg bg-[#181514] p-4 text-xs leading-6 text-[#f6f1e8]">{prompt}</pre>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

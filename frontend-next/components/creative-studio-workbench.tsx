"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { composeCreativePrompt, CREATIVE_POLICY } from "@/lib/creative/generator";
import type { CreativeAsset, CreativeMode, CreativeRunInput, CreativeStyle } from "@/lib/creative/schemas";
import { CREATIVE_MODES, CREATIVE_STYLES, DEFAULT_CREATIVE_INPUT, getCreativeMode, getCreativeStyle } from "@/lib/creative/templates";

type MemberOption = {
  id: string;
  name: string;
  group?: string;
  color_name?: string;
  color?: string;
  temperature_index_v2?: number;
};

const STORAGE_KEY = "idol-platform-creative-assets-v1";

function readAssets(): CreativeAsset[] {
  if (typeof window === "undefined") return [];
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

function writeAssets(items: CreativeAsset[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 40)));
}

function copyText(text: string) {
  void navigator.clipboard?.writeText(text);
}

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function CreativeStudioWorkbench({
  view = "studio",
}: {
  view?: "studio" | "templates" | "assets" | "workflows" | "settings";
}) {
  const [activeView, setActiveView] = useState(view);
  const [input, setInput] = useState<CreativeRunInput>(DEFAULT_CREATIVE_INPUT);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [assets, setAssets] = useState<CreativeAsset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<CreativeAsset | null>(null);
  const [policyAccepted, setPolicyAccepted] = useState(true);
  const [status, setStatus] = useState("mock provider ready");

  const prompt = useMemo(() => composeCreativePrompt(input), [input]);
  const style = getCreativeStyle(input.style);
  const mode = getCreativeMode(input.mode);

  useEffect(() => {
    setAssets(readAssets());
    fetch("/data/member_rankings.json")
      .then((res) => (res.ok ? res.json() : []))
      .then((rows) => setMembers(Array.isArray(rows) ? rows.slice(0, 60) : []))
      .catch(() => setMembers([]));
  }, []);

  function patchInput(patch: Partial<CreativeRunInput>) {
    setInput((current) => ({ ...current, ...patch }));
  }

  function selectMember(memberId: string) {
    const member = members.find((item) => item.id === memberId);
    if (!member) return;
    patchInput({
      memberName: member.name,
      memberColor: member.color_name || member.color || input.memberColor,
      memberTags: [member.group || "solo", `temperature ${Math.round(member.temperature_index_v2 ?? 0)}`],
    });
  }

  async function generateAsset() {
    if (!policyAccepted) {
      setStatus("請先確認 Creative Studio 安全規範");
      return;
    }

    setStatus("正在產生 mock 素材...");
    const response = await fetch("/api/creative/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input }),
    });
    const data = await response.json();
    if (!response.ok) {
      setStatus(data?.error || "生成失敗");
      return;
    }

    const next = [data.asset as CreativeAsset, ...assets];
    setAssets(next);
    setSelectedAsset(data.asset);
    writeAssets(next);
    setStatus("已儲存到本機素材庫");
  }

  const latest = selectedAsset ?? assets[0];
  const navItems: [typeof activeView, string][] = [
    ["studio", "生成工作台"],
    ["templates", "Prompt Templates"],
    ["assets", "Asset History"],
    ["workflows", "Workflows"],
    ["settings", "Settings"],
  ];

  return (
    <main className="min-h-screen bg-[#0d1117] text-white">
      <header className="border-b border-white/10 bg-[#101720]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-normal md:text-6xl">Creative Studio</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
              偶像素材生成工作台：從成員資料、代表色、活動主題、服裝風格與舞台情緒，產出海報、主視覺、MV 分鏡與社群文案。
            </p>
          </div>
          <nav className="flex flex-wrap gap-2 text-sm font-bold">
            <Link href="/" className="rounded-md border border-white/15 px-4 py-2 text-slate-200 hover:bg-white/10">返回首頁</Link>
            <Link href="/design-studio" className="rounded-md border border-white/15 px-4 py-2 text-slate-200 hover:bg-white/10">Design Studio</Link>
            <button onClick={() => void generateAsset()} className="rounded-md bg-cyan-300 px-4 py-2 text-slate-950 hover:bg-cyan-200">生成素材</button>
          </nav>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-5 py-5 lg:grid-cols-[260px_minmax(0,1fr)_340px]">
        <aside className="space-y-4">
          <section className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <h2 className="text-sm font-black text-cyan-200">Studio</h2>
            <div className="mt-3 grid gap-2">
              {navItems.map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setActiveView(id)}
                  className={`rounded-md px-3 py-2 text-left text-sm font-bold ${
                    activeView === id ? "bg-cyan-300 text-slate-950" : "bg-slate-900 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <h2 className="text-sm font-black text-cyan-200">Safety</h2>
            <label className="mt-3 flex items-start gap-3 text-xs leading-6 text-slate-300">
              <input type="checkbox" checked={policyAccepted} onChange={(event) => setPolicyAccepted(event.target.checked)} className="mt-1" />
              <span>我確認不生成未授權真人冒用、惡意 deepfake、成人或侵權內容，並標註 AI generated。</span>
            </label>
          </section>
        </aside>

        <section className="space-y-5">
          {(activeView === "studio" || activeView === "templates") && (
            <div className="rounded-lg border border-white/10 bg-[#151c28] p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-bold">
                  選擇偶像成員
                  <select onChange={(event) => selectMember(event.target.value)} className="rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-white">
                    <option value="">使用預設成員</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>{member.name} {member.group ? `｜${member.group}` : ""}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-bold">
                  生成類型
                  <select value={input.mode} onChange={(event) => patchInput({ mode: event.target.value as CreativeMode })} className="rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-white">
                    {CREATIVE_MODES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-bold">
                  視覺風格
                  <select value={input.style} onChange={(event) => patchInput({ style: event.target.value as CreativeStyle })} className="rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-white">
                    {CREATIVE_STYLES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-bold">
                  成員名稱
                  <input value={input.memberName} onChange={(event) => patchInput({ memberName: event.target.value })} className="rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-white" />
                </label>
                <label className="grid gap-2 text-sm font-bold md:col-span-2">
                  活動主題
                  <input value={input.eventTheme} onChange={(event) => patchInput({ eventTheme: event.target.value })} className="rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-white" />
                </label>
                <label className="grid gap-2 text-sm font-bold">
                  服裝風格
                  <textarea value={input.outfitStyle} onChange={(event) => patchInput({ outfitStyle: event.target.value })} rows={3} className="rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-white" />
                </label>
                <label className="grid gap-2 text-sm font-bold">
                  舞台情緒
                  <textarea value={input.stageMood} onChange={(event) => patchInput({ stageMood: event.target.value })} rows={3} className="rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-white" />
                </label>
              </div>
            </div>
          )}

          {activeView === "workflows" && (
            <div className="rounded-lg border border-white/10 bg-[#151c28] p-5">
              <h2 className="text-2xl font-black">Workflow</h2>
              <div className="mt-4 grid gap-3">
                {["活動名稱輸入", "生成活動主視覺", "生成社群貼文", "生成限動尺寸", "生成短影片分鏡", "生成 CTA 文案", "匯出素材包"].map((step, index) => (
                  <div key={step} className="flex items-center gap-3 rounded-md bg-slate-950 p-3 text-sm">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-cyan-300 text-xs font-black text-slate-950">{index + 1}</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeView === "settings" && (
            <div className="rounded-lg border border-white/10 bg-[#151c28] p-5">
              <h2 className="text-2xl font-black">Provider Settings</h2>
              <p className="mt-2 text-sm leading-7 text-slate-300">
                目前使用 mock provider。後續可接 Muapi、Replicate、Fal、OpenAI Images 或自架 Stable Diffusion；所有 provider 都必須套用 idol-platform 安全規範與成本控管。
              </p>
              <div className="mt-4 grid gap-2 text-sm text-slate-300">
                {CREATIVE_POLICY.map((item) => <p key={item}>- {item}</p>)}
              </div>
            </div>
          )}

          {activeView === "assets" && (
            <div className="rounded-lg border border-white/10 bg-[#151c28] p-5">
              <h2 className="text-2xl font-black">Asset History Library</h2>
              <div className="mt-4 grid gap-3">
                {assets.length === 0 ? <p className="text-sm text-slate-400">尚未儲存素材。</p> : assets.map((asset) => (
                  <button key={asset.id} onClick={() => setSelectedAsset(asset)} className="rounded-md border border-white/10 bg-slate-950 p-3 text-left hover:border-cyan-300">
                    <div className="font-black">{asset.title}</div>
                    <div className="mt-1 text-xs text-slate-400">{asset.mode} · {new Date(asset.createdAt).toLocaleString("zh-TW")}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {(activeView === "studio" || activeView === "templates") && (
            <div className="rounded-lg border border-white/10 bg-[#151c28] p-5">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-black">Prompt</h2>
                <button onClick={() => copyText(prompt)} className="rounded-md border border-cyan-300/40 px-3 py-2 text-xs font-black text-cyan-200">複製 Prompt</button>
              </div>
              <pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap rounded-md bg-slate-950 p-4 text-xs leading-6 text-slate-200">{prompt}</pre>
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <section className="overflow-hidden rounded-lg border border-white/10 bg-[#151c28]">
            <div
              className="min-h-[420px] p-5"
              style={{ background: `linear-gradient(135deg, ${style.palette[0]}, ${style.palette[1]} 55%, ${style.palette[2]})` }}
            >
              <div className="flex h-[380px] flex-col justify-between rounded-lg border border-white/25 bg-black/25 p-5 backdrop-blur">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.2em] text-white/70">AI generated draft</div>
                  <h2 className="mt-4 text-4xl font-black">{latest?.mockPreview.headline ?? input.memberName}</h2>
                  <p className="mt-2 text-sm text-white/80">{latest?.mockPreview.subline ?? `${mode.label} · ${style.label}`}</p>
                </div>
                <div className="rounded-md bg-white/15 p-3 text-xs leading-6">
                  {latest?.mockPreview.format ?? "poster canvas"} · 不代表本人發言或官方背書
                </div>
              </div>
            </div>
            <div className="space-y-3 p-4">
              <div className="text-xs font-bold text-slate-400">{status}</div>
              <button onClick={() => void generateAsset()} className="w-full rounded-md bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950">生成並儲存素材</button>
              <button onClick={() => downloadText("social-copy.txt", latest?.socialCopy ?? "")} className="w-full rounded-md border border-white/10 px-4 py-3 text-sm font-black text-slate-200">匯出社群文案</button>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}

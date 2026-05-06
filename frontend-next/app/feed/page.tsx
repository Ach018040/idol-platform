import Link from "next/link";
import dataQuality from "@/public/data/data_quality.json";
import insights from "@/public/data/insights.json";
import memberRankings from "@/public/data/member_rankings.json";
import groupRankings from "@/public/data/v7_rankings.json";
import eventDiscovery from "@/public/data/event_discovery.json";

type MemberRanking = {
  rank: number;
  name: string;
  group?: string;
  photo_url?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  temperature_index_v2?: number;
  data_confidence?: number;
  seo_discoverability_score?: number;
  last_social_signal_at?: string | null;
  days_since_social_signal?: number | null;
};

type GroupRanking = {
  rank: number;
  group: string;
  display_name?: string;
  member_count?: number;
  member_names?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  youtube?: string;
  group_temperature_index_v2?: number;
  group_seo_discoverability_score?: number;
  active_member_count?: number;
  days_since_update?: number;
};

function pct(value: number | undefined) {
  return `${Math.round((value ?? 0) * 100)}%`;
}

function score(value: number | undefined) {
  return Number.isFinite(value) ? value!.toFixed(1) : "—";
}

function daysLabel(days?: number | null) {
  if (days == null || !Number.isFinite(days)) return "尚無真實社群更新";
  if (days <= 7) return `${days.toFixed(1)} 天前有社群訊號`;
  if (days <= 30) return `${Math.round(days)} 天前有社群訊號`;
  return `${Math.round(days)} 天未偵測社群更新`;
}

function firstMembers(value?: string) {
  if (!value) return "成員資料待補";
  return value.split(" / ").slice(0, 4).join(" / ");
}

export default function FeedPage() {
  const members = memberRankings as MemberRanking[];
  const groups = groupRankings as GroupRanking[];
  const topMembers = members.slice(0, 5);
  const topGroups = groups.slice(0, 4);
  const focusMember = topMembers[0];
  const focusGroup = topGroups[0];

  const socialCoverage = insights.data_coverage.social_post_dates;
  const eventCount = eventDiscovery.coverage.events;
  const missingSocialExamples = dataQuality.member_coverage.missing_core_examples.slice(0, 8);

  return (
    <main className="min-h-screen bg-[#10131a] text-white">
      <header className="border-b border-white/10 bg-[radial-gradient(circle_at_18%_10%,rgba(34,211,238,0.20),transparent_30%),linear-gradient(135deg,#0b1020_0%,#151923_62%,#211627_100%)]">
        <div className="mx-auto max-w-7xl px-5 py-10">
          <div className="text-xs font-black uppercase tracking-[0.34em] text-cyan-200">Idol Intelligence Feed</div>
          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div>
              <h1 className="max-w-4xl text-4xl font-black leading-tight md:text-6xl">
                快速讀懂今天的偶像市場訊號
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
                這裡把成員排行、團體排行、資料可信度、SEO 可搜尋性與活動 discovery 放在同一個工作台。先看誰正在升溫，再檢查分數是否由真實社群更新、資料完整度與可索引來源支撐。
              </p>
            </div>
            <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-5">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-cyan-100">目前成熟度</div>
              <div className="mt-2 text-4xl font-black text-white">{dataQuality.summary.current_maturity}</div>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                目前最大缺口是「真實社群活動時間」與「多來源活動 discovery」。下一階段要讓 crawler 持續回填社群最後發文、活動場地與來源可信度。
              </p>
            </div>
          </div>
          <nav className="mt-8 flex flex-wrap gap-2 text-sm font-bold">
            <Link href="/" className="rounded-md border border-white/15 px-4 py-2 text-slate-200 hover:bg-white/10">返回排行榜</Link>
            <Link href="/events" className="rounded-md border border-white/15 px-4 py-2 text-slate-200 hover:bg-white/10">近期活動</Link>
            <Link href="/validation" className="rounded-md border border-white/15 px-4 py-2 text-slate-200 hover:bg-white/10">資料驗證</Link>
            <Link href="/agent" className="rounded-md bg-cyan-300 px-4 py-2 text-slate-950 hover:bg-cyan-200">詢問 Agent</Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-5 py-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="space-y-5">
          <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.2em] text-pink-200">Market Focus</div>
                <h2 className="mt-2 text-2xl font-black">本週焦點</h2>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  市場溫度 {score(insights.market_temperature_v2)}，目前社群焦點為 {insights.weekly_highlights.social_focus}，團體焦點為 {insights.weekly_highlights.top_group}。
                </p>
              </div>
              <div className="rounded-2xl bg-slate-950 px-5 py-4 text-right">
                <div className="text-sm text-slate-400">V2 市場溫度</div>
                <div className="text-4xl font-black text-pink-200">{score(insights.market_temperature_v2)}</div>
              </div>
            </div>
          </article>

          <section className="grid gap-5 xl:grid-cols-2">
            <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">Member Signal</div>
                  <h2 className="mt-2 text-2xl font-black">成員熱度 Top 5</h2>
                </div>
                <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-black text-cyan-100">
                  V2 溫度
                </span>
              </div>
              <div className="mt-5 space-y-3">
                {topMembers.map((member) => (
                  <div key={member.name} className="rounded-2xl border border-white/10 bg-slate-950 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-sm font-black">
                        #{member.rank}
                      </div>
                      {member.photo_url ? (
                        <img src={member.photo_url} alt={member.name} className="h-11 w-11 rounded-2xl object-cover" />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-300/10 font-black text-cyan-100">
                          {[...member.name][0]}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <Link href={`/members/${encodeURIComponent(member.name)}`} className="font-black text-white hover:text-cyan-200">
                          {member.name}
                        </Link>
                <div className="truncate text-sm text-slate-400">{member.group || "獨立活動"} / SEO {score(member.seo_discoverability_score)} / {daysLabel(member.days_since_social_signal)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-black text-cyan-200">{score(member.temperature_index_v2)}</div>
                        <div className="text-xs text-slate-500">可信度 {pct(member.data_confidence)}</div>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
                      {member.instagram && <a href={member.instagram} target="_blank" rel="noreferrer" className="text-pink-300 hover:text-pink-200">IG</a>}
                      {member.twitter && <a href={member.twitter} target="_blank" rel="noreferrer" className="text-sky-300 hover:text-sky-200">X</a>}
                      {member.facebook && <a href={member.facebook} target="_blank" rel="noreferrer" className="text-blue-300 hover:text-blue-200">FB</a>}
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.2em] text-pink-200">Group Signal</div>
                  <h2 className="mt-2 text-2xl font-black">團體動態 Top 4</h2>
                </div>
                <span className="rounded-full border border-pink-300/20 bg-pink-300/10 px-3 py-1 text-xs font-black text-pink-100">
                  Groups
                </span>
              </div>
              <div className="mt-5 space-y-3">
                {topGroups.map((group) => (
                  <div key={group.group} className="rounded-2xl border border-white/10 bg-slate-950 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-sm font-black">
                        #{group.rank}
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link href={`/groups/${encodeURIComponent(group.display_name || group.group)}`} className="font-black text-white hover:text-pink-200">
                          {group.display_name || group.group}
                        </Link>
                        <div className="truncate text-sm text-slate-400">
                          {group.member_count ?? 0} 人 / {firstMembers(group.member_names)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-black text-pink-200">{score(group.group_temperature_index_v2)}</div>
                        <div className="text-xs text-slate-500">SEO {score(group.group_seo_discoverability_score)}</div>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
                      {group.instagram && <a href={group.instagram} target="_blank" rel="noreferrer" className="text-pink-300 hover:text-pink-200">IG</a>}
                      {group.twitter && <a href={group.twitter} target="_blank" rel="noreferrer" className="text-sky-300 hover:text-sky-200">X</a>}
                      {group.facebook && <a href={group.facebook} target="_blank" rel="noreferrer" className="text-blue-300 hover:text-blue-200">FB</a>}
                      {group.youtube && <a href={group.youtube} target="_blank" rel="noreferrer" className="text-red-300 hover:text-red-200">YT</a>}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-amber-200">Data Gap Queue</div>
            <h2 className="mt-2 text-2xl font-black">優先補資料名單</h2>
            <p className="mt-2 text-sm leading-7 text-slate-300">
              這些成員目前缺少核心社群或真實更新訊號，會影響溫度模型貼近真實市場狀態。Crawler 下一步應優先重抓這批帳號並保留上次成功結果。
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {missingSocialExamples.map((name) => (
                <Link key={name} href={`/members/${encodeURIComponent(name)}`} className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-sm font-bold text-amber-100 hover:bg-amber-300/20">
                  {name}
                </Link>
              ))}
            </div>
          </article>
        </section>

        <aside className="space-y-5">
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">Today Status</div>
            <h2 className="mt-2 text-2xl font-black">今日資料狀態</h2>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between border-b border-white/10 pb-3"><span className="text-slate-400">成員資料</span><strong>{dataQuality.summary.member_total}</strong></div>
              <div className="flex justify-between border-b border-white/10 pb-3"><span className="text-slate-400">團體資料</span><strong>{dataQuality.summary.group_total}</strong></div>
              <div className="flex justify-between border-b border-white/10 pb-3"><span className="text-slate-400">社群發文訊號</span><strong>{pct(socialCoverage)}</strong></div>
              <div className="flex justify-between border-b border-white/10 pb-3"><span className="text-slate-400">活動 discovery</span><strong>{eventCount}</strong></div>
              <div className="flex justify-between"><span className="text-slate-400">公式版本</span><strong>{insights.formula_version}</strong></div>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-pink-200">Quick Actions</div>
            <div className="mt-4 grid gap-2 text-sm font-bold">
              <Link href="/events" className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 hover:bg-white/10">查看近期活動與場地訊號</Link>
              <Link href="/validation" className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 hover:bg-white/10">檢查資料完整度與 L0-L10</Link>
              <Link href="/agent" className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 hover:bg-white/10">詢問為何上榜或分數異常</Link>
              <Link href="/creative-studio" className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 hover:bg-white/10">用成員資料生成宣傳素材</Link>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-amber-200">Crawler Next</div>
            <h2 className="mt-2 text-xl font-black">下一輪資料工程</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              依研究報告建議，後端應改成 source registry、extractor plugin、normalized entity 與 crawl job/run 記錄。前端已先預留資料缺口與驗證入口，方便之後逐步接入。
            </p>
          </section>
        </aside>
      </div>
    </main>
  );
}

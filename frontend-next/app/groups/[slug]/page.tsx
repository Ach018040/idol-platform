"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

const SB_URL = "https://ziiagdrrytyrmzoeegjk.supabase.co";
const SB_KEY = "sb_publishable_PtKb4LIJeJN3cECUJllW7w_UFRVTbTv";
const SB_H = { apikey: SB_KEY, Accept: "application/json", "Accept-Profile": "public" };

type Member = { id: string; name: string; photo_url?: string; instagram?: string; facebook?: string; x?: string; maid_url?: string; birthdate?: string; };
type Group  = { id: string; name: string; color?: string; instagram?: string; facebook?: string; x?: string; youtube?: string; };

function fmt(v: number, d=1){ return Number.isFinite(v)?v.toFixed(d):"—"; }
function clamp(v:number){return Math.max(0,Math.min(100,v));}

export default function GroupPage({ params }: { params: { slug: string } }) {
  const groupName = decodeURIComponent(params.slug);
  const [group, setGroup] = useState<Group|null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    (async()=>{
      try {
        // 找 group
        const gr = await fetch(
          `${SB_URL}/rest/v1/groups?name=eq.${encodeURIComponent(groupName)}&select=*&limit=1`,
          {headers:SB_H}
        ).then(r=>r.json());
        if(!gr?.length){setLoading(false);return;}
        setGroup(gr[0]);

        // 找成員（透過 history）
        const hist = await fetch(
          `${SB_URL}/rest/v1/history?group_id=eq.${gr[0].id}&select=member_id&order=joined_at.desc`,
          {headers:SB_H}
        ).then(r=>r.json());

        if(hist?.length){
          const ids=hist.map((h:any)=>h.member_id);
          const mems=await fetch(
            `${SB_URL}/rest/v1/members?id=in.(${ids.join(',')})&select=id,name,photo_url,instagram,facebook,x,maid_url,birthdate&limit=50`,
            {headers:SB_H}
          ).then(r=>r.json());
          setMembers(Array.isArray(mems)?mems:[]);
        }
      } catch {}
      setLoading(false);
    })();
  },[groupName]);

  if(loading) return (
    <main className="min-h-screen bg-[#070b14] text-white flex items-center justify-center">
      <div className="text-4xl animate-spin">⚙️</div>
    </main>
  );

  if(!group) return notFound();

  const dotColor = group.color && group.color !== "#ffffff" && group.color !== "#888888" ? group.color : "#6366f1";
  const hasSocial = group.instagram||group.facebook||group.x||group.youtube;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_transparent_30%),linear-gradient(180deg,_#070b14_0%,_#111827_100%)] text-white px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/" className="hover:text-zinc-300 transition-colors">排行榜</Link>
          <span>›</span>
          <span className="text-zinc-300">{group.name}</span>
        </div>

        {/* Group Header */}
        <header className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl border border-white/20 flex-shrink-0" style={{backgroundColor:dotColor+'33',borderColor:dotColor+'66'}}>
              <div className="w-full h-full rounded-2xl flex items-center justify-center text-2xl font-black" style={{color:dotColor}}>
                {[...group.name][0]}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-black text-white">{group.name}</h1>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-xs text-zinc-400 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                  {members.length} 名成員
                </span>
                {hasSocial && (
                  <div className="flex items-center gap-2">
                    {group.instagram && <a href={group.instagram} target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:text-pink-300 text-xs font-bold border border-pink-400/20 bg-pink-400/10 rounded-full px-3 py-1 transition-colors">IG</a>}
                    {group.x && <a href={group.x} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:text-sky-300 text-xs font-bold border border-sky-400/20 bg-sky-400/10 rounded-full px-3 py-1 transition-colors">𝕏</a>}
                    {group.facebook && <a href={group.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-xs font-bold border border-blue-400/20 bg-blue-400/10 rounded-full px-3 py-1 transition-colors">FB</a>}
                    {group.youtube && <a href={group.youtube} target="_blank" rel="noopener noreferrer" className="text-red-400 hover:text-red-300 text-xs font-bold border border-red-400/20 bg-red-400/10 rounded-full px-3 py-1 transition-colors">YT</a>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Members Grid */}
        <section>
          <h2 className="text-xl font-bold text-white mb-4">團體成員 ({members.length})</h2>
          {members.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-zinc-400 text-sm">
              尚無成員資料
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {members.map(m => (
                <Link key={m.id} href={`/members/${encodeURIComponent(m.name)}`}>
                  <div className="group rounded-2xl border border-white/10 bg-black/20 p-4 hover:border-fuchsia-400/30 hover:bg-white/5 transition-all cursor-pointer text-center">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-2xl overflow-hidden">
                      {m.photo_url ? (
                        <Image src={m.photo_url} alt={m.name} width={64} height={64} className="w-full h-full object-cover" unoptimized />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-fuchsia-500/30 to-violet-500/30 flex items-center justify-center text-xl font-black text-white">
                          {[...m.name][0]}
                        </div>
                      )}
                    </div>
                    <div className="text-sm font-semibold text-white group-hover:text-fuchsia-200 transition-colors line-clamp-1">{m.name}</div>
                    <div className="flex items-center justify-center gap-1.5 mt-2">
                      {m.instagram && <span className="text-[10px] text-pink-400">IG</span>}
                      {m.x && <span className="text-[10px] text-sky-400">𝕏</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Back */}
        <div className="flex gap-3 flex-wrap">
          <Link href="/" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/10 transition-colors">← 返回排行榜</Link>
          {(group.instagram||group.x) && (
            <a href={`https://idolinfohub.com/performers/${(group.instagram||group.x||'').replace(/.*\/([^/]+)\/?$/, '$1').replace('@','')}`}
              target="_blank" rel="noopener noreferrer"
              className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-2.5 text-sm text-amber-200 hover:bg-amber-400/20 transition-colors">
              活動紀錄 idolinfohub ↗
            </a>
          )}
          <Link href="/forum/groups" className="rounded-xl border border-fuchsia-400/20 bg-fuchsia-400/10 px-4 py-2.5 text-sm text-fuchsia-200 hover:bg-fuchsia-400/20 transition-colors">💬 討論區</Link>
        </div>
      </div>
    </main>
  );
}

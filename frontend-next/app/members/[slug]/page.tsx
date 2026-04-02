"use client";
import ForecastChart from "../../../components/ForecastChart";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

const SB_URL = "https://ziiagdrrytyrmzoeegjk.supabase.co";
const SB_KEY = "sb_publishable_PtKb4LIJeJN3cECUJllW7w_UFRVTbTv";
const SB_H = { apikey: SB_KEY, Accept: "application/json", "Accept-Profile": "public" };

type Member = { id:string; name:string; name_roman?:string; nickname?:string; color?:string; birthdate?:string; instagram?:string; facebook?:string; x?:string; photo_url?:string; maid_url?:string; updated_at?:string; };
type Group  = { id:string; name:string; color?:string; };

function calcAge(birthdate?:string):string {
  if(!birthdate) return "—";
  const parts=birthdate.split("-");
  const month=parseInt(parts[0]||parts[1]||"0");
  const day=parseInt(parts[1]||parts[2]||"0");
  if(!month||!day) return "—";
  const now=new Date();
  const thisYear=new Date(now.getFullYear(),month-1,day);
  const age=now.getFullYear()-(now>=thisYear?0:1);
  return `${month} 月 ${day} 日`;
}

export default function MemberPage({ params }:{params:{slug:string}}) {
  const memberName = decodeURIComponent(params.slug);
  const [member,setMember]=useState<Member|null>(null);
  const [group,setGroup]=useState<Group|null>(null);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    (async()=>{
      try {
        const mems=await fetch(
          `${SB_URL}/rest/v1/members?name=eq.${encodeURIComponent(memberName)}&select=*&limit=1`,
          {headers:SB_H}
        ).then(r=>r.json());
        if(!mems?.length){setLoading(false);return;}
        setMember(mems[0]);

        // 找所屬團體
        const hist=await fetch(
          `${SB_URL}/rest/v1/history?member_id=eq.${mems[0].id}&select=group_id&order=joined_at.desc&limit=1`,
          {headers:SB_H}
        ).then(r=>r.json());
        if(hist?.[0]?.group_id){
          const grp=await fetch(
            `${SB_URL}/rest/v1/groups?id=eq.${hist[0].group_id}&select=id,name,color&limit=1`,
            {headers:SB_H}
          ).then(r=>r.json());
          if(grp?.[0]) setGroup(grp[0]);
        }
      } catch {}
      setLoading(false);
    })();
  },[memberName]);

  if(loading) return (
    <main className="min-h-screen bg-[#070b14] text-white flex items-center justify-center">
      <div className="text-4xl animate-spin">⚙️</div>
    </main>
  );

  if(!member) return notFound();

  const daysSince = member.updated_at
    ? Math.floor((Date.now()-new Date(member.updated_at).getTime())/86400000)
    : 999;
  const activeLabel = daysSince<=10 ? {text:"● 活躍",cls:"text-emerald-400"} : daysSince<=30 ? {text:"● 近期",cls:"text-yellow-400"} : {text:"● 久未更新",cls:"text-zinc-500"};

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_transparent_30%),linear-gradient(180deg,_#070b14_0%,_#111827_100%)] text-white px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/" className="hover:text-zinc-300 transition-colors">排行榜</Link>
          <span>›</span>
          {group && <><Link href={`/groups/${encodeURIComponent(group.name)}`} className="hover:text-zinc-300 transition-colors">{group.name}</Link><span>›</span></>}
          <span className="text-zinc-300">{member.name}</span>
        </div>

        {/* Profile Card */}
        <header className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              {member.photo_url ? (
                <Image src={member.photo_url} alt={member.name} width={96} height={96}
                  className="w-24 h-24 rounded-2xl object-cover ring-2 ring-white/10" unoptimized />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-fuchsia-500/30 to-violet-500/30 flex items-center justify-center text-3xl font-black text-white">
                  {[...member.name][0]}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <h1 className="text-3xl font-black text-white">{member.name}</h1>
                {member.name_roman && <p className="text-sm text-zinc-400 mt-0.5">{member.name_roman}</p>}
                {member.nickname && <p className="text-xs text-zinc-500">暱稱：{member.nickname}</p>}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-xs font-semibold ${activeLabel.cls}`}>{activeLabel.text}</span>
                {group && (
                  <Link href={`/groups/${encodeURIComponent(group.name)}`}
                    className="text-xs text-fuchsia-300 bg-fuchsia-400/10 border border-fuchsia-400/20 rounded-full px-3 py-1 hover:bg-fuchsia-400/20 transition-colors">
                    {group.name}
                  </Link>
                )}
              </div>
              {/* Social */}
              <div className="flex items-center gap-2 flex-wrap">
                {member.instagram && <a href={member.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-pink-400 hover:text-pink-300 border border-pink-400/20 bg-pink-400/10 rounded-full px-3 py-1.5 transition-colors font-bold">IG</a>}
                {member.x && <a href={member.x} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 border border-sky-400/20 bg-sky-400/10 rounded-full px-3 py-1.5 transition-colors font-bold">𝕏</a>}
                {member.facebook && <a href={member.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 border border-blue-400/20 bg-blue-400/10 rounded-full px-3 py-1.5 transition-colors font-bold">FB</a>}
                {!member.instagram && !member.x && !member.facebook && <span className="text-xs text-zinc-600">無社群帳號</span>}
              </div>
            </div>
          </div>
        </header>

        {/* Info */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {member.birthdate && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">生日</div>
              <div className="text-base font-semibold text-white">{calcAge(member.birthdate)}</div>
            </div>
          )}
          {member.updated_at && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">資料最後更新</div>
              <div className="text-base font-semibold text-white">
                {new Date(member.updated_at).toLocaleDateString("zh-TW")}
              </div>
              <div className="text-xs text-zinc-500 mt-1">{daysSince} 天前</div>
            </div>
          )}
          {member.color && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs text-zinc-500 uppercase tracking-widest mb-2">代表色</div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full border border-white/20" style={{backgroundColor:member.color}}/>
                <span className="text-sm font-mono text-zinc-300">{member.color}</span>
              </div>
            </div>
          )}
          {group && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">所屬團體</div>
              <Link href={`/groups/${encodeURIComponent(group.name)}`} className="text-base font-semibold text-fuchsia-300 hover:text-fuchsia-200 transition-colors">
                {group.name} →
              </Link>
            </div>
          )}
        </section>

        {/* TimesFM Forecast */}
        {member && (
          <ForecastChart entityName={member.name} entityType="member" color="cyan" />
        )}

        {/* Back */}
        <div className="flex gap-3 flex-wrap">
          <Link href="/" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/10 transition-colors">← 返回排行榜</Link>
          {group && <Link href={`/groups/${encodeURIComponent(group.name)}`} className="rounded-xl border border-fuchsia-400/20 bg-fuchsia-400/10 px-4 py-2.5 text-sm text-fuchsia-200 hover:bg-fuchsia-400/20 transition-colors">查看 {group.name}</Link>}
          {(member.instagram || member.x) && (
            <a href={`https://idolinfohub.com/performers/${(member.instagram||member.x||'').replace(/.*\/([^/]+)\/?$/, '$1').replace('@','')}`}
              target="_blank" rel="noopener noreferrer"
              className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-2.5 text-sm text-amber-200 hover:bg-amber-400/20 transition-colors">
              活動紀錄 ↗
            </a>
          )}
          <Link href="/forum/members" className="rounded-xl border border-violet-400/20 bg-violet-400/10 px-4 py-2.5 text-sm text-violet-200 hover:bg-violet-400/20 transition-colors">💬 討論</Link>
        </div>
      </div>
    </main>
  );
}

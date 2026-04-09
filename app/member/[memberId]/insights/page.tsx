"use client";

import useSWR from "swr";
import { useParams } from "next/navigation";
import { ScoreChart } from "@/app/components/ScoreChart";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function MemberInsights() {
  const params = useParams();
  const memberId = params?.memberId as string;

  const { data } = useSWR(`/api/scores/history/${memberId}`, fetcher);

  if (!data) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">📈 Trend Insights</h1>

      <ScoreChart data={data.data.map((d:any)=>({date:d.date, temperature:d.temperature}))} />

      <div className="grid grid-cols-2 gap-4">
        {data.data.slice(-1).map((d:any)=> (
          <>
            <div className="p-4 border rounded-xl">SA: {d.social_activity}</div>
            <div className="p-4 border rounded-xl">Momentum: {d.momentum}</div>
          </>
        ))}
      </div>
    </div>
  );
}

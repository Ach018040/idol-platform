"use client";
import useSWR from "swr";
import { useParams } from "next/navigation";

const fetcher=(u:string)=>fetch(u).then(r=>r.json());

export default function InsightPage(){
  const {memberId} = useParams() as any;
  const {data} = useSWR(`/api/ai-insight/${memberId}`,fetcher);

  if(!data) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">🧠 AI Insight</h1>
      <div className="p-4 border rounded">
        <div>{data.data.summary}</div>
        <div className="text-sm text-gray-400">{data.data.recommendation}</div>
      </div>
    </div>
  );
}

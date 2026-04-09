"use client";

import useSWR from "swr";
import { useParams } from "next/navigation";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function OshiPage() {
  const params = useParams();
  const memberId = params?.memberId as string;

  const { data } = useSWR(`/api/oshi/${memberId}`, fetcher);

  if (!data) return <div className="p-6">Loading...</div>;

  const { score, analysis } = data.data;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">推し分析</h1>

      <div className="p-4 border rounded-xl">
        <div>分類: {analysis.summary}</div>
        <div>動能: {analysis.momentum_state}</div>
        <div>風險: {analysis.risk}</div>
        <div>互動: {analysis.engagement_type}</div>
      </div>

      <div className="p-4 border rounded-xl">
        <div>Temperature: {score.temperature_index}</div>
        <div>SA: {score.social_activity_score}</div>
      </div>
    </div>
  );
}

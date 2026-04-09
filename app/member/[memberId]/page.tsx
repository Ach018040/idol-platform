"use client";

import useSWR from "swr";
import { useParams } from "next/navigation";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function MemberPage() {
  const params = useParams();
  const memberId = params?.memberId as string;

  const { data, error } = useSWR(
    memberId ? `/api/scores/member/${memberId}` : null,
    fetcher
  );

  if (error) return <div className="p-6">Error loading member</div>;
  if (!data) return <div className="p-6">Loading...</div>;

  const m = data.data;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">{m.display_name}</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          ["Presence", m.presence_score],
          ["Activity", m.activity_score],
          ["Engagement", m.engagement_score],
          ["Content", m.content_power_score],
          ["Momentum", m.momentum_score],
          ["Reliability", m.reliability_score]
        ].map(([label, value]: any) => (
          <div key={label} className="p-4 rounded-xl border">
            <div className="text-sm text-gray-400">{label}</div>
            <div className="text-xl font-bold">{value}</div>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-xl border">
        <h2 className="font-semibold mb-2">Overall</h2>
        <div className="flex gap-6">
          <div>SA: {m.social_activity_score}</div>
          <div>Temp: {m.temperature_index}</div>
          <div>Health: {m.platform_health_score}</div>
        </div>
      </div>
    </div>
  );
}

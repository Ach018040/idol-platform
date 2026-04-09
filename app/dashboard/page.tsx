"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function DashboardPage() {
  const { data, error } = useSWR("/api/scores/leaderboard?sort=temperature&limit=20", fetcher);

  if (error) return <div className="p-6">Error loading data</div>;
  if (!data) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">🔥 Idol Heat Ranking</h1>

      <div className="grid gap-4">
        {data.data.map((item: any, idx: number) => (
          <div key={item.member_id} className="p-4 rounded-xl border flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-lg font-bold">#{idx + 1}</div>
              <img src={item.avatar_url || "/placeholder.png"} className="w-10 h-10 rounded-full" />
              <div>
                <div className="font-semibold">{item.display_name}</div>
                <div className="text-sm text-gray-500">{item.group_name}</div>
              </div>
            </div>

            <div className="flex gap-6 text-sm">
              <div>
                <div className="text-gray-400">Temp</div>
                <div className="font-bold">{item.temperature_index}</div>
              </div>
              <div>
                <div className="text-gray-400">SA</div>
                <div className="font-bold">{item.social_activity_score}</div>
              </div>
              <div>
                <div className="text-gray-400">Momentum</div>
                <div className="font-bold">{item.momentum_score}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

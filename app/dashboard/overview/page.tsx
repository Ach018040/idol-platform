"use client";

import useSWR from "swr";
import { HeatBadge } from "@/app/components/HeatBadge";
import { RankChange } from "@/app/components/RankChange";
import { useRouter } from "next/navigation";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function OverviewPage() {
  const router = useRouter();
  const { data } = useSWR("/api/scores/leaderboard?limit=20", fetcher);
  const { data: changes } = useSWR("/api/scores/rank-changes", fetcher);

  if (!data) return <div className="p-6">Loading...</div>;

  const changeMap = new Map((changes?.data || []).map((c: any) => [c.member_id, c.change]));

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">📊 Dashboard Overview</h1>

      <div className="grid gap-4">
        {data.data.map((item: any, idx: number) => (
          <div
            key={item.member_id}
            onClick={() => router.push(`/member/${item.member_id}`)}
            className="p-4 rounded-2xl border shadow hover:shadow-lg cursor-pointer flex justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="font-bold">#{idx + 1}</div>
              <img src={item.avatar_url || "/placeholder.png"} className="w-12 h-12 rounded-full" />
              <div>
                <div className="font-semibold">{item.display_name}</div>
                <div className="text-sm text-gray-400">{item.group_name}</div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <HeatBadge value={item.temperature_index} />
              <RankChange change={changeMap.get(item.member_id) || 0} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

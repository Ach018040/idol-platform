"use client";

import useSWR from "swr";

const fetcher = (url:string)=>fetch(url).then(r=>r.json());

export default function RecommendPage(){
  const {data} = useSWR('/api/recommendations', fetcher);

  if(!data) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">✨ 推薦推し</h1>
      {data.data.map((m:any)=> (
        <div key={m.member_id} className="p-4 border rounded-xl">
          <div>{m.display_name}</div>
          <div className="text-sm text-gray-400">Temp: {m.temperature_index}</div>
        </div>
      ))}
    </div>
  );
}

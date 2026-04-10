"use client";

import useSWR from "swr";

const fetcher = (url:string)=>fetch(url).then(r=>r.json());

export default function WatchlistPage(){
  const {data} = useSWR("/api/watchlist", fetcher);

  if(!data) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">⭐ Watchlist</h1>
      <ul>
        {data.data.map((w:any)=> (
          <li key={w.id}>{w.member_id}</li>
        ))}
      </ul>
    </div>
  );
}

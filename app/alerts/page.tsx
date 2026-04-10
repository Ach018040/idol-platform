"use client";

import useSWR from "swr";

const fetcher = (url:string)=>fetch(url).then(r=>r.json());

export default function AlertsPage(){
  const {data} = useSWR("/api/alerts", fetcher);

  if(!data) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">🔔 Alerts</h1>
      <ul>
        {data.data.map((a:any)=> (
          <li key={a.id}>{a.rule_type} - {a.threshold}</li>
        ))}
      </ul>
    </div>
  );
}

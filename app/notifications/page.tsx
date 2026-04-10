"use client";
import useSWR from "swr";

const fetcher=(u:string)=>fetch(u).then(r=>r.json());

export default function Notifications(){
  const {data}=useSWR('/api/notifications',fetcher);

  if(!data) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">🔔 通知中心</h1>
      {data.data.map((n:any)=> (
        <div key={n.id} className="p-4 border rounded">
          {n.rule_type} triggered ({n.member_id})
        </div>
      ))}
    </div>
  );
}

import { getMembers } from '@/lib/data'

export default function MembersPage() {
  const members = getMembers()

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 text-white">
      <h1 className="text-3xl font-bold mb-6">Members</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {members.map((m) => (
          <div key={m.rank + m.name} className="p-4 border border-white/10 rounded-xl bg-white/5">
            <div className="font-semibold">{m.name}</div>
            <div className="text-sm text-white/60">{m.group}</div>
            <div className="text-sm text-cyan-300">{m.temperature_index ?? 0}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

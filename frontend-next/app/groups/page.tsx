import { getGroups } from '@/lib/data'

export default function GroupsPage() {
  const groups = getGroups()

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 text-white">
      <h1 className="text-3xl font-bold mb-6">Groups</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {groups.map((g) => (
          <div key={g.rank + g.group} className="p-4 border border-white/10 rounded-xl bg-white/5">
            <div className="font-semibold">{g.display_name || g.group}</div>
            <div className="text-sm text-white/60">成員數：{g.member_count ?? 0}</div>
            <div className="text-sm text-pink-300">{g.temperature_index ?? g.v7_index ?? 0}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

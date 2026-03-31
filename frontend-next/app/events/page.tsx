import { getEvents } from '@/lib/data'

export default function EventsPage() {
  const events = getEvents()

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 text-white">
      <h1 className="text-3xl font-bold mb-6">Events</h1>
      {events.length === 0 ? (
        <div className="text-white/60">目前尚無活動資料</div>
      ) : (
        <div className="space-y-4">
          {events.map((e, i) => (
            <div key={i} className="p-4 border border-white/10 rounded-xl bg-white/5">
              <div className="font-semibold">{e.title}</div>
              <div className="text-sm text-white/60">{e.event_date}</div>
              <div className="text-sm text-white/50">{e.venue} / {e.city}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

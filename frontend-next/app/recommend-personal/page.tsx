'use client'

import { useEffect, useState } from 'react'
import { STORAGE_KEYS, readJson, FavoriteItem } from '@/lib/client-storage'

export default function Page() {
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/analytics')
      .then(res => res.json())
      .then(res => {
        const favs = readJson<FavoriteItem[]>(STORAGE_KEYS.favorites, [])

        if (favs.length === 0) {
          setData(res.data.topGroups)
          return
        }

        const favNames = favs.map(f => f.name)

        const filtered = [
          ...res.data.topGroups,
          ...res.data.topMembers
        ].filter(item => favNames.some(name => item.name.includes(name)))

        setData(filtered.length ? filtered : res.data.topGroups)
      })
  }, [])

  return (
    <div className="p-10 text-white">
      <h1 className="text-3xl mb-6">個人化推薦</h1>

      {data.map((item, i) => (
        <div key={i} className="mb-4 p-4 bg-white/5 rounded-xl">
          <div className="font-bold">{item.name}</div>
          <div className="text-sm text-white/60">活動數 {item.events90d}</div>
        </div>
      ))}
    </div>
  )
}

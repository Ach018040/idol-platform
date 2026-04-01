'use client'

import { useState, useEffect } from 'react'
import { STORAGE_KEYS, readJson, writeJson, FavoriteItem } from '@/lib/client-storage'

export default function FavoritesPage() {
  const [list, setList] = useState<FavoriteItem[]>([])

  useEffect(() => {
    setList(readJson(STORAGE_KEYS.favorites, []))
  }, [])

  function remove(index: number) {
    const newList = [...list]
    newList.splice(index, 1)
    setList(newList)
    writeJson(STORAGE_KEYS.favorites, newList)
  }

  return (
    <div className="p-10 text-white">
      <h1 className="text-3xl mb-6">收藏推し</h1>

      {list.length === 0 ? (
        <div className="text-white/60">尚未收藏</div>
      ) : (
        list.map((item, i) => (
          <div key={i} className="mb-4 p-4 bg-white/5 rounded-xl flex justify-between">
            <div>
              <div>{item.name}</div>
              <div className="text-sm text-white/60">{item.type}</div>
            </div>
            <button onClick={() => remove(i)} className="text-red-400">刪除</button>
          </div>
        ))
      )}
    </div>
  )
}

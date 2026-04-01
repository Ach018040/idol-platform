'use client'

import { useState, useEffect } from 'react'
import { STORAGE_KEYS, readJson, writeJson, UserProfile } from '@/lib/client-storage'

export default function AccountPage() {
  const [profile, setProfile] = useState<UserProfile>({ nickname: '', favoriteStyle: '' })

  useEffect(() => {
    const saved = readJson<UserProfile>(STORAGE_KEYS.profile, { nickname: '', favoriteStyle: '' })
    setProfile(saved)
  }, [])

  function save() {
    writeJson(STORAGE_KEYS.profile, profile)
    alert('已儲存')
  }

  return (
    <div className="p-10 text-white">
      <h1 className="text-3xl mb-6">帳號 / 偏好設定</h1>

      <div className="space-y-4 max-w-md">
        <input
          className="w-full p-2 bg-black/30 border border-white/20"
          placeholder="你的暱稱"
          value={profile.nickname}
          onChange={(e) => setProfile({ ...profile, nickname: e.target.value })}
        />

        <input
          className="w-full p-2 bg-black/30 border border-white/20"
          placeholder="喜歡的風格（例：王道 / 地下 / 可愛系）"
          value={profile.favoriteStyle}
          onChange={(e) => setProfile({ ...profile, favoriteStyle: e.target.value })}
        />

        <button onClick={save} className="px-4 py-2 bg-pink-500 rounded">儲存</button>
      </div>
    </div>
  )
}

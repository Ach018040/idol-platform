export const STORAGE_KEYS = {
  profile: 'idol-platform-profile',
  favorites: 'idol-platform-favorites',
} as const

export type FavoriteItem = {
  name: string
  type: 'group' | 'member'
  relatedGroup?: string
}

export type UserProfile = {
  nickname: string
  favoriteStyle: string
}

export function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function writeJson<T>(key: string, value: T) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
}

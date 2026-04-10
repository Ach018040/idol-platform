"use client";
import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "forum_user_v2";

export interface ForumUser {
  id: string;
  token: string;
  display_name: string;
  is_anonymous: boolean;
  email: string;
  role?: "user" | "moderator" | "admin";
}

interface ForumAuthCtx {
  user: ForumUser | null;
  loading: boolean;
  joinAsGuest: (displayName: string) => Promise<ForumUser>;
  signOut: () => void;
  refreshProfile: () => Promise<void>;
}

const Ctx = createContext<ForumAuthCtx>({
  user: null, loading: true,
  joinAsGuest: async () => { throw new Error("not ready"); },
  signOut: () => {},
  refreshProfile: async () => {},
});

export function ForumAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ForumUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const u = JSON.parse(stored) as ForumUser;
        setUser(u);
        // 刷新 role（從 Supabase 取最新）
        fetch(`/api/user?token=${u.token}`)
          .then(r => r.json())
          .then(d => { if (d.profile) setUser(prev => prev ? { ...prev, role: d.profile.role } : prev); })
          .catch(() => {});
      }
    } catch {}
    setLoading(false);
  }, []);

  const joinAsGuest = async (displayName: string): Promise<ForumUser> => {
    const token = "anon_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    const isAdmin = typeof window !== "undefined" && localStorage.getItem("forum_admin_token") === (process.env.NEXT_PUBLIC_ADMIN_TOKEN || "idol-admin-2026");
    const user: ForumUser = { id: token, token, display_name: displayName.trim(), is_anonymous: true, email: "", role: isAdmin ? "admin" : "user" };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    setUser(user);
    // 同步到 Supabase user_profiles
    try {
      const res = await fetch("/api/user", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, display_name: displayName.trim() }) });
      const d = await res.json();
      if (d.profile?.role) setUser(prev => prev ? { ...prev, role: d.profile.role } : prev);
    } catch {}
    return user;
  };

  const signOut = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  const refreshProfile = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/user?token=${user.token}`);
      const d = await res.json();
      if (d.profile) {
        const updated = { ...user, display_name: d.profile.display_name, role: d.profile.role };
        setUser(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
    } catch {}
  };

  return <Ctx.Provider value={{ user, loading, joinAsGuest, signOut, refreshProfile }}>{children}</Ctx.Provider>;
}

export function useForumAuth() { return useContext(Ctx); }

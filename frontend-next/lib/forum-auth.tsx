"use client";
/**
 * Forum Auth Context
 * 提供全域的登入狀態與論壇用戶資訊
 * 使用 Supabase Auth（email/OAuth）
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const SB_URL = process.env.NEXT_PUBLIC_FORUM_SB_URL || "https://vxmebuygrnynxkepyunh.supabase.co";
// NEXT_PUBLIC_FORUM_SB_ANON 需要在 Vercel env vars 設定 idolmetrics anon key
const SB_KEY = process.env.NEXT_PUBLIC_FORUM_SB_ANON || "";

export type ForumUser = {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  token: string;
};

type AuthCtx = {
  user: ForumUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx>({
  user: null, loading: true,
  signIn: async () => ({}),
  signUp: async () => ({}),
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export function ForumAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ForumUser | null>(null);
  const [loading, setLoading] = useState(true);

  // 從 localStorage 恢復 session
  useEffect(() => {
    try {
      const saved = localStorage.getItem("forum_session");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.token && parsed?.id) setUser(parsed);
      }
    } catch {}
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      if (!SB_KEY) {
        return { error: "論壇服務設定中，請稍後再試（管理員需設定 FORUM_SB_ANON）" };
      }
      const res = await fetch(`${SB_URL}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: { apikey: SB_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error_description || data.msg || "登入失敗" };
      const u: ForumUser = {
        id: data.user.id,
        email: data.user.email,
        display_name: data.user.user_metadata?.display_name || email.split("@")[0],
        avatar_url: data.user.user_metadata?.avatar_url,
        token: data.access_token,
      };
      setUser(u);
      localStorage.setItem("forum_session", JSON.stringify(u));
      return {};
    } catch (e) {
      return { error: String(e) };
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      const res = await fetch(`${SB_URL}/auth/v1/signup`, {
        method: "POST",
        headers: { apikey: SB_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, data: { display_name: displayName } }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error_description || data.msg || "註冊失敗" };
      return {};
    } catch (e) {
      return { error: String(e) };
    }
  };

  const signInWithGoogle = async () => {
    if (!SB_KEY) { alert("論壇服務設定中，管理員需設定 Supabase anon key"); return; }
    window.location.href = `${SB_URL}/auth/v1/authorize?provider=google&redirect_to=${window.location.origin}/forum`;
  };

  const signOut = async () => {
    try {
      if (user?.token) {
        await fetch(`${SB_URL}/auth/v1/logout`, {
          method: "POST",
          headers: { apikey: SB_KEY, Authorization: `Bearer ${user.token}` },
        });
      }
    } finally {
      setUser(null);
      localStorage.removeItem("forum_session");
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useForumAuth = () => useContext(AuthContext);

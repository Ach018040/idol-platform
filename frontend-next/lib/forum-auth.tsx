"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const SB_URL = "https://ziiagdrrytyrmzoeegjk.supabase.co";
const SB_KEY = "sb_publishable_PtKb4LIJeJN3cECUJllW7w_UFRVTbTv";

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
  signInWithMagicLink: (email: string) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx>({
  user: null, loading: true,
  signIn: async () => ({}),
  signUp: async () => ({}),
  signInWithMagicLink: async () => ({}),
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export function ForumAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ForumUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 恢復 session
    try {
      const saved = localStorage.getItem("forum_session");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.token && parsed?.id) setUser(parsed);
      }
    } catch {}
    // 處理 magic link callback（URL hash 含 access_token）
    const hash = window.location.hash;
    if (hash.includes("access_token=")) {
      const params = new URLSearchParams(hash.substring(1));
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");
      if (access_token) {
        fetch(`${SB_URL}/auth/v1/user`, {
          headers: { apikey: SB_KEY, Authorization: `Bearer ${access_token}` }
        }).then(r => r.json()).then(userData => {
          const u: ForumUser = {
            id: userData.id,
            email: userData.email,
            display_name: userData.user_metadata?.display_name || userData.email?.split("@")[0] || "用戶",
            avatar_url: userData.user_metadata?.avatar_url,
            token: access_token,
          };
          setUser(u);
          localStorage.setItem("forum_session", JSON.stringify(u));
          // 清除 URL hash
          window.history.replaceState(null, "", window.location.pathname);
        }).catch(() => {});
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const res = await fetch(`${SB_URL}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: { apikey: SB_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        const errMsg = data.error_description || data.message || data.msg || data.error || "";
        if (errMsg.includes("Email not confirmed") || errMsg.includes("not confirmed")) {
          return { error: "請先確認電子郵件 — 或使用「Magic Link」免密碼登入" };
        }
        return { error: errMsg || "登入失敗，請確認帳號密碼" };
      }
      const u: ForumUser = {
        id: data.user.id,
        email: data.user.email,
        display_name: data.user.user_metadata?.display_name || data.user.email.split("@")[0],
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
      if (!res.ok) return { error: data.error_description || data.message || "註冊失敗" };
      // 如果 autoconfirm 開啟，直接登入
      if (data.access_token) {
        const u: ForumUser = {
          id: data.user.id, email: data.user.email,
          display_name: displayName || data.user.email.split("@")[0],
          token: data.access_token,
        };
        setUser(u);
        localStorage.setItem("forum_session", JSON.stringify(u));
        return {};
      }
      return { error: "註冊成功！請檢查信箱點擊確認連結後再登入，或改用 Magic Link 登入" };
    } catch (e) {
      return { error: String(e) };
    }
  };

  const signInWithMagicLink = async (email: string) => {
    try {
      const res = await fetch(`${SB_URL}/auth/v1/magiclink`, {
        method: "POST",
        headers: { apikey: SB_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          options: { emailRedirectTo: `${typeof window !== "undefined" ? window.location.origin : "https://idol-platform.vercel.app"}/forum` }
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        return { error: data.error_description || data.message || "Magic Link 發送失敗" };
      }
      return {};
    } catch (e) {
      return { error: String(e) };
    }
  };

  const signInWithGoogle = async () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://idol-platform.vercel.app";
    window.location.href = `${SB_URL}/auth/v1/authorize?provider=google&redirect_to=${origin}/forum`;
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
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signInWithMagicLink, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useForumAuth = () => useContext(AuthContext);

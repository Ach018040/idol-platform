"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ForumUser = {
  id: string;
  email: string;
  display_name: string;
  token: string;
  is_anonymous: boolean;
};

type AuthCtx = {
  user: ForumUser | null;
  loading: boolean;
  joinAsGuest: (displayName: string) => { error?: string };
  changeDisplayName: (newName: string) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthCtx>({
  user: null, loading: false,
  joinAsGuest: () => ({}),
  changeDisplayName: () => {},
  signOut: () => {},
});

function genId() {
  return "user_" + Math.random().toString(36).substring(2, 10) + "_" + Date.now().toString(36);
}

export function ForumAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ForumUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("forum_user_v2");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.id && parsed?.display_name) setUser(parsed);
      }
    } catch {}
    setLoading(false);
  }, []);

  const joinAsGuest = (displayName: string) => {
    const name = displayName.trim();
    if (!name) return { error: "請輸入暱稱" };
    if (name.length < 2) return { error: "暱稱至少需要 2 個字元" };
    if (name.length > 20) return { error: "暱稱不能超過 20 個字元" };
    const banned = ["admin","管理員","administrator","mod","moderator","官方"];
    if (banned.some(b => name.toLowerCase().includes(b))) return { error: "此暱稱已保留，請換一個" };

    const newUser: ForumUser = {
      id: genId(),
      email: "",
      display_name: name,
      token: genId(),
      is_anonymous: true,
    };
    setUser(newUser);
    try { localStorage.setItem("forum_user_v2", JSON.stringify(newUser)); } catch {}
    return {};
  };

  const changeDisplayName = (newName: string) => {
    if (!user || !newName.trim()) return;
    const updated = { ...user, display_name: newName.trim() };
    setUser(updated);
    try { localStorage.setItem("forum_user_v2", JSON.stringify(updated)); } catch {}
  };

  const signOut = () => {
    setUser(null);
    try { localStorage.removeItem("forum_user_v2"); } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, loading, joinAsGuest, changeDisplayName, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useForumAuth = () => useContext(AuthContext);

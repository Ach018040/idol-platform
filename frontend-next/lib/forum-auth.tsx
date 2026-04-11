"use client";

import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "forum_user_v2";
const ADMIN_SECRET_KEY = "forum_admin_secret";

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
  user: null,
  loading: true,
  joinAsGuest: async () => {
    throw new Error("not ready");
  },
  signOut: () => {},
  refreshProfile: async () => {},
});

function persistUser(user: ForumUser | null) {
  if (typeof window === "undefined") return;
  if (!user) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function ForumAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ForumUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    const current = typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") as ForumUser | null
      : user;
    if (!current?.token) return;

    try {
      const res = await fetch(`/api/user?token=${current.token}`);
      const data = await res.json();
      if (data.profile) {
        const updated: ForumUser = {
          ...current,
          display_name: data.profile.display_name || current.display_name,
          role: data.profile.role || current.role || "user",
        };
        setUser(updated);
        persistUser(updated);
      }
    } catch {}
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ForumUser;
        setUser(parsed);
        fetch(`/api/user?token=${parsed.token}`)
          .then((res) => res.json())
          .then((data) => {
            if (!data.profile) return;
            const updated: ForumUser = {
              ...parsed,
              display_name: data.profile.display_name || parsed.display_name,
              role: data.profile.role || parsed.role || "user",
            };
            setUser(updated);
            persistUser(updated);
          })
          .catch(() => {});
      }
    } catch {}
    setLoading(false);
  }, []);

  const joinAsGuest = async (displayName: string): Promise<ForumUser> => {
    const token = `anon_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    const draftUser: ForumUser = {
      id: token,
      token,
      display_name: displayName.trim(),
      is_anonymous: true,
      email: "",
      role: "user",
    };

    persistUser(draftUser);
    setUser(draftUser);

    try {
      const res = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, display_name: displayName.trim() }),
      });
      const data = await res.json();
      const created: ForumUser = {
        ...draftUser,
        display_name: data.profile?.display_name || draftUser.display_name,
        role: data.profile?.role || draftUser.role,
      };
      persistUser(created);
      setUser(created);

      const adminSecret = localStorage.getItem(ADMIN_SECRET_KEY);
      if (adminSecret) {
        const upgrade = await fetch("/api/forum/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, adminSecret }),
        });
        const upgradeData = await upgrade.json().catch(() => ({}));
        if (upgrade.ok && upgradeData.profile?.role) {
          const promoted: ForumUser = { ...created, role: upgradeData.profile.role };
          persistUser(promoted);
          setUser(promoted);
          return promoted;
        }
      }

      return created;
    } catch {
      return draftUser;
    }
  };

  const signOut = () => {
    persistUser(null);
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, loading, joinAsGuest, signOut, refreshProfile }}>
      {children}
    </Ctx.Provider>
  );
}

export function useForumAuth() {
  return useContext(Ctx);
}

"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { AuthService } from "@/services/auth.service";
import { AUTH_SESSION_EXPIRED_EVENT } from "@/lib/auth";

interface User {
  id: number;
  username: string;
  name?: string;
  email: string;
  jwt: string;
  refreshToken?: string;
  documentId: string;
  credits?: number;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const parseCredits = useCallback((value: unknown): number | undefined => {
    if (typeof value === "number" && Number.isFinite(value)) {
      return Math.trunc(value);
    }
    if (typeof value === "string") {
      const parsed = Number.parseInt(value, 10);
      if (Number.isFinite(parsed)) return parsed;
    }
    return undefined;
  }, []);

  const normalizeUser = useCallback((raw: Record<string, unknown>): User => {
    const normalized: User = {
      id: Number(raw.id),
      username: String(raw.username || ""),
      ...(raw.name ? { name: String(raw.name) } : {}),
      email: String(raw.email || ""),
      jwt: String(raw.jwt || ""),
      ...(raw.refreshToken ? { refreshToken: String(raw.refreshToken) } : {}),
      documentId: String(raw.documentId || ""),
    };

    const credits = parseCredits(raw.credits);
    if (typeof credits === "number") {
      normalized.credits = credits;
    }

    return normalized;
  }, [parseCredits]);

  const refreshUser = useCallback(async () => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return;

    try {
      const parsed = JSON.parse(storedUser) as User;
      if (!parsed?.jwt) return;

      const me = await AuthService.me(parsed.jwt);
      const merged = normalizeUser({
        ...parsed,
        id: me.id ?? parsed.id,
        username: me.username ?? parsed.username,
        name: me.name ?? parsed.name,
        email: me.email ?? parsed.email,
        documentId: me.documentId ?? parsed.documentId,
        credits: me.credits,
      });

      setUser(merged);
      localStorage.setItem("user", JSON.stringify(merged));
    } catch (error) {
      console.error("Error refreshing user profile:", error);
    }
  }, [normalizeUser]);

  useEffect(() => {
    // Check if user is logged in on mount
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = normalizeUser(JSON.parse(storedUser) as Record<string, unknown>);
        setUser(parsedUser);
        // Set cookie if it doesn't exist
        if (!Cookies.get("user")) {
          Cookies.set("user", "true", { expires: 7 }); // Cookie expires in 7 days
        }
        void refreshUser();
      } catch (error) {
        console.error("Error parsing stored user:", error);
        localStorage.removeItem("user");
        Cookies.remove("user");
      }
    }
    setIsLoading(false);
  }, [normalizeUser, refreshUser]);

  const login = async (email: string, password: string) => {
    try {
      const data = await AuthService.login(email, password);
      const me = await AuthService.me(data.jwt).catch(() => null);

      const userData = normalizeUser({
        id: me?.id ?? data.user.id,
        username: me?.username ?? data.user.username,
        name: me?.name ?? data.user.name,
        email: me?.email ?? data.user.email,
        jwt: data.jwt,
        refreshToken: data.refreshToken,
        documentId: me?.documentId ?? data.user.documentId,
        credits: me?.credits ?? data.user.credits,
      });

      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      // Set authentication cookie
      Cookies.set("user", "true", { expires: 365 }); // Cookie expires in 7 days
      router.push("/home");
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    Cookies.remove("user");
    router.push("/login");
  };

  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null);
      localStorage.removeItem("user");
      Cookies.remove("user");
      router.push("/login");
    };

    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => {
      window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);
    };
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

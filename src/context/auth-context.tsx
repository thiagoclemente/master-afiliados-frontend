"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { AuthService } from "@/services/auth.service";

interface User {
  id: number;
  username: string;
  email: string;
  jwt: string;
  documentId: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in on mount
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        // Set cookie if it doesn't exist
        if (!Cookies.get("user")) {
          Cookies.set("user", "true", { expires: 7 }); // Cookie expires in 7 days
        }
      } catch (error) {
        console.error("Error parsing stored user:", error);
        localStorage.removeItem("user");
        Cookies.remove("user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const data = await AuthService.login(email, password);

      const userData = {
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
        jwt: data.jwt,
        documentId: data.user.documentId,
      };

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

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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

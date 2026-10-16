"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { adminApi } from "@/lib/api";

interface AdminUser {
  id: string;
  username: string;
  email: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: AdminUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const logout = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
    }
    setToken(null);
    setUser(null);
    router.push("/login");
  }, [router]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedToken = localStorage.getItem("adminToken");
    const savedUser = localStorage.getItem("adminUser");

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        const parsed = JSON.parse(savedUser);
        setUser(parsed);

        adminApi
          .getMe()
          .then((res) => {
            if (res?.user) {
              setUser(res.user);
              localStorage.setItem("adminUser", JSON.stringify(res.user));
            }
          })
          .catch(() => {
            logout();
          })
          .finally(() => {
            setIsLoading(false);
          });
      } catch {
        logout();
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
      if (pathname !== "/login") {
        router.push("/login");
      }
    }
  }, [logout, pathname, router]);

  const login = async (email: string, pass: string) => {
    const data = await adminApi.login(email, pass);
    const adminUserData: AdminUser = {
      id: data.user.id || data.user._id,
      username: data.user.username,
      email: data.user.email,
      isAdmin: data.user.isAdmin,
    };
    if (typeof window !== "undefined") {
      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("adminUser", JSON.stringify(adminUserData));
    }
    setToken(data.token);
    setUser(adminUserData);
    router.push("/");
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

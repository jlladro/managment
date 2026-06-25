"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (secret: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_KEY = "baustellen_admin_auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_KEY);
      if (stored === "true") {
        setIsAuthenticated(true);
      }
    } catch (e) {
      console.error("Auth storage read failed");
    } finally {
      setLoaded(true);
    }
  }, []);

  const login = (secret: string): boolean => {
    const adminSecret = process.env.NEXT_PUBLIC_ADMIN_SECRET || "chef2024";
    if (secret === adminSecret) {
      try {
        localStorage.setItem(AUTH_KEY, "true");
        setIsAuthenticated(true);
        return true;
      } catch (e) {
        console.error("Auth storage write failed");
      }
    }
    return false;
  };

  const logout = () => {
    try {
      localStorage.removeItem(AUTH_KEY);
      setIsAuthenticated(false);
    } catch (e) {
      console.error("Auth storage clear failed");
    }
  };

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0E14]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

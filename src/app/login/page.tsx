"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HardHat } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const [secret, setSecret] = useState("");
  const [error, setError] = useState("");
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  if (isAuthenticated) {
    router.replace("/dashboard");
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(secret);
    if (success) {
      router.push("/dashboard");
    } else {
      setError("Falscher Zugangscode");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-orange-500/20">
            <HardHat className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Chef Dashboard</h1>
          <p className="text-slate-400 mt-2">Willkommen zurück! Bitte melden Sie sich an.</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-slate-900/50 backdrop-blur-xl rounded-3xl p-10 border border-slate-800 shadow-2xl"
        >
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                Zugangscode
              </label>
              <input
                type="password"
                value={secret}
                onChange={(e) => {
                  setSecret(e.target.value);
                  setError("");
                }}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-5 py-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                placeholder="Passwort (Standard: chef2024)"
                autoFocus
              />
            </div>
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm animate-shake">
                {error}
              </div>
            )}

            <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-orange-500/10 active:scale-[0.98]">
              Anmelden
            </button>

            <div className="pt-6 border-t border-slate-800 text-center">
              <Link
                href="/mitarbeiter"
                className="text-sm font-medium text-slate-500 hover:text-orange-400 transition-colors"
              >
                Mitarbeiter-Ansicht öffnen →
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

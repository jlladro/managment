"use client";

import { ReactNode, useEffect } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { DemoDbProvider } from "@/context/DemoDbContext";

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    const key = (window as any).supabaseDebugKey || "unbekannt";
    console.log("DEBUG: App startet mit Key-Typ:", key);
  }, []);

  return (
    <AuthProvider>
      <DemoDbProvider>{children}</DemoDbProvider>
    </AuthProvider>
  );
}

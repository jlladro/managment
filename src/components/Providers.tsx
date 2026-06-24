"use client";

import { ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { DemoDbProvider } from "@/context/DemoDbContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <DemoDbProvider>{children}</DemoDbProvider>
    </AuthProvider>
  );
}

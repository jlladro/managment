"use client";

import { ReactNode } from "react";
import { EmployeeProvider } from "@/context/EmployeeContext";

export default function MitarbeiterLayout({ children }: { children: ReactNode }) {
  return (
    <EmployeeProvider>
      <div className="min-h-screen bg-[#1A1A2E] flex flex-col items-center">
        {/* Auf einem echten Handy nehmen wir die volle Breite ohne Rahmen */}
        <div className="w-full max-w-[420px] flex-1 flex flex-col relative">
          <div className="flex-1 overflow-hidden flex flex-col">
            {children}
          </div>
        </div>
      </div>
    </EmployeeProvider>
  );
}

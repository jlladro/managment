"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import { Menu, HardHat } from "lucide-react";
import PushManager from "@/components/PushManager";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      try {
        const isEmployee = localStorage.getItem("baustellen_employee_name");
        if (isEmployee) {
          router.replace("/mitarbeiter/home");
          return;
        }
      } catch (e) {}
      
      router.replace("/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header with Safe Area support */}
        <header className="lg:hidden bg-slate-900/80 backdrop-blur-xl border-b border-white/5 flex items-end justify-between px-6 pb-4 pt-[env(safe-area-inset-top)] h-[calc(80px+env(safe-area-inset-top))] sticky top-0 z-30 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
              <HardHat className="w-6 h-6 text-white" />
            </div>
            <span className="font-black text-white text-xs uppercase tracking-[0.2em]">Management</span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-400 active:bg-orange-500 active:text-white transition-all shadow-inner"
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-8 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
      <PushManager />
    </div>
  );
}

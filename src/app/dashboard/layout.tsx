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
        {/* Mobile Header */}
        <header className="lg:hidden h-16 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-4 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <HardHat className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white text-sm uppercase tracking-wider">Management</span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-slate-400 hover:text-white transition-colors"
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

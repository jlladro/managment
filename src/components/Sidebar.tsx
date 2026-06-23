"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Package,
  Clock,
  MessageSquare,
  Users,
  LogOut,
  HardHat,
  X,
  FileText,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useDemoDb } from "@/context/DemoDbContext";
import { DEMO_MODE } from "@/lib/demo-data";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/projects", label: "Baustellen", icon: Building2 },
  { href: "/dashboard/materials", label: "Materialien", icon: Package },
  { href: "/dashboard/work-hours", label: "Arbeitszeiten", icon: Clock },
  { href: "/dashboard/reports", label: "Berichte", icon: FileText },
  { href: "/dashboard/messages", label: "Nachrichten", icon: MessageSquare },
  { href: "/dashboard/employees", label: "Mitarbeiter", icon: Users },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const demoDb = useDemoDb();

  const sidebarClasses = `
    fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
    ${isOpen ? "translate-x-0" : "-translate-x-full"}
  `;

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={sidebarClasses}>
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
              <HardHat className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white text-lg tracking-tight">Baustellen</h1>
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Management</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white lg:hidden">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-orange-500/10 text-orange-500 shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? "text-orange-500" : ""}`} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2">
          {DEMO_MODE && (
            <button
              onClick={() => {
                if (confirm("Alle Demo-Daten zurücksetzen?")) {
                  demoDb.reset();
                  onClose?.();
                }
              }}
              className="flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-semibold text-orange-500/80 hover:bg-orange-500/10 w-full transition-colors"
            >
              Demo-Daten zurücksetzen
            </button>
          )}
          <button
            onClick={() => {
              logout();
              onClose?.();
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-400/10 w-full transition-colors group"
          >
            <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            Abmelden
          </button>
        </div>
      </aside>
    </>
  );
}

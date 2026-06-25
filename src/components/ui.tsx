"use client";

import { ReactNode } from "react";
import Link from "next/link";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 border border-slate-700">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color?: string;
  subtitle?: string;
  href?: string;
}

export function StatCard({ title, value, icon, color = "orange", subtitle, href }: StatCardProps) {
  const colorClasses: Record<string, string> = {
    orange: "bg-orange-500/15 text-orange-400 border-orange-500/20",
    green: "bg-green-500/15 text-green-400 border-green-500/20",
    red: "bg-red-500/15 text-red-400 border-red-500/20",
    blue: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    yellow: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  };

  const content = (
    <div className={`bg-slate-800 rounded-2xl p-6 border border-slate-700 transition-all ${href ? 'hover:border-slate-500 hover:shadow-lg active:scale-95 cursor-pointer' : ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className="block">{content}</Link>;
  }

  return content;
}

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
    </div>
  );
}

export function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
      {message}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12 text-slate-400">{message}</div>
  );
}

"use client";

import React from "react";
import { Activity } from "lucide-react";

interface HeaderProps {
  title: string;
  description?: string;
}

export function Header({ title, description }: HeaderProps) {
  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center min-w-0">
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate">
            {title}
          </h1>
          {description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block truncate">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
          <Activity className="w-3.5 h-3.5 animate-pulse text-emerald-500" />
          <span className="hidden sm:inline">API Connected</span>
          <span className="sm:hidden">Online</span>
        </div>
      </div>
    </header>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ShieldAlert,
  BadgeCheck,
  CreditCard,
  Radio,
  History,
  Cpu,
  Activity,
  LogOut,
  X,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Crown,
  TicketCheck,
  UserX,
  BarChart3,
  Bot,
  Megaphone,
  Mail,
  Camera,
  FileWarning,
  UserCheck,
  Sliders,
  Tag,
  Settings,
  Layers,
  Smartphone,
  Mic,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/analytics", label: "Analytics & BI", icon: BarChart3 },
  { href: "/users", label: "Users & Profiles", icon: Users },
  { href: "/devices", label: "Hardware & Devices", icon: Smartphone },
  { href: "/deletion-requests", label: "Deletion Queue", icon: UserX },
  { href: "/verifications", label: "Photo Verification", icon: BadgeCheck },
  { href: "/moderation", label: "NSFW & Photo Queue", icon: Camera },
  { href: "/prompts-moderation", label: "Voice & Prompts Queue", icon: Mic },
  { href: "/blocklist", label: "Keyword Blocklist", icon: FileWarning },
  { href: "/bots", label: "Bot Hunter", icon: Bot },
  { href: "/reports", label: "Reports & Safety", icon: ShieldAlert },
  { href: "/chat", label: "Chat Moderation", icon: MessageSquare },
  { href: "/subscriptions", label: "Subscriptions", icon: Crown },
  { href: "/plans", label: "Pricing & Plans", icon: Layers },
  { href: "/coupons", label: "Coupons & Promos", icon: Tag },
  { href: "/tickets", label: "Support Tickets", icon: TicketCheck },
  { href: "/transactions", label: "Finances & Plans", icon: CreditCard },
  { href: "/broadcasts", label: "Push Broadcasts", icon: Radio },
  { href: "/announcements", label: "In-App Announcements", icon: Megaphone },
  { href: "/campaigns", label: "Email Campaigns", icon: Mail },
  { href: "/roles", label: "Admin Roles & RBAC", icon: UserCheck },
  { href: "/flags", label: "Feature Flags", icon: Sliders },
  { href: "/config", label: "App Config & Limits", icon: Settings },
  { href: "/algorithm", label: "Algorithm & Weights", icon: Cpu },
  { href: "/health", label: "System Health", icon: Activity },
  { href: "/audit-logs", label: "Audit Logs", icon: History },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const {
    isCollapsed,
    isMobileOpen,
    toggleCollapse,
    closeMobileSidebar,
  } = useSidebar();

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Close navigation sidebar"
          onClick={closeMobileSidebar}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
              closeMobileSidebar();
            }
          }}
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm md:hidden transition-opacity duration-300"
        />
      )}

      {/* Main Sidebar Component */}
      <aside
        className={`bg-slate-900 border-r border-slate-800 flex flex-col h-screen fixed md:sticky top-0 z-50 text-slate-200 transition-all duration-300 ease-in-out relative ${
          isCollapsed ? "md:w-20 w-64" : "w-64"
        } ${
          isMobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Floating Border Toggle Button */}
        <button
          type="button"
          onClick={toggleCollapse}
          className="flex absolute -right-3 top-5 w-6 h-6 rounded-full bg-slate-800 hover:bg-rose-500 border border-slate-700 hover:border-rose-400 text-slate-400 hover:text-white shadow-xl items-center justify-center transition-all z-50 focus:outline-none cursor-pointer"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Brand Header */}
        {isCollapsed ? (
          <div className="h-16 flex items-center justify-center border-b border-slate-800 w-full px-2">
            <Link
              href="/"
              onClick={closeMobileSidebar}
              className="h-9 w-9 rounded-xl overflow-hidden shadow-lg shadow-rose-500/20 bg-rose-500/10 border border-rose-500/30 flex items-center justify-center p-1 shrink-0 hover:scale-105 transition-transform"
              title="Soulmate Admin Console"
            >
              <img src="/logo.png" alt="Soulmate Logo" className="w-full h-full object-contain" />
            </Link>
          </div>
        ) : (
          <div className="h-16 flex items-center justify-between border-b border-slate-800 px-5 w-full">
            <div className="flex items-center gap-3 min-w-0">
              <Link
                href="/"
                onClick={closeMobileSidebar}
                className="h-9 w-9 rounded-xl overflow-hidden shadow-lg shadow-rose-500/20 bg-rose-500/10 border border-rose-500/30 flex items-center justify-center p-1 shrink-0 hover:scale-105 transition-transform"
                title="Soulmate Admin Console"
              >
                <img src="/logo.png" alt="Soulmate Logo" className="w-full h-full object-contain" />
              </Link>

              <div className="min-w-0">
                <span className="font-bold text-base text-white tracking-tight block truncate">
                  Soulmate
                </span>
                <span className="block text-[10px] text-slate-400 font-medium tracking-wider uppercase">
                  Admin Console
                </span>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={closeMobileSidebar}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close menu"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto overflow-x-hidden scrollbar-thin">
          {/* Section Label: hidden when collapsed */}
          <div
            className={`px-3 mb-2 text-[10px] font-semibold tracking-wider text-slate-500 uppercase transition-opacity duration-200 ${
              isCollapsed ? "md:hidden" : "block"
            }`}
          >
            Management
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobileSidebar}
                title={item.label}
                className={`relative group flex items-center rounded-xl transition-all ${
                  isCollapsed
                    ? "md:justify-center md:px-0 md:py-3 px-3.5 py-2.5 gap-3"
                    : "gap-3 px-3.5 py-2.5"
                } ${
                  isActive
                    ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20 font-semibold"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/70"
                }`}
              >
                <Icon
                  className={`shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                    isCollapsed ? "md:w-5 md:h-5 w-4 h-4" : "w-4 h-4"
                  } ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"}`}
                />

                {/* Nav label: shown when expanded OR on mobile */}
                <span
                  className={`text-xs font-medium truncate ${
                    isCollapsed ? "md:hidden block" : "block"
                  }`}
                >
                  {item.label}
                </span>

                {/* Floating tooltip on hover when in desktop collapsed mode */}
                {isCollapsed && (
                  <div className="hidden md:group-hover:flex absolute left-full ml-3 px-2.5 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-lg shadow-xl border border-slate-700 whitespace-nowrap z-50 pointer-events-none items-center">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Session Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <div
            className={`flex items-center transition-all ${
              isCollapsed
                ? "md:flex-col md:gap-2 md:justify-center justify-between"
                : "justify-between"
            }`}
          >
            {/* User Avatar + info */}
            <div
              className={`flex items-center gap-2.5 min-w-0 ${
                isCollapsed ? "md:justify-center" : ""
              }`}
            >
              <div
                className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-rose-400 shrink-0"
                title={`${user?.username || "Admin"} (${user?.email || ""})`}
              >
                {user?.username?.charAt(0).toUpperCase() || "A"}
              </div>

              {/* Text hidden when collapsed */}
              <div
                className={`min-w-0 flex-1 ${
                  isCollapsed ? "md:hidden block" : "block"
                }`}
              >
                <p className="text-xs font-semibold text-slate-200 truncate">
                  {user?.username || "Admin"}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {user?.email || "admin@soulmate.local"}
                </p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              title="Log out"
              aria-label="Log out"
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

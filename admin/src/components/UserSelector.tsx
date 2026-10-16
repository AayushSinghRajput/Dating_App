"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  X,
  ChevronDown,
  Check,
} from "lucide-react";
import { adminApi } from "@/lib/api";

export interface SelectedUser {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar?: string;
}

interface UserSelectorProps {
  label: string;
  selectedUserId: string;
  selectedUser?: SelectedUser | null;
  onSelectUser: (user: SelectedUser | null) => void;
  placeholder?: string;
  badgeColor?: "rose" | "sky" | "indigo";
  dropdownPlacement?: "up" | "down" | "auto";
}

export function UserSelector({
  label,
  selectedUserId,
  selectedUser,
  onSelectUser,
  placeholder = "Search person by name or username...",
  badgeColor = "rose",
  dropdownPlacement = "auto",
}: UserSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [placement, setPlacement] = useState<"up" | "down">(
    dropdownPlacement === "up" ? "up" : "down"
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Determine up/down placement based on viewport space
  useEffect(() => {
    if (!isOpen || !dropdownRef.current) return;

    if (dropdownPlacement === "up") {
      setPlacement("up");
      return;
    }
    if (dropdownPlacement === "down") {
      setPlacement("down");
      return;
    }

    const rect = dropdownRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    if (spaceBelow < 280 && spaceAbove > 180) {
      setPlacement("up");
    } else {
      setPlacement("down");
    }
  }, [isOpen, dropdownPlacement]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch users with debounce
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await adminApi.getUsers(query.trim(), 1, "all");
        setUsers(res.users || []);
      } catch (err) {
        console.error("Failed to fetch user list for selector:", err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  const handleSelect = (u: any) => {
    const displayName = u.profile?.name || u.username || "Unnamed User";
    const avatar = u.profile?.profileImage || u.profile?.photos?.[0] || "";

    onSelectUser({
      id: u._id,
      name: displayName,
      username: u.username,
      email: u.email,
      avatar,
    });
    setIsOpen(false);
    setQuery("");
  };

  const handleClear = () => {
    onSelectUser(null);
    setQuery("");
    setIsOpen(true);
  };

  const borderClass =
    badgeColor === "rose"
      ? "focus-within:border-rose-500 border-rose-500/30"
      : "focus-within:border-sky-500 border-sky-500/30";

  const badgeTheme =
    badgeColor === "rose"
      ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
      : "bg-sky-500/10 text-sky-400 border-sky-500/30";

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              badgeColor === "rose" ? "bg-rose-500" : "bg-sky-400"
            }`}
          />
          <span>{label}</span>
        </label>
        {selectedUserId && (
          <span className="text-[10px] font-mono text-slate-500 truncate max-w-[160px]">
            ID: {selectedUserId}
          </span>
        )}
      </div>

      {/* Selected State vs Input Search State */}
      {selectedUser ? (
        <div
          className={`flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border ${borderClass} shadow-md transition-all`}
        >
          <div className="flex items-center gap-3 min-w-0">
            {selectedUser.avatar ? (
              <img
                src={selectedUser.avatar}
                alt={selectedUser.name}
                className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0"
              />
            ) : (
              <div
                className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 ${badgeTheme}`}
              >
                {selectedUser.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                <span>{selectedUser.name}</span>
                <span className="text-[10px] font-normal text-slate-400">
                  (@{selectedUser.username})
                </span>
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {selectedUser.email}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              title="Change user"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => setIsOpen(true)}
          className={`flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs transition-all ${
            isOpen ? "border-slate-700 ring-1 ring-slate-700" : "hover:border-slate-700"
          }`}
        >
          <Search className="w-3.5 h-3.5 text-slate-500 mr-2 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className="w-full bg-transparent text-white placeholder-slate-500 focus:outline-none text-xs"
          />
          {query ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setQuery("");
              }}
              className="p-1 text-slate-500 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          ) : (
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-500 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          )}
        </div>
      )}

      {/* Dropdown Results List */}
      {isOpen && (
        <div
          className={`absolute left-0 right-0 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl z-50 overflow-hidden max-h-64 flex flex-col transition-all duration-150 ${
            placement === "up"
              ? "bottom-full mb-2 shadow-black/90 animate-in fade-in slide-in-from-bottom-2"
              : "top-full mt-2 shadow-black/90 animate-in fade-in slide-in-from-top-2"
          }`}
        >
          <div className="px-3 py-2 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between text-[11px] text-slate-400">
            <span>
              {loading
                ? "Searching daters..."
                : query
                ? `Results for "${query}"`
                : "Select a dater or type to filter"}
            </span>
            <span className="text-[10px] text-slate-500">
              {users.length} found
            </span>
          </div>

          <div className="overflow-y-auto flex-1 divide-y divide-slate-800/40">
            {loading ? (
              <div className="p-6 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                <span>Searching user directory...</span>
              </div>
            ) : users.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                No daters found matching &quot;{query}&quot;. Try typing a different name or username.
              </div>
            ) : (
              users.map((u) => {
                const displayName = u.profile?.name || u.username || "Anonymous";
                const avatar = u.profile?.profileImage || u.profile?.photos?.[0] || "";
                const isSelected = u._id === selectedUserId;

                return (
                  <button
                    key={u._id}
                    type="button"
                    onClick={() => handleSelect(u)}
                    className={`w-full p-2.5 flex items-center justify-between text-left transition-colors hover:bg-slate-800/80 ${
                      isSelected ? "bg-slate-800/60" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={displayName}
                          className="w-7 h-7 rounded-full object-cover border border-slate-700 shrink-0"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 font-bold text-[11px] shrink-0">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate flex items-center gap-1.5">
                          <span>{displayName}</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            @{u.username}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 truncate font-mono">
                          {u.email} • ID: {u._id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

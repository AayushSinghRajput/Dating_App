"use client";

import React, { useEffect, useState } from "react";
import {
  Activity,
  Server,
  Database,
  Wifi,
  Cpu,
  Clock,
  Layers,
  RefreshCw,
} from "lucide-react";
import { Header } from "@/components/Header";
import { adminApi } from "@/lib/api";

export default function HealthPage() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchHealth = async () => {
    try {
      const res = await adminApi.getSystemHealth();
      setHealth(res);
    } catch (err) {
      console.error("Failed to fetch system health:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    if (!autoRefresh) return;
    const interval = setInterval(fetchHealth, 8000); // 8s heartbeat
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const memUsed = health?.memory?.heapUsedMb ?? 0;
  const memTotal = health?.memory?.heapTotalMb ?? 1;
  const memPct = Math.round((memUsed / memTotal) * 100);

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-screen">
      <Header
        title="System Infrastructure & Health Telemetry"
        description="Real-time heartbeat monitoring for Node.js runtime, MongoDB cluster, and Socket.IO connections"
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 flex-1 max-w-7xl w-full mx-auto">
        {/* Status Header */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Platform Services Online</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 font-bold text-[10px] uppercase">
                  OPERATIONAL
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Last telemetry probe: {health?.timestamp ? new Date(health.timestamp).toLocaleTimeString() : "—"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                autoRefresh
                  ? "bg-slate-900 border-emerald-500/40 text-emerald-400"
                  : "bg-slate-900 border-slate-800 text-slate-400"
              }`}
            >
              Auto-poll: {autoRefresh ? "8s Active" : "Paused"}
            </button>

            <button
              onClick={fetchHealth}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Vital Gauges */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Uptime */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span className="font-semibold uppercase tracking-wider">Process Uptime</span>
              <Clock className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-black text-white">
              {health?.uptime?.formatted || "—"}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Continuous uptime without crashes</p>
          </div>

          {/* Node Heap Memory */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span className="font-semibold uppercase tracking-wider">V8 Heap Allocation</span>
              <Cpu className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-black text-rose-400">
              {memUsed} MB <span className="text-xs text-slate-500 font-normal">/ {memTotal} MB</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className="bg-rose-500 h-full rounded-full transition-all"
                style={{ width: `${memPct}%` }}
              />
            </div>
          </div>

          {/* MongoDB Cluster */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span className="font-semibold uppercase tracking-wider">Database State</span>
              <Database className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400 capitalize">
              {health?.database?.status || "Connected"}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Host: {health?.database?.host}</p>
          </div>

          {/* WebSockets / Real-Time */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span className="font-semibold uppercase tracking-wider">Online Daters</span>
              <Wifi className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-purple-400">
              {health?.realtime?.activeSockets ?? 0}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Active Socket.IO connections</p>
          </div>
        </div>

        {/* Detailed Infrastructure Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Runtime & Server Specs */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-sky-400" />
              <span>Runtime Specifications</span>
            </h3>

            <div className="divide-y divide-slate-800/60 text-xs">
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Node.js Engine</span>
                <span className="font-mono font-bold text-white">{health?.runtime?.nodeVersion}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Host Platform</span>
                <span className="font-mono text-slate-300 capitalize">{health?.runtime?.platform} ({health?.runtime?.arch})</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Resident Set Size (RSS)</span>
                <span className="font-mono text-slate-300">{health?.memory?.rssMb} MB</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Target Database</span>
                <span className="font-mono text-emerald-400">{health?.database?.name}</span>
              </div>
            </div>
          </div>

          {/* Application Data Scale */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-rose-400" />
              <span>Database Volume & Record Depth</span>
            </h3>

            <div className="divide-y divide-slate-800/60 text-xs">
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-slate-400">Total User Profiles</span>
                <span className="font-bold text-white">{(health?.counts?.totalUsers ?? 0).toLocaleString()}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-slate-400">Direct Chat Channels</span>
                <span className="font-bold text-white">{(health?.counts?.totalChats ?? 0).toLocaleString()}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-slate-400">Exchanged Messages</span>
                <span className="font-bold text-white">{(health?.counts?.totalMessages ?? 0).toLocaleString()}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-slate-400">WebSocket Push Channel</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold text-[10px]">
                  ACTIVE
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

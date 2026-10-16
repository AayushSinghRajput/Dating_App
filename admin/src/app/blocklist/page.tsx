"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Search,
  Plus,
  Trash2,
  RefreshCw,
  Sparkles,
  Play,
} from "lucide-react";
import { Header } from "@/components/Header";
import { adminApi } from "@/lib/api";

export default function BlocklistPage() {
  const [phrases, setPhrases] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Add Phrase state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newPhrase, setNewPhrase] = useState("");
  const [newCategory, setNewCategory] = useState("profanity");
  const [newAction, setNewAction] = useState("replace");
  const [newReplacement, setNewReplacement] = useState("***");
  const [actionLoading, setActionLoading] = useState(false);

  // Live Sandbox Tester
  const [testInput, setTestInput] = useState("");
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  const fetchBlocklist = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getBlocklist(category, search, page);
      setPhrases(res.phrases || []);
      setTotal(res.total || 0);
      setCategoryCounts(res.categoryCounts || {});
    } catch (err) {
      console.error("Failed to load blocklist:", err);
    } finally {
      setLoading(false);
    }
  }, [category, search, page]);

  useEffect(() => {
    fetchBlocklist();
  }, [fetchBlocklist]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhrase.trim()) return;
    setActionLoading(true);
    try {
      await adminApi.addBlocklistPhrase(newPhrase.trim(), newCategory, newAction, newReplacement);
      setAddModalOpen(false);
      setNewPhrase("");
      fetchBlocklist();
    } catch (err: any) {
      alert(err?.message || "Failed to add phrase");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string, phrase: string) => {
    if (!confirm(`Remove "${phrase}" from the prohibited keyword blocklist?`)) return;
    try {
      await adminApi.deleteBlocklistPhrase(id);
      fetchBlocklist();
    } catch (err: any) {
      alert(err?.message || "Failed to delete phrase");
    }
  };

  const handleTestFilter = async () => {
    if (!testInput.trim()) return;
    setTesting(true);
    try {
      const res = await adminApi.testBlocklistFilter(testInput);
      setTestResult(res);
    } catch (err: any) {
      alert(err?.message || "Failed to test filter");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-screen">
      <Header
        title="Keyword & Phrase Blocklist Manager"
        description="Filter offensive language, contact handles, harassment, and spam scams across chat messages and user profiles"
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">
        {/* Live Filter Testing Sandbox Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-bold text-white">Interactive Moderation Sandbox</h3>
            </div>
            <span className="text-[11px] text-slate-400">Test text against real-time rule engine</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder="Type sample bio or message text (e.g. 'Hey message me on telegram t.me/xyz')..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              onKeyDown={(e) => e.key === "Enter" && handleTestFilter()}
            />
            <button
              onClick={handleTestFilter}
              disabled={testing || !testInput.trim()}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              <span>Test Rules</span>
            </button>
          </div>

          {testResult && (
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 space-y-3 text-xs animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Filtered Sanitized Output:</span>
                {testResult.violatesRules ? (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-[10px]">
                    Violates Policy (Strict Block)
                  </span>
                ) : testResult.matches?.length > 0 ? (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold text-[10px]">
                    Sanitized with Masks
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-[10px]">
                    Passed Clean
                  </span>
                )}
              </div>
              <p className="font-mono text-white bg-slate-900 p-3 rounded-lg border border-slate-800">
                {testResult.sanitizedText || "(Empty)"}
              </p>
              {testResult.matches?.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[11px] text-slate-500">Triggered Rules:</span>
                  {testResult.matches.map((m: any, i: number) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-mono"
                    >
                      &ldquo;{m.phrase}&rdquo; ({m.category} → {m.action})
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Controls, Filters & Add Keyword Button */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search phrase..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl w-full sm:w-auto overflow-x-auto text-xs">
              {[
                { id: "all", label: `All (${total})` },
                { id: "profanity", label: `Profanity (${categoryCounts.profanity || 0})` },
                { id: "phone_contact", label: `Contacts (${categoryCounts.phone_contact || 0})` },
                { id: "spam_scam", label: `Spam/Scams (${categoryCounts.spam_scam || 0})` },
                { id: "harassment", label: `Harassment (${categoryCounts.harassment || 0})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setCategory(tab.id);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 font-medium rounded-lg whitespace-nowrap transition-colors ${
                    category === tab.id
                      ? "bg-slate-800 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setAddModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-rose-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add Prohibited Keyword</span>
            </button>
          </div>
        </div>

        {/* Blocklist Table */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Prohibited Phrase / Pattern</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Enforcement Action</th>
                  <th className="py-3.5 px-4">Mask Replacement</th>
                  <th className="py-3.5 px-4">Date Added</th>
                  <th className="py-3.5 px-4 text-right">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      Loading blocklist...
                    </td>
                  </tr>
                ) : phrases.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      No blocklisted phrases found matching this category.
                    </td>
                  </tr>
                ) : (
                  phrases.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-white">
                        &ldquo;{p.phrase}&rdquo;
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-semibold uppercase">
                          {p.category.replace("_", " ")}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {p.action === "replace" && (
                          <span className="text-emerald-400 font-semibold text-[11px]">
                            Auto-Sanitize (Replace)
                          </span>
                        )}
                        {p.action === "block" && (
                          <span className="text-rose-400 font-semibold text-[11px]">
                            Strict Block (Reject send)
                          </span>
                        )}
                        {p.action === "flag" && (
                          <span className="text-amber-400 font-semibold text-[11px]">
                            Flag for Review
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-400">
                        {p.replacement || "***"}
                      </td>

                      <td className="py-3 px-4 text-slate-400">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDelete(p._id, p.phrase)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                          title="Delete phrase"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Add Keyword Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAdd}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base">Add Blocklisted Phrase</h3>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Keyword / Phrase</label>
                <input
                  type="text"
                  required
                  value={newPhrase}
                  onChange={(e) => setNewPhrase(e.target.value)}
                  placeholder="e.g. t.me, scam, vulgar phrase..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                >
                  <option value="profanity">Profanity & Vulgarity</option>
                  <option value="harassment">Harassment & Bullying</option>
                  <option value="phone_contact">Contact / Handle Sharing</option>
                  <option value="spam_scam">Commercial Spam & Scams</option>
                  <option value="hate_speech">Hate Speech</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Enforcement Action</label>
                <select
                  value={newAction}
                  onChange={(e) => setNewAction(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                >
                  <option value="replace">Replace with Mask Characters (***)</option>
                  <option value="block">Strict Block (Prevent sending message)</option>
                  <option value="flag">Silent Flag (Allow send but notify admin)</option>
                </select>
              </div>

              {newAction === "replace" && (
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Mask Replacement</label>
                  <input
                    type="text"
                    value={newReplacement}
                    onChange={(e) => setNewReplacement(e.target.value)}
                    placeholder="***"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/20"
              >
                Add Rule
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

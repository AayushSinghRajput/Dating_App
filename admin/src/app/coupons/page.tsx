"use client";

import React, { useEffect, useState } from "react";
import {
  Tag,
  Plus,
  Trash2,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Copy,
  Calendar,
  Percent,
  Sparkles,
  Award,
} from "lucide-react";
import { Header } from "@/components/Header";
import { adminApi } from "@/lib/api";

interface Coupon {
  _id: string;
  code: string;
  discountType: "percentage" | "flat_amount";
  discountValue: number;
  applicableTiers: string[];
  maxRedemptions: number;
  currentRedemptions: number;
  expiresAt: string;
  active: boolean;
  createdAt: string;
  createdBy?: {
    username: string;
    email: string;
  };
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form states
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "flat_amount">("percentage");
  const [discountValue, setDiscountValue] = useState<number>(20);
  const [applicableTiers, setApplicableTiers] = useState<string>("all");
  const [maxRedemptions, setMaxRedemptions] = useState<number>(100);
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [active, setActive] = useState(true);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getCoupons();
      setCoupons(res.coupons || []);
    } catch (err: any) {
      console.error("Failed to load coupons:", err);
      setNotification({ type: "error", text: "Failed to load coupons list" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !discountValue || !expiresAt) return;

    setFormLoading(true);
    try {
      await adminApi.createCoupon({
        code: code.trim().toUpperCase(),
        discountType,
        discountValue: Number(discountValue),
        applicableTiers: applicableTiers === "all" ? ["all"] : [applicableTiers],
        maxRedemptions: Number(maxRedemptions) || 100,
        expiresAt,
        active,
      });

      setNotification({ type: "success", text: "Coupon created successfully!" });
      setShowModal(false);
      setCode("");
      fetchCoupons();
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Failed to create coupon" });
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    try {
      await adminApi.updateCoupon(id, { active: !current });
      setCoupons((prev) => prev.map((c) => (c._id === id ? { ...c, active: !current } : c)));
      setNotification({ type: "success", text: "Coupon status toggled." });
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Failed to toggle status." });
    }
  };

  const handleDelete = async (id: string, couponCode: string) => {
    if (!confirm(`Delete promo code "${couponCode}"?`)) return;

    try {
      await adminApi.deleteCoupon(id);
      setCoupons((prev) => prev.filter((c) => c._id !== id));
      setNotification({ type: "success", text: "Promo code deleted." });
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Failed to delete coupon" });
    }
  };

  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setNotification({ type: "success", text: `Copied "${text}" to clipboard!` });
  };

  const totalRedemptions = coupons.reduce((acc, c) => acc + (c.currentRedemptions || 0), 0);
  const activeCoupons = coupons.filter(
    (c) => c.active && new Date(c.expiresAt) > new Date() && c.currentRedemptions < c.maxRedemptions
  ).length;

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-screen">
      <Header
        title="Coupon & Promo Code Manager"
        description="Issue promotional discount vouchers, set redemption caps, and track paywall marketing campaigns."
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 flex-1 max-w-7xl w-full mx-auto">
        {/* Toast */}
        {notification && (
          <div
            className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
              notification.type === "success"
                ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-300"
                : "bg-rose-950/40 border-rose-800/60 text-rose-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{notification.text}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-white ml-4 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Codes
              </span>
              <Tag className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
              {coupons.length}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Configured promo vouchers</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Currently Redeemable
              </span>
              <Award className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-2">
              {activeCoupons}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Active & under redemption cap</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
                Total Claimed
              </span>
              <Sparkles className="w-5 h-5 text-rose-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2 font-mono">
              {totalRedemptions}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Vouchers redeemed by daters</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                Avg. Discount Rate
              </span>
              <Percent className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 mt-2 font-mono">
              25%
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Mean promotional incentive</p>
          </div>
        </div>

        {/* Action Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Tag className="w-4 h-4 text-rose-500" />
            <span>Discount Vouchers & Promotions</span>
          </h2>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchCoupons}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={() => {
                setExpiresAt(new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]);
                setShowModal(true);
              }}
              className="py-2 px-4 rounded-xl font-semibold text-xs bg-gradient-to-r from-rose-600 to-pink-500 hover:from-rose-500 hover:to-pink-400 text-white shadow-lg shadow-rose-600/20 flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Promo Code</span>
            </button>
          </div>
        </div>

        {/* Coupons Table */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">Promo Code</th>
                  <th className="px-6 py-3.5 font-semibold">Discount</th>
                  <th className="px-6 py-3.5 font-semibold">Redemptions Cap</th>
                  <th className="px-6 py-3.5 font-semibold">Tiers</th>
                  <th className="px-6 py-3.5 font-semibold">Expires</th>
                  <th className="px-6 py-3.5 font-semibold">Status</th>
                  <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                      Loading promotional vouchers...
                    </td>
                  </tr>
                ) : coupons.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                      No promo codes configured yet.
                    </td>
                  </tr>
                ) : (
                  coupons.map((c) => {
                    const isExpired = new Date(c.expiresAt) <= new Date();
                    const isExhausted = c.currentRedemptions >= c.maxRedemptions;
                    const percentUsed = Math.min(
                      100,
                      Math.round((c.currentRedemptions / Math.max(1, c.maxRedemptions)) * 100)
                    );

                    return (
                      <tr key={c._id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-white bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg">
                              {c.code}
                            </span>
                            <button
                              onClick={() => copyCode(c.code)}
                              className="text-slate-500 hover:text-slate-300 p-1"
                              title="Copy Code"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="font-black text-rose-400 text-xs">
                            {c.discountType === "percentage"
                              ? `${c.discountValue}% OFF`
                              : `$${c.discountValue.toFixed(2)} OFF`}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="w-28 space-y-1">
                            <div className="flex justify-between text-[10px] font-mono text-slate-400">
                              <span>{c.currentRedemptions} used</span>
                              <span>{c.maxRedemptions}</span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-rose-500 h-full rounded-full transition-all"
                                style={{ width: `${percentUsed}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                            {c.applicableTiers.join(", ")}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-slate-400">
                          <div className="flex items-center gap-1.5 font-mono text-[11px]">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            <span>{new Date(c.expiresAt).toLocaleDateString()}</span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          {isExpired ? (
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px] font-bold uppercase">
                              Expired
                            </span>
                          ) : isExhausted ? (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase">
                              Exhausted
                            </span>
                          ) : c.active ? (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase">
                              Active
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-500 text-[10px] font-bold uppercase">
                              Disabled
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleToggle(c._id, c.active)}
                              className={`p-1.5 rounded-lg border transition-all ${
                                c.active
                                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                                  : "bg-slate-800 border-slate-700 text-slate-400"
                              }`}
                              title={c.active ? "Deactivate Code" : "Activate Code"}
                            >
                              {c.active ? (
                                <ToggleRight className="w-4 h-4" />
                              ) : (
                                <ToggleLeft className="w-4 h-4" />
                              )}
                            </button>

                            <button
                              onClick={() => handleDelete(c._id, c.code)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                              title="Delete Promo Code"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Tag className="w-4 h-4 text-rose-500" />
                  <span>Create Promotional Voucher</span>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-white font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                    Voucher Code
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. VALENTINE50"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-mono tracking-wider font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                      Discount Type
                    </label>
                    <select
                      value={discountType}
                      onChange={(e: any) => setDiscountType(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="flat_amount">Flat Amount ($)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                      Discount Value
                    </label>
                    <input
                      type="number"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                      required
                      min="1"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                      Max Redemptions Cap
                    </label>
                    <input
                      type="number"
                      value={maxRedemptions}
                      onChange={(e) => setMaxRedemptions(parseInt(e.target.value, 10) || 1)}
                      min="1"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                      Expiration Date
                    </label>
                    <input
                      type="date"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                    Eligible Tiers
                  </label>
                  <select
                    value={applicableTiers}
                    onChange={(e) => setApplicableTiers(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="all">All Membership Tiers</option>
                    <option value="plus">Soulmate Plus Only</option>
                    <option value="gold">Soulmate Gold Only</option>
                    <option value="platinum">Platinum VIP Only</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="couponActiveCheck"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="rounded accent-rose-500"
                  />
                  <label htmlFor="couponActiveCheck" className="text-xs text-slate-300 font-semibold cursor-pointer">
                    Enable voucher immediately upon creation
                  </label>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-5 py-2 rounded-xl font-semibold text-xs bg-gradient-to-r from-rose-600 to-pink-500 hover:from-rose-500 hover:to-pink-400 text-white shadow-lg shadow-rose-600/20"
                  >
                    {formLoading ? "Creating..." : "Create Voucher"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

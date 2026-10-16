"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  CreditCard,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  Crown,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Star,
  Check,
  X,
  Users,
} from "lucide-react";
import { Header } from "@/components/Header";
import { adminApi } from "@/lib/api";

interface Plan {
  _id: string;
  planId: string;
  name: string;
  tier: "plus" | "gold" | "platinum";
  billingInterval: "monthly" | "quarterly" | "annual";
  price: number;
  currency: string;
  discountPercentage: number;
  perks: {
    likesPerDay: number;
    superLikesPerMonth: number;
    rewindsPerMonth: number;
    seeWhoLikedYou: boolean;
    priorityMatches: boolean;
    passportMode: boolean;
  };
  active: boolean;
  isPopular: boolean;
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form states
  const [planId, setPlanId] = useState("");
  const [name, setName] = useState("");
  const [tier, setTier] = useState<"plus" | "gold" | "platinum">("gold");
  const [billingInterval, setBillingInterval] = useState<"monthly" | "quarterly" | "annual">("monthly");
  const [price, setPrice] = useState<number>(14.99);
  const [currency, setCurrency] = useState("USD");
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);
  const [isPopular, setIsPopular] = useState(false);
  const [active, setActive] = useState(true);

  // Perks
  const [likesPerDay, setLikesPerDay] = useState(9999);
  const [superLikesPerMonth, setSuperLikesPerMonth] = useState(10);
  const [rewindsPerMonth, setRewindsPerMonth] = useState(9999);
  const [seeWhoLikedYou, setSeeWhoLikedYou] = useState(true);
  const [priorityMatches, setPriorityMatches] = useState(false);
  const [passportMode, setPassportMode] = useState(false);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getPlans();
      setPlans(res.plans || []);
    } catch (err: any) {
      console.error("Failed to load plans:", err);
      setNotification({ type: "error", text: "Failed to load subscription plans" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const openCreateModal = () => {
    setEditingPlan(null);
    setPlanId(`soulmate_${Date.now()}`);
    setName("");
    setTier("gold");
    setBillingInterval("monthly");
    setPrice(19.99);
    setCurrency("USD");
    setDiscountPercentage(0);
    setIsPopular(false);
    setActive(true);
    setLikesPerDay(9999);
    setSuperLikesPerMonth(15);
    setRewindsPerMonth(9999);
    setSeeWhoLikedYou(true);
    setPriorityMatches(false);
    setPassportMode(false);
    setShowModal(true);
  };

  const openEditModal = (plan: Plan) => {
    setEditingPlan(plan);
    setPlanId(plan.planId);
    setName(plan.name);
    setTier(plan.tier);
    setBillingInterval(plan.billingInterval);
    setPrice(plan.price);
    setCurrency(plan.currency);
    setDiscountPercentage(plan.discountPercentage || 0);
    setIsPopular(plan.isPopular || false);
    setActive(plan.active);
    setLikesPerDay(plan.perks?.likesPerDay ?? 9999);
    setSuperLikesPerMonth(plan.perks?.superLikesPerMonth ?? 5);
    setRewindsPerMonth(plan.perks?.rewindsPerMonth ?? 9999);
    setSeeWhoLikedYou(plan.perks?.seeWhoLikedYou ?? false);
    setPriorityMatches(plan.perks?.priorityMatches ?? false);
    setPassportMode(plan.perks?.passportMode ?? false);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    const payload = {
      planId,
      name,
      tier,
      billingInterval,
      price: Number(price),
      currency,
      discountPercentage: Number(discountPercentage) || 0,
      isPopular,
      active,
      perks: {
        likesPerDay: Number(likesPerDay),
        superLikesPerMonth: Number(superLikesPerMonth),
        rewindsPerMonth: Number(rewindsPerMonth),
        seeWhoLikedYou,
        priorityMatches,
        passportMode,
      },
    };

    try {
      if (editingPlan) {
        await adminApi.updatePlan(editingPlan._id, payload);
        setNotification({ type: "success", text: "Subscription plan updated successfully." });
      } else {
        await adminApi.createPlan(payload);
        setNotification({ type: "success", text: "New subscription plan created." });
      }
      setShowModal(false);
      fetchPlans();
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Failed to save plan." });
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      await adminApi.updatePlan(id, { active: !current });
      setPlans((prev) => prev.map((p) => (p._id === id ? { ...p, active: !current } : p)));
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Failed to toggle status." });
    }
  };

  const handleDelete = async (id: string, planName: string) => {
    if (!confirm(`Are you sure you want to delete plan "${planName}"?`)) return;

    try {
      await adminApi.deletePlan(id);
      setPlans((prev) => prev.filter((p) => p._id !== id));
      setNotification({ type: "success", text: "Plan deleted." });
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Failed to delete plan." });
    }
  };

  const activePlansCount = plans.filter((p) => p.active).length;
  const popularPlan = plans.find((p) => p.isPopular);

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-screen">
      <Header
        title="Subscription Plan Editor & Pricing Configurator"
        description="Configure tier pricing, discount campaigns, perks quotas, and feature entitlements for user paywalls."
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
                Total Configured Plans
              </span>
              <CreditCard className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
              {plans.length}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Available in plan registry</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Live on Mobile Paywall
              </span>
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-2">
              {activePlansCount}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Ready for app store purchases</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
                Flagship Featured Tier
              </span>
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-white mt-2 truncate">
              {popularPlan ? popularPlan.name : "None designated"}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Highlighted with gold ribbon in-app</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                Subscriber Roster
              </span>
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <Link
              href="/subscriptions"
              className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1.5 mt-3"
            >
              <span>Manage active user accounts →</span>
            </Link>
          </div>
        </div>

        {/* Action Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-rose-500" />
            <span>Paywall Subscription Plans</span>
          </h2>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchPlans}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={openCreateModal}
              className="py-2 px-4 rounded-xl font-semibold text-xs bg-gradient-to-r from-rose-600 to-pink-500 hover:from-rose-500 hover:to-pink-400 text-white shadow-lg shadow-rose-600/20 flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Plan</span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        {loading ? (
          <div className="text-center py-20 text-slate-500 text-sm">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-rose-500" />
            Loading subscription plans...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan._id}
                className={`bg-slate-900/90 border rounded-2xl p-6 relative flex flex-col justify-between transition-all ${
                  plan.isPopular
                    ? "border-amber-500/50 shadow-xl shadow-amber-950/20 ring-1 ring-amber-500/20"
                    : plan.active
                    ? "border-slate-800"
                    : "border-slate-800/40 opacity-60"
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-md flex items-center gap-1">
                    <Star className="w-3 h-3 fill-slate-950" />
                    <span>Most Popular Choice</span>
                  </div>
                )}

                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white">{plan.name}</h3>
                      <span className="text-[11px] font-mono text-slate-500">{plan.planId}</span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold uppercase tracking-wider ${
                        plan.tier === "platinum"
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                          : plan.tier === "gold"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                      }`}
                    >
                      {plan.tier}
                    </span>
                  </div>

                  {/* Price Block */}
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white font-mono">
                      ${plan.price.toFixed(2)}
                    </span>
                    <span className="text-xs text-slate-400 uppercase font-semibold">
                      / {plan.billingInterval}
                    </span>
                    {plan.discountPercentage > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                        Save {plan.discountPercentage}%
                      </span>
                    )}
                  </div>

                  {/* Perks List */}
                  <div className="mt-5 space-y-2.5 border-t border-slate-800/80 pt-4 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{plan.perks?.likesPerDay > 900 ? "Unlimited Likes" : `${plan.perks?.likesPerDay} Likes/Day`}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{plan.perks?.superLikesPerMonth} SuperLikes / month</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {plan.perks?.seeWhoLikedYou ? (
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-slate-600 shrink-0" />
                      )}
                      <span className={plan.perks?.seeWhoLikedYou ? "" : "text-slate-500"}>
                        See Who Liked You
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {plan.perks?.priorityMatches ? (
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-slate-600 shrink-0" />
                      )}
                      <span className={plan.perks?.priorityMatches ? "" : "text-slate-500"}>
                        Priority Deck Placement
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {plan.perks?.passportMode ? (
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-slate-600 shrink-0" />
                      )}
                      <span className={plan.perks?.passportMode ? "" : "text-slate-500"}>
                        Passport Travel Mode
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => handleToggleActive(plan._id, plan.active)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      plan.active
                        ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                        : "bg-slate-800 border-slate-700 text-slate-400"
                    }`}
                  >
                    {plan.active ? (
                      <>
                        <ToggleRight className="w-4 h-4 text-emerald-400" />
                        <span>Active</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4 text-slate-500" />
                        <span>Inactive</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(plan)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      title="Edit Plan & Pricing"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(plan._id, plan.name)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Delete Plan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create / Edit Plan Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>{editingPlan ? "Edit Subscription Plan" : "Create Subscription Plan"}</span>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-white font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                      Plan ID (Identifier)
                    </label>
                    <input
                      type="text"
                      value={planId}
                      onChange={(e) => setPlanId(e.target.value)}
                      placeholder="e.g. soulmate_gold_monthly"
                      required
                      disabled={!!editingPlan}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-mono disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                      Display Title
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Soulmate Gold VIP"
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                      Tier Level
                    </label>
                    <select
                      value={tier}
                      onChange={(e: any) => setTier(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    >
                      <option value="plus">Plus</option>
                      <option value="gold">Gold</option>
                      <option value="platinum">Platinum</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                      Billing Interval
                    </label>
                    <select
                      value={billingInterval}
                      onChange={(e: any) => setBillingInterval(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="annual">Annual</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                      Price ($ USD)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                      Discount % Badge
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={discountPercentage}
                      onChange={(e) => setDiscountPercentage(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="popularCheck"
                      checked={isPopular}
                      onChange={(e) => setIsPopular(e.target.checked)}
                      className="rounded accent-amber-500"
                    />
                    <label htmlFor="popularCheck" className="text-xs text-amber-300 font-bold cursor-pointer">
                      Mark as &ldquo;Most Popular&rdquo;
                    </label>
                  </div>
                </div>

                {/* Perks Configuration */}
                <div className="pt-2">
                  <div className="text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                    Tier Feature Entitlements
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1 uppercase font-semibold">
                          SuperLikes / Month
                        </label>
                        <input
                          type="number"
                          value={superLikesPerMonth}
                          onChange={(e) => setSuperLikesPerMonth(parseInt(e.target.value, 10) || 0)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1 uppercase font-semibold">
                          Likes / Day (9999 = Unlimited)
                        </label>
                        <input
                          type="number"
                          value={likesPerDay}
                          onChange={(e) => setLikesPerDay(parseInt(e.target.value, 10) || 0)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2">
                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={seeWhoLikedYou}
                          onChange={(e) => setSeeWhoLikedYou(e.target.checked)}
                          className="rounded accent-rose-500"
                        />
                        <span>See Likes</span>
                      </label>

                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={priorityMatches}
                          onChange={(e) => setPriorityMatches(e.target.checked)}
                          className="rounded accent-rose-500"
                        />
                        <span>Priority Placement</span>
                      </label>

                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={passportMode}
                          onChange={(e) => setPassportMode(e.target.checked)}
                          className="rounded accent-rose-500"
                        />
                        <span>Passport Travel</span>
                      </label>
                    </div>
                  </div>
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
                    {formLoading ? "Saving..." : editingPlan ? "Update Plan" : "Create Plan"}
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

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDashboardStats } from "../../lib/api";
import { formatCurrency } from "../../lib/calculations";
import { isSupabaseConfigured } from "../../lib/supabase";

export default function DashboardPage() {
  const [stats, setStats] = useState<{
    openROs: number;
    avgROValue: number;
    avgGP: number;
    avgGPPerHour: number;
    recentROs: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-6 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500">
              {isSupabaseConfigured
                ? "Live data from your shop"
                : "Demo mode — connect Supabase to see real numbers"}
            </p>
          </div>
          <Link
            href="/repair-orders"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            + New RO
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border p-5">
            <div className="text-sm text-gray-500">Open Repair Orders</div>
            <div className="text-3xl font-bold mt-1">
              {loading ? "—" : stats?.openROs ?? 0}
            </div>
          </div>
          <div className="bg-white rounded-xl border p-5">
            <div className="text-sm text-gray-500">Avg RO Value (30d)</div>
            <div className="text-3xl font-bold mt-1">
              {loading ? "—" : formatCurrency(stats?.avgROValue ?? 0)}
            </div>
          </div>
          <div className="bg-white rounded-xl border p-5">
            <div className="text-sm text-gray-500">Avg Gross Profit</div>
            <div className="text-3xl font-bold mt-1 text-emerald-600">
              {loading ? "—" : formatCurrency(stats?.avgGP ?? 0)}
            </div>
          </div>
          <div className="bg-white rounded-xl border p-5">
            <div className="text-sm text-gray-500">Avg GP / Hour</div>
            <div className="text-3xl font-bold mt-1 text-blue-600">
              {loading ? "—" : formatCurrency(stats?.avgGPPerHour ?? 0)}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="px-5 py-3 border-b bg-gray-50">
            <h2 className="font-semibold text-gray-800">Open Repair Orders</h2>
          </div>
          <div className="divide-y">
            {loading && (
              <div className="p-8 text-center text-gray-400">Loading…</div>
            )}
            {!loading && (!stats?.recentROs || stats.recentROs.length === 0) && (
              <div className="p-8 text-center text-gray-400">
                No open repair orders yet.
              </div>
            )}
            {stats?.recentROs?.map((ro) => (
              <div
                key={ro.id}
                className="px-5 py-4 flex items-center justify-between"
              >
                <div>
                  <div className="font-medium">{ro.ro_number}</div>
                  <div className="text-sm text-gray-500">
                    {ro.customers?.name || "No customer"} ·{" "}
                    {[ro.vehicles?.year, ro.vehicles?.make, ro.vehicles?.model]
                      .filter(Boolean)
                      .join(" ") || "No vehicle"}
                  </div>
                </div>
                <Link
  href={`/repair-orders/view?id=${ro.id}`}
  className="text-blue-600 hover:underline text-sm"
>
  View
</Link>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/repair-orders/list"
            className="bg-white border rounded-xl p-5 hover:border-blue-300 transition block"
          >
            <div className="font-semibold">All Repair Orders</div>
            <div className="text-sm text-gray-500 mt-1">View and open saved jobs</div>
          </Link>
          <Link
            href="/customers"
            className="bg-white border rounded-xl p-5 hover:border-blue-300 transition block"
          >
            <div className="font-semibold">Customers</div>
            <div className="text-sm text-gray-500 mt-1">Manage customers & vehicles</div>
          </Link>
          <Link
            href="/inventory"
            className="bg-white border rounded-xl p-5 hover:border-blue-300 transition block"
          >
            <div className="font-semibold">Inventory</div>
            <div className="text-sm text-gray-500 mt-1">Parts on hand & pricing</div>
          </Link>
        </div>
      </div>
    </main>
  );
}
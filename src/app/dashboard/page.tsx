"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDashboardStats, getInventory } from "../../lib/api";
import { formatCurrency } from "../../lib/calculations";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    openROs: 0,
    avgROValue: 0,
    totalGP: 0,
    avgGPPerHour: 0,
    totalSales: 0,
    gpMargin: 0,
    recentROs: [],
  });
  const [inventoryValue, setInventoryValue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  getDashboardStats()
    .then((data) => {
      setStats({
        openROs: data.openROs || 0,
        avgROValue: data.avgROValue || 0,
        totalGP: data.totalGP || 0,
        avgGPPerHour: data.avgGPPerHour || 0,
        totalSales: data.totalSales || 0,
        gpMargin: data.gpMargin || 0,
        recentROs: data.recentROs || [],
      });
    })
    .catch(() => {});

  getInventory()
    .then(items => {
      const total = (items || []).reduce((s, i) => s + (i.quantity_on_hand || 0) * (i.cost_price || 0), 0);
      setInventoryValue(total);
    })
    .catch(() => {})
    .finally(() => setLoading(false));
}, []);

  const openROs = stats.recentROs.filter((r: any) =>
    ["estimate", "authorized", "in_progress"].includes(r.status)
  );
  const completedROs = stats.recentROs.filter((r: any) =>
    ["completed", "invoiced"].includes(r.status)
  );

  return (
    <div className="min-h-screen text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-7 gap-4">
          <MetricCard title="Open ROs" value={loading ? "—" : openROs.length} />
          <MetricCard title="Total Sales" value={loading ? "—" : formatCurrency(stats.totalSales)} />
          <MetricCard title="Avg RO Value" value={loading ? "—" : formatCurrency(stats.avgROValue)} />
          <MetricCard title="Total Profit" value={loading ? "—" : formatCurrency(stats.totalGP)} accent="green" />
          <MetricCard title="GP Margin" value={loading ? "—" : `${stats.gpMargin.toFixed(1)}%`} accent="green" />
          <MetricCard title="GP / Hour" value={loading ? "—" : formatCurrency(stats.avgGPPerHour)} accent="blue" />
          <MetricCard title="Parts on Hand" value={loading ? "—" : formatCurrency(inventoryValue)} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ROList title="Open Repair Orders" ros={openROs} emptyText="No open repair orders" />
          <ROList title="Completed" ros={completedROs} emptyText="No completed repair orders" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <QuickLink href="/repair-orders/list" title="All Repair Orders" />
          <QuickLink href="/customers" title="Customers" />
          <QuickLink href="/inventory" title="Inventory" />
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, accent }: { title: string; value: string | number; accent?: string }) {
  const color = accent === "green" ? "text-emerald-400" : accent === "blue" ? "text-blue-400" : "text-white";
  return (
    <div className="bg-gray-900/80 border border-gray-700 rounded-xl p-5">
      <div className="text-sm text-gray-400">{title}</div>
      <div className={`text-2xl font-semibold mt-1 ${color}`}>{value}</div>
    </div>
  );
}

function ROList({ title, ros, emptyText }: { title: string; ros: any[]; emptyText: string }) {
  return (
    <div className="bg-gray-900/80 border border-gray-700 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-700 font-semibold">{title}</div>
      <div className="divide-y divide-gray-700">
        {ros.length === 0 && <div className="p-6 text-center text-gray-500 text-sm">{emptyText}</div>}
        {ros.map((ro) => {
          const laborTotal = (ro.labor_lines || []).reduce(
            (s: number, l: any) => s + (Number(l.hours_billed) || 0) * (Number(l.labor_rate) || 0), 0
          );
          const partsTotal = (ro.parts_lines || []).reduce(
            (s: number, p: any) => s + (Number(p.quantity) || 0) * (Number(p.sell_price) || 0), 0
          );
          const total = laborTotal + partsTotal;
          return (
            <div key={ro.id} className="px-5 py-3 flex justify-between items-center hover:bg-gray-800/50">
              <div>
                <div className="font-medium">{ro.ro_number}</div>
                <div className="text-sm text-gray-400">{ro.customers?.name || "No customer"}</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-medium">{formatCurrency(total)}</div>
                  <StatusBadge status={ro.status} />
                </div>
                <Link href={`/repair-orders/view?id=${ro.id}`} className="text-blue-400 text-sm">View</Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    estimate: "bg-yellow-900/50 text-yellow-300",
    authorized: "bg-blue-900/50 text-blue-300",
    in_progress: "bg-green-900/50 text-green-300",
    completed: "bg-gray-700 text-gray-300",
    invoiced: "bg-purple-900/50 text-purple-300",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${styles[status] || styles.completed}`}>
      {status.replace("_", " ")}
    </span>
  );
}

function QuickLink({ href, title }: { href: string; title: string }) {
  return (
    <Link href={href} className="bg-gray-900/80 border border-gray-700 rounded-xl p-5 text-center hover:border-blue-500 transition">
      {title}
    </Link>
  );
}
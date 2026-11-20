"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getRepairOrder } from "../../../lib/api";
import { formatCurrency, calculateROTotals } from "../../../lib/calculations";

function RepairOrderView() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [ro, setRo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      getRepairOrder(id)
        .then(setRo)
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-400">Loading…</div>
      </main>
    );
  }

  if (!ro) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Repair order not found.</div>
      </main>
    );
  }

  const totals = calculateROTotals(ro.labor_lines || [], ro.parts_lines || []);

  return (
    <main className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/repair-orders/list" className="text-sm text-blue-600 hover:underline">
              ← Back to list
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">{ro.ro_number}</h1>
            <p className="text-sm text-gray-500">
              {ro.customers?.name || "No customer"} ·{" "}
              {[ro.vehicles?.year, ro.vehicles?.make, ro.vehicles?.model]
                .filter(Boolean)
                .join(" ") || "No vehicle"}
            </p>
          </div>
          <span className="text-sm px-3 py-1 rounded-full font-medium bg-gray-100 text-gray-800">
            {ro.status.replace("_", "
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getRepairOrder } from "../../../lib/api";
import { formatCurrency, calculateROTotals } from "../../../lib/calculations";

export default function ViewRepairOrderPage() {
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
            {ro.status.replace("_", " ")}
          </span>
        </div>

        {ro.customer_concern && (
          <div className="bg-white border rounded-xl p-5">
            <div className="text-sm font-medium text-gray-500">Customer Concern</div>
            <div className="mt-1">{ro.customer_concern}</div>
          </div>
        )}

        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b font-semibold">Labor</div>
          <div className="divide-y">
            {(ro.labor_lines || []).map((line: any) => (
              <div key={line.id} className="px-5 py-3 flex justify-between text-sm">
                <div>{line.description}</div>
                <div>
                  {line.hours_billed} hrs × {formatCurrency(line.labor_rate)} ={" "}
                  <span className="font-medium">
                    {formatCurrency(line.hours_billed * line.labor_rate)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b font-semibold">Parts</div>
          <div className="divide-y">
            {(ro.parts_lines || []).map((line: any) => (
              <div key={line.id} className="px-5 py-3 flex justify-between text-sm">
                <div>
                  {line.description}
                  {line.part_number && (
                    <span className="text-gray-400 ml-2">({line.part_number})</span>
                  )}
                </div>
                <div>
                  {line.quantity} × {formatCurrency(line.sell_price)} ={" "}
                  <span className="font-medium">
                    {formatCurrency(line.quantity * line.sell_price)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 text-white rounded-xl p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="text-slate-400 text-sm">Labor</div>
              <div className="text-xl font-bold">{formatCurrency(totals.laborTotal)}</div>
            </div>
            <div>
              <div className="text-slate-400 text-sm">Parts</div>
              <div className="text-xl font-bold">{formatCurrency(totals.partsTotal)}</div>
            </div>
            <div>
              <div className="text-slate-400 text-sm">Grand Total</div>
              <div className="text-xl font-bold text-green-400">
                {formatCurrency(totals.grandTotal)}
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-sm">Gross Profit</div>
              <div className="text-xl font-bold text-emerald-400">
                {formatCurrency(totals.grossProfit)}
              </div>
            </div>
          </div>
        </div>

        {ro.tech_notes && (
          <div className="bg-white border rounded-xl p-5">
            <div className="text-sm font-medium text-gray-500">Tech Notes</div>
            <div className="mt-1 whitespace-pre-wrap">{ro.tech_notes}</div>
          </div>
        )}
      </div>
    </main>
  );
}
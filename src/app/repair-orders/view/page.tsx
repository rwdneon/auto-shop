"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getRepairOrder } from "../../../lib/api";
import { formatCurrency, calculateROTotals } from "../../../lib/calculations";

function ViewContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [ro, setRo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    getRepairOrder(id)
      .then(setRo)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8">Loading…</div>;
  if (!ro) return <div className="p-8">Not found</div>;

  const totals = calculateROTotals(ro.labor_lines || [], ro.parts_lines || []);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link href="/repair-orders/list" className="text-blue-600">← Back</Link>
      <h1 className="text-2xl font-bold mt-2">{ro.ro_number}</h1>
      <p className="text-gray-600 mb-4">
        {ro.customers?.name} · {ro.vehicles?.year} {ro.vehicles?.make} {ro.vehicles?.model}
      </p>

      <div className="bg-white border rounded-lg p-4 mb-4">
        <h2 className="font-semibold mb-2">Labor</h2>
        {(ro.labor_lines || []).map((l: any) => (
          <div key={l.id} className="flex justify-between text-sm py-1">
            <span>{l.description}</span>
            <span>{formatCurrency(l.hours_billed * l.labor_rate)}</span>
          </div>
        ))}
      </div>

      <div className="bg-white border rounded-lg p-4 mb-4">
        <h2 className="font-semibold mb-2">Parts</h2>
        {(ro.parts_lines || []).map((p: any) => (
          <div key={p.id} className="flex justify-between text-sm py-1">
            <span>{p.description}</span>
            <span>{formatCurrency(p.quantity * p.sell_price)}</span>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 text-white rounded-lg p-4">
        <div>Labor
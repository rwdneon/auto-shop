"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getRepairOrder } from "../../../lib/api";
import { formatCurrency, calculateROTotals } from "../../../lib/calculations";

function ViewContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [ro, setRo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    getRepairOrder(id).then(setRo).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8">Loading</div>;
  if (!ro) return <div className="p-8">Not found</div>;

  const totals = calculateROTotals(ro.labor_lines || [], ro.parts_lines || []);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link href="/repair-orders/list" className="text-blue-600">Back</Link>
      <h1 className="text-2xl font-bold mt-2">{ro.ro_number}</h1>
      <p className="mb-4">{ro.customers?.name}</p>
      <div className="bg-gray-900 text-white p-4 rounded">
        <div>Total: {formatCurrency(totals.grandTotal)}</div>
        <div>Profit: {formatCurrency(totals.grossProfit)}</div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8">Loading</div>}>
      <ViewContent />
    </Suspense>
  );
}
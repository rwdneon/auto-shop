"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getRepairOrders } from "../../../lib/api";

export default function RepairOrdersListPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRepairOrders()
      .then(setOrders)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-5xl mx-auto px-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Repair Orders</h1>
            <p className="text-sm text-gray-500">All saved jobs</p>
          </div>
          <Link
            href="/repair-orders"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            + New RO
          </Link>
        </div>

        <div className="bg-white border rounded-xl overflow-hidden">
          {loading && (
            <div className="p-8 text-center text-gray-400">Loading…</div>
          )}
          {!loading && orders.length === 0 && (
            <div className="p-8 text-center text-gray-400">
              No repair orders yet.
            </div>
          )}
          <div className="divide-y">
            {orders.map((ro) => (
              <div
                key={ro.id}
                className="px-5 py-4 hover:bg-gray-50 flex items-center justify-between"
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
                <div className="flex items-center gap-4">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      ro.status === "estimate"
                        ? "bg-yellow-100 text-yellow-800"
                        : ro.status === "authorized"
                        ? "bg-blue-100 text-blue-800"
                        : ro.status === "in_progress"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {ro.status.replace("_", " ")}
                  </span>
                  <Link
                    href={`/repair-orders/view?id=${ro.id}`}
                    className="text-blue-600 hover:underline text-sm font-medium"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
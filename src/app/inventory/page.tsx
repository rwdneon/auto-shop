"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getInventory, upsertInventoryItem } from "../../lib/api";
import { formatCurrency } from "../../lib/calculations";
import { isSupabaseConfigured } from "../../lib/supabase";

interface InventoryItem {
  id?: string;
  part_number?: string;
  description: string;
  quantity_on_hand: number;
  min_quantity?: number;
  cost_price: number;
  sell_price: number;
  vendor?: string;
  location?: string;
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<InventoryItem>({
    description: "",
    quantity_on_hand: 0,
    cost_price: 0,
    sell_price: 0,
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getInventory();
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description.trim()) return;
    setSaving(true);
    try {
      await upsertInventoryItem(form);
      setForm({
        description: "",
        quantity_on_hand: 0,
        cost_price: 0,
        sell_price: 0,
      });
      setShowForm(false);
      await load();
    } catch (err) {
      alert("Error: " + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const lowStock = items.filter(
    (i) => (i.min_quantity || 0) > 0 && i.quantity_on_hand <= (i.min_quantity || 0)
  );

  return (
    <main className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-5xl mx-auto px-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
            <p className="text-sm text-gray-500">
              {isSupabaseConfigured
                ? "Parts on hand, cost & sell prices"
                : "Demo mode — connect Supabase to persist inventory"}
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/dashboard"
              className="text-sm text-blue-600 hover:underline self-center"
            >
              ← Dashboard
            </Link>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              {showForm ? "Cancel" : "+ Add Part"}
            </button>
          </div>
        </div>

        {lowStock.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <strong>{lowStock.length} item(s) low on stock:</strong>{" "}
            {lowStock.map((i) => i.description).join(", ")}
          </div>
        )}

        {showForm && (
          <form
            onSubmit={handleSave}
            className="bg-white border rounded-xl p-5 grid grid-cols-2 md:grid-cols-4 gap-3"
          >
            <input
              value={form.part_number || ""}
              onChange={(e) =>
                setForm({ ...form, part_number: e.target.value })
              }
              placeholder="Part number"
              className="border rounded-lg px-3 py-2"
            />
            <input
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Description *"
              required
              className="border rounded-lg px-3 py-2 col-span-2"
            />
            <input
              type="number"
              value={form.quantity_on_hand}
              onChange={(e) =>
                setForm({
                  ...form,
                  quantity_on_hand: Number(e.target.value),
                })
              }
              placeholder="Qty on hand"
              className="border rounded-lg px-3 py-2"
            />
            <input
              type="number"
              step="0.01"
              value={form.cost_price}
              onChange={(e) =>
                setForm({ ...form, cost_price: Number(e.target.value) })
              }
              placeholder="Cost price"
              className="border rounded-lg px-3 py-2"
            />
            <input
              type="number"
              step="0.01"
              value={form.sell_price}
              onChange={(e) =>
                setForm({ ...form, sell_price: Number(e.target.value) })
              }
              placeholder="Sell price"
              className="border rounded-lg px-3 py-2"
            />
            <input
              type="number"
              value={form.min_quantity || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  min_quantity: Number(e.target.value) || undefined,
                })
              }
              placeholder="Min qty (reorder)"
              className="border rounded-lg px-3 py-2"
            />
            <input
              value={form.vendor || ""}
              onChange={(e) => setForm({ ...form, vendor: e.target.value })}
              placeholder="Vendor"
              className="border rounded-lg px-3 py-2"
            />
            <button
              type="submit"
              disabled={saving}
              className="bg-gray-900 text-white rounded-lg font-medium disabled:opacity-50 col-span-2 md:col-span-1"
            >
              {saving ? "Saving…" : "Save Part"}
            </button>
          </form>
        )}

        <div className="bg-white border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">Part #</th>
                <th className="px-4 py-3 font-medium text-gray-600">
                  Description
                </th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">
                  On Hand
                </th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">
                  Cost
                </th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">
                  Sell
                </th>
                <th className="px-4 py-3 font-medium text-gray-600 text-right">
                  Margin
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    No inventory items yet.
                  </td>
                </tr>
              )}
              {items.map((item) => {
                const margin =
                  item.sell_price > 0
                    ? ((item.sell_price - item.cost_price) / item.sell_price) *
                      100
                    : 0;
                const isLow =
                  (item.min_quantity || 0) > 0 &&
                  item.quantity_on_hand <= (item.min_quantity || 0);
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">
                      {item.part_number || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {item.description}
                      {isLow && (
                        <span className="ml-2 text-xs text-amber-600 font-medium">
                          LOW
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {item.quantity_on_hand}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(item.cost_price)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(item.sell_price)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {margin.toFixed(0)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
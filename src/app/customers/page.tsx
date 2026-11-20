"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCustomers, createCustomer, getVehicles } from "../../lib/api";
import { Customer, Vehicle } from "../../types/shop";
import { isSupabaseConfigured } from "../../lib/supabase";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Record<string, Vehicle[]>>({});
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const list = await getCustomers();
      setCustomers(list);
      const vMap: Record<string, Vehicle[]> = {};
      for (const c of list) {
        vMap[c.id] = await getVehicles(c.id);
      }
      setVehicles(vMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await createCustomer({
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
      });
      setName("");
      setPhone("");
      setEmail("");
      await load();
    } catch (err) {
      alert("Error: " + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
            <p className="text-sm text-gray-500">
              {isSupabaseConfigured
                ? "Your customer list"
                : "Demo mode — data won’t persist until Supabase is connected"}
            </p>
          </div>
          <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
            ← Dashboard
          </Link>
        </div>

        <form
          onSubmit={handleAdd}
          className="bg-white border rounded-xl p-5 grid grid-cols-1 md:grid-cols-4 gap-3"
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name *"
            required
            className="border rounded-lg px-3 py-2"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone"
            className="border rounded-lg px-3 py-2"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="border rounded-lg px-3 py-2"
          />
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
          >
            {saving ? "Adding…" : "Add Customer"}
          </button>
        </form>

        <div className="bg-white border rounded-xl overflow-hidden">
          {loading && (
            <div className="p-8 text-center text-gray-400">Loading…</div>
          )}
          {!loading && customers.length === 0 && (
            <div className="p-8 text-center text-gray-400">
              No customers yet. Add your first one above.
            </div>
          )}
          <div className="divide-y">
            {customers.map((c) => (
              <div key={c.id} className="px-5 py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{c.name}</div>
                    <div className="text-sm text-gray-500 space-x-3">
                      {c.phone && <span>{c.phone}</span>}
                      {c.email && <span>{c.email}</span>}
                    </div>
                  </div>
                </div>
                {vehicles[c.id]?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {vehicles[c.id].map((v) => (
                      <span
                        key={v.id}
                        className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                      >
                        {[v.year, v.make, v.model].filter(Boolean).join(" ")}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCustomers, createCustomer, updateCustomer, deleteCustomer, getVehicles, createVehicle, updateVehicle, deleteVehicle } from "../../lib/api";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    try {
      const list = await getCustomers();
      setCustomers(list);
      const vMap: Record<string, any[]> = {};
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

  useEffect(() => { load(); }, []);

  const saveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      if (editingCustomerId) {
        await updateCustomer(editingCustomerId, { name: name.trim(), phone: phone.trim() || undefined, email: email.trim() || undefined });
      } else {
        await createCustomer({ name: name.trim(), phone: phone.trim() || undefined, email: email.trim() || undefined });
      }
      setName(""); setPhone(""); setEmail(""); setEditingCustomerId(null);
      await load();
    } catch (err) {
      alert("Error saving customer");
    }
  };

  const saveVehicle = async () => {
    if (!editingVehicle) return;
    try {
      await updateVehicle(editingVehicle.id, {
        year: editingVehicle.year ? Number(editingVehicle.year) : null,
        make: editingVehicle.make,
        model: editingVehicle.model,
        vin: editingVehicle.vin,
      });
      setEditingVehicle(null);
      await load();
    } catch (err) {
      alert("Error saving vehicle");
    }
  };

  return (
    <div className="min-h-screen">
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold">Customers</h1>
          <Link href="/dashboard" className="text-sm text-blue-600">← Dashboard</Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        {/* Add / Edit Customer Form */}
        <form onSubmit={saveCustomer} className="bg-white border rounded-xl p-5 shadow-sm">
          <div className="text-sm font-medium mb-3">{editingCustomerId ? "Edit Customer" : "Add Customer"}</div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Name *" required className="border rounded-lg px-3 py-2" />
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone" className="border rounded-lg px-3 py-2" />
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="border rounded-lg px-3 py-2" />
            <button type="submit" className="bg-blue-600 text-white rounded-lg font-medium">
              {editingCustomerId ? "Update" : "Add"}
            </button>
          </div>
        </form>

        {/* Customer List */}
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          {loading && <div className="p-8 text-center text-gray-400">Loading...</div>}
          {!loading && customers.length === 0 && <div className="p-8 text-center text-gray-400">No customers</div>}
          <div className="divide-y">
            {customers.map(c => (
              <div key={c.id} className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-gray-900">{c.name}</div>
                    <div className="text-sm text-gray-500 mt-0.5">
                      {c.phone && <span className="mr-4">{c.phone}</span>}
                      {c.email && <span>{c.email}</span>}
                    </div>
                  </div>
                  <div className="flex gap-3 text-sm">
                    <button onClick={() => { setEditingCustomerId(c.id); setName(c.name); setPhone(c.phone || ""); setEmail(c.email || ""); }} className="text-blue-600">Edit</button>
                    <button onClick={async () => { if (confirm("Delete customer?")) { await deleteCustomer(c.id); load(); } }} className="text-red-600">Delete</button>
                  </div>
                </div>

                {/* Vehicles */}
                <div className="mt-3 space-y-2">
                  {vehicles[c.id]?.map(v => (
                    <div key={v.id} className="flex justify-between items-center text-sm bg-gray-50 rounded-lg px-3 py-2">
                      <div>
                        {[v.year, v.make, v.model].filter(Boolean).join(" ")}
                        {v.vin && <span className="text-gray-400 ml-2 font-mono text-xs">{v.vin}</span>}
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => setEditingVehicle({...v})} className="text-blue-600 text-xs">Edit</button>
                        <button onClick={async () => { if (confirm("Delete vehicle?")) { await deleteVehicle(v.id); load(); } }} className="text-red-600 text-xs">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Vehicle Modal */}
      {editingVehicle && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-3">
            <h3 className="font-semibold">Edit Vehicle</h3>
            <input value={editingVehicle.year || ""} onChange={e => setEditingVehicle({...editingVehicle, year: e.target.value})} placeholder="Year" className="border rounded-lg px-3 py-2 w-full" />
            <input value={editingVehicle.make || ""} onChange={e => setEditingVehicle({...editingVehicle, make: e.target.value})} placeholder="Make" className="border rounded-lg px-3 py-2 w-full" />
            <input value={editingVehicle.model || ""} onChange={e => setEditingVehicle({...editingVehicle, model: e.target.value})} placeholder="Model" className="border rounded-lg px-3 py-2 w-full" />
            <input value={editingVehicle.vin || ""} onChange={e => setEditingVehicle({...editingVehicle, vin: e.target.value})} placeholder="VIN" className="border rounded-lg px-3 py-2 w-full font-mono" />
            <div className="flex gap-2 pt-2">
              <button onClick={saveVehicle} className="flex-1 bg-blue-600 text-white py-2 rounded-lg">Save</button>
              <button onClick={() => setEditingVehicle(null)} className="px-4 border rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { getInventory, upsertInventoryItem, deleteInventoryItem } from "../../lib/api";
import { formatCurrency } from "../../lib/calculations";

export default function InventoryPage() {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ description: "", quantity_on_hand: 0, cost_price: 0, sell_price: 0 });

  const load = () => getInventory().then(setItems);
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    await upsertInventoryItem(form);
    setForm({ description: "", quantity_on_hand: 0, cost_price: 0, sell_price: 0 });
    setShowForm(false);
    load();
  };

  const remove = async (id) => {
    if (confirm("Delete?")) {
      await deleteInventoryItem(id);
      load();
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded">
          {showForm ? "Cancel" : "Add Part"}
        </button>
      </div>

 {showForm && (
  <form onSubmit={save} className="bg-white p-4 rounded border mb-4">
    <div className="mb-2">
      <label className="block text-sm font-medium">Description</label>
      <input className="border p-2 w-full" placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} required />
    </div>
    <div className="grid grid-cols-3 gap-2 mb-2">
      <div>
        <label className="block text-sm font-medium">Quantity</label>
        <input className="border p-2 w-full" type="number" placeholder="Qty" value={form.quantity_on_hand} onChange={e => setForm({...form, quantity_on_hand: Number(e.target.value)})} />
      </div>
      <div>
        <label className="block text-sm font-medium">Cost</label>
        <input className="border p-2 w-full" type="number" step="0.01" placeholder="Cost" value={form.cost_price} onChange={e => setForm({...form, cost_price: Number(e.target.value)})} />
      </div>
      <div>
        <label className="block text-sm font-medium">Sell Price</label>
        <input className="border p-2 w-full" type="number" step="0.01" placeholder="Sell" value={form.sell_price} onChange={e => setForm({...form, sell_price: Number(e.target.value)})} />
      </div>
    </div>
    <button className="bg-gray-800 text-white px-4 py-2 rounded" type="submit">Save</button>
  </form>
)}

      {items.map(item => (
        <div key={item.id} className="bg-white p-3 mb-2 rounded border flex justify-between items-center">
          <div>
            <div className="font-medium">{item.description}</div>
            <div className="text-sm text-gray-600">
              Qty: {item.quantity_on_hand} · Cost: {formatCurrency(item.cost_price)} · Sell: {formatCurrency(item.sell_price)}
            </div>
          </div>
          <div>
            <button onClick={() => { setForm(item); setShowForm(true); }} className="text-blue-600 mr-3">Edit</button>
            <button onClick={() => remove(item.id)} className="text-red-600">Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}
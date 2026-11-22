"use client";

import { useState, useMemo, useEffect } from "react";
import { LaborLine, PartsLine, ROStatus } from "../types/shop";
import { calculateROTotals, formatCurrency, calculateFees } from "../lib/calculations";
import {
  createRepairOrder,
  getCustomers,
  getVehicles,
  createCustomer,
  createVehicle,
  getInventory,
} from "../lib/api";

const DEFAULT_LABOR_RATE = 150;

export default function RepairOrderForm() {
  const [status, setStatus] = useState<ROStatus>("estimate");
  const [mileageIn, setMileageIn] = useState("");
  const [customerConcern, setCustomerConcern] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [discount, setDiscount] = useState(0);
  const [includeFees, setIncludeFees] = useState(true);

  const [customers, setCustomers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");

  const [newCustomerName, setNewCustomerName] = useState("");
  const [showNewCustomer, setShowNewCustomer] = useState(false);

  const [newVehicle, setNewVehicle] = useState({ year: "", make: "", model: "", vin: "" });
  const [showNewVehicle, setShowNewVehicle] = useState(false);
  const [decoding, setDecoding] = useState(false);

  const [laborLines, setLaborLines] = useState<LaborLine[]>([
    { id: crypto.randomUUID(), description: "", hours_billed: 1, labor_rate: DEFAULT_LABOR_RATE },
  ]);

  const [partsLines, setPartsLines] = useState<PartsLine[]>([
    { id: crypto.randomUUID(), description: "", quantity: 1, cost_price: 0, sell_price: 0 },
  ]);

  const totals = useMemo(() => calculateROTotals(laborLines, partsLines), [laborLines, partsLines]);
  const fees = useMemo(() => {
    if (!includeFees) return { hazmat: 0, shopSupply: 0, totalFees: 0 };
    return calculateFees(totals.grandTotal);
  }, [totals.grandTotal, includeFees]);
  const subtotal = totals.grandTotal + fees.totalFees;
  const discountAmount = discount || 0;
  const finalTotal = Math.max(0, subtotal - discountAmount);

  useEffect(() => {
    getCustomers().then(setCustomers).catch(console.error);
    getInventory().then(setInventory).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedCustomerId) {
      getVehicles(selectedCustomerId).then(setVehicles).catch(console.error);
    } else {
      setVehicles([]);
    }
  }, [selectedCustomerId]);

  const addCustomer = async () => {
    if (!newCustomerName.trim()) return;
    const c = await createCustomer({ name: newCustomerName.trim() });
    setCustomers(prev => [...prev, c]);
    setSelectedCustomerId(c.id);
    setNewCustomerName("");
    setShowNewCustomer(false);
  };

  const addVehicle = async () => {
    if (!selectedCustomerId || !newVehicle.make) return;
    const v = await createVehicle({
      customer_id: selectedCustomerId,
      year: newVehicle.year ? Number(newVehicle.year) : undefined,
      make: newVehicle.make,
      model: newVehicle.model || undefined,
      vin: newVehicle.vin || undefined,
    });
    setVehicles(prev => [...prev, v]);
    setSelectedVehicleId(v.id);
    setNewVehicle({ year: "", make: "", model: "", vin: "" });
    setShowNewVehicle(false);
  };

  const decodeVin = async () => {
    if (newVehicle.vin.length !== 17) return;
    setDecoding(true);
    try {
      const res = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${newVehicle.vin}?format=json`);
      const data = await res.json();
      const result = data.Results?.[0];
      if (result?.Make) {
        setNewVehicle({ ...newVehicle, year: result.ModelYear || "", make: result.Make || "", model: result.Model || "" });
      }
    } catch (err) {
      alert("Could not decode VIN");
    } finally {
      setDecoding(false);
    }
  };

  const addFromInventory = (item: any) => {
    setPartsLines(prev => [...prev, {
      id: crypto.randomUUID(),
      part_number: item.part_number || "",
      description: item.description,
      quantity: 1,
      cost_price: item.cost_price || 0,
      sell_price: item.sell_price || 0,
    }]);
  };

  const addManualPart = () => {
    setPartsLines(prev => [...prev, { id: crypto.randomUUID(), description: "", quantity: 1, cost_price: 0, sell_price: 0 }]);
  };

  const removeLabor = (id: string) => setLaborLines(prev => prev.filter(l => l.id !== id));
  const removePart = (id: string) => setPartsLines(prev => prev.filter(p => p.id !== id));

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      await createRepairOrder({
        customer_id: selectedCustomerId || undefined,
        vehicle_id: selectedVehicleId || undefined,
        status,
        mileage_in: mileageIn ? Number(mileageIn) : undefined,
        customer_concern: customerConcern || undefined,
        labor_lines: laborLines.filter(l => l.description.trim()),
        parts_lines: partsLines.filter(p => p.description.trim()),
      });
      setMessage("Saved successfully");
    } catch (err) {
      setMessage("Error saving");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 text-white">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">New Repair Order</h1>
        <button onClick={handleSave} disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded">
          {saving ? "Saving..." : "Save RO"}
        </button>
      </div>

      {message && <div className="p-3 bg-gray-800 rounded">{message}</div>}

      <div className="bg-gray-900/80 border border-gray-700 rounded-xl p-5 space-y-4">
        <div className="flex gap-2">
          <select value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)} className="border border-gray-600 bg-gray-800 p-2 flex-1 rounded">
            <option value="">Select customer</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button onClick={() => setShowNewCustomer(!showNewCustomer)} className="border border-gray-600 px-3 py-2 rounded">+ New</button>
        </div>
        {showNewCustomer && (
          <div className="flex gap-2">
            <input value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} placeholder="Customer name" className="border border-gray-600 bg-gray-800 p-2 flex-1 rounded" />
            <button onClick={addCustomer} className="bg-gray-700 px-3 py-2 rounded">Add</button>
          </div>
        )}

        <div className="flex gap-2">
          <select value={selectedVehicleId} onChange={e => setSelectedVehicleId(e.target.value)} className="border border-gray-600 bg-gray-800 p-2 flex-1 rounded" disabled={!selectedCustomerId}>
            <option value="">Select vehicle</option>
            {vehicles.map(v => <option key={v.id} value={v.id}>{v.year} {v.make} {v.model}</option>)}
          </select>
          <button onClick={() => setShowNewVehicle(!showNewVehicle)} className="border border-gray-600 px-3 py-2 rounded" disabled={!selectedCustomerId}>+ New</button>
        </div>
        {showNewVehicle && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input value={newVehicle.year} onChange={e => setNewVehicle({...newVehicle, year: e.target.value})} placeholder="Year" className="border border-gray-600 bg-gray-800 p-2 rounded" />
              <input value={newVehicle.make} onChange={e => setNewVehicle({...newVehicle, make: e.target.value})} placeholder="Make" className="border border-gray-600 bg-gray-800 p-2 rounded" />
              <input value={newVehicle.model} onChange={e => setNewVehicle({...newVehicle, model: e.target.value})} placeholder="Model" className="border border-gray-600 bg-gray-800 p-2 rounded" />
              <input value={newVehicle.vin} onChange={e => setNewVehicle({...newVehicle, vin: e.target.value.toUpperCase()})} placeholder="VIN" maxLength={17} className="border border-gray-600 bg-gray-800 p-2 rounded" />
            </div>
            <button onClick={decodeVin} disabled={newVehicle.vin.length !== 17 || decoding} className="bg-blue-600 px-3 py-2 rounded text-sm">
              {decoding ? "Decoding..." : "Decode VIN"}
            </button>
            <button onClick={addVehicle} className="bg-gray-700 px-3 py-2 rounded w-full">Save Vehicle</button>
          </div>
        )}

        <input value={customerConcern} onChange={e => setCustomerConcern(e.target.value)} placeholder="Customer concern" className="border border-gray-600 bg-gray-800 p-2 w-full rounded" />
        <input value={mileageIn} onChange={e => setMileageIn(e.target.value)} placeholder="Mileage" className="border border-gray-600 bg-gray-800 p-2 w-full rounded" />

        <div>
          <h2 className="font-semibold mb-2">Labor</h2>
          {laborLines.map(line => (
            <div key={line.id} className="flex gap-2 mb-2 items-center">
              <input value={line.description} onChange={e => setLaborLines(prev => prev.map(l => l.id === line.id ? {...l, description: e.target.value} : l))} placeholder="Description" className="border border-gray-600 bg-gray-800 p-2 flex-1 rounded" />
              <input type="number" value={line.hours_billed} onChange={e => setLaborLines(prev => prev.map(l => l.id === line.id ? {...l, hours_billed: Number(e.target.value)} : l))} className="border border-gray-600 bg-gray-800 p-2 w-16 rounded" />
              <input type="number" value={line.labor_rate} onChange={e => setLaborLines(prev => prev.map(l => l.id === line.id ? {...l, labor_rate: Number(e.target.value)} : l))} className="border border-gray-600 bg-gray-800 p-2 w-20 rounded" />
              <span className="text-sm w-20 text-right">{formatCurrency(line.hours_billed * line.labor_rate)}</span>
              <button onClick={() => removeLabor(line.id)} className="text-red-500 px-2">X</button>
            </div>
          ))}
          <button onClick={() => setLaborLines(prev => [...prev, { id: crypto.randomUUID(), description: "", hours_billed: 1, labor_rate: DEFAULT_LABOR_RATE }])} className="text-blue-400 text-sm">+ Add Labor</button>
        </div>

        <div>
          <h2 className="font-semibold mb-2">Parts</h2>
          <div className="flex gap-2 mb-3">
            <select onChange={e => { const item = inventory.find(i => i.id === e.target.value); if (item) addFromInventory(item); e.target.value = ""; }} className="border border-gray-600 bg-gray-800 p-2 rounded">
              <option value="">+ From inventory</option>
              {inventory.map(item => <option key={item.id} value={item.id}>{item.description} (${item.sell_price})</option>)}
            </select>
            <button onClick={addManualPart} className="border border-gray-600 px-3 py-2 rounded">+ Manual part</button>
          </div>
          {partsLines.map(line => (
            <div key={line.id} className="flex gap-2 mb-2 items-center">
              <input value={line.description} onChange={e => setPartsLines(prev => prev.map(p => p.id === line.id ? {...p, description: e.target.value} : p))} placeholder="Description" className="border border-gray-600 bg-gray-800 p-2 flex-1 rounded" />
              <input type="number" value={line.quantity} onChange={e => setPartsLines(prev => prev.map(p => p.id === line.id ? {...p, quantity: Number(e.target.value)} : p))} className="border border-gray-600 bg-gray-800 p-2 w-14 rounded" />
              <input type="number" step="0.01" value={line.cost_price} onChange={e => setPartsLines(prev => prev.map(p => p.id === line.id ? {...p, cost_price: Number(e.target.value)} : p))} className="border border-gray-600 bg-gray-800 p-2 w-20 rounded" />
              <input type="number" step="0.01" value={line.sell_price} onChange={e => setPartsLines(prev => prev.map(p => p.id === line.id ? {...p, sell_price: Number(e.target.value)} : p))} className="border border-gray-600 bg-gray-800 p-2 w-20 rounded" />
              <span className="text-sm w-20 text-right">{formatCurrency(line.quantity * line.sell_price)}</span>
              <button onClick={() => removePart(line.id)} className="text-red-500 px-2">X</button>
            </div>
          ))}
        </div>

        <div className="bg-gray-950 border border-gray-700 p-4 rounded space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={includeFees} onChange={e => setIncludeFees(e.target.checked)} id="includeFees" />
            <label htmlFor="includeFees">Include Hazmat & Shop Supply fees</label>
          </div>
          <div className="flex justify-between"><span>Labor</span><span>{formatCurrency(totals.laborTotal)}</span></div>
          <div className="flex justify-between"><span>Parts</span><span>{formatCurrency(totals.partsTotal)}</span></div>
          {includeFees && (
            <>
              <div className="flex justify-between text-sm text-gray-400"><span>Hazmat (max $20)</span><span>{formatCurrency(fees.hazmat)}</span></div>
              <div className="flex justify-between text-sm text-gray-400"><span>Shop Supply (max $25)</span><span>{formatCurrency(fees.shopSupply)}</span></div>
            </>
          )}
          <div className="flex justify-between border-t border-gray-700 pt-2 mt-2"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
          <div className="flex justify-between items-center">
            <span>Discount</span>
            <input type="number" step="0.01" value={discount} onChange={e => setDiscount(Number(e.target.value))} className="w-24 text-right bg-gray-800 border border-gray-600 rounded px-2 py-1" />
          </div>
          <div className="flex justify-between text-xl font-bold border-t border-gray-700 pt-2 mt-2"><span>Total</span><span>{formatCurrency(finalTotal)}</span></div>
          <div className="flex justify-between text-emerald-400"><span>Profit</span><span>{formatCurrency(totals.grossProfit - discountAmount)}</span></div>
        </div>
      </div>
    </div>
  );
}
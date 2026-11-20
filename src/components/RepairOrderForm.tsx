"use client";

import { useState, useMemo, useEffect } from "react";
import {
  LaborLine,
  PartsLine,
  ROStatus,
  Customer,
  Vehicle,
} from "../types/shop";
import {
  calculateROTotals,
  formatCurrency,
  generateRONumber,
} from "../lib/calculations";
import {
  createRepairOrder,
  getCustomers,
  getVehicles,
  createCustomer,
  createVehicle,
} from "../lib/api";
import { isSupabaseConfigured } from "../lib/supabase";

const DEFAULT_LABOR_RATE = 150;

const STATUS_OPTIONS: { value: ROStatus; label: string }[] = [
  { value: "estimate", label: "Estimate" },
  { value: "authorized", label: "Authorized" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "invoiced", label: "Invoiced" },
];

export default function RepairOrderForm() {
  const [status, setStatus] = useState<ROStatus>("estimate");
  const [mileageIn, setMileageIn] = useState("");
  const [customerConcern, setCustomerConcern] = useState("");
  const [techNotes, setTechNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newVehicleYear, setNewVehicleYear] = useState("");
  const [newVehicleMake, setNewVehicleMake] = useState("");
  const [newVehicleModel, setNewVehicleModel] = useState("");
  const [newVehicleVin, setNewVehicleVin] = useState("");
  const [newVehiclePlate, setNewVehiclePlate] = useState("");
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [showNewVehicle, setShowNewVehicle] = useState(false);
  const [decoding, setDecoding] = useState(false);
  const [decodedInfo, setDecodedInfo] = useState<{
    year: string;
    make: string;
    model: string;
    vin: string;
  } | null>(null);

  const [laborLines, setLaborLines] = useState<LaborLine[]>([
    {
      id: crypto.randomUUID(),
      description: "",
      hours_billed: 1,
      labor_rate: DEFAULT_LABOR_RATE,
    },
  ]);

  const [partsLines, setPartsLines] = useState<PartsLine[]>([
    {
      id: crypto.randomUUID(),
      description: "",
      quantity: 1,
      cost_price: 0,
      sell_price: 0,
    },
  ]);

  const totals = useMemo(
    () => calculateROTotals(laborLines, partsLines),
    [laborLines, partsLines]
  );

  useEffect(() => {
    getCustomers()
      .then(setCustomers)
      .catch((err) => console.error("Failed to load customers", err));
  }, []);

  useEffect(() => {
    if (selectedCustomerId) {
      getVehicles(selectedCustomerId)
        .then(setVehicles)
        .catch((err) => console.error("Failed to load vehicles", err));
    } else {
      setVehicles([]);
      setSelectedVehicleId("");
    }
  }, [selectedCustomerId]);

  const updateLabor = (id: string, field: keyof LaborLine, value: any) => {
    setLaborLines((prev) =>
      prev.map((line) => (line.id === id ? { ...line, [field]: value } : line))
    );
  };

  const addLaborLine = () => {
    setLaborLines((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        description: "",
        hours_billed: 1,
        labor_rate: DEFAULT_LABOR_RATE,
      },
    ]);
  };

  const removeLaborLine = (id: string) => {
    if (laborLines.length <= 1) return;
    setLaborLines((prev) => prev.filter((l) => l.id !== id));
  };

  const updateParts = (id: string, field: keyof PartsLine, value: any) => {
    setPartsLines((prev) =>
      prev.map((line) => (line.id === id ? { ...line, [field]: value } : line))
    );
  };

  const addPartsLine = () => {
    setPartsLines((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        description: "",
        quantity: 1,
        cost_price: 0,
        sell_price: 0,
      },
    ]);
  };

  const removePartsLine = (id: string) => {
    if (partsLines.length <= 1) return;
    setPartsLines((prev) => prev.filter((p) => p.id !== id));
  };

  const handleCreateCustomer = async () => {
    if (!newCustomerName.trim()) return;
    try {
      const c = await createCustomer({ name: newCustomerName.trim() });
      setCustomers((prev) => [...prev, c]);
      setSelectedCustomerId(c.id);
      setNewCustomerName("");
      setShowNewCustomer(false);
    } catch (err) {
      alert("Could not create customer: " + (err as Error).message);
    }
  };

  const decodeVin = async () => {
    if (newVehicleVin.length !== 17) return;
    setDecoding(true);
    setDecodedInfo(null);
    try {
      const res = await fetch(
        `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${newVehicleVin}?format=json`
      );
      const data = await res.json();
      const result = data.Results?.[0];
      if (result && result.Make) {
        const year = result.ModelYear || "";
        const make = result.Make || "";
        const model = result.Model || "";
        setNewVehicleYear(year);
        setNewVehicleMake(make);
        setNewVehicleModel(model);
        setDecodedInfo({ year, make, model, vin: newVehicleVin });
      } else {
        alert("Could not decode this VIN. Please check it and try again.");
      }
    } catch (err) {
      alert("Error decoding VIN. Check your internet connection.");
    } finally {
      setDecoding(false);
    }
  };

  const handleCreateVehicle = async () => {
    if (!selectedCustomerId || !newVehicleMake.trim()) return;
    try {
      const v = await createVehicle({
        customer_id: selectedCustomerId,
        year: newVehicleYear ? Number(newVehicleYear) : undefined,
        make: newVehicleMake.trim(),
        model: newVehicleModel.trim() || undefined,
        vin: newVehicleVin || undefined,
        license_plate: newVehiclePlate || undefined,
      });
      setVehicles((prev) => [...prev, v]);
      setSelectedVehicleId(v.id);
      setNewVehicleYear("");
      setNewVehicleMake("");
      setNewVehicleModel("");
      setNewVehicleVin("");
      setNewVehiclePlate("");
      setDecodedInfo(null);
      setShowNewVehicle(false);
    } catch (err) {
      alert("Could not create vehicle: " + (err as Error).message);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const id = await createRepairOrder({
        customer_id: selectedCustomerId || undefined,
        vehicle_id: selectedVehicleId || undefined,
        status,
        mileage_in: mileageIn ? Number(mileageIn) : undefined,
        customer_concern: customerConcern || undefined,
        tech_notes: techNotes || undefined,
        labor_lines: laborLines.filter((l) => l.description.trim()),
        parts_lines: partsLines.filter((p) => p.description.trim()),
      });

      setMessage(
        isSupabaseConfigured
          ? `Repair Order saved successfully (ID: ${id.slice(0, 8)}…)`
          : "Demo mode: RO would be saved once Supabase is connected."
      );
    } catch (err) {
      setMessage("Error saving: " + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Repair Order</h1>
          <p className="text-sm text-gray-500">
            {isSupabaseConfigured
              ? "Connected to Supabase — data will be saved"
              : "Demo mode — add Supabase keys to save data"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ROStatus)}
            className="border rounded-lg px-3 py-2 text-sm font-medium bg-white"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg font-medium"
          >
            {saving ? "Saving…" : "Save RO"}
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg text-sm ${
            message.startsWith("Error")
              ? "bg-red-50 text-red-700"
              : "bg-green-50 text-green-700"
          }`}
        >
          {message}
        </div>
      )}

      <div className="bg-white border rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-gray-800">Customer & Vehicle</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer
            </label>
            <div className="flex gap-2">
              <select
                value={selectedCustomerId}
                onChange={(e) => {
                  setSelectedCustomerId(e.target.value);
                  setShowNewCustomer(false);
                }}
                className="flex-1 border rounded-lg px-3 py-2 bg-white"
              >
                <option value="">Select customer…</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowNewCustomer(!showNewCustomer)}
                className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50"
              >
                + New
              </button>
            </div>
            {showNewCustomer && (
              <div className="mt-2 flex gap-2">
                <input
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="Customer name"
                  className="flex-1 border rounded-lg px-3 py-2 text-sm"
                />
                <button
                  onClick={handleCreateCustomer}
                  className="px-3 py-2 bg-gray-800 text-white rounded-lg text-sm"
                >
                  Add
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vehicle
            </label>
            <div className="flex gap-2">
              <select
                value={selectedVehicleId}
                onChange={(e) => {
                  setSelectedVehicleId(e.target.value);
                  setShowNewVehicle(false);
                }}
                disabled={!selectedCustomerId}
                className="flex-1 border rounded-lg px-3 py-2 bg-white disabled:bg-gray-100"
              >
                <option value="">Select vehicle…</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {[v.year, v.make, v.model].filter(Boolean).join(" ")}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowNewVehicle(!showNewVehicle)}
                disabled={!selectedCustomerId}
                className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50 disabled:opacity-40"
              >
                + New
              </button>
            </div>

            {showNewVehicle && (
              <div className="mt-3 space-y-3 border rounded-lg p-4 bg-gray-50">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={newVehicleYear}
                    onChange={(e) => setNewVehicleYear(e.target.value)}
                    placeholder="Year"
                    className="border rounded-lg px-3 py-2 text-sm"
                  />
                  <input
                    value={newVehicleMake}
                    onChange={(e) => setNewVehicleMake(e.target.value)}
                    placeholder="Make"
                    className="border rounded-lg px-3 py-2 text-sm"
                  />
                  <input
                    value={newVehicleModel}
                    onChange={(e) => setNewVehicleModel(e.target.value)}
                    placeholder="Model"
                    className="border rounded-lg px-3 py-2 text-sm col-span-2"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600">VIN</label>
                  <div className="flex gap-2 mt-1">
                    <input
                      value={newVehicleVin}
                      onChange={(e) => setNewVehicleVin(e.target.value.toUpperCase())}
                      placeholder="Enter 17-digit VIN"
                      maxLength={17}
                      className="flex-1 border rounded-lg px-3 py-2 text-sm font-mono tracking-wider"
                    />
                    <button
                      type="button"
                      onClick={decodeVin}
                      disabled={newVehicleVin.length !== 17 || decoding}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 whitespace-nowrap"
                    >
                      {decoding ? "Decoding…" : "Decode VIN"}
                    </button>
                  </div>
                </div>

                {decodedInfo && (
                  <div className="bg-white border border-green-200 rounded-lg p-3 text-sm">
                    <div className="font-medium text-green-800 mb-1">Decoded Vehicle</div>
                    <div className="text-gray-700 font-medium">
                      {decodedInfo.year} {decodedInfo.make} {decodedInfo.model}
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      VIN: {decodedInfo.vin.slice(0, 9)}
                      <span className="text-lg font-bold text-gray-900 tracking-widest ml-1">
                        {decodedInfo.vin.slice(9)}
                      </span>
                    </div>
                  </div>
                )}

                <input
                  value={newVehiclePlate}
                  onChange={(e) => setNewVehiclePlate(e.target.value.toUpperCase())}
                  placeholder="License plate (optional)"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />

                <button
                  onClick={handleCreateVehicle}
                  className="w-full py-2 bg-gray-900 text-white rounded-lg text-sm font-medium"
                >
                  Save Vehicle
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mileage In
            </label>
            <input
              type="number"
              value={mileageIn}
              onChange={(e) => setMileageIn(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Concern
            </label>
            <input
              value={customerConcern}
              onChange={(e) => setCustomerConcern(e.target.value)}
              placeholder="Brakes squeaking, wants pads and rotors"
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Labor</h2>
          <button
            onClick={addLaborLine}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            + Add Labor
          </button>
        </div>
        <div className="p-4 space-y-3">
          {laborLines.map((line) => (
            <div key={line.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
              <div className="sm:col-span-5">
                <label className="text-xs text-gray-500">Description</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Front brake pads & rotors"
                  value={line.description}
                  onChange={(e) =>
                    updateLabor(line.id, "description", e.target.value)
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-gray-500">Hours</label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full border rounded-lg px-2 py-2 text-sm"
                  value={line.hours_billed}
                  onChange={(e) =>
                    updateLabor(line.id, "hours_billed", Number(e.target.value))
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-gray-500">Rate $</label>
                <input
                  type="number"
                  className="w-full border rounded-lg px-2 py-2 text-sm"
                  value={line.labor_rate}
                  onChange={(e) =>
                    updateLabor(line.id, "labor_rate", Number(e.target.value))
                  }
                />
              </div>
              <div className="sm:col-span-2 text-right font-medium text-sm pb-2">
                {formatCurrency(line.hours_billed * line.labor_rate)}
              </div>
              <button
                onClick={() => removeLaborLine(line.id)}
                className="sm:col-span-1 text-red-500 hover:text-red-700 text-sm pb-2"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Parts</h2>
          <button
            onClick={addPartsLine}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            + Add Part
          </button>
        </div>
        <div className="p-4 space-y-3">
          {partsLines.map((line) => (
            <div key={line.id} className="grid grid-cols-2 sm:grid-cols-12 gap-2 items-end">
              <div className="sm:col-span-2">
                <label className="text-xs text-gray-500">Part #</label>
                <input
                  className="w-full border rounded-lg px-2 py-2 text-sm"
                  value={line.part_number || ""}
                  onChange={(e) =>
                    updateParts(line.id, "part_number", e.target.value)
                  }
                />
              </div>
              <div className="sm:col-span-3">
                <label className="text-xs text-gray-500">Description</label>
                <input
                  className="w-full border rounded-lg px-2 py-2 text-sm"
                  value={line.description}
                  onChange={(e) =>
                    updateParts(line.id, "description", e.target.value)
                  }
                />
              </div>
              <div className="sm:col-span-1">
                <label className="text-xs text-gray-500">Qty</label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full border rounded-lg px-2 py-2 text-sm"
                  value={line.quantity}
                  onChange={(e) =>
                    updateParts(line.id, "quantity", Number(e.target.value))
                  }
                />
              </div>
              <div className="sm:col-span-1">
                <label className="text-xs text-gray-500">Cost</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full border rounded-lg px-2 py-2 text-sm"
                  value={line.cost_price}
                  onChange={(e) =>
                    updateParts(line.id, "cost_price", Number(e.target.value))
                  }
                />
              </div>
              <div className="sm:col-span-1">
                <label className="text-xs text-gray-500">Sell</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full border rounded-lg px-2 py-2 text-sm"
                  value={line.sell_price}
                  onChange={(e) =>
                    updateParts(line.id, "sell_price", Number(e.target.value))
                  }
                />
              </div>
              <div className="sm:col-span-2 text-right font-medium text-sm pb-2">
                {formatCurrency(line.quantity * line.sell_price)}
              </div>
              <button
                onClick={() => removePartsLine(line.id)}
                className="sm:col-span-1 text-red-500 hover:text-red-700 text-sm pb-2"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 text-white rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Job Metrics (Live)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <div className="text-slate-400 text-sm">Labor Total</div>
            <div className="text-2xl font-bold">
              {formatCurrency(totals.laborTotal)}
            </div>
          </div>
          <div>
            <div className="text-slate-400 text-sm">Parts Total</div>
            <div className="text-2xl font-bold">
              {formatCurrency(totals.partsTotal)}
            </div>
          </div>
          <div>
            <div className="text-slate-400 text-sm">Grand Total</div>
            <div className="text-2xl font-bold text-green-400">
              {formatCurrency(totals.grandTotal)}
            </div>
          </div>
          <div>
            <div className="text-slate-400 text-sm">Gross Profit</div>
            <div className="text-2xl font-bold text-emerald-400">
              {formatCurrency(totals.grossProfit)}
            </div>
            <div className="text-sm text-slate-400">
              {totals.grossProfitPercent.toFixed(1)}%
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-700 grid grid-cols-2 md:grid-cols-3 gap-6">
          <div>
            <div className="text-slate-400 text-sm">Hours Billed</div>
            <div className="text-xl font-semibold">
              {totals.totalHoursBilled.toFixed(1)}
            </div>
          </div>
          <div>
            <div className="text-slate-400 text-sm">Gross Profit / Hour</div>
            <div className="text-xl font-semibold text-emerald-400">
              {formatCurrency(totals.grossProfitPerHour)}
            </div>
          </div>
          <div>
            <div className="text-slate-400 text-sm">Effective Labor Rate</div>
            <div className="text-xl font-semibold text-blue-400">
              {formatCurrency(totals.effectiveLaborRate)}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-5">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tech Notes
        </label>
        <textarea
          value={techNotes}
          onChange={(e) => setTechNotes(e.target.value)}
          rows={3}
          className="w-full border rounded-lg px-3 py-2"
          placeholder="Findings, recommendations, parts used from stock…"
        />
      </div>
    </div>
  );
}
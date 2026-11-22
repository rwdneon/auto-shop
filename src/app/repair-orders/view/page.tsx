"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getRepairOrder, updateRepairOrderStatus, updateRepairOrder } from "../../../lib/api";
import { formatCurrency, calculateROTotals } from "../../../lib/calculations";

function ViewContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [ro, setRo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [concern, setConcern] = useState("");
  const [notes, setNotes] = useState("");
  const [labor, setLabor] = useState([]);
  const [parts, setParts] = useState([]);
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    if (id) {
      getRepairOrder(id).then((data) => {
        setRo(data);
        setConcern(data.customer_concern || "");
        setNotes(data.tech_notes || "");
        setLabor(data.labor_lines || []);
        setParts(data.parts_lines || []);
        setDiscount(data.discount || 0);
      }).finally(() => setLoading(false));
    }
  }, [id]);

  const changeStatus = async (status) => {
    await updateRepairOrderStatus(id, status);
    setRo(await getRepairOrder(id));
  };

  const saveEdit = async () => {
    await updateRepairOrder(id, {
      customer_concern: concern,
      tech_notes: notes,
      labor_lines: labor,
      parts_lines: parts,
      discount: discount,
    });
    const updated = await getRepairOrder(id);
    setRo(updated);
    setLabor(updated.labor_lines || []);
    setParts(updated.parts_lines || []);
    setEditing(false);
  };

  const updateLaborLine = (index, field, value) => {
    setLabor(prev => prev.map((l, i) => i === index ? { ...l, [field]: value } : l));
  };

  const updatePartLine = (index, field, value) => {
    setParts(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  const addLabor = () => setLabor(prev => [...prev, { description: "", hours_billed: 1, labor_rate: 150 }]);
  const addPart = () => setParts(prev => [...prev, { description: "", quantity: 1, cost_price: 0, sell_price: 0 }]);
  const removeLabor = (index) => setLabor(prev => prev.filter((_, i) => i !== index));
  const removePart = (index) => setParts(prev => prev.filter((_, i) => i !== index));

  if (loading) return <div className="p-8 text-center text-white">Loading...</div>;
  if (!ro) return <div className="p-8 text-center text-white">Not found</div>;

  const totals = calculateROTotals(labor, parts);
  const subtotal = totals.grandTotal;
  const discountAmount = discount || 0;
  const finalTotal = Math.max(0, subtotal - discountAmount);
  const vehicle = [ro.vehicles?.year, ro.vehicles?.make, ro.vehicles?.model].filter(Boolean).join(" ");

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold">{ro.ro_number}</h1>
        <p>{ro.customers?.name || "No customer"}</p>
        <p>{vehicle}</p>
        <p>VIN: {ro.vehicles?.vin || "None"}</p>
        <p className="mt-2">Status: {ro.status}</p>

        <div className="flex gap-2 mt-3 no-print">
          <button onClick={() => changeStatus("authorized")} className="px-3 py-1 bg-blue-100 rounded text-sm">Authorize</button>
          <button onClick={() => changeStatus("in_progress")} className="px-3 py-1 bg-green-100 rounded text-sm">In Progress</button>
          <button onClick={() => changeStatus("completed")} className="px-3 py-1 bg-gray-100 rounded text-sm">Complete</button>
          <button onClick={() => setEditing(!editing)} className="px-3 py-1 bg-yellow-100 rounded text-sm">{editing ? "Cancel" : "Edit"}</button>
          <button onClick={() => window.print()} className="px-3 py-1 bg-gray-800 text-white rounded text-sm">Print</button>
        </div>

        {editing && (
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-sm font-medium">Customer Concern</label>
              <textarea value={concern} onChange={e => setConcern(e.target.value)} className="border p-2 w-full rounded" rows={2} />
            </div>
            <div>
              <label className="text-sm font-medium">Tech Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} className="border p-2 w-full rounded" rows={2} />
            </div>
            <div>
              <label className="text-sm font-medium">Discount ($)</label>
              <input type="number" step="0.01" value={discount} onChange={e => setDiscount(Number(e.target.value))} className="border p-2 w-32 rounded" />
            </div>
          </div>
        )}

        {/* Labor Table */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-semibold">Labor</h2>
            {editing && <button onClick={addLabor} className="text-blue-600 text-sm">+ Add</button>}
          </div>
          <div className="border rounded overflow-hidden">
            <div className="grid grid-cols-12 bg-gray-100 text-sm font-medium px-3 py-2">
              <div className="col-span-6">Description</div>
              <div className="col-span-2 text-right">Hours</div>
              <div className="col-span-2 text-right">Rate</div>
              <div className="col-span-2 text-right">Total</div>
            </div>
            {labor.map((line, i) => (
              <div key={i} className="grid grid-cols-12 px-3 py-2 border-t text-sm items-center">
                {editing ? (
                  <>
                    <input value={line.description} onChange={e => updateLaborLine(i, "description", e.target.value)} className="col-span-6 border p-1 rounded" />
                    <input type="number" value={line.hours_billed} onChange={e => updateLaborLine(i, "hours_billed", Number(e.target.value))} className="col-span-2 border p-1 rounded text-right" />
                    <input type="number" value={line.labor_rate} onChange={e => updateLaborLine(i, "labor_rate", Number(e.target.value))} className="col-span-2 border p-1 rounded text-right" />
                    <div className="col-span-1 text-right">{formatCurrency(line.hours_billed * line.labor_rate)}</div>
                    <button onClick={() => removeLabor(i)} className="col-span-1 text-red-600 text-right">X</button>
                  </>
                ) : (
                  <>
                    <div className="col-span-6">{line.description}</div>
                    <div className="col-span-2 text-right">{line.hours_billed}</div>
                    <div className="col-span-2 text-right no-print">{formatCurrency(line.labor_rate)}</div>
                    <div className="col-span-2 text-right no-print">{formatCurrency(line.hours_billed * line.labor_rate)}</div>
                  </>
                )}
              </div>
            ))}
            <div className="grid grid-cols-12 bg-gray-50 px-3 py-2 font-medium border-t">
              <div className="col-span-10 text-right">Labor Total:</div>
              <div className="col-span-2 text-right">{formatCurrency(totals.laborTotal)}</div>
            </div>
          </div>
        </div>

        {/* Parts Table */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-semibold">Parts</h2>
            {editing && <button onClick={addPart} className="text-blue-600 text-sm">+ Add</button>}
          </div>
          <div className="border rounded overflow-hidden">
            <div className="grid grid-cols-12 bg-gray-100 text-sm font-medium px-3 py-2">
              <div className="col-span-5">Description</div>
              <div className="col-span-2 text-right">Qty</div>
              <div className="col-span-2 text-right">Cost</div>
              <div className="col-span-2 text-right">Sell</div>
              <div className="col-span-1 text-right">Total</div>
            </div>
            {parts.map((line, i) => (
              <div key={i} className="grid grid-cols-12 px-3 py-2 border-t text-sm items-center">
                {editing ? (
                  <>
                    <input value={line.description} onChange={e => updatePartLine(i, "description", e.target.value)} className="col-span-5 border p-1 rounded" />
                    <input type="number" value={line.quantity} onChange={e => updatePartLine(i, "quantity", Number(e.target.value))} className="col-span-2 border p-1 rounded text-right" />
                    <input type="number" step="0.01" value={line.cost_price} onChange={e => updatePartLine(i, "cost_price", Number(e.target.value))} className="col-span-2 border p-1 rounded text-right" />
                    <input type="number" step="0.01" value={line.sell_price} onChange={e => updatePartLine(i, "sell_price", Number(e.target.value))} className="col-span-2 border p-1 rounded text-right" />
                    <div className="col-span-1 text-right">{formatCurrency(line.quantity * line.sell_price)}</div>
                  </>
                ) : (
                  <>
                    <div className="col-span-5">{line.description}</div>
                    <div className="col-span-2 text-right">{line.quantity}</div>
                    <div className="col-span-2 text-right no-print">{formatCurrency(line.cost_price)}</div>
                    <div className="col-span-2 text-right no-print">{formatCurrency(line.sell_price)}</div>
                    <div className="col-span-1 text-right no-print">{formatCurrency(line.quantity * line.sell_price)}</div>
                  </>
                )}
              </div>
            ))}
            <div className="grid grid-cols-12 bg-gray-50 px-3 py-2 font-medium border-t">
              <div className="col-span-11 text-right">Parts Total:</div>
              <div className="col-span-1 text-right">{formatCurrency(totals.partsTotal)}</div>
            </div>
          </div>
        </div>

        {editing && (
          <button onClick={saveEdit} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">Save Changes</button>
        )}

        <div className="mt-6 bg-gray-900 text-white p-4 rounded">
          <div className="flex justify-between"><span>Labor Total</span><span>{formatCurrency(totals.laborTotal)}</span></div>
          <div className="flex justify-between"><span>Parts Total</span><span>{formatCurrency(totals.partsTotal)}</span></div>
          <div className="flex justify-between border-t border-gray-700 mt-2 pt-2"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
          {discountAmount > 0 && <div className="flex justify-between"><span>Discount</span><span>-{formatCurrency(discountAmount)}</span></div>}
          <div className="flex justify-between text-xl font-bold mt-1"><span>Total</span><span>{formatCurrency(finalTotal)}</span></div>
          <div className="flex justify-between text-emerald-400"><span>Profit</span><span>{formatCurrency(totals.grossProfit - discountAmount)}</span></div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <ViewContent />
    </Suspense>
  );
}
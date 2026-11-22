"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getRepairOrders, deleteRepairOrder } from "../../../lib/api";

export default function RepairOrdersListPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRepairOrders().then(setOrders).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id, roNumber) => {
    if (confirm("Delete " + roNumber + "?")) {
      await deleteRepairOrder(id);
      getRepairOrders().then(setOrders);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Repair Orders</h1>
      {loading && <div>Loading</div>}
      {orders.map((ro) => {
        const vehicle = [ro.vehicles?.year, ro.vehicles?.make, ro.vehicles?.model].filter(Boolean).join(" ");
        const vin = ro.vehicles?.vin || "";
        return (
          <div key={ro.id} className="bg-white p-3 mb-2 rounded border flex justify-between">
            <div>
              <div className="font-medium">{ro.ro_number}</div>
              <div className="text-sm text-gray-600">
                {ro.customers?.name || "No customer"}
                {vehicle && " · " + vehicle}
                {vin && " (" + vin + ")"}
              </div>
            </div>
            <div>
              <Link href={"/repair-orders/view?id=" + ro.id} className="text-blue-600 mr-3">View</Link>
              <button onClick={() => handleDelete(ro.id, ro.ro_number)} className="text-red-600">Delete</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
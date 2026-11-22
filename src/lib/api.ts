import { supabase, isSupabaseConfigured } from "./supabase";
import { generateRONumber } from "./calculations";

// ==================== CUSTOMERS ====================
export async function getCustomers() {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase.from("customers").select("*").order("name");
  if (error) throw error;
  return data || [];
}

export async function createCustomer(customer: { name: string; phone?: string; email?: string }) {
  if (!isSupabaseConfigured || !supabase) return { id: "demo", ...customer };
  const { data, error } = await supabase.from("customers").insert(customer).select().single();
  if (error) throw error;
  return data;
}

export async function updateCustomer(id: string, updates: { name?: string; phone?: string; email?: string }) {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase.from("customers").update(updates).eq("id", id);
  if (error) throw error;
}

export async function deleteCustomer(id: string) {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) throw error;
}

// ==================== VEHICLES ====================
export async function getVehicles(customerId: string) {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase.from("vehicles").select("*").eq("customer_id", customerId);
  if (error) throw error;
  return data || [];
}

export async function createVehicle(vehicle: any) {
  if (!isSupabaseConfigured || !supabase) return { id: "demo", ...vehicle };
  const { data, error } = await supabase.from("vehicles").insert(vehicle).select().single();
  if (error) throw error;
  return data;
}

export async function updateVehicle(id: string, updates: any) {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase.from("vehicles").update(updates).eq("id", id);
  if (error) throw error;
}

export async function deleteVehicle(id: string) {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase.from("vehicles").delete().eq("id", id);
  if (error) throw error;
}

// ==================== REPAIR ORDERS ====================
export async function getRepairOrders() {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from("repair_orders")
    .select("*, customers(name), vehicles(year, make, model, vin)")
    .order("opened_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getRepairOrder(id: string) {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase
    .from("repair_orders")
    .select("*, customers(name), vehicles(year, make, model, vin), labor_lines(*), parts_lines(*)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function createRepairOrder(data: any) {
  if (!isSupabaseConfigured || !supabase) return "demo-id";

  const { count } = await supabase
    .from("repair_orders")
    .select("*", { count: "exact", head: true });

  // Get the highest existing RO number
const { data: existing } = await supabase
  .from("repair_orders")
  .select("ro_number")
  .order("opened_at", { ascending: false })
  .limit(1);

let nextNum = 1;
if (existing && existing.length > 0) {
  const match = existing[0].ro_number?.match(/\d+/);
  if (match) nextNum = parseInt(match[0]) + 1;
}

const roNumber = `RO #${nextNum}`;
  const { data: ro, error } = await supabase
    .from("repair_orders")
    .insert({
      ro_number: roNumber,
      customer_id: data.customer_id || null,
      vehicle_id: data.vehicle_id || null,
      status: data.status || "estimate",
      mileage_in: data.mileage_in || null,
      customer_concern: data.customer_concern || null,
      tech_notes: data.tech_notes || null,
    })
    .select()
    .single();

  if (error) throw error;

  if (data.labor_lines?.length) {
    await supabase.from("labor_lines").insert(
      data.labor_lines.map((l: any) => ({
        repair_order_id: ro.id,
        description: l.description,
        hours_billed: l.hours_billed,
        labor_rate: l.labor_rate,
      }))
    );
  }

  if (data.parts_lines?.length) {
    await supabase.from("parts_lines").insert(
      data.parts_lines.map((p: any) => ({
        repair_order_id: ro.id,
        part_number: p.part_number || null,
        description: p.description,
        quantity: p.quantity,
        cost_price: p.cost_price,
        sell_price: p.sell_price,
      }))
    );
  }

  return ro.id;
}

export async function deleteRepairOrder(id: string) {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase.from("repair_orders").delete().eq("id", id);
  if (error) throw error;
}

export async function updateRepairOrderStatus(id: string, status: string) {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase.from("repair_orders").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function updateRepairOrder(id: string, updates: any) {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase
    .from("repair_orders")
    .update({
      customer_concern: updates.customer_concern || null,
      tech_notes: updates.tech_notes || null,
      mileage_in: updates.mileage_in || null,
    })
    .eq("id", id);
  if (error) throw error;

  await supabase.from("labor_lines").delete().eq("repair_order_id", id);
  if (updates.labor_lines?.length) {
    await supabase.from("labor_lines").insert(
      updates.labor_lines.map((l: any) => ({
        repair_order_id: id,
        description: l.description,
        hours_billed: l.hours_billed,
        labor_rate: l.labor_rate,
      }))
    );
  }

  await supabase.from("parts_lines").delete().eq("repair_order_id", id);
  if (updates.parts_lines?.length) {
    await supabase.from("parts_lines").insert(
      updates.parts_lines.map((p: any) => ({
        repair_order_id: id,
        description: p.description,
        quantity: p.quantity,
        cost_price: p.cost_price,
        sell_price: p.sell_price,
      }))
    );
  }
}

export async function getDashboardStats() {
  if (!isSupabaseConfigured || !supabase) {
    return { openROs: 0, avgROValue: 0, totalGP: 0, avgGPPerHour: 0, recentROs: [] };
  }

  const { data: all } = await supabase
    .from("repair_orders")
    .select("*, customers(name), vehicles(year, make, model), labor_lines(*), parts_lines(*)")
    .order("opened_at", { ascending: false })
    .limit(50);

  const open = (all || []).filter((ro: any) =>
    ["estimate", "authorized", "in_progress"].includes(ro.status)
  );
  const completed = (all || []).filter((ro: any) =>
    ["completed", "invoiced"].includes(ro.status)
  );

  let totalValue = 0;
  let totalGP = 0;
  let totalHours = 0;

  for (const ro of completed) {
    const laborLines = ro.labor_lines || [];
    const laborTotal = laborLines.reduce(
      (s: number, l: any) => s + (Number(l.hours_billed) || 0) * (Number(l.labor_rate) || 0),
      0
    );
    const hours = laborLines.reduce(
      (s: number, l: any) => s + (Number(l.hours_billed) || 0),
      0
    );

    const partsLines = ro.parts_lines || [];
    const partsSell = partsLines.reduce(
      (s: number, p: any) => s + (Number(p.quantity) || 0) * (Number(p.sell_price) || 0),
      0
    );
    const partsCost = partsLines.reduce(
      (s: number, p: any) => s + (Number(p.quantity) || 0) * (Number(p.cost_price) || 0),
      0
    );

    const roValue = laborTotal + partsSell;
    const roGP = laborTotal + (partsSell - partsCost);

    totalValue += roValue;
    totalGP += roGP;
    totalHours += hours;
  }

  const count = completed.length;

  return {
  openROs: open.length,
  avgROValue: count > 0 ? totalValue / count : 0,
  totalGP: totalGP,
  avgGPPerHour: totalHours > 0 ? totalGP / totalHours : 0,
  totalSales: totalValue,
  gpMargin: totalValue > 0 ? (totalGP / totalValue) * 100 : 0,
  recentROs: all || [],
};
}

// ==================== INVENTORY ====================
export async function getInventory() {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase.from("inventory").select("*").order("description");
  if (error) throw error;
  return data || [];
}

export async function upsertInventoryItem(item: any) {
  if (!isSupabaseConfigured || !supabase) return item;
  const { data, error } = await supabase.from("inventory").upsert(item).select().single();
  if (error) throw error;
  return data;
}

export async function deleteInventoryItem(id: string) {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase.from("inventory").delete().eq("id", id);
  if (error) throw error;
}
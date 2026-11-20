import { supabase, isSupabaseConfigured } from "./supabase";
import {
  Customer,
  Vehicle,
  RepairOrder,
  LaborLine,
  PartsLine,
  ROStatus,
} from "@/types/shop";
import { generateRONumber } from "./calculations";

// ==================== CUSTOMERS ====================

export async function getCustomers(): Promise<Customer[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("name");
  if (error) throw error;
  return data || [];
}

export async function createCustomer(
  customer: Omit<Customer, "id">
): Promise<Customer> {
  if (!isSupabaseConfigured) {
    return { id: crypto.randomUUID(), ...customer };
  }
  const { data, error } = await supabase
    .from("customers")
    .insert(customer)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ==================== VEHICLES ====================

export async function getVehicles(customerId?: string): Promise<Vehicle[]> {
  if (!isSupabaseConfigured) return [];
  let query = supabase.from("vehicles").select("*").order("year", { ascending: false });
  if (customerId) query = query.eq("customer_id", customerId);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createVehicle(
  vehicle: Omit<Vehicle, "id">
): Promise<Vehicle> {
  if (!isSupabaseConfigured) {
    return { id: crypto.randomUUID(), ...vehicle };
  }
  const { data, error } = await supabase
    .from("vehicles")
    .insert(vehicle)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ==================== REPAIR ORDERS ====================

export async function getRepairOrders(status?: ROStatus): Promise<any[]> {
  if (!isSupabaseConfigured) return [];
  let query = supabase
    .from("repair_orders")
    .select(`
      *,
      customers (id, name, phone),
      vehicles (id, year, make, model, vin, license_plate)
    `)
    .order("opened_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getRepairOrder(id: string): Promise<any | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from("repair_orders")
    .select(`
      *,
      customers (*),
      vehicles (*),
      labor_lines (*),
      parts_lines (*)
    `)
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function createRepairOrder(payload: {
  customer_id?: string;
  vehicle_id?: string;
  status: ROStatus;
  mileage_in?: number;
  customer_concern?: string;
  tech_notes?: string;
  labor_lines: Omit<LaborLine, "id" | "repair_order_id">[];
  parts_lines: Omit<PartsLine, "id" | "repair_order_id">[];
}): Promise<string> {
  if (!isSupabaseConfigured) {
    console.log("Demo mode - would save:", payload);
    return crypto.randomUUID();
  }

  // Create the RO
  const { data: ro, error: roError } = await supabase
    .from("repair_orders")
    .insert({
      ro_number: generateRONumber(),
      customer_id: payload.customer_id || null,
      vehicle_id: payload.vehicle_id || null,
      status: payload.status,
      mileage_in: payload.mileage_in || null,
      customer_concern: payload.customer_concern || null,
      tech_notes: payload.tech_notes || null,
    })
    .select()
    .single();

  if (roError) throw roError;

  // Labor lines
  if (payload.labor_lines.length > 0) {
    const laborPayload = payload.labor_lines.map((l, i) => ({
      repair_order_id: ro.id,
      description: l.description,
      hours_billed: l.hours_billed,
      hours_actual: l.hours_actual || null,
      labor_rate: l.labor_rate,
      cost: l.cost || 0,
      sort_order: i,
    }));
    const { error } = await supabase.from("labor_lines").insert(laborPayload);
    if (error) throw error;
  }

  // Parts lines
  if (payload.parts_lines.length > 0) {
    const partsPayload = payload.parts_lines.map((p, i) => ({
      repair_order_id: ro.id,
      part_number: p.part_number || null,
      description: p.description,
      quantity: p.quantity,
      cost_price: p.cost_price,
      sell_price: p.sell_price,
      vendor: p.vendor || null,
      sort_order: i,
    }));
    const { error } = await supabase.from("parts_lines").insert(partsPayload);
    if (error) throw error;
  }

  return ro.id;
}

// ==================== INVENTORY ====================

export async function getInventory(): Promise<any[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from("inventory")
    .select("*")
    .order("description");
  if (error) throw error;
  return data || [];
}

export async function upsertInventoryItem(item: {
  id?: string;
  part_number?: string;
  description: string;
  quantity_on_hand: number;
  min_quantity?: number;
  cost_price: number;
  sell_price: number;
  vendor?: string;
  location?: string;
}): Promise<any> {
  if (!isSupabaseConfigured) {
    return { id: crypto.randomUUID(), ...item };
  }

  if (item.id) {
    const { data, error } = await supabase
      .from("inventory")
      .update(item)
      .eq("id", item.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from("inventory")
      .insert(item)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

// ==================== DASHBOARD STATS ====================

export async function getDashboardStats() {
  if (!isSupabaseConfigured) {
    return {
      openROs: 0,
      avgROValue: 0,
      avgGP: 0,
      avgGPPerHour: 0,
      recentROs: [],
    };
  }

  // Open ROs
  const { data: openData } = await supabase
    .from("repair_orders")
    .select("id", { count: "exact" })
    .in("status", ["estimate", "authorized", "in_progress"]);

  // Use the view for averages (last 30 days completed)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: summary } = await supabase
    .from("repair_order_summary")
    .select("*")
    .gte("opened_at", thirtyDaysAgo.toISOString())
    .in("status", ["completed", "invoiced"]);

  const count = summary?.length || 0;
  const avgROValue =
    count > 0
      ? summary!.reduce((s, r) => s + Number(r.grand_total), 0) / count
      : 0;
  const avgGP =
    count > 0
      ? summary!.reduce((s, r) => s + Number(r.gross_profit), 0) / count
      : 0;
  const totalHours = summary?.reduce(
    (s, r) => s + Number(r.total_hours_billed),
    0
  ) || 0;
  const totalGP = summary?.reduce((s, r) => s + Number(r.gross_profit), 0) || 0;
  const avgGPPerHour = totalHours > 0 ? totalGP / totalHours : 0;

  // Recent open ROs
  const { data: recent } = await supabase
    .from("repair_orders")
    .select(`
      id, ro_number, status, opened_at,
      customers (name),
      vehicles (year, make, model)
    `)
    .in("status", ["estimate", "authorized", "in_progress"])
    .order("opened_at", { ascending: false })
    .limit(8);

  return {
    openROs: openData?.length || 0,
    avgROValue: Math.round(avgROValue * 100) / 100,
    avgGP: Math.round(avgGP * 100) / 100,
    avgGPPerHour: Math.round(avgGPPerHour * 100) / 100,
    recentROs: recent || [],
  };
}

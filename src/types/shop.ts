export type ROStatus =
  | "estimate"
  | "authorized"
  | "in_progress"
  | "completed"
  | "invoiced"
  | "cancelled";

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

export interface Vehicle {
  id: string;
  customer_id: string;
  year?: number;
  make?: string;
  model?: string;
  vin?: string;
  license_plate?: string;
  color?: string;
  mileage?: number;
  notes?: string;
}

export interface LaborLine {
  id: string;
  repair_order_id?: string;
  description: string;
  hours_billed: number;
  hours_actual?: number;
  labor_rate: number;
  cost?: number;
  sort_order?: number;
}

export interface PartsLine {
  id: string;
  repair_order_id?: string;
  part_number?: string;
  description: string;
  quantity: number;
  cost_price: number;
  sell_price: number;
  vendor?: string;
  sort_order?: number;
}

export interface RepairOrder {
  id: string;
  ro_number: string;
  customer_id?: string;
  vehicle_id?: string;
  status: ROStatus;
  opened_at: string;
  closed_at?: string;
  mileage_in?: number;
  mileage_out?: number;
  customer_concern?: string;
  tech_notes?: string;
  // Joined data
  customer?: Customer;
  vehicle?: Vehicle;
  labor_lines?: LaborLine[];
  parts_lines?: PartsLine[];
}

export interface ROTotals {
  laborTotal: number;
  partsTotal: number;
  partsCost: number;
  grandTotal: number;
  grossProfit: number;
  grossProfitPercent: number;
  totalHoursBilled: number;
  grossProfitPerHour: number;
  effectiveLaborRate: number;
}

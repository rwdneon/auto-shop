import { LaborLine, PartsLine, ROTotals } from "../types/shop";

export function calculateROTotals(
  laborLines: LaborLine[] = [],
  partsLines: PartsLine[] = []
): ROTotals {
  const laborTotal = laborLines.reduce(
    (sum, line) => sum + line.hours_billed * line.labor_rate,
    0
  );

  const totalHoursBilled = laborLines.reduce(
    (sum, line) => sum + line.hours_billed,
    0
  );

  const partsTotal = partsLines.reduce(
    (sum, line) => sum + line.quantity * line.sell_price,
    0
  );

  const partsCost = partsLines.reduce(
    (sum, line) => sum + line.quantity * line.cost_price,
    0
  );

  const grandTotal = laborTotal + partsTotal;
  const grossProfit = grandTotal - partsCost; // Labor cost is usually just the tech wage, but for simplicity we treat labor as pure profit for now (common in shop software)

  // More accurate GP would subtract tech wages, but most shops track "shop gross profit" this way first
  const grossProfitPercent = grandTotal > 0 ? (grossProfit / grandTotal) * 100 : 0;

  const grossProfitPerHour =
    totalHoursBilled > 0 ? grossProfit / totalHoursBilled : 0;

  // Effective Labor Rate = (Labor Total + Parts Gross Profit) / Hours
  // or simply Labor Total / Hours when parts are separate
  const partsGross = partsTotal - partsCost;
  const effectiveLaborRate =
    totalHoursBilled > 0
      ? (laborTotal + partsGross) / totalHoursBilled
      : 0;

  return {
    laborTotal: round(laborTotal),
    partsTotal: round(partsTotal),
    partsCost: round(partsCost),
    grandTotal: round(grandTotal),
    grossProfit: round(grossProfit),
    grossProfitPercent: round(grossProfitPercent),
    totalHoursBilled: round(totalHoursBilled),
    grossProfitPerHour: round(grossProfitPerHour),
    effectiveLaborRate: round(effectiveLaborRate),
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export function generateRONumber(existingCount: number = 0): string {
  const next = existingCount + 1;
  return `RO #${next}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}
export function calculateFees(grandTotal: number) {
  const hazmat = Math.min(grandTotal * 0.01, 20);
  const shopSupply = Math.min(grandTotal * 0.01, 25);
  return { hazmat, shopSupply, totalFees: hazmat + shopSupply };
}
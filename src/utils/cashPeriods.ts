export type CurrencyTotals = { fc: number; usd: number };

export function emptyTotals(): CurrencyTotals {
  return { fc: 0, usd: 0 };
}

export function formatTotals(totals: CurrencyTotals): string {
  const fc = totals.fc.toLocaleString('fr-FR', { minimumFractionDigits: 2 });
  const usd = totals.usd.toLocaleString('fr-FR', { minimumFractionDigits: 2 });
  if (totals.fc > 0 && totals.usd > 0) return `${fc} FC + ${usd} $`;
  if (totals.fc > 0) return `${fc} FC`;
  return `${usd} $`;
}

export function formatUsd(amount: number): string {
  return `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} $`;
}

export function startOfLocalDay(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function endOfLocalDay(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

export function startOfWeek(date = new Date()): Date {
  const day = startOfLocalDay(date);
  const weekday = day.getDay();
  const mondayOffset = weekday === 0 ? 6 : weekday - 1;
  day.setDate(day.getDate() - mondayOffset);
  return day;
}

export function isInPeriod(value: string | Date | null | undefined, from: Date, to: Date): boolean {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date >= from && date <= to;
}

export function currencyOfItemType(type: string | null | undefined): 'FC' | '$' {
  const raw = type || '';
  const [base, currency] = raw.split(':');
  if (currency === 'FC' || currency === '$') return currency;
  return base === 'consultation' ? 'FC' : '$';
}

export function formatMoney(amount: number, currency: 'FC' | '$'): string {
  const value = amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 });
  return currency === 'FC' ? `${value} FC` : `${value} $`;
}

export function addInvoiceMoney(totals: CurrencyTotals, invoice: { items?: Array<{ type?: string; totalPrice?: number }> }) {
  for (const item of invoice.items || []) {
    const amount = Number(item.totalPrice) || 0;
    if (currencyOfItemType(item.type) === 'FC') totals.fc += amount;
    else totals.usd += amount;
  }
}

export function invoiceAmountLabel(invoice: { items?: Array<{ type?: string; totalPrice?: number }> }): string {
  const totals = emptyTotals();
  addInvoiceMoney(totals, invoice);
  return formatTotals(totals);
}

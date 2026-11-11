import {
  addInvoiceMoney,
  emptyTotals,
  endOfLocalDay,
  formatTotals,
  formatUsd,
  isInPeriod,
  startOfLocalDay,
  startOfWeek,
} from '../utils/cashPeriods';

type Invoice = {
  id?: number;
  invoiceNumber?: string;
  paidDate?: string;
  createdAt?: string;
  patient?: { firstName?: string; lastName?: string };
  items?: Array<{ type?: string; totalPrice?: number }>;
};

type Supply = {
  id?: number;
  date?: string;
  requestNumber?: string;
  totalAmount?: number;
  items?: Array<{ designation?: string }>;
};

type Movement = {
  key: string;
  date: string;
  reference: string;
  detail: string;
  amount: string;
};

function patientName(invoice: Invoice): string {
  const first = invoice.patient?.firstName || '';
  const last = invoice.patient?.lastName || '';
  return `${first} ${last}`.trim();
}

function periodTotals(invoices: Invoice[], supplies: Supply[], from: Date, to: Date) {
  const entries = emptyTotals();
  let exits = 0;
  for (const invoice of invoices) {
    const date = invoice.paidDate || invoice.createdAt;
    if (!isInPeriod(date, from, to)) continue;
    addInvoiceMoney(entries, invoice);
  }
  for (const supply of supplies) {
    if (!isInPeriod(supply.date, from, to)) continue;
    exits += Number(supply.totalAmount) || 0;
  }
  return { entries, exits };
}

export default function CashPeriodSummary({
  invoices,
  supplies,
  showLists = false,
}: {
  invoices: Invoice[];
  supplies: Supply[];
  showLists?: boolean;
}) {
  const todayFrom = startOfLocalDay();
  const todayTo = endOfLocalDay();
  const weekFrom = startOfWeek();
  const today = periodTotals(invoices, supplies, todayFrom, todayTo);
  const week = periodTotals(invoices, supplies, weekFrom, todayTo);

  const entryRows: Movement[] = invoices
    .filter((invoice) => isInPeriod(invoice.paidDate || invoice.createdAt, weekFrom, todayTo))
    .map((invoice) => ({
      key: `in-${invoice.id}`,
      date: invoice.paidDate || invoice.createdAt || '',
      reference: invoice.invoiceNumber || '',
      detail: patientName(invoice),
      amount: (() => {
        const totals = emptyTotals();
        addInvoiceMoney(totals, invoice);
        return formatTotals(totals);
      })(),
    }));

  const exitRows: Movement[] = supplies
    .filter((supply) => isInPeriod(supply.date, weekFrom, todayTo))
    .map((supply) => ({
      key: `out-${supply.id}`,
      date: supply.date || '',
      reference: supply.requestNumber || '',
      detail: (supply.items || []).map((item) => item.designation).filter(Boolean).join(', '),
      amount: formatUsd(Number(supply.totalAmount) || 0),
    }));

  const cards = [
    { label: 'Entrées du jour', value: formatTotals(today.entries) },
    { label: 'Sorties du jour', value: formatUsd(today.exits) },
    { label: 'Entrées de la semaine', value: formatTotals(week.entries) },
    { label: 'Sorties de la semaine', value: formatUsd(week.exits) },
  ];

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="border border-[#EDEBE9] bg-white px-4 py-3">
            <div className="text-sm text-[#605E5C]">{card.label}</div>
            <div className="mt-1 text-lg font-semibold text-[#323130]">{card.value}</div>
          </div>
        ))}
      </div>
      {showLists && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <MovementTable title="Entrées de la semaine" rows={entryRows} empty="Aucun reçu cette semaine." />
          <MovementTable title="Sorties de la semaine" rows={exitRows} empty="Aucune sortie cette semaine." />
        </div>
      )}
    </section>
  );
}

function MovementTable({ title, rows, empty }: { title: string; rows: Movement[]; empty: string }) {
  return (
    <div className="border border-[#EDEBE9] bg-white">
      <h2 className="border-b border-[#EDEBE9] bg-[#F3F2F1] px-4 py-2 text-sm font-semibold text-[#323130]">{title}</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-[#605E5C]">
              <th className="px-3 py-2 font-medium">Date</th>
              <th className="px-3 py-2 font-medium">N°</th>
              <th className="px-3 py-2 font-medium">Détail</th>
              <th className="px-3 py-2 font-medium">Montant</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={4} className="px-3 py-3 text-[#605E5C]">{empty}</td></tr>
            ) : rows.map((row) => (
              <tr key={row.key} className="border-t border-[#EDEBE9]">
                <td className="px-3 py-2">{row.date ? new Date(row.date).toLocaleDateString('fr-FR') : ''}</td>
                <td className="px-3 py-2">{row.reference}</td>
                <td className="px-3 py-2">{row.detail}</td>
                <td className="px-3 py-2">{row.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

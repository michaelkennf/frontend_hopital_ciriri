import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const months = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'
];

const FinancialDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [incomeData, setIncomeData] = useState<any>(null);
  const [expenseData, setExpenseData] = useState<any>(null);
  const [incomeDetails, setIncomeDetails] = useState<any[]>([]);
  const [expenseDetails, setExpenseDetails] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('[FINANCIAL] Début de la récupération des données financières');
      
      // Invoices (entrées) - récupérer toutes les factures payées ou imprimées
      const invRes = await axios.get('/api/invoices');
      const invoices = invRes.data.invoices || [];
      console.log('[FINANCIAL] Factures récupérées:', invoices.length);
      
      // Supply Requests (sorties)
      const reqRes = await axios.get('/api/supply-requests');
      const supplyRequests = reqRes.data.requests || [];
      console.log('[FINANCIAL] Demandes d\'approvisionnement récupérées:', supplyRequests.length);
      
      // Préparer les datasets par mois
      const now = new Date();
      const year = now.getFullYear();
      const getMonth = (date: string) => new Date(date).getMonth();
      
      // Entrées par type
      const types = ['consultation', 'exam', 'medication', 'hospitalization', 'act'];
      const incomeByType: Record<string, number[]> = {};
      types.forEach(type => { incomeByType[type] = Array(12).fill(0); });
      
      // Filtrer les factures payées ou imprimées
      const validInvoices = invoices.filter((i: any) => 
        (i.status === 'paid' || i.printed === true) && 
        i.createdAt && 
        new Date(i.createdAt).getFullYear() === year
      );
      
      console.log('[FINANCIAL] Factures valides (payées/imprimées):', validInvoices.length);
      
      validInvoices.forEach((i: any) => {
        const m = getMonth(i.createdAt);
        console.log(`[FINANCIAL] Traitement facture ${i.id}:`, {
          status: i.status,
          printed: i.printed,
          totalAmount: i.totalAmount,
          itemsCount: i.items?.length || 0
        });
        
        if (i.items && Array.isArray(i.items)) {
          i.items.forEach((item: any) => {
            console.log(`[FINANCIAL] Item:`, {
              type: item.type,
              totalPrice: item.totalPrice,
              description: item.description
            });
            
            if (types.includes(item.type)) {
              incomeByType[item.type][m] += item.totalPrice || 0;
            }
          });
        }
      });
      
      console.log('[FINANCIAL] Revenus par type calculés:', incomeByType);
      
      // Sorties (approvisionnements approuvés)
      const expenses = Array(12).fill(0);
      supplyRequests.filter((r: any) => r.status === 'approved' && r.date && new Date(r.date).getFullYear() === year)
        .forEach((r: any) => {
          const m = getMonth(r.date);
          expenses[m] += r.totalAmount || 0;
        });
      
      console.log('[FINANCIAL] Dépenses calculées:', expenses);
      
      // Préparer les datasets Chart.js
      setIncomeData({
        labels: months,
        datasets: [
          {
            label: 'Consultations',
            data: incomeByType['consultation'],
            backgroundColor: '#3b82f6',
          },
          {
            label: 'Examens',
            data: incomeByType['exam'],
            backgroundColor: '#f59e42',
          },
          {
            label: 'Médicaments',
            data: incomeByType['medication'],
            backgroundColor: '#10b981',
          },
          {
            label: 'Hospitalisations',
            data: incomeByType['hospitalization'],
            backgroundColor: '#a855f7',
          },
          {
            label: 'Actes',
            data: incomeByType['act'],
            backgroundColor: '#ef4444',
          },
        ]
      });
      setExpenseData({
        labels: months,
        datasets: [
          {
            label: 'Dépenses (Approvisionnements)',
            data: expenses,
            backgroundColor: '#ef4444',
          }
        ]
      });
      // Détails des entrées
      const incomeRows: any[] = [];
      invoices.filter((i: any) => i.status === 'paid' || i.printed === true).forEach((i: any) => {
        if (i.items && Array.isArray(i.items)) {
          i.items.forEach((item: any) => {
            incomeRows.push({
              date: i.createdAt,
              type: item.type,
              description: item.description,
              patient: i.patient?.firstName ? `${i.patient.firstName} ${i.patient.lastName}` : '',
              amount: item.totalPrice || 0
            });
          });
        }
      });
      setIncomeDetails(incomeRows);
      // Détails des sorties
      const expenseRows: any[] = [];
      supplyRequests.filter((r: any) => r.status === 'approved').forEach((r: any) => {
        expenseRows.push({
          date: r.date,
          requestNumber: r.requestNumber,
          designation: r.items && r.items.length > 0 ? r.items.map((it: any) => it.designation).join(', ') : '',
          amount: r.totalAmount || 0
        });
      });
      setExpenseDetails(expenseRows);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Erreur lors du chargement des données financières');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fonction pour formater le montant selon le type
  const formatAmount = (amount: number, type: string) => {
    if (type === 'consultation') {
      return `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} FC`;
    } else {
      return `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} $`;
    }
  };

  // Fonction pour calculer le total séparé par devise
  const calculateTotalByCurrency = () => {
    let consultationAmountFC = 0;
    let otherAmountUSD = 0;

    incomeDetails.forEach(row => {
      if (row.type === 'consultation') {
        consultationAmountFC += row.amount;
      } else {
        otherAmountUSD += row.amount;
      }
    });

    return { consultationAmountFC, otherAmountUSD };
  };

  const formatTotalRevenue = () => {
    const { consultationAmountFC, otherAmountUSD } = calculateTotalByCurrency();
    
    if (consultationAmountFC > 0 && otherAmountUSD > 0) {
      return `${consultationAmountFC.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} FC + ${otherAmountUSD.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} $`;
    } else if (consultationAmountFC > 0) {
      return `${consultationAmountFC.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} FC`;
    } else if (otherAmountUSD > 0) {
      return `${otherAmountUSD.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} $`;
    } else {
      return '0 $';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Finances</h1>
        <button
          className={`btn-primary flex items-center gap-2${loading ? ' opacity-60 cursor-not-allowed' : ''}`}
          onClick={fetchData}
          disabled={loading}
        >
          <span>Actualiser</span>
          {loading && (
            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
          )}
        </button>
      </div>
      <p className="text-gray-600 mb-6">Visualisez les entrées et sorties mensuelles par type (consultations, examens, médicaments, hospitalisations, approvisionnements).</p>
      {error && <div className="bg-red-100 text-red-700 p-2 mb-2 rounded">{error}</div>}
      {loading ? (
        <div className="text-center py-8">Chargement...</div>
      ) : (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="card">
            <h2 className="text-lg font-semibold mb-2">Entrées par mois</h2>
            <Bar data={incomeData} options={{ responsive: true, plugins: { legend: { position: 'top' as const } } }} />
          </div>
          <div className="card">
            <h2 className="text-lg font-semibold mb-2">Dépenses par mois</h2>
            <Bar data={expenseData} options={{ responsive: true, plugins: { legend: { position: 'top' as const } } }} />
          </div>
        </div>
        {/* Tableau récapitulatif détaillé */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="card">
            <h2 className="text-lg font-semibold mb-2">Détail des entrées</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2">Date</th>
                    <th className="p-2">Type</th>
                    <th className="p-2">Description</th>
                    <th className="p-2">Patient</th>
                    <th className="p-2">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {incomeDetails.map((row, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="p-2">{row.date ? new Date(row.date).toLocaleDateString('fr-FR') : ''}</td>
                      <td className="p-2 capitalize">{row.type}</td>
                      <td className="p-2">{row.description}</td>
                      <td className="p-2">{row.patient}</td>
                      <td className="p-2">{formatAmount(row.amount, row.type)}</td>
                    </tr>
                  ))}
                  <tr className="font-bold bg-gray-50">
                    <td colSpan={4} className="p-2 text-right">Total</td>
                    <td className="p-2">{formatTotalRevenue()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="card">
            <h2 className="text-lg font-semibold mb-2">Détail des dépenses</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2">Date</th>
                    <th className="p-2">N° Demande</th>
                    <th className="p-2">Désignation</th>
                    <th className="p-2">Montant ($)</th>
                  </tr>
                </thead>
                <tbody>
                  {expenseDetails.map((row, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="p-2">{row.date ? new Date(row.date).toLocaleDateString('fr-FR') : ''}</td>
                      <td className="p-2">{row.requestNumber}</td>
                      <td className="p-2">{row.designation}</td>
                      <td className="p-2">{row.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                  <tr className="font-bold bg-gray-50">
                    <td colSpan={3} className="p-2 text-right">Total</td>
                    <td className="p-2">{expenseDetails.reduce((sum, r) => sum + r.amount, 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        </>
      )}
    </div>
  );
};

export default FinancialDashboard; 
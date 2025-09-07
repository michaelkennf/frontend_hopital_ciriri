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

interface Medication {
  id: number;
  name: string;
  quantity: number;
  minQuantity: number;
  unit: string;
}

interface StockMovement {
  id: number;
  medication: Medication;
  type: string;
  quantity: number;
  reason: string;
  date: string;
}

const StockOverview: React.FC = () => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stockData, setStockData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [medRes, movRes] = await Promise.all([
          axios.get('/api/medications'),
          axios.get('/api/medications/stock-movements')
        ]);
        setMedications(medRes.data.medications || []);
        setMovements(movRes.data.movements || []);
        // Préparer les datasets pour le graphique
        const now = new Date();
        const year = now.getFullYear();
        const getMonth = (date: string) => new Date(date).getMonth();
        const entries = Array(12).fill(0);
        const exits = Array(12).fill(0);
        (movRes.data.movements || []).forEach((mv: any) => {
          const d = new Date(mv.date);
          if (d.getFullYear() === year) {
            const m = d.getMonth();
            if (mv.type === 'IN') entries[m] += mv.quantity;
            if (mv.type === 'OUT') exits[m] += mv.quantity;
          }
        });
        setStockData({
          labels: months,
          datasets: [
            {
              label: 'Entrées',
              data: entries,
              backgroundColor: '#10b981',
            },
            {
              label: 'Sorties',
              data: exits,
              backgroundColor: '#ef4444',
            }
          ]
        });
      } catch (e: any) {
        setError(e.response?.data?.error || 'Erreur lors du chargement du stock');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Suivi du stock</h1>
      <p className="text-gray-600 mb-6">Consultez l’évolution du stock, les entrées et sorties, et les alertes de stock faible.</p>
      {error && <div className="bg-red-100 text-red-700 p-2 mb-2 rounded">{error}</div>}
      {loading ? (
        <div className="text-center py-8">Chargement...</div>
      ) : (
        <>
          <div className="card mb-8">
            <h2 className="text-lg font-semibold mb-2">Évolution du stock (par mois)</h2>
            {stockData && <Bar data={stockData} options={{ responsive: true, plugins: { legend: { position: 'top' as const } } }} />}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="card">
              <h2 className="text-lg font-semibold mb-2">Médicaments en stock</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantité</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unité</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Alerte</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {medications.map((m) => (
                      <tr key={m.id}>
                        <td className="px-4 py-2">{m.name}</td>
                        <td className="px-4 py-2">{m.quantity}</td>
                        <td className="px-4 py-2">{m.unit}</td>
                        <td className="px-4 py-2">
                          {m.quantity <= m.minQuantity ? (
                            <span className="text-red-600 font-bold">Stock faible</span>
                          ) : (
                            <span className="text-green-600">OK</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="card">
              <h2 className="text-lg font-semibold mb-2">Alertes de stock faible</h2>
              <ul className="list-disc pl-6">
                {medications.filter((m) => m.quantity <= m.minQuantity).length === 0 ? (
                  <li className="text-green-600">Aucune alerte de stock faible</li>
                ) : (
                  medications.filter((m) => m.quantity <= m.minQuantity).map((m) => (
                    <li key={m.id} className="text-red-600 font-bold">
                      {m.name} : {m.quantity} {m.unit} (min : {m.minQuantity})
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
          <div className="card mb-8">
            <h2 className="text-lg font-semibold mb-2">Historique des mouvements de stock</h2>
            {movements.length === 0 ? (
              <div className="text-gray-500">Aucun mouvement enregistré.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Médicament</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantité</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Raison</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {movements.map((mv) => (
                      <tr key={mv.id}>
                        <td className="px-4 py-2">{new Date(mv.date).toLocaleDateString('fr-FR')}</td>
                        <td className="px-4 py-2">{mv.medication.name}</td>
                        <td className="px-4 py-2">{mv.type === 'IN' ? 'Entrée' : 'Sortie'}</td>
                        <td className="px-4 py-2">{mv.quantity}</td>
                        <td className="px-4 py-2">{mv.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default StockOverview; 
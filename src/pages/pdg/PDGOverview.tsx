import React, { useEffect, useState } from 'react';
import axios from 'axios';

const PDGOverview: React.FC = () => {
  const [employeeCount, setEmployeeCount] = useState<number | null>(null);
  const [patientCount, setPatientCount] = useState<number | null>(null);
  const [lowStockCount, setLowStockCount] = useState<number | null>(null);
  const [revenue, setRevenue] = useState<number | null>(null);
  const [revenueByType, setRevenueByType] = useState({ consultation: 0, exam: 0, medication: 0, hospitalization: 0, act: 0 });
  const [pendingSupplyRequests, setPendingSupplyRequests] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Nouvelle fonction pour charger les stats (réutilisable)
    const fetchStats = async () => {
      setLoading(true);
      try {
      const res = await axios.get('/api/stats');
      setEmployeeCount(res.data.employeeCount ?? 0);
      setPatientCount(res.data.patientCount ?? 0);
      setLowStockCount(res.data.lowStockCount ?? 0);
      setRevenue(res.data.revenue ?? 0);
      setRevenueByType(res.data.revenueByType ?? { consultation: 0, exam: 0, medication: 0, hospitalization: 0, act: 0 });
      setPendingSupplyRequests(res.data.pendingSupplyRequests ?? 0);
      } catch {
        setEmployeeCount(0);
        setPatientCount(0);
        setLowStockCount(0);
        setRevenue(0);
        setPendingSupplyRequests(0);
      } finally {
        setLoading(false);
      }
    };

  // Rafraîchissement initial et auto toutes les 30s
  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fonctions pour séparer les devises
  const calculateRevenueByCurrency = () => {
    const consultationAmountFC = revenueByType.consultation || 0;
    const otherAmountUSD = (revenueByType.exam || 0) + 
                           (revenueByType.medication || 0) + 
                           (revenueByType.hospitalization || 0) + 
                           (revenueByType.act || 0);
    
    return { consultationAmountFC, otherAmountUSD };
  };

  const formatTotalRevenue = () => {
    const { consultationAmountFC, otherAmountUSD } = calculateRevenueByCurrency();
    
    if (consultationAmountFC > 0 && otherAmountUSD > 0) {
      return `${consultationAmountFC.toLocaleString('fr-FR')} FC + ${otherAmountUSD.toLocaleString('fr-FR')} $`;
    } else if (consultationAmountFC > 0) {
      return `${consultationAmountFC.toLocaleString('fr-FR')} FC`;
    } else if (otherAmountUSD > 0) {
      return `${otherAmountUSD.toLocaleString('fr-FR')} $`;
    } else {
      return '0 $';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Tableau de bord PDG</h1>
        <button
          className={`btn-primary flex items-center gap-2${loading ? ' opacity-60 cursor-not-allowed' : ''}`}
          onClick={fetchStats}
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
      <p className="text-gray-600 mb-6">Vue d'ensemble des données de l'hôpital, statistiques, alertes, etc.</p>
      {loading ? (
        <div className="text-center py-8">Chargement...</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div key="stat-employes" className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5 flex items-center">
              <svg className="h-6 w-6 text-blue-400 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <div>
                <div className="text-sm font-medium text-gray-500 truncate">Employés</div>
                <div className="text-lg font-medium text-gray-900">{employeeCount}</div>
              </div>
            </div>
          </div>
          <div key="stat-patients" className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5 flex items-center">
              <svg className="h-6 w-6 text-green-400 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <div className="text-sm font-medium text-gray-500 truncate">Patients</div>
                <div className="text-lg font-medium text-gray-900">{patientCount}</div>
              </div>
            </div>
          </div>
          <div key="stat-stock" className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5 flex items-center">
              <svg className="h-6 w-6 text-yellow-400 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <div>
                <div className="text-sm font-medium text-gray-500 truncate">Stocks faibles</div>
                <div className="text-lg font-medium text-gray-900">{lowStockCount}</div>
              </div>
            </div>
          </div>
          <div key="stat-revenue" className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5 flex items-center">
              <svg className="h-6 w-6 text-purple-400 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div>
                <div className="text-sm font-medium text-gray-500 truncate">Chiffre d'affaires</div>
                <div className="text-lg font-medium text-gray-900">{formatTotalRevenue()}</div>
                <div className="mt-2 text-xs text-gray-500">
                  <div>Consultations : <span className="font-semibold text-gray-700">{revenueByType.consultation.toLocaleString('fr-FR')} FC</span></div>
                  <div>Examens : <span className="font-semibold text-gray-700">{revenueByType.exam.toLocaleString('fr-FR')} $</span></div>
                  <div>Actes : <span className="font-semibold text-gray-700">{revenueByType.act.toLocaleString('fr-FR')} $</span></div>
                  <div>Médicaments : <span className="font-semibold text-gray-700">{revenueByType.medication.toLocaleString('fr-FR')} $</span></div>
                  <div>Hospitalisations : <span className="font-semibold text-gray-700">{revenueByType.hospitalization.toLocaleString('fr-FR')} $</span></div>
                </div>
              </div>
            </div>
          </div>
          <div key="stat-supply" className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5 flex items-center">
              <svg className="h-6 w-6 text-pink-400 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <div className="text-sm font-medium text-gray-500 truncate">Demandes d'approvisionnement en attente</div>
                <div className="text-lg font-medium text-gray-900">{pendingSupplyRequests}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDGOverview; 
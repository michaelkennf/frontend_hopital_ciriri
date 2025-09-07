import React, { useEffect, useState } from 'react';
import axios from 'axios';

const LogisticienOverview: React.FC = () => {
  const [stockCount, setStockCount] = useState<number | null>(null);
  const [consultationsCount, setConsultationsCount] = useState<number | null>(null);
  const [examsCount, setExamsCount] = useState<number | null>(null);
  const [pendingRequests, setPendingRequests] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        // Stock total (nombre de médicaments)
        const stockRes = await axios.get('/api/medications');
        setStockCount(Array.isArray(stockRes.data) ? stockRes.data.length : (stockRes.data.medications?.length ?? 0));
        
        // Types de consultations
        const consRes = await axios.get('/api/consultations/types');
        console.log('Types de consultations:', consRes.data);
        setConsultationsCount(Array.isArray(consRes.data) ? consRes.data.length : (consRes.data.consultationTypes?.length ?? 0));
        
        // Types d'examens
        const examsRes = await axios.get('/api/exams/types');
        console.log('Types d\'examens:', examsRes.data);
        setExamsCount(Array.isArray(examsRes.data) ? examsRes.data.length : (examsRes.data.examTypes?.length ?? 0));
        
        // Demandes de fournitures en attente
        const reqRes = await axios.get('/api/supply-requests');
        const requests = reqRes.data.requests || [];
        setPendingRequests(requests.filter((r: any) => r.status === 'pending').length);
      } catch (err: any) {
        console.error('Erreur lors du chargement des statistiques:', err);
        setError(err.response?.data?.error || err.message || 'Erreur lors du chargement des données');
        setStockCount(0);
        setConsultationsCount(0);
        setExamsCount(0);
        setPendingRequests(0);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Vue d'ensemble - Logisticien</h1>
        <p className="mt-1 text-sm text-gray-500">
          Tableau de bord du logisticien de la Polyclinique des Apôtres
        </p>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
          <p className="font-medium">Erreur de chargement :</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-8">Chargement...</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Stock actuel */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Stock actuel</dt>
                    <dd className="text-lg font-medium text-gray-900">{stockCount}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          {/* Consultations */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Types de consultations</dt>
                    <dd className="text-lg font-medium text-gray-900">{consultationsCount}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          {/* Examens */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Types d'examens</dt>
                    <dd className="text-lg font-medium text-gray-900">{examsCount}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          {/* Demandes en attente */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Demandes en attente</dt>
                    <dd className="text-lg font-medium text-gray-900">{pendingRequests}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogisticienOverview; 
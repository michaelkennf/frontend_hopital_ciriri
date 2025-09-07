import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface MaternityStats {
  total: number;
  today: number;
  month: number;
  loading: boolean;
  error: string | null;
}

const MaterniteOverview: React.FC = () => {
  const [stats, setStats] = useState<MaternityStats>({
    total: 0,
    today: 0,
    month: 0,
    loading: true,
    error: null
  });

  useEffect(() => {
    setStats(s => ({ ...s, loading: true, error: null }));
    
    const fetchStats = async () => {
      try {
        // Récupérer les patients maternité
        const patientsRes = await axios.get('/api/patients?service=maternite');
        const patients = patientsRes.data.patients || [];

        // Récupérer les hospitalisations maternité avec protection complète
        const hospRes = await axios.get('/api/hospitalizations');
        const hospitalizations = hospRes.data.hospitalizations.filter((h: any) => {
          try {
            // Vérifier si roomType existe et a une propriété name
            if (!h || !h.roomType || !h.roomType.name) return false;
            
            return h.roomType.name.toLowerCase().includes('maternité');
          } catch (error) {
            console.error('Erreur lors du filtrage des hospitalisations:', error);
            return false;
          }
        });

        // Récupérer l'historique maternité
        const historyRes = await axios.get('/api/maternity-history');
        const history = historyRes.data.histories || [];

        // Calculer les statistiques
        const now = new Date();
        const todayStr = now.toISOString().slice(0, 10);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

        // Statistiques des patients
        const totalPatients = patients.length;
        const todayPatients = patients.filter((p: any) => 
          (p.createdAt || '').slice(0, 10) === todayStr
        ).length;
        const monthPatients = patients.filter((p: any) => {
          try {
            const created = new Date(p.createdAt);
            return created >= lastMonth && created <= now;
          } catch (error) {
            return false;
          }
        }).length;

        // Statistiques des hospitalisations
        const totalHospitalizations = hospitalizations.length;
        const todayHospitalizations = hospitalizations.filter((h: any) => 
          (h.startDate || '').slice(0, 10) === todayStr
        ).length;
        const monthHospitalizations = hospitalizations.filter((h: any) => {
          try {
            const startDate = new Date(h.startDate);
            return startDate >= lastMonth && startDate <= now;
          } catch (error) {
            return false;
          }
        }).length;

        // Statistiques de l'historique
        const totalHistory = history.length;
        const todayHistory = history.filter((h: any) => 
          (h.entryDate || '').slice(0, 10) === todayStr
        ).length;
        const monthHistory = history.filter((h: any) => {
          try {
            const entryDate = new Date(h.entryDate);
            return entryDate >= lastMonth && entryDate <= now;
          } catch (error) {
            return false;
          }
        }).length;

        // Utiliser les statistiques des patients comme statistiques principales
        setStats({
          total: totalPatients,
          today: todayPatients,
          month: monthPatients,
          loading: false,
          error: null
        });

      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
        setStats({
          total: 0,
          today: 0,
          month: 0,
          loading: false,
          error: 'Erreur lors du chargement des statistiques'
        });
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Vue d'ensemble - Maternité</h1>
        <p className="mt-1 text-sm text-gray-500">
          Tableau de bord de la maternité de la Polyclinique des Apôtres
        </p>
      </div>
      
      {stats.error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4 text-red-700">
          {stats.error}
        </div>
      )}
      
      {stats.loading ? (
        <div className="text-center py-8">Chargement...</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Patients total */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Patientes total</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Patients du jour */}
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
                    <dt className="text-sm font-medium text-gray-500 truncate">Patientes du jour</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.today}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Patients du dernier mois */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Patientes du dernier mois</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.month}</dd>
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

export default MaterniteOverview;
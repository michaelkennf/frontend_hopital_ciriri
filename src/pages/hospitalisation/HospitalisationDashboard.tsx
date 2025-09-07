import React, { useState, useEffect } from 'react';
import { GlobalErrorBoundary } from '../../components/GlobalErrorBoundary';
import { Routes, Route } from 'react-router-dom';
import Layout from '../../components/Layout';
import Settings from '../admin/Settings';
import PatientsManagementHospitalisation from './PatientsManagementHospitalisation';
import ExamsListHospitalisation from './ExamsListHospitalisation';
import ActsListHospitalisation from './ActsListHospitalisation';
import MedicationsListHospitalisation from './MedicationsListHospitalisation';
import HistoriqueHospitalisation from './HistoriqueHospitalisation';
import ConsultationsListHospitalisation from './ConsultationsListHospitalisation';
import HospitalisationsHospitalisation from './HospitalisationsHospitalisation';
import axios from 'axios';

// Fonction helper pour ajouter l'authentification aux appels axios
const authenticatedAxios = {
  get: (url: string) => {
    const token = localStorage.getItem('auth-token');
    return axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }
};

interface HospitalizationStats {
  total: number;
  today: number;
  month: number;
  loading: boolean;
  error: string | null;
}

const HospitalisationOverview: React.FC = () => {
  const [stats, setStats] = useState<HospitalizationStats>({
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
        // Récupérer les patients hospitalisation
        const patientsRes = await authenticatedAxios.get('/api/patients?service=hospitalisation');
        const patients = patientsRes.data.patients || [];

        // Récupérer les hospitalisations
        const hospRes = await authenticatedAxios.get('/api/hospitalizations');
        const hospitalizations = hospRes.data.hospitalizations.filter((h: any) => 
          h.patient && h.patient.folderNumber && h.patient.folderNumber.startsWith('HOSP-')
        );

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
          const created = new Date(p.createdAt);
          return created >= lastMonth && created <= now;
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
        <h1 className="text-2xl font-bold text-gray-900">Vue d'ensemble - Hospitalisation</h1>
        <p className="mt-1 text-sm text-gray-500">
          Tableau de bord de l'hospitalisation de la Polyclinique des Apôtres
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
                  <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Patients total</dt>
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
                    <dt className="text-sm font-medium text-gray-500 truncate">Patients du jour</dt>
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
                    <dt className="text-sm font-medium text-gray-500 truncate">Patients du dernier mois</dt>
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

const navigationItems = [
  { name: 'Vue d\'ensemble', href: '/hospitalisation', icon: (
    <svg className="mr-3 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" /></svg>
  ) },
  { name: 'Patients', href: '/hospitalisation/patients', icon: (
    <svg className="mr-3 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
  ) },
  { name: 'Consultations', href: '/hospitalisation/consultations', icon: (
    <svg className="mr-3 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
  ) },
  { name: 'Examens', href: '/hospitalisation/exams', icon: (
    <svg className="mr-3 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" /></svg>
  ) },
  { name: 'Actes', href: '/hospitalisation/acts', icon: (
    <svg className="mr-3 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
  ) },
  { name: 'Médicaments', href: '/hospitalisation/medications', icon: (
    <svg className="mr-3 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" /></svg>
  ) },
  { name: 'Historique', href: '/hospitalisation/historique', icon: (
    <svg className="mr-3 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
  ) },
  { name: 'Hospitalisations', href: '/hospitalisation/hospitalisations', icon: (
    <svg className="mr-3 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
  ) }
];

const HospitalisationDashboard: React.FC = () => {
  return (
    <GlobalErrorBoundary>
      <Layout
        title="Hospitalisation"
        navigationItems={navigationItems}
        settingsPath="/hospitalisation/settings"
      >
        <Routes>
          <Route path="/" element={<HospitalisationOverview />} />
          <Route path="/patients" element={<PatientsManagementHospitalisation />} />
          <Route path="/consultations" element={<ConsultationsListHospitalisation />} />
          <Route path="/exams" element={<ExamsListHospitalisation />} />
          <Route path="/acts" element={<ActsListHospitalisation />} />
          <Route path="/medications" element={<MedicationsListHospitalisation />} />
          <Route path="/historique" element={<HistoriqueHospitalisation />} />
          <Route path="/hospitalisations" element={<HospitalisationsHospitalisation />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </GlobalErrorBoundary>
  );
};

export default HospitalisationDashboard;
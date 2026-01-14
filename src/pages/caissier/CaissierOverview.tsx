import React, { useEffect, useState } from 'react';
import { apiClient } from '../../utils/apiClient';

const CaissierOverview: React.FC = () => {
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayPatients: 0,
    lastMonthPatients: 0,
    totalExams: 0,
    todayExams: 0,
    lastMonthExams: 0,
    totalMedications: 0,
    todayMedications: 0,
    lastMonthMedications: 0,
    loading: true,
    error: null as string | null
  });

  useEffect(() => {
    const fetchStats = async () => {
      setStats(prev => ({ ...prev, loading: true, error: null }));
      
      try {
        console.log('🔄 Chargement des statistiques caissier...');
        
        // Vérifier le token
        const token = localStorage.getItem('token');
        console.log('🔑 Token présent:', !!token);
        if (token) {
          console.log('🔑 Token:', token.substring(0, 20) + '...');
        }
        
        // Appels API en parallèle
        const [patientsRes, examsRes, salesRes] = await Promise.allSettled([
          apiClient.get('/api/patients'),
          apiClient.get('/api/exams/realized'),
          apiClient.get('/api/medications/sales')
        ]);

        const today = new Date();
        const todayStr = today.toISOString().slice(0, 10);
        const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonth = lastMonthDate.getMonth();
        const lastMonthYear = lastMonthDate.getFullYear();

        // Traitement des patients
        let patients: any[] = [];
        if (patientsRes.status === 'fulfilled') {
          const data = patientsRes.value.data;
          // Gérer différentes structures de réponse
          if (Array.isArray(data)) {
            patients = data;
          } else if (data.patients) {
            patients = data.patients;
          } else if (data.data) {
            patients = data.data;
          } else {
            patients = [];
          }
          console.log('✅ Patients chargés:', patients.length);
          console.log('📋 Structure patients:', Object.keys(data));
        } else {
          console.error('❌ Erreur patients:', patientsRes.reason);
        }

        // Traitement des examens
        let exams: any[] = [];
        if (examsRes.status === 'fulfilled') {
          const data = examsRes.value.data;
          exams = Array.isArray(data) ? data : (data.exams || []);
          console.log('✅ Examens chargés:', exams.length);
        } else {
          console.error('❌ Erreur examens:', examsRes.reason);
        }

        // Traitement des ventes de médicaments
        let sales: any[] = [];
        if (salesRes.status === 'fulfilled') {
          const data = salesRes.value.data;
          sales = Array.isArray(data) ? data : (data.sales || []);
          console.log('✅ Ventes médicaments chargées:', sales.length);
        } else {
          console.error('❌ Erreur ventes médicaments:', salesRes.reason);
        }

        // Calcul des statistiques
        const newStats = {
          totalPatients: patients.length,
          todayPatients: patients.filter((p: any) => {
            const createdAt = p.createdAt || p.dateCreated;
            return createdAt && createdAt.slice(0, 10) === todayStr;
          }).length,
          lastMonthPatients: patients.filter((p: any) => {
            const createdAt = p.createdAt || p.dateCreated;
            if (!createdAt) return false;
            const d = new Date(createdAt);
            return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
          }).length,
          totalExams: exams.length,
          todayExams: exams.filter((e: any) => {
            const examDate = e.date || e.createdAt;
            return examDate && examDate.slice(0, 10) === todayStr;
          }).length,
          lastMonthExams: exams.filter((e: any) => {
            const examDate = e.date || e.createdAt;
            if (!examDate) return false;
            const d = new Date(examDate);
            return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
          }).length,
          totalMedications: sales.length,
          todayMedications: sales.filter((s: any) => {
            const saleDate = s.date || s.createdAt;
            return saleDate && saleDate.slice(0, 10) === todayStr;
          }).length,
          lastMonthMedications: sales.filter((s: any) => {
            const saleDate = s.date || s.createdAt;
            if (!saleDate) return false;
            const d = new Date(saleDate);
            return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
          }).length,
          loading: false,
          error: null
        };

        console.log('📊 Statistiques calculées:', newStats);
        setStats(newStats);

      } catch (error: any) {
        console.error('❌ Erreur générale:', error);
        setStats(prev => ({
          ...prev,
          loading: false,
          error: error.message || 'Erreur lors du chargement des statistiques'
        }));
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord Caissier</h1>
        <p className="mt-1 text-sm text-gray-500">Vue d'ensemble dynamique du caissier</p>
      </div>

      {/* Affichage des erreurs */}
      {stats.error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{stats.error}</p>
            </div>
          </div>
        </div>
      )}

      {stats.loading ? (
        <div className="text-center py-8">
          <div className="inline-flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Chargement des statistiques...
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5 flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total patients</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalPatients}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5 flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3z" /></svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Patients aujourd'hui</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.todayPatients}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5 flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Patients mois passé</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.lastMonthPatients}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5 flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total examens</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalExams}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5 flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3z" /></svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Examens aujourd'hui</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.todayExams}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5 flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Examens mois passé</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.lastMonthExams}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5 flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total ventes médicaments</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalMedications}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5 flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3z" /></svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Ventes médicaments aujourd'hui</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.todayMedications}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5 flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Ventes médicaments mois passé</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.lastMonthMedications}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaissierOverview; 
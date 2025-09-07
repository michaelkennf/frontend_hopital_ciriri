import React, { useEffect, useState } from 'react';
import axios from 'axios';

const iconClass = 'h-8 w-8 text-green-600';

const CaissierOverview: React.FC = () => {
  const [stats, setStats] = useState({ totalPatients: 0, todayPatients: 0, lastMonthPatients: 0, totalExams: 0, todayExams: 0, lastMonthExams: 0, totalMedications: 0, todayMedications: 0, lastMonthMedications: 0, loading: true });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setStats(s => ({ ...s, loading: true }));
      try {
        // Patients
        const patientsRes = await axios.get('/api/patients');
        const patients = patientsRes.data.patients || [];
        const today = new Date();
        const todayStr = today.toISOString().slice(0, 10);
        const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonth = lastMonthDate.getMonth();
        const lastMonthYear = lastMonthDate.getFullYear();
        // Exams
        const examsRes = await axios.get('/api/exams/realized');
        const exams = examsRes.data.exams || [];
        // Médicaments
        const salesRes = await axios.get('/api/medications/sales');
        const sales = salesRes.data.sales || [];
        setStats({
          totalPatients: patients.length,
          todayPatients: patients.filter((p: any) => p.createdAt && p.createdAt.slice(0, 10) === todayStr).length,
          lastMonthPatients: patients.filter((p: any) => {
            if (!p.createdAt) return false;
            const d = new Date(p.createdAt);
            return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
          }).length,
          totalExams: exams.length,
          todayExams: exams.filter((e: any) => e.date && e.date.slice(0, 10) === todayStr).length,
          lastMonthExams: exams.filter((e: any) => {
            if (!e.date) return false;
            const d = new Date(e.date);
            return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
          }).length,
          totalMedications: sales.length,
          todayMedications: sales.filter((s: any) => s.date && s.date.slice(0, 10) === todayStr).length,
          lastMonthMedications: sales.filter((s: any) => {
            if (!s.date) return false;
            const d = new Date(s.date);
            return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
          }).length,
          loading: false
        });
      } catch (e: any) {
        setStats({ totalPatients: 0, todayPatients: 0, lastMonthPatients: 0, totalExams: 0, todayExams: 0, lastMonthExams: 0, totalMedications: 0, todayMedications: 0, lastMonthMedications: 0, loading: false });
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
      {stats.loading ? (
        <div className="text-center py-8">Chargement...</div>
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
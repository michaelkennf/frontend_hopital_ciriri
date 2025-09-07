import React, { useEffect, useState } from 'react';
import axios from 'axios';

const RHOverview: React.FC = () => {
  const [employeeCount, setEmployeeCount] = useState<number | null>(null);
  const [attendanceCount, setAttendanceCount] = useState<number | null>(null);
  const [pendingLeaves, setPendingLeaves] = useState<number | null>(null);
  const [pendingPayslips, setPendingPayslips] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        // Employés
        const empRes = await axios.get('/api/employees');
        setEmployeeCount(Array.isArray(empRes.data) ? empRes.data.length : 0);
        // Présences du jour (si API existe)
        try {
          const attRes = await axios.get('/api/attendance');
          setAttendanceCount(attRes.data?.count ?? 0);
        } catch {
          setAttendanceCount(0);
        }
        // Demandes de congé en attente
        const leaveRes = await axios.get('/api/leave-requests');
        const leaves = leaveRes.data.requests || [];
        setPendingLeaves(leaves.filter((l: any) => l.status === 'pending').length);
        // Fiches de paie à imprimer (si API existe)
        try {
          const invRes = await axios.get('/api/invoices');
          const invoices = invRes.data.invoices || [];
          setPendingPayslips(invoices.filter((i: any) => i.printed === false).length);
        } catch {
          setPendingPayslips(0);
        }
      } catch {
        setEmployeeCount(0);
        setAttendanceCount(0);
        setPendingLeaves(0);
        setPendingPayslips(0);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Vue d'ensemble - Ressources Humaines</h1>
        <p className="mt-1 text-sm text-gray-500">
          Tableau de bord RH de la Polyclinique des Apôtres
        </p>
      </div>
      {loading ? (
        <div className="text-center py-8">Chargement...</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Employés */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Employés</dt>
                    <dd className="text-lg font-medium text-gray-900">{employeeCount}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          {/* Présences du jour */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Présences du jour</dt>
                    <dd className="text-lg font-medium text-gray-900">{attendanceCount}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          {/* Demandes de congé en attente */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Congés en attente</dt>
                    <dd className="text-lg font-medium text-gray-900">{pendingLeaves}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          {/* Fiches de paie à imprimer */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Fiches de paie à imprimer</dt>
                    <dd className="text-lg font-medium text-gray-900">{pendingPayslips}</dd>
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

export default RHOverview; 
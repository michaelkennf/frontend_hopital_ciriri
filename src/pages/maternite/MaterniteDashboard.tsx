import React from 'react';
import { GlobalErrorBoundary } from '../../components/GlobalErrorBoundary';
import { Routes, Route } from 'react-router-dom';
import Layout from '../../components/Layout';
import Settings from '../admin/Settings';
import PatientsManagementMaternite from './PatientsManagementMaternite';
import ExamsListMaternite from './ExamsListMaternite';
import ActsListMaternite from './ActsListMaternite';
import MedicationsListMaternite from './MedicationsListMaternite';
import HistoriqueMaternite from './HistoriqueMaternite';
import ConsultationsListMaternite from './ConsultationsListMaternite';
import HospitalisationsMaternite from './HospitalisationsMaternite';
import MaterniteOverview from './MaterniteOverview';

const navigationItems = [
  { name: 'Vue d\'ensemble', href: '/maternite', icon: (
    <svg className="mr-3 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" /></svg>
  ) },
  { name: 'Patients', href: '/maternite/patients', icon: (
    <svg className="mr-3 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
  ) },
  { name: 'Consultations', href: '/maternite/consultations', icon: (
    <svg className="mr-3 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
  ) },
  { name: 'Examens', href: '/maternite/exams', icon: (
    <svg className="mr-3 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" /></svg>
  ) },
  { name: 'Actes', href: '/maternite/acts', icon: (
    <svg className="mr-3 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
  ) },
  { name: 'Médicaments', href: '/maternite/medications', icon: (
    <svg className="mr-3 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" /></svg>
  ) },
  { name: 'Historique', href: '/maternite/historique', icon: (
    <svg className="mr-3 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
  ) },
  { name: 'Hospitalisations', href: '/maternite/hospitalisations', icon: (
    <svg className="mr-3 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
  ) }
];

const MaterniteDashboard: React.FC = () => {
  return (
    <GlobalErrorBoundary>
      <Layout
        title="Maternité"
        navigationItems={navigationItems}
        settingsPath="/maternite/settings"
      >
        <Routes>
          <Route path="/" element={<MaterniteOverview />} />
          <Route path="/patients" element={<PatientsManagementMaternite />} />
          <Route path="/consultations" element={<ConsultationsListMaternite />} />
          <Route path="/exams" element={<ExamsListMaternite />} />
          <Route path="/acts" element={<ActsListMaternite />} />
          <Route path="/medications" element={<MedicationsListMaternite />} />
          <Route path="/historique" element={<HistoriqueMaternite />} />
          <Route path="/hospitalisations" element={<HospitalisationsMaternite />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </GlobalErrorBoundary>
  );
};

export default MaterniteDashboard;
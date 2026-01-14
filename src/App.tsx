// import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';

// Import des pages par rôle
import AdminDashboard from './pages/admin/AdminDashboard';
import PDGDashboard from './pages/pdg/PDGDashboard';
import RHDashboard from './pages/rh/RHDashboard';
import CaissierDashboard from './pages/caissier/CaissierDashboard';
import LogisticienDashboard from './pages/logisticien/LogisticienDashboard';
import MedecinDashboard from './pages/medecin/MedecinDashboard';
import HospitalisationDashboard from './pages/hospitalisation/HospitalisationDashboard';
import LaborantinDashboard from './pages/laborantin/LaborantinDashboard';
import MaterniteDashboard from './pages/maternite/MaterniteDashboard';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Route publique - Page de connexion */}
          <Route path="/login" element={<Login />} />

          {/* Routes par rôle protégées */}
          <Route path="/admin/*" element={<ProtectedRoute allowedRoles={["ADMIN"]}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/pdg/*" element={<ProtectedRoute allowedRoles={["PDG"]}><PDGDashboard /></ProtectedRoute>} />
          <Route path="/rh/*" element={<ProtectedRoute allowedRoles={["RH"]}><RHDashboard /></ProtectedRoute>} />
          <Route path="/caissier/*" element={<ProtectedRoute allowedRoles={["CAISSIER"]}><CaissierDashboard /></ProtectedRoute>} />
          <Route path="/logisticien/*" element={<ProtectedRoute allowedRoles={["LOGISTICIEN"]}><LogisticienDashboard /></ProtectedRoute>} />
          <Route path="/medecin/*" element={<ProtectedRoute allowedRoles={["MEDECIN"]}><MedecinDashboard /></ProtectedRoute>} />
          <Route path="/hospitalisation/*" element={<ProtectedRoute allowedRoles={["HOSPITALISATION"]}><HospitalisationDashboard /></ProtectedRoute>} />
          <Route path="/laborantin/*" element={<ProtectedRoute allowedRoles={["LABORANTIN"]}><LaborantinDashboard /></ProtectedRoute>} />
          <Route path="/maternite/*" element={<ProtectedRoute allowedRoles={["MATERNITE"]}><MaterniteDashboard /></ProtectedRoute>} />

          {/* Redirection par défaut : si authentifié, dashboard selon rôle, sinon login */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 
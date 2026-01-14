import React from 'react';
import { useAuthStore } from '../stores/authStore';
import { Navigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirection basée sur le rôle
  switch (user.role) {
    case 'ADMIN':
      return <Navigate to="/admin" replace />;
    case 'PDG':
      return <Navigate to="/pdg" replace />;
    case 'RH':
      return <Navigate to="/rh" replace />;
    case 'CAISSIER':
      return <Navigate to="/caissier" replace />;
    case 'LOGISTICIEN':
      return <Navigate to="/logisticien" replace />;
    case 'MEDECIN':
      return <Navigate to="/medecin" replace />;
    case 'HOSPITALISATION':
      return <Navigate to="/hospitalisation" replace />;
    case 'LABORANTIN':
      return <Navigate to="/laborantin" replace />;
    case 'MATERNITE':
      return <Navigate to="/maternite" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

export default Dashboard;

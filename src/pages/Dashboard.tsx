import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const role = user.role;
      let redirectPath = '/dashboard';
      
      switch (role) {
        case 'admin':
          redirectPath = '/admin';
          break;
        case 'pdg':
          redirectPath = '/pdg';
          break;
        case 'rh':
          redirectPath = '/rh';
          break;
        case 'caissier':
          redirectPath = '/caissier';
          break;
        case 'logisticien':
          redirectPath = '/logisticien';
          break;
        default:
          redirectPath = '/dashboard';
      }
      
      navigate(redirectPath, { replace: true });
    }
  }, [user, navigate]);

  // Affichage temporaire pendant la redirection
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirection en cours...</p>
      </div>
    </div>
  );
};

export default Dashboard; 
import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
  children?: ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, isLoading, checkAuth } = useAuthStore();
  const location = useLocation();
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  // Vérifier l'authentification au chargement du composant
  useEffect(() => {
    if (!hasCheckedAuth) {
      console.log('🔐 ProtectedRoute: Vérification de l\'authentification...', { pathname: location.pathname });
      checkAuth().then(() => {
        setHasCheckedAuth(true);
      });
    }
  }, [checkAuth, hasCheckedAuth, location.pathname]);

  // Afficher un loader pendant la vérification de l'authentification
  if (isLoading || !hasCheckedAuth) {
    console.log('🔐 ProtectedRoute: Chargement...', { isLoading, hasCheckedAuth });
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  console.log('🔐 ProtectedRoute: État actuel:', { 
    user: user ? { id: user.id, email: user.email, role: user.role } : null, 
    allowedRoles, 
    pathname: location.pathname
  });

  // Rediriger vers la page de connexion si non authentifié
  if (!user) {
    console.log('🔐 ProtectedRoute: Utilisateur non authentifié, redirection vers /login');
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Vérifier les permissions si des rôles sont spécifiés
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.log('🔐 ProtectedRoute: Rôle insuffisant:', { userRole: user.role, allowedRoles });
    
    // Rediriger vers le dashboard approprié selon le rôle
    let redirectPath = '/dashboard';
    
    switch (user.role) {
      case 'ADMIN':
        redirectPath = '/admin';
        break;
      case 'PDG':
        redirectPath = '/pdg';
        break;
      case 'RH':
        redirectPath = '/rh';
        break;
      case 'CAISSIER':
        redirectPath = '/caissier';
        break;
      case 'LOGISTICIEN':
        redirectPath = '/logisticien';
        break;
      case 'MEDECIN':
        redirectPath = '/medecin';
        break;
      case 'HOSPITALISATION':
        redirectPath = '/hospitalisation';
        break;
      case 'LABORANTIN':
        redirectPath = '/laborantin';
        break;
      case 'MATERNITE':
        redirectPath = '/maternite';
        break;
      default:
        redirectPath = '/dashboard';
    }
    
    console.log('🔐 ProtectedRoute: Redirection vers:', redirectPath);
    return <Navigate to={redirectPath} replace />;
  }

  console.log('🔐 ProtectedRoute: Accès autorisé pour le rôle:', user.role);
  
  // Afficher le contenu protégé
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute; 
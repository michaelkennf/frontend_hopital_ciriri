import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '../utils/apiClient';

// Types
interface User {
  id: number;
  email: string;
  role: string; // Le backend retourne directement la string du rôle
  firstName: string;
  lastName: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  updateUser: (user: User) => void;
}

type AuthStore = AuthState & AuthActions;

// Configuration axios
// Configuration de l'API - apiClient gère déjà la configuration
console.log('[AUTH STORE] Environment:', import.meta.env.MODE);

// Les intercepteurs sont maintenant gérés par apiClient

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // État initial
      user: null,
      token: null,
      isLoading: false,
      error: null,

      // Actions
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          console.log('[AUTH STORE] Tentative de connexion pour:', email);
          const response = await apiClient.post('/api/auth/login', {
            email,
            password
          });

          const { user } = response.data;
          localStorage.removeItem('token');
          
          set({
            user,
            token: null,
            isLoading: false,
            error: null
          });

          // Ne pas rediriger ici, laisser le composant gérer la redirection
          // La redirection sera gérée par le composant Login avec useNavigate
          
        } catch (error: any) {
          console.error('[AUTH STORE] Erreur de connexion:', error);
          console.error('[AUTH STORE] Détails de l\'erreur:', error.response?.data);
          
          let errorMessage = 'Erreur de connexion';
          
          // Gestion spécifique des erreurs
          if (error.response?.status === 401) {
            errorMessage = 'Email ou mot de passe incorrect';
          } else if (error.response?.status === 400) {
            errorMessage = error.response?.data?.error || 'Données de connexion invalides';
          } else if (error.response?.status === 500) {
            errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
          } else if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
            errorMessage = 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.';
          } else if (error.response?.data?.error) {
            errorMessage = error.response.data.error;
          }
          
          set({
            isLoading: false,
            error: errorMessage
          });
          throw new Error(errorMessage);
        }
      },

      logout: async () => {
        try {
          // Appeler l'API de déconnexion
          await apiClient.post('/api/auth/logout');
        } catch (error) {
          console.error('Erreur lors de la déconnexion:', error);
        } finally {
          // Nettoyer l'état local
          localStorage.removeItem('token');
          set({
            user: null,
            token: null,
            error: null
          });
          
          // Rediriger vers la page de connexion
          window.location.href = '/login';
        }
      },

      checkAuth: async () => {
        if (get().isLoading) {
          return;
        }

        set({ isLoading: true });
        
        try {
          const response = await apiClient.get('/api/auth/verify');
          const { user } = response.data;
          localStorage.removeItem('token');
          
          set({
            user,
            token: null,
            isLoading: false,
            error: null
          });
        } catch {
          localStorage.removeItem('token');
          set({
            user: null,
            token: null,
            isLoading: false,
            error: null
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },

      updateUser: (user: User) => {
        set({ user });
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user
      })
    }
  )
);

// Hook utilitaire pour vérifier les permissions
export const usePermissions = () => {
  const user = useAuthStore((state) => state.user);
  
  return {
    hasRole: (role: string) => user?.role === role,
    hasAnyRole: (roles: string[]) => roles.includes(user?.role || ''),
    isAdmin: user?.role === 'admin',
    isPDG: user?.role === 'pdg',
    isRH: user?.role === 'rh',
    isCaissier: user?.role === 'caissier',
    isLogisticien: user?.role === 'logisticien',
    canAccessAdmin: ['admin'].includes(user?.role || ''),
    canAccessPDG: ['admin', 'pdg'].includes(user?.role || ''),
    canAccessRH: ['admin', 'rh'].includes(user?.role || ''),
    canAccessCaissier: ['admin', 'caissier'].includes(user?.role || ''),
    canAccessLogisticien: ['admin', 'logisticien'].includes(user?.role || '')
  };
}; 



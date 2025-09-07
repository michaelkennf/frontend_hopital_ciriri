import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

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
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? 'https://backend-hopital-8098.onrender.com' : 'http://localhost:5000');

console.log('[AUTH STORE] API Base URL:', API_BASE_URL);
console.log('[AUTH STORE] Environment:', import.meta.env.MODE);

axios.defaults.baseURL = API_BASE_URL;

// Intercepteur pour ajouter le token aux requêtes
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth-token');
    console.log('[AXIOS INTERCEPTOR] Token utilisé:', token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs d'authentification
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Ne supprimer le token que pour les erreurs d'authentification spécifiques
    // Pas pour toutes les erreurs 401
    if (error.response?.status === 401 && error.response?.data?.error === 'Token invalide') {
      localStorage.removeItem('auth-token');
    }
    return Promise.reject(error);
  }
);

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
          const response = await axios.post('/api/auth/login', {
            email,
            password
          });

          const { token, user } = response.data;
          
          // Sauvegarder le token
          localStorage.setItem('auth-token', token);
          
          // Mettre à jour l'état
          set({
            user,
            token,
            isLoading: false,
            error: null
          });

          // Ne pas rediriger ici, laisser le composant gérer la redirection
          // La redirection sera gérée par le composant Login avec useNavigate
          
        } catch (error: any) {
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
          await axios.post('/api/auth/logout');
        } catch (error) {
          console.error('Erreur lors de la déconnexion:', error);
        } finally {
          // Nettoyer l'état local
          localStorage.removeItem('auth-token');
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
        const token = localStorage.getItem('auth-token');
        
        if (!token) {
          console.log('[AUTH STORE] Aucun token trouvé');
          set({ isLoading: false });
          return;
        }

        // Éviter les appels répétés si déjà en cours
        if (get().isLoading) {
          console.log('[AUTH STORE] Vérification déjà en cours, ignoré');
          return;
        }

        // Éviter les appels répétés si l'utilisateur est déjà chargé
        if (get().user && get().token) {
          console.log('[AUTH STORE] Utilisateur déjà chargé, ignoré');
          return;
        }

        console.log('[AUTH STORE] Vérification du token...');
        set({ isLoading: true });
        
        try {
          const response = await axios.get('/api/auth/verify');
          const { user } = response.data;
          
          console.log('[AUTH STORE] Token valide, utilisateur:', { id: user.id, email: user.email, role: user.role });
          
          set({
            user,
            token,
            isLoading: false,
            error: null
          });
        } catch (error: any) {
          console.log('[AUTH STORE] Token invalide, nettoyage...', error.response?.status);
          // Token invalide, nettoyer l'état
          localStorage.removeItem('auth-token');
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
        user: state.user,
        token: state.token
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



// Store d'authentification robuste pour local et production
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient, { testConnectivity, testAuth, diagnoseApiIssues } from '../utils/axiosConfig';

// Types
interface User {
  id: number;
  email: string;
  role: string;
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
  isAuthenticated: boolean;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  checkAuth: () => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
  updateUser: (user: User) => void;
  refreshToken: () => Promise<{ success: boolean; error?: string }>;
  diagnose: () => Promise<any>;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // État initial
      user: null,
      token: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,

      // Actions
      login: async (email: string, password: string) => {
        console.log('[AUTH STORE] Tentative de connexion pour:', email);
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiClient.post('/api/auth/login', {
            email,
            password
          });

          const { token, user } = response.data;
          
          console.log('[AUTH STORE] Connexion réussie:', {
            userId: user.id,
            role: user.role,
            tokenLength: token.length
          });
          
          // Sauvegarder le token
          localStorage.setItem('token', token);
          
          // Mettre à jour l'état
          set({
            user,
            token,
            isLoading: false,
            isAuthenticated: true,
            error: null
          });

          return { success: true };
        } catch (error: any) {
          console.error('[AUTH STORE] Erreur de connexion:', error);
          
          const errorMessage = error.response?.data?.error || 
                              error.response?.data?.message || 
                              'Erreur de connexion';
          
          set({
            user: null,
            token: null,
            isLoading: false,
            isAuthenticated: false,
            error: errorMessage
          });

          return { success: false, error: errorMessage };
        }
      },

      logout: () => {
        console.log('[AUTH STORE] Déconnexion');
        localStorage.removeItem('token');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null
        });
      },

      checkAuth: async () => {
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.log('[AUTH STORE] Aucun token trouvé');
          set({ isAuthenticated: false, user: null, token: null });
          return { success: false, error: 'Aucun token trouvé' };
        }

        console.log('[AUTH STORE] Vérification de l\'authentification...');
        set({ isLoading: true });

        try {
          const response = await apiClient.get('/api/auth/me');
          const user = response.data;
          
          console.log('[AUTH STORE] Utilisateur authentifié:', user);
          
          set({
            user,
            token,
            isLoading: false,
            isAuthenticated: true,
            error: null
          });

          return { success: true };
        } catch (error: any) {
          console.error('[AUTH STORE] Erreur de vérification:', error);
          
          const errorMessage = error.response?.data?.error || 
                              error.response?.data?.message || 
                              'Erreur de vérification';
          
          // Si c'est une erreur d'authentification, nettoyer
          if (error.response?.status === 401) {
            localStorage.removeItem('token');
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              error: 'Token invalide ou expiré'
            });
            return { success: false, error: 'Token invalide ou expiré' };
          }

          set({
            isLoading: false,
            error: errorMessage
          });

          return { success: false, error: errorMessage };
        }
      },

      refreshToken: async () => {
        console.log('[AUTH STORE] Tentative de rafraîchissement du token...');
        
        try {
          const response = await apiClient.post('/api/auth/refresh');
          const { token, user } = response.data;
          
          console.log('[AUTH STORE] Token rafraîchi avec succès');
          
          localStorage.setItem('token', token);
          
          set({
            user,
            token,
            isAuthenticated: true,
            error: null
          });

          return { success: true };
        } catch (error: any) {
          console.error('[AUTH STORE] Erreur de rafraîchissement:', error);
          
          const errorMessage = error.response?.data?.error || 
                              error.response?.data?.message || 
                              'Erreur de rafraîchissement';
          
          // Si le refresh échoue, déconnecter
          localStorage.removeItem('token');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            error: errorMessage
          });

          return { success: false, error: errorMessage };
        }
      },

      clearError: () => {
        set({ error: null });
      },

      updateUser: (user: User) => {
        set({ user });
      },

      diagnose: async () => {
        console.log('[AUTH STORE] Diagnostic en cours...');
        return await diagnoseApiIssues();
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

// Fonction utilitaire pour initialiser l'authentification
export const initializeAuth = async () => {
  const { checkAuth } = useAuthStore.getState();
  
  console.log('[AUTH INIT] Initialisation de l\'authentification...');
  
  // Vérifier l'authentification au démarrage
  const result = await checkAuth();
  
  if (result.success) {
    console.log('[AUTH INIT] Utilisateur authentifié');
  } else {
    console.log('[AUTH INIT] Utilisateur non authentifié:', result.error);
  }
  
  return result;
};

// Fonction utilitaire pour tester la connectivité
export const testApiConnectivity = async () => {
  console.log('[AUTH TEST] Test de connectivité API...');
  return await testConnectivity();
};

// Fonction utilitaire pour diagnostiquer les problèmes
export const diagnoseAuthIssues = async () => {
  console.log('[AUTH DIAGNOSTIC] Diagnostic des problèmes d\'authentification...');
  return await diagnoseApiIssues();
};

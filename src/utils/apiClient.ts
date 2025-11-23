// Client API unifié pour toute l'application
import axios from 'axios';

// Configuration de base
const createApiClient = () => {
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4007/api';
  console.log('[API CLIENT] Base URL:', baseURL);
  console.log('[API CLIENT] Environment:', import.meta.env.MODE);
  
  const client = axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Intercepteur de requête pour ajouter le token
  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log(`[API REQUEST] ${config.method?.toUpperCase()} ${config.url} - Token: ${token.substring(0, 20)}...`);
      } else {
        console.log(`[API REQUEST] ${config.method?.toUpperCase()} ${config.url} - No token`);
      }
      return config;
    },
    (error) => {
      console.error('[API REQUEST ERROR]', error);
      return Promise.reject(error);
    }
  );

  // Intercepteur de réponse pour gérer les erreurs
  client.interceptors.response.use(
    (response) => {
      console.log(`[API RESPONSE] ${response.status} ${response.config.url}`, response.data);
      
      // Vérifier si la réponse contient une erreur
      if (response.data && response.data.success === false) {
        console.error('[API ERROR]', response.data.error);
        throw new Error(response.data.error || 'Erreur API');
      }
      
      // Gérer le refresh de token
      if (response.headers['new-token']) {
        console.log('[API] Nouveau token reçu, mise à jour...');
        localStorage.setItem('token', response.headers['new-token']);
      }
      
      return response;
    },
    (error) => {
      console.error('[API RESPONSE ERROR]', error.response?.status, error.response?.data);
      
      // Gérer les erreurs spécifiques
      if (error.response?.status === 401) {
        console.error('[API] Token expiré ou invalide');
        localStorage.removeItem('token');
        // Rediriger vers la page de connexion
        window.location.href = '/login';
      } else if (error.response?.status === 403) {
        console.error('[API] Accès refusé');
      } else if (error.response?.status === 404) {
        console.error('[API] Ressource non trouvée');
      } else if (error.response?.status >= 500) {
        console.error('[API] Erreur serveur');
      }
      
      return Promise.reject(error);
    }
  );

  return client;
};

// Instance unique de l'API client
export const apiClient = createApiClient();

// Fonctions utilitaires pour les appels API courants
export const apiUtils = {
  // GET avec gestion d'erreur
  async get<T>(url: string): Promise<T> {
    try {
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error(`[API GET ERROR] ${url}:`, error);
      throw error;
    }
  },

  // POST avec gestion d'erreur
  async post<T>(url: string, data: any): Promise<T> {
    try {
      const response = await apiClient.post(url, data);
      return response.data;
    } catch (error) {
      console.error(`[API POST ERROR] ${url}:`, error);
      throw error;
    }
  },

  // PUT avec gestion d'erreur
  async put<T>(url: string, data: any): Promise<T> {
    try {
      const response = await apiClient.put(url, data);
      return response.data;
    } catch (error) {
      console.error(`[API PUT ERROR] ${url}:`, error);
      throw error;
    }
  },

  // PATCH avec gestion d'erreur
  async patch<T>(url: string, data: any): Promise<T> {
    try {
      const response = await apiClient.patch(url, data);
      return response.data;
    } catch (error) {
      console.error(`[API PATCH ERROR] ${url}:`, error);
      throw error;
    }
  },

  // DELETE avec gestion d'erreur
  async delete<T>(url: string): Promise<T> {
    try {
      const response = await apiClient.delete(url);
      return response.data;
    } catch (error) {
      console.error(`[API DELETE ERROR] ${url}:`, error);
      throw error;
    }
  }
};

// Export par défaut pour compatibilité
export default apiClient;

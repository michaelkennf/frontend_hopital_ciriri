// Configuration Axios avec refresh automatique des tokens
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import TokenManager from './tokenManager';

// Instance Axios configurée avec refresh automatique
const axiosWithTokenRefresh = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://polycliniquedesapotres-backend.onrender.com',
  timeout: 30000,
});

// Intercepteur pour les requêtes
axiosWithTokenRefresh.interceptors.request.use(
  async (config: AxiosRequestConfig) => {
    try {
      // S'assurer que le token est valide avant chaque requête
      const validToken = await TokenManager.ensureValidToken();
      
      if (validToken) {
        config.headers = {
          ...config.headers,
          'Authorization': `Bearer ${validToken}`
        };
        console.log('[AXIOS] Token ajouté à la requête:', validToken.substring(0, 20) + '...');
      }
      
      return config;
    } catch (error) {
      console.error('[AXIOS] Erreur lors de la préparation de la requête:', error);
      return config;
    }
  },
  (error) => {
    console.error('[AXIOS] Erreur dans l\'intercepteur de requête:', error);
    return Promise.reject(error);
  }
);

// Intercepteur pour les réponses
axiosWithTokenRefresh.interceptors.response.use(
  (response: AxiosResponse) => {
    // Vérifier si un nouveau token a été fourni
    const newToken = response.data.newToken || response.headers['x-new-token'];
    
    if (newToken) {
      console.log('[AXIOS] Nouveau token reçu dans la réponse');
      TokenManager.setToken(newToken);
      
      // Supprimer le token de la réponse pour éviter qu'il soit affiché
      if (response.data.newToken) {
        delete response.data.newToken;
        delete response.data.tokenRefreshed;
      }
    }
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Si l'erreur est 401/403 et qu'on n'a pas déjà tenté de rafraîchir
    if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
      originalRequest._retry = true;
      
      console.log('[AXIOS] Token expiré, tentative de refresh...');
      
      try {
        const newToken = await TokenManager.refreshToken();
        
        if (newToken) {
          console.log('[AXIOS] Token rafraîchi, nouvelle tentative de la requête');
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          return axiosWithTokenRefresh(originalRequest);
        }
      } catch (refreshError) {
        console.error('[AXIOS] Échec du refresh du token:', refreshError);
        // Rediriger vers la page de connexion
        TokenManager.removeToken();
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosWithTokenRefresh;

// Configuration Axios corrigée pour éviter les erreurs d'URL
import axios from 'axios';

// Configuration de l'API avec gestion des environnements
const getApiConfig = () => {
  // Vérifier d'abord les variables d'environnement
  const viteApiUrl = import.meta.env.VITE_API_URL;
  const isProd = import.meta.env.PROD;
  const isDev = import.meta.env.DEV;
  
  console.log('[AXIOS CONFIG FIXED] Environment:', {
    mode: import.meta.env.MODE,
    prod: isProd,
    dev: isDev,
    viteApiUrl: viteApiUrl
  });
  
  // URL par défaut selon l'environnement
  const defaultUrl = isProd 
    ? 'https://polycliniquedesapotres-backend.onrender.com'
    : 'http://localhost:5000';
  
  // Utiliser VITE_API_URL si disponible, sinon l'URL par défaut
  const baseURL = viteApiUrl || defaultUrl;
  
  console.log('[AXIOS CONFIG FIXED] Base URL:', baseURL);
  console.log('[AXIOS CONFIG FIXED] Source:', viteApiUrl ? 'VITE_API_URL' : 'default');
  
  return {
    baseURL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json'
    }
  };
};

// Créer une instance Axios configurée
const apiClient = axios.create(getApiConfig());

// Intercepteur de requête pour ajouter le token et logger
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('[AXIOS REQUEST FIXED] URL:', config.url);
    console.log('[AXIOS REQUEST FIXED] Base URL:', config.baseURL);
    console.log('[AXIOS REQUEST FIXED] URL complète:', `${config.baseURL}${config.url}`);
    console.log('[AXIOS REQUEST FIXED] Token présent:', !!token);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('[AXIOS REQUEST FIXED] Erreur:', error);
    return Promise.reject(error);
  }
);

// Intercepteur de réponse pour gérer les erreurs
apiClient.interceptors.response.use(
  (response) => {
    console.log('[AXIOS RESPONSE FIXED] Succès:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('[AXIOS RESPONSE FIXED] Erreur:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      fullURL: error.config ? `${error.config.baseURL}${error.config.url}` : 'unknown',
      message: error.message,
      data: error.response?.data
    });

    // Gestion spécifique des erreurs d'URL
    if (error.response?.data && typeof error.response.data === 'string' && error.response.data.includes('<!doctype html>')) {
      console.error('[AXIOS RESPONSE FIXED] ERREUR: L\'API retourne du HTML au lieu de JSON');
      console.error('[AXIOS RESPONSE FIXED] Cela indique que l\'URL pointe vers le frontend au lieu du backend');
      console.error('[AXIOS RESPONSE FIXED] URL utilisée:', error.config ? `${error.config.baseURL}${error.config.url}` : 'unknown');
      
      // Créer une erreur personnalisée
      const customError = new Error('URL API incorrecte - Le backend n\'est pas accessible');
      customError.name = 'ApiUrlError';
      customError.details = {
        originalError: error,
        url: error.config ? `${error.config.baseURL}${error.config.url}` : 'unknown',
        responseData: error.response?.data
      };
      return Promise.reject(customError);
    }

    // Gestion des erreurs d'authentification
    if (error.response?.status === 401) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message;
      console.warn('[AXIOS RESPONSE FIXED] Erreur 401 détectée:', errorMessage);
      
      if (errorMessage && (
        errorMessage.includes('Token invalide') || 
        errorMessage.includes('Token expiré') ||
        errorMessage.includes('Token expired') ||
        errorMessage.includes('Invalid token')
      )) {
        console.warn('[AXIOS RESPONSE FIXED] Suppression du token invalide');
        localStorage.removeItem('token');
        
        if (!window.location.pathname.includes('/login')) {
          console.warn('[AXIOS RESPONSE FIXED] Redirection vers la page de connexion');
          window.location.href = '/login';
        }
      }
    }

    // Gestion des erreurs de réseau
    if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
      console.error('[AXIOS RESPONSE FIXED] Erreur de réseau détectée');
    }

    return Promise.reject(error);
  }
);

// Fonction pour tester la connectivité
export const testConnectivity = async () => {
  try {
    console.log('[CONNECTIVITY TEST FIXED] Test de connectivité...');
    const response = await apiClient.get('/api/health');
    console.log('[CONNECTIVITY TEST FIXED] Succès:', response.status);
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('[CONNECTIVITY TEST FIXED] Échec:', error.message);
    return { success: false, error: error.message };
  }
};

// Fonction pour tester l'authentification
export const testAuth = async () => {
  try {
    console.log('[AUTH TEST FIXED] Test d\'authentification...');
    const response = await apiClient.get('/api/auth/me');
    console.log('[AUTH TEST FIXED] Succès:', response.data);
    return { success: true, user: response.data };
  } catch (error: any) {
    console.error('[AUTH TEST FIXED] Échec:', error.response?.status, error.response?.data);
    return { 
      success: false, 
      status: error.response?.status,
      error: error.response?.data?.error || error.message 
    };
  }
};

// Fonction pour diagnostiquer les problèmes
export const diagnoseApiIssues = async () => {
  const diagnostics = {
    environment: import.meta.env.MODE,
    baseURL: apiClient.defaults.baseURL,
    hasToken: !!localStorage.getItem('token'),
    tokenLength: localStorage.getItem('token')?.length || 0,
    timestamp: new Date().toISOString()
  };

  console.log('[DIAGNOSTIC FIXED] Informations de base:', diagnostics);

  // Test de connectivité
  const connectivity = await testConnectivity();
  diagnostics.connectivity = connectivity;

  // Test d'authentification
  const auth = await testAuth();
  diagnostics.auth = auth;

  console.log('[DIAGNOSTIC FIXED] Résultats complets:', diagnostics);
  return diagnostics;
};

// Fonction pour vérifier l'URL de l'API
export const checkApiUrl = () => {
  const config = getApiConfig();
  const expectedUrl = import.meta.env.PROD 
    ? 'https://polycliniquedesapotres-backend.onrender.com'
    : 'http://localhost:5000';
  
  return {
    current: config.baseURL,
    expected: expectedUrl,
    correct: config.baseURL === expectedUrl,
    source: import.meta.env.VITE_API_URL ? 'VITE_API_URL' : 'default'
  };
};

export default apiClient;

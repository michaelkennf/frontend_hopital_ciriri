// Configuration Axios optimisée pour la production
import axios from 'axios';

// Détection de l'environnement
const isProduction = () => {
  return import.meta.env.PROD || 
         window.location.hostname.includes('pages.dev') || 
         window.location.hostname.includes('cloudflare') ||
         window.location.hostname.includes('onrender.com');
};

// Configuration de l'API avec gestion spécifique production
const getApiConfig = () => {
  const isProd = isProduction();
  const viteApiUrl = import.meta.env.VITE_API_URL;
  
  console.log('[AXIOS PRODUCTION] Environnement:', {
    mode: import.meta.env.MODE,
    prod: import.meta.env.PROD,
    isProduction: isProd,
    hostname: window.location.hostname,
    viteApiUrl: viteApiUrl
  });
  
  // URL par défaut selon l'environnement
  const defaultUrl = isProd 
    ? 'https://polycliniquedesapotres-backend.onrender.com'
    : 'http://localhost:5000';
  
  // Utiliser VITE_API_URL si disponible, sinon l'URL par défaut
  const baseURL = viteApiUrl || defaultUrl;
  
  console.log('[AXIOS PRODUCTION] Configuration:', {
    baseURL,
    source: viteApiUrl ? 'VITE_API_URL' : 'default',
    isProduction: isProd
  });
  
  return {
    baseURL,
    timeout: isProd ? 30000 : 10000, // Timeout plus long en production
    headers: {
      'Content-Type': 'application/json'
    }
  };
};

// Créer une instance Axios configurée
const apiClient = axios.create(getApiConfig());

// Intercepteur de requête optimisé pour la production
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const isProd = isProduction();
    
    console.log('[AXIOS PRODUCTION REQUEST]', {
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      hasToken: !!token,
      isProduction: isProd,
      timestamp: new Date().toISOString()
    });
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Ajouter des headers spécifiques à la production
    if (isProd) {
      config.headers['X-Requested-With'] = 'XMLHttpRequest';
      config.headers['Cache-Control'] = 'no-cache';
    }
    
    return config;
  },
  (error) => {
    console.error('[AXIOS PRODUCTION REQUEST] Erreur:', error);
    return Promise.reject(error);
  }
);

// Intercepteur de réponse optimisé pour la production
apiClient.interceptors.response.use(
  (response) => {
    const isProd = isProduction();
    console.log('[AXIOS PRODUCTION RESPONSE] Succès:', {
      status: response.status,
      url: response.config.url,
      isProduction: isProd,
      dataLength: JSON.stringify(response.data).length
    });
    return response;
  },
  (error) => {
    const isProd = isProduction();
    console.error('[AXIOS PRODUCTION RESPONSE] Erreur:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      fullURL: error.config ? `${error.config.baseURL}${error.config.url}` : 'unknown',
      message: error.message,
      isProduction: isProd,
      data: error.response?.data
    });

    // Gestion spécifique des erreurs de production
    if (isProd) {
      // Gestion des erreurs de réseau en production
      if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        console.error('[AXIOS PRODUCTION] Erreur de réseau détectée');
        const networkError = new Error('Erreur de connexion. Vérifiez votre connexion internet.');
        networkError.name = 'NetworkError';
        return Promise.reject(networkError);
      }
      
      // Gestion des erreurs de timeout en production
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        console.error('[AXIOS PRODUCTION] Timeout détecté');
        const timeoutError = new Error('Délai d\'attente dépassé. Veuillez réessayer.');
        timeoutError.name = 'TimeoutError';
        return Promise.reject(timeoutError);
      }
    }

    // Gestion des erreurs d'URL (HTML au lieu de JSON)
    if (error.response?.data && typeof error.response.data === 'string' && error.response.data.includes('<!doctype html>')) {
      console.error('[AXIOS PRODUCTION] ERREUR: L\'API retourne du HTML au lieu de JSON');
      console.error('[AXIOS PRODUCTION] URL utilisée:', error.config ? `${error.config.baseURL}${error.config.url}` : 'unknown');
      
      const urlError = new Error('Configuration API incorrecte - Le backend n\'est pas accessible');
      urlError.name = 'ApiUrlError';
      urlError.details = {
        originalError: error,
        url: error.config ? `${error.config.baseURL}${error.config.url}` : 'unknown',
        responseData: error.response?.data
      };
      return Promise.reject(urlError);
    }

    // Gestion des erreurs d'authentification
    if (error.response?.status === 401) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message;
      console.warn('[AXIOS PRODUCTION] Erreur 401 détectée:', errorMessage);
      
      if (errorMessage && (
        errorMessage.includes('Token invalide') || 
        errorMessage.includes('Token expiré') ||
        errorMessage.includes('Token expired') ||
        errorMessage.includes('Invalid token')
      )) {
        console.warn('[AXIOS PRODUCTION] Suppression du token invalide');
        localStorage.removeItem('token');
        
        if (!window.location.pathname.includes('/login')) {
          console.warn('[AXIOS PRODUCTION] Redirection vers la page de connexion');
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

// Fonction pour tester la connectivité en production
export const testProductionConnectivity = async () => {
  try {
    console.log('[PRODUCTION CONNECTIVITY] Test de connectivité...');
    const response = await apiClient.get('/api/health');
    console.log('[PRODUCTION CONNECTIVITY] Succès:', response.status);
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('[PRODUCTION CONNECTIVITY] Échec:', error.message);
    return { success: false, error: error.message };
  }
};

// Fonction pour tester l'authentification en production
export const testProductionAuth = async () => {
  try {
    console.log('[PRODUCTION AUTH] Test d\'authentification...');
    const response = await apiClient.get('/api/auth/me');
    console.log('[PRODUCTION AUTH] Succès:', response.data);
    return { success: true, user: response.data };
  } catch (error: any) {
    console.error('[PRODUCTION AUTH] Échec:', error.response?.status, error.response?.data);
    return { 
      success: false, 
      status: error.response?.status,
      error: error.response?.data?.error || error.message 
    };
  }
};

// Fonction pour diagnostiquer les problèmes de production
export const diagnoseProductionIssues = async () => {
  const diagnostics = {
    environment: {
      mode: import.meta.env.MODE,
      prod: import.meta.env.PROD,
      isProduction: isProduction(),
      hostname: window.location.hostname,
      baseURL: apiClient.defaults.baseURL
    },
    hasToken: !!localStorage.getItem('token'),
    tokenLength: localStorage.getItem('token')?.length || 0,
    timestamp: new Date().toISOString()
  };

  console.log('[PRODUCTION DIAGNOSTIC] Informations de base:', diagnostics);

  // Test de connectivité
  const connectivity = await testProductionConnectivity();
  diagnostics.connectivity = connectivity;

  // Test d'authentification
  const auth = await testProductionAuth();
  diagnostics.auth = auth;

  console.log('[PRODUCTION DIAGNOSTIC] Résultats complets:', diagnostics);
  return diagnostics;
};

// Fonction pour vérifier la configuration de production
export const checkProductionConfig = () => {
  const isProd = isProduction();
  const expectedUrl = 'https://polycliniquedesapotres-backend.onrender.com';
  const actualUrl = apiClient.defaults.baseURL;
  
  return {
    isProduction: isProd,
    expectedUrl,
    actualUrl,
    correct: actualUrl === expectedUrl,
    source: import.meta.env.VITE_API_URL ? 'VITE_API_URL' : 'default'
  };
};

export default apiClient;

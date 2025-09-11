// Configuration Axios robuste pour local et production
import axios from 'axios';

// Configuration de l'API avec gestion des environnements
const getApiConfig = () => {
  const baseURL = import.meta.env.VITE_API_URL || 
    (import.meta.env.PROD ? 'https://polycliniquedesapotres-backend.onrender.com' : 'http://localhost:5000');
  
  console.log('[AXIOS CONFIG] Environment:', import.meta.env.MODE);
  console.log('[AXIOS CONFIG] Base URL:', baseURL);
  console.log('[AXIOS CONFIG] VITE_API_URL:', import.meta.env.VITE_API_URL);
  
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

// Intercepteur de requête pour ajouter le token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('[AXIOS REQUEST] URL:', config.url);
    console.log('[AXIOS REQUEST] Token présent:', !!token);
    console.log('[AXIOS REQUEST] Token (premiers caractères):', token ? token.substring(0, 20) + '...' : 'Aucun');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('[AXIOS REQUEST] Erreur:', error);
    return Promise.reject(error);
  }
);

// Intercepteur de réponse pour gérer les erreurs
apiClient.interceptors.response.use(
  (response) => {
    console.log('[AXIOS RESPONSE] Succès:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('[AXIOS RESPONSE] Erreur:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      message: error.message,
      data: error.response?.data
    });

    // Gestion spécifique des erreurs d'authentification
    if (error.response?.status === 401) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message;
      console.warn('[AXIOS RESPONSE] Erreur 401 détectée:', errorMessage);
      
      // Ne supprimer le token que si c'est vraiment une erreur d'authentification
      if (errorMessage && (
        errorMessage.includes('Token invalide') || 
        errorMessage.includes('Token expiré') ||
        errorMessage.includes('Token expired') ||
        errorMessage.includes('Invalid token')
      )) {
        console.warn('[AXIOS RESPONSE] Suppression du token invalide');
        localStorage.removeItem('token');
        
        // Rediriger vers la page de connexion si on n'y est pas déjà
        if (!window.location.pathname.includes('/login')) {
          console.warn('[AXIOS RESPONSE] Redirection vers la page de connexion');
          window.location.href = '/login';
        }
      }
    }

    // Gestion des erreurs de réseau
    if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
      console.error('[AXIOS RESPONSE] Erreur de réseau détectée');
    }

    return Promise.reject(error);
  }
);

// Fonction pour tester la connectivité
export const testConnectivity = async () => {
  try {
    console.log('[CONNECTIVITY TEST] Test de connectivité...');
    const response = await apiClient.get('/api/health');
    console.log('[CONNECTIVITY TEST] Succès:', response.status);
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('[CONNECTIVITY TEST] Échec:', error.message);
    return { success: false, error: error.message };
  }
};

// Fonction pour tester l'authentification
export const testAuth = async () => {
  try {
    console.log('[AUTH TEST] Test d\'authentification...');
    const response = await apiClient.get('/api/auth/me');
    console.log('[AUTH TEST] Succès:', response.data);
    return { success: true, user: response.data };
  } catch (error: any) {
    console.error('[AUTH TEST] Échec:', error.response?.status, error.response?.data);
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

  console.log('[DIAGNOSTIC] Informations de base:', diagnostics);

  // Test de connectivité
  const connectivity = await testConnectivity();
  diagnostics.connectivity = connectivity;

  // Test d'authentification
  const auth = await testAuth();
  diagnostics.auth = auth;

  console.log('[DIAGNOSTIC] Résultats complets:', diagnostics);
  return diagnostics;
};

export default apiClient;

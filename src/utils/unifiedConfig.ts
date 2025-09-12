// Configuration unifiée pour local et production
import axios from 'axios';

// Détection de l'environnement
const getEnvironment = () => {
  const isProd = import.meta.env.PROD || 
    window.location.hostname.includes('pages.dev') || 
    window.location.hostname.includes('cloudflare') ||
    window.location.hostname.includes('onrender.com');
  
  const isLocal = import.meta.env.DEV || 
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '0.0.0.0';
  
  return {
    isProduction: isProd,
    isLocal,
    mode: import.meta.env.MODE,
    hostname: window.location.hostname
  };
};

// Configuration de l'API unifiée
const getUnifiedApiConfig = () => {
  const env = getEnvironment();
  const viteApiUrl = import.meta.env.VITE_API_URL;
  
  // URL par défaut selon l'environnement
  const defaultUrl = env.isProduction 
    ? 'https://polycliniquedesapotres-backend.onrender.com'
    : 'http://localhost:5000';
  
  // Utiliser VITE_API_URL si disponible, sinon l'URL par défaut
  const baseURL = viteApiUrl || defaultUrl;
  
  console.log('[UNIFIED CONFIG] Configuration:', {
    environment: env.isProduction ? 'production' : 'local',
    hostname: env.hostname,
    baseURL,
    source: viteApiUrl ? 'VITE_API_URL' : 'default',
    timeout: env.isProduction ? 30000 : 10000
  });
  
  return {
    baseURL,
    timeout: env.isProduction ? 30000 : 10000,
    headers: {
      'Content-Type': 'application/json',
      ...(env.isProduction && {
        'X-Requested-With': 'XMLHttpRequest',
        'Cache-Control': 'no-cache'
      })
    }
  };
};

// Créer une instance Axios unifiée
const apiClient = axios.create(getUnifiedApiConfig());

// Intercepteur de requête unifié
apiClient.interceptors.request.use(
  (config) => {
    const env = getEnvironment();
    const token = localStorage.getItem('token');
    
    console.log('[UNIFIED REQUEST]', {
      environment: env.isProduction ? 'production' : 'local',
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      hasToken: !!token,
      tokenLength: token?.length || 0
    });
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('[UNIFIED REQUEST] Erreur:', error);
    return Promise.reject(error);
  }
);

// Intercepteur de réponse unifié
apiClient.interceptors.response.use(
  (response) => {
    const env = getEnvironment();
    console.log('[UNIFIED RESPONSE] Succès:', {
      environment: env.isProduction ? 'production' : 'local',
      status: response.status,
      url: response.config.url,
      dataLength: JSON.stringify(response.data).length
    });
    return response;
  },
  (error) => {
    const env = getEnvironment();
    console.error('[UNIFIED RESPONSE] Erreur:', {
      environment: env.isProduction ? 'production' : 'local',
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      message: error.message,
      type: error.name
    });

    // Gestion unifiée des erreurs
    if (error.response?.data && typeof error.response.data === 'string' && error.response.data.includes('<!doctype html>')) {
      console.error('[UNIFIED RESPONSE] ERREUR: L\'API retourne du HTML au lieu de JSON');
      const urlError = new Error('Configuration API incorrecte - Le backend n\'est pas accessible');
      urlError.name = 'ApiUrlError';
      return Promise.reject(urlError);
    }

    // Gestion des erreurs d'authentification
    if (error.response?.status === 401) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message;
      if (errorMessage && (
        errorMessage.includes('Token invalide') || 
        errorMessage.includes('Token expiré') ||
        errorMessage.includes('Token expired') ||
        errorMessage.includes('Invalid token')
      )) {
        console.warn('[UNIFIED RESPONSE] Suppression du token invalide');
        localStorage.removeItem('token');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

// Fonction de retry unifiée
const makeRequestWithRetry = async (config: any, maxRetries = 3) => {
  const env = getEnvironment();
  const retryCount = env.isProduction ? maxRetries : 1; // Retry seulement en production
  
  let lastError: any;
  
  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      console.log(`[UNIFIED RETRY] Tentative ${attempt}/${retryCount}...`);
      const response = await apiClient(config);
      console.log(`[UNIFIED RETRY] Succès à la tentative ${attempt}`);
      return response;
    } catch (error: any) {
      lastError = error;
      console.warn(`[UNIFIED RETRY] Échec tentative ${attempt}:`, error.message);
      
      // Si c'est une erreur d'auth, ne pas retry
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw error;
      }
      
      // Attendre avant le prochain essai (seulement en production)
      if (attempt < retryCount && env.isProduction) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.log(`[UNIFIED RETRY] Attente de ${delay}ms avant le prochain essai...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

// Fonction pour tester la connectivité
export const testConnectivity = async () => {
  try {
    console.log('[UNIFIED CONNECTIVITY] Test de connectivité...');
    const response = await makeRequestWithRetry({ method: 'GET', url: '/api/health' });
    console.log('[UNIFIED CONNECTIVITY] Succès:', response.status);
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('[UNIFIED CONNECTIVITY] Échec:', error.message);
    return { success: false, error: error.message };
  }
};

// Fonction pour tester l'authentification
export const testAuth = async () => {
  try {
    console.log('[UNIFIED AUTH] Test d\'authentification...');
    const response = await makeRequestWithRetry({ method: 'GET', url: '/api/auth/me' });
    console.log('[UNIFIED AUTH] Succès:', response.data);
    return { success: true, user: response.data };
  } catch (error: any) {
    console.error('[UNIFIED AUTH] Échec:', error.response?.status, error.response?.data);
    return { 
      success: false, 
      status: error.response?.status,
      error: error.response?.data?.error || error.message 
    };
  }
};

// Fonction pour récupérer les patients
export const fetchPatients = async () => {
  try {
    console.log('[UNIFIED PATIENTS] Récupération des patients...');
    const response = await makeRequestWithRetry({ method: 'GET', url: '/api/patients' });
    console.log('[UNIFIED PATIENTS] Succès:', response.data.patients?.length || 0, 'patients');
    return { 
      success: true, 
      patients: response.data.patients || [],
      count: response.data.patients?.length || 0 
    };
  } catch (error: any) {
    console.error('[UNIFIED PATIENTS] Échec:', error.message);
    return { 
      success: false, 
      error: error.message,
      patients: [],
      count: 0 
    };
  }
};

// Fonction pour récupérer les factures
export const fetchInvoices = async () => {
  try {
    console.log('[UNIFIED INVOICES] Récupération des factures...');
    const response = await makeRequestWithRetry({ method: 'GET', url: '/api/invoices' });
    console.log('[UNIFIED INVOICES] Succès:', response.data.invoices?.length || 0, 'factures');
    return { 
      success: true, 
      invoices: response.data.invoices || [],
      count: response.data.invoices?.length || 0 
    };
  } catch (error: any) {
    console.error('[UNIFIED INVOICES] Échec:', error.message);
    return { 
      success: false, 
      error: error.message,
      invoices: [],
      count: 0 
    };
  }
};

// Fonction pour créer un patient
export const createPatient = async (patientData: any) => {
  try {
    console.log('[UNIFIED CREATE] Création d\'un patient...');
    const response = await makeRequestWithRetry({ 
      method: 'POST', 
      url: '/api/patients',
      data: patientData
    });
    console.log('[UNIFIED CREATE] Succès:', response.data);
    return { success: true, patient: response.data };
  } catch (error: any) {
    console.error('[UNIFIED CREATE] Échec:', error.message);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

// Fonction pour diagnostiquer les problèmes
export const diagnoseIssues = async () => {
  const env = getEnvironment();
  const diagnostics = {
    environment: env,
    baseURL: apiClient.defaults.baseURL,
    hasToken: !!localStorage.getItem('token'),
    tokenLength: localStorage.getItem('token')?.length || 0,
    timestamp: new Date().toISOString()
  };

  console.log('[UNIFIED DIAGNOSTIC] Informations de base:', diagnostics);

  // Test de connectivité
  const connectivity = await testConnectivity();
  diagnostics.connectivity = connectivity;

  // Test d'authentification
  const auth = await testAuth();
  diagnostics.auth = auth;

  // Test des patients
  const patients = await fetchPatients();
  diagnostics.patients = patients;

  // Test des factures
  const invoices = await fetchInvoices();
  diagnostics.invoices = invoices;

  console.log('[UNIFIED DIAGNOSTIC] Résultats complets:', diagnostics);
  return diagnostics;
};

export default apiClient;

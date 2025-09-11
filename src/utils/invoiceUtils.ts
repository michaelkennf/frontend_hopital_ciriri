// Utilitaires pour la gestion des factures avec compatibilité local/production
import axios from 'axios';

// Configuration de l'API avec gestion des environnements
const getApiConfig = () => {
  const baseURL = import.meta.env.VITE_API_URL || 
    (import.meta.env.PROD ? 'https://polycliniquedesapotres-backend.onrender.com' : 'http://localhost:5000');
  
  return {
    baseURL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json'
    }
  };
};

// Fonction robuste pour récupérer les factures
export const fetchInvoices = async (patientId?: string) => {
  try {
    console.log('[INVOICE UTILS] Début de la récupération des factures...');
    
    const token = localStorage.getItem('token');
    const config = getApiConfig();
    
    console.log('[INVOICE UTILS] Configuration:', {
      baseURL: config.baseURL,
      hasToken: !!token,
      patientId: patientId || 'tous'
    });

    // Construire l'URL
    let url = `${config.baseURL}/api/invoices`;
    if (patientId) {
      url += `?patientId=${patientId}`;
    }

    console.log('[INVOICE UTILS] URL complète:', url);

    // Configuration de la requête
    const requestConfig = {
      ...config,
      url,
      method: 'GET',
      headers: {
        ...config.headers,
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    };

    // Faire la requête avec retry automatique
    const response = await makeRequestWithRetry(requestConfig);
    
    console.log('[INVOICE UTILS] Réponse reçue:', {
      status: response.status,
      statusText: response.statusText,
      dataLength: response.data?.invoices?.length || 0
    });

    if (response.status === 200) {
      return {
        success: true,
        invoices: response.data.invoices || [],
        total: response.data.total || 0
      };
    } else {
      return {
        success: false,
        error: response.data?.error || `Erreur ${response.status}: ${response.statusText}`,
        invoices: []
      };
    }

  } catch (error: any) {
    console.error('[INVOICE UTILS] Erreur lors de la récupération des factures:', error);
    
    // Gestion spécifique des erreurs
    if (error.response?.status === 401 || error.response?.status === 403) {
      return {
        success: false,
        error: 'Token expiré ou invalide. Veuillez vous reconnecter.',
        invoices: [],
        requiresAuth: true
      };
    } else if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
      return {
        success: false,
        error: 'Erreur de connexion. Vérifiez votre connexion internet.',
        invoices: [],
        networkError: true
      };
    } else {
      return {
        success: false,
        error: error.message || 'Erreur inconnue lors de la récupération des factures',
        invoices: []
      };
    }
  }
};

// Fonction pour faire une requête avec retry automatique
const makeRequestWithRetry = async (config: any, maxRetries = 3) => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[INVOICE UTILS] Tentative ${attempt}/${maxRetries}...`);
      
      const response = await axios(config);
      console.log(`[INVOICE UTILS] Succès à la tentative ${attempt}`);
      return response;
      
    } catch (error: any) {
      lastError = error;
      console.warn(`[INVOICE UTILS] Échec tentative ${attempt}:`, error.message);
      
      // Si c'est une erreur d'auth, ne pas retry
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw error;
      }
      
      // Attendre avant le prochain essai
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.log(`[INVOICE UTILS] Attente de ${delay}ms avant le prochain essai...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

// Fonction pour récupérer les détails d'une facture
export const fetchInvoiceDetails = async (invoiceId: number) => {
  try {
    const token = localStorage.getItem('token');
    const config = getApiConfig();
    
    const response = await axios({
      ...config,
      url: `${config.baseURL}/api/invoices/${invoiceId}`,
      method: 'GET',
      headers: {
        ...config.headers,
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });

    return {
      success: true,
      invoice: response.data
    };
  } catch (error: any) {
    console.error('[INVOICE UTILS] Erreur lors de la récupération des détails:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message,
      invoice: null
    };
  }
};

// Fonction pour mettre à jour une facture
export const updateInvoice = async (invoiceId: number, updates: any) => {
  try {
    const token = localStorage.getItem('token');
    const config = getApiConfig();
    
    const response = await axios({
      ...config,
      url: `${config.baseURL}/api/invoices/${invoiceId}`,
      method: 'PUT',
      data: updates,
      headers: {
        ...config.headers,
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });

    return {
      success: true,
      invoice: response.data
    };
  } catch (error: any) {
    console.error('[INVOICE UTILS] Erreur lors de la mise à jour:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
};

// Fonction pour diagnostiquer les problèmes de factures
export const diagnoseInvoiceIssues = async () => {
  const diagnostics = {
    environment: import.meta.env.MODE,
    apiUrl: import.meta.env.VITE_API_URL,
    hasToken: !!localStorage.getItem('token'),
    tokenLength: localStorage.getItem('token')?.length || 0,
    timestamp: new Date().toISOString()
  };

  console.log('[INVOICE UTILS] Diagnostic:', diagnostics);

  // Test de connectivité
  try {
    const config = getApiConfig();
    const response = await axios.get(`${config.baseURL}/api/health`);
    diagnostics.healthCheck = {
      success: true,
      status: response.status,
      data: response.data
    };
  } catch (error: any) {
    diagnostics.healthCheck = {
      success: false,
      error: error.message,
      status: error.response?.status
    };
  }

  return diagnostics;
};

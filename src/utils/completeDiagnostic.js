// Diagnostic complet pour identifier toutes les différences local vs production
console.log('🔍 Diagnostic Complet Local vs Production...');

// 1. Analyser l'environnement complet
const analyzeCompleteEnvironment = () => {
  const env = {
    // Environnement
    mode: import.meta.env.MODE,
    prod: import.meta.env.PROD,
    dev: import.meta.env.DEV,
    
    // URLs
    viteApiUrl: import.meta.env.VITE_API_URL,
    baseUrl: window.location.origin,
    hostname: window.location.hostname,
    protocol: window.location.protocol,
    
    // Navigateur
    userAgent: navigator.userAgent,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    
    // Timestamp
    timestamp: new Date().toISOString(),
    localTime: new Date().toLocaleString()
  };
  
  const isProduction = env.prod || 
    env.hostname.includes('pages.dev') || 
    env.hostname.includes('cloudflare') ||
    env.hostname.includes('onrender.com');
  
  const isLocal = env.dev || 
    env.hostname === 'localhost' || 
    env.hostname === '127.0.0.1' ||
    env.hostname === '0.0.0.0';
  
  console.log('🌍 Environnement complet:', env);
  console.log('🏠 Local détecté:', isLocal);
  console.log('🌐 Production détectée:', isProduction);
  
  return { env, isProduction, isLocal };
};

// 2. Vérifier la configuration de l'API
const checkApiConfiguration = () => {
  const env = analyzeCompleteEnvironment();
  const expectedApiUrl = env.isProduction 
    ? 'https://polycliniquedesapotres-backend.onrender.com'
    : 'http://localhost:5000';
  
  const actualApiUrl = env.env.viteApiUrl || expectedApiUrl;
  
  console.log('⚙️ Configuration API:');
  console.log('  Environnement:', env.isProduction ? 'Production' : 'Local');
  console.log('  URL attendue:', expectedApiUrl);
  console.log('  URL actuelle:', actualApiUrl);
  console.log('  Correct:', actualApiUrl === expectedApiUrl);
  console.log('  Source:', env.env.viteApiUrl ? 'VITE_API_URL' : 'default');
  
  return {
    environment: env.isProduction ? 'production' : 'local',
    expected: expectedApiUrl,
    actual: actualApiUrl,
    correct: actualApiUrl === expectedApiUrl,
    source: env.env.viteApiUrl ? 'VITE_API_URL' : 'default'
  };
};

// 3. Tester la connectivité backend
const testBackendConnectivity = async () => {
  try {
    const config = checkApiConfiguration();
    console.log('🔗 Test de connectivité backend...');
    
    const startTime = Date.now();
    const response = await fetch(`${config.actual}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log('📡 Statut backend:', response.status);
    console.log('⏱️ Temps de réponse:', responseTime + 'ms');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend accessible:', data);
      return { 
        success: true, 
        data, 
        responseTime,
        status: response.status 
      };
    } else {
      const text = await response.text();
      console.log('❌ Backend inaccessible:', response.status, text);
      return { 
        success: false, 
        status: response.status, 
        error: text,
        responseTime 
      };
    }
  } catch (error) {
    console.error('❌ Erreur de connectivité backend:', error);
    return { 
      success: false, 
      error: error.message,
      type: error.name 
    };
  }
};

// 4. Tester l'authentification
const testAuthentication = async () => {
  try {
    const config = checkApiConfiguration();
    const token = localStorage.getItem('token');
    
    console.log('🔐 Test d\'authentification...');
    console.log('  Token présent:', !!token);
    console.log('  Longueur token:', token?.length || 0);
    console.log('  Token (début):', token ? token.substring(0, 30) + '...' : 'Aucun');
    
    if (!token) {
      console.log('❌ Aucun token trouvé');
      return { success: false, error: 'Aucun token' };
    }
    
    const startTime = Date.now();
    const response = await fetch(`${config.actual}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log('📡 Statut auth:', response.status);
    console.log('⏱️ Temps de réponse:', responseTime + 'ms');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Authentification réussie:', data);
      return { 
        success: true, 
        user: data, 
        responseTime,
        status: response.status 
      };
    } else {
      const text = await response.text();
      console.log('❌ Authentification échouée:', response.status, text);
      return { 
        success: false, 
        status: response.status, 
        error: text,
        responseTime 
      };
    }
  } catch (error) {
    console.error('❌ Erreur d\'authentification:', error);
    return { 
      success: false, 
      error: error.message,
      type: error.name 
    };
  }
};

// 5. Tester l'API des patients
const testPatientsApi = async () => {
  try {
    const config = checkApiConfiguration();
    const token = localStorage.getItem('token');
    
    console.log('👥 Test de l\'API des patients...');
    
    const startTime = Date.now();
    const response = await fetch(`${config.actual}/api/patients`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log('📡 Statut patients:', response.status);
    console.log('⏱️ Temps de réponse:', responseTime + 'ms');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Patients accessibles:', data.patients?.length || 0, 'patients');
      return { 
        success: true, 
        data, 
        count: data.patients?.length || 0,
        responseTime,
        status: response.status 
      };
    } else {
      const text = await response.text();
      console.log('❌ Patients inaccessibles:', response.status, text);
      return { 
        success: false, 
        status: response.status, 
        error: text,
        responseTime 
      };
    }
  } catch (error) {
    console.error('❌ Erreur API patients:', error);
    return { 
      success: false, 
      error: error.message,
      type: error.name 
    };
  }
};

// 6. Tester l'API des factures
const testInvoicesApi = async () => {
  try {
    const config = checkApiConfiguration();
    const token = localStorage.getItem('token');
    
    console.log('📋 Test de l\'API des factures...');
    
    const startTime = Date.now();
    const response = await fetch(`${config.actual}/api/invoices`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log('📡 Statut factures:', response.status);
    console.log('⏱️ Temps de réponse:', responseTime + 'ms');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Factures accessibles:', data.invoices?.length || 0, 'factures');
      return { 
        success: true, 
        data, 
        count: data.invoices?.length || 0,
        responseTime,
        status: response.status 
      };
    } else {
      const text = await response.text();
      console.log('❌ Factures inaccessibles:', response.status, text);
      return { 
        success: false, 
        status: response.status, 
        error: text,
        responseTime 
      };
    }
  } catch (error) {
    console.error('❌ Erreur API factures:', error);
    return { 
      success: false, 
      error: error.message,
      type: error.name 
    };
  }
};

// 7. Tester la création d'un patient
const testPatientCreation = async () => {
  try {
    const config = checkApiConfiguration();
    const token = localStorage.getItem('token');
    
    console.log('➕ Test de création d\'un patient...');
    
    const testPatient = {
      firstName: 'Test',
      lastName: 'Diagnostic',
      sexe: 'M',
      dateNaissance: '1990-01-01',
      poids: 70,
      adresse: 'Adresse test diagnostic',
      telephone: '123456789'
    };
    
    const startTime = Date.now();
    const response = await fetch(`${config.actual}/api/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testPatient)
    });
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log('📡 Statut création:', response.status);
    console.log('⏱️ Temps de réponse:', responseTime + 'ms');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Patient créé:', data);
      return { 
        success: true, 
        data, 
        responseTime,
        status: response.status 
      };
    } else {
      const text = await response.text();
      console.log('❌ Création échouée:', response.status, text);
      return { 
        success: false, 
        status: response.status, 
        error: text,
        responseTime 
      };
    }
  } catch (error) {
    console.error('❌ Erreur création patient:', error);
    return { 
      success: false, 
      error: error.message,
      type: error.name 
    };
  }
};

// 8. Tester la synchronisation des données
const testDataSynchronization = async () => {
  try {
    console.log('🔄 Test de synchronisation des données...');
    
    // Récupérer avant
    const beforePatients = await testPatientsApi();
    if (!beforePatients.success) {
      console.log('❌ Impossible de récupérer les patients avant le test');
      return { success: false, error: 'Impossible de récupérer les patients' };
    }
    
    const beforeCount = beforePatients.count || 0;
    console.log(`📊 Patients avant: ${beforeCount}`);
    
    // Créer un patient
    const createResult = await testPatientCreation();
    if (!createResult.success) {
      console.log('❌ Impossible de créer un patient');
      return { success: false, error: 'Impossible de créer un patient' };
    }
    
    console.log('✅ Patient créé');
    
    // Attendre un peu pour la synchronisation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Récupérer après
    const afterPatients = await testPatientsApi();
    if (!afterPatients.success) {
      console.log('❌ Impossible de récupérer les patients après création');
      return { success: false, error: 'Impossible de récupérer les patients après' };
    }
    
    const afterCount = afterPatients.count || 0;
    console.log(`📊 Patients après: ${afterCount}`);
    
    const synced = afterCount > beforeCount;
    console.log(synced ? '✅ Synchronisation réussie' : '❌ Problème de synchronisation');
    
    return { 
      success: synced, 
      beforeCount, 
      afterCount, 
      synced,
      created: createResult.data 
    };
  } catch (error) {
    console.error('❌ Erreur synchronisation:', error);
    return { 
      success: false, 
      error: error.message,
      type: error.name 
    };
  }
};

// 9. Diagnostic complet
const runCompleteDiagnostic = async () => {
  console.log('🚀 Démarrage du diagnostic complet...');
  
  const results = {
    timestamp: new Date().toISOString(),
    environment: null,
    apiConfig: null,
    backend: null,
    auth: null,
    patients: null,
    invoices: null,
    creation: null,
    synchronization: null
  };
  
  // 1. Analyser l'environnement
  results.environment = analyzeCompleteEnvironment();
  
  // 2. Vérifier la configuration API
  results.apiConfig = checkApiConfiguration();
  
  // 3. Tester le backend
  results.backend = await testBackendConnectivity();
  
  // 4. Tester l'authentification
  results.auth = await testAuthentication();
  
  // 5. Tester l'API des patients
  results.patients = await testPatientsApi();
  
  // 6. Tester l'API des factures
  results.invoices = await testInvoicesApi();
  
  // 7. Tester la création d'un patient
  results.creation = await testPatientCreation();
  
  // 8. Tester la synchronisation
  results.synchronization = await testDataSynchronization();
  
  console.log('📊 Résultats complets:', results);
  
  // Analyse des résultats
  console.log('📈 Analyse des résultats:');
  
  const issues = [];
  
  if (!results.apiConfig.correct) {
    issues.push('Configuration API incorrecte');
  }
  
  if (!results.backend.success) {
    issues.push('Backend inaccessible');
  }
  
  if (!results.auth.success) {
    issues.push('Authentification échouée');
  }
  
  if (!results.patients.success) {
    issues.push('API patients inaccessible');
  }
  
  if (!results.invoices.success) {
    issues.push('API factures inaccessible');
  }
  
  if (!results.creation.success) {
    issues.push('Création de patient échouée');
  }
  
  if (!results.synchronization.success) {
    issues.push('Synchronisation des données échouée');
  }
  
  console.log('🚨 Problèmes identifiés:', issues);
  
  if (issues.length === 0) {
    console.log('✅ Tous les tests sont passés avec succès !');
  } else {
    console.log('❌ Problèmes détectés:', issues.length);
    issues.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue}`);
    });
  }
  
  // Recommandations
  console.log('💡 Recommandations:');
  
  if (issues.includes('Configuration API incorrecte')) {
    console.log('- Vérifiez VITE_API_URL dans wrangler.toml');
    console.log('- Redéployez le frontend');
  }
  
  if (issues.includes('Backend inaccessible')) {
    console.log('- Vérifiez que le backend est démarré sur Render');
    console.log('- Vérifiez l\'URL du backend');
  }
  
  if (issues.includes('Authentification échouée')) {
    console.log('- Reconnectez-vous pour obtenir un nouveau token');
    console.log('- Vérifiez la configuration JWT');
  }
  
  if (issues.includes('Synchronisation des données échouée')) {
    console.log('- Vérifiez la configuration de la base de données');
    console.log('- Vérifiez les migrations Prisma');
  }
  
  return results;
};

// Exporter les fonctions
window.CompleteDiagnostic = {
  analyzeCompleteEnvironment,
  checkApiConfiguration,
  testBackendConnectivity,
  testAuthentication,
  testPatientsApi,
  testInvoicesApi,
  testPatientCreation,
  testDataSynchronization,
  runCompleteDiagnostic
};

// Exécuter automatiquement le diagnostic
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runCompleteDiagnostic);
} else {
  runCompleteDiagnostic();
}

console.log('🔍 Script de diagnostic complet chargé. Utilisez CompleteDiagnostic.runCompleteDiagnostic() pour relancer.');

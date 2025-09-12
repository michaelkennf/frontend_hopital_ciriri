// Diagnostic spécifique pour les différences local vs production
console.log('🔍 Diagnostic Local vs Production...');

// 1. Analyser l'environnement
const analyzeEnvironment = () => {
  const env = {
    mode: import.meta.env.MODE,
    prod: import.meta.env.PROD,
    dev: import.meta.env.DEV,
    viteApiUrl: import.meta.env.VITE_API_URL,
    baseUrl: window.location.origin,
    hostname: window.location.hostname,
    protocol: window.location.protocol,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString()
  };
  
  console.log('🌍 Environnement détecté:', env);
  
  const isProduction = env.prod || env.hostname.includes('pages.dev') || env.hostname.includes('cloudflare');
  const isLocal = env.dev || env.hostname === 'localhost' || env.hostname === '127.0.0.1';
  
  console.log('🏠 Local:', isLocal);
  console.log('🌐 Production:', isProduction);
  
  return { env, isProduction, isLocal };
};

// 2. Vérifier la configuration de l'API
const checkApiConfiguration = () => {
  const env = analyzeEnvironment();
  const expectedApiUrl = env.isProduction 
    ? 'https://polycliniquedesapotres-backend.onrender.com'
    : 'http://localhost:5000';
  
  const actualApiUrl = env.env.viteApiUrl || expectedApiUrl;
  
  console.log('⚙️ Configuration API:');
  console.log('  Attendu:', expectedApiUrl);
  console.log('  Actuel:', actualApiUrl);
  console.log('  Correct:', actualApiUrl === expectedApiUrl);
  
  return {
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
    
    const response = await fetch(`${config.actual}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Statut backend:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend accessible:', data);
      return { success: true, data };
    } else {
      const text = await response.text();
      console.log('❌ Backend inaccessible:', response.status, text);
      return { success: false, status: response.status, error: text };
    }
  } catch (error) {
    console.error('❌ Erreur de connectivité backend:', error);
    return { success: false, error: error.message };
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
    
    if (!token) {
      console.log('❌ Aucun token trouvé');
      return { success: false, error: 'Aucun token' };
    }
    
    const response = await fetch(`${config.actual}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('📡 Statut auth:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Authentification réussie:', data);
      return { success: true, user: data };
    } else {
      const text = await response.text();
      console.log('❌ Authentification échouée:', response.status, text);
      return { success: false, status: response.status, error: text };
    }
  } catch (error) {
    console.error('❌ Erreur d\'authentification:', error);
    return { success: false, error: error.message };
  }
};

// 5. Tester l'API des patients
const testPatientsApi = async () => {
  try {
    const config = checkApiConfiguration();
    const token = localStorage.getItem('token');
    
    console.log('👥 Test de l\'API des patients...');
    
    const response = await fetch(`${config.actual}/api/patients`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('📡 Statut patients:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Patients accessibles:', data.patients?.length || 0, 'patients');
      return { success: true, data, count: data.patients?.length || 0 };
    } else {
      const text = await response.text();
      console.log('❌ Patients inaccessibles:', response.status, text);
      return { success: false, status: response.status, error: text };
    }
  } catch (error) {
    console.error('❌ Erreur API patients:', error);
    return { success: false, error: error.message };
  }
};

// 6. Tester la création d'un patient
const testPatientCreation = async () => {
  try {
    const config = checkApiConfiguration();
    const token = localStorage.getItem('token');
    
    console.log('➕ Test de création d\'un patient...');
    
    const testPatient = {
      firstName: 'Test',
      lastName: 'Production',
      sexe: 'M',
      dateNaissance: '1990-01-01',
      poids: 70,
      adresse: 'Adresse test production',
      telephone: '123456789'
    };
    
    const response = await fetch(`${config.actual}/api/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testPatient)
    });
    
    console.log('📡 Statut création:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Patient créé:', data);
      return { success: true, data };
    } else {
      const text = await response.text();
      console.log('❌ Création échouée:', response.status, text);
      return { success: false, status: response.status, error: text };
    }
  } catch (error) {
    console.error('❌ Erreur création patient:', error);
    return { success: false, error: error.message };
  }
};

// 7. Diagnostic complet
const runProductionDiagnostic = async () => {
  console.log('🚀 Démarrage du diagnostic production...');
  
  const results = {
    timestamp: new Date().toISOString(),
    environment: null,
    apiConfig: null,
    backend: null,
    auth: null,
    patients: null,
    creation: null
  };
  
  // 1. Analyser l'environnement
  results.environment = analyzeEnvironment();
  
  // 2. Vérifier la configuration API
  results.apiConfig = checkApiConfiguration();
  
  // 3. Tester le backend
  results.backend = await testBackendConnectivity();
  
  // 4. Tester l'authentification
  results.auth = await testAuthentication();
  
  // 5. Tester l'API des patients
  results.patients = await testPatientsApi();
  
  // 6. Tester la création d'un patient
  results.creation = await testPatientCreation();
  
  console.log('📊 Résultats complets:', results);
  
  // Recommandations spécifiques à la production
  console.log('💡 Recommandations Production:');
  
  if (!results.environment.isProduction) {
    console.log('- ⚠️ Environnement non détecté comme production');
  } else {
    console.log('- ✅ Environnement de production détecté');
  }
  
  if (!results.apiConfig.correct) {
    console.log('- ❌ Configuration API incorrecte');
    console.log(`  Attendu: ${results.apiConfig.expected}`);
    console.log(`  Actuel: ${results.apiConfig.actual}`);
    console.log('  → Vérifiez VITE_API_URL dans wrangler.toml');
  } else {
    console.log('- ✅ Configuration API correcte');
  }
  
  if (!results.backend.success) {
    console.log('- ❌ Backend inaccessible');
    console.log('  → Vérifiez que le backend est démarré sur Render');
    console.log('  → Vérifiez l\'URL du backend dans Render');
  } else {
    console.log('- ✅ Backend accessible');
  }
  
  if (!results.auth.success) {
    console.log('- ❌ Authentification échouée');
    if (results.auth.status === 401) {
      console.log('  → Token expiré ou invalide, reconnectez-vous');
    } else {
      console.log('  → Problème d\'authentification, vérifiez le backend');
    }
  } else {
    console.log('- ✅ Authentification réussie');
  }
  
  if (!results.patients.success) {
    console.log('- ❌ API patients inaccessible');
    if (results.patients.status === 401) {
      console.log('  → Problème d\'authentification');
    } else if (results.patients.status === 403) {
      console.log('  → Permissions insuffisantes');
    } else {
      console.log('  → Problème avec l\'API des patients');
    }
  } else {
    console.log(`- ✅ API patients accessible (${results.patients.count} patients)`);
  }
  
  if (!results.creation.success) {
    console.log('- ❌ Création de patient échouée');
    console.log('  → Vérifiez les permissions et les données');
  } else {
    console.log('- ✅ Création de patient réussie');
  }
  
  // Solutions spécifiques
  if (results.environment.isProduction) {
    console.log('🔧 Solutions pour la production:');
    console.log('1. Vérifiez que VITE_API_URL est correct dans wrangler.toml');
    console.log('2. Redéployez le frontend avec la bonne configuration');
    console.log('3. Vérifiez que le backend est accessible sur Render');
    console.log('4. Videz le cache du navigateur');
    console.log('5. Reconnectez-vous pour obtenir un nouveau token');
  }
  
  return results;
};

// Exporter les fonctions
window.ProductionDiagnostic = {
  analyzeEnvironment,
  checkApiConfiguration,
  testBackendConnectivity,
  testAuthentication,
  testPatientsApi,
  testPatientCreation,
  runProductionDiagnostic
};

// Exécuter automatiquement le diagnostic
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runProductionDiagnostic);
} else {
  runProductionDiagnostic();
}

console.log('🔍 Script de diagnostic production chargé. Utilisez ProductionDiagnostic.runProductionDiagnostic() pour relancer.');

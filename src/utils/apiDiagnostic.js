// Script de diagnostic pour identifier les problèmes d'URL API
console.log('🔍 Diagnostic de l\'URL API...');

// 1. Vérifier les variables d'environnement
const checkEnvironment = () => {
  const env = {
    mode: import.meta.env.MODE,
    prod: import.meta.env.PROD,
    dev: import.meta.env.DEV,
    viteApiUrl: import.meta.env.VITE_API_URL,
    baseUrl: window.location.origin,
    hostname: window.location.hostname,
    protocol: window.location.protocol
  };
  
  console.log('🌍 Environnement:', env);
  
  const expectedApiUrl = env.prod 
    ? 'https://polycliniquedesapotres-backend.onrender.com'
    : 'http://localhost:5000';
  
  const actualApiUrl = env.viteApiUrl || expectedApiUrl;
  
  console.log('🎯 URL API attendue:', expectedApiUrl);
  console.log('🎯 URL API actuelle:', actualApiUrl);
  console.log('✅ Configuration correcte:', actualApiUrl === expectedApiUrl);
  
  return { env, expectedApiUrl, actualApiUrl, correct: actualApiUrl === expectedApiUrl };
};

// 2. Tester l'URL de l'API
const testApiUrl = async (url) => {
  try {
    console.log(`🔗 Test de l'URL: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📡 Statut: ${response.status}`);
    console.log(`📡 Headers:`, Object.fromEntries(response.headers.entries()));
    
    const contentType = response.headers.get('content-type');
    console.log(`📄 Content-Type: ${contentType}`);
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('✅ Réponse JSON reçue:', data);
      return { success: true, type: 'json', data };
    } else {
      const text = await response.text();
      console.log('❌ Réponse HTML reçue (premiers 200 caractères):', text.substring(0, 200));
      return { success: false, type: 'html', data: text };
    }
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    return { success: false, error: error.message };
  }
};

// 3. Tester l'endpoint de santé
const testHealthEndpoint = async (baseUrl) => {
  try {
    const url = `${baseUrl}/api/health`;
    console.log(`🏥 Test de l'endpoint de santé: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📡 Statut santé: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Endpoint de santé accessible:', data);
      return { success: true, data };
    } else {
      const text = await response.text();
      console.log('❌ Endpoint de santé inaccessible:', response.status, text);
      return { success: false, status: response.status, error: text };
    }
  } catch (error) {
    console.error('❌ Erreur endpoint de santé:', error);
    return { success: false, error: error.message };
  }
};

// 4. Tester l'endpoint des patients
const testPatientsEndpoint = async (baseUrl) => {
  try {
    const url = `${baseUrl}/api/patients`;
    const token = localStorage.getItem('token');
    
    console.log(`👥 Test de l'endpoint patients: ${url}`);
    console.log(`🔑 Token présent: ${!!token}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });
    
    console.log(`📡 Statut patients: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Endpoint patients accessible:', data.patients?.length || 0, 'patients');
      return { success: true, data };
    } else {
      const text = await response.text();
      console.log('❌ Endpoint patients inaccessible:', response.status, text);
      return { success: false, status: response.status, error: text };
    }
  } catch (error) {
    console.error('❌ Erreur endpoint patients:', error);
    return { success: false, error: error.message };
  }
};

// 5. Diagnostic complet
const runApiDiagnostic = async () => {
  console.log('🚀 Démarrage du diagnostic API...');
  
  const results = {
    timestamp: new Date().toISOString(),
    environment: null,
    apiUrlTest: null,
    healthTest: null,
    patientsTest: null
  };
  
  // 1. Vérifier l'environnement
  results.environment = checkEnvironment();
  
  // 2. Tester l'URL de base
  results.apiUrlTest = await testApiUrl(results.environment.actualApiUrl);
  
  // 3. Tester l'endpoint de santé
  results.healthTest = await testHealthEndpoint(results.environment.actualApiUrl);
  
  // 4. Tester l'endpoint des patients
  results.patientsTest = await testPatientsEndpoint(results.environment.actualApiUrl);
  
  console.log('📊 Résultats complets:', results);
  
  // Recommandations
  console.log('💡 Recommandations:');
  
  if (!results.environment.correct) {
    console.log('- ⚠️ Configuration API incorrecte');
    console.log(`  Attendu: ${results.environment.expectedApiUrl}`);
    console.log(`  Actuel: ${results.environment.actualApiUrl}`);
  } else {
    console.log('- ✅ Configuration API correcte');
  }
  
  if (!results.apiUrlTest.success) {
    console.log('- ❌ URL API retourne du HTML au lieu de JSON');
    console.log('  → Vérifiez que l\'URL pointe vers le backend, pas le frontend');
  } else {
    console.log('- ✅ URL API accessible');
  }
  
  if (!results.healthTest.success) {
    console.log('- ❌ Endpoint de santé inaccessible');
    console.log('  → Vérifiez que le backend est démarré');
  } else {
    console.log('- ✅ Endpoint de santé accessible');
  }
  
  if (!results.patientsTest.success) {
    console.log('- ❌ Endpoint patients inaccessible');
    if (results.patientsTest.status === 401) {
      console.log('  → Problème d\'authentification, reconnectez-vous');
    } else if (results.patientsTest.status === 404) {
      console.log('  → Endpoint non trouvé, vérifiez l\'URL');
    } else {
      console.log('  → Erreur:', results.patientsTest.error);
    }
  } else {
    console.log('- ✅ Endpoint patients accessible');
  }
  
  // Solutions
  if (results.apiUrlTest.type === 'html') {
    console.log('🔧 Solution:');
    console.log('1. Vérifiez que VITE_API_URL pointe vers le backend');
    console.log('2. Redéployez le frontend avec la bonne configuration');
    console.log('3. Vérifiez que le backend est accessible');
  }
  
  return results;
};

// Exporter les fonctions
window.ApiDiagnostic = {
  checkEnvironment,
  testApiUrl,
  testHealthEndpoint,
  testPatientsEndpoint,
  runApiDiagnostic
};

// Exécuter automatiquement le diagnostic
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runApiDiagnostic);
} else {
  runApiDiagnostic();
}

console.log('🔍 Script de diagnostic API chargé. Utilisez ApiDiagnostic.runApiDiagnostic() pour relancer.');

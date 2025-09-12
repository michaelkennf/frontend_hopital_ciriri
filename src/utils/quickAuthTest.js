// Script de test rapide pour diagnostiquer les problèmes d'authentification
console.log('🔍 Test rapide d\'authentification...');

// 1. Vérifier le token
const checkToken = () => {
  const token = localStorage.getItem('token');
  console.log('🔑 Token présent:', !!token);
  console.log('🔑 Longueur du token:', token?.length || 0);
  console.log('🔑 Token (premiers caractères):', token ? token.substring(0, 30) + '...' : 'Aucun');
  return !!token;
};

// 2. Vérifier la configuration
const checkConfig = () => {
  const config = {
    environment: import.meta.env.MODE,
    viteApiUrl: import.meta.env.VITE_API_URL,
    prod: import.meta.env.PROD,
    dev: import.meta.env.DEV
  };
  
  console.log('⚙️ Configuration:', config);
  
  const expectedUrl = config.prod 
    ? 'https://polycliniquedesapotres-backend.onrender.com'
    : 'http://localhost:5000';
  
  const actualUrl = config.viteApiUrl || expectedUrl;
  
  console.log('🌐 URL attendue:', expectedUrl);
  console.log('🌐 URL actuelle:', actualUrl);
  console.log('✅ Configuration correcte:', actualUrl === expectedUrl);
  
  return { correct: actualUrl === expectedUrl, url: actualUrl };
};

// 3. Tester la connectivité
const testConnectivity = async () => {
  try {
    const config = checkConfig();
    console.log('🔗 Test de connectivité...');
    
    const response = await fetch(`${config.url}/api/health`);
    console.log('📡 Statut:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend accessible:', data);
      return { success: true, data };
    } else {
      console.log('❌ Backend inaccessible:', response.status, response.statusText);
      return { success: false, status: response.status };
    }
  } catch (error) {
    console.error('❌ Erreur de connectivité:', error);
    return { success: false, error: error.message };
  }
};

// 4. Tester l'authentification
const testAuth = async () => {
  try {
    const config = checkConfig();
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.log('❌ Aucun token pour tester l\'authentification');
      return { success: false, error: 'Aucun token' };
    }
    
    console.log('🔐 Test d\'authentification...');
    
    const response = await fetch(`${config.url}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Statut auth:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Authentification réussie:', data);
      return { success: true, user: data };
    } else {
      const errorText = await response.text();
      console.log('❌ Authentification échouée:', response.status, errorText);
      return { success: false, status: response.status, error: errorText };
    }
  } catch (error) {
    console.error('❌ Erreur d\'authentification:', error);
    return { success: false, error: error.message };
  }
};

// 5. Tester les patients
const testPatients = async () => {
  try {
    const config = checkConfig();
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.log('❌ Aucun token pour tester les patients');
      return { success: false, error: 'Aucun token' };
    }
    
    console.log('👥 Test des patients...');
    
    const response = await fetch(`${config.url}/api/patients`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Statut patients:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Patients accessibles:', data.patients?.length || 0, 'patients');
      return { success: true, count: data.patients?.length || 0 };
    } else {
      const errorText = await response.text();
      console.log('❌ Patients inaccessibles:', response.status, errorText);
      return { success: false, status: response.status, error: errorText };
    }
  } catch (error) {
    console.error('❌ Erreur patients:', error);
    return { success: false, error: error.message };
  }
};

// 6. Test complet
const runQuickTest = async () => {
  console.log('🚀 Démarrage du test rapide...');
  
  const results = {
    timestamp: new Date().toISOString(),
    token: checkToken(),
    config: checkConfig(),
    connectivity: null,
    auth: null,
    patients: null
  };
  
  // Test de connectivité
  results.connectivity = await testConnectivity();
  
  // Test d'authentification
  results.auth = await testAuth();
  
  // Test des patients
  results.patients = await testPatients();
  
  console.log('📊 Résultats complets:', results);
  
  // Recommandations
  console.log('💡 Recommandations:');
  
  if (!results.token) {
    console.log('- ❌ Aucun token trouvé → Reconnectez-vous');
  } else {
    console.log('- ✅ Token présent');
  }
  
  if (!results.config.correct) {
    console.log('- ⚠️ Configuration API incorrecte');
  } else {
    console.log('- ✅ Configuration API correcte');
  }
  
  if (!results.connectivity.success) {
    console.log('- ❌ Backend inaccessible');
  } else {
    console.log('- ✅ Backend accessible');
  }
  
  if (!results.auth.success) {
    console.log('- ❌ Authentification échouée → Token invalide ou expiré');
  } else {
    console.log('- ✅ Authentification réussie');
  }
  
  if (!results.patients.success) {
    console.log('- ❌ Patients inaccessibles → Problème d\'authentification');
  } else {
    console.log('- ✅ Patients accessibles');
  }
  
  // Solution rapide
  if (!results.token || !results.auth.success) {
    console.log('🔧 Solution rapide:');
    console.log('1. Allez sur la page de connexion');
    console.log('2. Connectez-vous avec vos identifiants');
    console.log('3. Revenez sur la page des patients');
  }
  
  return results;
};

// Exporter les fonctions
window.QuickAuthTest = {
  checkToken,
  checkConfig,
  testConnectivity,
  testAuth,
  testPatients,
  runQuickTest
};

// Exécuter automatiquement le test
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runQuickTest);
} else {
  runQuickTest();
}

console.log('🔍 Script de test rapide chargé. Utilisez QuickAuthTest.runQuickTest() pour relancer.');

// Script de migration pour corriger les problèmes d'authentification
console.log('🔄 Démarrage de la migration d\'authentification...');

// 1. Nettoyer les anciens tokens
const cleanOldTokens = () => {
  console.log('🧹 Nettoyage des anciens tokens...');
  
  const keysToRemove = ['auth-token', 'user-token', 'jwt-token'];
  let cleaned = 0;
  
  keysToRemove.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      console.log(`✅ Supprimé: ${key}`);
      cleaned++;
    }
  });
  
  console.log(`🧹 Nettoyage terminé: ${cleaned} tokens supprimés`);
  return cleaned > 0;
};

// 2. Vérifier la configuration de l'API
const checkApiConfig = () => {
  console.log('⚙️ Vérification de la configuration API...');
  
  const config = {
    environment: import.meta.env.MODE,
    viteApiUrl: import.meta.env.VITE_API_URL,
    prod: import.meta.env.PROD,
    dev: import.meta.env.DEV,
    baseUrl: window.location.origin
  };
  
  console.log('📊 Configuration actuelle:', config);
  
  const expectedUrl = config.prod 
    ? 'https://polycliniquedesapotres-backend.onrender.com'
    : 'http://localhost:5000';
  
  const actualUrl = config.viteApiUrl || expectedUrl;
  
  console.log('🌐 URL attendue:', expectedUrl);
  console.log('🌐 URL actuelle:', actualUrl);
  
  return {
    correct: actualUrl === expectedUrl,
    expected: expectedUrl,
    actual: actualUrl,
    config
  };
};

// 3. Tester la connectivité
const testConnectivity = async () => {
  try {
    console.log('🔗 Test de connectivité...');
    
    const config = checkApiConfig();
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${config.actual}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend accessible:', data);
      return { success: true, data };
    } else {
      console.log('❌ Backend inaccessible:', response.status, response.statusText);
      return { success: false, status: response.status, statusText: response.statusText };
    }
  } catch (error) {
    console.error('❌ Erreur de connectivité:', error);
    return { success: false, error: error.message };
  }
};

// 4. Tester l'authentification
const testAuth = async () => {
  try {
    console.log('🔐 Test d\'authentification...');
    
    const config = checkApiConfig();
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.log('❌ Aucun token trouvé');
      return { success: false, error: 'Aucun token trouvé' };
    }
    
    const response = await fetch(`${config.actual}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Authentification réussie:', data);
      return { success: true, user: data };
    } else {
      const errorData = await response.text();
      console.log('❌ Authentification échouée:', response.status, errorData);
      return { 
        success: false, 
        status: response.status, 
        error: errorData 
      };
    }
  } catch (error) {
    console.error('❌ Erreur d\'authentification:', error);
    return { success: false, error: error.message };
  }
};

// 5. Tester les patients
const testPatients = async () => {
  try {
    console.log('👥 Test des patients...');
    
    const config = checkApiConfig();
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${config.actual}/api/patients`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Patients accessibles:', data.patients?.length || 0, 'patients trouvés');
      return { success: true, count: data.patients?.length || 0 };
    } else {
      const errorData = await response.text();
      console.log('❌ Patients inaccessibles:', response.status, errorData);
      return { 
        success: false, 
        status: response.status, 
        error: errorData 
      };
    }
  } catch (error) {
    console.error('❌ Erreur lors du test des patients:', error);
    return { success: false, error: error.message };
  }
};

// 6. Fonction principale de migration
const runAuthMigration = async () => {
  console.log('🚀 Démarrage de la migration d\'authentification...');
  
  const results = {
    timestamp: new Date().toISOString(),
    cleaned: false,
    apiConfig: null,
    connectivity: null,
    auth: null,
    patients: null
  };
  
  // 1. Nettoyer les anciens tokens
  results.cleaned = cleanOldTokens();
  
  // 2. Vérifier la configuration
  results.apiConfig = checkApiConfig();
  
  // 3. Tester la connectivité
  results.connectivity = await testConnectivity();
  
  // 4. Tester l'authentification
  results.auth = await testAuth();
  
  // 5. Tester les patients
  results.patients = await testPatients();
  
  console.log('📊 Résultats de la migration:', results);
  
  // Recommandations
  console.log('💡 Recommandations:');
  
  if (!results.cleaned) {
    console.log('- ✅ Aucun ancien token à nettoyer');
  } else {
    console.log('- ✅ Anciens tokens nettoyés');
  }
  
  if (!results.apiConfig.correct) {
    console.log('- ⚠️ Configuration API incorrecte');
    console.log(`  Attendu: ${results.apiConfig.expected}`);
    console.log(`  Actuel: ${results.apiConfig.actual}`);
  } else {
    console.log('- ✅ Configuration API correcte');
  }
  
  if (!results.connectivity.success) {
    console.log('- ❌ Backend inaccessible');
    console.log(`  Erreur: ${results.connectivity.error || results.connectivity.statusText}`);
  } else {
    console.log('- ✅ Backend accessible');
  }
  
  if (!results.auth.success) {
    console.log('- ❌ Authentification échouée');
    console.log(`  Erreur: ${results.auth.error}`);
    console.log('- 🔑 Solution: Reconnectez-vous');
  } else {
    console.log('- ✅ Authentification réussie');
  }
  
  if (!results.patients.success) {
    console.log('- ❌ Patients inaccessibles');
    console.log(`  Erreur: ${results.patients.error}`);
  } else {
    console.log(`- ✅ Patients accessibles (${results.patients.count} trouvés)`);
  }
  
  // Résumé final
  const allGood = results.apiConfig.correct && 
                  results.connectivity.success && 
                  results.auth.success && 
                  results.patients.success;
  
  if (allGood) {
    console.log('🎉 Migration réussie ! Tout devrait fonctionner maintenant.');
  } else {
    console.log('⚠️ Migration partiellement réussie. Vérifiez les recommandations ci-dessus.');
  }
  
  return results;
};

// Exporter les fonctions
window.AuthMigration = {
  cleanOldTokens,
  checkApiConfig,
  testConnectivity,
  testAuth,
  testPatients,
  runAuthMigration
};

// Exécuter automatiquement la migration
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runAuthMigration);
} else {
  runAuthMigration();
}

console.log('🔄 Script de migration d\'authentification chargé. Utilisez AuthMigration.runAuthMigration() pour relancer.');

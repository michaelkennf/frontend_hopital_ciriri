// Script de migration pour corriger les problèmes de compatibilité local/production
console.log('🔄 Démarrage de la migration des tokens...');

// 1. Migration des tokens
const migrateTokens = () => {
  const authToken = localStorage.getItem('auth-token');
  const token = localStorage.getItem('token');
  
  console.log('🔍 Tokens trouvés:', {
    'auth-token': authToken ? 'Présent' : 'Absent',
    'token': token ? 'Présent' : 'Absent'
  });
  
  if (authToken && !token) {
    console.log('🔄 Migration du token de "auth-token" vers "token"...');
    localStorage.setItem('token', authToken);
    localStorage.removeItem('auth-token');
    console.log('✅ Migration terminée');
    return true;
  } else if (token) {
    console.log('✅ Token déjà présent sous "token"');
    return true;
  } else {
    console.log('❌ Aucun token trouvé');
    return false;
  }
};

// 2. Vérification de la configuration de l'API
const checkApiConfig = () => {
  const config = {
    environment: import.meta.env.MODE,
    viteApiUrl: import.meta.env.VITE_API_URL,
    prod: import.meta.env.PROD,
    dev: import.meta.env.DEV
  };
  
  console.log('⚙️ Configuration API:', config);
  
  const expectedUrl = config.prod 
    ? 'https://polycliniquedesapotres-backend.onrender.com'
    : 'http://localhost:5000';
  
  const actualUrl = config.viteApiUrl || expectedUrl;
  
  console.log('🌐 URL attendue:', expectedUrl);
  console.log('🌐 URL actuelle:', actualUrl);
  
  return {
    correct: actualUrl === expectedUrl,
    expected: expectedUrl,
    actual: actualUrl
  };
};

// 3. Test de connectivité
const testConnectivity = async () => {
  try {
    const config = checkApiConfig();
    const token = localStorage.getItem('token');
    
    console.log('🔗 Test de connectivité...');
    
    const response = await fetch(`${config.actual}/api/health`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
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

// 4. Test des factures
const testInvoices = async () => {
  try {
    const config = checkApiConfig();
    const token = localStorage.getItem('token');
    
    console.log('📋 Test des factures...');
    
    const response = await fetch(`${config.actual}/api/invoices`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Factures accessibles:', data.invoices?.length || 0, 'factures trouvées');
      return { success: true, count: data.invoices?.length || 0 };
    } else {
      console.log('❌ Factures inaccessibles:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('📄 Réponse d\'erreur:', errorText);
      return { success: false, status: response.status, error: errorText };
    }
  } catch (error) {
    console.error('❌ Erreur lors du test des factures:', error);
    return { success: false, error: error.message };
  }
};

// 5. Fonction principale de migration
const runMigration = async () => {
  console.log('🚀 Démarrage de la migration complète...');
  
  const results = {
    tokenMigration: false,
    apiConfig: null,
    connectivity: null,
    invoices: null
  };
  
  // 1. Migration des tokens
  results.tokenMigration = migrateTokens();
  
  // 2. Vérification de la configuration
  results.apiConfig = checkApiConfig();
  
  // 3. Test de connectivité
  results.connectivity = await testConnectivity();
  
  // 4. Test des factures
  results.invoices = await testInvoices();
  
  console.log('📊 Résultats de la migration:', results);
  
  // Recommandations
  console.log('💡 Recommandations:');
  
  if (!results.tokenMigration) {
    console.log('- ❌ Aucun token trouvé, veuillez vous reconnecter');
  }
  
  if (!results.apiConfig.correct) {
    console.log('- ⚠️ Configuration API incorrecte, vérifiez VITE_API_URL');
  }
  
  if (!results.connectivity.success) {
    console.log('- ❌ Backend inaccessible, vérifiez la connexion');
  }
  
  if (!results.invoices.success) {
    console.log('- ❌ Factures inaccessibles, vérifiez les permissions');
  }
  
  if (results.tokenMigration && results.apiConfig.correct && results.connectivity.success && results.invoices.success) {
    console.log('- ✅ Migration réussie, tout devrait fonctionner maintenant !');
  }
  
  return results;
};

// Exporter les fonctions pour utilisation
window.MigrationUtils = {
  migrateTokens,
  checkApiConfig,
  testConnectivity,
  testInvoices,
  runMigration
};

// Exécuter automatiquement la migration
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runMigration);
} else {
  runMigration();
}

console.log('🔄 Script de migration chargé. Utilisez MigrationUtils.runMigration() pour relancer.');

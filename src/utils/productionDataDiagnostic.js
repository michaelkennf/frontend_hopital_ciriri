// Diagnostic spécifique pour les problèmes de persistance en production
console.log('🔍 Diagnostic de persistance des données en production...');

// 1. Vérifier l'environnement
const checkEnvironment = () => {
  const env = {
    mode: import.meta.env.MODE,
    prod: import.meta.env.PROD,
    dev: import.meta.env.DEV,
    viteApiUrl: import.meta.env.VITE_API_URL,
    hostname: window.location.hostname,
    timestamp: new Date().toISOString()
  };
  
  console.log('🌍 Environnement:', env);
  
  const isProduction = env.prod || 
    env.hostname.includes('pages.dev') || 
    env.hostname.includes('cloudflare') ||
    env.hostname.includes('onrender.com');
  
  return { env, isProduction };
};

// 2. Tester la création d'un patient
const testPatientCreation = async () => {
  try {
    const { env, isProduction } = checkEnvironment();
    const baseURL = env.viteApiUrl || 
      (isProduction ? 'https://polycliniquedesapotres-backend.onrender.com' : 'http://localhost:5000');
    
    const token = localStorage.getItem('token');
    
    console.log('👥 Test de création d\'un patient...');
    console.log('  URL:', baseURL);
    console.log('  Token présent:', !!token);
    
    const testPatient = {
      firstName: 'Test',
      lastName: 'Production',
      sexe: 'M',
      dateNaissance: '1990-01-01',
      poids: 70,
      adresse: 'Adresse test production',
      telephone: '123456789'
    };
    
    console.log('  Données à envoyer:', testPatient);
    
    const response = await fetch(`${baseURL}/api/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testPatient)
    });
    
    console.log('  Statut de la réponse:', response.status);
    console.log('  Headers de la réponse:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Patient créé avec succès:', data);
      return { success: true, data };
    } else {
      const errorText = await response.text();
      console.log('❌ Erreur lors de la création:', response.status, errorText);
      return { success: false, status: response.status, error: errorText };
    }
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    return { success: false, error: error.message };
  }
};

// 3. Vérifier que le patient a été sauvegardé
const verifyPatientSaved = async () => {
  try {
    const { env, isProduction } = checkEnvironment();
    const baseURL = env.viteApiUrl || 
      (isProduction ? 'https://polycliniquedesapotres-backend.onrender.com' : 'http://localhost:5000');
    
    const token = localStorage.getItem('token');
    
    console.log('🔍 Vérification de la sauvegarde...');
    
    const response = await fetch(`${baseURL}/api/patients`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      const patients = data.patients || [];
      
      console.log(`📊 Nombre de patients récupérés: ${patients.length}`);
      
      // Chercher le patient de test
      const testPatient = patients.find(p => 
        p.firstName === 'Test' && p.lastName === 'Production'
      );
      
      if (testPatient) {
        console.log('✅ Patient de test trouvé dans la base:', testPatient);
        return { success: true, found: true, patient: testPatient };
      } else {
        console.log('❌ Patient de test non trouvé dans la base');
        return { success: true, found: false };
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Erreur lors de la vérification:', response.status, errorText);
      return { success: false, error: errorText };
    }
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
    return { success: false, error: error.message };
  }
};

// 4. Test complet de persistance
const testDataPersistence = async () => {
  console.log('🚀 Démarrage du test de persistance...');
  
  const results = {
    timestamp: new Date().toISOString(),
    environment: null,
    creation: null,
    verification: null
  };
  
  // 1. Vérifier l'environnement
  results.environment = checkEnvironment();
  
  // 2. Créer un patient
  results.creation = await testPatientCreation();
  
  // 3. Vérifier la sauvegarde
  if (results.creation.success) {
    // Attendre un peu pour la synchronisation
    await new Promise(resolve => setTimeout(resolve, 2000));
    results.verification = await verifyPatientSaved();
  }
  
  console.log('📊 Résultats complets:', results);
  
  // Analyse des résultats
  console.log('📈 Analyse des résultats:');
  
  if (!results.environment.isProduction) {
    console.log('⚠️ Attention: Test exécuté en local, pas en production');
  } else {
    console.log('✅ Test exécuté en production');
  }
  
  if (results.creation.success) {
    console.log('✅ Création de patient réussie');
  } else {
    console.log('❌ Création de patient échouée');
    console.log('  Erreur:', results.creation.error);
  }
  
  if (results.verification) {
    if (results.verification.success && results.verification.found) {
      console.log('✅ Persistance des données confirmée');
    } else if (results.verification.success && !results.verification.found) {
      console.log('❌ PROBLÈME: Patient créé mais non sauvegardé en base');
      console.log('  → Problème de persistance des données');
    } else {
      console.log('❌ Impossible de vérifier la persistance');
      console.log('  Erreur:', results.verification.error);
    }
  }
  
  // Recommandations
  console.log('💡 Recommandations:');
  
  if (results.creation.success && results.verification && !results.verification.found) {
    console.log('- Vérifiez les logs du backend sur Render');
    console.log('- Vérifiez la configuration de la base de données');
    console.log('- Vérifiez que les migrations Prisma sont appliquées');
    console.log('- Vérifiez que le backend a accès à la base de données');
  } else if (!results.creation.success) {
    console.log('- Vérifiez la configuration de l\'API');
    console.log('- Vérifiez l\'authentification');
    console.log('- Vérifiez que le backend est accessible');
  }
  
  return results;
};

// Exporter les fonctions
window.ProductionDataDiagnostic = {
  checkEnvironment,
  testPatientCreation,
  verifyPatientSaved,
  testDataPersistence
};

// Exécuter automatiquement le test
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', testDataPersistence);
} else {
  testDataPersistence();
}

console.log('🔍 Script de diagnostic de persistance chargé. Utilisez ProductionDataDiagnostic.testDataPersistence() pour relancer.');

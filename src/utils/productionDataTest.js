// Script de test de persistance des données en production
console.log('🔍 Test de persistance des données en production...');

// Fonction pour faire des requêtes
async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    return {
      success: response.ok,
      status: response.status,
      data: data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Test complet de persistance
async function testDataPersistence() {
  console.log('🚀 Démarrage du test de persistance...');
  
  const results = {
    timestamp: new Date().toISOString(),
    environment: null,
    auth: null,
    patients: null,
    creation: null,
    verification: null
  };
  
  try {
    // 1. Détecter l'environnement
    console.log('1️⃣ Détection de l\'environnement...');
    const isProduction = window.location.hostname.includes('pages.dev') || 
                        window.location.hostname.includes('cloudflare') ||
                        window.location.hostname.includes('onrender.com') ||
                        import.meta.env.PROD;
    
    const baseURL = import.meta.env.VITE_API_URL || 
      (isProduction ? 'https://polycliniquedesapotres-backend.onrender.com' : 'http://localhost:5000');
    
    results.environment = {
      isProduction,
      hostname: window.location.hostname,
      baseURL,
      mode: import.meta.env.MODE
    };
    
    console.log('🌍 Environnement:', results.environment);
    
    // 2. Vérifier l'authentification
    console.log('2️⃣ Vérification de l\'authentification...');
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.log('❌ Aucun token trouvé');
      results.auth = { success: false, error: 'Aucun token' };
    } else {
      console.log('✅ Token trouvé:', token.substring(0, 20) + '...');
      results.auth = { success: true, tokenLength: token.length };
    }
    
    // 3. Récupérer les patients existants
    console.log('3️⃣ Récupération des patients existants...');
    const patientsResponse = await makeRequest(`${baseURL}/api/patients`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (patientsResponse.success) {
      const initialCount = patientsResponse.data.patients?.length || 0;
      console.log(`📊 Patients existants: ${initialCount}`);
      results.patients = { success: true, count: initialCount };
    } else {
      console.log('❌ Erreur récupération patients:', patientsResponse.error);
      results.patients = { success: false, error: patientsResponse.error };
    }
    
    // 4. Créer un nouveau patient
    console.log('4️⃣ Création d\'un nouveau patient...');
    const testPatient = {
      firstName: 'Test',
      lastName: 'Production',
      sexe: 'M',
      dateNaissance: '1990-01-01',
      poids: 70,
      adresse: 'Adresse test production',
      telephone: '123456789'
    };
    
    console.log('📋 Données du patient:', testPatient);
    
    const createResponse = await makeRequest(`${baseURL}/api/patients`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testPatient)
    });
    
    if (createResponse.success) {
      console.log('✅ Patient créé via API:', createResponse.data);
      results.creation = { success: true, data: createResponse.data };
    } else {
      console.log('❌ Erreur création patient:', createResponse.error);
      results.creation = { success: false, error: createResponse.error };
    }
    
    // 5. Vérifier la persistance
    console.log('5️⃣ Vérification de la persistance...');
    
    if (results.creation.success) {
      // Attendre un peu pour la synchronisation
      console.log('⏳ Attente de la synchronisation...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const verifyResponse = await makeRequest(`${baseURL}/api/patients`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (verifyResponse.success) {
        const finalCount = verifyResponse.data.patients?.length || 0;
        console.log(`📊 Nouveau nombre de patients: ${finalCount}`);
        
        // Chercher le patient créé
        const createdPatient = verifyResponse.data.patients.find(p => 
          p.firstName === 'Test' && p.lastName === 'Production'
        );
        
        if (createdPatient) {
          console.log('✅ Patient trouvé dans la base:', createdPatient);
          results.verification = { 
            success: true, 
            found: true, 
            patient: createdPatient,
            count: finalCount
          };
        } else {
          console.log('❌ Patient non trouvé dans la base');
          results.verification = { 
            success: true, 
            found: false,
            count: finalCount
          };
        }
      } else {
        console.log('❌ Erreur vérification:', verifyResponse.error);
        results.verification = { success: false, error: verifyResponse.error };
      }
    }
    
    // 6. Analyse des résultats
    console.log('\n📊 RÉSULTATS COMPLETS:', results);
    
    console.log('\n📈 ANALYSE:');
    
    if (!results.environment.isProduction) {
      console.log('⚠️ Attention: Test exécuté en local, pas en production');
    } else {
      console.log('✅ Test exécuté en production');
    }
    
    if (results.auth.success) {
      console.log('✅ Authentification: OK');
    } else {
      console.log('❌ Authentification: ÉCHEC');
    }
    
    if (results.patients.success) {
      console.log(`✅ Récupération patients: OK (${results.patients.count} patients)`);
    } else {
      console.log('❌ Récupération patients: ÉCHEC');
    }
    
    if (results.creation.success) {
      console.log('✅ Création patient: OK');
    } else {
      console.log('❌ Création patient: ÉCHEC');
    }
    
    if (results.verification) {
      if (results.verification.success && results.verification.found) {
        console.log('✅ PERSISTANCE: OK - Données sauvegardées');
      } else if (results.verification.success && !results.verification.found) {
        console.log('❌ PERSISTANCE: ÉCHEC - Données non sauvegardées');
        console.log('🔍 DIAGNOSTIC: Le patient est créé mais non persisté en base');
      } else {
        console.log('❌ PERSISTANCE: Impossible de vérifier');
      }
    }
    
    // 7. Recommandations
    console.log('\n💡 RECOMMANDATIONS:');
    
    if (results.creation.success && results.verification && !results.verification.found) {
      console.log('🚨 PROBLÈME DE PERSISTANCE DÉTECTÉ');
      console.log('   → Vérifiez les logs du backend sur Render');
      console.log('   → Vérifiez la configuration de la base de données');
      console.log('   → Vérifiez que les migrations Prisma sont appliquées');
      console.log('   → Vérifiez que le backend a accès à la base de données');
    } else if (results.creation.success && results.verification && results.verification.found) {
      console.log('✅ PERSISTANCE FONCTIONNE CORRECTEMENT');
    } else if (!results.creation.success) {
      console.log('🔧 PROBLÈME D\'AUTHENTIFICATION OU D\'API');
      console.log('   → Vérifiez la configuration de l\'API');
      console.log('   → Vérifiez l\'authentification');
      console.log('   → Vérifiez que le backend est accessible');
    }
    
    return results;
    
  } catch (error) {
    console.error('💥 Erreur fatale:', error);
    return { error: error.message };
  }
}

// Exporter la fonction
window.testDataPersistence = testDataPersistence;

// Exécuter automatiquement le test
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', testDataPersistence);
} else {
  testDataPersistence();
}

console.log('🔍 Script de test de persistance chargé. Utilisez testDataPersistence() pour relancer.');

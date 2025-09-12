// Script de test pour l'API des patients
console.log('👥 Test de l\'API des patients...');

// 1. Tester la récupération des patients
const testGetPatients = async () => {
  try {
    console.log('📋 Test de récupération des patients...');
    
    const token = localStorage.getItem('token');
    const baseURL = import.meta.env.VITE_API_URL || 
      (import.meta.env.PROD ? 'https://polycliniquedesapotres-backend.onrender.com' : 'http://localhost:5000');
    
    console.log('🌐 URL utilisée:', baseURL);
    console.log('🔑 Token présent:', !!token);
    
    const response = await fetch(`${baseURL}/api/patients`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });
    
    console.log('📡 Statut de la réponse:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Patients récupérés avec succès:', data);
      console.log('📊 Nombre de patients:', data.patients?.length || 0);
      return { success: true, data, count: data.patients?.length || 0 };
    } else {
      const errorText = await response.text();
      console.log('❌ Erreur lors de la récupération:', response.status, errorText);
      return { success: false, status: response.status, error: errorText };
    }
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    return { success: false, error: error.message };
  }
};

// 2. Tester la création d'un patient
const testCreatePatient = async () => {
  try {
    console.log('➕ Test de création d\'un patient...');
    
    const token = localStorage.getItem('token');
    const baseURL = import.meta.env.VITE_API_URL || 
      (import.meta.env.PROD ? 'https://polycliniquedesapotres-backend.onrender.com' : 'http://localhost:5000');
    
    const testPatient = {
      firstName: 'Test',
      lastName: 'Patient',
      sexe: 'M',
      dateNaissance: '1990-01-01',
      poids: 70,
      adresse: 'Adresse test',
      telephone: '123456789'
    };
    
    console.log('👤 Patient de test:', testPatient);
    
    const response = await fetch(`${baseURL}/api/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify(testPatient)
    });
    
    console.log('📡 Statut de la création:', response.status);
    
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
    console.error('❌ Erreur lors de la création:', error);
    return { success: false, error: error.message };
  }
};

// 3. Test complet
const runPatientTest = async () => {
  console.log('🚀 Démarrage du test des patients...');
  
  const results = {
    timestamp: new Date().toISOString(),
    getPatients: null,
    createPatient: null
  };
  
  // Test de récupération
  results.getPatients = await testGetPatients();
  
  // Test de création
  results.createPatient = await testCreatePatient();
  
  // Si la création a réussi, tester à nouveau la récupération
  if (results.createPatient.success) {
    console.log('🔄 Test de récupération après création...');
    const afterCreate = await testGetPatients();
    results.getPatientsAfterCreate = afterCreate;
  }
  
  console.log('📊 Résultats complets:', results);
  
  // Recommandations
  console.log('💡 Recommandations:');
  
  if (!results.getPatients.success) {
    console.log('- ❌ Impossible de récupérer les patients');
    console.log('  → Vérifiez l\'authentification et l\'URL de l\'API');
  } else {
    console.log(`- ✅ Patients récupérés (${results.getPatients.count} trouvés)`);
  }
  
  if (!results.createPatient.success) {
    console.log('- ❌ Impossible de créer un patient');
    console.log('  → Vérifiez les permissions et les données');
  } else {
    console.log('- ✅ Patient créé avec succès');
  }
  
  if (results.getPatientsAfterCreate) {
    const beforeCount = results.getPatients.count || 0;
    const afterCount = results.getPatientsAfterCreate.count || 0;
    
    if (afterCount > beforeCount) {
      console.log(`- ✅ Liste mise à jour (${beforeCount} → ${afterCount})`);
    } else {
      console.log('- ⚠️ Liste non mise à jour après création');
      console.log('  → Problème de synchronisation des données');
    }
  }
  
  return results;
};

// 4. Test de synchronisation
const testSync = async () => {
  console.log('🔄 Test de synchronisation...');
  
  // Récupérer avant
  const before = await testGetPatients();
  if (!before.success) {
    console.log('❌ Impossible de récupérer les patients avant le test');
    return;
  }
  
  const beforeCount = before.count || 0;
  console.log(`📊 Patients avant: ${beforeCount}`);
  
  // Créer un patient
  const create = await testCreatePatient();
  if (!create.success) {
    console.log('❌ Impossible de créer un patient');
    return;
  }
  
  console.log('✅ Patient créé');
  
  // Attendre un peu
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Récupérer après
  const after = await testGetPatients();
  if (!after.success) {
    console.log('❌ Impossible de récupérer les patients après création');
    return;
  }
  
  const afterCount = after.count || 0;
  console.log(`📊 Patients après: ${afterCount}`);
  
  if (afterCount > beforeCount) {
    console.log('✅ Synchronisation réussie');
  } else {
    console.log('❌ Problème de synchronisation');
  }
  
  return { beforeCount, afterCount, synced: afterCount > beforeCount };
};

// Exporter les fonctions
window.PatientTest = {
  testGetPatients,
  testCreatePatient,
  runPatientTest,
  testSync
};

// Exécuter automatiquement le test
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runPatientTest);
} else {
  runPatientTest();
}

console.log('👥 Script de test des patients chargé. Utilisez PatientTest.runPatientTest() pour relancer.');

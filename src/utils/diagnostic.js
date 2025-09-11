// Script de diagnostic pour identifier les problèmes de configuration
console.log('🔍 Diagnostic de la configuration frontend...');

// 1. Vérifier l'environnement
console.log('📊 Environnement:', {
  mode: import.meta.env.MODE,
  prod: import.meta.env.PROD,
  dev: import.meta.env.DEV,
  viteApiUrl: import.meta.env.VITE_API_URL
});

// 2. Vérifier l'URL de l'API
const apiUrl = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? 'https://polycliniquedesapotres-backend.onrender.com' : 'http://localhost:5000');

console.log('🌐 URL de l\'API:', apiUrl);

// 3. Vérifier les tokens dans localStorage
const authToken = localStorage.getItem('auth-token');
const token = localStorage.getItem('token');

console.log('🔑 Tokens trouvés:', {
  'auth-token': authToken ? authToken.substring(0, 20) + '...' : 'Non trouvé',
  'token': token ? token.substring(0, 20) + '...' : 'Non trouvé'
});

// 4. Vérifier la configuration Axios
console.log('⚙️ Configuration Axios:', {
  baseURL: axios?.defaults?.baseURL || 'Non défini',
  headers: axios?.defaults?.headers || 'Non défini'
});

// 5. Test de connectivité
console.log('🔗 Test de connectivité...');
fetch(`${apiUrl}/api/health`)
  .then(response => response.json())
  .then(data => {
    console.log('✅ Backend accessible:', data);
  })
  .catch(error => {
    console.error('❌ Backend inaccessible:', error);
  });

// 6. Test avec token
if (token) {
  console.log('🔐 Test avec token...');
  fetch(`${apiUrl}/api/patients`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    console.log('📋 Réponse patients:', response.status, response.statusText);
    if (response.status === 403) {
      console.log('❌ Token expiré ou invalide');
    } else if (response.status === 200) {
      console.log('✅ Token valide');
    }
  })
  .catch(error => {
    console.error('❌ Erreur requête patients:', error);
  });
}

// 7. Recommandations
console.log('💡 Recommandations:');
if (!token && !authToken) {
  console.log('- Aucun token trouvé, veuillez vous reconnecter');
} else if (authToken && !token) {
  console.log('- Token trouvé sous "auth-token", migration vers "token" nécessaire');
} else if (token) {
  console.log('- Token trouvé sous "token", configuration correcte');
}

if (apiUrl.includes('localhost') && import.meta.env.PROD) {
  console.log('- ⚠️ URL locale en production, vérifiez VITE_API_URL');
}

console.log('🎯 Diagnostic terminé');

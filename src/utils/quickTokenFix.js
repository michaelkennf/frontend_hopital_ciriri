// Solution rapide pour le refresh automatique des tokens
// À ajouter dans votre fichier principal (App.js ou index.js)

// Fonction pour vérifier et rafraîchir automatiquement le token
const checkAndRefreshToken = async () => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.log('Aucun token trouvé');
      return null;
    }

    // Décoder le token pour vérifier l'expiration
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    const timeLeft = payload.exp - now;
    const hoursLeft = timeLeft / 3600;

    console.log(`Token expire dans ${hoursLeft.toFixed(2)} heures`);

    // Si le token expire dans moins de 24 heures, le rafraîchir
    if (timeLeft < 24 * 3600) {
      console.log('Token expire bientôt, rafraîchissement automatique...');
      
      try {
        // Faire une requête pour déclencher le refresh automatique côté serveur
        const response = await fetch('https://polycliniquedesapotres-backend.onrender.com/api/patients', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        // Vérifier si un nouveau token a été fourni
        const newToken = response.headers.get('X-New-Token');
        
        if (newToken) {
          console.log('Nouveau token reçu du serveur');
          localStorage.setItem('token', newToken);
          return newToken;
        }

        // Vérifier dans le body de la réponse
        const data = await response.json();
        if (data.newToken) {
          console.log('Nouveau token reçu dans la réponse');
          localStorage.setItem('token', data.newToken);
          return data.newToken;
        }

        return token;
      } catch (error) {
        console.error('Erreur lors du refresh:', error);
        return token;
      }
    }

    return token;
  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error);
    return null;
  }
};

// Fonction pour intercepter les requêtes Axios et ajouter le token
const setupAxiosInterceptor = () => {
  // Si vous utilisez axios, ajoutez cet intercepteur
  if (typeof axios !== 'undefined') {
    axios.interceptors.request.use(async (config) => {
      const validToken = await checkAndRefreshToken();
      
      if (validToken) {
        config.headers.Authorization = `Bearer ${validToken}`;
      }
      
      return config;
    });

    axios.interceptors.response.use(
      (response) => {
        // Vérifier si un nouveau token a été fourni
        const newToken = response.data.newToken || response.headers['x-new-token'];
        
        if (newToken) {
          console.log('Nouveau token reçu dans la réponse');
          localStorage.setItem('token', newToken);
        }
        
        return response;
      },
      async (error) => {
        // Si l'erreur est 401/403, essayer de rafraîchir le token
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.log('Token expiré, tentative de refresh...');
          
          const newToken = await checkAndRefreshToken();
          
          if (newToken && newToken !== localStorage.getItem('token')) {
            // Retry la requête avec le nouveau token
            error.config.headers.Authorization = `Bearer ${newToken}`;
            return axios(error.config);
          }
        }
        
        return Promise.reject(error);
      }
    );
  }
};

// Démarrer la surveillance automatique
const startTokenMonitoring = () => {
  console.log('Démarrage de la surveillance des tokens...');
  
  // Vérifier immédiatement
  checkAndRefreshToken();
  
  // Vérifier toutes les 30 minutes
  setInterval(checkAndRefreshToken, 30 * 60 * 1000);
};

// Exporter les fonctions pour utilisation
window.TokenManager = {
  checkAndRefreshToken,
  setupAxiosInterceptor,
  startTokenMonitoring
};

// Démarrer automatiquement si le script est chargé
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setupAxiosInterceptor();
    startTokenMonitoring();
  });
} else {
  setupAxiosInterceptor();
  startTokenMonitoring();
}

console.log('🔄 Système de refresh automatique des tokens activé !');

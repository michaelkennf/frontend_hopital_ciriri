// Gestionnaire automatique des tokens JWT côté frontend
import axios from 'axios';

class TokenManager {
  private static instance: TokenManager;
  private refreshPromise: Promise<string> | null = null;

  private constructor() {}

  public static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  // Récupérer le token depuis le localStorage
  public getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Sauvegarder le token dans le localStorage
  public setToken(token: string): void {
    localStorage.setItem('token', token);
    console.log('[TOKEN MANAGER] Token sauvegardé');
  }

  // Supprimer le token
  public removeToken(): void {
    localStorage.removeItem('token');
    console.log('[TOKEN MANAGER] Token supprimé');
  }

  // Vérifier si le token est expiré
  public isTokenExpired(token?: string): boolean {
    const tokenToCheck = token || this.getToken();
    if (!tokenToCheck) return true;

    try {
      const payload = JSON.parse(atob(tokenToCheck.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp < now;
    } catch (error) {
      console.error('[TOKEN MANAGER] Erreur lors de la vérification du token:', error);
      return true;
    }
  }

  // Obtenir le temps restant avant expiration
  public getTimeUntilExpiration(token?: string): number {
    const tokenToCheck = token || this.getToken();
    if (!tokenToCheck) return 0;

    try {
      const payload = JSON.parse(atob(tokenToCheck.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return Math.max(0, payload.exp - now);
    } catch (error) {
      return 0;
    }
  }

  // Rafraîchir automatiquement le token
  public async refreshToken(): Promise<string | null> {
    // Éviter les appels multiples simultanés
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh();
    
    try {
      const newToken = await this.refreshPromise;
      return newToken;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<string | null> {
    try {
      console.log('[TOKEN MANAGER] Tentative de refresh du token...');
      
      const currentToken = this.getToken();
      if (!currentToken) {
        console.log('[TOKEN MANAGER] Aucun token à rafraîchir');
        return null;
      }

      // Faire une requête à n'importe quel endpoint protégé
      // Le serveur va automatiquement générer un nouveau token
      const response = await axios.get('/api/patients', {
        headers: {
          'Authorization': `Bearer ${currentToken}`
        }
      });

      // Vérifier si un nouveau token a été fourni
      const newToken = response.data.newToken || response.headers['x-new-token'];
      
      if (newToken) {
        console.log('[TOKEN MANAGER] Nouveau token reçu du serveur');
        this.setToken(newToken);
        return newToken;
      }

      return currentToken;
    } catch (error: any) {
      console.error('[TOKEN MANAGER] Erreur lors du refresh:', error.message);
      
      // Si l'erreur est 401/403, le token est probablement expiré
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('[TOKEN MANAGER] Token expiré, redirection vers la connexion');
        this.removeToken();
        // Rediriger vers la page de connexion
        window.location.href = '/login';
      }
      
      return null;
    }
  }

  // Vérifier et rafraîchir automatiquement le token si nécessaire
  public async ensureValidToken(): Promise<string | null> {
    const token = this.getToken();
    
    if (!token) {
      console.log('[TOKEN MANAGER] Aucun token trouvé');
      return null;
    }

    // Si le token expire dans moins de 2 heures, le rafraîchir
    const timeUntilExpiration = this.getTimeUntilExpiration(token);
    const twoHours = 2 * 60 * 60; // 2 heures en secondes

    if (timeUntilExpiration < twoHours) {
      console.log('[TOKEN MANAGER] Token expire bientôt, refresh automatique...');
      return await this.refreshToken();
    }

    return token;
  }

  // Démarrer la vérification périodique des tokens
  public startTokenMonitoring(): void {
    console.log('[TOKEN MANAGER] Démarrage de la surveillance des tokens');
    
    // Vérifier toutes les 30 minutes
    setInterval(async () => {
      try {
        await this.ensureValidToken();
      } catch (error) {
        console.error('[TOKEN MANAGER] Erreur lors de la surveillance:', error);
      }
    }, 30 * 60 * 1000); // 30 minutes
  }
}

export default TokenManager.getInstance();

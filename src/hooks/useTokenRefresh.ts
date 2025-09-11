// Hook React pour gérer le refresh automatique des tokens
import { useEffect, useState } from 'react';
import TokenManager from '../utils/tokenManager';

interface TokenStatus {
  isValid: boolean;
  timeUntilExpiration: number;
  isRefreshing: boolean;
}

export const useTokenRefresh = () => {
  const [tokenStatus, setTokenStatus] = useState<TokenStatus>({
    isValid: false,
    timeUntilExpiration: 0,
    isRefreshing: false
  });

  const checkTokenStatus = async () => {
    const token = TokenManager.getToken();
    
    if (!token) {
      setTokenStatus({
        isValid: false,
        timeUntilExpiration: 0,
        isRefreshing: false
      });
      return;
    }

    const isValid = !TokenManager.isTokenExpired(token);
    const timeUntilExpiration = TokenManager.getTimeUntilExpiration(token);

    setTokenStatus({
      isValid,
      timeUntilExpiration,
      isRefreshing: false
    });

    // Si le token expire dans moins de 2 heures, le rafraîchir automatiquement
    const twoHours = 2 * 60 * 60; // 2 heures en secondes
    if (timeUntilExpiration < twoHours && timeUntilExpiration > 0) {
      setTokenStatus(prev => ({ ...prev, isRefreshing: true }));
      
      try {
        await TokenManager.refreshToken();
        console.log('[HOOK] Token rafraîchi automatiquement');
        
        // Re-vérifier le statut après le refresh
        setTimeout(checkTokenStatus, 1000);
      } catch (error) {
        console.error('[HOOK] Erreur lors du refresh automatique:', error);
        setTokenStatus(prev => ({ ...prev, isRefreshing: false }));
      }
    }
  };

  const refreshToken = async () => {
    setTokenStatus(prev => ({ ...prev, isRefreshing: true }));
    
    try {
      const newToken = await TokenManager.refreshToken();
      await checkTokenStatus();
      return newToken;
    } catch (error) {
      console.error('[HOOK] Erreur lors du refresh manuel:', error);
      setTokenStatus(prev => ({ ...prev, isRefreshing: false }));
      throw error;
    }
  };

  const formatTimeUntilExpiration = (seconds: number): string => {
    if (seconds <= 0) return 'Expiré';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  useEffect(() => {
    // Vérifier le statut initial
    checkTokenStatus();

    // Vérifier toutes les 5 minutes
    const interval = setInterval(checkTokenStatus, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    ...tokenStatus,
    refreshToken,
    checkTokenStatus,
    formatTimeUntilExpiration: () => formatTimeUntilExpiration(tokenStatus.timeUntilExpiration)
  };
};

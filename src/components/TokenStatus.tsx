// Composant pour afficher le statut du token
import React from 'react';
import { useTokenRefresh } from '../hooks/useTokenRefresh';

const TokenStatus: React.FC = () => {
  const { isValid, timeUntilExpiration, isRefreshing, formatTimeUntilExpiration } = useTokenRefresh();

  if (!isValid) {
    return (
      <div className="token-status expired">
        <span className="status-icon">⚠️</span>
        <span>Token expiré</span>
      </div>
    );
  }

  return (
    <div className={`token-status ${isRefreshing ? 'refreshing' : 'valid'}`}>
      <span className="status-icon">
        {isRefreshing ? '🔄' : '✅'}
      </span>
      <span>
        {isRefreshing ? 'Rafraîchissement...' : `Expire dans ${formatTimeUntilExpiration()}`}
      </span>
    </div>
  );
};

export default TokenStatus;

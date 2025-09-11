// Composant de diagnostic pour l'authentification
import React, { useState } from 'react';
import { useAuthStore, testApiConnectivity, diagnoseAuthIssues } from '../stores/authStoreRobust';

const AuthDiagnostic: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { user, token, isAuthenticated, error } = useAuthStore();

  const runDiagnostic = async () => {
    setIsRunning(true);
    setResults(null);

    try {
      console.log('🔍 Démarrage du diagnostic d\'authentification...');
      
      const diagnostic = await diagnoseAuthIssues();
      setResults(diagnostic);
      
      console.log('✅ Diagnostic terminé:', diagnostic);
    } catch (error) {
      console.error('❌ Erreur lors du diagnostic:', error);
      setResults({ error: 'Erreur lors du diagnostic' });
    } finally {
      setIsRunning(false);
    }
  };

  const testConnectivity = async () => {
    setIsRunning(true);
    
    try {
      const result = await testApiConnectivity();
      setResults({ connectivity: result });
    } catch (error) {
      console.error('❌ Erreur de connectivité:', error);
      setResults({ connectivity: { success: false, error: 'Erreur de connectivité' } });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="p-4 bg-gray-100 border border-gray-300 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">🔍 Diagnostic d'Authentification</h3>
      
      {/* État actuel */}
      <div className="mb-4 p-3 bg-white rounded border">
        <h4 className="font-medium mb-2">État Actuel :</h4>
        <div className="space-y-1 text-sm">
          <div>Authentifié : <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>
            {isAuthenticated ? '✅ Oui' : '❌ Non'}
          </span></div>
          <div>Utilisateur : <span className="font-mono">{user?.email || 'Aucun'}</span></div>
          <div>Rôle : <span className="font-mono">{user?.role || 'Aucun'}</span></div>
          <div>Token : <span className="font-mono">{token ? `${token.substring(0, 20)}...` : 'Aucun'}</span></div>
          {error && <div className="text-red-600">Erreur : {error}</div>}
        </div>
      </div>

      {/* Boutons de test */}
      <div className="flex space-x-2 mb-4">
        <button
          onClick={runDiagnostic}
          disabled={isRunning}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isRunning ? 'Diagnostic...' : 'Diagnostic Complet'}
        </button>
        
        <button
          onClick={testConnectivity}
          disabled={isRunning}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {isRunning ? 'Test...' : 'Test Connectivité'}
        </button>
      </div>

      {/* Résultats */}
      {results && (
        <div className="mt-4 p-3 bg-white rounded border">
          <h4 className="font-medium mb-2">Résultats :</h4>
          <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-64">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
        <h4 className="font-medium text-yellow-800 mb-2">Instructions :</h4>
        <ol className="text-sm text-yellow-700 space-y-1">
          <li>1. Cliquez sur "Diagnostic Complet" pour analyser tous les problèmes</li>
          <li>2. Vérifiez que l'URL de l'API est correcte</li>
          <li>3. Vérifiez que le token est présent et valide</li>
          <li>4. Si le token est expiré, reconnectez-vous</li>
          <li>5. Vérifiez la console du navigateur pour plus de détails</li>
        </ol>
      </div>
    </div>
  );
};

export default AuthDiagnostic;

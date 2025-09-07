import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface SystemStatus {
  database: {
    status: string;
    userCount: number;
    logCount: number;
    patientCount: number;
    invoiceCount: number;
    recentLogs: number;
  };
  server: {
    status: string;
    uptime: number;
    version: string;
    platform: string;
    arch: string;
  };
  resources: {
    memory: {
      total: number;
      used: number;
      free: number;
      usagePercent: number;
    };
    disk: {
      total: number;
      used: number;
      free: number;
      usagePercent: number;
    };
    cpu: {
      loadAverage: number[];
      cores: number;
    };
  };
  timestamp: string;
}

const SystemMaintenance: React.FC = () => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchSystemStatus();
  }, []);



  const fetchSystemStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/maintenance/status');
      setSystemStatus(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors du chargement du statut système');
    } finally {
      setLoading(false);
    }
  };

  const handleOptimizeDatabase = async () => {
    setIsOptimizing(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await axios.post('/api/maintenance/optimize-database', {});
      setSuccess(response.data.message);
      fetchSystemStatus(); // Rafraîchir les données
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de l\'optimisation');
    } finally {
      setIsOptimizing(false);
    }
  };

  const [cleanLogsDays, setCleanLogsDays] = useState(30);

  const handleCleanLogs = async () => {
    // Confirmation pour la suppression de tous les logs
    if (cleanLogsDays === 0) {
      const confirmed = window.confirm(
        '⚠️ ATTENTION: Vous êtes sur le point de supprimer TOUS les logs du système.\n\n' +
        'Cette action est irréversible et supprimera l\'historique complet des activités.\n\n' +
        'Êtes-vous absolument sûr de vouloir continuer ?'
      );
      if (!confirmed) return;
    }

    setIsCleaning(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await axios.post('/api/maintenance/clean-logs', {
        daysToKeep: cleanLogsDays
      });
      setSuccess(`${response.data.message} (${response.data.totalLogsBefore} → ${response.data.totalLogsAfter} logs)`);
      fetchSystemStatus(); // Rafraîchir les données
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors du nettoyage des logs');
    } finally {
      setIsCleaning(false);
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}j ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'opérationnelle':
      case 'en ligne':
        return 'bg-green-100 text-green-800';
      case 'erreur':
      case 'hors ligne':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getUsageColor = (percent: number) => {
    if (percent < 50) return 'bg-green-100 text-green-800';
    if (percent < 80) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Maintenance système</h1>
        <p className="mt-1 text-sm text-gray-500">
          Optimisez les performances et maintenez le système
        </p>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Optimisation de la base de données */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Optimisation de la base de données</h3>
              <p className="text-sm text-gray-500">
                Améliorez les performances en optimisant les index et en nettoyant les données
              </p>
            </div>
          </div>
          <div className="mt-6">
            <button
              onClick={handleOptimizeDatabase}
              disabled={isOptimizing}
              className="w-full btn-primary disabled:opacity-50"
            >
              {isOptimizing ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Optimisation en cours...
                </div>
              ) : (
                'Optimiser la base de données'
              )}
            </button>
          </div>
        </div>

        {/* Nettoyage des logs */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Nettoyage des logs</h3>
              <p className="text-sm text-gray-500">
                Supprimez les anciens logs pour libérer de l'espace disque
              </p>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Conserver les logs des derniers jours
              </label>
              <select
                value={cleanLogsDays}
                onChange={(e) => setCleanLogsDays(Number(e.target.value))}
                className="input-field"
                disabled={isCleaning}
              >
                <option value={1}>1 jour</option>
                <option value={7}>7 jours</option>
                <option value={30}>30 jours</option>
                <option value={90}>90 jours</option>
                <option value={365}>1 an</option>
                <option value={0}>Tous les logs (⚠️ Attention)</option>
              </select>
            </div>
            <button
              onClick={handleCleanLogs}
              disabled={isCleaning}
              className="w-full btn-primary disabled:opacity-50"
            >
              {isCleaning ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Nettoyage en cours...
                </div>
              ) : (
                `Nettoyer les logs (garder ${cleanLogsDays} jours)`
              )}
            </button>
          </div>
        </div>

        {/* Statut du système */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Statut du système</h3>
                <p className="text-sm text-gray-500">
                  Dernière mise à jour: {systemStatus ? new Date(systemStatus.timestamp).toLocaleString('fr-FR') : '-'}
                </p>
              </div>
            </div>
            <button 
              onClick={fetchSystemStatus}
              className="text-primary-600 hover:text-primary-900 text-sm font-medium"
            >
              Actualiser
            </button>
          </div>
          
          {systemStatus && (
            <div className="mt-6 space-y-4">
              {/* Base de données */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Base de données</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(systemStatus.database.status)}`}>
                  {systemStatus.database.status}
                </span>
              </div>
              
              {/* Serveur API */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Serveur API</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(systemStatus.server.status)}`}>
                  {systemStatus.server.status}
                </span>
              </div>
              
              {/* Temps de fonctionnement */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Temps de fonctionnement</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatUptime(systemStatus.server.uptime)}
                </span>
              </div>
              
              {/* Mémoire */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Mémoire</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUsageColor(systemStatus.resources.memory.usagePercent)}`}>
                  {systemStatus.resources.memory.usagePercent}% utilisé
                </span>
              </div>
              
              {/* Espace disque */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Espace disque</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUsageColor(systemStatus.resources.disk.usagePercent)}`}>
                  {systemStatus.resources.disk.usagePercent}% utilisé
                </span>
              </div>
              
              {/* CPU */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">CPU (charge moyenne)</span>
                <span className="text-sm font-medium text-gray-900">
                  {systemStatus.resources.cpu.loadAverage[0]?.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Statistiques de la base de données */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Statistiques de la base de données</h3>
              <p className="text-sm text-gray-500">
                Aperçu des données stockées
              </p>
            </div>
          </div>
          
          {systemStatus && (
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">{systemStatus.database.userCount}</div>
                <div className="text-sm text-gray-600">Utilisateurs</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">{systemStatus.database.patientCount}</div>
                <div className="text-sm text-gray-600">Patients</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-600">{systemStatus.database.invoiceCount}</div>
                <div className="text-sm text-gray-600">Factures</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-orange-600">{systemStatus.database.logCount}</div>
                <div className="text-sm text-gray-600">Logs totaux</div>
              </div>
            </div>
          )}
          
          {systemStatus && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-blue-800">
                  {systemStatus.database.recentLogs} actions effectuées dans les dernières 24h
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemMaintenance; 
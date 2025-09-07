import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminOverview: React.FC = () => {
  const [userCount, setUserCount] = useState<number | null>(null);
  const [logCount, setLogCount] = useState<number | null>(null);
  const [systemStatus, setSystemStatus] = useState<string>('Chargement...');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const lastFetchRef = useRef<number>(0);
  const intervalRef = useRef<any>(null);
  const mountedRef = useRef(true);
  const fetchingRef = useRef(false); // Protection contre les appels multiples

  // Fonction de chargement des stats simplifiée
  const fetchStats = useCallback(async (forceRefresh = false) => {
    if (!mountedRef.current) return;
    
    // Protection contre les appels multiples
    if (fetchingRef.current) {
      console.log('Chargement déjà en cours, ignoré');
      return;
    }
    
    const now = Date.now();
    const cacheDuration = 30000; // 30 secondes de cache
    
    // Vérifier le cache sauf si force refresh ou premier chargement
    if (!forceRefresh && lastFetchRef.current > 0 && now - lastFetchRef.current < cacheDuration) {
      console.log('Cache encore valide, pas de rechargement');
      return;
    }

    console.log('Chargement des stats...', forceRefresh ? '(force refresh)' : '(cache expiré)');
    
    fetchingRef.current = true;
    
    // Gérer les états de chargement
    if (forceRefresh) {
      setRefreshing(true);
      setLoading(false); // S'assurer que loading est false pendant refresh
    } else {
      setLoading(true);
      setRefreshing(false); // S'assurer que refreshing est false pendant loading
    }
    
    setError(null);

    try {
      // Appels API en parallèle avec timeouts courts
      const [usersRes, logsRes, healthRes] = await Promise.allSettled([
        axios.get('/api/users', { 
          timeout: 5000
        }),
        axios.get('/api/logs?page=1&limit=1', { 
          timeout: 5000
        }),
        axios.get('/api/health', { 
          timeout: 3000
        })
      ]);

      if (!mountedRef.current) return;

      let hasError = false;

      // Traiter les résultats des utilisateurs
      if (usersRes.status === 'fulfilled') {
        const count = Array.isArray(usersRes.value.data.users) 
          ? usersRes.value.data.users.length 
          : Array.isArray(usersRes.value.data) 
            ? usersRes.value.data.length 
            : 0;
        setUserCount(count);
        console.log('Utilisateurs chargés:', count);
      } else {
        console.error('Erreur utilisateurs:', usersRes.reason);
        setUserCount(null);
        hasError = true;
      }

      // Traiter les résultats des logs
      if (logsRes.status === 'fulfilled') {
        const count = logsRes.value.data.pagination?.totalLogs || 0;
        setLogCount(count);
        console.log('Logs chargés:', count);
      } else {
        console.error('Erreur logs:', logsRes.reason);
        setLogCount(null);
        hasError = true;
      }

      // Traiter les résultats du statut système
      if (healthRes.status === 'fulfilled') {
        const status = healthRes.value.data.status === 'OK' ? 'Opérationnel' : 'Problème';
        setSystemStatus(status);
        console.log('Statut système:', status);
      } else {
        console.error('Erreur statut:', healthRes.reason);
        setSystemStatus('Erreur');
        hasError = true;
      }

      if (hasError) {
        setError('Certaines données n\'ont pas pu être chargées');
      } else {
        setError(null); // Effacer les erreurs précédentes si tout va bien
      }

      lastFetchRef.current = now;
      console.log('Stats mises à jour à:', new Date(now).toLocaleTimeString());

    } catch (e: any) {
      if (!mountedRef.current) return;
      console.error('Erreur générale lors du chargement des stats:', e);
      
      // Gestion spécifique des erreurs d'authentification
      if (e.response?.status === 401) {
        setError('Erreur d\'authentification. Veuillez vous reconnecter.');
        // Rediriger vers la page de login si nécessaire
        setTimeout(() => {
          if (mountedRef.current) {
            navigate('/login');
          }
        }, 2000);
      } else {
        setError('Erreur de connexion au serveur');
      }
      
      setUserCount(null);
      setLogCount(null);
      setSystemStatus('Erreur');
    } finally {
      if (!mountedRef.current) return;
      fetchingRef.current = false;
      
      // Réinitialiser les états de chargement
      if (forceRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [navigate]);

  // Initialisation simple
  useEffect(() => {
    console.log('Initialisation du dashboard admin');
    mountedRef.current = true;
    
    // Chargement initial (pas de force refresh pour éviter la confusion)
    fetchStats(false);
    
    // Rafraîchissement automatique toutes les 5 minutes (au lieu de 2)
    intervalRef.current = setInterval(() => {
      if (mountedRef.current) {
        console.log('Rafraîchissement automatique');
        fetchStats(false);
      }
    }, 300000); // 5 minutes

    return () => {
      console.log('Nettoyage du dashboard admin');
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchStats]);

  // Fonction de rafraîchissement manuel
  const handleManualRefresh = useCallback(() => {
    console.log('Rafraîchissement manuel demandé');
    fetchStats(true);
  }, [fetchStats]);

  console.log('Rendu - loading:', loading, 'refreshing:', refreshing, 'userCount:', userCount, 'logCount:', logCount);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vue d'ensemble - Administration</h1>
          <p className="mt-1 text-sm text-gray-500">
            Tableau de bord administrateur de la Polyclinique des Apôtres
          </p>
        </div>
        <button
          className={`btn-primary flex items-center gap-2${refreshing ? ' opacity-60 cursor-not-allowed' : ''}`}
          onClick={handleManualRefresh}
          disabled={refreshing}
        >
          <span>Actualiser</span>
          {refreshing && <div className="animate-spin">⟳</div>}
        </button>
      </div>

      {/* Affichage des erreurs */}
      {error && (
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
      )}

      {/* Indicateur de dernière mise à jour */}
      {lastFetchRef.current > 0 && (
        <div className="text-xs text-gray-500 text-center">
          Dernière mise à jour : {new Date(lastFetchRef.current).toLocaleTimeString()}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Statistiques utilisateurs */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Utilisateurs actifs</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {loading ? 'Chargement...' : userCount !== null ? userCount : 'Erreur'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques logs */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Logs aujourd'hui</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {loading ? 'Chargement...' : logCount !== null ? logCount : 'Erreur'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Statut système */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Statut système</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {loading ? 'Chargement...' : systemStatus}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Actions rapides</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <button
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              onClick={() => navigate('/admin/users')}
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nouvel utilisateur
            </button>
            <button
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              onClick={() => navigate('/admin/backup')}
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Sauvegarde BDD
            </button>
            <button
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              onClick={() => navigate('/admin/logs')}
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Voir les logs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview; 
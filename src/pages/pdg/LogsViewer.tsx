import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface Log {
  id: number;
  user: User;
  action: string;
  details?: string;
  createdAt: string;
}

const actionLabels: Record<string, string> = {
  'Connexion réussie': 's’est connecté(e)',
  'Déconnexion': 's’est déconnecté(e)',
  'Suppression': 'a supprimé un élément',
  'Impression facture': 'a imprimé une facture',
  'Autorisation d’approvisionnement': 'a approuvé une demande d’approvisionnement',
  'Création demande approvisionnement': 'a créé une demande d’approvisionnement',
  'Approbation demande approvisionnement': 'a approuvé une demande d’approvisionnement',
  'Rejet demande approvisionnement': 'a rejeté une demande d’approvisionnement',
  'Mouvement stock': 'a enregistré un mouvement de stock',
  'Vente médicament': 'a enregistré une vente de médicament',
  // Ajoute d’autres actions ici si besoin
};

function getActionLabel(log: Log) {
  if (!log.user) {
    // Log système ou technique
    if (log.action && log.action.startsWith('Consultation sur')) {
      // Décodage humain des pages principales
      const pageMap: Record<string, string> = {
        '/': "Tableau de bord",
        '/pdg': "Tableau de bord PDG",
        '/pdg/financial': "Finances",
        '/pdg/logs': "Journaux",
        '/pdg/employees': "Employés",
        '/pdg/stock': "Stock",
        '/pdg/requests': "Validation des demandes",
        '/pdg/settings': "Paramètres",
        '/caissier': "Espace Caissier",
        '/caissier/invoices': "Factures Caissier",
        '/caissier/medications': "Ventes de médicaments",
        '/caissier/exams': "Examens Caissier",
        '/caissier/consultations': "Consultations Caissier",
        // Ajoute d'autres routes si besoin
      };
      const url = log.details && typeof log.details === 'string' && log.details.includes('url')
        ? (() => { try { return JSON.parse(log.details).url; } catch { return null; } })() : null;
      const page = pageMap[url] || pageMap[log.action.replace('Consultation sur ', '')] || url || log.action.replace('Consultation sur ', '');
      return `Consultation de la page « ${page} »`;
    }
    return 'Action système ou technique';
  }
  if (actionLabels[log.action]) {
    return `${log.user.firstName} ${log.user.lastName} (${log.user.role}) ${actionLabels[log.action]}`;
  }
  // Décodage humain pour les actions génériques
  if (log.action.startsWith('Consultation de la liste des')) {
    return `${log.user.firstName} ${log.user.lastName} (${log.user.role}) a consulté la liste des ${log.action.replace('Consultation de la liste des ', '')}`;
  }
  if (log.action.startsWith('Suppression d\'un utilisateur')) {
    return `${log.user.firstName} ${log.user.lastName} (${log.user.role}) a supprimé un utilisateur`;
  }
  if (log.action.startsWith('Consultation des journaux d\'activité')) {
    return `${log.user.firstName} ${log.user.lastName} (${log.user.role}) a consulté la page journaux`;
  }
  // Fallback générique
  return `${log.user.firstName} ${log.user.lastName} (${log.user.role}) a effectué une action : ${log.action}`;
}

function getUserDisplay(log: Log) {
  if (!log.user) return 'Système';
  return `${log.user.firstName} ${log.user.lastName}`;
}
function getRoleDisplay(log: Log) {
  if (!log.user) return 'Système';
  return log.user.role || 'Utilisateur';
}
function getDetailsDisplay(log: Log) {
  if (!log.details) return '-';
  try {
    const obj = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
    if (obj && typeof obj === 'object') {
      let phrases = [];
      // Page visitée
      if (obj.url) {
        const pageMap: Record<string, string> = {
          '/': "le tableau de bord",
          '/pdg': "le tableau de bord PDG",
          '/pdg/financial': "la page finances",
          '/pdg/logs': "la page journaux",
          '/pdg/employees': "la page employés",
          '/pdg/stock': "la page stock",
          '/pdg/requests': "la page validation des demandes",
          '/pdg/settings': "la page paramètres",
          '/caissier': "l'espace caissier",
          '/caissier/invoices': "les factures caissier",
          '/caissier/medications': "les ventes de médicaments",
          '/caissier/exams': "les examens caissier",
          '/caissier/consultations': "les consultations caissier",
        };
        const page = pageMap[obj.url] || `la page ${obj.url}`;
        phrases.push(`Sur ${page}`);
      }
      // IP
      if (obj.ipAddress) {
        phrases.push(`depuis l'adresse IP ${obj.ipAddress}`);
      }
      // Navigateur
      if (obj.userAgent) {
        phrases.push('via un navigateur web');
      }
      if (phrases.length > 0) return phrases.join(' ');
    }
  } catch {}
  if (typeof log.details === 'string' && log.details.length < 100) return log.details;
  return '-';
}

const LogsViewer: React.FC = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Filtres
  const [filterName, setFilterName] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterDate, setFilterDate] = useState('');
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [logsPerPage] = useState(50);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: logsPerPage.toString()
        });
        
        if (filterName.trim()) params.append('user', filterName);
        if (filterRole) params.append('role', filterRole);
        if (filterDate) params.append('date', filterDate);

        const res = await axios.get(`/api/logs?${params}`);
        setLogs(res.data.logs);
        setTotalPages(res.data.pagination.totalPages);
        setTotalLogs(res.data.pagination.totalLogs);
      } catch (err) {
        setError('Erreur lors du chargement des logs');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [currentPage, filterName, filterRole, filterDate, logsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFilterChange = () => {
    setCurrentPage(1); // Retour à la première page lors du filtrage
  };

  // Liste complète des rôles du système
  const allRoles = [
    'ADMIN',
    'CAISSIER',
    'LOGISTICIEN',
    'PDG',
    'RH',
    'MEDECIN',
    'AGENT_HOSPITALISATION',
    'LABORANTIN',
    'AGENT_MATERNITE',
  ];
  // Rôles présents dans les logs (pour compatibilité)
  // const roles = Array.from(new Set(logs.map(l => l.user?.role).filter(Boolean)));

  // Filtrage local (seulement pour le nom et la date, le rôle est géré côté backend)
  const filteredLogs = logs.filter(log => {
    const nameMatch = filterName.trim() === '' || (
      (log.user?.firstName?.toLowerCase() || '').includes(filterName.toLowerCase()) ||
      (log.user?.lastName?.toLowerCase() || '').includes(filterName.toLowerCase())
    );
    const dateMatch = !filterDate || (log.createdAt && log.createdAt.slice(0, 10) === filterDate);
    return nameMatch && dateMatch;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Journaux d'activité</h1>
        <button
          className={`btn-primary flex items-center gap-2${loading ? ' opacity-60 cursor-not-allowed' : ''}`}
          onClick={() => window.location.reload()}
          disabled={loading}
        >
          <span>Actualiser</span>
          {loading && <div className="animate-spin">⟳</div>}
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom d'utilisateur
            </label>
            <input
              type="text"
              value={filterName}
              onChange={(e) => {
                setFilterName(e.target.value);
                handleFilterChange();
              }}
              placeholder="Rechercher par nom..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rôle
            </label>
            <select
              value={filterRole}
              onChange={(e) => {
                setFilterRole(e.target.value);
                handleFilterChange();
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les rôles</option>
              {allRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => {
                setFilterDate(e.target.value);
                handleFilterChange();
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {error && <div className="bg-red-100 text-red-700 p-2 mb-2 rounded">{error}</div>}
      <div className="card overflow-x-auto">
        {loading ? (
          <div>Chargement...</div>
        ) : filteredLogs.length === 0 ? (
          <div>Aucun log trouvé.</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2">Date</th>
                <th className="p-2">Utilisateur</th>
                <th className="p-2">Rôle</th>
                <th className="p-2">Action</th>
                <th className="p-2">Détails</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => (
                <tr key={log.id} className="border-b">
                  <td className="p-2">{log.createdAt ? new Date(log.createdAt).toLocaleString('fr-FR') : ''}</td>
                  <td className="p-2">{getUserDisplay(log)}</td>
                  <td className="p-2 capitalize">{getRoleDisplay(log)}</td>
                  <td className="p-2">{getActionLabel(log)}</td>
                  <td className="p-2">{getDetailsDisplay(log)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-600">
          Affichage de {((currentPage - 1) * logsPerPage) + 1} à {Math.min(currentPage * logsPerPage, totalLogs)} sur {totalLogs} logs
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Précédent
          </button>
          
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const page = i + 1;
            return (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 border rounded-md ${
                  currentPage === page 
                    ? 'bg-blue-500 text-white border-blue-500' 
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            );
          })}
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogsViewer; 
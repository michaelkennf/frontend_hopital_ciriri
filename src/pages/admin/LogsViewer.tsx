import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Log {
  id: number;
  user: { id: number; email: string };
  action: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

const LogsViewer: React.FC = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ user: '', action: '', date: '' });

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filters.user) params.user = filters.user;
      if (filters.action) params.action = filters.action;
      if (filters.date) params.date = filters.date;
      const res = await axios.get('/api/logs', { params });
      setLogs(res.data.logs || []);
    } catch (e) {
      setLogs([]);
      setError('Erreur lors de la récupération des logs');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Journal d'activité</h1>
      <p className="text-gray-600 mb-6">Consultez l'historique des actions effectuées dans le système.</p>
      <div className="card mb-6">
        <div className="flex flex-wrap gap-4 mb-4">
          <input
            type="text"
            name="user"
            placeholder="Filtrer par utilisateur"
            value={filters.user}
            onChange={handleChange}
            className="input-field"
          />
          <input
            type="text"
            name="action"
            placeholder="Filtrer par type d'action"
            value={filters.action}
            onChange={handleChange}
            className="input-field"
          />
          <input
            type="date"
            name="date"
            value={filters.date}
            onChange={handleChange}
            className="input-field"
          />
        </div>
        {error && <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4 text-red-700">{error}</div>}
        {loading ? (
          <div className="flex items-center justify-center h-24">Chargement...</div>
        ) : logs.length === 0 ? (
          <div className="text-gray-500">Aucun log trouvé.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date et heure</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Utilisateur</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action effectuée</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Informations techniques</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm">
                      {new Date(log.createdAt).toLocaleString('fr-FR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-4 py-2 text-sm font-medium">
                      {log.user?.email || 'Utilisateur inconnu'}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-500">
                      <details className="cursor-pointer">
                        <summary className="hover:text-gray-700">Voir les détails</summary>
                        <div className="mt-2 space-y-1">
                          {log.ipAddress && <div>Adresse IP: {log.ipAddress}</div>}
                          {log.details && (
                            <div>
                              Détails: <code className="bg-gray-100 px-1 rounded text-xs">{log.details}</code>
                            </div>
                          )}
                        </div>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogsViewer; 
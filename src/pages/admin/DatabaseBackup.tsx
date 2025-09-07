import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Backup {
  filename: string;
  size: string;
  createdAt: string;
  status: 'completed' | 'failed' | 'in_progress';
}

const DatabaseBackup: React.FC = () => {
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchBackups = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/backup');
      setBackups(res.data.backups || []);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Erreur lors du chargement des sauvegardes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    setError(null);
    setSuccess(null);
    try {
      await axios.post('/api/backup');
      setSuccess('Sauvegarde créée avec succès !');
      fetchBackups();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Erreur lors de la création de la sauvegarde');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleDownloadBackup = (backup: Backup) => {
    window.open(`/api/backup/${backup.filename}`, '_blank');
  };

  const handleDeleteBackup = async (backup: Backup) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ${backup.filename} ?`)) return;
    setError(null);
    setSuccess(null);
    try {
      await axios.delete(`/api/backup/${backup.filename}`);
      setSuccess('Sauvegarde supprimée avec succès !');
      fetchBackups();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Erreur lors de la suppression de la sauvegarde');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Terminé
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Échec
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            En cours
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sauvegarde de la base de données</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gérez les sauvegardes automatiques et manuelles
          </p>
        </div>
        <button
          onClick={handleCreateBackup}
          disabled={isCreatingBackup}
          className="btn-primary disabled:opacity-50"
        >
          {isCreatingBackup ? (
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Création en cours...
            </div>
          ) : (
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Créer une sauvegarde
            </div>
          )}
        </button>
      </div>
      {error && <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 rounded-md p-4 text-green-700">{success}</div>}
      {loading ? (
        <div className="flex items-center justify-center h-32">Chargement...</div>
      ) : (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Sauvegardes disponibles</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fichier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Taille
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date de création
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {backups.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-400">Aucune sauvegarde disponible.</td>
                    </tr>
                  ) : (
                    backups.map((backup) => (
                      <tr key={backup.filename} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {backup.filename}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {backup.size}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(backup.createdAt).toLocaleString('fr-FR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(backup.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleDownloadBackup(backup)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            Télécharger
                          </button>
                          <button
                            onClick={() => handleDeleteBackup(backup)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseBackup; 
import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: number;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  phone: string;
  createdAt: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    email: '',
    password: '',
    role: 'admin',
    firstName: '',
    lastName: '',
    phone: ''
  });
  const [addError, setAddError] = useState<string | null>(null);
  const [addLoading, setAddLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  // Effacer le message de succès après 5 secondes
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('Token envoyé:', localStorage.getItem('auth-token'));
      const response = await axios.get('/api/users');
      setUsers(response.data.users || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleAddChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAddForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError(null);
    try {
      await axios.post('/api/users', addForm);
      setShowAddModal(false);
      setAddForm({ email: '', password: '', role: 'admin', firstName: '', lastName: '', phone: '' });
      fetchUsers();
      setSuccess('Utilisateur créé avec succès !');
    } catch (err: any) {
      setAddError(err.response?.data?.error || 'Erreur lors de la création de l\'utilisateur');
    } finally {
      setAddLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    setResetLoading(true);
    setResetError(null);
    try {
      await axios.patch(`/api/users/${selectedUser.id}/reset-password`, {
        newPassword: resetPassword
      });
      setShowResetModal(false);
      setSelectedUser(null);
      setResetPassword('');
      setSuccess('Mot de passe réinitialisé avec succès !');
    } catch (err: any) {
      setResetError(err.response?.data?.error || 'Erreur lors de la réinitialisation du mot de passe');
    } finally {
      setResetLoading(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
          if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email} ?\n\nCette action est irréversible.`)) {
      return;
    }

    try {
      await axios.delete(`/api/users/${user.id}`);
      fetchUsers();
      setSuccess('Utilisateur supprimé avec succès !');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la suppression de l\'utilisateur');
    }
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
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des utilisateurs</h1>
            <p className="mt-1 text-sm text-gray-500">
              Gérez les comptes utilisateurs et leurs permissions
            </p>
          </div>
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Ajouter un utilisateur
          </button>
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

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-700">Liste des utilisateurs ({users.length})</h3>
            <button 
              onClick={fetchUsers} 
              className="text-sm text-primary-600 hover:text-primary-800 flex items-center"
            >
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Actualiser
            </button>
          </div>
          <ul className="divide-y divide-gray-200">
            {users.map((user) => (
              <li key={user.id} className="hover:bg-gray-50 transition-colors">
                <div className="px-4 py-4 flex items-center justify-between sm:px-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary-800">
                          {user.firstName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900">
                          {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email}
                        </p>
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Actif
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <p className="text-sm text-gray-500">
                        <span className="font-medium">Rôle:</span> {user.role}
                      </p>
                      <p className="text-xs text-gray-400">
                        Créé le {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      className="text-primary-600 hover:text-primary-900 text-sm font-medium px-3 py-1 rounded hover:bg-primary-50" 
                      onClick={() => {
                        setSelectedUser(user);
                        setShowResetModal(true);
                        setResetPassword('');
                        setResetError(null);
                      }}
                    >
                      Modifier
                    </button>
                    <button 
                      className="text-red-600 hover:text-red-900 text-sm font-medium px-3 py-1 rounded hover:bg-red-50" 
                      onClick={() => handleDeleteUser(user)}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {users.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <p className="mt-2 text-sm">Aucun utilisateur trouvé</p>
              <p className="text-xs">Commencez par ajouter un utilisateur</p>
            </div>
          )}
        </div>
      </div>
      {/* Modale d'ajout d'utilisateur */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 w-full max-w-md sm:max-w-lg md:max-w-xl relative mx-2">
            {/* Header modale : titre + bouton fermer alignés */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Nouvel utilisateur</h2>
              <button
                className="text-gray-400 hover:text-gray-600 ml-2"
                onClick={() => setShowAddModal(false)}
                aria-label="Fermer"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddUser} className="w-full space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2" htmlFor="email">Email *</label>
                  <input type="email" id="email" name="email" required placeholder="exemple@hopital.com" className="input-field h-12 text-base" value={addForm.email} onChange={handleAddChange} />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2" htmlFor="password">Mot de passe *</label>
                  <input type="password" id="password" name="password" required placeholder="Mot de passe sécurisé" className="input-field h-12 text-base" value={addForm.password} onChange={handleAddChange} />
                </div>
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2" htmlFor="role">Rôle *</label>
                <select id="role" name="role" required className="input-field h-12 text-base" value={addForm.role} onChange={handleAddChange}>
                  <option value="">Sélectionner un rôle</option>
                  <option value="ADMIN">Admin</option>
                  <option value="PDG">PDG</option>
                  <option value="RH">RH</option>
                  <option value="CAISSIER">Caissier</option>
                  <option value="LOGISTICIEN">Logisticien</option>
                  <option value="MEDECIN">Médecin</option>
                  <option value="AGENT_HOSPITALISATION">Agent Hospitalisation</option>
                  <option value="LABORANTIN">Laborantin</option>
                  <option value="AGENT_MATERNITE">Agent Maternité</option>
                </select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2" htmlFor="firstName">Prénom *</label>
                  <input type="text" id="firstName" name="firstName" required placeholder="Prénom de l'utilisateur" className="input-field h-12 text-base" value={addForm.firstName} onChange={handleAddChange} />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2" htmlFor="lastName">Nom *</label>
                  <input type="text" id="lastName" name="lastName" required placeholder="Nom de l'utilisateur" className="input-field h-12 text-base" value={addForm.lastName} onChange={handleAddChange} />
                </div>
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2" htmlFor="phone">Téléphone *</label>
                <input type="text" id="phone" name="phone" required placeholder="+243 XXX XXX XXX" className="input-field h-12 text-base" value={addForm.phone} onChange={handleAddChange} />
              </div>
              {addError && <div className="text-red-600 text-sm mb-4">{addError}</div>}
              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <button 
                  type="button" 
                  className="w-full sm:w-auto px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed" 
                  onClick={() => setShowAddModal(false)} 
                  disabled={addLoading}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="w-full sm:w-auto px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed" 
                  disabled={addLoading}
                >
                  {addLoading ? 'Création...' : 'Créer l\'utilisateur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modale de réinitialisation de mot de passe */}
      {showResetModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 w-full max-w-md relative mx-2">
            {/* Header modale : titre + bouton fermer alignés */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Réinitialiser le mot de passe</h2>
              <button
                className="text-gray-400 hover:text-gray-600 ml-2"
                onClick={() => {
                  setShowResetModal(false);
                  setSelectedUser(null);
                  setResetPassword('');
                  setResetError(null);
                }}
                aria-label="Fermer"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Réinitialiser le mot de passe pour : <strong>{selectedUser.firstName && selectedUser.lastName ? `${selectedUser.firstName} ${selectedUser.lastName}` : selectedUser.email}</strong>
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="w-full space-y-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2" htmlFor="newPassword">Nouveau mot de passe *</label>
                <input 
                  type="password" 
                  id="newPassword" 
                  required 
                  placeholder="Entrez le nouveau mot de passe" 
                  className="input-field h-12 text-base" 
                  value={resetPassword} 
                  onChange={(e) => setResetPassword(e.target.value)} 
                />
              </div>
              
              {resetError && <div className="text-red-600 text-sm mb-4">{resetError}</div>}
              
              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <button 
                  type="button" 
                  className="w-full sm:w-auto px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed" 
                  onClick={() => {
                    setShowResetModal(false);
                    setSelectedUser(null);
                    setResetPassword('');
                    setResetError(null);
                  }} 
                  disabled={resetLoading}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed" 
                  disabled={resetLoading}
                >
                  {resetLoading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default UserManagement; 
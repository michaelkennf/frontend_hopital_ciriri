// Version robuste de la gestion des patients avec authentification améliorée
import React, { useState, useEffect } from 'react';
import apiClient from '../../utils/axiosConfig';
import { useAuthStore } from '../../stores/authStoreRobust';

function generateFolderNumber(currentYear: number, lastNumber: number) {
  return `${currentYear}-${String(lastNumber + 1).padStart(3, '0')}`;
}

function calculateAge(dateNaissance: string) {
  if (!dateNaissance) return '';
  const birth = new Date(dateNaissance);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  weight: number;
  address: string;
  phone: string;
  folderNumber: string;
  createdAt?: string;
}

const PatientsManagementRobust: React.FC = () => {
  const { user, isAuthenticated, checkAuth } = useAuthStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    nom: '',
    postNom: '',
    sexe: '',
    dateNaissance: '',
    age: '',
    poids: '',
    adresse: '',
    telephone: '',
    numeroDossier: '',
  });
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lastFolderNumber, setLastFolderNumber] = useState(0);
  const [authError, setAuthError] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();

  // Vérifier l'authentification au montage
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('[PATIENTS ROBUST] Vérification de l\'authentification...');
      
      if (!isAuthenticated) {
        console.log('[PATIENTS ROBUST] Non authentifié, tentative de vérification...');
        const result = await checkAuth();
        
        if (!result.success) {
          console.error('[PATIENTS ROBUST] Échec de l\'authentification:', result.error);
          setAuthError(result.error || 'Erreur d\'authentification');
          return;
        }
      }
      
      console.log('[PATIENTS ROBUST] Authentifié:', user?.email);
      setAuthError(null);
    };

    initializeAuth();
  }, [isAuthenticated, checkAuth, user]);

  // Charger les patients
  const fetchPatients = async () => {
    console.log('[PATIENTS ROBUST] Chargement des patients...');
    setLoading(true);
    setError(null);
    
    try {
      const res = await apiClient.get('/api/patients');
      console.log('[PATIENTS ROBUST] Patients chargés:', res.data.patients?.length || 0);
      
      setPatients(res.data.patients || []);
      
      // Pour la génération locale du numéro de dossier (affichage uniquement)
      if (res.data.patients && res.data.patients.length > 0) {
        const last = res.data.patients[0].folderNumber;
        if (last && last.startsWith(`${currentYear}-`)) {
          const number = parseInt(last.split('-')[1]);
          setLastFolderNumber(number);
        }
      }
    } catch (err: any) {
      console.error('[PATIENTS ROBUST] Erreur lors du chargement:', err);
      
      if (err.response?.status === 401) {
        setError('Token d\'accès requis. Veuillez vous reconnecter.');
        setAuthError('Token d\'accès requis. Veuillez vous reconnecter.');
      } else if (err.response?.status === 403) {
        setError('Accès refusé. Vérifiez vos permissions.');
      } else if (err.code === 'NETWORK_ERROR' || err.message.includes('Network Error')) {
        setError('Erreur de connexion. Vérifiez votre connexion internet.');
      } else {
        setError(err.response?.data?.error || err.message || 'Erreur lors du chargement des patients');
      }
    } finally {
      setLoading(false);
    }
  };

  // Charger les patients au montage
  useEffect(() => {
    if (isAuthenticated && !authError) {
      fetchPatients();
    }
  }, [isAuthenticated, authError]);

  // Créer un patient
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[PATIENTS ROBUST] Création d\'un patient...');
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const res = await apiClient.post('/api/patients', {
        firstName: form.nom,
        lastName: form.postNom,
        sexe: form.sexe,
        dateNaissance: form.dateNaissance,
        poids: form.poids,
        adresse: form.adresse,
        telephone: form.telephone,
        numeroDossier: form.numeroDossier,
      });

      console.log('[PATIENTS ROBUST] Patient créé avec succès:', res.data);
      
      setSuccess('Patient enregistré avec succès !');
      setForm({
        nom: '',
        postNom: '',
        sexe: '',
        dateNaissance: '',
        age: '',
        poids: '',
        adresse: '',
        telephone: '',
        numeroDossier: '',
      });
      setShowForm(false);
      
      // Recharger la liste des patients
      await fetchPatients();
    } catch (err: any) {
      console.error('[PATIENTS ROBUST] Erreur lors de la création:', err);
      
      if (err.response?.status === 401) {
        setError('Token d\'accès requis. Veuillez vous reconnecter.');
        setAuthError('Token d\'accès requis. Veuillez vous reconnecter.');
      } else if (err.response?.status === 403) {
        setError('Accès refusé. Vérifiez vos permissions.');
      } else if (err.code === 'NETWORK_ERROR' || err.message.includes('Network Error')) {
        setError('Erreur de connexion. Vérifiez votre connexion internet.');
      } else {
        setError(err.response?.data?.error || err.message || 'Erreur lors de l\'enregistrement du patient');
      }
    } finally {
      setLoading(false);
    }
  };

  // Gérer le changement de date de naissance
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    setForm(prev => ({
      ...prev,
      dateNaissance: date,
      age: calculateAge(date).toString()
    }));
  };

  // Gérer l'ouverture du formulaire
  const handleShowForm = () => {
    if (!isAuthenticated) {
      setError('Vous devez être connecté pour créer un patient.');
      return;
    }
    
    setShowForm(true);
    setForm(prev => ({
      ...prev,
      numeroDossier: generateFolderNumber(currentYear, lastFolderNumber)
    }));
  };

  // Si pas authentifié, afficher un message
  if (!isAuthenticated || authError) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <h3 className="font-bold">Erreur d'Authentification</h3>
          <p className="mt-2">
            {authError || 'Vous devez être connecté pour accéder à cette page.'}
          </p>
          <div className="mt-4">
            <button
              onClick={() => window.location.href = '/login'}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Se Connecter
            </button>
            <button
              onClick={checkAuth}
              className="ml-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestion des Patients</h1>
        <button
          onClick={handleShowForm}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Nouveau Patient
        </button>
      </div>

      {/* Messages d'erreur et de succès */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Erreur :</strong> {error}
          <button
            onClick={() => setError(null)}
            className="ml-4 text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          <strong>Succès :</strong> {success}
          <button
            onClick={() => setSuccess(null)}
            className="ml-4 text-green-500 hover:text-green-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* Formulaire de création */}
      {showForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Nouveau Patient</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nom *</label>
                <input
                  type="text"
                  required
                  value={form.nom}
                  onChange={(e) => setForm(prev => ({ ...prev, nom: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Post-nom *</label>
                <input
                  type="text"
                  required
                  value={form.postNom}
                  onChange={(e) => setForm(prev => ({ ...prev, postNom: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Sexe *</label>
                <select
                  required
                  value={form.sexe}
                  onChange={(e) => setForm(prev => ({ ...prev, sexe: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Sélectionner</option>
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date de naissance *</label>
                <input
                  type="date"
                  required
                  value={form.dateNaissance}
                  onChange={handleDateChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Âge</label>
                <input
                  type="text"
                  value={form.age}
                  readOnly
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Poids (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.poids}
                  onChange={(e) => setForm(prev => ({ ...prev, poids: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Adresse</label>
                <input
                  type="text"
                  value={form.adresse}
                  onChange={(e) => setForm(prev => ({ ...prev, adresse: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                <input
                  type="tel"
                  value={form.telephone}
                  onChange={(e) => setForm(prev => ({ ...prev, telephone: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Numéro de dossier</label>
                <input
                  type="text"
                  value={form.numeroDossier}
                  onChange={(e) => setForm(prev => ({ ...prev, numeroDossier: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des patients */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Liste des Patients</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Gestion des dossiers patients
          </p>
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2">Chargement des patients...</p>
          </div>
        ) : patients.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucun patient trouvé
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {patients.map((patient) => (
              <li key={patient.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-gray-900">
                        {patient.firstName} {patient.lastName}
                      </p>
                      <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {patient.folderNumber}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {patient.gender === 'M' ? 'Masculin' : 'Féminin'} • 
                      {patient.dateOfBirth ? ` ${calculateAge(patient.dateOfBirth)} ans` : ''} • 
                      {patient.phone}
                    </p>
                    <p className="text-sm text-gray-500">
                      {patient.address}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-900 text-sm">
                      Voir
                    </button>
                    <button className="text-green-600 hover:text-green-900 text-sm">
                      Modifier
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default PatientsManagementRobust;

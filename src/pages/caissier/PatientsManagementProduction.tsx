// Version optimisée pour la production de la gestion des patients
import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../utils/axiosConfigProduction';

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

const PatientsManagementProduction: React.FC = () => {
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
  const [isCreating, setIsCreating] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isProduction, setIsProduction] = useState(false);

  const currentYear = new Date().getFullYear();

  // Détecter l'environnement de production
  useEffect(() => {
    const isProd = window.location.hostname.includes('pages.dev') || 
                   window.location.hostname.includes('cloudflare') ||
                   window.location.hostname.includes('onrender.com') ||
                   import.meta.env.PROD;
    setIsProduction(isProd);
    console.log('[PATIENTS PRODUCTION] Environnement détecté:', { isProduction: isProd, hostname: window.location.hostname });
  }, []);

  // Fonction de chargement des patients optimisée pour la production
  const fetchPatients = useCallback(async (retryCount = 0) => {
    console.log(`[PATIENTS PRODUCTION] Chargement des patients (tentative ${retryCount + 1})...`);
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await apiClient.get('/api/patients');
      console.log('[PATIENTS PRODUCTION] Réponse reçue:', res.data);
      
      const patientsData = res.data.patients || [];
      console.log('[PATIENTS PRODUCTION] Patients chargés:', patientsData.length);
      
      setPatients(patientsData);
      setRetryCount(0); // Reset retry count on success
      
      // Mettre à jour le dernier numéro de dossier
      if (patientsData.length > 0) {
        const last = patientsData[0].folderNumber;
        if (last && last.startsWith(`${currentYear}-`)) {
          const number = parseInt(last.split('-')[1], 10);
          setLastFolderNumber(number);
          console.log('[PATIENTS PRODUCTION] Dernier numéro:', number);
        }
      }
      
    } catch (e: any) {
      console.error('[PATIENTS PRODUCTION] Erreur lors du chargement:', e);
      
      // Retry automatique en production avec délai progressif
      if (retryCount < 3) {
        const delay = isProduction ? Math.pow(2, retryCount) * 1000 : 1000; // 1s, 2s, 4s en production
        console.log(`[PATIENTS PRODUCTION] Retry dans ${delay}ms...`);
        setRetryCount(retryCount + 1);
        setTimeout(() => fetchPatients(retryCount + 1), delay);
        return;
      }
      
      // Gestion d'erreurs spécifique à la production
      if (e.name === 'ApiUrlError') {
        setError('Configuration API incorrecte. Veuillez contacter l\'administrateur.');
      } else if (e.name === 'NetworkError') {
        setError('Erreur de connexion. Vérifiez votre connexion internet.');
      } else if (e.name === 'TimeoutError') {
        setError('Délai d\'attente dépassé. Veuillez réessayer.');
      } else if (e.response?.status === 401) {
        setError('Session expirée. Veuillez vous reconnecter.');
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else if (e.response?.status === 403) {
        setError('Accès refusé. Vérifiez vos permissions.');
      } else {
        setError(e.response?.data?.error || 'Erreur lors du chargement des patients');
      }
    } finally {
      setLoading(false);
    }
  }, [currentYear, isProduction]);

  // Charger les patients au montage
  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  // Créer un patient avec gestion optimisée pour la production
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[PATIENTS PRODUCTION] Création d\'un patient...');
    
    setIsCreating(true);
    setError(null);
    setSuccess(null);
    
    try {
      const patientData = {
        firstName: form.nom,
        lastName: form.postNom,
        sexe: form.sexe,
        dateNaissance: form.dateNaissance,
        poids: form.poids,
        adresse: form.adresse,
        telephone: form.telephone,
      };
      
      console.log('[PATIENTS PRODUCTION] Données à envoyer:', patientData);
      
      const res = await apiClient.post('/api/patients', patientData);
      console.log('[PATIENTS PRODUCTION] Patient créé:', res.data);
      
      setSuccess('Patient enregistré avec succès !');
      
      // Réinitialiser le formulaire
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
      
      // Recharger la liste avec un délai adapté à la production
      console.log('[PATIENTS PRODUCTION] Rechargement de la liste...');
      const delay = isProduction ? 1000 : 500; // Délai plus long en production
      setTimeout(() => {
        fetchPatients();
      }, delay);
      
    } catch (e: any) {
      console.error('[PATIENTS PRODUCTION] Erreur lors de la création:', e);
      
      // Gestion d'erreurs spécifique à la production
      if (e.name === 'ApiUrlError') {
        setError('Configuration API incorrecte. Veuillez contacter l\'administrateur.');
      } else if (e.name === 'NetworkError') {
        setError('Erreur de connexion. Vérifiez votre connexion internet.');
      } else if (e.name === 'TimeoutError') {
        setError('Délai d\'attente dépassé. Veuillez réessayer.');
      } else if (e.response?.status === 401) {
        setError('Session expirée. Veuillez vous reconnecter.');
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else if (e.response?.status === 403) {
        setError('Accès refusé. Vérifiez vos permissions.');
      } else {
        setError(e.response?.data?.error || 'Erreur lors de l\'enregistrement du patient');
      }
    } finally {
      setIsCreating(false);
    }
  };

  // Gérer le changement de date de naissance
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const newForm = { ...form, dateNaissance: value };
    newForm.age = calculateAge(value).toString();
    setForm(newForm);
  };

  // Gérer l'ouverture du formulaire
  const handleOpenForm = () => {
    const newForm = {
      nom: '',
      postNom: '',
      sexe: '',
      dateNaissance: '',
      age: '',
      poids: '',
      adresse: '',
      telephone: '',
      numeroDossier: generateFolderNumber(currentYear, lastFolderNumber)
    };
    setForm(newForm);
    setShowForm(true);
    console.log('[PATIENTS PRODUCTION] Formulaire ouvert avec numéro:', newForm.numeroDossier);
  };

  // Fonction pour forcer le rechargement
  const handleRefresh = () => {
    console.log('[PATIENTS PRODUCTION] Rechargement manuel...');
    setRetryCount(0);
    fetchPatients();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Gestion des Patients
          {isProduction && <span className="ml-2 text-sm bg-green-100 text-green-800 px-2 py-1 rounded">Production</span>}
        </h1>
        <div className="flex space-x-2">
          <button
            onClick={handleRefresh}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            disabled={loading}
          >
            {loading ? 'Chargement...' : 'Actualiser'}
          </button>
          <button
            onClick={handleOpenForm}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Nouveau Patient
          </button>
        </div>
      </div>

      {/* Informations de debug pour la production */}
      {isProduction && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <div className="text-sm text-blue-700">
            <p><strong>Environnement:</strong> Production</p>
            <p><strong>Retry:</strong> {retryCount}/3</p>
            <p><strong>Patients chargés:</strong> {patients.length}</p>
          </div>
        </div>
      )}

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
                disabled={isCreating}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {isCreating ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des patients */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Liste des Patients ({patients.length})
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Gestion des dossiers patients
          </p>
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2">Chargement des patients...</p>
            {isProduction && retryCount > 0 && (
              <p className="mt-1 text-sm text-gray-500">Tentative {retryCount}/3</p>
            )}
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

export default PatientsManagementProduction;

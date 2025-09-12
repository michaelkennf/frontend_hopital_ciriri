// Version de debug pour la gestion des patients
import React, { useState, useEffect } from 'react';
import apiClient from '../../utils/axiosConfig';

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

const PatientsManagementDebug: React.FC = () => {
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
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const currentYear = new Date().getFullYear();

  // Fonction de debug pour logger les états
  const logState = (action: string, data?: any) => {
    const state = {
      action,
      timestamp: new Date().toISOString(),
      patientsCount: patients.length,
      loading,
      error,
      success,
      data
    };
    console.log(`[PATIENTS DEBUG] ${action}:`, state);
    setDebugInfo(state);
  };

  // Charger les patients avec debug
  const fetchPatients = async () => {
    console.log('[PATIENTS DEBUG] Début du chargement des patients...');
    logState('fetchPatients_start');
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('[PATIENTS DEBUG] Appel API /api/patients...');
      const res = await apiClient.get('/api/patients');
      
      console.log('[PATIENTS DEBUG] Réponse reçue:', {
        status: res.status,
        data: res.data,
        patientsCount: res.data.patients?.length || 0
      });
      
      const patientsData = res.data.patients || [];
      console.log('[PATIENTS DEBUG] Données des patients:', patientsData);
      
      setPatients(patientsData);
      logState('fetchPatients_success', { patientsCount: patientsData.length });
      
      // Pour la génération locale du numéro de dossier
      if (patientsData.length > 0) {
        const last = patientsData[0].folderNumber;
        if (last && last.startsWith(`${currentYear}-`)) {
          const number = parseInt(last.split('-')[1], 10);
          setLastFolderNumber(number);
          console.log('[PATIENTS DEBUG] Dernier numéro de dossier:', number);
        }
      }
      
      console.log('[PATIENTS DEBUG] État mis à jour:', {
        patientsCount: patientsData.length,
        lastFolderNumber
      });
      
    } catch (e: any) {
      console.error('[PATIENTS DEBUG] Erreur lors du chargement:', e);
      logState('fetchPatients_error', { error: e.message });
      setError(e.response?.data?.error || 'Erreur lors du chargement des patients');
    } finally {
      setLoading(false);
      console.log('[PATIENTS DEBUG] Chargement terminé');
    }
  };

  // Charger les patients au montage
  useEffect(() => {
    console.log('[PATIENTS DEBUG] Composant monté, chargement initial...');
    fetchPatients();
  }, []);

  // Créer un patient avec debug
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[PATIENTS DEBUG] Début de la création du patient...');
    logState('createPatient_start', { form });
    
    setLoading(true);
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
      
      console.log('[PATIENTS DEBUG] Données à envoyer:', patientData);
      
      const res = await apiClient.post('/api/patients', patientData);
      
      console.log('[PATIENTS DEBUG] Patient créé avec succès:', res.data);
      logState('createPatient_success', { newPatient: res.data });
      
      setSuccess('Patient enregistré avec succès !');
      setShowForm(false);
      
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
      
      // Recharger la liste des patients
      console.log('[PATIENTS DEBUG] Rechargement de la liste des patients...');
      await fetchPatients();
      
      console.log('[PATIENTS DEBUG] Liste rechargée, patients actuels:', patients.length);
      
    } catch (e: any) {
      console.error('[PATIENTS DEBUG] Erreur lors de la création:', e);
      logState('createPatient_error', { error: e.message });
      setError(e.response?.data?.error || 'Erreur lors de l\'enregistrement du patient');
    } finally {
      setLoading(false);
      console.log('[PATIENTS DEBUG] Création terminée');
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
    console.log('[PATIENTS DEBUG] Formulaire ouvert avec numéro:', newForm.numeroDossier);
  };

  // Filtrer les patients
  const filteredPatients = patients.filter(p => {
    const searchText = `${p.folderNumber} ${p.lastName} ${p.firstName}`.toLowerCase();
    return searchText.includes(''); // Pas de filtre pour l'instant
  });

  console.log('[PATIENTS DEBUG] Rendu avec:', {
    patientsCount: patients.length,
    filteredCount: filteredPatients.length,
    loading,
    error,
    success
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestion des Patients (Debug)</h1>
        <button
          onClick={handleOpenForm}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Nouveau Patient
        </button>
      </div>

      {/* Informations de debug */}
      <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 rounded">
        <h3 className="font-bold text-yellow-800">Debug Info</h3>
        <div className="text-sm text-yellow-700">
          <p>Patients chargés: {patients.length}</p>
          <p>Chargement: {loading ? 'Oui' : 'Non'}</p>
          <p>Erreur: {error || 'Aucune'}</p>
          <p>Succès: {success || 'Aucun'}</p>
          <p>Dernier numéro: {lastFolderNumber}</p>
        </div>
        <button
          onClick={fetchPatients}
          className="mt-2 px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
        >
          Recharger Manuellement
        </button>
      </div>

      {/* Messages d'erreur et de succès */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Erreur :</strong> {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          <strong>Succès :</strong> {success}
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
          </div>
        ) : patients.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucun patient trouvé
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredPatients.map((patient) => (
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

export default PatientsManagementDebug;

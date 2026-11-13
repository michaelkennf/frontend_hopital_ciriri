import React, { useState, useEffect } from 'react';
import { apiClient } from '../../utils/apiClient';
import { matchesPatientQuery, patientYears } from '../../utils/patientSearch';

function generateFolderNumber(currentYear: number, patients: { folderNumber?: string }[]) {
  const yearText = String(currentYear);
  const series = patients.filter((patient) => (patient.folderNumber || '').startsWith(yearText));
  let highest = 0;
  const annual = new RegExp(`^${currentYear}-(\\d+)$`);
  for (const patient of series) {
    const match = (patient.folderNumber || '').match(annual);
    if (match) highest = Math.max(highest, parseInt(match[1], 10));
  }
  return `${currentYear}-${String(Math.max(highest, series.length) + 1).padStart(3, '0')}`;
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

const PatientsManagement: React.FC = () => {
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
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const currentYear = new Date().getFullYear();
  const [editForm, setEditForm] = useState<{
    id: number;
    nom: string;
    postNom: string;
    sexe: string;
    dateNaissance: string;
    age: string;
    poids: string;
    adresse: string;
    telephone: string;
    folderNumber: string;
  } | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Charger la liste des patients au chargement
  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Chargement des patients...');
      const res = await apiClient.get('/api/patients');
      console.log('📋 Réponse patients complète:', res);
      console.log('📋 Données patients:', res.data);
      
      // Vérifier la structure de la réponse
      let patientsData = [];
      if (Array.isArray(res.data)) {
        patientsData = res.data;
      } else if (res.data && Array.isArray(res.data.patients)) {
        patientsData = res.data.patients;
      } else if (res.data && res.data.data && Array.isArray(res.data.data)) {
        patientsData = res.data.data;
      }
      
      console.log('✅ Patients chargés:', patientsData.length, 'patients');
      setPatients(patientsData);
    } catch (e: any) {
      console.error('❌ Erreur chargement patients:', e);
      setError(e.response?.data?.error || e.message || 'Erreur lors du chargement des patients');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = () => {
    setForm({
      nom: '',
      postNom: '',
      sexe: '',
      dateNaissance: '',
      age: '',
      poids: '',
      adresse: '',
      telephone: '',
      numeroDossier: generateFolderNumber(currentYear, patients),
    });
    setShowForm(true);
    setError(null);
    setSuccess(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let newForm = { ...form, [name]: value };
    if (name === 'dateNaissance') {
      newForm.age = calculateAge(value).toString();
    }
    setForm(newForm);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (!editForm) return;
    let newForm = { ...editForm, [name]: value };
    if (name === 'dateNaissance') {
      newForm.age = calculateAge(value).toString();
    }
    setEditForm(newForm);
  };

  const openEditForm = (p: Patient) => {
    const dob = p.dateOfBirth ? String(p.dateOfBirth).slice(0, 10) : '';
    setEditForm({
      id: p.id,
      nom: p.firstName,
      postNom: p.lastName,
      sexe: p.gender,
      dateNaissance: dob,
      age: calculateAge(dob).toString(),
      poids: p.weight != null ? String(p.weight) : '',
      adresse: p.address ?? '',
      telephone: p.phone ?? '',
      folderNumber: p.folderNumber ?? '',
    });
    setShowEditForm(true);
    setEditError(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;
    setEditLoading(true);
    setEditError(null);
    try {
      await apiClient.patch(`/api/patients/${editForm.id}`, {
        firstName: editForm.nom,
        lastName: editForm.postNom,
        sexe: editForm.sexe,
        dateNaissance: editForm.dateNaissance,
        poids: editForm.poids,
        adresse: editForm.adresse,
        telephone: editForm.telephone,
      });
      setShowEditForm(false);
      setEditForm(null);
      setSuccess('Patient modifié avec succès.');
      await fetchPatients();
    } catch (e: any) {
      setEditError(e.response?.data?.error || e.message || 'Erreur lors de la modification du patient');
    } finally {
      setEditLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      console.log('📝 Création du patient:', form);
      
      const res = await apiClient.post('/api/patients', {
        firstName: form.nom,
        lastName: form.postNom,
        sexe: form.sexe,
        dateNaissance: form.dateNaissance,
        poids: form.poids,
        adresse: form.adresse,
        telephone: form.telephone,
      });
      
      if (res.data.success) {
        console.log('✅ Patient créé:', res.data.patient);
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
        
        // Attendre un peu puis recharger la liste
        console.log('⏳ Attente de la synchronisation...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Recharger la liste des patients
        console.log('🔄 Rechargement de la liste...');
        await fetchPatients();
        
        console.log('✅ Liste mise à jour');
        
      } else {
        throw new Error(res.data.error || 'Erreur lors de la création');
      }
    } catch (e: any) {
      console.error('❌ Erreur création patient:', e);
      setError(e.response?.data?.error || e.message || 'Erreur lors de l\'enregistrement du patient');
    } finally {
      setLoading(false);
    }
  };

  const years = patientYears(patients);
  const filteredPatients = patients.filter((patient) => matchesPatientQuery(patient, search, yearFilter));


  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestion des patients</h1>
        <button className="btn-primary" onClick={handleOpenForm}>
          + Nouveau patient
        </button>
      </div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="cashier-patient-search" className="mb-1 block text-sm font-medium text-gray-700">Nom ou numéro de dossier</label>
          <input
            id="cashier-patient-search"
            type="text"
            className="input-field w-full"
            placeholder="Nom, prénom ou numéro de dossier"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="sm:w-44">
          <label htmlFor="cashier-patient-year" className="mb-1 block text-sm font-medium text-gray-700">Année</label>
          <select
            id="cashier-patient-year"
            className="input-field w-full bg-white"
            value={yearFilter}
            onChange={e => setYearFilter(e.target.value)}
          >
            <option value="">Toutes les années</option>
            {years.map((year) => (
              <option key={year} value={String(year)}>{year}</option>
            ))}
          </select>
        </div>
      </div>
      <p className="text-gray-600 mb-6">Ajoutez, modifiez ou consultez les informations des patients.</p>
      {error && <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4 text-red-700">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4 text-green-700">{success}</div>}
      <div className="card mb-6">
        {loading ? (
          <div className="flex items-center justify-center h-24">Chargement...</div>
        ) : filteredPatients.length === 0 ? (
          <div className="text-gray-500">{search || yearFilter ? 'Aucun patient ne correspond à cette recherche.' : 'Aucun patient enregistré.'}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">N° Dossier</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Post-nom</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sexe</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date naissance</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Âge</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Poids (kg)</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Adresse</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Téléphone</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase sticky right-0 z-20 min-w-[7.5rem] bg-gray-50 shadow-[-6px_0_8px_-4px_rgba(0,0,0,0.12)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPatients.map((p) => (
                  <tr key={p.id} className="group">
                    <td className="px-4 py-2 font-mono text-sm">{p.folderNumber}</td>
                    <td className="px-4 py-2 font-medium">{p.lastName}</td>
                    <td className="px-4 py-2">{p.firstName}</td>
                    <td className="px-4 py-2">{p.gender}</td>
                    <td className="px-4 py-2">{new Date(p.dateOfBirth).toLocaleDateString('fr-FR')}</td>
                    <td className="px-4 py-2">{calculateAge(p.dateOfBirth)}</td>
                    <td className="px-4 py-2">{p.weight}</td>
                    <td className="px-4 py-2">{p.address}</td>
                    <td className="px-4 py-2">{p.phone}</td>
                    <td className="px-3 py-2 sticky right-0 z-10 min-w-[7.5rem] bg-white shadow-[-6px_0_8px_-4px_rgba(0,0,0,0.12)] group-hover:bg-gray-50">
                      <button
                        type="button"
                        className="whitespace-nowrap rounded bg-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
                        title="Modifier les informations du patient"
                        onClick={() => openEditForm(p)}
                      >
                        Modifier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Formulaire modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg relative flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-20 rounded-t-lg">
              <h2 className="text-xl font-bold">Enregistrement d'un patient</h2>
              <button
                className="text-gray-400 hover:text-gray-600 ml-2"
                onClick={() => setShowForm(false)}
                aria-label="Fermer"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between overflow-y-auto px-6 py-4">
              <div className="space-y-4 pb-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Numéro de dossier</label>
                  <input
                    type="text"
                    name="numeroDossier"
                    value={form.numeroDossier}
                    readOnly
                    className="input-field bg-gray-100 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nom</label>
                  <input
                    type="text"
                    name="nom"
                    value={form.nom}
                    onChange={handleChange}
                    required
                    className="input-field"
                    placeholder="Entrez le nom"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Post-nom</label>
                  <input
                    type="text"
                    name="postNom"
                    value={form.postNom}
                    onChange={handleChange}
                    required
                    className="input-field"
                    placeholder="Entrez le post-nom"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sexe</label>
                  <select
                    name="sexe"
                    value={form.sexe}
                    onChange={handleChange}
                    required
                    className="input-field"
                  >
                    <option value="">Sélectionner</option>
                    <option value="Masculin">Masculin</option>
                    <option value="Féminin">Féminin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date de naissance</label>
                  <input
                    type="date"
                    name="dateNaissance"
                    value={form.dateNaissance}
                    onChange={handleChange}
                    required
                    max={new Date().toISOString().split('T')[0]}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Âge</label>
                  <input
                    type="text"
                    name="age"
                    value={form.age}
                    readOnly
                    className="input-field bg-gray-100 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Poids (kg)</label>
                  <input
                    type="number"
                    name="poids"
                    value={form.poids}
                    onChange={handleChange}
                    required
                    min="0"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Adresse physique</label>
                  <input
                    type="text"
                    name="adresse"
                    value={form.adresse}
                    onChange={handleChange}
                    required
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Numéro de téléphone</label>
                  <input
                    type="tel"
                    name="telephone"
                    value={form.telephone}
                    onChange={handleChange}
                    required
                    className="input-field"
                  />
                </div>
              </div>
              <div className="pt-4 flex flex-col sm:flex-row justify-end gap-2 sticky bottom-0 bg-white z-10 pb-2">
                <button
                  type="button"
                  className="btn-secondary w-full sm:w-auto"
                  onClick={() => setShowForm(false)}
                >
                  Annuler
                </button>
                <button type="submit" className="btn-primary w-full sm:w-auto" disabled={loading}>
                  {loading ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditForm && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg relative flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-20 rounded-t-lg">
              <h2 className="text-xl font-bold">Modifier le patient</h2>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 ml-2"
                onClick={() => {
                  setShowEditForm(false);
                  setEditForm(null);
                }}
                aria-label="Fermer"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="flex-1 flex flex-col justify-between overflow-y-auto px-6 py-4">
              {editError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4 text-red-700">{editError}</div>
              )}
              <div className="space-y-4 pb-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Numéro de dossier</label>
                  <input
                    type="text"
                    value={editForm.folderNumber}
                    readOnly
                    className="input-field bg-gray-100 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nom</label>
                  <input
                    type="text"
                    name="nom"
                    value={editForm.nom}
                    onChange={handleEditChange}
                    required
                    className="input-field"
                    placeholder="Entrez le nom"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Post-nom</label>
                  <input
                    type="text"
                    name="postNom"
                    value={editForm.postNom}
                    onChange={handleEditChange}
                    required
                    className="input-field"
                    placeholder="Entrez le post-nom"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sexe</label>
                  <select name="sexe" value={editForm.sexe} onChange={handleEditChange} required className="input-field">
                    <option value="">Sélectionner</option>
                    <option value="Masculin">Masculin</option>
                    <option value="Féminin">Féminin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date de naissance</label>
                  <input
                    type="date"
                    name="dateNaissance"
                    value={editForm.dateNaissance}
                    onChange={handleEditChange}
                    required
                    max={new Date().toISOString().split('T')[0]}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Âge</label>
                  <input type="text" name="age" value={editForm.age} readOnly className="input-field bg-gray-100 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Poids (kg)</label>
                  <input
                    type="number"
                    name="poids"
                    value={editForm.poids}
                    onChange={handleEditChange}
                    required
                    min="0"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Adresse physique</label>
                  <input type="text" name="adresse" value={editForm.adresse} onChange={handleEditChange} required className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Numéro de téléphone</label>
                  <input type="tel" name="telephone" value={editForm.telephone} onChange={handleEditChange} required className="input-field" />
                </div>
              </div>
              <div className="pt-4 flex flex-col sm:flex-row justify-end gap-2 sticky bottom-0 bg-white z-10 pb-2">
                <button
                  type="button"
                  className="btn-secondary w-full sm:w-auto"
                  onClick={() => {
                    setShowEditForm(false);
                    setEditForm(null);
                  }}
                >
                  Annuler
                </button>
                <button type="submit" className="btn-primary w-full sm:w-auto" disabled={editLoading}>
                  {editLoading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientsManagement; 
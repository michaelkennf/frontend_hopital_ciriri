import React, { useState, useEffect } from 'react';
import axios from 'axios';

const authenticatedAxios = {
  get: (url: string) => {
    const token = localStorage.getItem('auth-token');
    return axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },
  post: (url: string, data: any) => {
    const token = localStorage.getItem('auth-token');
    return axios.post(url, data, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },
  patch: (url: string, data: any) => {
    const token = localStorage.getItem('auth-token');
    return axios.patch(url, data, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }
};

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

const PatientsManagementHospitalisation: React.FC = () => {
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
    roomType: '',
    entryDate: new Date().toISOString().slice(0, 10), // Date d'entrée par défaut
  });
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [editForm, setEditForm] = useState<any>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);

  useEffect(() => {
    fetchPatients();
    fetchRoomTypes();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authenticatedAxios.get('/api/patients?service=hospitalisation');
      setPatients(res.data.patients || []);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Erreur lors du chargement des patients hospitalisés');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomTypes = async () => {
    try {
      const res = await authenticatedAxios.get('/api/room-types');
      setRoomTypes(res.data.roomTypes || []);
    } catch (e: any) {
      console.error('Erreur lors du chargement des types de chambres:', e);
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
      roomType: '',
      entryDate: new Date().toISOString().slice(0, 10), // Date d'entrée par défaut
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

  const handleEdit = (patient: any) => {
    setEditForm({
      id: patient.id,
      nom: patient.firstName,
      postNom: patient.lastName,
      sexe: patient.gender,
      dateNaissance: patient.dateOfBirth,
      age: calculateAge(patient.dateOfBirth),
      poids: patient.weight,
      adresse: patient.address,
      telephone: patient.phone,
      roomType: patient.hospitalization?.roomTypeId?.toString() || ''
    });
    setShowEditForm(true);
    setEditError(null);
    setEditSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const patientRes = await authenticatedAxios.post('/api/patients', {
        firstName: form.nom,
        lastName: form.postNom,
        sexe: form.sexe,
        dateNaissance: form.dateNaissance,
        poids: form.poids,
        adresse: form.adresse,
        telephone: form.telephone,
        interfaceOrigin: 'hospitalisation',
      });
      
      const patientId = patientRes.data.patient?.id || patientRes.data.id;
      
      const hospitalizationRes = await authenticatedAxios.post('/api/hospitalizations', {
        patientId: patientId,
        roomTypeId: parseInt(form.roomType),
        entryDate: form.entryDate, // Utiliser la date d'entrée saisie par l'utilisateur
      });

      await fetchPatients();
      
      setShowForm(false);
      setForm({
        nom: '',
        postNom: '',
        sexe: '',
        dateNaissance: '',
        age: '',
        poids: '',
        adresse: '',
        telephone: '',
        roomType: '',
        entryDate: new Date().toISOString().slice(0, 10), // Date d'entrée par défaut
      });
      setSuccess('Patient hospitalisé avec succès !');
      
      window.dispatchEvent(new CustomEvent('patientHospitalized', { 
        detail: { 
          patientId, 
          roomTypeId: parseInt(form.roomType),
          hospitalization: hospitalizationRes.data.hospitalization
        } 
      }));
      
    } catch (e: any) {
      setError(e.response?.data?.error || 'Erreur lors de l\'enregistrement du patient');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError(null);
    setEditSuccess(null);
    try {
      await authenticatedAxios.patch(`/api/patients/${editForm.id}`, {
        firstName: editForm.nom,
        lastName: editForm.postNom,
        sexe: editForm.sexe,
        dateNaissance: editForm.dateNaissance,
        poids: editForm.poids,
        adresse: editForm.adresse,
        telephone: editForm.telephone,
      });
      
      await fetchPatients();
      setShowEditForm(false);
      setEditForm(null);
      setEditSuccess('Patient modifié avec succès !');
    } catch (e: any) {
      setEditError(e.response?.data?.error || 'Erreur lors de la modification du patient');
    } finally {
      setEditLoading(false);
    }
  };

  const filteredPatients = patients.filter(p => {
    const searchText = `${p.folderNumber} ${p.lastName} ${p.firstName}`.toLowerCase();
    return searchText.includes(search.toLowerCase());
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestion des patients hospitalisés</h1>
        <button className="btn-primary" onClick={handleOpenForm}>
          + Nouveau patient
        </button>
      </div>

      <input
        type="text"
        className="input-field mb-4"
        placeholder="Rechercher un patient (nom, prénom ou dossier)"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <p className="text-gray-600 mb-6">Ajoutez, modifiez ou consultez les patients hospitalisés.</p>
      {error && <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4 text-red-700">{error}</div>}
      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}
      
      {/* Composant de débogage pour les dates d'entrée */}
      {patients.length > 0 && patients.some(p => !p.hospitalization?.startDate) && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4 text-blue-700">
          <h3 className="font-semibold mb-2">⚠️ Données d'hospitalisation manquantes</h3>
          <p className="text-sm">
            Certains patients n'ont pas de données d'hospitalisation complètes. 
            Cela peut causer l'affichage "N/A" dans la colonne Date d'entrée.
          </p>
          <details className="mt-2">
            <summary className="cursor-pointer text-sm font-medium">Voir les détails</summary>
            <div className="mt-2 text-xs">
              {patients.filter(p => !p.hospitalization?.startDate).map((p, index) => (
                <div key={index} className="mb-1 p-2 bg-blue-100 rounded">
                  Patient: {p.folderNumber} - {p.lastName} {p.firstName} - 
                  Hospitalisation: {p.hospitalization ? `ID ${p.hospitalization.id}` : 'Aucune'} - 
                  startDate: {p.hospitalization?.startDate || 'undefined'}
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
      
      {/* Composant de débogage pour les dates invalides */}
      {patients.length > 0 && patients.some(p => {
        if (!p.hospitalization?.startDate) return false;
        try {
          new Date(p.hospitalization.startDate);
          return false;
        } catch {
          return true;
        }
      }) && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4 text-red-700">
          <h3 className="font-semibold mb-2">⚠️ Dates d'entrée invalides détectées</h3>
          <p className="text-sm">
            Certaines dates d'entrée ont un format invalide et causent "Invalid Date".
          </p>
          <details className="mt-2">
            <summary className="cursor-pointer text-sm font-medium">Voir les détails</summary>
            <div className="mt-2 text-xs">
              {patients.filter(p => {
                if (!p.hospitalization?.startDate) return false;
                try {
                  new Date(p.hospitalization.startDate);
                  return false;
                } catch {
                  return true;
                }
              }).map((p, index) => (
                <div key={index} className="mb-1 p-2 bg-red-100 rounded">
                  Patient: {p.folderNumber} - {p.lastName} {p.firstName} - 
                  startDate brute: {p.hospitalization?.startDate} - 
                  Type: {typeof p.hospitalization?.startDate}
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
      
      {/* Filtres */}
      <div className="card mb-6">
        {loading ? (
          <div className="flex items-center justify-center h-24">Chargement...</div>
        ) : filteredPatients.length === 0 ? (
          <div className="text-gray-500">Aucun patient hospitalisé enregistré.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">N° Dossier</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Prénom</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sexe</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date naissance</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Âge</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Poids (kg)</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Adresse</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Téléphone</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date d'entrée</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPatients.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-2 font-mono text-sm">{p.folderNumber}</td>
                    <td className="px-4 py-2 font-medium">{p.lastName}</td>
                    <td className="px-4 py-2">{p.firstName}</td>
                    <td className="px-4 py-2">{p.gender}</td>
                    <td className="px-4 py-2">{new Date(p.dateOfBirth).toLocaleDateString('fr-FR')}</td>
                    <td className="px-4 py-2">{calculateAge(p.dateOfBirth)}</td>
                    <td className="px-4 py-2">{p.weight}</td>
                    <td className="px-4 py-2">{p.address}</td>
                    <td className="px-4 py-2">{p.phone}</td>
                    <td className="px-4 py-2">
                      {p.hospitalization?.startDate ? 
                        new Date(p.hospitalization.startDate).toLocaleDateString('fr-FR') : 
                        'N/A'
                      }
                    </td>
                    <td className="px-4 py-2">
                      <button className="btn-secondary btn-xs" onClick={() => handleEdit(p)}>Modifier</button>
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
              <h2 className="text-xl font-bold">Enregistrement d'un patient hospitalisé</h2>
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
                  <label className="block text-sm font-medium text-gray-700">Prénom</label>
                  <input type="text" name="nom" value={form.nom} onChange={handleChange} required className="input-field" placeholder="Entrez le nom" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Post-nom</label>
                  <input type="text" name="postNom" value={form.postNom} onChange={handleChange} required className="input-field" placeholder="Entrez le post-nom" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sexe</label>
                  <select name="sexe" value={form.sexe} onChange={handleChange} required className="input-field">
                    <option value="">Sélectionner</option>
                    <option value="Masculin">Masculin</option>
                    <option value="Féminin">Féminin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date de naissance</label>
                  <input type="date" name="dateNaissance" value={form.dateNaissance} onChange={handleChange} required className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Âge</label>
                  <input type="text" name="age" value={form.age} readOnly className="input-field bg-gray-100 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Poids (kg)</label>
                  <input type="number" name="poids" value={form.poids} onChange={handleChange} required min="0" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Adresse physique</label>
                  <input type="text" name="adresse" value={form.adresse} onChange={handleChange} required className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Numéro de téléphone</label>
                  <input type="tel" name="telephone" value={form.telephone} onChange={handleChange} required className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type de chambre</label>
                  <select
                    name="roomType"
                    value={form.roomType}
                    onChange={handleChange}
                    required
                    className="input-field"
                  >
                    <option value="">Sélectionner un type de chambre</option>
                    {roomTypes.map(rt => (
                      <option key={rt.id} value={rt.id}>{rt.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date d'entrée</label>
                  <input 
                    type="date" 
                    name="entryDate" 
                    value={form.entryDate} 
                    onChange={handleChange} 
                    required 
                    className="input-field" 
                  />
                </div>
              </div>
              <div className="pt-4 flex flex-col sm:flex-row justify-end gap-2 sticky bottom-0 bg-white z-10 pb-2">
                <button type="button" className="btn-secondary w-full sm:w-auto" onClick={() => setShowForm(false)}>
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
      {/* Formulaire de modification modal */}
      {showEditForm && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg relative flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-20 rounded-t-lg">
              <h2 className="text-xl font-bold">Modifier le patient</h2>
              <button
                className="text-gray-400 hover:text-gray-600 ml-2"
                onClick={() => setShowEditForm(false)}
                aria-label="Fermer"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="flex-1 flex flex-col justify-between overflow-y-auto px-6 py-4">
              <div className="space-y-4 pb-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Prénom</label>
                  <input type="text" name="nom" value={editForm.nom} onChange={e => setEditForm({...editForm, nom: e.target.value})} required className="input-field" placeholder="Entrez le nom" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Post-nom</label>
                  <input type="text" name="postNom" value={editForm.postNom} onChange={e => setEditForm({...editForm, postNom: e.target.value})} required className="input-field" placeholder="Entrez le post-nom" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sexe</label>
                  <select name="sexe" value={editForm.sexe} onChange={e => setEditForm({...editForm, sexe: e.target.value})} required className="input-field">
                    <option value="">Sélectionner</option>
                    <option value="Masculin">Masculin</option>
                    <option value="Féminin">Féminin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date de naissance</label>
                  <input type="date" name="dateNaissance" value={editForm.dateNaissance} onChange={e => setEditForm({...editForm, dateNaissance: e.target.value, age: calculateAge(e.target.value)})} required className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Âge</label>
                  <input type="text" name="age" value={editForm.age} readOnly className="input-field bg-gray-100 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Poids (kg)</label>
                  <input type="number" name="poids" value={editForm.poids} onChange={e => setEditForm({...editForm, poids: e.target.value})} required min="0" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Adresse physique</label>
                  <input type="text" name="adresse" value={editForm.adresse} onChange={e => setEditForm({...editForm, adresse: e.target.value})} required className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Numéro de téléphone</label>
                  <input type="tel" name="telephone" value={editForm.telephone} onChange={e => setEditForm({...editForm, telephone: e.target.value})} required className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type de chambre</label>
                  <select
                    name="roomType"
                    value={editForm.roomType}
                    onChange={e => setEditForm({...editForm, roomType: e.target.value})}
                    required
                    className="input-field"
                  >
                    <option value="">Sélectionner un type de chambre</option>
                    {roomTypes.map(rt => (
                      <option key={rt.id} value={rt.id}>{rt.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="pt-4 flex flex-col sm:flex-row justify-end gap-2 sticky bottom-0 bg-white z-10 pb-2">
                <button type="button" className="btn-secondary w-full sm:w-auto" onClick={() => setShowEditForm(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary w-full sm:w-auto" disabled={editLoading}>
                  {editLoading ? 'Modification...' : 'Enregistrer'}
                </button>
              </div>
              {editError && <div className="text-red-600 text-sm mt-2">{editError}</div>}
              {editSuccess && <div className="text-green-600 text-sm mt-2">{editSuccess}</div>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientsManagementHospitalisation;
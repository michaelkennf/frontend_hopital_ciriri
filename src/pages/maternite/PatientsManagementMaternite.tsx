import React, { useState, useEffect } from 'react';
import axios from 'axios';

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

const PatientsManagementMaternite: React.FC = () => {
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
  const [roomTypes, setRoomTypes] = useState<any[]>([]); // Nouveau state pour les types de chambres

  useEffect(() => {
    fetchPatients();
    fetchRoomTypes(); // Charger les types de chambres
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/patients?service=maternite');
      setPatients(res.data.patients || []);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Erreur lors du chargement des patients maternité');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomTypes = async () => {
    try {
      const res = await axios.get('/api/room-types');
      setRoomTypes(res.data.roomTypes || []);
    } catch (error: any) {
      console.error('Erreur lors du chargement des types de chambres:', error);
    }
  };

  const handleOpenForm = () => {
    setForm({
      nom: '', postNom: '', sexe: '', dateNaissance: '', age: '', poids: '', adresse: '', telephone: '', roomType: '', entryDate: new Date().toISOString().slice(0, 10)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // 1. Créer le patient
      const res = await axios.post('/api/patients', {
        firstName: form.nom,
        lastName: form.postNom,
        sexe: form.sexe,
        dateNaissance: form.dateNaissance,
        poids: form.poids,
        adresse: form.adresse,
        telephone: form.telephone,
        interfaceOrigin: 'maternite', // Identifier l'interface d'origine
      });
      const patientId = res.data.patient?.id || res.data.id;
      
      // 2. Hospitaliser immédiatement avec le type de chambre sélectionné
      const hospitalizationRes = await axios.post('/api/hospitalizations', {
        patientId: patientId,
        roomTypeId: parseInt(form.roomType),
        entryDate: form.entryDate, // Utiliser la date d'entrée saisie par l'utilisateur
      });
      
      setSuccess('Patient maternité enregistré avec succès !');
      setShowForm(false);
      fetchPatients();
      
      // Déclencher l'événement pour mettre à jour la page hospitalisation
      window.dispatchEvent(new CustomEvent('patientHospitalized', { 
        detail: { 
          patientId, 
          roomTypeId: parseInt(form.roomType),
          hospitalization: hospitalizationRes.data.hospitalization
        } 
      }));
    } catch (e: any) {
      console.error('Erreur détaillée:', e.response?.data || e.message);
      setError(e.response?.data?.error || e.message || 'Erreur lors de l\'enregistrement du patient');
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(p => {
    const searchText = `${p.folderNumber} ${p.lastName} ${p.firstName}`.toLowerCase();
    return searchText.includes(search.toLowerCase());
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestion des patients maternité</h1>
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
      <p className="text-gray-600 mb-6">Ajoutez, modifiez ou consultez les patients maternité.</p>
      {error && <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4 text-red-700">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4 text-green-700">{success}</div>}
      <div className="card mb-6">
        {loading ? (
          <div className="flex items-center justify-center h-24">Chargement...</div>
        ) : filteredPatients.length === 0 ? (
          <div className="text-gray-500">Aucun patient maternité enregistré.</div>
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
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type de chambre</th>
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
                    <td className="px-4 py-2">{p.hospitalization?.roomType?.name || 'N/A'}</td>
                                          <td className="px-4 py-2">
                        {p.hospitalization?.startDate ? 
                          new Date(p.hospitalization.startDate).toLocaleDateString('fr-FR') : 
                          'N/A'
                        }
                      </td>
                    <td className="px-4 py-2">
                      <button className="btn-secondary btn-xs" onClick={() => {
                        setEditForm({ ...p, sexe: p.gender, dateNaissance: p.dateOfBirth, poids: p.weight, adresse: p.address, telephone: p.phone });
                        setShowEditForm(true);
                        setEditError(null);
                        setEditSuccess(null);
                      }}>Modifier</button>
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
              <h2 className="text-xl font-bold">Enregistrement d'un patient maternité</h2>
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
                  <label className="block text-sm font-medium text-gray-700">Nom</label>
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
                  <select name="roomType" value={form.roomType} onChange={handleChange} required className="input-field">
                    <option value="">Sélectionner un type de chambre</option>
                    {roomTypes.map(rt => (
                      <option key={rt.id} value={rt.id}>{rt.name}</option>
                    ))}
                  </select>
                  {roomTypes.length === 0 && (
                    <p className="text-sm text-red-600 mt-1">
                      Aucun type de chambre disponible. Veuillez en créer via l'interface logisticien.
                    </p>
                  )}
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
            <form onSubmit={async (e) => {
              e.preventDefault();
              setEditLoading(true);
              setEditError(null);
              setEditSuccess(null);
              try {
                await axios.patch(`/api/patients/${editForm.id}`, {
                  firstName: editForm.nom,
                  lastName: editForm.postNom,
                  gender: editForm.sexe,
                  dateOfBirth: editForm.dateNaissance,
                  weight: editForm.poids,
                  address: editForm.adresse,
                  phone: editForm.telephone,
                });
                setEditSuccess('Patient modifié avec succès !');
                setShowEditForm(false);
                fetchPatients();
              } catch (e: any) {
                setEditError(e.response?.data?.error || 'Erreur lors de la modification du patient');
              } finally {
                setEditLoading(false);
              }
            }} className="flex-1 flex flex-col justify-between overflow-y-auto px-6 py-4">
              <div className="space-y-4 pb-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nom</label>
                  <input type="text" name="nom" value={editForm.nom} onChange={(e) => setEditForm({...editForm, nom: e.target.value})} required className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Post-nom</label>
                  <input type="text" name="postNom" value={editForm.postNom} onChange={(e) => setEditForm({...editForm, postNom: e.target.value})} required className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sexe</label>
                  <select name="sexe" value={editForm.sexe} onChange={(e) => setEditForm({...editForm, sexe: e.target.value})} required className="input-field">
                    <option value="">Sélectionner</option>
                    <option value="Masculin">Masculin</option>
                    <option value="Féminin">Féminin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date de naissance</label>
                  <input type="date" name="dateNaissance" value={editForm.dateNaissance} onChange={(e) => {
                    const newForm = {...editForm, dateNaissance: e.target.value};
                    newForm.age = calculateAge(e.target.value).toString();
                    setEditForm(newForm);
                  }} required className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Âge</label>
                  <input type="text" name="age" value={editForm.age} readOnly className="input-field bg-gray-100 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Poids (kg)</label>
                  <input type="number" name="poids" value={editForm.poids} onChange={(e) => setEditForm({...editForm, poids: e.target.value})} required min="0" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Adresse physique</label>
                  <input type="text" name="adresse" value={editForm.adresse} onChange={(e) => setEditForm({...editForm, adresse: e.target.value})} required className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Numéro de téléphone</label>
                  <input type="tel" name="telephone" value={editForm.telephone} onChange={(e) => setEditForm({...editForm, telephone: e.target.value})} required className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type de chambre</label>
                  <select name="roomType" value={editForm.roomType} onChange={(e) => setEditForm({...editForm, roomType: e.target.value})} required className="input-field">
                    <option value="">Sélectionner un type de chambre</option>
                    {roomTypes.map(rt => (
                      <option key={rt.id} value={rt.id}>{rt.name}</option>
                    ))}
                  </select>
                  {roomTypes.length === 0 && (
                    <p className="text-sm text-red-600 mt-1">
                      Aucun type de chambre disponible. Veuillez en créer via l'interface logisticien.
                    </p>
                  )}
                </div>
              </div>
              <div className="pt-4 flex flex-col sm:flex-row justify-end gap-2 sticky bottom-0 bg-white z-10 pb-2">
                {editError && <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4 text-red-700">{editError}</div>}
                {editSuccess && <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4 text-green-700">{editSuccess}</div>}
                <button type="button" className="btn-secondary w-full sm:w-auto" onClick={() => setShowEditForm(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary w-full sm:w-auto" disabled={editLoading}>
                  {editLoading ? 'Modification...' : 'Modifier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientsManagementMaternite; 
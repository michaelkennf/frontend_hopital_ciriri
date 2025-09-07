import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const MedicationsListHospitalisation: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [medications, setMedications] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [form, setForm] = useState({
    patientId: '',
    medicationId: '',
    quantity: '',
    date: new Date().toISOString().slice(0, 10),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [medicationSearch, setMedicationSearch] = useState('');
  const [editingSale, setEditingSale] = useState<any>(null);
  const [editForm, setEditForm] = useState({ patientId: '', medicationId: '', quantity: '', date: '' });
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPatients();
    fetchMedications();
    fetchSales();
  }, []);

  const fetchPatients = async () => {
    try {
      const res = await axios.get('/api/patients?service=medicaments_hospitalisation');
      setPatients(res.data.patients || []);
    } catch (e) {
      setPatients([]);
    }
  };

  const fetchMedications = async () => {
    try {
      const res = await axios.get('/api/medications');
      setMedications(res.data.medications || []);
    } catch (e) {
      setMedications([]);
    }
  };

  const fetchSales = async () => {
    setLoading(true);
    try {
      // Utiliser la nouvelle route spécifique à l'hospitalisation
      const res = await axios.get('/api/medications/hospitalisation');
      const salesData = res.data.sales || [];
      
      console.log('🔍 Données reçues de l\'API médicaments:', res.data);
      console.log('📊 Ventes reçues:', salesData);
      
      // Vérifier et nettoyer les données reçues
      const validSales = salesData.filter((s: any) => {
        if (!s.medication) {
          console.warn('Vente sans médicament détectée:', s);
          return false;
        }
        if (!s.medication.name) {
          console.warn('Vente avec médicament sans nom:', s);
          return false;
        }
        if (!s.patient) {
          console.warn('Vente sans patient détectée:', s);
          return false;
        }
        if (!s.patient.folderNumber) {
          console.warn('Vente avec patient sans folderNumber:', s);
          return false;
        }
        return true;
      });
      
      console.log('Ventes valides récupérées:', validSales.length, 'sur', salesData.length);
      
      // Log détaillé de chaque vente valide
      validSales.forEach((sale: any, index: number) => {
        console.log(`📋 Vente ${index + 1}:`, {
          id: sale.id,
          patient: sale.patient,
          medication: sale.medication,
          quantity: sale.quantity,
          date: sale.date,
          total: sale.total
        });
      });
      
      setSales(validSales);
    } catch (e) {
      console.error('Erreur lors de la récupération des ventes:', e);
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = () => {
    setForm({ patientId: '', medicationId: '', quantity: '', date: new Date().toISOString().slice(0, 10) });
    setShowForm(true);
    setError(null);
    setSuccess(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Validation des données avant envoi
      if (!form.patientId || !form.medicationId || !form.quantity || !form.date) {
        setError('Tous les champs sont requis');
        setLoading(false);
        return;
      }

      // Validation de la quantité
      const quantityValue = parseInt(form.quantity);
      if (isNaN(quantityValue) || quantityValue <= 0) {
        setError('La quantité doit être un nombre positif valide');
        setLoading(false);
        return;
      }

      console.log('💊 Envoi des données de vente:', {
        patientId: form.patientId,
        medicationId: form.medicationId,
        quantity: quantityValue,
        date: form.date
      });

      const res = await axios.post('/api/medications/sales', {
        patientId: form.patientId,
        medicationId: form.medicationId,
        quantity: quantityValue,
        date: form.date,
      });

      console.log('✅ Vente de médicament créée avec succès:', res.data);

      // Vérifier que la réponse contient une vente valide
      if (res.data && res.data.sale) {
        const newSale = res.data.sale;
        
        // Récupérer les détails du patient et du médicament pour l'affichage
        const selectedPatient = patients.find(p => p.id.toString() === form.patientId);
        const selectedMedication = medications.find(m => m.id.toString() === form.medicationId);
        
        if (selectedPatient && selectedMedication) {
          // Créer l'objet de vente pour l'affichage
          const saleToAdd = {
            id: newSale.id,
            patient: {
              id: selectedPatient.id,
              folderNumber: selectedPatient.folderNumber,
              firstName: selectedPatient.firstName,
              lastName: selectedPatient.lastName
            },
            medication: {
              id: selectedMedication.id,
              name: selectedMedication.name,
              sellingPrice: selectedMedication.sellingPrice,
              unit: selectedMedication.unit
            },
            quantity: newSale.quantity,
            date: newSale.date,
            total: newSale.total,
            unit: selectedMedication.unit
          };
          
          // Ajouter la nouvelle vente à la liste existante
          setSales([saleToAdd, ...sales]);
          setShowForm(false);
          setForm({
            patientId: '',
            medicationId: '',
            quantity: '',
            date: new Date().toISOString().slice(0, 10),
          });
          setSuccess('Vente enregistrée avec succès !');
        } else {
          console.error('Patient ou médicament non trouvé pour l\'affichage');
          setError('Vente créée mais erreur d\'affichage');
        }
      } else {
        console.error('Réponse API invalide:', res.data);
        setError('Réponse du serveur invalide');
      }
    } catch (e: any) {
      console.error('Erreur lors de la création de la vente:', e);
      if (e.response?.status === 400) {
        setError(`Erreur de validation: ${e.response.data.error || 'Données invalides'}`);
      } else if (e.response?.status === 500) {
        setError('Erreur serveur. Veuillez réessayer plus tard.');
      } else {
        setError(e.response?.data?.error || 'Erreur lors de l\'enregistrement de la vente');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (sale: any) => {
    setEditingSale(sale);
    setEditForm({
      patientId: sale.patient.id.toString(),
      medicationId: sale.medication.id.toString(),
      quantity: sale.quantity.toString(),
      date: sale.date.slice(0, 10),
    });
  };
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSale) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await axios.patch(`/api/medications/sales/${editingSale.id}`, {
        patientId: editForm.patientId,
        medicationId: editForm.medicationId,
        quantity: editForm.quantity,
        date: editForm.date,
      });
      setSuccess('Vente modifiée avec succès !');
      setEditingSale(null);
      fetchSales();
      fetchMedications();
    } catch (e: any) {
      setError(e.response?.data?.error || "Erreur lors de la modification de la vente");
    } finally {
      setLoading(false);
    }
  };

  const filteredSales = sales.filter((s: any) => {
    const patient = s.patient;
    const searchText = `${patient.folderNumber} ${patient.lastName || ''} ${patient.firstName || ''}`.toLowerCase();
    return searchText.includes(search.toLowerCase());
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Médicaments hospitalisation</h1>
        </div>
        <button className="btn-primary no-print" onClick={handleOpenForm}>
          + Nouvelle vente de médicament
        </button>
      </div>
      <input
        type="text"
        className="input-field mb-4"
        placeholder="Rechercher un patient (nom ou dossier)"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <p className="text-gray-600 mb-6">Consultez la liste des ventes de médicaments pour les patients hospitalisés.</p>
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}
      
      {/* Composant de débogage pour les erreurs de données */}
      {sales.length > 0 && sales.some(s => !s.patient || !s.patient.folderNumber) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4 text-yellow-700">
          <h3 className="font-semibold mb-2">⚠️ Données incomplètes détectées</h3>
          <p className="text-sm">
            Certaines ventes ont des données de patient manquantes. 
            Ces ventes ne seront pas affichées dans la liste.
          </p>
          <details className="mt-2">
            <summary className="cursor-pointer text-sm font-medium">Voir les détails</summary>
            <div className="mt-2 text-xs">
              {sales.filter(s => !s.patient || !s.patient.folderNumber).map((s, index) => (
                <div key={index} className="mb-1 p-2 bg-yellow-100 rounded">
                  Vente ID: {s.id} - Patient: {s.patient ? `ID ${s.patient.id}` : 'undefined'} - 
                  folderNumber: {s.patient?.folderNumber || 'undefined'}
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
      
      {/* Composant de débogage pour les médicaments */}
      {sales.length > 0 && sales.some(s => !s.medication || !s.medication.name) && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4 text-blue-700">
          <h3 className="font-semibold mb-2">⚠️ Médicaments manquants</h3>
          <p className="text-sm">
            Certaines ventes ont des médicaments manquants ou invalides. 
            Ces ventes peuvent afficher "N/A" dans la colonne Médicament.
          </p>
          <details className="mt-2">
            <summary className="cursor-pointer text-sm font-medium">Voir les détails</summary>
            <div className="mt-2 text-xs">
              {sales.filter(s => !s.medication || !s.medication.name).map((s, index) => (
                <div key={index} className="mb-1 p-2 bg-blue-100 rounded">
                  Vente ID: {s.id} - Médicament: {s.medication ? `ID ${s.medication.id}` : 'undefined'} - 
                  Nom: {s.medication?.name || 'undefined'}
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
      
      {/* Filtres */}
      <div className="card mb-6" ref={tableRef}>
        {loading ? (
          <div className="flex items-center justify-center h-24">Chargement...</div>
        ) : filteredSales.length === 0 ? (
          <div className="text-gray-500">Aucune vente enregistrée.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 print-table">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Médicament</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantité</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  {/* Prix masqué pour l'interface hospitalisation */}
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSales.map((s: any) => (
                  <tr key={s.id}>
                    <td className="px-4 py-2 font-mono text-sm">
                      {s.patient.folderNumber} - {s.patient.lastName?.toUpperCase() || ''} {s.patient.firstName || ''}
                    </td>
                    <td className="px-4 py-2">{s.medication.name}</td>
                    <td className="px-4 py-2">{s.quantity}</td>
                    <td className="px-4 py-2">{new Date(s.date).toLocaleDateString('fr-FR')}</td>
                    {/* Prix masqué pour l'interface hospitalisation */}
                    <td className="px-4 py-2">
                      <button className="btn-secondary btn-xs" onClick={() => handleEdit(s)}>Modifier</button>
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
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-lg relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowForm(false)}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-xl font-bold mb-4">Nouvelle vente de médicament</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Patient</label>
                <input
                  type="text"
                  className="input-field mb-1"
                  placeholder="Rechercher un patient..."
                  value={patientSearch}
                  onChange={e => setPatientSearch(e.target.value)}
                />
                <select
                  name="patientId"
                  value={form.patientId}
                  onChange={handleChange}
                  required
                  className="input-field"
                >
                  <option value="">Sélectionner un patient</option>
                  {patients.filter((p) => {
                    const txt = `${p.folderNumber} ${p.lastName || ''} ${p.firstName || ''}`.toLowerCase();
                    return txt.includes(patientSearch.toLowerCase());
                  }).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.folderNumber} - {p.lastName?.toUpperCase() || ''} {p.firstName || ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Médicament</label>
                <input
                  type="text"
                  className="input-field mb-1"
                  placeholder="Rechercher un médicament..."
                  value={medicationSearch}
                  onChange={e => setMedicationSearch(e.target.value)}
                />
                <select
                  name="medicationId"
                  value={form.medicationId}
                  onChange={handleChange}
                  required
                  className="input-field"
                >
                  <option value="">Sélectionner un médicament</option>
                  {medications.filter((m: any) => m.name.toLowerCase().includes(medicationSearch.toLowerCase())).map((m: any) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (Stock: {m.quantity})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Quantité</label>
                <input
                  type="number"
                  name="quantity"
                  value={form.quantity}
                  onChange={handleChange}
                  required
                  min="1"
                  max={medications.find((m: any) => m.id === parseInt(form.medicationId))?.quantity || 1}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  required
                  className="input-field"
                />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowForm(false)}
                >
                  Annuler
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Formulaire de modification */}
      {editingSale && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Modifier la vente</h2>
            <form onSubmit={handleEditSubmit}>
              <div className="mb-4">
                <label className="block mb-1">Patient</label>
                <input
                  type="text"
                  className="input w-full mb-1"
                  placeholder="Rechercher un patient..."
                  value={patientSearch}
                  onChange={e => setPatientSearch(e.target.value)}
                />
                <select
                  name="patientId"
                  value={editForm.patientId}
                  onChange={handleEditChange}
                  className="input w-full"
                  required
                >
                  <option value="">Sélectionner un patient</option>
                  {patients.filter((p) => {
                    const txt = `${p.folderNumber} ${p.lastName || ''} ${p.firstName || ''}`.toLowerCase();
                    return txt.includes(patientSearch.toLowerCase());
                  }).map((p) => (
                    <option key={p.id} value={p.id}>{p.folderNumber} - {p.lastName?.toUpperCase() || ''} {p.firstName || ''}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block mb-1">Médicament</label>
                <input
                  type="text"
                  className="input w-full mb-1"
                  placeholder="Rechercher un médicament..."
                  value={medicationSearch}
                  onChange={e => setMedicationSearch(e.target.value)}
                />
                <select
                  name="medicationId"
                  value={editForm.medicationId}
                  onChange={handleEditChange}
                  className="input w-full"
                  required
                >
                  <option value="">Sélectionner un médicament</option>
                  {medications.filter((m: any) => m.name.toLowerCase().includes(medicationSearch.toLowerCase())).map((m: any) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block mb-1">Quantité</label>
                <input
                  type="number"
                  name="quantity"
                  value={editForm.quantity}
                  onChange={handleEditChange}
                  className="input w-full"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1">Date</label>
                <input
                  type="date"
                  name="date"
                  value={editForm.date}
                  onChange={handleEditChange}
                  className="input w-full"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" className="btn-secondary" onClick={() => setEditingSale(null)}>Annuler</button>
                <button type="submit" className="btn-primary">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicationsListHospitalisation; 
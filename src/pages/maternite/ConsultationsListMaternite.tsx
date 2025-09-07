import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface Patient {
  id: number;
  folderNumber: string;
  gender: string;
  firstName?: string;
  lastName?: string;
}

interface ConsultationType {
  id: number;
  name: string;
}

interface Consultation {
  id: number;
  patient: Patient;
  consultationType: ConsultationType;
  date: string;
}

const ConsultationsListMaternite: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [consultationTypes, setConsultationTypes] = useState<ConsultationType[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [form, setForm] = useState({
    patientId: '',
    consultationTypeId: '',
    date: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const [editingConsultation, setEditingConsultation] = useState<Consultation | null>(null);
  const [editForm, setEditForm] = useState({
    patientId: '',
    consultationTypeId: '',
    date: '',
  });
  const [search, setSearch] = useState('');
  const [patientSearch, setPatientSearch] = useState('');

  useEffect(() => {
    fetchPatients();
    fetchConsultationTypes();
    fetchConsultations();
  }, []);

  const fetchPatients = async () => {
    try {
      const res = await axios.get('/api/patients?service=consultations_maternite');
      setPatients(res.data.patients || []);
    } catch (e) {
      setPatients([]);
    }
  };

  const fetchConsultationTypes = async () => {
    try {
      const res = await axios.get('/api/consultations/types');
      setConsultationTypes(res.data.consultationTypes || []);
    } catch (e) {
      setConsultationTypes([]);
    }
  };

  const fetchConsultations = async () => {
    try {
      const res = await axios.get('/api/consultations/maternite');
      setConsultations(res.data.consultations || []);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Erreur lors du chargement des consultations');
    }
  };

  const handleOpenForm = () => {
    setShowForm(true);
    setForm({
      patientId: '',
      consultationTypeId: '',
      date: new Date().toISOString().slice(0, 10),
    });
    setError(null);
    setSuccess(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await axios.post('/api/consultations', {
        patientId: parseInt(form.patientId),
        consultationTypeId: parseInt(form.consultationTypeId),
        date: form.date,
      });

      // Refetch les consultations pour avoir les données complètes
      await fetchConsultations();
      
      setShowForm(false);
      setForm({
        patientId: '',
        consultationTypeId: '',
        date: '',
      });
      setSuccess('Consultation ajoutée avec succès');
    } catch (e: any) {
      setError(e.response?.data?.error || 'Erreur lors de l\'ajout de la consultation');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (consultation: Consultation) => {
    setEditingConsultation(consultation);
    setEditForm({
      patientId: consultation.patient.id.toString(),
      consultationTypeId: consultation.consultationType.id.toString(),
      date: consultation.date,
    });
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConsultation) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await axios.put(`/api/consultations/${editingConsultation.id}`, {
        patientId: parseInt(editForm.patientId),
        consultationTypeId: parseInt(editForm.consultationTypeId),
        date: editForm.date,
      });

      // Refetch les consultations pour avoir les données complètes
      await fetchConsultations();
      
      setEditingConsultation(null);
      setEditForm({
        patientId: '',
        consultationTypeId: '',
        date: '',
      });
      setSuccess('Consultation modifiée avec succès');
    } catch (e: any) {
      setError(e.response?.data?.error || 'Erreur lors de la modification de la consultation');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintList = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const consultationsToPrint = consultations.filter(c => 
      c.patient.folderNumber.toLowerCase().includes(search.toLowerCase()) ||
      (c.patient.firstName || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.patient.lastName || '').toLowerCase().includes(search.toLowerCase())
    );

    printWindow.document.write(`
      <html>
        <head>
          <title>Liste des Consultations - Maternité</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            h1 { color: #333; }
            .header { text-align: center; margin-bottom: 30px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Liste des Consultations - Maternité</h1>
            <p>Date d'impression: ${new Date().toLocaleDateString('fr-FR')}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>N° Dossier</th>
                <th>Patiente</th>
                <th>Type de Consultation</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${consultationsToPrint.map(c => `
                <tr>
                  <td>${c.patient.folderNumber}</td>
                  <td>${c.patient.firstName || ''} ${c.patient.lastName || ''}</td>
                  <td>${c.consultationType.name}</td>
                  <td>${new Date(c.date).toLocaleDateString('fr-FR')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Remplacer le tableau par un filtrage sur la recherche
  const filteredConsultations = consultations.filter(c => {
    // Vérifier que la consultation a des données patient valides
    if (!c.patient || !c.patient.folderNumber) {
      console.warn(`⚠️ Consultation ${c.id} sans données patient valides:`, c);
      return false; // Exclure les consultations invalides
    }
    
    const patient = c.patient;
    const searchText = `${patient.folderNumber} ${patient.lastName || ''} ${patient.firstName || ''}`.toLowerCase();
    return searchText.includes(search.toLowerCase());
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Consultations - Maternité</h1>
          <button className="btn-secondary no-print" onClick={handlePrintList}>
            <svg className="h-5 w-5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2V7a2 2 0 012-2h16a2 2 0 012 2v9a2 2 0 01-2 2h-2m-6 0v4m0 0h4m-4 0H8" /></svg>
            Imprimer la liste
          </button>
        </div>
        <button className="btn-primary no-print" onClick={handleOpenForm}>
          + Nouvelle consultation
        </button>
      </div>
      <input
        type="text"
        className="input-field mb-4"
        placeholder="Rechercher une patiente (nom ou dossier)"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <p className="text-gray-600 mb-6">Consultez la liste des consultations pour les patientes maternité.</p>
      {error && <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4 text-red-700">{error}</div>}
      {success && <div className="bg-green-50 border border-green-400 text-green-700 rounded-md p-4 mb-4">{success}</div>}
      
      {/* Composant de débogage pour les consultations invalides */}
      {consultations.length > 0 && consultations.some(c => !c.patient || !c.consultationType) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4 text-yellow-700">
          <h3 className="font-semibold mb-2">⚠️ Consultations avec données manquantes détectées</h3>
          <p className="text-sm">
            Certaines consultations ont des données patient ou type de consultation manquantes. 
            Elles ont été exclues de l'affichage pour éviter les erreurs.
          </p>
          <details className="mt-2">
            <summary className="cursor-pointer text-sm font-medium">Voir les détails</summary>
            <div className="mt-2 text-xs">
              {consultations.filter(c => !c.patient || !c.consultationType).map((c, index) => (
                <div key={index} className="mb-1 p-2 bg-yellow-100 rounded">
                  Consultation ID: {c.id} - 
                  Patient: {c.patient ? `${c.patient.folderNumber || 'N/A'} (${c.patient.firstName || 'N/A'} ${c.patient.lastName || 'N/A'})` : 'Manquant'} - 
                  Type: {c.consultationType ? c.consultationType.name : 'Manquant'}
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
      
      <div className="card mb-6" ref={tableRef}>
        {loading ? (
          <div className="flex items-center justify-center h-24">Chargement...</div>
        ) : filteredConsultations.length === 0 ? (
          <div className="text-gray-500">Aucune consultation enregistrée.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 print-table">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Patiente</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  {/* Suppression de la colonne Actions */}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredConsultations.map((c) => {
                  // Vérification de sécurité supplémentaire
                  if (!c.patient || !c.consultationType) {
                    console.warn(`⚠️ Consultation ${c.id} avec données manquantes:`, c);
                    return null; // Ne pas afficher cette consultation
                  }
                  
                  return (
                    <tr key={c.id}>
                      <td className="px-4 py-2 font-mono text-sm">
                        {c.patient.folderNumber} - {c.patient.lastName?.toUpperCase() || ''} {c.patient.firstName || ''}
                      </td>
                      <td className="px-4 py-2">{c.consultationType.name}</td>
                      <td className="px-4 py-2">{new Date(c.date).toLocaleDateString('fr-FR')}</td>
                      {/* Suppression de la colonne Actions */}
                    </tr>
                  );
                })}
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
            <h2 className="text-xl font-bold mb-4">Nouvelle consultation</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Patiente</label>
                <input
                  type="text"
                  className="input-field mb-1"
                  placeholder="Rechercher une patiente..."
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
                  <option value="">Sélectionner une patiente</option>
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
                <label className="block text-sm font-medium text-gray-700">Type de consultation</label>
                <select
                  name="consultationTypeId"
                  value={form.consultationTypeId}
                  onChange={handleChange}
                  required
                  className="input-field"
                >
                  <option value="">Sélectionner un type</option>
                  {consultationTypes.map((ct) => (
                    <option key={ct.id} value={ct.id}>
                      {ct.name}
                    </option>
                  ))}
                </select>
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
      {editingConsultation && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Modifier la consultation</h2>
            <form onSubmit={handleEditSubmit}>
              <div className="mb-4">
                <label className="block mb-1">Patiente</label>
                <select
                  name="patientId"
                  value={editForm.patientId}
                  onChange={handleEditChange}
                  className="input w-full"
                  required
                >
                  <option value="">Sélectionner une patiente</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.folderNumber} - {p.lastName?.toUpperCase() || ''} {p.firstName || ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block mb-1">Type de consultation</label>
                <select
                  name="consultationTypeId"
                  value={editForm.consultationTypeId}
                  onChange={handleEditChange}
                  className="input w-full"
                  required
                >
                  <option value="">Sélectionner un type</option>
                  {consultationTypes.map((ct) => (
                    <option key={ct.id} value={ct.id}>{ct.name}</option>
                  ))}
                </select>
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
                <button type="button" className="btn-secondary" onClick={() => setEditingConsultation(null)}>Annuler</button>
                <button type="submit" className="btn-primary">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultationsListMaternite; 
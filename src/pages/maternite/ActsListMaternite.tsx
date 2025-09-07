import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';

interface Patient {
  id: number;
  folderNumber: string;
  lastName?: string;
  firstName?: string;
}

interface ActType {
  id: number;
  name: string;
  price: number;
}

interface Act {
  id: number;
  patient: Patient;
  actType: ActType;
  date: string;
  price: number;
}

const ActsListMaternite: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [actTypes, setActTypes] = useState<ActType[]>([]);
  const [acts, setActs] = useState<Act[]>([]);
  const [form, setForm] = useState({
    patientId: '',
    actTypeId: '',
    date: new Date().toISOString().slice(0, 10),
    amount: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const [facturedActs, setFacturedActs] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [actTypeSearch, setActTypeSearch] = useState('');

  useEffect(() => {
    fetchPatients();
    fetchActTypes();
    fetchActs();
    fetchFacturedActs();
  }, []);

  const fetchPatients = async () => {
    try {
      const res = await axios.get('/api/patients?service=actes_maternite');
      setPatients(res.data.patients || []);
    } catch (e) {
      setPatients([]);
    }
  };

  const fetchActTypes = async () => {
    try {
      const res = await axios.get('/api/acts');
      setActTypes(res.data.actTypes || []);
    } catch (e) {
      setActTypes([]);
    }
  };

  const fetchActs = async () => {
    setLoading(true);
    try {
      // Récupérer les actes programmés ET récemment réalisés (comme l'interface caissier)
      const [scheduledRes, realizedRes] = await Promise.all([
        axios.get('/api/acts/scheduled'),
        axios.get('/api/acts/realized')
      ]);
      
      const scheduledActs = scheduledRes.data.acts || [];
      
      // Filtrer les actes réalisés récemment (dans les 10 dernières minutes)
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const recentlyRealizedActs = (realizedRes.data.acts || [])
        .filter((act: any) => new Date(act.updatedAt || act.date) > tenMinutesAgo);
      
      // Combiner les actes programmés et récemment réalisés
      const allActs = [...scheduledActs, ...recentlyRealizedActs];
      
      // Filtrer pour ne garder que les actes des patients maternité
      const matRes = await axios.get('/api/hospitalizations');
      const matHosp = matRes.data.hospitalizations.filter((h: any) => h.patient && h.patient.folderNumber && h.patient.folderNumber.startsWith('MAT-'));
      const matPatientIds = matHosp.map((h: any) => h.patientId);
      
      const filteredActs = allActs.filter((a: any) => matPatientIds.includes(a.patient.id));
      setActs(filteredActs);
    } catch (e) {
      setActs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFacturedActs = async () => {
    try {
      const res = await axios.get('/api/invoices');
      const actsIds: number[] = [];
      for (const invoice of res.data.invoices || []) {
        for (const item of invoice.items || []) {
          if (item.type === 'act' && item.actId) {
            actsIds.push(Number(item.actId));
          }
        }
      }
      setFacturedActs(actsIds);
    } catch (e) {
      setFacturedActs([]);
    }
  };

  const handleOpenForm = () => {
    setShowForm(true);
    setError(null);
    setSuccess(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'actTypeId' && value) {
      // Récupérer automatiquement le prix du type d'acte sélectionné (comme l'interface caissier)
      const selectedActType = actTypes.find(type => type.id === parseInt(value));
      if (selectedActType) {
        setForm({ 
          ...form, 
          [name]: value,
          amount: selectedActType.price.toString()
        });
      } else {
        setForm({ ...form, [name]: value });
      }
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await axios.post('/api/acts', form);
      setSuccess('Acte enregistré avec succès');
      setForm({ patientId: '', actTypeId: '', date: new Date().toISOString().slice(0, 10), amount: '' });
      setShowForm(false);
      fetchActs();
      fetchFacturedActs();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintList = () => {
    const doc = new jsPDF();
    doc.text('Liste des actes programmés - Maternité', 20, 20);
    let y = 40;
    acts.forEach((act, index) => {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      doc.text(`${index + 1}. ${act.patient?.firstName || ''} ${act.patient?.lastName || ''} - ${act.actType?.name || 'Type non défini'}`, 20, y);
      y += 10;
    });
    doc.save('liste-actes-maternite.pdf');
  };

  const filteredActs = acts.filter(act => {
    const searchLower = search.toLowerCase();
    const patientSearchLower = patientSearch.toLowerCase();
    const actTypeSearchLower = actTypeSearch.toLowerCase();
    
    return (
      (search === '' || 
       act.patient?.firstName?.toLowerCase().includes(searchLower) ||
       act.patient?.lastName?.toLowerCase().includes(searchLower) ||
       act.actType?.name?.toLowerCase().includes(searchLower)) &&
      (patientSearch === '' ||
       act.patient?.firstName?.toLowerCase().includes(patientSearchLower) ||
       act.patient?.lastName?.toLowerCase().includes(patientSearchLower)) &&
      (actTypeSearch === '' ||
       act.actType?.name?.toLowerCase().includes(actTypeSearchLower))
    );
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestion des actes - Maternité</h1>
        <div className="flex gap-2">
          <button
            onClick={handlePrintList}
            className="btn-secondary"
          >
            Imprimer la liste
          </button>
          <button
            onClick={handleOpenForm}
            className="btn-primary"
          >
            Nouvel acte
          </button>
        </div>
      </div>

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

      {/* Filtres */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="text"
          placeholder="Recherche générale..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field"
        />
        <input
          type="text"
          placeholder="Recherche par patient..."
          value={patientSearch}
          onChange={(e) => setPatientSearch(e.target.value)}
          className="input-field"
        />
        <input
          type="text"
          placeholder="Recherche par type d'acte..."
          value={actTypeSearch}
          onChange={(e) => setActTypeSearch(e.target.value)}
          className="input-field"
        />
      </div>

      {/* Formulaire d'ajout */}
      {showForm && (
        <div className="mb-6 p-6 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Nouvel acte</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              name="patientId"
              value={form.patientId}
              onChange={handleChange}
              required
              className="input-field"
            >
              <option value="">Sélectionner un patient</option>
              {patients.map(patient => (
                <option key={patient.id} value={patient.id}>
                  {patient.firstName} {patient.lastName} - {patient.folderNumber}
                </option>
              ))}
            </select>
            <select
              name="actTypeId"
              value={form.actTypeId}
              onChange={handleChange}
              required
              className="input-field"
            >
              <option value="">Sélectionner un type d'acte</option>
              {actTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name} - ${type.price}
                </option>
              ))}
            </select>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              required
              className="input-field"
            />
            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              placeholder="Prix"
              required
              readOnly
              className="input-field bg-gray-100"
            />
            <div className="md:col-span-3 flex gap-2">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Enregistrement...' : 'Enregistrer'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-secondary"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tableau des actes */}
      <div ref={tableRef} className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 print-table">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Prix</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredActs.map(act => (
              <tr key={act.id}>
                <td className="px-4 py-2 font-mono text-sm">
                  {act.patient?.folderNumber} - {act.patient?.lastName?.toUpperCase() || ''} {act.patient?.firstName || ''}
                </td>
                <td className="px-4 py-2">{act.actType?.name || 'Type non défini'}</td>
                <td className="px-4 py-2">{new Date(act.date).toLocaleDateString('fr-FR')}</td>
                <td className="px-4 py-2">${act.price || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ActsListMaternite; 
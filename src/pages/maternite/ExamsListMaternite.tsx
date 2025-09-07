import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const ExamsListMaternite: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [examTypes, setExamTypes] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [form, setForm] = useState({
    patientId: '',
    examTypeId: '',
    date: new Date().toISOString().slice(0, 10),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [editingExam, setEditingExam] = useState<any>(null);
  const [editForm, setEditForm] = useState({ patientId: '', examTypeId: '', date: '' });
  const tableRef = useRef<HTMLDivElement>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [examTypeSearch, setExamTypeSearch] = useState('');

  useEffect(() => {
    fetchPatients();
    fetchExamTypes();
    fetchExams();
  }, []);

  const fetchPatients = async () => {
    try {
      const res = await axios.get('/api/patients?service=examens_maternite');
      setPatients(res.data.patients || []);
    } catch (e) {
      setPatients([]);
    }
  };

  const fetchExamTypes = async () => {
    try {
      const res = await axios.get('/api/exams');
      setExamTypes(res.data.examTypes || []);
    } catch (e) {
      setExamTypes([]);
    }
  };

  const fetchExams = async () => {
    try {
      const res = await axios.get('/api/exams/maternite');
      setExams(res.data.exams || []);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Erreur lors du chargement des examens');
    }
  };

  const handleOpenForm = () => {
    setForm({ patientId: '', examTypeId: '', date: new Date().toISOString().slice(0, 10) });
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
      await axios.post('/api/exams', {
        patientId: form.patientId,
        examTypeId: form.examTypeId,
        date: form.date,
      });
      setSuccess('Examen enregistré avec succès !');
      setShowForm(false);
      fetchExams();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Erreur lors de l’enregistrement de l’examen');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (exam: any) => {
    setEditingExam(exam);
    setEditForm({
      patientId: exam.patient.id.toString(),
      examTypeId: exam.examType.id.toString(),
      date: exam.date.slice(0, 10),
    });
  };
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExam) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await axios.patch(`/api/exams/${editingExam.id}`, {
        patientId: editForm.patientId,
        examTypeId: editForm.examTypeId,
        date: editForm.date,
      });
      setSuccess('Examen modifié avec succès !');
      setEditingExam(null);
      fetchExams();
    } catch (e: any) {
      setError(e.response?.data?.error || "Erreur lors de la modification de l'examen");
    } finally {
      setLoading(false);
    }
  };

  const filteredExams = exams.filter((e: any) => {
    const patient = e.patient;
    const searchText = `${patient.folderNumber} ${patient.lastName || ''} ${patient.firstName || ''}`.toLowerCase();
    return searchText.includes(search.toLowerCase());
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Examens maternité</h1>
        </div>
        <button className="btn-primary no-print" onClick={handleOpenForm}>
          + Nouvel examen
        </button>
      </div>
      <input
        type="text"
        className="input-field mb-4"
        placeholder="Rechercher une patiente (nom ou dossier)"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <p className="text-gray-600 mb-6">Consultez la liste des examens des patientes hospitalisées à la maternité.</p>
      {error && <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4 text-red-700">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4 text-green-700">{success}</div>}
      <div className="card mb-6" ref={tableRef}>
        {loading ? (
          <div className="flex items-center justify-center h-24">Chargement...</div>
        ) : filteredExams.length === 0 ? (
          <div className="text-gray-500">Aucun examen enregistré.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 print-table">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Patiente</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Examen</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  {/* Prix masqué pour l'interface maternité */}
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredExams.map((e: any) => (
                  <tr key={e.id}>
                    <td className="px-4 py-2 font-mono text-sm">
                      {e.patient.folderNumber} - {e.patient.lastName?.toUpperCase() || ''} {e.patient.firstName || ''}
                    </td>
                    <td className="px-4 py-2">{e.examType.name}</td>
                    <td className="px-4 py-2">{new Date(e.date).toLocaleDateString('fr-FR')}</td>
                    {/* Prix masqué pour l'interface maternité */}
                    <td className="px-4 py-2">
                      <button className="btn-secondary btn-xs" onClick={() => handleEdit(e)}>Modifier</button>
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
            <h2 className="text-xl font-bold mb-4">Nouvel examen</h2>
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
                <label className="block text-sm font-medium text-gray-700">Type d'examen</label>
                <input
                  type="text"
                  className="input-field mb-1"
                  placeholder="Rechercher un examen..."
                  value={examTypeSearch}
                  onChange={e => setExamTypeSearch(e.target.value)}
                />
                <select
                  name="examTypeId"
                  value={form.examTypeId}
                  onChange={handleChange}
                  required
                  className="input-field"
                >
                  <option value="">Sélectionner un examen</option>
                  {examTypes.filter((et) => et.name.toLowerCase().includes(examTypeSearch.toLowerCase())).map((et) => (
                    <option key={et.id} value={et.id}>
                      {et.name}
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
      {editingExam && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Modifier l'examen</h2>
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
                    <option key={p.id} value={p.id}>{p.folderNumber} - {p.lastName?.toUpperCase() || ''} {p.firstName || ''}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block mb-1">Type d'examen</label>
                <select
                  name="examTypeId"
                  value={editForm.examTypeId}
                  onChange={handleEditChange}
                  className="input w-full"
                  required
                >
                  <option value="">Sélectionner un examen</option>
                  {examTypes.map((et) => (
                    <option key={et.id} value={et.id}>{et.name}</option>
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
                <button type="button" className="btn-secondary" onClick={() => setEditingExam(null)}>Annuler</button>
                <button type="submit" className="btn-primary">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamsListMaternite; 
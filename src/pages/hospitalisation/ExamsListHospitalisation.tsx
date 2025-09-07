import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const ExamsListHospitalisation: React.FC = () => {
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
  const [patientSearch, setPatientSearch] = useState('');
  const [examTypeSearch, setExamTypeSearch] = useState('');
  const [editingExam, setEditingExam] = useState<any>(null);
  const [editForm, setEditForm] = useState({ patientId: '', examTypeId: '', date: '' });
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPatients();
    fetchExamTypes();
    fetchExams();
  }, []);

  const fetchPatients = async () => {
    try {
      const res = await axios.get('/api/patients?service=examens_hospitalisation');
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
    setLoading(true);
    try {
      // Utiliser la nouvelle route spécifique à l'hospitalisation
      const res = await axios.get('/api/exams/hospitalisation');
      const examsData = res.data.exams || [];
      
      console.log('🔍 Données reçues de l\'API examens:', res.data);
      console.log('📊 Examens reçus:', examsData);
      
      // Vérifier et nettoyer les données reçues
      const validExams = examsData.filter((e: any) => {
        if (!e.patient) {
          console.warn('Examen sans patient détecté:', e);
          return false;
        }
        if (!e.patient.folderNumber) {
          console.warn('Examen avec patient sans folderNumber:', e);
          return false;
        }
        if (!e.examType) {
          console.warn('Examen sans type détecté:', e);
          return false;
        }
        if (!e.examType.name) {
          console.warn('Examen avec type sans nom:', e);
          return false;
        }
        return true;
      });
      
      console.log('Examens valides récupérés:', validExams.length, 'sur', examsData.length);
      
      // Log détaillé de chaque examen valide
      validExams.forEach((exam: any, index: number) => {
        console.log(`📋 Examen ${index + 1}:`, {
          id: exam.id,
          patient: exam.patient,
          examType: exam.examType,
          date: exam.date,
          status: exam.status
        });
      });
      
      setExams(validExams);
    } catch (e) {
      console.error('Erreur lors de la récupération des examens:', e);
      setExams([]);
    } finally {
      setLoading(false);
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
      // Validation des données avant envoi
      if (!form.patientId || !form.examTypeId || !form.date) {
        setError('Tous les champs sont requis');
        setLoading(false);
        return;
      }

      const res = await axios.post('/api/exams', {
        patientId: form.patientId,
        examTypeId: form.examTypeId,
        date: form.date,
      });

      console.log('✅ Examen créé avec succès:', res.data);

      // Vérifier que la réponse contient un examen valide
      if (res.data && res.data.patientExam) {
        const newExam = res.data.patientExam;
        
        // Vérifier que l'examen a un patient et un type valides
        if (newExam.patient && newExam.patient.folderNumber && newExam.exam && newExam.exam.name) {
          // Ajouter le nouvel examen à la liste existante
          const examToAdd = {
            id: newExam.id,
            patient: newExam.patient,
            examType: newExam.exam,
            date: newExam.date,
            status: newExam.status,
            results: newExam.results
          };
          
          setExams([examToAdd, ...exams]);
          setShowForm(false);
          setForm({
            patientId: '',
            examTypeId: '',
            date: new Date().toISOString().slice(0, 10),
          });
          setSuccess('Examen enregistré avec succès !');
        } else {
          console.error('Examen créé mais données invalides:', newExam);
          setError('Examen créé mais données incomplètes');
        }
      } else {
        console.error('Réponse API invalide:', res.data);
        setError('Réponse du serveur invalide');
      }
    } catch (e: any) {
      console.error('Erreur lors de la création de l\'examen:', e);
      setError(e.response?.data?.error || 'Erreur lors de l\'enregistrement de l\'examen');
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
          <h1 className="text-2xl font-bold">Examens hospitalisation</h1>
        </div>
        <button className="btn-primary no-print" onClick={handleOpenForm}>
          + Nouvel examen
        </button>
      </div>
      <input
        type="text"
        className="input-field mb-4"
        placeholder="Rechercher un patient (nom ou dossier)"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <p className="text-gray-600 mb-6">Consultez la liste des examens des patients hospitalisés.</p>
      {error && <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4 text-red-700">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4 text-green-700">{success}</div>}
      
      {/* Composant de débogage pour les erreurs de données */}
      {exams.length > 0 && exams.some(e => !e.patient || !e.patient.folderNumber) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4 text-yellow-700">
          <h3 className="font-semibold mb-2">⚠️ Données incomplètes détectées</h3>
          <p className="text-sm">
            Certains examens ont des données de patient manquantes. 
            Ces examens ne seront pas affichés dans la liste.
          </p>
          <details className="mt-2">
            <summary className="cursor-pointer text-sm font-medium">Voir les détails</summary>
            <div className="mt-2 text-xs">
              {exams.filter(e => !e.patient || !e.patient.folderNumber).map((e, index) => (
                <div key={index} className="mb-1 p-2 bg-yellow-100 rounded">
                  Examen ID: {e.id} - Patient: {e.patient ? `ID ${e.patient.id}` : 'undefined'} - 
                  folderNumber: {e.patient?.folderNumber || 'undefined'}
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
      
      {/* Composant de débogage pour les types d'examens */}
      {exams.length > 0 && exams.some(e => !e.examType || !e.examType.name) && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4 text-blue-700">
          <h3 className="font-semibold mb-2">⚠️ Types d'examens manquants</h3>
          <p className="text-sm">
            Certains examens ont des types manquants ou invalides. 
            Ces examens peuvent afficher "N/A" dans la colonne Examen.
          </p>
          <details className="mt-2">
            <summary className="cursor-pointer text-sm font-medium">Voir les détails</summary>
            <div className="mt-2 text-xs">
              {exams.filter(e => !e.examType || !e.examType.name).map((e, index) => (
                <div key={index} className="mb-1 p-2 bg-blue-100 rounded">
                  Examen ID: {e.id} - Type: {e.examType ? `ID ${e.examType.id}` : 'undefined'} - 
                  Nom: {e.examType?.name || 'undefined'}
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
      
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
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Examen</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredExams.map((e: any) => (
                  <tr key={e.id}>
                    <td className="px-4 py-2 font-mono text-sm">
                      {e.patient.folderNumber} - {e.patient.lastName?.toUpperCase() || ''} {e.patient.firstName || ''}
                    </td>
                    <td className="px-4 py-2 font-medium">{e.examType.name}</td>
                    <td className="px-4 py-2">{new Date(e.date).toLocaleDateString('fr-FR')}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        e.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : e.status === 'scheduled' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {e.status === 'completed' ? 'Réalisé' : 
                         e.status === 'scheduled' ? 'Programmé' : 
                         e.status || 'Inconnu'}
                      </span>
                    </td>
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
      {/* Formulaire de modification */}
      {editingExam && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Modifier l'examen</h2>
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
                <label className="block mb-1">Type d'examen</label>
                <input
                  type="text"
                  className="input w-full mb-1"
                  placeholder="Rechercher un examen..."
                  value={examTypeSearch}
                  onChange={e => setExamTypeSearch(e.target.value)}
                />
                <select
                  name="examTypeId"
                  value={editForm.examTypeId}
                  onChange={handleEditChange}
                  className="input w-full"
                  required
                >
                  <option value="">Sélectionner un examen</option>
                  {examTypes.filter((et) => et.name.toLowerCase().includes(examTypeSearch.toLowerCase())).map((et) => (
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

export default ExamsListHospitalisation; 
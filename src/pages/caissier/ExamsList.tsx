import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../../utils/apiClient';
import jsPDF from 'jspdf';

interface Patient {
  id: number;
  folderNumber: string;
  lastName?: string;
  firstName?: string;
}

interface ExamType {
  id: number;
  name: string;
  price: number;
}

interface Exam {
  id: number;
  patient: Patient;
  examType: ExamType;
  date: string;
  price: number;
}

const ExamsList: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [form, setForm] = useState({
    patientId: '',
    examTypeId: '',
    date: new Date().toISOString().slice(0, 10),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const [facturedExams, setFacturedExams] = useState<number[]>([]);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [editForm, setEditForm] = useState({
    patientId: '',
    examTypeId: '',
    date: '',
  });
  const [search, setSearch] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [examTypeSearch, setExamTypeSearch] = useState('');

  useEffect(() => {
    fetchPatients();
    fetchExamTypes();
    fetchExams();
    fetchFacturedExams();
  }, []);

  const fetchPatients = async () => {
    try {
      const res = await apiClient.get('/api/patients');
      console.log('📋 Réponse patients ExamsList:', res.data);
      
      // Vérifier la structure de la réponse
      let patientsData = [];
      if (Array.isArray(res.data)) {
        patientsData = res.data;
      } else if (res.data && Array.isArray(res.data.patients)) {
        patientsData = res.data.patients;
      } else if (res.data && res.data.data && Array.isArray(res.data.data)) {
        patientsData = res.data.data;
      }
      
      setPatients(patientsData);
      console.log('✅ Patients chargés dans ExamsList:', patientsData.length);
    } catch (e) {
      setPatients([]);
    }
  };

  const fetchExamTypes = async () => {
    try {
      const res = await apiClient.get('/api/exams');
      setExamTypes(res.data.examTypes || []);
    } catch (e) {
      setExamTypes([]);
    }
  };

  const fetchExams = async () => {
    setLoading(true);
    try {
      // Récupérer les examens programmés ET récemment réalisés
      const [scheduledRes, realizedRes] = await Promise.all([
        apiClient.get('/api/exams/scheduled'),
        apiClient.get('/api/exams/realized')
      ]);
      
      const scheduledExams = scheduledRes.data.exams || [];
      
      // Filtrer les examens réalisés récemment (dans les 10 dernières minutes)
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const recentlyRealizedExams = (realizedRes.data.exams || [])
        .filter((exam: any) => new Date(exam.updatedAt || exam.date) > tenMinutesAgo);
      
      // Combiner les examens programmés et récemment réalisés
      const allExams = [...scheduledExams, ...recentlyRealizedExams];
      
      setExams(allExams);
    } catch (e) {
      setExams([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFacturedExams = async () => {
    try {
      const res = await apiClient.get('/api/invoices');
      const examsIds: number[] = [];
      for (const invoice of res.data.invoices || []) {
        for (const item of invoice.items || []) {
          if (item.type === 'exam' && item.examId) {
            examsIds.push(Number(item.examId));
          }
        }
      }
      setFacturedExams(examsIds);
    } catch (e) {
      // ignore
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
      await apiClient.post('/api/exams', {
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

  // Impression de toute la liste
  const handlePrintList = () => {
    if (!tableRef.current) return;
    const printContents = tableRef.current.innerHTML;
    const win = window.open('', '', 'height=900,width=700');
    if (win) {
      win.document.write('<html><head><title>Liste des examens</title>');
      win.document.write('<style>body{font-family:sans-serif;} .print-table{width:100%;border-collapse:collapse;} .print-table th,.print-table td{border:1px solid #ccc;padding:8px;} .footer{font-size:13px;text-align:center;margin-top:40px;color:#222;} .entete-bg{background: linear-gradient(90deg, #fff 70%, #009900 100%); border-bottom: 2px solid #e60000; border-radius: 0 0 80px 0 / 0 0 40px 0;} .entete-content{display:flex;align-items:center;gap:16px;} .entete-logo{height:70px;} .entete-text{flex:1;text-align:center;} .entete-title{color:#009900;font-weight:bold;font-size:1.2em;} .entete-sub{color:#e60000;font-weight:bold;} @media print{.no-print{display:none;}}</style>');
      win.document.write('</head><body>');
      // Entête institutionnelle
      win.document.write('<div class="entete-bg" style="padding:12px 12px 0 12px;">');
      win.document.write('<div class="entete-content">');
      win.document.write('<img src="/logo_polycliniques.jpg" class="entete-logo" alt="Logo" />');
      win.document.write('<div class="entete-text">');
      win.document.write('<div style="font-size:13px;font-weight:bold;">REPUBLIQUE DEMOCRATIQUE DU CONGO<br/>PROVINCE DU SUD-KIVU<br/>VILLE DE BUKAVU<br/>ZONE DE SANTE URBAINE DE KADUTU</div>');
      win.document.write('<div class="entete-sub">FONDATION UMOJA</div>');
      win.document.write('<div style="font-size:15px;font-weight:bold;color:#009900;">"F.U" asbl</div>');
      win.document.write('<div style="font-size:13px;font-weight:bold;">DEPARTEMENT DES OEUVRES MEDICALES</div>');
      win.document.write('<div class="entete-title">POLYCLINIQUE DES APOTRES</div>');
      win.document.write('</div></div></div>');
      // Titre
      win.document.write('<h2 class="print-header" style="color:#15803d;text-align:center;">Liste des examens</h2>');
      win.document.write(printContents);
      // Bas de page institutionnel
      win.document.write('<div class="footer" style="text-align:center;">');
      win.document.write('Adresse : DRCONGO/SK/BKV/Av. BUHOZI/KAJANGU/CIRIRI<br/>');
      win.document.write('Tél : (+243) 975 822 376, 843 066 779<br/>');
      win.document.write('Email : polycliniquedesapotres1121@gmail.com');
      win.document.write('</div>');
      win.document.write('</body></html>');
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 300);
    }
  };

  // Impression individuelle d'une facture
  const handlePrintInvoice = async (exam: Exam) => {
    try {
      // Appel API pour créer la facture
      await apiClient.post(`/api/exams/${exam.id}/facture`);
      setTimeout(fetchFacturedExams, 400); // Rafraîchir la liste des examens facturés après impression
    } catch (e) {
      // ignore
    }
    const win = window.open('', '', 'width=400,height=800');
    if (win) {
      win.document.write('<html><head><title>Facture examen</title>');
      win.document.write(`
        <style>
          @media print {
            @page {
              margin: 0 !important;
              size: 72mm auto !important;
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body { 
              width: 72mm !important;
              max-width: 72mm !important;
              margin: 0 auto !important;
              padding: 2mm !important;
              font-size: 9px !important;
              color: black !important;
              background: white !important;
              font-family: Arial, sans-serif !important;
              font-weight: normal !important;
              line-height: 1.2 !important;
            }
            .facture { 
              width: 100% !important;
              margin: 0 auto !important;
              padding: 0 !important;
            }
            .facture-header { 
              text-align: center !important; 
              font-size: 11px !important; 
              font-weight: bold !important; 
              margin: 3px 0 !important;
              padding: 2px 0 !important;
            }
            .entete-title {
              text-align: center !important;
              font-size: 10px !important;
              font-weight: bold !important;
              margin: 2px 0 !important;
            }
            .patient-info {
              text-align: center !important;
              font-size: 8px !important;
              margin: 2px 0 !important;
              padding: 1px 0 !important;
            }
            .ticket-item {
              border-top: 0.5px dashed #000 !important;
              border-bottom: 0.5px dashed #000 !important;
              padding: 3px 0 !important;
              margin: 2px 0 !important;
              font-size: 8px !important;
            }
            .ticket-item-line {
              display: flex !important;
              justify-content: space-between !important;
              margin: 1px 0 !important;
              word-wrap: break-word !important;
              overflow-wrap: break-word !important;
            }
            .ticket-item-desc {
              font-weight: bold !important;
              flex: 1 !important;
              text-align: left !important;
            }
            .ticket-item-price {
              text-align: right !important;
              font-weight: bold !important;
              white-space: nowrap !important;
            }
            .total-section {
              margin-top: 3px !important;
              text-align: center !important;
              font-size: 10px !important;
              font-weight: bold !important;
              border-top: 1px solid #000 !important;
              padding-top: 2px !important;
            }
            .footer { 
              font-size: 7px !important;
              text-align: center !important; 
              margin-top: 4px !important; 
              padding-top: 2px !important;
              border-top: 0.5px solid #000 !important;
            }
            .entete-logo { 
              display: none !important;
            }
            hr {
              border: none !important;
              border-top: 0.5px solid #000 !important;
              margin: 2px 0 !important;
            }
          }
          
          body { 
            font-family: Arial, sans-serif; 
            font-size: 9px;
            width: 72mm;
            max-width: 72mm;
            margin: 0 auto;
            padding: 2mm;
            color: black;
            background: white;
          }
          .facture { 
            width: 100%;
            margin: 0 auto;
            padding: 0;
          }
          .facture-header { 
            text-align: center; 
            font-size: 11px; 
            font-weight: bold; 
            margin: 3px 0;
          }
          .entete-title {
            text-align: center;
            font-size: 10px;
            font-weight: bold;
            margin: 2px 0;
          }
          .patient-info {
            text-align: center;
            font-size: 8px;
            margin: 2px 0;
          }
          .facture-table { 
            width: 100%; 
            border-collapse: collapse; 
            font-size: 8px;
            margin: 3px 0;
            table-layout: fixed;
          }
          .facture-table th, .facture-table td { 
            border: 0.5px solid #000; 
            padding: 2px 1px; 
            text-align: center;
            font-size: 8px;
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          .facture-table th {
            font-weight: bold;
          }
          .total-section {
            margin-top: 3px;
            text-align: center;
            font-size: 10px;
            font-weight: bold;
            border-top: 1px solid #000;
            padding-top: 2px;
          }
          .footer { 
            font-size: 7px;
            text-align: center; 
            margin-top: 4px;
            padding-top: 2px;
            border-top: 0.5px solid #000;
          }
          .entete-logo { 
            display: none;
          }
        </style>
      `);
      win.document.write('</head><body>');
      // Entête institutionnelle
      win.document.write('<div class="facture">');
      win.document.write('<div class="entete-title">POLYCLINIQUE DES APOTRES</div>');
      win.document.write('<hr/>');
      win.document.write('<div class="facture-header">FACTURE EXAMEN</div>');
      win.document.write(`<div class="patient-info">${exam.patient.folderNumber}</div>`);
      win.document.write(`<div class="patient-info">${(exam.patient.lastName || '').toUpperCase()} ${exam.patient.firstName || ''}</div>`);
      win.document.write(`<div class="patient-info">${new Date(exam.date).toLocaleDateString('fr-FR')}</div>`);
      win.document.write('<hr/>');
      // Format ticket (sans tableau)
      const examName = exam.examType.name;
      win.document.write('<div class="ticket-item">');
      win.document.write(`<div class="ticket-item-line">
        <div class="ticket-item-desc">${examName}</div>
        <div class="ticket-item-price">${exam.price} $</div>
      </div>`);
      win.document.write('</div>');
      win.document.write('<hr/>');
      win.document.write(`<div class="total-section">TOTAL: ${exam.price} $</div>`);
      win.document.write('<div class="footer">');
      win.document.write('DRCONGO/SK/BKV<br/>');
      win.document.write('Av. BUHOZI/KAJANGU/CIRIRI<br/>');
      win.document.write('Tel: (+243) 975 822 376');
      win.document.write('</div>');
      win.document.write('</div>');
      win.document.write('</body></html>');
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 300);
    }
  };

  // Fonctions de modification
  const handleEdit = (exam: Exam) => {
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
      await apiClient.patch(`/api/exams/${editingExam.id}`, {
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

  const filteredExams = exams.filter(e => {
    const patient = e.patient;
    const searchText = `${patient.folderNumber} ${patient.lastName || ''} ${patient.firstName || ''}`.toLowerCase();
    return searchText.includes(search.toLowerCase());
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Examens</h1>
          <button className="btn-secondary no-print" onClick={handlePrintList}>
            <svg className="h-5 w-5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2V7a2 2 0 012-2h16a2 2 0 012 2v9a2 2 0 01-2 2h-2m-6 0v4m0 0h4m-4 0H8" /></svg>
            Imprimer la liste
          </button>
        </div>
        <button className="btn-primary no-print" onClick={handleOpenForm}>
          + Nouvel examen
        </button>
      </div>
      <input
        type="text"
        className="input-field"
        placeholder="Rechercher un patient (nom ou dossier)"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <p className="text-gray-600 mb-6">Consultez la liste des examens et imprimez les factures.</p>
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
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Examen</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Prix</th>
                  {/* Suppression de la colonne Actions */}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredExams.map((e) => (
                  <tr key={e.id}>
                    <td className="px-4 py-2 font-mono text-sm">
                      {e.patient.folderNumber} - {e.patient.lastName?.toUpperCase() || ''} {e.patient.firstName || ''}
                    </td>
                    <td className="px-4 py-2">{e.examType.name}</td>
                    <td className="px-4 py-2">{new Date(e.date).toLocaleDateString('fr-FR')}</td>
                    <td className="px-4 py-2">{e.price} $</td>
                    {/* Suppression de la colonne Actions */}
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
                  className="input-field"
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
                  className="input-field"
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
                      {et.name} ({et.price} $)
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
                <select
                  name="patientId"
                  value={editForm.patientId}
                  onChange={handleEditChange}
                  className="input-field"
                  required
                >
                  <option value="">Sélectionner un patient</option>
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
                  className="input-field"
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
                  className="input-field"
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

export default ExamsList; 


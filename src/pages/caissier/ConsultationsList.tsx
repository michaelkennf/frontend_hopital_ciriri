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
  price: number;
}

interface Consultation {
  id: number;
  patient: Patient;
  consultationType: ConsultationType;
  date: string;
  price: number;
}

const ConsultationsList: React.FC = () => {
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
  // Ajout d'un état pour la consultation en cours de modification
  const [editingConsultation, setEditingConsultation] = useState<Consultation | null>(null);
  const [editForm, setEditForm] = useState({
    patientId: '',
    consultationTypeId: '',
    date: '',
  });
  // Ajout d'un état pour les consultations facturées (ids)
  const [facturedConsultations, setFacturedConsultations] = useState<number[]>([]);
  const [printingId, setPrintingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [patientSearch, setPatientSearch] = useState('');

  useEffect(() => {
    fetchPatients();
    fetchConsultationTypes();
    fetchConsultations();
    fetchFacturedConsultations();
  }, []);

  const fetchPatients = async () => {
    try {
      const res = await axios.get('/api/patients');
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
    setLoading(true);
    try {
      const res = await axios.get('/api/consultations');
      setConsultations(res.data.consultations || []);
    } catch (e) {
      setConsultations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFacturedConsultations = async () => {
    try {
      console.log('🔍 fetchFacturedConsultations: Début de la récupération...');
      const res = await axios.get('/api/invoices', {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth-token')}` }
      });
      console.log('📊 fetchFacturedConsultations: Réponse API:', res.data);
      
      const consultationsIds: number[] = [];
      for (const invoice of res.data.invoices || []) {
        console.log(`📋 Facture ${invoice.invoiceNumber}:`, invoice.items?.length || 0, 'items');
        for (const item of invoice.items || []) {
          console.log(`  - Item: type=${item.type}, consultationId=${item.consultationId}`);
          if (item.type === 'consultation' && item.consultationId) {
            consultationsIds.push(Number(item.consultationId));
            console.log('✅ Item consultationId ajouté:', item.consultationId);
          }
        }
      }
      console.log('🎯 fetchFacturedConsultations: IDs finaux:', consultationsIds);
      setFacturedConsultations(consultationsIds);
    } catch (e) {
      console.error('❌ Erreur fetchFacturedConsultations:', e);
    }
  };

  const handleOpenForm = () => {
    setForm({ patientId: '', consultationTypeId: '', date: new Date().toISOString().slice(0, 10) });
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
      await axios.post('/api/consultations', {
        patientId: form.patientId,
        consultationTypeId: form.consultationTypeId,
        date: form.date,
      });
      setSuccess('Consultation enregistrée avec succès !');
      setShowForm(false);
      fetchConsultations();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Erreur lors de l’enregistrement de la consultation');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour ouvrir le formulaire de modification
  const handleEdit = (consultation: Consultation) => {
    setEditingConsultation(consultation);
    setEditForm({
      patientId: consultation.patient.id.toString(),
      consultationTypeId: consultation.consultationType.id.toString(),
      date: consultation.date.slice(0, 10),
    });
  };

  // Fonction pour gérer la modification
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConsultation) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await axios.patch(`/api/consultations/${editingConsultation.id}`, {
        patientId: editForm.patientId,
        consultationTypeId: editForm.consultationTypeId,
        date: editForm.date,
      });
      setSuccess('Consultation modifiée avec succès !');
      setEditingConsultation(null);
      fetchConsultations();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Erreur lors de la modification de la consultation');
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
      win.document.write('<html><head><title>Liste des consultations</title>');
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
      win.document.write('<h2 class="print-header" style="color:#15803d;text-align:center;">Liste des consultations</h2>');
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

  // Impression individuelle d'une facture (modifiée)
  const handlePrintFacture = async (consultation: Consultation) => {
    setFacturedConsultations((prev) => [...prev, Number(consultation.id)]);
    try {
      await axios.post(`/api/consultations/${consultation.id}/facture`);
      // Synchronisation conditionnelle après un délai
      setTimeout(async () => {
        try {
          const res = await axios.get('/api/invoices', {
            headers: { Authorization: `Bearer ${localStorage.getItem('auth-token')}` }
          });
          const consultationsIds: number[] = [];
          for (const invoice of res.data.invoices || []) {
            for (const item of invoice.items || []) {
              if (item.type === 'consultation' && item.consultationId) {
                consultationsIds.push(Number(item.consultationId));
              }
            }
          }
          // Ne mettre à jour que si la consultation est bien facturée
          if (consultationsIds.includes(Number(consultation.id))) {
            setFacturedConsultations(consultationsIds);
          }
        } catch (e) {
          console.error('Erreur synchronisation:', e);
        }
      }, 1000);
    } catch (e) {
      setFacturedConsultations((prev) => prev.filter(id => id !== Number(consultation.id)));
    }
    const win = window.open('', '', 'width=350,height=700');
    if (win) {
      win.document.write('<html><head><title>Facture consultation</title>');
      win.document.write(`
        <style>
          @media print {
            @page {
              margin: 15mm !important;
              size: A4 !important;
            }
            body { 
              width: 100% !important; 
              margin: 0 !important; 
              padding: 3mm !important;
              font-size: 11px !important;
              color: black !important;
              background: white !important;
              font-family: Arial, sans-serif !important;
              font-weight: bold !important;
            }
            .facture { 
              width: 90% !important; 
              max-width: none !important;
              margin: 0 auto !important;
              padding: 0 !important;
              font-weight: bold !important;
            }
            .facture-header { 
              text-align: center !important; 
              font-size: 13px !important; 
              font-weight: bold !important; 
              margin-bottom: 8px !important;
              color: black !important;
            }
            .facture-table { 
              width: 100% !important; 
              border-collapse: collapse !important; 
              font-size: 10px !important;
              margin: 8px 0 !important;
              table-layout: fixed !important;
              font-weight: bold !important;
            }
            .facture-table th, .facture-table td { 
              border: 1px solid black !important; 
              padding: 4px 3px !important; 
              text-align: left !important;
              color: black !important;
              word-wrap: break-word !important;
              overflow-wrap: break-word !important;
              font-weight: bold !important;
            }
            .facture-table th {
              background: #f0f0f0 !important;
              font-weight: bold !important;
            }
            .footer { 
              font-size: 9px !important;
              text-align: center !important; 
              margin-top: 12px !important; 
              color: black !important;
              border-top: 1px solid black !important;
              padding-top: 6px !important;
              font-weight: bold !important;
            }
            .entete-logo { 
              height: 30px !important; 
              margin-bottom: 4px !important;
              display: block !important;
              margin-left: auto !important;
              margin-right: auto !important;
            }
            .entete-title { 
              color: black !important; 
              font-weight: bold !important; 
              font-size: 12px !important;
              margin: 4px 0 !important;
            }
            .entete-sub { 
              color: black !important; 
              font-weight: bold !important; 
              font-size: 10px !important;
              margin: 2px 0 !important;
            }
            * {
              font-weight: bold !important;
            }
            p, span, div, td, th, h1, h2, h3, h4, h5, h6 {
              font-weight: bold !important;
            }
            .facture * {
              font-weight: bold !important;
            }
            .patient-info * {
              font-weight: bold !important;
            }
            .total-section * {
              font-weight: bold !important;
            }
            .footer * {
              font-weight: bold !important;
            }
          }
          
          body { 
            font-family: Arial, sans-serif; 
            font-size: 11px; 
            width: 100%; 
            margin: 0; 
            padding: 8px;
            color: black;
            background: white;
            font-weight: bold;
          }
          .facture { 
            width: 90%; 
            max-width: none; 
            margin: 0 auto; 
            padding: 8px;
            font-weight: bold;
          }
          .facture-header { 
            text-align: center; 
            font-size: 13px; 
            font-weight: bold; 
            margin-bottom: 8px;
            color: black;
          }
          .facture-table { 
            width: 100%; 
            border-collapse: collapse; 
            font-size: 10px;
            margin: 8px 0;
            table-layout: fixed;
            font-weight: bold;
          }
          .facture-table th, .facture-table td { 
            border: 1px solid black; 
            padding: 4px 3px; 
            text-align: left;
            color: black;
            word-wrap: break-word;
            overflow-wrap: break-word;
            font-weight: bold;
          }
          .facture-table th {
            background: #f0f0f0;
            font-weight: bold;
          }
          .footer { 
            font-size: 9px;
            text-align: center; 
            margin-top: 12px; 
            color: black;
            border-top: 1px solid black;
            padding-top: 6px;
            font-weight: bold;
          }
          .entete-logo { 
            height: 30px; 
            margin-bottom: 4px;
            display: block;
            margin-left: auto;
            margin-right: auto;
          }
          .entete-title { 
            color: black; 
            font-weight: bold; 
            font-size: 12px;
            margin: 4px 0;
          }
          .entete-sub { 
            color: black; 
            font-weight: bold; 
            font-size: 10px;
            margin: 2px 0;
          }
        </style>
      `);
      win.document.write('</head><body>');
      // Entête institutionnelle
      win.document.write('<div style="text-align:center;">');
      win.document.write('<img src="/logo_polycliniques.jpg" class="entete-logo" alt="Logo" /><br/>');
      win.document.write('<div style="font-size:9px;font-weight:bold;"><strong>REPUBLIQUE DEMOCRATIQUE DU CONGO</strong><br/><strong>PROVINCE DU SUD-KIVU</strong><br/><strong>VILLE DE BUKAVU</strong><br/><strong>ZONE DE SANTE URBAINE DE KADUTU</strong></div>');
      win.document.write('<div class="entete-sub"><strong>FONDATION UMOJA</strong></div>');
      win.document.write('<div style="font-size:10px;font-weight:bold;color:#009900;"><strong>"F.U" asbl</strong></div>');
      win.document.write('<div style="font-size:9px;font-weight:bold;"><strong>DEPARTEMENT DES OEUVRES MEDICALES</strong></div>');
      win.document.write('<div class="entete-title"><strong>POLYCLINIQUE DES APOTRES</strong></div>');
      win.document.write('</div>');
      // Facture
      win.document.write('<div class="facture">');
      win.document.write('<div class="facture-header"><strong>FACTURE CONSULTATION</strong></div>');
      win.document.write('<table class="facture-table"><tbody>');
      win.document.write(`<tr><td><strong>Patient</strong></td><td><strong>${consultation.patient.folderNumber}</strong></td></tr>`);
      win.document.write(`<tr><td><strong>Type</strong></td><td><strong>${consultation.consultationType.name}</strong></td></tr>`);
      win.document.write(`<tr><td><strong>Date</strong></td><td><strong>${new Date(consultation.date).toLocaleDateString('fr-FR')}</strong></td></tr>`);
      win.document.write(`<tr><td><strong>Prix</strong></td><td><strong>${consultation.consultationType.price.toLocaleString()} FC</strong></td></tr>`);
      win.document.write('</tbody></table>');
      win.document.write('</div>');
      // Bas de page institutionnel
      win.document.write('<div class="footer">');
      win.document.write('<strong>Adresse :</strong> DRCONGO/SK/BKV/Av. BUHOZI/KAJANGU/CIRIRI<br/>');
      win.document.write('<strong>Tél :</strong> (+243) 975 822 376, 843 066 779<br/>');
      win.document.write('<strong>Email :</strong> polycliniquedesapotres1121@gmail.com');
      win.document.write('</div>');
      win.document.write('</body></html>');
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 300);
    }
  };

  // Remplacer le tableau par un filtrage sur la recherche
  const filteredConsultations = consultations.filter(c => {
    const patient = c.patient;
    const searchText = `${patient.folderNumber} ${patient.lastName || ''} ${patient.firstName || ''}`.toLowerCase();
    return searchText.includes(search.toLowerCase());
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Consultations</h1>
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
        placeholder="Rechercher un patient (nom ou dossier)"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <p className="text-gray-600 mb-6">Consultez la liste des consultations et imprimez les factures.</p>
      {error && <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4 text-red-700">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4 text-green-700">{success}</div>}
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
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Prix</th>
                  {/* Suppression de la colonne Actions */}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredConsultations.map((c) => {
                  return (
                    <tr key={c.id}>
                      <td className="px-4 py-2 font-mono text-sm">
                        {c.patient.folderNumber} - {c.patient.lastName?.toUpperCase() || ''} {c.patient.firstName || ''}
                      </td>
                      <td className="px-4 py-2">{c.consultationType.name}</td>
                      <td className="px-4 py-2">{new Date(c.date).toLocaleDateString('fr-FR')}</td>
                      <td className="px-4 py-2">{c.consultationType.price.toLocaleString()} FC</td>
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
                      {ct.name} ({ct.price.toLocaleString()} FC)
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
                <label className="block mb-1">Patient</label>
                <select
                  name="patientId"
                  value={editForm.patientId}
                  onChange={handleEditChange}
                  className="input w-full"
                  required
                >
                  <option value="">Sélectionner un patient</option>
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

export default ConsultationsList; 

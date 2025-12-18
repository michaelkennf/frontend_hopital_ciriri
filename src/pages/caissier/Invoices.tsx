import React, { useEffect, useState } from 'react';
import { apiClient } from '../../utils/apiClient';

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  folderNumber: string;
}

interface InvoiceItem {
  id: number;
  description: string;
  amount: number;
  type: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  consultationId?: number;
  examId?: number;
  medicationSaleId?: number;
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  totalAmount: number;
  status: string;
  printed: boolean;
  createdAt: string;
  patient: Patient;
  items: InvoiceItem[];
}

const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [printingId, setPrintingId] = useState<number | null>(null);
  const [printedInSession, setPrintedInSession] = useState<Set<number>>(new Set());
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [editItems, setEditItems] = useState<InvoiceItem[]>([]);
  const [editTotal, setEditTotal] = useState<number>(0);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [patientConsultations, setPatientConsultations] = useState<any[]>([]);
  const [patientExams, setPatientExams] = useState<any[]>([]);
  const [patientSales, setPatientSales] = useState<any[]>([]);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        console.log('🔄 Chargement des patients pour les factures...');
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
        
        setPatients(patientsData);
        console.log('✅ Patients chargés:', patientsData.length);
      } catch (e: any) {
        console.error('❌ Erreur chargement patients:', e);
        setPatients([]);
      }
    };
    fetchPatients();
  }, []);

  const fetchInvoices = async (patientId?: string) => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 Chargement des factures...');
      
      let url = '/api/invoices';
      if (patientId) url += `?patientId=${patientId}`;
      console.log('📋 URL factures:', url);
      
      const res = await apiClient.get(url);
      console.log('📋 Réponse factures complète:', res);
      console.log('📋 Données factures:', res.data);
      
      // Vérifier la structure de la réponse
      let invoicesData = [];
      if (Array.isArray(res.data)) {
        invoicesData = res.data;
      } else if (res.data && Array.isArray(res.data.invoices)) {
        invoicesData = res.data.invoices;
      } else if (res.data && res.data.data && Array.isArray(res.data.data)) {
        invoicesData = res.data.data;
      }
      
      setInvoices(invoicesData);
      console.log('✅ Factures chargées:', invoicesData.length);
    } catch (e: any) {
      console.error('❌ Erreur chargement factures:', e);
      setError(e.message || 'Erreur lors du chargement des factures');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientActs = async (patientId: number) => {
    try {
      const [consultationsRes, examsRes, salesRes] = await Promise.all([
        apiClient.get(`/api/consultations?patientId=${patientId}`),
        apiClient.get(`/api/exams/realized?patientId=${patientId}`),
        apiClient.get(`/api/medications/sales?patientId=${patientId}`),
      ]);
      setPatientConsultations(consultationsRes.data.consultations || []);
      setPatientExams(examsRes.data.exams || []);
      setPatientSales(salesRes.data.sales || []);
    } catch (e) {
      setPatientConsultations([]);
      setPatientExams([]);
      setPatientSales([]);
    }
  };

  useEffect(() => {
    fetchInvoices(selectedPatientId);
  }, [selectedPatientId]);

  const handlePrint = async (invoice: Invoice) => {
    setPrintingId(invoice.id);
    
    try {
      // Logs de débogage
      console.log('🖨️ Impression facture:', invoice);
      console.log('📋 Items de la facture:', invoice.items);
      console.log('💰 Montant total:', invoice.totalAmount);
      console.log('👤 Patient:', invoice.patient);
      
      // Vérifier si la facture a des items
      if (!invoice.items || invoice.items.length === 0) {
        console.error('❌ Facture sans items - impossible d\'imprimer');
        alert('Cette facture n\'a pas d\'éléments à imprimer.');
        return;
      }
      
      // Générer le HTML de la facture optimisé pour l'impression
      const win = window.open('', '', 'width=400,height=800');
      if (!win) {
        console.error('❌ Impossible d\'ouvrir la fenêtre d\'impression');
        alert('Impossible d\'ouvrir la fenêtre d\'impression. Vérifiez que les popups ne sont pas bloqués.');
        return;
      }
      
      console.log('✅ Fenêtre d\'impression ouverte');
      
      win.document.write('<html><head><title>Facture</title>');
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
            .ticket-item-details {
              font-size: 7px !important;
              color: #333 !important;
              margin-top: 1px !important;
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
          .ticket-item {
            border-top: 0.5px dashed #000;
            border-bottom: 0.5px dashed #000;
            padding: 3px 0;
            margin: 2px 0;
            font-size: 8px;
          }
          .ticket-item-line {
            display: flex;
            justify-content: space-between;
            margin: 1px 0;
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          .ticket-item-desc {
            font-weight: bold;
            flex: 1;
            text-align: left;
          }
          .ticket-item-details {
            font-size: 7px;
            color: #333;
            margin-top: 1px;
          }
          .ticket-item-price {
            text-align: right;
            font-weight: bold;
            white-space: nowrap;
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
      win.document.write('<div class="facture-header">FACTURE</div>');
      win.document.write(`<div class="patient-info">N°: ${invoice.invoiceNumber}</div>`);
      win.document.write(`<div class="patient-info">${invoice.patient.folderNumber}</div>`);
      win.document.write(`<div class="patient-info">${invoice.patient.lastName.toUpperCase()} ${invoice.patient.firstName}</div>`);
      win.document.write(`<div class="patient-info">${new Date(invoice.createdAt).toLocaleDateString('fr-FR')} ${new Date(invoice.createdAt).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}</div>`);
      win.document.write('<hr/>');
      
      // Items en format ticket (sans tableau)
      invoice.items.forEach((item, index) => {
        console.log(`📝 Item ${index}:`, item);
        const desc = item.description || 'N/A';
        const qty = item.quantity || 0;
        const pu = item.unitPrice || 0;
        const total = item.totalPrice || 0;
        const currency = item.type === 'consultation' ? 'FC' : '$';
        
        win.document.write('<div class="ticket-item">');
        // Ligne principale : Description
        win.document.write(`<div class="ticket-item-line">
          <div class="ticket-item-desc">${desc}</div>
        </div>`);
        // Détails : Quantité et Prix unitaire
        win.document.write(`<div class="ticket-item-details">
          Qte: ${qty} x ${pu}${currency}
        </div>`);
        // Prix total aligné à droite
        win.document.write(`<div class="ticket-item-line">
          <div></div>
          <div class="ticket-item-price">${total}${currency}</div>
        </div>`);
        win.document.write('</div>');
      });
      
      win.document.write('<hr/>');
      
      // Total
      win.document.write(`<div class="total-section">TOTAL: ${formatInvoiceAmount(invoice)}</div>`);
      
      // Bas de page institutionnel
      win.document.write('<div class="footer">');
      win.document.write('DRCONGO/SK/BKV<br/>');
      win.document.write('Av. BUHOZI/KAJANGU/CIRIRI<br/>');
      win.document.write('Tel: (+243) 975 822 376<br/>');
      win.document.write('843 066 779');
      win.document.write('</div>');
      win.document.write('</div>');
      
      win.document.write('</body></html>');
      win.document.close();
      win.focus();
      
      console.log('✅ HTML généré, lancement de l\'impression...');
      setTimeout(() => {
        win.print();
        console.log('✅ Impression lancée');
      }, 500);
      
      // Marquer la facture comme imprimée côté backend et dans la session
      console.log('🔄 Marquage de la facture comme imprimée...');
      const printResponse = await apiClient.patch(`/api/invoices/${invoice.id}/print`);
      console.log('✅ Facture marquée comme imprimée côté backend');
      console.log('📊 Réponse backend:', printResponse.data);
      
      if (printResponse.data.statusChanged) {
        console.log(`✅ Statut changé de "pending" à "${printResponse.data.newStatus}"`);
      }
      
      // Ajouter à l'état local pour masquer immédiatement le bouton
      setPrintedInSession(prev => new Set(prev).add(invoice.id));
      console.log('✅ Facture ajoutée à l\'état de session');
      
      // Rafraîchir la liste
      await fetchInvoices(selectedPatientId);
      console.log('✅ Liste des factures rafraîchie');
      
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'impression:', error);
      alert(`Erreur lors de l'impression: ${error.message || 'Erreur inconnue'}`);
    } finally {
      setPrintingId(null);
    }
  };

  const handleEdit = (invoice: Invoice) => {
    setEditInvoice(invoice);
    setEditItems(invoice.items.map(item => ({ ...item })));
    setEditTotal(invoice.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0));
    setEditError(null);
    fetchPatientActs(invoice.patient.id);
  };

  const handleEditItemChange = (idx: number, field: string, value: any) => {
    setEditItems(items => items.map((item, i) => i === idx ? { ...item, [field]: value, totalPrice: field === 'quantity' || field === 'unitPrice' ? value * (field === 'quantity' ? item.unitPrice : item.quantity) : item.totalPrice } : item));
    setEditTotal(editItems.reduce((sum, item, i) => sum + (i === idx ? (field === 'quantity' || field === 'unitPrice' ? value * (field === 'quantity' ? item.unitPrice : item.quantity) : item.totalPrice) : item.totalPrice), 0));
  };

  const handleEditSave = async () => {
    setEditLoading(true);
    setEditError(null);
    try {
      await apiClient.patch(`/api/invoices/${editInvoice!.id}`, {
        items: editItems.map(({ id, ...rest }) => rest),
        totalAmount: editTotal
      });
      setEditInvoice(null);
      setEditItems([]);
      setEditTotal(0);
      fetchInvoices(selectedPatientId);
    } catch (e: any) {
      setEditError(e.response?.data?.error || 'Erreur lors de la modification de la facture');
    } finally {
      setEditLoading(false);
    }
  };

  // Filtrage et séparation des factures (à placer avant le return)
  // Fonction pour calculer le montant par devise
  const calculateInvoiceAmountByCurrency = (invoice: Invoice) => {
    let consultationAmountFC = 0;
    let otherAmountUSD = 0;

    invoice.items.forEach(item => {
      if (item.type === 'consultation') {
        consultationAmountFC += item.totalPrice;
      } else {
        otherAmountUSD += item.totalPrice;
      }
    });

    return { consultationAmountFC, otherAmountUSD };
  };

  // Fonction pour formater l'affichage du montant
  const formatInvoiceAmount = (invoice: Invoice) => {
    const { consultationAmountFC, otherAmountUSD } = calculateInvoiceAmountByCurrency(invoice);
    
    if (consultationAmountFC > 0 && otherAmountUSD > 0) {
      return `${consultationAmountFC.toFixed(2)} FC + ${otherAmountUSD.toFixed(2)} $`;
    } else if (consultationAmountFC > 0) {
      return `${consultationAmountFC.toFixed(2)} FC`;
    } else if (otherAmountUSD > 0) {
      return `${otherAmountUSD.toFixed(2)} $`;
    } else {
      return '0.00 $';
    }
  };

  // Fonction pour formater le prix d'un item selon son type
  const formatItemPrice = (item: InvoiceItem) => {
    if (item.type === 'consultation') {
      return `${item.totalPrice} FC`;
    } else {
      return `${item.totalPrice} $`;
    }
  };

  // Fonction pour formater le prix unitaire d'un item selon son type
  const formatItemUnitPrice = (item: InvoiceItem) => {
    if (item.type === 'consultation') {
      return `${item.unitPrice} FC`;
    } else {
      return `${item.unitPrice} $`;
    }
  };

  // Fonction pour calculer et formater le total d'édition
  const formatEditTotal = () => {
    let consultationAmountFC = 0;
    let otherAmountUSD = 0;

    editItems.forEach(item => {
      if (item.type === 'consultation') {
        consultationAmountFC += item.totalPrice;
      } else {
        otherAmountUSD += item.totalPrice;
      }
    });

    if (consultationAmountFC > 0 && otherAmountUSD > 0) {
      return `${consultationAmountFC.toFixed(2)} FC + ${otherAmountUSD.toFixed(2)} $`;
    } else if (consultationAmountFC > 0) {
      return `${consultationAmountFC.toFixed(2)} FC`;
    } else if (otherAmountUSD > 0) {
      return `${otherAmountUSD.toFixed(2)} $`;
    } else {
      return '0.00 $';
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const text = `${inv.invoiceNumber} ${inv.patient.folderNumber} ${inv.patient.lastName} ${inv.patient.firstName}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });
  const unprintedInvoices = filteredInvoices.filter(inv => !inv.printed);
  const printedInvoices = filteredInvoices.filter(inv => inv.printed);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Factures</h1>
      <p className="text-gray-600 mb-6">Imprimez les factures pour les consultations, médicaments et examens.</p>
      <div className="flex flex-col sm:flex-row gap-2 mb-4 items-center">
        <label htmlFor="patient-select" className="font-medium">Filtrer par patient :</label>
        <select
          id="patient-select"
          className="input-field"
          value={selectedPatientId}
          onChange={e => setSelectedPatientId(e.target.value)}
        >
          <option value="">Tous les patients</option>
          {Array.isArray(patients) && patients.map(p => (
            <option key={p.id} value={p.id}>
              {p.folderNumber} - {p.lastName.toUpperCase()} {p.firstName}
            </option>
          ))}
        </select>
        <input
          type="text"
          className="input-field"
          placeholder="Rechercher une facture (numéro, nom, dossier...)"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ minWidth: 200 }}
        />
      </div>
      {loading ? (
        <div className="text-center">Chargement...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded shadow">
            <thead>
              <tr>
                <th className="px-4 py-2">N°</th>
                <th className="px-4 py-2">Patient</th>
                <th className="px-4 py-2">Dossier</th>
                <th className="px-4 py-2">Montant</th>
                <th className="px-4 py-2">Statut</th>
                <th className="px-4 py-2">Imprimée</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-500">
                  {invoices.length === 0 ? 'Aucune facture trouvée' : 'Aucune facture correspondant à votre recherche'}
                </td></tr>
              ) : (
                <>
                  {unprintedInvoices.length > 0 && (
                    <tr className="bg-yellow-50">
                      <td colSpan={7} className="px-4 py-2 font-bold text-yellow-800 text-lg">Factures non imprimées</td>
                    </tr>
                  )}
                  {unprintedInvoices.map((inv) => (
                    <React.Fragment key={inv.id}>
                      <tr className="border-t">
                        <td className="px-4 py-2 font-mono">{inv.invoiceNumber}</td>
                        <td className="px-4 py-2">{inv.patient.firstName} {inv.patient.lastName}</td>
                        <td className="px-4 py-2">{inv.patient.folderNumber}</td>
                        <td className="px-4 py-2">{formatInvoiceAmount(inv)}</td>
                        <td className="px-4 py-2">
                          <span className={
                            inv.status === 'pending' ? 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded' :
                            inv.status === 'paid' ? 'bg-green-100 text-green-800 px-2 py-1 rounded' :
                            'bg-gray-100 text-gray-800 px-2 py-1 rounded'
                          }>
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-center">
                          {inv.printed ? <span className="text-green-600 font-bold">Oui</span> : <span className="text-gray-400">Non</span>}
                        </td>
                        <td className="px-4 py-2 space-x-2">
                          {!inv.printed && !printedInSession.has(inv.id) && (
                            <>
                              <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded" title="Modifier" onClick={() => handleEdit(inv)}>
                                Modifier
                              </button>
                              <button className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded" title="Imprimer" onClick={() => handlePrint(inv)} disabled={printingId === inv.id}>
                                {printingId === inv.id ? 'Impression...' : 'Imprimer'}
                              </button>
                            </>
                          )}
                          {(inv.printed || printedInSession.has(inv.id)) && (
                            <span className="text-green-600 font-bold text-sm">
                              ✅ Facture imprimée
                            </span>
                          )}
                        </td>
                      </tr>
                      {/* Détail de tous les items de la facture */}
                      <tr className="bg-gray-50">
                        <td colSpan={7} className="px-4 py-2">
                          <div className="font-semibold text-blue-700 mb-1">Détails de la facture :</div>
                          <table className="w-full text-sm mb-2">
                            <thead>
                              <tr>
                                <th className="text-left">Type</th>
                                <th className="text-left">Description</th>
                                <th className="text-left">Quantité</th>
                                <th className="text-left">Prix unitaire</th>
                                <th className="text-left">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {inv.items.map(item => (
                                <tr key={item.id}>
                                  <td>{item.type}</td>
                                  <td>{item.description}</td>
                                  <td>{item.quantity}</td>
                                  <td>{formatItemUnitPrice(item)}</td>
                                  <td>{formatItemPrice(item)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}
                  {printedInvoices.length > 0 && (
                    <tr className="bg-gray-100">
                      <td colSpan={7} className="px-4 py-2 font-bold text-gray-700 text-lg">Factures imprimées</td>
                    </tr>
                  )}
                  {printedInvoices.map((inv) => (
                    <React.Fragment key={inv.id}>
                      <tr className="border-t">
                        <td className="px-4 py-2 font-mono">{inv.invoiceNumber}</td>
                        <td className="px-4 py-2">{inv.patient.firstName} {inv.patient.lastName}</td>
                        <td className="px-4 py-2">{inv.patient.folderNumber}</td>
                        <td className="px-4 py-2">{formatInvoiceAmount(inv)}</td>
                        <td className="px-4 py-2">
                          <span className={
                            inv.status === 'pending' ? 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded' :
                            inv.status === 'paid' ? 'bg-green-100 text-green-800 px-2 py-1 rounded' :
                            'bg-gray-100 text-gray-800 px-2 py-1 rounded'
                          }>
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-center">
                          {inv.printed ? <span className="text-green-600 font-bold">Oui</span> : <span className="text-gray-400">Non</span>}
                        </td>
                        <td className="px-4 py-2 space-x-2">
                          {!inv.printed && !printedInSession.has(inv.id) && (
                            <>
                              <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded" title="Modifier" onClick={() => handleEdit(inv)}>
                                Modifier
                              </button>
                              <button className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded" title="Imprimer" onClick={() => handlePrint(inv)} disabled={printingId === inv.id}>
                                {printingId === inv.id ? 'Impression...' : 'Imprimer'}
                              </button>
                            </>
                          )}
                          {(inv.printed || printedInSession.has(inv.id)) && (
                            <span className="text-green-600 font-bold text-sm">
                              ✅ Facture imprimée
                            </span>
                          )}
                        </td>
                      </tr>
                      {/* Détail de tous les items de la facture */}
                      <tr className="bg-gray-50">
                        <td colSpan={7} className="px-4 py-2">
                          <div className="font-semibold text-blue-700 mb-1">Détails de la facture :</div>
                          <table className="w-full text-sm mb-2">
                            <thead>
                              <tr>
                                <th className="text-left">Type</th>
                                <th className="text-left">Description</th>
                                <th className="text-left">Quantité</th>
                                <th className="text-left">Prix unitaire</th>
                                <th className="text-left">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {inv.items.map(item => (
                                <tr key={item.id}>
                                  <td>{item.type}</td>
                                  <td>{item.description}</td>
                                  <td>{item.quantity}</td>
                                  <td>{formatItemUnitPrice(item)}</td>
                                  <td>{formatItemPrice(item)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      )}
      {/* Modal d'édition de facture */}
      {editInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">Modifier la facture {editInvoice.invoiceNumber}</h2>
            {editError && <div className="bg-red-100 text-red-700 p-2 mb-2 rounded">{editError}</div>}
            <table className="w-full mb-4">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Type</th>
                  <th>Quantité</th>
                  <th>Prix unitaire</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {editItems.map((item, idx) => (
                  <tr key={item.id}>
                    <td>
                      {/* Sélecteur d'acte selon le type */}
                      {item.type === 'consultation' && (
                        <select
                          className="input-field"
                          value={item.consultationId || ''}
                          onChange={e => {
                            const selected = patientConsultations.find(c => c.id === Number(e.target.value));
                            if (selected) {
                              handleEditItemChange(idx, 'consultationId', selected.id);
                              handleEditItemChange(idx, 'description', selected.consultationType.name);
                              handleEditItemChange(idx, 'quantity', 1);
                              handleEditItemChange(idx, 'unitPrice', selected.consultationType.price);
                              handleEditItemChange(idx, 'totalPrice', selected.consultationType.price);
                            }
                          }}
                        >
                          <option value="">Sélectionner une consultation</option>
                          {patientConsultations.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.consultationType.name} - {new Date(c.date).toLocaleDateString('fr-FR')} ({c.consultationType.price} FC)
                            </option>
                          ))}
                        </select>
                      )}
                      {item.type === 'exam' && (
                        <select
                          className="input-field"
                          value={item.examId || ''}
                          onChange={e => {
                            const selected = patientExams.find(ex => ex.id === Number(e.target.value));
                            if (selected) {
                              handleEditItemChange(idx, 'examId', selected.id);
                              handleEditItemChange(idx, 'description', selected.examType.name);
                              handleEditItemChange(idx, 'quantity', 1);
                              handleEditItemChange(idx, 'unitPrice', selected.examType.price);
                              handleEditItemChange(idx, 'totalPrice', selected.examType.price);
                            }
                          }}
                        >
                          <option value="">Sélectionner un examen</option>
                          {patientExams.map(ex => (
                            <option key={ex.id} value={ex.id}>
                              {ex.examType.name} - {new Date(ex.date).toLocaleDateString('fr-FR')} ({ex.examType.price} $)
                            </option>
                          ))}
                        </select>
                      )}
                      {item.type === 'medication' && (
                        <select
                          className="input-field"
                          value={item.medicationSaleId || ''}
                          onChange={e => {
                            const selected = patientSales.find(s => s.id === Number(e.target.value));
                            if (selected) {
                              handleEditItemChange(idx, 'medicationSaleId', selected.id);
                              handleEditItemChange(idx, 'description', selected.medication.name);
                              handleEditItemChange(idx, 'quantity', selected.quantity);
                              handleEditItemChange(idx, 'unitPrice', selected.medication.price);
                              handleEditItemChange(idx, 'totalPrice', selected.medication.price * selected.quantity);
                            }
                          }}
                        >
                          <option value="">Sélectionner une vente</option>
                          {patientSales.map(s => (
                            <option key={s.id} value={s.id}>
                              {s.medication.name} x{s.quantity} - {new Date(s.date).toLocaleDateString('fr-FR')} ({s.medication.price * s.quantity} $)
                            </option>
                          ))}
                        </select>
                      )}
                      {/* Sinon, champ texte classique */}
                      {item.type !== 'consultation' && item.type !== 'exam' && item.type !== 'medication' && (
                        <input className="input-field" value={item.description} onChange={e => handleEditItemChange(idx, 'description', e.target.value)} />
                      )}
                    </td>
                    <td><input className="input-field" value={item.type} onChange={e => handleEditItemChange(idx, 'type', e.target.value)} /></td>
                    <td><input className="input-field" type="number" min="1" value={item.quantity} onChange={e => handleEditItemChange(idx, 'quantity', Number(e.target.value))} /></td>
                    <td><input className="input-field" type="number" min="0" value={item.unitPrice} onChange={e => handleEditItemChange(idx, 'unitPrice', Number(e.target.value))} /></td>
                    <td>{item.totalPrice} $</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold">Total : {formatEditTotal()}</span>
              <button className="btn-secondary" onClick={() => setEditInvoice(null)}>Annuler</button>
            </div>
            <button className="btn-primary" onClick={handleEditSave} disabled={editLoading}>{editLoading ? 'Enregistrement...' : 'Enregistrer'}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices; 

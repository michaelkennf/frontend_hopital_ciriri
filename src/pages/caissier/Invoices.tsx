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
  currency?: string; // Devise: 'FC' ou '$'
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
  const [success, setSuccess] = useState<string | null>(null);
  const [printingId, setPrintingId] = useState<number | null>(null);
  const [printedInSession, setPrintedInSession] = useState<Set<number>>(new Set());
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [editItems, setEditItems] = useState<InvoiceItem[]>([]);
  const [editTotal, setEditTotal] = useState<number>(0);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  // État pour gérer les valeurs d'input avec virgule (format d'affichage)
  const [priceInputs, setPriceInputs] = useState<{ [key: number]: string }>({});
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
    // Vérifier si la facture est annulée
    if (invoice.status === 'cancelled') {
      setError('Impossible d\'imprimer une facture annulée.');
      return;
    }
    
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
              font-size: 12px !important;
              color: black !important;
              background: white !important;
              font-family: Arial, sans-serif !important;
              font-weight: bold !important;
              line-height: 1.2 !important;
            }
            .facture { 
              width: 100% !important;
              margin: 0 auto !important;
              padding: 0 !important;
            }
            .facture-header { 
              text-align: center !important; 
              font-size: 14px !important; 
              font-weight: bold !important; 
              margin: 3px 0 !important;
              padding: 2px 0 !important;
            }
            .entete-title {
              text-align: center !important;
              font-size: 13px !important;
              font-weight: bold !important;
              margin: 2px 0 !important;
            }
            .patient-info {
              text-align: center !important;
              font-size: 11px !important;
              font-weight: bold !important;
              margin: 2px 0 !important;
              padding: 1px 0 !important;
            }
            .ticket-item {
              border-top: 0.5px dashed #000 !important;
              border-bottom: 0.5px dashed #000 !important;
              padding: 3px 0 !important;
              margin: 2px 0 !important;
              font-size: 18px !important;
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
              font-size: 18px !important;
            }
            .ticket-item-details {
              font-size: 16px !important;
              color: #333 !important;
              margin-top: 1px !important;
              font-weight: bold !important;
            }
            .ticket-item-price {
              text-align: left !important;
              font-weight: bold !important;
              white-space: nowrap !important;
              font-size: 18px !important;
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
            font-size: 12px;
            font-weight: bold;
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
            font-size: 18px;
            font-weight: bold;
          }
          .ticket-item-line {
            display: flex;
            justify-content: space-between;
            margin: 1px 0;
            word-wrap: break-word;
            overflow-wrap: break-word;
            font-weight: bold;
          }
          .ticket-item-desc {
            font-weight: bold;
            flex: 1;
            text-align: left;
            font-size: 18px;
          }
          .ticket-item-details {
            font-size: 16px;
            font-weight: bold;
            color: #333;
            margin-top: 1px;
          }
          .ticket-item-price {
            text-align: left;
            font-weight: bold;
            white-space: nowrap;
            font-size: 18px;
          }
          .total-section {
            margin-top: 3px;
            text-align: center;
            font-size: 13px;
            font-weight: bold;
            border-top: 1px solid #000;
            padding-top: 2px;
          }
          .footer { 
            font-size: 10px;
            font-weight: bold;
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
        const desc = item.description || item.itemName || 'N/A';
        const qty = item.quantity || 0;
        const pu = item.unitPrice || 0;
        const total = item.totalPrice || 0;
        // Extraire la devise du type (peut être "type:currency" ou juste "type")
        const currency = extractCurrencyFromType(item.type || '');
        const baseType = extractBaseType(item.type || '');
        
        win.document.write('<div class="ticket-item">');
        // Ligne principale : Description
        win.document.write(`<div class="ticket-item-line">
          <div class="ticket-item-desc">${desc}</div>
        </div>`);
        // Détails : Quantité et Prix unitaire
        // Pour l'hospitalisation, afficher clairement "X jour(s) x prix/jour"
        if (baseType === 'hospitalization') {
          win.document.write(`<div class="ticket-item-details">
            ${qty} jour(s) x ${pu.toFixed(2)}${currency}/jour
          </div>`);
        } else {
          win.document.write(`<div class="ticket-item-details">
            Qte: ${qty} x ${pu.toFixed(2)}${currency}
          </div>`);
        }
        // Prix total aligné à gauche
        win.document.write(`<div class="ticket-item-line">
          <div class="ticket-item-price">${total.toFixed(2)}${currency}</div>
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

  const handleCancel = async (invoice: Invoice) => {
    if (!confirm(`Êtes-vous sûr de vouloir annuler la facture ${invoice.invoiceNumber} ?`)) {
      return;
    }

    setCancellingId(invoice.id);
    setError(null);
    setSuccess(null);
    try {
      console.log('🔄 Annulation de la facture:', invoice.id);
      const response = await apiClient.patch(`/api/invoices/${invoice.id}/cancel`);
      console.log('✅ Réponse annulation complète:', response);
      console.log('✅ Données de réponse:', response.data);
      
      // Vérifier la réponse - la réponse peut être directement dans response.data ou response.data.data
      const responseData = response.data?.data || response.data;
      
      if (responseData && (responseData.success === true || responseData.status === 'cancelled')) {
        const successMessage = responseData.message || 'Facture annulée avec succès !';
        setSuccess(successMessage);
        console.log('✅ Message de succès:', successMessage);
        
        // Rafraîchir la liste des factures (ne pas bloquer sur une erreur de rafraîchissement)
        try {
          await fetchInvoices(selectedPatientId);
        } catch (refreshError) {
          console.warn('⚠️ Erreur lors du rafraîchissement, mais annulation réussie:', refreshError);
          // Mettre à jour manuellement le statut dans la liste locale
          setInvoices(prevInvoices => 
            prevInvoices.map(inv => 
              inv.id === invoice.id ? { ...inv, status: 'cancelled' } : inv
            )
          );
        }
        
        // Effacer le message de succès après 3 secondes
        setTimeout(() => setSuccess(null), 3000);
      } else {
        // Si la réponse n'indique pas un succès clair, vérifier s'il y a une erreur
        const errorMsg = responseData?.error || 'Réponse inattendue du serveur';
        console.error('❌ Réponse inattendue:', responseData);
        throw new Error(errorMsg);
      }
    } catch (e: any) {
      console.error('❌ Erreur annulation complète:', e);
      console.error('❌ Détails erreur:', {
        message: e.message,
        response: e.response,
        responseData: e.response?.data
      });
      
      const errorMessage = e.response?.data?.error || e.message || 'Erreur lors de l\'annulation de la facture';
      setError(errorMessage);
      console.error('❌ Message d\'erreur affiché:', errorMessage);
      
      // Effacer le message d'erreur après 5 secondes
      setTimeout(() => setError(null), 5000);
    } finally {
      setCancellingId(null);
    }
  };

  const handleEdit = (invoice: Invoice) => {
    // Vérifier si la facture est annulée
    if (invoice.status === 'cancelled') {
      setError('Impossible de modifier une facture annulée.');
      return;
    }
    setEditInvoice(invoice);
    // Initialiser les items avec la devise basée sur le type
    // Extraire la devise du type si elle est stockée comme "type:currency"
    const initializedItems = invoice.items.map(item => {
      const typeParts = (item.type || '').split(':');
      const baseType = typeParts[0] || item.type || '';
      const currency = typeParts[1] || (baseType === 'consultation' ? 'FC' : '$');
      return { 
        ...item, 
        type: baseType, // Stocker seulement le type de base
        currency: currency // Stocker la devise séparément
      };
    });
    setEditItems(initializedItems);
    
    // Initialiser les valeurs d'input avec virgule pour chaque item
    const initialPriceInputs: { [key: number]: string } = {};
    initializedItems.forEach((item, idx) => {
      // Toujours initialiser, même si unitPrice est 0, null ou undefined
      const price = item.unitPrice || 0;
      initialPriceInputs[idx] = price.toFixed(2).replace('.', ',');
    });
    setPriceInputs(initialPriceInputs);
    
    setEditTotal(invoice.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0));
    setEditError(null);
    fetchPatientActs(invoice.patient.id);
  };

  const handleEditItemChange = (idx: number, field: string, value: any) => {
    setEditItems(items => {
      const newItems = items.map((item, i) => {
        if (i === idx) {
          const updatedItem = { ...item, [field]: value };
          // Recalculer le total si prix unitaire change (quantité = 1 par défaut)
          if (field === 'unitPrice') {
            const price = Number(value) || 0;
            updatedItem.totalPrice = price; // Quantité = 1
            updatedItem.quantity = 1; // S'assurer que la quantité est 1
          } else if (field === 'totalPrice') {
            // Si on modifie directement le totalPrice, mettre à jour aussi unitPrice
            const total = Number(value) || 0;
            updatedItem.totalPrice = total;
            updatedItem.unitPrice = total; // Pour les factures, prix unitaire = total (quantité = 1)
            updatedItem.quantity = 1;
          }
          return updatedItem;
        }
        return item;
      });
      // Recalculer le total global
      const newTotal = newItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
      setEditTotal(newTotal);
      return newItems;
    });
  };

  const handleEditSave = async () => {
    setEditLoading(true);
    setEditError(null);
    try {
      // Préparer les items avec la devise stockée dans le type si nécessaire
      const itemsToSave = editItems.map(({ id, currency, ...rest }) => {
        // Stocker la devise dans le type si elle diffère de la logique par défaut
        // ou utiliser le type original avec la devise
        const itemType = rest.type || '';
        return {
          ...rest,
          // S'assurer que les valeurs numériques sont bien des nombres
          unitPrice: parseFloat(String(rest.unitPrice || 0)),
          totalPrice: parseFloat(String(rest.totalPrice || 0)),
          quantity: parseInt(String(rest.quantity || 1), 10),
          // Stocker la devise dans le type pour le backend (format: "type:currency" ou juste "type")
          type: currency && currency !== (itemType === 'consultation' ? 'FC' : '$') 
            ? `${itemType}:${currency}` 
            : itemType
        };
      });
      
      await apiClient.patch(`/api/invoices/${editInvoice!.id}`, {
        items: itemsToSave,
        totalAmount: editTotal
      });
      setEditInvoice(null);
      setEditItems([]);
      setEditTotal(0);
      setPriceInputs({}); // Réinitialiser les inputs de prix
      fetchInvoices(selectedPatientId);
    } catch (e: any) {
      setEditError(e.response?.data?.error || 'Erreur lors de la modification de la facture');
    } finally {
      setEditLoading(false);
    }
  };

  // Fonction utilitaire pour extraire la devise d'un type d'item
  // Le type peut être au format "type" ou "type:currency"
  const extractCurrencyFromType = (itemType: string): string => {
    if (!itemType) return '$';
    const typeParts = itemType.split(':');
    if (typeParts.length > 1) {
      // Format "type:currency" - retourner la devise
      return typeParts[1];
    }
    // Format simple "type" - retourner la devise par défaut selon le type
    return typeParts[0] === 'consultation' ? 'FC' : '$';
  };

  // Fonction utilitaire pour extraire le type de base (sans la devise)
  const extractBaseType = (itemType: string): string => {
    if (!itemType) return '';
    const typeParts = itemType.split(':');
    return typeParts[0] || itemType;
  };

  // Filtrage et séparation des factures (à placer avant le return)
  // Fonction pour calculer le montant par devise
  const calculateInvoiceAmountByCurrency = (invoice: Invoice) => {
    let consultationAmountFC = 0;
    let otherAmountUSD = 0;

    invoice.items.forEach(item => {
      const currency = extractCurrencyFromType(item.type || '');
      if (currency === 'FC') {
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
    const currency = extractCurrencyFromType(item.type || '');
    return `${item.totalPrice} ${currency}`;
  };

  // Fonction pour formater le prix unitaire d'un item selon son type
  const formatItemUnitPrice = (item: InvoiceItem) => {
    const currency = extractCurrencyFromType(item.type || '');
    return `${item.unitPrice} ${currency}`;
  };

  // Fonction pour calculer et formater le total d'édition
  const formatEditTotal = () => {
    let amountFC = 0;
    let amountUSD = 0;

    editItems.forEach(item => {
      const currency = item.currency || (item.type === 'consultation' ? 'FC' : '$');
      if (currency === 'FC') {
        amountFC += item.totalPrice || 0;
      } else {
        amountUSD += item.totalPrice || 0;
      }
    });

    if (amountFC > 0 && amountUSD > 0) {
      return `${amountFC.toFixed(2)} FC + ${amountUSD.toFixed(2)} $`;
    } else if (amountFC > 0) {
      return `${amountFC.toFixed(2)} FC`;
    } else if (amountUSD > 0) {
      return `${amountUSD.toFixed(2)} $`;
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
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4 text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4 text-green-700">
          {success}
        </div>
      )}
      {loading ? (
        <div className="text-center">Chargement...</div>
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
                            inv.status === 'cancelled' ? 'bg-red-100 text-red-800 px-2 py-1 rounded' :
                            'bg-gray-100 text-gray-800 px-2 py-1 rounded'
                          }>
                            {inv.status === 'cancelled' ? 'Annulée' : inv.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-center">
                          {inv.printed ? <span className="text-green-600 font-bold">Oui</span> : <span className="text-gray-400">Non</span>}
                        </td>
                        <td className="px-4 py-2 space-x-2">
                          {inv.status === 'cancelled' ? (
                            <span className="text-red-600 font-bold text-sm">
                              ❌ Facture annulée
                            </span>
                          ) : !inv.printed && !printedInSession.has(inv.id) ? (
                            <>
                              <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded" title="Modifier" onClick={() => handleEdit(inv)}>
                                Modifier
                              </button>
                              <button className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded" title="Imprimer" onClick={() => handlePrint(inv)} disabled={printingId === inv.id}>
                                {printingId === inv.id ? 'Impression...' : 'Imprimer'}
                              </button>
                              <button 
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded" 
                                title="Annuler" 
                                onClick={() => handleCancel(inv)} 
                                disabled={cancellingId === inv.id}
                              >
                                {cancellingId === inv.id ? 'Annulation...' : 'Annuler'}
                              </button>
                            </>
                          ) : (
                            <span className="text-green-600 font-bold text-sm">
                              ✅ Facture imprimée
                            </span>
                          )}
                        </td>
                      </tr>
                      {/* Détail de tous les items de la facture */}
                      <tr className={inv.status === 'cancelled' ? 'bg-red-50' : 'bg-gray-50'}>
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
                            inv.status === 'cancelled' ? 'bg-red-100 text-red-800 px-2 py-1 rounded' :
                            'bg-gray-100 text-gray-800 px-2 py-1 rounded'
                          }>
                            {inv.status === 'cancelled' ? 'Annulée' : inv.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-center">
                          {inv.printed ? <span className="text-green-600 font-bold">Oui</span> : <span className="text-gray-400">Non</span>}
                        </td>
                        <td className="px-4 py-2 space-x-2">
                          {inv.status === 'cancelled' ? (
                            <span className="text-red-600 font-bold text-sm">
                              ❌ Facture annulée
                            </span>
                          ) : !inv.printed && !printedInSession.has(inv.id) ? (
                            <>
                              <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded" title="Modifier" onClick={() => handleEdit(inv)}>
                                Modifier
                              </button>
                              <button className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded" title="Imprimer" onClick={() => handlePrint(inv)} disabled={printingId === inv.id}>
                                {printingId === inv.id ? 'Impression...' : 'Imprimer'}
                              </button>
                              <button 
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded" 
                                title="Annuler" 
                                onClick={() => handleCancel(inv)} 
                                disabled={cancellingId === inv.id}
                              >
                                {cancellingId === inv.id ? 'Annulation...' : 'Annuler'}
                              </button>
                            </>
                          ) : (
                            <span className="text-green-600 font-bold text-sm">
                              ✅ Facture imprimée
                            </span>
                          )}
                        </td>
                      </tr>
                      {/* Détail de tous les items de la facture */}
                      <tr className={inv.status === 'cancelled' ? 'bg-red-50' : 'bg-gray-50'}>
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
            <table className="w-full mb-4 border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border px-3 py-2 text-left">Article</th>
                  <th className="border px-3 py-2 text-left">Type</th>
                  <th className="border px-3 py-2 text-left">Prix</th>
                  <th className="border px-3 py-2 text-left">Devise</th>
                </tr>
              </thead>
              <tbody>
                {editItems.map((item, idx) => {
                  const currentCurrency = item.currency || (item.type === 'consultation' ? 'FC' : '$');
                  const totalPrice = (item.totalPrice || item.unitPrice || 0);
                  const displayTotalPrice = totalPrice.toFixed(2).replace('.', ',');
                  // Formater le prix unitaire pour l'affichage dans le champ (avec virgule)
                  // Utiliser la valeur de priceInputs si disponible, sinon formater depuis unitPrice
                  const unitPriceDisplay = priceInputs[idx] !== undefined 
                    ? priceInputs[idx]
                    : (item.unitPrice 
                        ? item.unitPrice.toFixed(2).replace('.', ',')
                        : '');
                  return (
                    <tr key={item.id} className="border-b">
                      <td className="border px-3 py-2">
                        <div className="font-medium">{item.description || item.itemName || 'Article'}</div>
                        <div className="text-sm text-gray-600 font-semibold">{displayTotalPrice} {currentCurrency}</div>
                      </td>
                      <td className="border px-3 py-2">
                        <input 
                          className="input-field w-full" 
                          value={item.type || ''} 
                          onChange={e => handleEditItemChange(idx, 'type', e.target.value)} 
                          placeholder="Type"
                        />
                      </td>
                      <td className="border px-3 py-2">
                        <input 
                          className="input-field w-full" 
                          type="text"
                          inputMode="decimal"
                          value={priceInputs[idx] !== undefined ? priceInputs[idx] : unitPriceDisplay} 
                          onChange={e => {
                            let inputValue = e.target.value;
                            
                            // Supprimer les espaces
                            inputValue = inputValue.trim();
                            
                            // Remplacer tous les points par des virgules pour l'affichage
                            inputValue = inputValue.replace(/\./g, ',');
                            
                            // Supprimer les virgules multiples (garder seulement la première)
                            const commaIndex = inputValue.indexOf(',');
                            if (commaIndex !== -1) {
                              inputValue = inputValue.substring(0, commaIndex + 1) + inputValue.substring(commaIndex + 1).replace(/,/g, '');
                            }
                            
                            // Supprimer tout ce qui n'est pas un chiffre ou une virgule
                            inputValue = inputValue.replace(/[^\d,]/g, '');
                            
                            // Vérifier le format : nombres avec virgule comme séparateur décimal
                            // Format accepté : "" ou "123" ou "123,45" ou "123," ou ",45" ou "0,5"
                            const isValidFormat = inputValue === '' || 
                              /^\d+$/.test(inputValue) || // Entier: "123"
                              /^\d+,\d*$/.test(inputValue) || // Avec virgule: "123,45" ou "123,"
                              /^,\d+$/.test(inputValue); // Commence par virgule: ",45"
                            
                            if (isValidFormat) {
                              // Mettre à jour l'état d'affichage (avec virgule)
                              setPriceInputs(prev => ({
                                ...prev,
                                [idx]: inputValue
                              }));
                              
                              // Convertir en nombre pour le calcul (remplacer virgule par point)
                              let numericValue = 0;
                              if (inputValue !== '' && inputValue !== ',') {
                                // Normaliser: remplacer virgule par point pour parseFloat
                                let normalizedValue = inputValue.replace(',', '.');
                                
                                // Si la valeur se termine par une virgule (ex: "123,"), ajouter "0"
                                if (inputValue.endsWith(',')) {
                                  normalizedValue = normalizedValue + '0';
                                }
                                
                                numericValue = parseFloat(normalizedValue);
                                
                                // Si parseFloat échoue, essayer de récupérer la partie entière
                                if (isNaN(numericValue)) {
                                  const intPart = inputValue.split(',')[0];
                                  numericValue = intPart ? parseFloat(intPart) : 0;
                                }
                              }
                              
                              // Mettre à jour la valeur numérique dans l'item (même si 0)
                              if (!isNaN(numericValue) && numericValue >= 0) {
                                handleEditItemChange(idx, 'unitPrice', numericValue);
                              }
                            }
                          }}
                          onBlur={() => {
                            // Au blur, formater avec 2 décimales si nécessaire
                            const currentValue = priceInputs[idx];
                            if (currentValue !== undefined && currentValue !== '') {
                              const numValue = parseFloat(currentValue.replace(',', '.'));
                              if (!isNaN(numValue)) {
                                const formatted = numValue.toFixed(2).replace('.', ',');
                                setPriceInputs(prev => ({
                                  ...prev,
                                  [idx]: formatted
                                }));
                              }
                            }
                          }}
                          placeholder="0,00"
                        />
                      </td>
                      <td className="border px-3 py-2">
                        <select 
                          className="input-field w-full" 
                          value={currentCurrency}
                          onChange={e => handleEditItemChange(idx, 'currency', e.target.value)}
                        >
                          <option value="FC">FC</option>
                          <option value="$">$</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold">Total : {formatEditTotal()}</span>
              <button className="btn-secondary" onClick={() => {
                setEditInvoice(null);
                setEditItems([]);
                setEditTotal(0);
                setPriceInputs({}); // Réinitialiser les inputs de prix
              }}>Annuler</button>
            </div>
            <button className="btn-primary" onClick={handleEditSave} disabled={editLoading}>{editLoading ? 'Enregistrement...' : 'Enregistrer'}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices; 

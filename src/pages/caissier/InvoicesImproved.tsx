// Version améliorée de la page factures avec gestion robuste des erreurs
import React, { useEffect, useState } from 'react';
import { fetchInvoices, fetchInvoiceDetails, updateInvoice, diagnoseInvoiceIssues } from '../../utils/invoiceUtils';

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

const InvoicesImproved: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [printingId, setPrintingId] = useState<number | null>(null);
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
  const [diagnostics, setDiagnostics] = useState<any>(null);

  // Fonction améliorée pour charger les factures
  const loadInvoices = async (patientId?: string) => {
    console.log('[INVOICES IMPROVED] Chargement des factures...');
    setLoading(true);
    setError(null);

    try {
      // Diagnostic en cas de problème
      if (process.env.NODE_ENV === 'development') {
        const diag = await diagnoseInvoiceIssues();
        setDiagnostics(diag);
        console.log('[INVOICES IMPROVED] Diagnostic:', diag);
      }

      const result = await fetchInvoices(patientId);
      
      if (result.success) {
        console.log(`[INVOICES IMPROVED] ${result.invoices.length} factures chargées`);
        setInvoices(result.invoices);
        setError(null);
      } else {
        console.error('[INVOICES IMPROVED] Erreur:', result.error);
        setError(result.error);
        setInvoices([]);
        
        // Gestion spécifique des erreurs
        if (result.requiresAuth) {
          // Rediriger vers la page de connexion
          window.location.href = '/login';
          return;
        }
      }
    } catch (err: any) {
      console.error('[INVOICES IMPROVED] Erreur inattendue:', err);
      setError('Erreur inattendue lors du chargement des factures');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  // Charger les factures au montage du composant
  useEffect(() => {
    loadInvoices(selectedPatientId);
  }, [selectedPatientId]);

  // Charger les patients pour le filtre
  useEffect(() => {
    const loadPatients = async () => {
      try {
        const token = localStorage.getItem('token');
        const baseURL = import.meta.env.VITE_API_URL || 
          (import.meta.env.PROD ? 'https://polycliniquedesapotres-backend.onrender.com' : 'http://localhost:5000');
        
        const response = await fetch(`${baseURL}/api/patients`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setPatients(data.patients || []);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des patients:', error);
      }
    };

    loadPatients();
  }, []);

  // Fonction pour éditer une facture
  const handleEditInvoice = async (invoice: Invoice) => {
    console.log('[INVOICES IMPROVED] Édition de la facture:', invoice.id);
    setEditInvoice(invoice);
    setEditItems([...invoice.items]);
    setEditTotal(invoice.totalAmount);
    setEditError(null);

    // Charger les données du patient pour l'édition
    try {
      const token = localStorage.getItem('token');
      const baseURL = import.meta.env.VITE_API_URL || 
        (import.meta.env.PROD ? 'https://polycliniquedesapotres-backend.onrender.com' : 'http://localhost:5000');

      // Charger les consultations
      const consultationsResponse = await fetch(`${baseURL}/api/consultations?patientId=${invoice.patient.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (consultationsResponse.ok) {
        const consultationsData = await consultationsResponse.json();
        setPatientConsultations(consultationsData.consultations || []);
      }

      // Charger les examens
      const examsResponse = await fetch(`${baseURL}/api/exams?patientId=${invoice.patient.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (examsResponse.ok) {
        const examsData = await examsResponse.json();
        setPatientExams(examsData.exams || []);
      }

      // Charger les ventes de médicaments
      const salesResponse = await fetch(`${baseURL}/api/medications/sales?patientId=${invoice.patient.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (salesResponse.ok) {
        const salesData = await salesResponse.json();
        setPatientSales(salesData.sales || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données pour l\'édition:', error);
    }
  };

  // Fonction pour sauvegarder les modifications
  const handleSaveEdit = async () => {
    if (!editInvoice) return;

    setEditLoading(true);
    setEditError(null);

    try {
      const result = await updateInvoice(editInvoice.id, {
        items: editItems,
        totalAmount: editTotal
      });

      if (result.success) {
        console.log('[INVOICES IMPROVED] Facture mise à jour avec succès');
        setEditInvoice(null);
        setEditItems([]);
        setEditTotal(0);
        // Recharger les factures
        await loadInvoices(selectedPatientId);
      } else {
        setEditError(result.error);
      }
    } catch (error: any) {
      console.error('[INVOICES IMPROVED] Erreur lors de la sauvegarde:', error);
      setEditError(error.message || 'Erreur lors de la sauvegarde');
    } finally {
      setEditLoading(false);
    }
  };

  // Filtrer les factures selon la recherche
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = !search || 
      invoice.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      `${invoice.patient.firstName} ${invoice.patient.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      invoice.patient.folderNumber.toLowerCase().includes(search.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Gestion des Factures</h1>

      {/* Diagnostic en mode développement */}
      {diagnostics && process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 rounded">
          <h3 className="font-bold">Diagnostic (Mode Développement)</h3>
          <pre className="text-xs mt-2">{JSON.stringify(diagnostics, null, 2)}</pre>
        </div>
      )}

      {/* Filtres */}
      <div className="mb-6 flex gap-4">
        <select
          value={selectedPatientId}
          onChange={(e) => setSelectedPatientId(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">Tous les patients</option>
          {patients.map(patient => (
            <option key={patient.id} value={patient.id.toString()}>
              {patient.firstName} {patient.lastName} ({patient.folderNumber})
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Rechercher par numéro de facture, nom ou dossier..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
        />

        <button
          onClick={() => loadInvoices(selectedPatientId)}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Actualiser
        </button>
      </div>

      {/* Messages d'erreur */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Erreur :</strong> {error}
          <button
            onClick={() => loadInvoices(selectedPatientId)}
            className="ml-4 px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Liste des factures */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2">Chargement des factures...</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucune facture trouvée
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredInvoices.map((invoice) => (
                <li key={invoice.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900">
                          Facture #{invoice.invoiceNumber}
                        </p>
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                          invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {invoice.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {invoice.patient.firstName} {invoice.patient.lastName} ({invoice.patient.folderNumber})
                      </p>
                      <p className="text-sm text-gray-500">
                        Montant: {invoice.totalAmount.toLocaleString()} FCFA
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditInvoice(invoice)}
                        className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                      >
                        Éditer
                      </button>
                      <button
                        onClick={() => {/* Logique d'impression */}}
                        className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                        disabled={printingId === invoice.id}
                      >
                        {printingId === invoice.id ? 'Impression...' : 'Imprimer'}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Modal d'édition */}
      {editInvoice && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Éditer la facture #{editInvoice.invoiceNumber}
              </h3>
              
              {editError && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {editError}
                </div>
              )}

              {/* Contenu de l'édition */}
              <div className="space-y-4">
                <p><strong>Patient:</strong> {editInvoice.patient.firstName} {editInvoice.patient.lastName}</p>
                <p><strong>Dossier:</strong> {editInvoice.patient.folderNumber}</p>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Articles de la facture
                  </label>
                  <div className="space-y-2">
                    {editItems.map((item, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => {
                            const newItems = [...editItems];
                            newItems[index].description = e.target.value;
                            setEditItems(newItems);
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                        />
                        <input
                          type="number"
                          value={item.amount}
                          onChange={(e) => {
                            const newItems = [...editItems];
                            newItems[index].amount = parseFloat(e.target.value) || 0;
                            setEditItems(newItems);
                            setEditTotal(newItems.reduce((sum, item) => sum + item.amount, 0));
                          }}
                          className="w-24 px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium">
                    Total: {editTotal.toLocaleString()} FCFA
                  </span>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setEditInvoice(null);
                    setEditItems([]);
                    setEditTotal(0);
                    setEditError(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={editLoading}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  {editLoading ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicesImproved;

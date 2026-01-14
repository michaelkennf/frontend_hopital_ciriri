import React, { useState, useEffect } from 'react';
import { apiClient } from '../../utils/apiClient';

// Configuration API avec authentification

// Les intercepteurs sont maintenant gérés par apiClient

// Les intercepteurs sont maintenant gérés par apiClient

interface Medication {
  id: number;
  name: string;
  unit: string;
  price?: number;
  purchasePrice?: number; // Prix d'achat pour les demandes d'approvisionnement
  quantity: number;
}

interface SupplyRequestItem {
  designation: string;
  quantityAvailable: number;
  quantityRequested: number;
  unitPrice: number;
  totalPrice: number;
  observation: string;
}

interface SupplyRequest {
  id: number;
  requestNumber: string;
  date: string;
  status: string;
  items: SupplyRequestItem[];
  totalAmount: number;
  requestedBy: string;
  approvedBy?: string;
  approvalDate?: string;
}

const SupplyRequests: React.FC = () => {
  const [requests, setRequests] = useState<SupplyRequest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Fonction pour formater la date correctement
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Date invalide';
      }
      return date.toLocaleDateString('fr-FR');
    } catch (error) {
      return 'Date invalide';
    }
  };
  
  // État du formulaire
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    items: Array(26).fill(null).map(() => ({
      designation: '',
      quantityAvailable: 0,
      quantityRequested: 0,
      unitPrice: 0,
      totalPrice: 0,
      observation: ''
    }))
  });

  // Ajout de l'état pour l'édition et la suppression
  const [editRequest, setEditRequest] = useState<SupplyRequest | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{id: number, open: boolean}>({id: 0, open: false});
  const [medications, setMedications] = useState<Medication[]>([]);
  const [showAddMedication, setShowAddMedication] = useState(false);
  const [newMedication, setNewMedication] = useState({ 
    name: '', 
    unit: '', 
    price: '',
    purchasePrice: '' // Ajout du champ prix d'achat
  });
  const [selectedMedications, setSelectedMedications] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    // Vérifier l'authentification
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Vous devez être connecté pour accéder à cette page. Veuillez vous connecter.');
      return;
    }

    fetchRequests();
    fetchMedications();
    setError(null);
    setSuccess(null);
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await apiClient.get('/api/supply-requests');
      setRequests(response.data.requests || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des demandes:', error);
    }
  };

  const fetchMedications = async () => {
    try {
      const response = await apiClient.get('/api/medications');
      console.log('=== DONNÉES MÉDICAMENTS API ===');
      console.log('Réponse complète:', response.data);
      console.log('Médicaments reçus:', response.data.medications);
      setMedications(response.data.medications || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des médicaments:', error);
    }
  };

  const handleItemChange = (index: number, field: keyof SupplyRequestItem, value: string | number) => {
    console.log('=== HANDLE ITEM CHANGE ===');
    console.log('Index:', index, 'Field:', field, 'Value:', value, 'Type:', typeof value);
    
    const newItems = [...formData.items];
    
    // Ne pas permettre la modification de quantityAvailable (rempli automatiquement)
    if (field === 'quantityAvailable') {
      console.log('Tentative de modification de quantityAvailable ignorée (champ en lecture seule)');
      return;
    }
    
    const oldValue = newItems[index][field];
    newItems[index] = { ...newItems[index], [field]: value };
    
    console.log('Ancienne valeur:', oldValue, 'Nouvelle valeur:', newItems[index][field]);
    
    // Calculer automatiquement le prix total (P.T) = P.U × Quantité demandée
    if (field === 'quantityRequested' || field === 'unitPrice') {
      const quantity = field === 'quantityRequested' ? Number(value) : newItems[index].quantityRequested;
      const unitPrice = field === 'unitPrice' ? Number(value) : newItems[index].unitPrice;
      newItems[index].totalPrice = quantity * unitPrice;
      console.log(`Calcul P.T: ${quantity} × ${unitPrice} = ${newItems[index].totalPrice}`);
    }
    
    console.log('Nouvel item complet:', newItems[index]);
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotal = () => {
    return formData.items.reduce((total, item) => total + item.totalPrice, 0);
  };

  const handleMedicationSelect = (index: number, medicationName: string) => {
    console.log('=== SÉLECTION MÉDICAMENT ===');
    console.log('Index:', index, 'Médicament:', medicationName);
    console.log('Liste des médicaments:', medications);
    
    // Mettre à jour l'état de sélection
    setSelectedMedications(prev => ({
      ...prev,
      [index]: medicationName
    }));
    
    if (medicationName === 'autre') {
      setShowAddMedication(true);
    } else if (medicationName) {
      const medication = medications.find(m => m.name === medicationName);
      console.log('Médicament trouvé:', medication);
      
      if (medication) {
        console.log('=== MISE À JOUR DES CHAMPS ===');
        // Mettre à jour tous les champs en une seule fois pour éviter les problèmes de synchronisation
        const newItems = [...formData.items];
        newItems[index] = {
          ...newItems[index],
          designation: medication.name,
          quantityAvailable: medication.quantity || 0,
          unitPrice: medication.purchasePrice || medication.price || 0,
          // Réinitialiser la quantité demandée et le total pour permettre une nouvelle saisie
          quantityRequested: newItems[index].quantityRequested || 0,
          totalPrice: 0 // Sera recalculé quand la quantité demandée sera saisie
        };
        
        // Recalculer le total si une quantité demandée existe déjà
        if (newItems[index].quantityRequested > 0) {
          newItems[index].totalPrice = newItems[index].quantityRequested * newItems[index].unitPrice;
        }
        
        setFormData({ ...formData, items: newItems });
      } else {
        // Si le médicament n'est pas trouvé, utiliser directement la valeur sélectionnée
        console.log('Médicament non trouvé, utilisation directe:', medicationName);
        handleItemChange(index, 'designation', medicationName);
      }
    } else {
      // Si aucune sélection, réinitialiser tous les champs
      console.log('Vidage de tous les champs pour index:', index);
      const newItems = [...formData.items];
      newItems[index] = {
        designation: '',
        quantityAvailable: 0,
        quantityRequested: 0,
        unitPrice: 0,
        totalPrice: 0,
        observation: newItems[index].observation // Conserver l'observation
      };
      setFormData({ ...formData, items: newItems });
    }
  };

  const handleAddMedication = async () => {
    try {
      const response = await apiClient.post('/api/medications', {
        name: newMedication.name,
        quantity: 0,
        minQuantity: 0,
        unit: newMedication.unit,
        purchasePrice: newMedication.purchasePrice ? parseFloat(newMedication.purchasePrice) : 0,
        sellingPrice: newMedication.price ? parseFloat(newMedication.price) : 0
      });
      
      // Ajouter le nouveau médicament à la liste
      const newMed = {
        id: response.data.medication.id,
        name: response.data.medication.name,
        unit: response.data.medication.unit,
        quantity: response.data.medication.quantity || 0,
        purchasePrice: response.data.medication.purchasePrice || 0,
        price: response.data.medication.sellingPrice || 0
      };
      setMedications([...medications, newMed]);
      setShowAddMedication(false);
      setNewMedication({ name: '', unit: '', price: '', purchasePrice: '' });
      
      // Trouver l'index de l'item actuel et mettre à jour avec le nouveau médicament
      const currentItemIndex = formData.items.findIndex((item, idx) => 
        selectedMedications[idx] === 'autre' && item.designation === ''
      );
      if (currentItemIndex !== -1) {
        // Mettre à jour la sélection et remplir automatiquement les champs
        setSelectedMedications(prev => ({
          ...prev,
          [currentItemIndex]: newMed.name
        }));
        const newItems = [...formData.items];
        newItems[currentItemIndex] = {
          ...newItems[currentItemIndex],
          designation: newMed.name,
          quantityAvailable: 0,
          unitPrice: newMed.purchasePrice || 0
        };
        setFormData({ ...formData, items: newItems });
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout du médicament:', error);
    }
  };

  // Fonction pour ouvrir le formulaire en mode édition
  const handleEdit = (request: SupplyRequest) => {
    setEditRequest(request);
    setFormData({
      date: request.date.slice(0, 10),
      items: request.items.map(item => ({ ...item }))
    });
    setShowForm(true);
  };

  // Fonction pour supprimer une demande
  const handleDelete = async (id: number) => {
    // Vérification locale avant suppression
    const exists = requests.some(r => r.id === id);
    if (!exists) {
      setSuccess("La demande a déjà été supprimée.");
      setRequests(requests.filter(r => r.id !== id));
      setShowDeleteConfirm({id: 0, open: false});
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await apiClient.delete(`/api/supply-requests/${id}`);
      setSuccess('Demande supprimée avec succès !');
      setRequests(requests.filter(r => r.id !== id));
    } catch (error: any) {
      if (error.response?.status === 404) {
        setSuccess("La demande a déjà été supprimée.");
        setRequests(requests.filter(r => r.id !== id));
      } else {
        setError(error.response?.data?.error || 'Erreur lors de la suppression');
      }
    } finally {
      setLoading(false);
      setShowDeleteConfirm({id: 0, open: false});
    }
  };

  // Adapter handleSubmit pour différencier ajout/édition
  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().slice(0, 10),
      items: Array(26).fill(null).map(() => ({
        designation: '',
        quantityAvailable: 0,
        quantityRequested: 0,
        unitPrice: 0,
        totalPrice: 0,
        observation: ''
      }))
    });
    setSelectedMedications({});
    setEditRequest(null);
    setShowForm(false);
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Vérification manuelle de l'authentification avant soumission
    const token = localStorage.getItem('token');
    console.log('🔐 Vérification manuelle du token dans handleSubmit:');
    console.log('🔐 Token présent:', token ? 'OUI' : 'NON');
    console.log('🔐 Longueur du token:', token?.length);
    console.log('🔐 Début du token:', token?.substring(0, 20) + '...');

    if (!token) {
      setError('Token d\'authentification manquant. Veuillez vous reconnecter.');
      setLoading(false);
      return;
    }

    try {
      console.log('=== DÉBUT SOUMISSION FORMULAIRE ===');
      console.log('Event:', e);
      console.log('FormData:', formData);
      console.log('SelectedMedications:', selectedMedications);
      console.log('Sélections non vides:', Object.entries(selectedMedications).filter(([key, value]) => value && value.trim() !== ''));
      
      // Vérifier les items avec la désignation sélectionnée
      const validItems = formData.items.filter((item, index) => {
        const designation = selectedMedications[index] || item.designation;
        const hasDesignation = designation && designation.trim() !== '';
        const hasQuantity = item.quantityRequested > 0;
        console.log(`Item ${index}: designation="${designation}", quantity=${item.quantityRequested}, valid=${hasDesignation && hasQuantity}`);
        return hasDesignation && hasQuantity;
      });
      console.log('Items valides:', validItems);
      
      // Vérifier s'il y a au moins une désignation sélectionnée
      const hasAnySelection = Object.values(selectedMedications).some(value => value && value.trim() !== '');
      console.log('Aucune sélection trouvée:', !hasAnySelection);
      
      if (validItems.length === 0) {
        if (!hasAnySelection) {
          setError('Veuillez sélectionner au moins un médicament');
        } else {
          setError('Veuillez ajouter au moins un médicament avec une quantité demandée');
        }
        setLoading(false);
        return;
      }
      
      // Si on arrive ici, il n'y a pas d'erreur, on peut nettoyer
      setError(null);
      
      const requestData = {
        date: formData.date,
        items: validItems.map((item, index) => ({
          designation: selectedMedications[index] || item.designation,
          quantityAvailable: Number(item.quantityAvailable),
          quantityRequested: Number(item.quantityRequested),
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
          observation: item.observation || ''
        })),
        totalAmount: calculateTotal()
      };
      console.log('Données à envoyer:', requestData);
      
      if (editRequest) {
        console.log('Mode édition - PATCH');
        const response = await apiClient.patch(`/api/supply-requests/${editRequest.id}`, requestData);
        console.log('Réponse PATCH:', response.data);
        setSuccess('Demande modifiée avec succès !');
      } else {
        console.log('Mode création - POST');
        const response = await apiClient.post('/api/supply-requests', requestData);
        console.log('Réponse POST:', response.data);
        setSuccess('Demande d\'approvisionnement créée avec succès !');
      }
      
      setShowForm(false);
      setEditRequest(null);
      setFormData({
        date: new Date().toISOString().slice(0, 10),
        items: Array(26).fill(null).map(() => ({
          designation: '',
          quantityAvailable: 0,
          quantityRequested: 0,
          unitPrice: 0,
          totalPrice: 0,
          observation: ''
        }))
      });
      fetchRequests();
    } catch (error: any) {
      console.error('Erreur lors de la soumission:', error);
      
      if (error.response?.status === 401) {
        setError('Erreur d\'authentification. Veuillez vous reconnecter.');
      } else if (error.response?.status === 400) {
        setError(error.response.data.error || 'Données invalides. Veuillez vérifier les informations saisies.');
      } else if (error.response?.status === 500) {
        setError('Erreur serveur. Veuillez réessayer plus tard.');
      } else {
        setError(error.response?.data?.error || 'Erreur lors de la soumission de la demande.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: number) => {
    try {
      await apiClient.patch(`/api/supply-requests/${requestId}/approve`);
      setSuccess('Demande approuvée avec succès !');
      fetchRequests();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Erreur lors de l\'approbation');
    }
  };

  const printAuthorization = (request: SupplyRequest) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Autorisation d'approvisionnement</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { width: 80px; margin-bottom: 8px; }
          .institution { font-size: 13px; color: #333; font-weight: bold; }
          .clinic-name { color: #17803d; font-size: 20px; font-weight: bold; margin-bottom: 8px; }
          .divider { border-top: 2px solid #17803d; margin: 10px 0 20px 0; }
          .title { font-size: 16px; font-weight: bold; margin: 20px 0; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
          th { background-color: #f2f2f2; font-weight: bold; }
          .total { font-weight: bold; }
          .signatures { margin-top: 40px; }
          .signature-line { border-bottom: 1px solid #000; display: inline-block; width: 200px; margin: 0 10px; }
          .footer { margin-top: 40px; font-size: 12px; text-align: center; color: #555; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="/logo_polycliniques.jpg" class="logo" alt="Logo" />
          <div class="institution">REPUBLIQUE DEMOCRATIQUE DU CONGO</div>
          <div class="institution">PROVINCE DU SUD-KIVU</div>
          <div class="institution">VILLE DE BUKAVU</div>
          <div class="institution">ZONE DE SANTE URBAINE DE KADUTU</div>
          <div class="clinic-name">POLYCLINIQUE DES APOTRES</div>
          <div class="divider"></div>
          <div class="title">AUTORISATION D'APPROVISIONNEMENT N° ${request.requestNumber}</div>
          <div>Date: ${formatDate(request.date)}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>N°</th>
              <th>Désignation</th>
              <th>Quantité Disponib</th>
              <th>Quantité Demand</th>
              <th>P.U en USD</th>
              <th>P.T en USD</th>
              <th>Observation</th>
            </tr>
          </thead>
          <tbody>
            ${request.items.map((item, index) => `
              <tr>
                <td>${String(index + 1).padStart(2, '0')}</td>
                <td>${item.designation}</td>
                <td>${item.quantityAvailable}</td>
                <td>${item.quantityRequested}</td>
                <td>${(item.unitPrice || 0).toFixed(2)}</td>
                <td>${(item.totalPrice || 0).toFixed(2)}</td>
                <td>${item.observation || ''}</td>
              </tr>
            `).join('')}
            <tr class="total">
              <td colspan="5">Total général</td>
              <td>${(request.totalAmount || 0).toFixed(2)}</td>
              <td></td>
            </tr>
          </tbody>
        </table>

        <div class="signatures">
          <div>PP <span class="signature-line"></span></div>
          <div>Responsable de la structure : <span class="signature-line"></span></div>
        </div>

        <div class="footer">
          <div><strong>Adresse:</strong> DRCONGO/SK/SKV/Av. BUHOZI/KAJANGU/CIRIRI</div>
          <div><strong>Tél:</strong> (+243) 975 822 376, 843 066 779</div>
          <div><strong>Email:</strong> polycliniquedesapotres1121@gmail.com</div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Demandes d'approvisionnement</h1>
        <button 
          className="btn-primary" 
          onClick={() => {
            setError(null);
            setSuccess(null);
            resetForm();
            setShowForm(true);
          }}
        >
          + Nouvelle demande
        </button>
      </div>

      {showForm && error && <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4 text-red-700">{error}</div>}
      {showForm && success && <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4 text-green-700">{success}</div>}

      {/* Formulaire de saisie */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Nouvelle demande d'approvisionnement</h2>
              <button 
                onClick={() => {
                  setError(null);
                  setSuccess(null);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} method="POST">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border px-3 py-3 text-sm font-medium">N°</th>
                      <th className="border px-3 py-3 text-sm font-medium">Désignation</th>
                      <th className="border px-3 py-3 text-sm font-medium">Quantité Disponib</th>
                      <th className="border px-3 py-3 text-sm font-medium">Quantité Demand</th>
                      <th className="border px-3 py-3 text-sm font-medium">P.U en USD</th>
                      <th className="border px-3 py-3 text-sm font-medium">P.T en USD</th>
                      <th className="border px-3 py-3 text-sm font-medium">Observation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, index) => (
                      <tr key={index}>
                        <td className="border px-3 py-2 text-sm text-center font-medium">{String(index + 1).padStart(2, '0')}</td>
                                                 <td className="border px-3 py-2">
                          <select
                            value={selectedMedications[index] || item.designation || ""}
                            onChange={(e) => {
                              console.log('Select onChange:', e.target.value);
                              handleMedicationSelect(index, e.target.value);
                            }}
                            className="w-full text-sm border-0 focus:ring-0 px-2 py-1"
                          >
                            <option value="">Sélectionner un médicament</option>
                            {medications.map((med) => (
                              <option key={med.id} value={med.name}>
                                {med.name}
                              </option>
                            ))}
                            <option value="autre">+ Autre médicament</option>
                          </select>
                        </td>
                         <td className="border px-3 py-2">
                           <input
                             type="number"
                             value={item.quantityAvailable}
                             readOnly
                             className="w-full text-sm border-0 focus:ring-0 px-2 py-1 bg-gray-50"
                             min="0"
                           />
                         </td>
                         <td className="border px-3 py-2">
                           <input
                             type="number"
                             value={item.quantityRequested}
                             onChange={(e) => handleItemChange(index, 'quantityRequested', Number(e.target.value))}
                             className="w-full text-sm border-0 focus:ring-0 px-2 py-1"
                             min="0"
                           />
                         </td>
                         <td className="border px-3 py-2">
                           <input
                             type="number"
                             value={item.unitPrice}
                             onChange={(e) => handleItemChange(index, 'unitPrice', Number(e.target.value))}
                             className="w-full text-sm border-0 focus:ring-0 px-2 py-1"
                             min="0"
                             step="0.01"
                           />
                         </td>
                         <td className="border px-3 py-2 text-sm font-medium">
                           {(item.totalPrice || 0).toFixed(2)}
                         </td>
                         <td className="border px-3 py-2">
                           <input
                             type="text"
                             value={item.observation}
                             onChange={(e) => handleItemChange(index, 'observation', e.target.value)}
                             className="w-full text-sm border-0 focus:ring-0 px-2 py-1"
                             placeholder="Remarques"
                           />
                         </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-bold">
                      <td colSpan={5} className="border px-3 py-3 text-sm">Total général</td>
                      <td className="border px-3 py-3 text-sm">{(calculateTotal() || 0).toFixed(2)}</td>
                      <td className="border px-3 py-3"></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setSuccess(null);
                    resetForm();
                  }}
                  className="btn-secondary"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                  onClick={() => console.log('Bouton Enregistrer cliqué directement')}
                >
                  {loading ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Liste des demandes */}
      <div className="space-y-4">
        {requests.map((request) => (
          <div key={request.id} className="card">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold">Demande N° {request.requestNumber}</h3>
                <p className="text-gray-600">Date: {formatDate(request.date)}</p>
                <p className="text-gray-600">Statut: 
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${
                    request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    request.status === 'approved' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {request.status === 'pending' ? 'En attente' :
                     request.status === 'approved' ? 'Approuvée' : 'Rejetée'}
                  </span>
                </p>
              </div>
              <div className="flex gap-2">
                {request.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleEdit(request)}
                      className="btn-secondary text-sm"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm({id: request.id, open: true})}
                      className="btn-danger text-sm"
                    >
                      Supprimer
                    </button>
                  </>
                )}
                {request.status === 'approved' && (
                  <button
                    onClick={() => printAuthorization(request)}
                    className="btn-secondary text-sm"
                  >
                    Imprimer autorisation
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border px-3 py-3 text-sm font-medium">N°</th>
                    <th className="border px-3 py-3 text-sm font-medium">Désignation</th>
                    <th className="border px-3 py-3 text-sm font-medium">Quantité Disponib</th>
                    <th className="border px-3 py-3 text-sm font-medium">Quantité Demand</th>
                    <th className="border px-3 py-3 text-sm font-medium">P.U en USD</th>
                    <th className="border px-3 py-3 text-sm font-medium">P.T en USD</th>
                    <th className="border px-3 py-3 text-sm font-medium">Observation</th>
                  </tr>
                </thead>
                <tbody>
                  {request.items.map((item, index) => (
                    <tr key={index}>
                      <td className="border px-3 py-2 text-sm text-center font-medium">{String(index + 1).padStart(2, '0')}</td>
                      <td className="border px-3 py-2 text-sm">{item.designation}</td>
                      <td className="border px-3 py-2 text-sm">{item.quantityAvailable}</td>
                      <td className="border px-3 py-2 text-sm">{item.quantityRequested}</td>
                      <td className="border px-3 py-2 text-sm">{(item.unitPrice || 0).toFixed(2)}</td>
                      <td className="border px-3 py-2 text-sm">{(item.totalPrice || 0).toFixed(2)}</td>
                      <td className="border px-3 py-2 text-sm">{item.observation}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-bold">
                    <td colSpan={5} className="border px-3 py-3 text-sm">Total général</td>
                    <td className="border px-3 py-3 text-sm">{(request.totalAmount || 0).toFixed(2)}</td>
                    <td className="border px-3 py-3"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de confirmation de suppression */}
      {showDeleteConfirm.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h2 className="text-lg font-bold mb-4">Confirmer la suppression</h2>
            <p className="mb-4">Voulez-vous vraiment supprimer cette demande d'approvisionnement ?</p>
            <div className="flex justify-end gap-2">
              <button
                className="btn-secondary"
                onClick={() => setShowDeleteConfirm({id: 0, open: false})}
              >
                Annuler
              </button>
              <button
                className="btn-danger"
                onClick={() => handleDelete(showDeleteConfirm.id)}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal pour ajouter un nouveau médicament */}
      {showAddMedication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-bold mb-4">Ajouter un nouveau médicament</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom du médicament</label>
                <input
                  type="text"
                  value={newMedication.name}
                  onChange={(e) => setNewMedication({...newMedication, name: e.target.value})}
                  className="input-field"
                  placeholder="Nom du médicament"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Unité</label>
                <select
                  value={newMedication.unit}
                  onChange={(e) => setNewMedication({...newMedication, unit: e.target.value})}
                  className="input-field"
                  required
                >
                  <option value="">Sélectionner une unité</option>
                  <option value="comprimés">Comprimés</option>
                  <option value="ampoules">Ampoules</option>
                  <option value="flacons">Flacons</option>
                  <option value="gélules">Gélules</option>
                  <option value="sachets">Sachets</option>
                  <option value="tubes">Tubes</option>
                  <option value="boîtes">Boîtes</option>
                  <option value="unités">Unités</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Prix unitaire (USD)</label>
                <input
                  type="number"
                  value={newMedication.price}
                  onChange={(e) => setNewMedication({...newMedication, price: e.target.value})}
                  className="input-field"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowAddMedication(false);
                  setNewMedication({ name: '', unit: '', price: '', purchasePrice: '' });
                }}
                className="btn-secondary"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleAddMedication}
                className="btn-primary"
                disabled={!newMedication.name || !newMedication.unit}
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplyRequests; 
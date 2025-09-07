import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import { useAuthStore } from '../../stores/authStore';

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
}

interface CreditRequest {
  id: number;
  employee: { id: number; firstName: string; lastName: string };
  amount: number;
  reason: string;
  repaymentPeriod: number; // Délai de remboursement en mois
  status: string;
  pdgComment?: string;
  createdAt: string;
}

const CreditRequests: React.FC = () => {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<CreditRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    employeeId: '',
    amount: '',
    reason: '',
    repaymentPeriod: '', // Délai de remboursement en mois
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [comment, setComment] = useState<{ [id: number]: string }>({});
  
  // Charger les impressions depuis localStorage
  const [printedRequests, setPrintedRequests] = useState<Set<number>>(() => {
    const saved = localStorage.getItem('printedCreditRequests');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // Vérifier si l'utilisateur est PDG
  const isPDG = user?.role === 'PDG';
  // Vérifier si l'utilisateur est RH
  const isRH = user?.role === 'RH';

  // Sauvegarder les impressions dans localStorage
  const updatePrintedRequests = (newSet: Set<number>) => {
    setPrintedRequests(newSet);
    localStorage.setItem('printedCreditRequests', JSON.stringify([...newSet]));
  };

  // Nettoyer les anciennes impressions (plus de 30 jours)
  const cleanupOldPrintedRequests = () => {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const newSet = new Set(printedRequests);
    let hasChanges = false;
    
    // Supprimer les IDs qui correspondent à des demandes supprimées ou anciennes
    requests.forEach(request => {
      const requestDate = new Date(request.createdAt).getTime();
      if (requestDate < thirtyDaysAgo && newSet.has(request.id)) {
        newSet.delete(request.id);
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      updatePrintedRequests(newSet);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchEmployees();
  }, []);

  // Nettoyer les anciennes impressions après le chargement des demandes
  useEffect(() => {
    if (requests.length > 0) {
      cleanupOldPrintedRequests();
    }
  }, [requests]);

  // Nettoyer les messages après 5 secondes
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/credit-requests');
      console.log('Réponse API credit-requests:', res.data);
      // Les données sont directement un tableau
      const requestsData = Array.isArray(res.data) ? res.data : [];
      setRequests(requestsData);
    } catch (e) {
      console.error('Erreur lors du chargement des demandes de crédit:', e);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await axios.get('/api/employees');
      console.log('Réponse API employees:', res.data);
      // Les données sont directement un tableau
      setEmployees(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('Erreur lors du chargement des employés:', e);
      setEmployees([]);
    }
  };

  const handleOpenForm = () => {
    setForm({ employeeId: '', amount: '', reason: '', repaymentPeriod: '' });
    setShowForm(true);
    setError(null);
    setSuccess(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation des données
    if (!form.employeeId || !form.amount || !form.reason || !form.repaymentPeriod) {
      setError('Tous les champs sont requis');
      return;
    }
    
    const amount = parseFloat(form.amount);
    const repaymentPeriod = parseInt(form.repaymentPeriod, 10);
    if (isNaN(amount) || amount <= 0) {
      setError('Le montant doit être un nombre positif');
      return;
    }
    if (isNaN(repaymentPeriod) || repaymentPeriod <= 0) {
      setError('Le délai de remboursement doit être un nombre positif');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      console.log('Envoi de la demande de crédit:', {
        employeeId: form.employeeId,
        amount: amount,
        reason: form.reason,
        repaymentPeriod: repaymentPeriod,
      });
      await axios.post('/api/credit-requests', {
        employeeId: parseInt(form.employeeId, 10),
        amount: amount,
        reason: form.reason,
        repaymentPeriod: repaymentPeriod,
      });
      setSuccess('Demande de crédit créée avec succès');
      setShowForm(false);
      setForm({ employeeId: '', amount: '', reason: '', repaymentPeriod: '' });
      fetchRequests();
    } catch (e: any) {
      console.error('Erreur lors de la création de la demande de crédit:', e);
      setError(e.response?.data?.error || 'Erreur lors de la création de la demande');
    } finally {
      setLoading(false);
    }
  };

  const handleCommentChange = (id: number, value: string) => {
    setComment(prev => ({ ...prev, [id]: value }));
  };

  const handleValidate = async (id: number, status: 'approved' | 'rejected') => {
    try {
      await axios.patch(`/api/credit-requests/${id}`, {
        status,
        pdgComment: comment[id] || ''
      });
      setSuccess(`Demande ${status === 'approved' ? 'approuvée' : 'rejetée'} avec succès`);
      setComment(prev => ({ ...prev, [id]: '' }));
      fetchRequests();
    } catch (e: any) {
      console.error('Erreur lors de la validation:', e);
      setError(e.response?.data?.error || 'Erreur lors de la validation');
    }
  };

  const handlePrintAuthorization = (r: CreditRequest) => {
    try {
      const doc = new jsPDF();
      
      // Entête institutionnelle
      doc.addImage('/logo_polycliniques.jpg', 'JPEG', 10, 8, 28, 28);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('REPUBLIQUE DEMOCRATIQUE DU CONGO', 45, 13);
      doc.text('PROVINCE DU SUD-KIVU', 45, 18);
      doc.text('VILLE DE BUKAVU', 45, 23);
      doc.text('ZONE DE SANTE URBAINE DE KADUTU', 45, 28);
      doc.setTextColor(230,0,0);
      doc.text('FONDATION UMOJA', 45, 33);
      doc.setTextColor(0,153,0);
      doc.text('"F.U" asbl', 45, 38);
      doc.setTextColor(0,0,0);
      doc.text('DEPARTEMENT DES OEUVRES MEDICALES', 45, 43);
      doc.setFontSize(12);
      doc.setTextColor(0,153,0);
      doc.text('POLYCLINIQUE DES APOTRES', 45, 48);
      doc.setTextColor(0,0,0);
      doc.setDrawColor(230,0,0);
      doc.setLineWidth(1.2);
      doc.line(10, 52, 200, 52);
      
      // Titre
      doc.setFontSize(18);
      doc.setTextColor(21,128,61);
      doc.text('Autorisation de Crédit', 20, 65);
      doc.setFontSize(12);
      doc.setTextColor(0,0,0);
      
      // Contenu principal
      const employeeName = r.employee?.firstName && r.employee?.lastName 
        ? `${r.employee.firstName} ${r.employee.lastName}`
        : 'Employé non trouvé';
      doc.text(`Employé : ${employeeName}`, 20, 80);
      doc.text(`Montant : $${r.amount.toLocaleString()}`, 20, 90);
      doc.text(`Raison : ${r.reason}`, 20, 100);
      doc.text(`Délai de remboursement : ${r.repaymentPeriod} mois`, 20, 110);
      doc.text(`Statut : ${r.status === 'approved' ? 'Validé' : r.status}`, 20, 120);
      if (r.pdgComment) doc.text(`Commentaire PDG : ${r.pdgComment}`, 20, 130);
      doc.text(`Date validation : ${new Date(r.createdAt).toLocaleDateString('fr-FR')}`, 20, 140);
      doc.text('Signature PDG :', 20, 160);
      
      // Bas de page institutionnel (centré)
      doc.setFontSize(10);
      doc.setTextColor(0,0,0);
      doc.text('Adresse : DRCONGO/SK/BKV/Av. BUHOZI/KAJANGU/CIRIRI', 105, 280, { align: 'center' });
      doc.text('Tél : (+243) 975 822 376, 843 066 779', 105, 285, { align: 'center' });
      doc.text('Email : polycliniquedesapotres1121@gmail.com', 105, 290, { align: 'center' });
      
      const fileName = `autorisation_credit_${r.id}.pdf`;
      doc.save(fileName);
      
      // Masquer le bouton après impression
      updatePrintedRequests(new Set([...printedRequests, r.id]));
      
      // Afficher un message de succès
      setSuccess('Autorisation imprimée avec succès !');
      
    } catch (error) {
      console.error('Erreur lors de l\'impression:', error);
      setError('Erreur lors de l\'impression de l\'autorisation');
    }
  };

  const handleResetPrintStatus = (requestId: number) => {
    const newSet = new Set(printedRequests);
    newSet.delete(requestId);
    updatePrintedRequests(newSet);
    setSuccess('Bouton d\'impression réactivé');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Approuvé';
      case 'rejected': return 'Rejeté';
      default: return 'En attente';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des demandes de crédit</h1>
          <p className="mt-1 text-sm text-gray-500">
            Créer et gérer les demandes de crédit des employés
          </p>
        </div>
        {isRH && (
          <button
            onClick={handleOpenForm}
            className="btn-primary"
          >
            Nouvelle demande de crédit
          </button>
        )}
      </div>

      {/* Messages de succès et d'erreur */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Formulaire de création */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h2 className="text-lg font-semibold mb-4">Nouvelle demande de crédit</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employé
              </label>
              <select
                name="employeeId"
                value={form.employeeId}
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="">Sélectionner un employé</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Montant ($)
              </label>
              <input
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                className="input-field"
                placeholder="Montant du crédit"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Raison
              </label>
              <textarea
                name="reason"
                value={form.reason}
                onChange={handleChange}
                className="input-field"
                placeholder="Raison de la demande de crédit"
                rows={3}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Délai de remboursement (mois)
              </label>
              <input
                type="number"
                name="repaymentPeriod"
                value={form.repaymentPeriod}
                onChange={handleChange}
                className="input-field"
                placeholder="Délai de remboursement"
                min="1"
                step="1"
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Création...' : 'Créer la demande'}
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

      {/* Liste des demandes */}
      <div className="bg-white rounded-lg shadow-md border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Demandes de crédit</h2>
        </div>
        
        {loading ? (
          <div className="p-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Chargement...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Aucune demande de crédit trouvée
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {requests.map((request) => (
              <div key={request.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {request.employee?.firstName && request.employee?.lastName 
                        ? `${request.employee.firstName} ${request.employee.lastName}`
                        : 'Employé non trouvé'
                      }
                    </h3>
                    <p className="text-sm text-gray-600">
                      ${request.amount.toLocaleString()} - {request.reason}
                    </p>
                    <p className="text-sm text-gray-600">
                      Délai de remboursement : {request.repaymentPeriod} mois
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Demande créée le {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {getStatusText(request.status)}
                    </span>
                    {request.status === 'approved' && isRH && !printedRequests.has(request.id) && (
                      <button
                        onClick={() => handlePrintAuthorization(request)}
                        className="btn-secondary text-sm"
                      >
                        Imprimer autorisation
                      </button>
                    )}
                    {request.status === 'approved' && isRH && printedRequests.has(request.id) && (
                      <button
                        onClick={() => handleResetPrintStatus(request.id)}
                        className="btn-secondary text-sm opacity-50"
                        title="Réactiver l'impression"
                      >
                        Réimprimer
                      </button>
                    )}
                  </div>
                </div>

                {/* Actions pour PDG */}
                {isPDG && request.status === 'pending' && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Commentaire (optionnel)
                      </label>
                      <textarea
                        value={comment[request.id] || ''}
                        onChange={(e) => handleCommentChange(request.id, e.target.value)}
                        className="input-field"
                        placeholder="Commentaire pour l'employé..."
                        rows={2}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleValidate(request.id, 'approved')}
                        className="btn-primary text-sm"
                      >
                        Approuver
                      </button>
                      <button
                        onClick={() => handleValidate(request.id, 'rejected')}
                        className="btn-danger text-sm"
                      >
                        Rejeter
                      </button>
                    </div>
                  </div>
                )}

                {/* Commentaire PDG affiché */}
                {request.pdgComment && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Commentaire PDG:</strong> {request.pdgComment}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreditRequests; 
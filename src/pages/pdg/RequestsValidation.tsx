import React, { useState, useEffect } from 'react';
import axios from 'axios';

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
  pdgComment?: string;
}

interface AdvanceRequest {
  id: number;
  employee?: { id: number; firstName: string; lastName: string };
  amount: number;
  reason: string;
  status: string;
  pdgComment?: string;
  createdAt: string;
}

interface CreditRequest {
  id: number;
  employee?: { id: number; firstName: string; lastName: string };
  amount: number;
  reason: string;
  status: string;
  pdgComment?: string;
  createdAt: string;
  repaymentPeriod?: number; // Délai de remboursement en mois
}

interface LeaveRequest {
  id: number;
  employee?: { id: number; firstName: string; lastName: string };
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  pdgComment?: string;
  createdAt: string;
}

const RequestsValidation: React.FC = () => {
  const [supplyRequests, setSupplyRequests] = useState<SupplyRequest[]>([]);
  const [advanceRequests, setAdvanceRequests] = useState<AdvanceRequest[]>([]);
  const [creditRequests, setCreditRequests] = useState<CreditRequest[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [comment, setComment] = useState<{ [id: string]: string }>({});
  const [expandedSupplyRequest, setExpandedSupplyRequest] = useState<number | null>(null); // Pour la vue détaillée

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

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [supplyRes, advanceRes, creditRes, leaveRes] = await Promise.all([
        axios.get('/api/supply-requests'),
        axios.get('/api/advance-requests'),
        axios.get('/api/credit-requests'),
        axios.get('/api/leave-requests')
      ]);
      setSupplyRequests(supplyRes.data.requests || []);
      setAdvanceRequests(advanceRes.data.requests || []);
      setCreditRequests(creditRes.data || []);
      setLeaveRequests(leaveRes.data.requests || []);
    } catch (e) {
      setSupplyRequests([]);
      setAdvanceRequests([]);
      setCreditRequests([]);
      setLeaveRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCommentChange = (id: string, value: string) => {
    setComment((prev) => ({ ...prev, [id]: value }));
  };

  // Fonction pour basculer l'affichage détaillé des demandes d'approvisionnement
  const toggleSupplyRequestDetails = (requestId: number) => {
    setExpandedSupplyRequest(expandedSupplyRequest === requestId ? null : requestId);
  };

  // Approvisionnement
  const handleApproveSupply = async (id: number) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await axios.patch(`/api/supply-requests/${id}/approve`, {});
      setSuccess('Demande d’approvisionnement approuvée !');
      fetchAll();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Erreur lors de l’approbation');
    } finally {
      setLoading(false);
    }
  };
  const handleRejectSupply = async (id: number) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await axios.patch(`/api/supply-requests/${id}/reject`, { reason: comment[`supply-${id}`] || '' });
      setSuccess('Demande d’approvisionnement rejetée !');
      fetchAll();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Erreur lors du rejet');
    } finally {
      setLoading(false);
    }
  };

  // Avance sur salaire
  const handleValidateAdvance = async (id: number, status: 'approved' | 'rejected') => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await axios.patch(`/api/advance-requests/${id}/validate`, {
        status,
        pdgComment: comment[`advance-${id}`] || '',
      });
      setSuccess('Demande d\'avance mise à jour !');
      fetchAll();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Erreur lors de la validation de la demande');
    } finally {
      setLoading(false);
    }
  };

  // Crédit
  const handleValidateCredit = async (id: number, status: 'approved' | 'rejected') => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await axios.patch(`/api/credit-requests/${id}`, {
        status,
        pdgComment: comment[`credit-${id}`] || '',
      });
      setSuccess('Demande de crédit mise à jour !');
      fetchAll();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Erreur lors de la validation de la demande');
    } finally {
      setLoading(false);
    }
  };

  // Congé
  const handleValidateLeave = async (id: number, status: 'approved' | 'rejected') => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await axios.patch(`/api/leave-requests/${id}/validate`, {
        status,
        pdgComment: comment[`leave-${id}`] || '',
      });
      setSuccess('Demande de congé mise à jour !');
      fetchAll();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Erreur lors de la validation de la demande');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Validation des demandes</h1>
      <p className="text-gray-600 mb-6">Validez, refusez ou consultez l'historique des demandes d'approvisionnement, d'avance sur salaire, de crédit et de congé.</p>
      {error && <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4 text-red-700">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4 text-green-700">{success}</div>}
      {loading ? (
        <div className="flex items-center justify-center h-24">Chargement...</div>
      ) : (
        <>
        {/* Approvisionnements */}
        <h2 className="text-lg font-semibold mb-2 mt-6">Demandes d’approvisionnement</h2>
        <div className="overflow-x-auto mb-8">
          <table className="min-w-full border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="border px-2 py-2">N°</th>
                <th className="border px-2 py-2">Date</th>
                <th className="border px-2 py-2">Demandeur</th>
                <th className="border px-2 py-2">Montant ($)</th>
                <th className="border px-2 py-2">Statut</th>
                <th className="border px-2 py-2">Commentaire PDG</th>
                <th className="border px-2 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {supplyRequests.map((r) => (
                <React.Fragment key={r.id}>
                  <tr className="border-b">
                  <td className="border px-2 py-2">{r.requestNumber}</td>
                    <td className="border px-2 py-2">{formatDate(r.date)}</td>
                  <td className="border px-2 py-2">{r.requestedBy}</td>
                  <td className="border px-2 py-2">{r.totalAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                  <td className="border px-2 py-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      r.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      r.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {r.status === 'pending' ? 'En attente' : r.status === 'approved' ? 'Approuvée' : 'Rejetée'}
                    </span>
                  </td>
                  <td className="border px-2 py-2">
                    <textarea
                      className="input-field"
                      placeholder="Commentaire..."
                      value={comment[`supply-${r.id}`] || r.pdgComment || ''}
                      onChange={(e) => handleCommentChange(`supply-${r.id}`, e.target.value)}
                      disabled={r.status !== 'pending'}
                    />
                  </td>
                  <td className="border px-2 py-2 flex flex-col gap-2">
                      <button
                        className="btn-secondary text-xs"
                        onClick={() => toggleSupplyRequestDetails(r.id)}
                      >
                        {expandedSupplyRequest === r.id ? 'Masquer détails' : 'Voir détails'}
                      </button>
                    {r.status === 'pending' && (
                      <>
                        <button
                          className="btn-primary"
                          onClick={() => handleApproveSupply(r.id)}
                          disabled={loading}
                        >
                          Approuver
                        </button>
                        <button
                          className="btn-danger"
                          onClick={() => handleRejectSupply(r.id)}
                          disabled={loading}
                        >
                          Rejeter
                        </button>
                      </>
                    )}
                    {r.status !== 'pending' && (
                      <span className="text-xs text-gray-500">{r.status === 'approved' ? `Validée le ${r.approvalDate ? new Date(r.approvalDate).toLocaleDateString('fr-FR') : ''}` : `Rejetée`}</span>
                    )}
                  </td>
                </tr>
                  
                  {/* Vue détaillée des items de la demande */}
                  {expandedSupplyRequest === r.id && (
                    <tr>
                      <td colSpan={7} className="border px-2 py-2 bg-gray-50">
                        <div className="mb-3">
                          <h4 className="font-semibold text-sm mb-2">Détails des articles demandés :</h4>
                          <div className="overflow-x-auto">
                            <table className="min-w-full border border-gray-300 text-xs">
                              <thead>
                                <tr className="bg-gray-100">
                                  <th className="border px-2 py-1">N°</th>
                                  <th className="border px-2 py-1">Désignation</th>
                                  <th className="border px-2 py-1">Quantité Disponible</th>
                                  <th className="border px-2 py-1">Quantité Demandée</th>
                                  <th className="border px-2 py-1">Prix d'achat (USD)</th>
                                  <th className="border px-2 py-1">Prix Total (USD)</th>
                                  <th className="border px-2 py-1">Observation</th>
                                </tr>
                              </thead>
                              <tbody>
                                {r.items.map((item, index) => (
                                  <tr key={index} className="border-b">
                                    <td className="border px-2 py-1 text-center">{String(index + 1).padStart(2, '0')}</td>
                                    <td className="border px-2 py-1">{item.designation}</td>
                                    <td className="border px-2 py-1 text-center">{item.quantityAvailable}</td>
                                    <td className="border px-2 py-1 text-center">{item.quantityRequested}</td>
                                    <td className="border px-2 py-1 text-right">{item.unitPrice.toFixed(2)}</td>
                                    <td className="border px-2 py-1 text-right">{item.totalPrice.toFixed(2)}</td>
                                    <td className="border px-2 py-1">{item.observation || '-'}</td>
                                  </tr>
                                ))}
                                <tr className="bg-gray-100 font-bold">
                                  <td colSpan={5} className="border px-2 py-1 text-right">Total général :</td>
                                  <td className="border px-2 py-1 text-right">{r.totalAmount.toFixed(2)}</td>
                                  <td className="border px-2 py-1"></td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        {/* Avances sur salaire */}
        <h2 className="text-lg font-semibold mb-2 mt-6">Demandes d’avance sur salaire</h2>
        <div className="overflow-x-auto mb-8">
          <table className="min-w-full border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="border px-2 py-2">Employé</th>
                <th className="border px-2 py-2">Montant</th>
                <th className="border px-2 py-2">Raison</th>
                <th className="border px-2 py-2">Statut</th>
                <th className="border px-2 py-2">Commentaire PDG</th>
                <th className="border px-2 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {advanceRequests.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="border px-2 py-2">
                    {r.employee?.firstName && r.employee?.lastName 
                      ? `${r.employee.firstName} ${r.employee.lastName}`
                      : 'Employé non trouvé'
                    }
                  </td>
                  <td className="border px-2 py-2">{r.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                  <td className="border px-2 py-2">{r.reason}</td>
                  <td className="border px-2 py-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      r.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      r.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {r.status === 'pending' ? 'En attente' : r.status === 'approved' ? 'Approuvée' : 'Rejetée'}
                    </span>
                  </td>
                  <td className="border px-2 py-2">
                    <textarea
                      className="input-field"
                      placeholder="Commentaire..."
                      value={comment[`advance-${r.id}`] || r.pdgComment || ''}
                      onChange={(e) => handleCommentChange(`advance-${r.id}`, e.target.value)}
                      disabled={r.status !== 'pending'}
                    />
                  </td>
                  <td className="border px-2 py-2 flex flex-col gap-2">
                    {r.status === 'pending' && (
                      <>
                        <button
                          className="btn-primary"
                          onClick={() => handleValidateAdvance(r.id, 'approved')}
                          disabled={loading}
                        >
                          Approuver
                        </button>
                        <button
                          className="btn-danger"
                          onClick={() => handleValidateAdvance(r.id, 'rejected')}
                          disabled={loading}
                        >
                          Rejeter
                        </button>
                      </>
                    )}
                    {r.status !== 'pending' && (
                      <span className="text-xs text-gray-500">{r.status === 'approved' ? `Validée` : `Rejetée`}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Demandes de crédit */}
        <h2 className="text-lg font-semibold mb-2 mt-6">Demandes de crédit</h2>
        <div className="overflow-x-auto mb-8">
          <table className="min-w-full border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="border px-2 py-2">Employé</th>
                <th className="border px-2 py-2">Montant</th>
                <th className="border px-2 py-2">Raison</th>
                <th className="border px-2 py-2">Délai de remboursement</th>
                <th className="border px-2 py-2">Date</th>
                <th className="border px-2 py-2">Statut</th>
                <th className="border px-2 py-2">Commentaire PDG</th>
                <th className="border px-2 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {creditRequests.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="border px-2 py-2">
                    {r.employee?.firstName && r.employee?.lastName 
                      ? `${r.employee.firstName} ${r.employee.lastName}`
                      : 'Employé non trouvé'
                    }
                  </td>
                  <td className="border px-2 py-2">{r.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                  <td className="border px-2 py-2">{r.reason}</td>
                  <td className="border px-2 py-2">
                    {r.repaymentPeriod !== undefined ? `${r.repaymentPeriod} mois` : '-'}
                  </td>
                  <td className="border px-2 py-2">{new Date(r.createdAt).toLocaleDateString('fr-FR')}</td>
                  <td className="border px-2 py-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      r.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      r.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {r.status === 'pending' ? 'En attente' : r.status === 'approved' ? 'Approuvée' : 'Rejetée'}
                    </span>
                  </td>
                  <td className="border px-2 py-2">
                    <textarea
                      className="input-field"
                      placeholder="Commentaire..."
                      value={comment[`credit-${r.id}`] || r.pdgComment || ''}
                      onChange={(e) => handleCommentChange(`credit-${r.id}`, e.target.value)}
                      disabled={r.status !== 'pending'}
                    />
                  </td>
                  <td className="border px-2 py-2 flex flex-col gap-2">
                    {r.status === 'pending' && (
                      <>
                        <button
                          className="btn-primary"
                          onClick={() => handleValidateCredit(r.id, 'approved')}
                          disabled={loading}
                        >
                          Approuver
                        </button>
                        <button
                          className="btn-danger"
                          onClick={() => handleValidateCredit(r.id, 'rejected')}
                          disabled={loading}
                        >
                          Rejeter
                        </button>
                      </>
                    )}
                    {r.status !== 'pending' && (
                      <span className="text-xs text-gray-500">{r.status === 'approved' ? `Validée` : `Rejetée`}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Demandes de congé */}
        <h2 className="text-lg font-semibold mb-2 mt-6">Demandes de congé</h2>
        <div className="overflow-x-auto mb-8">
          <table className="min-w-full border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="border px-2 py-2">Employé</th>
                <th className="border px-2 py-2">Date de début</th>
                <th className="border px-2 py-2">Date de fin</th>
                <th className="border px-2 py-2">Durée</th>
                <th className="border px-2 py-2">Raison</th>
                <th className="border px-2 py-2">Date de demande</th>
                <th className="border px-2 py-2">Statut</th>
                <th className="border px-2 py-2">Commentaire PDG</th>
                <th className="border px-2 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaveRequests.map((r) => {
                const startDate = new Date(r.startDate);
                const endDate = new Date(r.endDate);
                const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                
                return (
                  <tr key={r.id} className="border-b">
                    <td className="border px-2 py-2">
                      {r.employee?.firstName && r.employee?.lastName 
                        ? `${r.employee.firstName} ${r.employee.lastName}`
                        : 'Employé non trouvé'
                      }
                    </td>
                    <td className="border px-2 py-2">{startDate.toLocaleDateString('fr-FR')}</td>
                    <td className="border px-2 py-2">{endDate.toLocaleDateString('fr-FR')}</td>
                    <td className="border px-2 py-2">{duration} jour{duration > 1 ? 's' : ''}</td>
                    <td className="border px-2 py-2">{r.reason}</td>
                    <td className="border px-2 py-2">{new Date(r.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td className="border px-2 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        r.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        r.status === 'approved' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {r.status === 'pending' ? 'En attente' : r.status === 'approved' ? 'Approuvé' : 'Rejeté'}
                      </span>
                    </td>
                    <td className="border px-2 py-2">
                      <textarea
                        className="input-field"
                        placeholder="Commentaire..."
                        value={comment[`leave-${r.id}`] || r.pdgComment || ''}
                        onChange={(e) => handleCommentChange(`leave-${r.id}`, e.target.value)}
                        disabled={r.status !== 'pending'}
                      />
                    </td>
                    <td className="border px-2 py-2 flex flex-col gap-2">
                      {r.status === 'pending' && (
                        <>
                          <button
                            className="btn-primary"
                            onClick={() => handleValidateLeave(r.id, 'approved')}
                            disabled={loading}
                          >
                            Approuver
                          </button>
                          <button
                            className="btn-danger"
                            onClick={() => handleValidateLeave(r.id, 'rejected')}
                            disabled={loading}
                          >
                            Rejeter
                          </button>
                        </>
                      )}
                      {r.status !== 'pending' && (
                        <span className="text-xs text-gray-500">{r.status === 'approved' ? `Approuvé` : `Rejeté`}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  );
};

export default RequestsValidation; 
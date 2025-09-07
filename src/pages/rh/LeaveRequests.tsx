import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import { useAuthStore } from '../../stores/authStore';

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
}

interface LeaveRequest {
  id: number;
  employee: Employee;
  employeeId: number;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  pdgComment?: string;
  createdAt: string;
}

const LeaveRequests: React.FC = () => {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    employeeId: '',
    startDate: '',
    days: '',
    reason: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [comment, setComment] = useState<{ [id: number]: string }>({});

  // Vérifier si l'utilisateur est PDG
  const isPDG = user?.role === 'PDG';
  // Vérifier si l'utilisateur est RH
  const isRH = user?.role === 'RH';

  useEffect(() => {
    fetchRequests();
    fetchEmployees();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/leave-requests');
      setRequests(res.data.requests || []);
    } catch (e) {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await axios.get('/api/employees');
      setEmployees(res.data || []);
    } catch (e) {
      setEmployees([]);
    }
  };

  const handleOpenForm = () => {
    setForm({ employeeId: '', startDate: '', days: '', reason: '' });
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
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      // Calcul de la date de fin
      const start = new Date(form.startDate);
      const days = parseInt(form.days, 10);
      const end = new Date(start);
      end.setDate(start.getDate() + (isNaN(days) ? 0 : days) - 1);
      await axios.post('/api/leave-requests', {
        employeeId: form.employeeId,
        startDate: form.startDate,
        endDate: end.toISOString().slice(0, 10),
        reason: form.reason,
        pdgComment: form.reason, // La raison devient le commentaire initial
      });
      setSuccess('Demande de congé créée !');
      setShowForm(false);
      fetchRequests();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Erreur lors de la création de la demande');
    } finally {
      setLoading(false);
    }
  };

  const handleCommentChange = (id: number, value: string) => {
    setComment((prev) => ({ ...prev, [id]: value }));
  };

  const handleValidate = async (id: number, status: 'approved' | 'rejected') => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await axios.patch(`/api/leave-requests/${id}/validate`, {
        status,
        pdgComment: comment[id] || '',
      });
      setSuccess('Demande mise à jour !');
      fetchRequests();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Erreur lors de la validation de la demande');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintAuthorization = (r: LeaveRequest) => {
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
    // Ligne rouge
    doc.setDrawColor(230,0,0);
    doc.setLineWidth(1.2);
    doc.line(10, 52, 200, 52);
    // Titre
    doc.setFontSize(18);
    doc.setTextColor(21,128,61);
    doc.text('Autorisation de Congé', 20, 65);
    doc.setFontSize(12);
    doc.setTextColor(0,0,0);
    // Contenu principal
    doc.text(`Employé : ${r.employee.firstName} ${r.employee.lastName}`, 20, 80);
    doc.text(`Période : du ${new Date(r.startDate).toLocaleDateString('fr-FR')} au ${new Date(r.endDate).toLocaleDateString('fr-FR')}`, 20, 90);
    doc.text(`Raison : ${r.reason}`, 20, 100);
    doc.text(`Statut : ${r.status === 'approved' ? 'Validé' : r.status}`, 20, 110);
    if (r.pdgComment) doc.text(`Commentaire PDG : ${r.pdgComment}`, 20, 120);
    doc.text(`Date validation : ${new Date(r.createdAt).toLocaleDateString('fr-FR')}`, 20, 130);
    doc.text('Signature PDG :', 20, 150);
    // Bas de page institutionnel (centré)
    doc.setFontSize(10);
    doc.setTextColor(0,0,0);
    doc.text('Adresse : DRCONGO/SK/BKV/Av. BUHOZI/KAJANGU/CIRIRI', 105, 280, { align: 'center' });
    doc.text('Tél : (+243) 975 822 376, 843 066 779', 105, 285, { align: 'center' });
    doc.text('Email : polycliniquedesapotres1121@gmail.com', 105, 290, { align: 'center' });
    doc.save(`autorisation_conge_${r.id}.pdf`);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Demandes de congé</h1>
        <button className="btn-primary" onClick={handleOpenForm}>
          + Nouvelle demande de congé
        </button>
      </div>
      <p className="text-gray-600 mb-6">Gérez les demandes de congé des employés et suivez leur statut.</p>
      {error && <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4 text-red-700">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4 text-green-700">{success}</div>}
      <h2 className="text-lg font-semibold mb-2">Liste des demandes</h2>
      {loading ? (
        <div className="flex items-center justify-center h-24">Chargement...</div>
      ) : requests.length === 0 ? (
        <div className="text-gray-500">Aucune demande enregistrée.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Employé</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Début</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fin</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Motif</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  {isPDG ? 'Commentaire PDG' : 'Commentaire'}
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-2">{r.employee?.firstName} {r.employee?.lastName}</td>
                  <td className="px-4 py-2">{new Date(r.startDate).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-2">{new Date(r.endDate).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-2">{r.reason}</td>
                  <td className="px-4 py-2">{r.status}</td>
                  <td className="px-4 py-2">
                    {isPDG ? (
                      <textarea
                        className="input-field"
                        placeholder="Commentaire PDG..."
                        value={comment[r.id] || r.pdgComment || r.reason || ''}
                        onChange={(e) => handleCommentChange(r.id, e.target.value)}
                        disabled={r.status !== 'pending'}
                      />
                    ) : (
                      <div className="text-sm text-gray-600">
                        {r.pdgComment || r.reason || 'Aucun commentaire'}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 flex flex-col gap-2">
                    {r.status === 'pending' && isPDG && (
                      <>
                        <button
                          className="btn-primary"
                          onClick={() => handleValidate(r.id, 'approved')}
                          disabled={loading}
                        >
                          Approuver
                        </button>
                        <button
                          className="btn-danger"
                          onClick={() => handleValidate(r.id, 'rejected')}
                          disabled={loading}
                        >
                          Rejeter
                        </button>
                      </>
                    )}
                    {r.status === 'pending' && !isPDG && (
                      <span className="text-gray-500 text-sm">En attente d'approbation PDG</span>
                    )}
                    {r.status === 'approved' && (isRH || isPDG) && (
                      <button className="btn-secondary" onClick={() => handlePrintAuthorization(r)}>
                        Imprimer autorisation
                      </button>
                    )}
                    {r.status === 'rejected' && (
                      <span className="text-red-500 text-sm">Demande rejetée</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
            <h2 className="text-xl font-bold mb-4">Nouvelle demande de congé</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Employé</label>
                <select
                  name="employeeId"
                  value={form.employeeId}
                  onChange={handleChange}
                  required
                  className="input-field"
                >
                  <option value="">Sélectionner un employé</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date de début</label>
                <input
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  onChange={handleChange}
                  required
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre de jours</label>
                <input
                  type="number"
                  name="days"
                  value={form.days}
                  onChange={handleChange}
                  required
                  min="1"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Motif</label>
                <textarea
                  name="reason"
                  value={form.reason}
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
    </div>
  );
};

export default LeaveRequests; 
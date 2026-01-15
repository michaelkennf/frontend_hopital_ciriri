import React, { useState, useEffect } from 'react';
import { apiClient } from '../../utils/apiClient';

interface Medication {
  id: number;
  name: string;
  quantity: number;
  minQuantity?: number; // Peut ne pas exister dans le schéma Prisma
  unit: string;
  purchasePrice?: number; // Prix d'achat
  sellingPrice?: number;  // Prix de vente
  description?: string;
  category?: string;
  expirationDate?: string; // Peut ne pas exister dans le schéma Prisma
}

interface StockMovement {
  id: number;
  medication: Medication;
  type: string;
  quantity: number;
  reason: string;
  date: string;
}

const StockManagement: React.FC = () => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    medicationId: '',
    type: 'IN',
    quantity: '',
    reason: '',
    date: new Date().toISOString().slice(0, 10),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  // Pour édition/suppression
  const [editMed, setEditMed] = useState<Medication | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showAddMed, setShowAddMed] = useState(false);
  const [addFields, setAddFields] = useState<any>({ 
    name: '', 
    quantity: '', 
    minQuantity: '', 
    unit: '', 
    purchasePrice: '', // Prix d'achat
    sellingPrice: '',  // Prix de vente
    description: '',
    category: '',
    expirationDate: '' 
  });
  const [addError, setAddError] = useState<string | null>(null);
  const [addingMed, setAddingMed] = useState(false);

  useEffect(() => {
    fetchMedications();
    fetchMovements();
  }, []);

  const fetchMedications = async () => {
    try {
      const res = await apiClient.get('/api/medications');
      setMedications(res.data.medications || []);
    } catch (e) {
      setMedications([]);
    }
  };

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/medications/stock-movements');
      setMovements(res.data.movements || []);
    } catch (e) {
      setMovements([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = () => {
    setForm({ medicationId: '', type: 'IN', quantity: '', reason: '', date: new Date().toISOString().slice(0, 10) });
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
      await apiClient.post('/api/medications/stock-movements', {
        medicationId: form.medicationId,
        type: form.type,
        quantity: form.quantity,
        reason: form.reason,
        date: form.date,
      });
      setSuccess('Mouvement enregistré avec succès !');
      setShowForm(false);
      fetchMedications();
      fetchMovements();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Erreur lors de l’enregistrement du mouvement');
    } finally {
      setLoading(false);
    }
  };

  // Edition médicament - utilise le formulaire d'ajout avec données pré-remplies
  const openEdit = (med: Medication) => {
    setEditMed(med);
    setShowAddMed(true);
    // Pré-remplir TOUS les champs disponibles du médicament
    setAddFields({
      name: med.name || '',
      quantity: med.quantity?.toString() || '',
      minQuantity: med.minQuantity?.toString() || '',
      unit: med.unit || '',
      purchasePrice: med.purchasePrice?.toString() || '',
      sellingPrice: med.sellingPrice?.toString() || '',
      description: med.description || '',
      category: med.category || '',
      expirationDate: med.expirationDate || ''
    });
    setAddError(null);
  };

  // Suppression médicament
  const openDelete = (id: number) => {
    setDeleteId(id);
    setConfirmDelete(true);
    setDeleteError(null);
  };
  const closeDelete = () => {
    setDeleteId(null);
    setConfirmDelete(false);
    setDeleteError(null);
  };
  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteError(null);
    try {
      await apiClient.delete(`/api/medications/${deleteId}`);
      closeDelete();
      fetchMedications();
    } catch (e: any) {
      setDeleteError(e.response?.data?.error || 'Suppression non autorisée ou impossible.');
    }
  };

  // Ajout médicament
  const openAddMed = () => {
    setShowAddMed(true);
    setEditMed(null); // S'assurer qu'on n'est pas en mode édition
    setAddFields({ name: '', quantity: '', minQuantity: '', unit: '', purchasePrice: '', sellingPrice: '', description: '', category: '', expirationDate: '' });
    setAddError(null);
  };
  const closeAddMed = () => {
    setShowAddMed(false);
    setEditMed(null);
    setAddFields({ name: '', quantity: '', minQuantity: '', unit: '', purchasePrice: '', sellingPrice: '', description: '', category: '', expirationDate: '' });
    setAddError(null);
    setAddingMed(false);
  };
  const handleAddChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAddFields((prev: any) => ({ ...prev, [name]: value }));
  };
  const handleAddMed = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingMed(true);
    setAddError(null);
    try {
      const medicationData = {
        name: addFields.name,
        quantity: parseInt(addFields.quantity, 10),
        unit: addFields.unit,
        purchasePrice: addFields.purchasePrice ? parseFloat(addFields.purchasePrice) : undefined,
        sellingPrice: addFields.sellingPrice ? parseFloat(addFields.sellingPrice) : undefined,
        description: addFields.description || undefined,
        category: addFields.category || undefined
      };

      // Si editMed existe, c'est une modification, sinon c'est un ajout
      if (editMed) {
        await apiClient.patch(`/api/medications/${editMed.id}`, medicationData);
      } else {
        await apiClient.post('/api/medications', medicationData);
      }
      closeAddMed();
      fetchMedications();
    } catch (e: any) {
      setAddError(e.response?.data?.error || (editMed ? 'Erreur lors de la modification du médicament' : 'Erreur lors de l\'ajout du médicament'));
    } finally {
      setAddingMed(false);
    }
  };

  const unitOptions = [
    'pièce(s)',
    'comprimé(s)',
    'boîte(s)',
    'flacon(s)',
    'ampoule(s)',
    'sachet(s)',
    'ml',
    'g',
    'mg',
    'tube(s)'
  ];

  // Fonction pour formater le prix en préservant toutes les décimales significatives
  const formatPrice = (price: number): string => {
    if (price === null || price === undefined || isNaN(price)) return '0';
    
    // Convertir en string pour préserver toutes les décimales exactement telles qu'elles sont
    const priceStr = String(price);
    
    // Si c'est un nombre entier, retourner tel quel
    if (!priceStr.includes('.')) {
      return priceStr;
    }
    
    // Pour les nombres décimaux, préserver toutes les décimales
    // Supprimer seulement les zéros de fin inutiles (mais garder au moins 2 décimales si c'est un nombre décimal)
    const parts = priceStr.split('.');
    if (parts.length === 2) {
      // Garder toutes les décimales significatives (sans les zéros de fin)
      const decimals = parts[1].replace(/0+$/, '');
      return decimals ? `${parts[0]}.${decimals}` : parts[0];
    }
    
    return priceStr;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestion du stock</h1>
        <div className="flex gap-2">
          <button className="btn-primary" onClick={openAddMed}>
            + Ajouter un médicament
          </button>
          <button className="btn-primary" onClick={handleOpenForm}>
            + Nouveau mouvement de stock
          </button>
        </div>
      </div>
      <p className="text-gray-600 mb-6">Consultez la liste des médicaments, surveillez les alertes de stock faible et gérez les mouvements de stock.</p>
      {error && <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4 text-red-700">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4 text-green-700">{success}</div>}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-2">Médicaments en stock</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantité</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unité</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Prix d'achat</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Prix de vente</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Alerte</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {medications.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-2">{m.name}</td>
                  <td className="px-4 py-2">{m.quantity}</td>
                  <td className="px-4 py-2">{m.unit}</td>
                  <td className="px-4 py-2">
                    {m.purchasePrice !== null && m.purchasePrice !== undefined 
                      ? `$${formatPrice(m.purchasePrice)}` 
                      : '-'}
                  </td>
                  <td className="px-4 py-2">
                    {m.sellingPrice !== null && m.sellingPrice !== undefined 
                      ? `$${formatPrice(m.sellingPrice)}` 
                      : '-'}
                  </td>
                  <td className="px-4 py-2">
                    {m.quantity <= m.minQuantity ? (
                      <span className="text-red-600 font-bold">Stock faible</span>
                    ) : (
                      <span className="text-green-600">OK</span>
                    )}
                  </td>
                  <td className="px-4 py-2 flex gap-2">
                    <button className="btn-secondary" onClick={() => openEdit(m)}>Modifier</button>
                    <button className="btn-danger text-white bg-red-600 border-red-700 hover:bg-red-700 px-3 py-1 rounded" onClick={() => openDelete(m.id)}>Supprimer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-2">Historique des mouvements de stock</h2>
        {loading ? (
          <div className="flex items-center justify-center h-24">Chargement...</div>
        ) : movements.length === 0 ? (
          <div className="text-gray-500">Aucun mouvement enregistré.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Médicament</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantité</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Raison</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {movements.map((mv) => (
                  <tr key={mv.id}>
                    <td className="px-4 py-2">{new Date(mv.date).toLocaleDateString('fr-FR')}</td>
                    <td className="px-4 py-2">{mv.medication.name}</td>
                    <td className="px-4 py-2">{mv.type === 'IN' ? 'Entrée' : 'Sortie'}</td>
                    <td className="px-4 py-2">{mv.quantity}</td>
                    <td className="px-4 py-2">{mv.reason}</td>
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
            <h2 className="text-xl font-bold mb-4">Nouveau mouvement de stock</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Médicament</label>
                <select
                  name="medicationId"
                  value={form.medicationId}
                  onChange={handleChange}
                  required
                  className="input-field"
                >
                  <option value="">Sélectionner un médicament</option>
                  {medications.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (Stock: {m.quantity})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  required
                  className="input-field"
                >
                  <option value="IN">Entrée</option>
                  <option value="OUT">Sortie</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Quantité</label>
                <input
                  type="number"
                  name="quantity"
                  value={form.quantity}
                  onChange={handleChange}
                  required
                  min="1"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Raison</label>
                <input
                  type="text"
                  name="reason"
                  value={form.reason}
                  onChange={handleChange}
                  required
                  className="input-field"
                />
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
              <div className="flex justify-end">
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modale suppression médicament */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-sm relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={closeDelete}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-xl font-bold mb-4 text-red-700">Confirmer la suppression</h2>
            <p className="mb-4">Voulez-vous vraiment supprimer ce médicament ? Cette action est irréversible.</p>
            {deleteError && <div className="bg-red-100 text-red-700 p-2 mb-2 rounded">{deleteError}</div>}
            <div className="flex gap-2 justify-end">
              <button className="btn-secondary" onClick={closeDelete}>Annuler</button>
              <button
                className="btn-danger text-white bg-red-600 border-red-700 hover:bg-red-700 px-4 py-1 rounded"
                onClick={handleDelete}
                disabled={!!deleteError}
              >
                {deleteError ? 'Suppression impossible' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modale ajout médicament */}
      {showAddMed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[90vh] relative overflow-hidden">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
              onClick={closeAddMed}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-xl font-bold mb-4 pr-8">{editMed ? 'Modifier le médicament' : 'Ajouter un médicament'}</h2>
            
            {/* Conteneur scrollable pour le formulaire */}
            <div className="overflow-y-auto max-h-[calc(90vh-120px)] pr-2">
              <form onSubmit={handleAddMed} className="space-y-4">
                {/* Première ligne - Nom et Quantité */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                    <input
                      type="text"
                      name="name"
                      value={addFields.name}
                      onChange={handleAddChange}
                      required
                      className="input-field w-full"
                      placeholder="Nom du médicament"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantité *</label>
                    <input
                      type="number"
                      name="quantity"
                      value={addFields.quantity}
                      onChange={handleAddChange}
                      required
                      min="0"
                      className="input-field w-full"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Deuxième ligne - Quantité minimale et Unité */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantité minimale (alerte) *</label>
                    <input
                      type="number"
                      name="minQuantity"
                      value={addFields.minQuantity}
                      onChange={handleAddChange}
                      required
                      min="0"
                      className="input-field w-full"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unité *</label>
                    <select
                      name="unit"
                      value={addFields.unit}
                      onChange={handleAddChange}
                      required
                      className="input-field w-full"
                    >
                      <option value="">Sélectionner une unité</option>
                      {unitOptions.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Troisième ligne - Prix d'achat et Prix de vente */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prix d'achat ($)</label>
                    <input
                      type="number"
                      name="purchasePrice"
                      value={addFields.purchasePrice}
                      onChange={handleAddChange}
                      min="0"
                      step="any"
                      className="input-field w-full"
                      placeholder="0.00"
                      onKeyDown={(e) => {
                        // Permettre seulement les chiffres, point, virgule, et touches de contrôle
                        if (!/[0-9.,]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                    />
                    <p className="text-xs text-gray-500 mt-1">Entrez le prix d'achat (doit être positif ou zéro, aucune limite minimale)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prix de vente ($)</label>
                    <input
                      type="number"
                      name="sellingPrice"
                      value={addFields.sellingPrice}
                      onChange={handleAddChange}
                      min="0"
                      step="any"
                      className="input-field w-full"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Quatrième ligne - Date d'expiration et Catégorie */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date d'expiration</label>
                    <input
                      type="date"
                      name="expirationDate"
                      value={addFields.expirationDate}
                      onChange={handleAddChange}
                      className="input-field w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                    <input
                      type="text"
                      name="category"
                      value={addFields.category}
                      onChange={handleAddChange}
                      className="input-field w-full"
                      placeholder="Catégorie du médicament (optionnel)"
                    />
                  </div>
                </div>

                {/* Cinquième ligne - Description */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      name="description"
                      value={addFields.description}
                      onChange={handleAddChange}
                      rows={3}
                      className="input-field w-full"
                      placeholder="Description du médicament (optionnel)"
                    />
                  </div>
                </div>

                {addError && <div className="bg-red-100 text-red-700 p-3 rounded-md text-sm">{addError}</div>}
                
                {/* Boutons d'action */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button type="button" className="btn-secondary px-6 py-2" onClick={closeAddMed}>
                    Annuler
                  </button>
                  <button type="submit" className="btn-primary px-6 py-2" disabled={addingMed}>
                    {addingMed ? (editMed ? 'Modification...' : 'Ajout...') : (editMed ? 'Enregistrer les modifications' : 'Enregistrer')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      <footer className="mt-8 text-center text-xs text-gray-400">
        © Tous droits réservés à la Polyclinique des Apôtres
      </footer>
    </div>
  );
};

export default StockManagement; 
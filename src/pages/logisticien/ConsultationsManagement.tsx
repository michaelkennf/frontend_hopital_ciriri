import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface ConsultationType {
  id: number;
  name: string;
  price: number;
}

const ConsultationsManagement: React.FC = () => {
  const [types, setTypes] = useState<ConsultationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [editType, setEditType] = useState<ConsultationType | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const fetchTypes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/consultations/types');
      setTypes(res.data.consultationTypes || []);
    } catch (e: any) {
      setError('Erreur lors du chargement des types de consultations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    setError(null);
    try {
      await axios.post('/api/consultations/types', {
        name,
        price: parseFloat(price)
      });
      setName('');
      setPrice('');
      fetchTypes();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Erreur lors de l\'ajout');
    } finally {
      setAdding(false);
    }
  };

  const openDelete = (id: number) => {
    setDeletingId(id);
    setConfirmDelete(true);
    setDeleteError(null);
  };

  const closeDelete = () => {
    setDeletingId(null);
    setConfirmDelete(false);
    setDeleteError(null);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleteError(null);
    try {
      await axios.delete(`/api/consultations/types/${deletingId}`);
      closeDelete();
      fetchTypes();
    } catch (e: any) {
      setDeleteError(e.response?.data?.error || 'Suppression non autorisée ou impossible.');
    }
  };

  const openEdit = (type: ConsultationType) => {
    setEditType(type);
    setEditName(type.name);
    setEditPrice(type.price.toString());
    setEditError(null);
  };

  const closeEdit = () => {
    setEditType(null);
    setEditName('');
    setEditPrice('');
    setEditError(null);
    setEditing(false);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editType) return;
    setEditing(true);
    setEditError(null);
    try {
      await axios.patch(`/api/consultations/types/${editType.id}`, {
        name: editName,
        price: parseFloat(editPrice)
      });
      closeEdit();
      fetchTypes();
    } catch (e: any) {
      setEditError(e.response?.data?.error || 'Erreur lors de la modification');
    } finally {
      setEditing(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Types de consultations</h1>
      <p className="text-gray-600 mb-6">Ajoutez, modifiez ou supprimez les types de consultations disponibles dans le système.</p>
      <form className="mb-6 flex flex-col md:flex-row gap-2" onSubmit={handleAdd}>
        <input
          className="input-field"
          placeholder="Nom"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
        <input
          className="input-field"
          placeholder="Prix (FC)"
          type="number"
          min="0"
          step="0.01"
          value={price}
          onChange={e => setPrice(e.target.value)}
          required
        />
        <button type="submit" className="btn-primary" disabled={adding}>
          {adding ? 'Ajout...' : 'Ajouter'}
        </button>
      </form>
      {error && <div className="bg-red-100 text-red-700 p-2 mb-2 rounded">{error}</div>}
      {loading ? (
        <div>Chargement...</div>
      ) : (
        <table className="min-w-full text-sm bg-white shadow rounded">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Nom</th>
              <th className="p-2">Prix (FC)</th>
                              <th className="p-2">Stock</th>
            </tr>
          </thead>
          <tbody>
            {types.map(type => (
              <tr key={type.id} className="border-b">
                <td className="p-2 font-medium">{type.name}</td>
                <td className="p-2">{type.price.toFixed(2)} FC</td>
                <td className="p-2 flex gap-2">
                  <button
                    className="btn-secondary"
                    onClick={() => openEdit(type)}
                  >
                    Modifier
                  </button>
                  <button
                    className="btn-danger text-white bg-red-600 border-red-700 hover:bg-red-700 px-3 py-1 rounded"
                    onClick={() => openDelete(type.id)}
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {/* Modale de confirmation suppression */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-sm relative">
            <button
              className="absolute top-2 right-2 text-gray-500"
              style={{ zIndex: 10000, background: '#fff' }}
              onClick={closeDelete}
            >✕</button>
            <h2 className="text-lg font-bold mb-4 text-red-700">Confirmer la suppression</h2>
            <p className="mb-4">Voulez-vous vraiment supprimer ce type de consultation ? Cette action est irréversible.</p>
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
      {/* Modale d'édition */}
      {editType && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-sm relative">
            <button
              className="absolute top-2 right-2 text-gray-500"
              style={{ zIndex: 10000, background: '#fff' }}
              onClick={closeEdit}
            >✕</button>
            <h2 className="text-lg font-bold mb-4">Modifier le type de consultation</h2>
            <form onSubmit={handleEdit} className="flex flex-col gap-3">
              <input
                className="input-field"
                placeholder="Nom"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                required
              />
              <input
                className="input-field"
                placeholder="Prix (FC)"
                type="number"
                min="0"
                step="0.01"
                value={editPrice}
                onChange={e => setEditPrice(e.target.value)}
                required
              />
              {editError && <div className="bg-red-100 text-red-700 p-2 mb-2 rounded">{editError}</div>}
              <div className="flex gap-2 justify-end">
                <button className="btn-secondary" type="button" onClick={closeEdit}>Annuler</button>
                <button className="btn-primary" type="submit" disabled={editing}>
                  {editing ? 'Modification...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultationsManagement; 


import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface ConsultationType {
  id: number;
  name: string;
  price: number;
}

interface ConsultationFormProps {
  patientId: number;
  onConsultationAdded: () => void;
}

const ConsultationForm: React.FC<ConsultationFormProps> = ({ patientId, onConsultationAdded }) => {
  const [consultationTypes, setConsultationTypes] = useState<ConsultationType[]>([]);
  const [form, setForm] = useState({
    typeId: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Charger les types de consultation
  useEffect(() => {
    const fetchConsultationTypes = async () => {
      try {
        const res = await axios.get('/api/consultations/types');
        setConsultationTypes(res.data.consultationTypes || []);
      } catch (err) {
        setError('Erreur lors du chargement des types de consultation');
      }
    };
    fetchConsultationTypes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.typeId) {
      setError('Veuillez sélectionner un type de consultation');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await axios.post('/api/consultations', {
        patientId,
        consultationTypeId: form.typeId,
        date: new Date().toISOString(),
        notes: form.notes
      });

      console.log('Consultation créée:', res.data);
      setSuccess('Consultation ajoutée avec succès !');
      setForm({ typeId: '', notes: '' });
      onConsultationAdded();
    } catch (err: any) {
      console.error('Erreur création consultation:', err);
      setError(err.response?.data?.error || 'Erreur lors de la création de la consultation');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedTypeName = () => {
    if (!form.typeId) return null;
    const selectedType = consultationTypes.find(type => type.id.toString() === form.typeId);
    return selectedType?.name || null;
  };

  return (
    <form className="mb-6 p-4 bg-blue-50 rounded" onSubmit={handleSubmit}>
      <h3 className="font-semibold mb-2">Ajouter une consultation</h3>
      
      {/* Message informatif */}
      <div className="mb-3 p-3 bg-blue-100 rounded border-l-4 border-blue-400">
        <div className="flex items-center">
          <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-800">
            <strong>Système dual :</strong> Vous pouvez ajouter des consultations ici (médecin) ET à la caisse. La facture sera automatiquement créée.
          </div>
        </div>
      </div>
      
      {/* Messages d'erreur et succès */}
      {error && (
        <div className="mb-3 p-3 bg-red-100 rounded border-l-4 border-red-400">
          <div className="text-sm text-red-800">{error}</div>
        </div>
      )}
      
      {success && (
        <div className="mb-3 p-3 bg-green-100 rounded border-l-4 border-green-400">
          <div className="text-sm text-green-800">{success}</div>
        </div>
      )}
      
      {/* Sélection du type de consultation */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Type de consultation *
        </label>
        <select
          value={form.typeId}
          onChange={(e) => setForm(prev => ({ ...prev, typeId: e.target.value }))}
          className="input-field w-full"
          required
        >
          <option value="">Sélectionner un type de consultation</option>
          {consultationTypes.map(type => (
            <option key={type.id} value={type.id}>
              {type.name} - {type.price} $
            </option>
          ))}
        </select>
      </div>
          
      {/* Affichage du type de consultation sélectionné */}
      {form.typeId && getSelectedTypeName() && (
        <div className="mb-3 p-3 bg-green-100 rounded border-l-4 border-green-400">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <span className="text-sm font-medium text-green-800">Type de consultation sélectionné :</span>
              <div className="text-sm text-green-700 mt-1">
                {getSelectedTypeName()}
              </div>
            </div>
          </div>
        </div>
      )}
          
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Signes / maladie
        </label>
        <textarea
          className="input-field w-full"
          value={form.notes}
          onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Décrire les signes et maladies observés"
          rows={3}
        />
      </div>
      
      <button 
        type="submit" 
        className="btn-primary w-full" 
        disabled={loading || !form.typeId}
      >
        {loading ? 'Ajout...' : 'Ajouter la consultation'}
      </button>
    </form>
  );
};

export default ConsultationForm; 
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Fonction helper pour ajouter l'authentification aux appels axios
const authenticatedAxios = {
  get: (url: string) => {
    const token = localStorage.getItem('auth-token');
    return axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },
  post: (url: string, data: any) => {
    const token = localStorage.getItem('auth-token');
    return axios.post(url, data, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },
  patch: (url: string, data: any) => {
    const token = localStorage.getItem('auth-token');
    return axios.patch(url, data, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }
};

interface Patient {
  id: number;
  folderNumber: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
}

interface Hospitalization {
  id: number;
  patient: Patient;
  roomType: {
    id: number;
    name: string;
    price: number;
  };
  entryDate: string;
  exitDate?: string;
  days?: number;
  price?: number;
  status: 'active' | 'discharged';
}

const HospitalisationsHospitalisation: React.FC = () => {
  const [hospitalizations, setHospitalizations] = useState<Hospitalization[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // États pour les modales
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [selectedHospitalization, setSelectedHospitalization] = useState<Hospitalization | null>(null);
  const [roomForm, setRoomForm] = useState({
    patientId: '',
    roomTypeId: '',
    days: ''
  });
  const [exitDays, setExitDays] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);

  useEffect(() => {
    fetchHospitalizations();
    fetchPatients();
    fetchRoomTypes();

    // Écouter l'événement de nouveau patient hospitalisé
    const handlePatientHospitalized = () => {
      fetchHospitalizations();
    };

    window.addEventListener('patientHospitalized', handlePatientHospitalized);

    // Nettoyer l'écouteur lors du démontage
    return () => {
      window.removeEventListener('patientHospitalized', handlePatientHospitalized);
    };
  }, []);

  const fetchHospitalizations = async () => {
    try {
      const res = await authenticatedAxios.get('/api/hospitalizations');
      // Filtrer les hospitalisations avec des patients HOSP-
      const hospitalisationHospitalizations = res.data.hospitalizations.filter((h: any) => 
        h.patient && h.patient.folderNumber && h.patient.folderNumber.startsWith('HOSP-')
      );
      setHospitalizations(hospitalisationHospitalizations);
    } catch (error: any) {
      setError('Erreur lors du chargement des hospitalisations');
      console.error('Erreur fetch hospitalisations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const res = await authenticatedAxios.get('/api/patients?service=hospitalisation');
      setPatients(res.data.patients || []);
    } catch (error: any) {
      console.error('Erreur fetch patients:', error);
    }
  };

  const fetchRoomTypes = async () => {
    try {
      const res = await authenticatedAxios.get('/api/room-types');
      setRoomTypes(res.data.roomTypes || []);
    } catch (error: any) {
      console.error('Erreur fetch room types:', error);
    }
  };

  const handleOpenRoomModal = (hosp: Hospitalization) => {
    setSelectedHospitalization(hosp);
    setRoomForm({
      patientId: hosp.patient.id.toString(),
      roomTypeId: hosp.roomType.id.toString(),
      days: hosp.days?.toString() || ''
    });
    setShowRoomModal(true);
    setModalError(null);
  };

  const handleRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHospitalization) return;

    try {
      await authenticatedAxios.patch(`/api/hospitalizations/${selectedHospitalization.id}`, {
        roomTypeId: parseInt(roomForm.roomTypeId, 10),
        days: parseInt(roomForm.days, 10)
      });
      setSuccess('Hospitalisation mise à jour avec succès !');
      setShowRoomModal(false);
      fetchHospitalizations();
    } catch (error: any) {
      setModalError(error.response?.data?.error || 'Erreur lors de la mise à jour');
    }
  };

  const handleOpenExitModal = (hosp: Hospitalization) => {
    setSelectedHospitalization(hosp);
    setExitDays('');
    setShowExitModal(true);
    setModalError(null);
  };

  const handleExitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHospitalization || !exitDays) return;

    try {
      const totalPrice = parseInt(exitDays, 10) * (selectedHospitalization.roomType?.price || 0);

      await authenticatedAxios.patch(`/api/hospitalizations/${selectedHospitalization.id}/exit`, {
        days: parseInt(exitDays, 10),
        price: totalPrice
      });
      setSuccess('Sortie d\'hospitalisation enregistrée avec succès !');
      setShowExitModal(false);
      fetchHospitalizations();
    } catch (error: any) {
      setModalError(error.response?.data?.error || 'Erreur lors de la sortie');
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return 0;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const filteredHospitalizations = hospitalizations.filter(h => 
    h.status === 'active' || !h.exitDate
  );

  // Calculer le prix total pour l'affichage
  const calculateTotalPrice = (days: string, roomType: any) => {
    if (!days || !roomType) return 0;
    return parseInt(days, 10) * (roomType.price || 0);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Hospitalisations</h1>
          <p className="text-gray-600">Gestion des hospitalisations</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Chargement...</div>
      ) : (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">N° Dossier</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Âge</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type de chambre</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date d'entrée</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Jours</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredHospitalizations.map((hosp) => (
                  <tr key={hosp.id}>
                    <td className="px-4 py-2">
                      {hosp.patient?.firstName || ''} {hosp.patient?.lastName || ''}
                    </td>
                    <td className="px-4 py-2 font-mono">{hosp.patient?.folderNumber || ''}</td>
                    <td className="px-4 py-2">{calculateAge(hosp.patient?.dateOfBirth || '')} ans</td>
                    <td className="px-4 py-2">{hosp.roomType?.name || ''}</td>
                    <td className="px-4 py-2">
                      {hosp.entryDate ? new Date(hosp.entryDate).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td className="px-4 py-2">{hosp.days || '-'}</td>
                    <td className="px-4 py-2">
                      {hosp.exitDate ? (
                        <span className="text-green-600 font-medium">Sortie</span>
                      ) : (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleOpenRoomModal(hosp)}
                            className="btn-secondary text-xs"
                          >
                            Modifier
                          </button>
                          <button
                            onClick={() => handleOpenExitModal(hosp)}
                            className="btn-primary text-xs"
                          >
                            Sortie
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredHospitalizations.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      Aucune hospitalisation active
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de modification de chambre */}
      {showRoomModal && selectedHospitalization && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Modifier l'hospitalisation</h2>
            <form onSubmit={handleRoomSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Patient</label>
                <input
                  type="text"
                  value={`${selectedHospitalization.patient?.firstName || ''} ${selectedHospitalization.patient?.lastName || ''}`}
                  disabled
                  className="input-field bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Type de chambre</label>
                <select
                  value={roomForm.roomTypeId || ''}
                  onChange={(e) => setRoomForm({ ...roomForm, roomTypeId: e.target.value })}
                  required
                  className="input-field"
                >
                  <option value="">Sélectionner</option>
                  {roomTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre de jours</label>
                <input
                  type="number"
                  value={roomForm.days || ''}
                  onChange={(e) => setRoomForm({ ...roomForm, days: e.target.value })}
                  min="1"
                  required
                  className="input-field"
                />
              </div>
              {modalError && <div className="text-red-600 text-sm">{modalError}</div>}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowRoomModal(false)}
                >
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de sortie */}
      {showExitModal && selectedHospitalization && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Enregistrer la sortie</h2>
            <form onSubmit={handleExitSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Patient</label>
                <input
                  type="text"
                  value={`${selectedHospitalization.patient?.firstName || ''} ${selectedHospitalization.patient?.lastName || ''}`}
                  disabled
                  className="input-field bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Type de chambre</label>
                <input
                  type="text"
                  value={selectedHospitalization.roomType?.name || ''}
                  disabled
                  className="input-field bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre de jours</label>
                <input
                  type="number"
                  value={exitDays || ''}
                  onChange={(e) => setExitDays(e.target.value)}
                  min="1"
                  required
                  className="input-field"
                />
              </div>
              {modalError && <div className="text-red-600 text-sm">{modalError}</div>}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowExitModal(false)}
                >
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  Enregistrer la sortie
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalisationsHospitalisation;
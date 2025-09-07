import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { GlobalErrorBoundary } from '../../components/GlobalErrorBoundary';
import { Routes, Route } from 'react-router-dom';
import Layout from '../../components/Layout';
import Settings from '../admin/Settings';

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  folderNumber: string;
  gender: string;
  dateOfBirth: string;
  weight?: number;
  address: string;
  phone: string;
}

interface Consultation {
  id: number;
  date: string;
  consultation: { id: number; name: string; price: number };
  medications: Treatment[];
  notes?: string; // Added notes to the interface
}

interface Treatment {
  id: number;
  medicationName: string;
  dosage?: string;
  quantity: number;
  notes?: string;
}

interface Exam {
  id: number;
  date: string;
  exam: { id: number; name: string; price: number };
  results?: string;
}

const navigationItems = [
  { name: 'Vue d\'ensemble', href: '/medecin', icon: (
    <svg className="mr-3 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" /></svg>
  ) },
  { name: 'Patients & Dossiers', href: '/medecin/patients', icon: (
    <svg className="mr-3 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
  ) },
];

function MedecinOverview() {
  const [stats, setStats] = React.useState({
    total: 0,
    today: 0,
    month: 0,
    loading: true,
    error: null as string | null
  });

  React.useEffect(() => {
    setStats(s => ({ ...s, loading: true, error: null }));
    import('axios').then(({ default: axios }) => {
      axios.get('/api/patients')
        .then(res => {
          const patients = res.data.patients || [];
          const now = new Date();
          const todayStr = now.toISOString().slice(0, 10);
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          const total = patients.length;
          const today = patients.filter((p: any) => (p.createdAt || '').slice(0, 10) === todayStr).length;
          const month = patients.filter((p: any) => {
            const created = new Date(p.createdAt);
            return created >= lastMonth && created <= now;
          }).length;
          setStats({ total, today, month, loading: false, error: null });
        })
        .catch(() => setStats(s => ({ ...s, loading: false, error: 'Erreur lors du chargement des statistiques' })));
    });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Vue d'ensemble - Médecin</h1>
        <p className="mt-1 text-sm text-gray-500">
          Tableau de bord du médecin de la Polyclinique des Apôtres
        </p>
      </div>
      {stats.error && <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4 text-red-700">{stats.error}</div>}
      {stats.loading ? (
        <div className="text-center py-8">Chargement...</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Patients total */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Patients total</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          {/* Patients du jour */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Patients du jour</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.today}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          {/* Patients du dernier mois */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Patients du dernier mois</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.month}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PatientsDossiers() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [dossier, setDossier] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [consultationTypes, setConsultationTypes] = useState<any[]>([]);
  const [newConsultation, setNewConsultation] = useState({ typeId: '', notes: '' });
  const [addingConsultation, setAddingConsultation] = useState(false);
  const [treatmentForms, setTreatmentForms] = useState<{ [consultationId: number]: { medicationName: string; notes: string; loading: boolean; visible: boolean } }>({});
  
  // États pour la modification des notes de consultation
  const [editingConsultationId, setEditingConsultationId] = useState<number | null>(null);
  const [editNotesInputs, setEditNotesInputs] = useState<{ [consultationId: number]: string }>({});
  const [updatingConsultationId, setUpdatingConsultationId] = useState<number | null>(null);

  // États pour la recherche et filtres
  const [searchTerm, setSearchTerm] = useState('');

  // Fonction helper pour récupérer le nom du type de consultation
  const getSelectedConsultationTypeName = () => {
    if (!newConsultation.typeId || !consultationTypes.length) return null;
    const selectedType = consultationTypes.find(ct => ct.id.toString() === newConsultation.typeId);
    return selectedType?.name || null;
  };

  // Vérifier si une consultation est du jour
  const isConsultationToday = (consultationDate: string) => {
    const today = new Date().toISOString().slice(0, 10);
    const consultationDay = new Date(consultationDate).toISOString().slice(0, 10);
    return today === consultationDay;
  };

  // Fonction pour vérifier si une consultation peut être modifiée (dans les 5 minutes)
  const canEditConsultation = (consultation: any) => {
    const now = new Date();
    const updatedAt = new Date(consultation.updatedAt || consultation.date);
    const timeDifference = now.getTime() - updatedAt.getTime();
    const fiveMinutesInMs = 5 * 60 * 1000; // 5 minutes en millisecondes
    
    return timeDifference <= fiveMinutesInMs;
  };

  // Fonction pour commencer la modification des notes
  const handleStartEditNotes = (consultation: any) => {
    setEditingConsultationId(consultation.id);
    setEditNotesInputs(prev => ({
      ...prev,
      [consultation.id]: consultation.notes || ''
    }));
  };

  // Fonction pour annuler la modification
  const handleCancelEditNotes = () => {
    setEditingConsultationId(null);
  };

  // Fonction pour sauvegarder la modification des notes
  const handleSaveEditNotes = async (consultationId: number) => {
    setUpdatingConsultationId(consultationId);
    setError(null);
    
    try {
      const response = await axios.patch(`/api/consultations/${consultationId}/edit-notes`, {
        notes: editNotesInputs[consultationId]
      });
      
      console.log('✅ Notes modifiées:', response.data);
      
      // Rafraîchir le dossier
      if (selectedPatient) {
        const dossierRes = await axios.get(`/api/patients/${selectedPatient.id}/dossier`);
        setDossier(dossierRes.data);
      }
      
      setEditingConsultationId(null);
      
    } catch (error: any) {
      console.error('Erreur lors de la modification:', error);
      if (error.response?.status === 403) {
        setError('La période de modification (5 minutes) est expirée.');
      } else {
        setError(error.response?.data?.error || 'Erreur lors de la modification des notes');
      }
    } finally {
      setUpdatingConsultationId(null);
    }
  };

  // Initialiser un formulaire de traitement fermé
  const initializeTreatmentForm = (consultationId: number) => {
    setTreatmentForms(forms => ({
      ...forms,
      [consultationId]: {
        medicationName: '',
        notes: '',
        loading: false,
        visible: false // Toujours fermé par défaut
      }
    }));
  };

  // Regrouper les examens par date
  const getExamsForDate = (consultationDate: string) => {
    if (!dossier?.exams) return [];
    const consultationDay = new Date(consultationDate).toISOString().slice(0, 10);
    return dossier.exams.filter((exam: any) => {
      const examDay = new Date(exam.date).toISOString().slice(0, 10);
      return examDay === consultationDay;
    });
  };

  // Filtrer les patients selon les critères
  const filteredPatients = patients.filter(patient => {
    const matchesSearch = 
      patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.folderNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Charger la liste des patients au montage
  useEffect(() => {
    setLoading(true);
    axios.get('/api/patients')
      .then(res => setPatients(res.data.patients))
      .catch(() => setError('Erreur lors du chargement des patients'))
      .finally(() => setLoading(false));
  }, []);

  // Charger le dossier du patient sélectionné
  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setLoading(true);
    axios.get(`/api/patients/${patient.id}/dossier`)
      .then(res => {
        setDossier(res.data);
        
        // Chercher la consultation la plus récente (aujourd'hui ou la plus récente)
        const today = new Date().toISOString().slice(0, 10);
        let selectedConsultation = null;
        
        if (res.data.consultations && res.data.consultations.length > 0) {
          // D'abord chercher une consultation d'aujourd'hui
          selectedConsultation = res.data.consultations.find((c: any) => 
            c.date?.slice(0, 10) === today
          );
          
          // Si pas de consultation aujourd'hui, prendre la plus récente
          if (!selectedConsultation) {
            selectedConsultation = res.data.consultations[0]; // La plus récente (triée par date desc)
          }
        }
        
        if (selectedConsultation) {
          console.log('Consultation sélectionnée à la caisse:', selectedConsultation);
          setNewConsultation(prev => ({
            ...prev,
            typeId: selectedConsultation.consultation.id.toString()
          }));
        } else {
          // Si pas de consultation, réinitialiser
          setNewConsultation({ typeId: '', notes: '' });
        }
      })
      .catch(() => setError('Erreur lors du chargement du dossier patient'))
      .finally(() => setLoading(false));
  };

  // Charger les types de consultation quand un patient est sélectionné
  useEffect(() => {
    if (selectedPatient) {
      axios.get('/api/consultations/types')
        .then(res => setConsultationTypes(res.data.consultationTypes))
        .catch(() => setError('Erreur lors du chargement des types de consultation'));
    }
  }, [selectedPatient]);

  // Ajouter une nouvelle consultation (signes uniquement, pas de traitement)
  const handleAddConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    setAddingConsultation(true);
    setError(null);
    try {
      console.log('Envoi de la consultation avec signes:', {
        patientId: selectedPatient.id,
        consultationTypeId: newConsultation.typeId,
        date: new Date().toISOString(),
        notes: newConsultation.notes
      });
      
      const res = await axios.post('/api/consultations', {
        patientId: selectedPatient.id,
        consultationTypeId: newConsultation.typeId, // Utilise le type auto-sélectionné
        date: new Date().toISOString(),
        notes: newConsultation.notes
      });
      
      console.log('Réponse de la création de consultation:', res.data);
      
      // Rafraîchir le dossier
      const dossierRes = await axios.get(`/api/patients/${selectedPatient.id}/dossier`);
      console.log('Dossier mis à jour:', dossierRes.data);
      setDossier(dossierRes.data);
      
      // Réinitialiser le formulaire de consultation
      setNewConsultation({ typeId: '', notes: '' });
      
      // S'assurer que tous les formulaires de traitement sont fermés
      setTreatmentForms({});
      
    } catch (err: any) {
      console.error('Erreur lors de l\'ajout de la consultation:', err);
      setError('Erreur lors de l\'ajout de la consultation');
    } finally {
      setAddingConsultation(false);
    }
  };

  // Gérer la saisie du formulaire de traitement pour chaque consultation
  const handleTreatmentChange = (consultationId: number, field: string, value: string) => {
    setTreatmentForms(forms => ({
      ...forms,
      [consultationId]: {
        ...forms[consultationId],
        [field]: value
      }
    }));
  };

  // Afficher/masquer le formulaire de traitement
  const toggleTreatmentForm = (consultationId: number, consultationDate: string) => {
    // Empêcher l'ouverture du formulaire pour les consultations passées
    if (!isConsultationToday(consultationDate)) {
      return;
    }
    
    // Initialiser le formulaire s'il n'existe pas encore
    if (!treatmentForms[consultationId]) {
      initializeTreatmentForm(consultationId);
    }
    
    setTreatmentForms(forms => ({
      ...forms,
      [consultationId]: {
        ...forms[consultationId],
        visible: !forms[consultationId]?.visible
      }
    }));
  };

  // Ajouter un traitement à une consultation
  const handleAddTreatment = async (consultationId: number, e: React.FormEvent) => {
    e.preventDefault();
    const form = treatmentForms[consultationId];
    if (!form || !form.medicationName) return;
    setTreatmentForms(forms => ({ ...forms, [consultationId]: { ...form, loading: true } }));
    setError(null);
    try {
      await axios.post(`/api/consultations/${consultationId}/treatments`, {
        medicationName: form.medicationName,
        notes: form.notes
      });
      // Rafraîchir le dossier
      if (selectedPatient) {
        const dossierRes = await axios.get(`/api/patients/${selectedPatient.id}/dossier`);
        setDossier(dossierRes.data);
      }
      setTreatmentForms(forms => ({ 
        ...forms, 
        [consultationId]: { 
          medicationName: '', 
          notes: '', 
          loading: false,
          visible: false 
        } 
      }));
    } catch {
      setError("Erreur lors de l'ajout du traitement");
      setTreatmentForms(forms => ({ ...forms, [consultationId]: { ...form, loading: false } }));
    }
  };

  return (
    <div className="p-6">
      <h2 className="font-semibold text-lg mb-2">Liste des patients</h2>
      {loading && <div>Chargement...</div>}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste des patients */}
        <div className="lg:col-span-1">
          <h2 className="font-semibold text-lg mb-4">Sélectionner un patient</h2>
          
          {/* Barre de recherche et filtres */}
          <div className="mb-4 space-y-3">
            {/* Recherche */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Rechercher par nom, prénom ou dossier..."
                className="input-field flex-1"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              
              <button
                onClick={() => setSearchTerm('')}
                className="btn-secondary px-3"
                title="Réinitialiser la recherche"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            
            {/* Indicateur de résultats */}
            {searchTerm && (
              <div className="text-sm text-gray-600">
                {filteredPatients.length} patient(s) trouvé(s)
                {patients.length !== filteredPatients.length && ` sur ${patients.length} total`}
              </div>
            )}
          </div>

          {/* Liste des patients filtrés */}
          <div className="max-h-96 overflow-y-auto border rounded">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Chargement...</div>
            ) : filteredPatients.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {searchTerm ? 'Aucun patient trouvé' : 'Aucun patient enregistré'}
              </div>
            ) : (
              filteredPatients.map(patient => (
                <div
                  key={patient.id}
                  onClick={() => handleSelectPatient(patient)}
                  className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedPatient?.id === patient.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{patient.firstName} {patient.lastName}</div>
                      <div className="text-sm text-gray-600">
                        Dossier: {patient.folderNumber}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full ${
                        patient.gender === 'M' || patient.gender === 'Masculin' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                      }`}>
                        {patient.gender === 'M' || patient.gender === 'Masculin' ? 'Homme' : 
                         patient.gender === 'F' || patient.gender === 'Féminin' ? 'Femme' : 
                         patient.gender || 'Non spécifié'}
                      </span>
                      {patient.weight && (
                        <span className="text-gray-400">
                          {patient.weight} kg
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
          {/* Dossier de patient sélectionné */}
      {selectedPatient && dossier ? (
            <div className="lg:col-span-2">
          <h2 className="font-semibold text-lg mb-2">Dossier de {selectedPatient.lastName} {selectedPatient.firstName}</h2>
              
              {/* Informations du patient */}
              <div className="mb-6 p-4 bg-gray-50 rounded border">
                <h3 className="font-semibold text-gray-800 mb-3">Informations du patient</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Dossier :</span> 
                    <span className="ml-2 text-gray-600">{selectedPatient.folderNumber}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Sexe :</span> 
                    <span className="ml-2 text-gray-600">{selectedPatient.gender}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Date de naissance :</span> 
                    <span className="ml-2 text-gray-600">{new Date(selectedPatient.dateOfBirth).toLocaleDateString()}</span>
                  </div>
                  {selectedPatient.weight && (
                    <div>
                      <span className="font-medium text-gray-700">Poids :</span> 
                      <span className="ml-2 text-gray-600">{selectedPatient.weight} kg</span>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-gray-700">Adresse :</span> 
                    <span className="ml-2 text-gray-600">{selectedPatient.address}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Téléphone :</span> 
                    <span className="ml-2 text-gray-600">{selectedPatient.phone}</span>
                  </div>
                </div>
          </div>
          {/* Formulaire ajout consultation */}
          <form className="mb-6 p-4 bg-blue-50 rounded" onSubmit={handleAddConsultation}>
            <h3 className="font-semibold mb-2">Ajouter une consultation</h3>
                
                {/* Affichage du type de consultation sélectionné à la caisse */}
                {newConsultation.typeId && consultationTypes.length > 0 && (
                  <div className="mb-3 p-3 bg-green-100 rounded border-l-4 border-green-400">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <span className="text-sm font-medium text-green-800">Type de consultation sélectionné à la caisse :</span>
                        <div className="text-sm text-green-700 mt-1">
                          {getSelectedConsultationTypeName() || 'Type non trouvé'}
                        </div>
                      </div>
                    </div>
            </div>
                )}
                
            <div className="mb-2">
              <label className="block text-sm mb-1">Signes / maladie</label>
              <textarea
                className="input-field"
                value={newConsultation.notes}
                onChange={e => setNewConsultation(c => ({ ...c, notes: e.target.value }))}
                    placeholder="Décrire les signes et maladies observés"
                    rows={3}
              />
            </div>
                <button type="submit" className="btn-primary" disabled={addingConsultation || !newConsultation.typeId}>
              {addingConsultation ? 'Ajout...' : 'Ajouter la consultation'}
            </button>
          </form>
          <div className="mb-4">
                <h3 className="font-semibold mb-3">Historique médical</h3>
                <ul className="space-y-4">
                  {(dossier?.consultations ?? []).map((c: Consultation) => (
                    <li key={c.id} className="p-4 bg-white border rounded shadow-sm">
                      <div className="mb-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-blue-600">{c.consultation.name}</span> 
                          <span className="text-sm text-gray-500">le {new Date(c.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      {/* Signes et maladies */}
                      {c.notes && (
                        <div className="mb-3 p-3 bg-yellow-50 rounded border-l-4 border-yellow-400">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center">
                              <svg className="w-4 h-4 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                              </svg>
                              <strong className="text-yellow-800 text-sm">Signes et maladies :</strong>
                            </div>
                            {/* Bouton modifier (visible seulement dans les 5 minutes) */}
                            {canEditConsultation(c) && editingConsultationId !== c.id && (
                              <button
                                onClick={() => handleStartEditNotes(c)}
                                className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded hover:bg-yellow-200 transition-colors"
                              >
                                Modifier
                              </button>
                            )}
                          </div>
                          
                          {/* Mode édition */}
                          {editingConsultationId === c.id ? (
                            <div className="ml-6 space-y-2">
                              <textarea
                                className="w-full p-2 border rounded text-sm"
                                rows={3}
                                value={editNotesInputs[c.id] || ''}
                                onChange={(ev) => setEditNotesInputs(prev => ({ ...prev, [c.id]: ev.target.value }))}
                                placeholder="Modifier les notes..."
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleSaveEditNotes(c.id)}
                                  disabled={updatingConsultationId === c.id}
                                  className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50"
                                >
                                  {updatingConsultationId === c.id ? 'Sauvegarde...' : 'Sauvegarder'}
                                </button>
                                <button
                                  onClick={handleCancelEditNotes}
                                  className="text-xs bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
                                >
                                  Annuler
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-700 ml-6 whitespace-pre-wrap">{c.notes}</p>
                          )}
                        </div>
                      )}
                      
                      {/* Traitements prescrits */}
                      {c.medications && c.medications.length > 0 && (
                        <div className="mb-3">
                          <div className="flex items-center mb-2">
                            <svg className="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <strong className="text-green-700 text-sm">Traitements prescrits :</strong>
                          </div>
                          <ul className="ml-6 space-y-1">
                            {(c.medications ?? []).map((m: Treatment) => (
                              <li key={m.id} className="text-sm p-2 bg-green-50 rounded border-l-4 border-green-400">
                                <div className="flex items-center justify-between">
                  <div>
                                    <strong>{m.medicationName}</strong> 
                                    {m.notes && <span className="text-gray-600 ml-1">- {m.notes}</span>}
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Examens réalisés pour cette consultation */}
                      {getExamsForDate(c.date).length > 0 && (
                        <div className="mb-3">
                          <div className="flex items-center mb-2">
                            <svg className="w-4 h-4 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <strong className="text-purple-700 text-sm">Examens réalisés :</strong>
                          </div>
                          <ul className="ml-6 space-y-2">
                            {getExamsForDate(c.date).map((e: Exam) => (
                              <li key={e.id} className="text-sm p-3 bg-purple-50 rounded border-l-4 border-purple-400">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center">
                                    <strong className="text-purple-800">{e.exam.name}</strong>
                                  </div>
                                  <span className="text-sm text-gray-500">le {new Date(e.date).toLocaleDateString()}</span>
                                </div>
                                {e.results && (
                                  <div className="mt-2 p-2 bg-white rounded border">
                                    <div className="flex items-center mb-1">
                                      <svg className="w-3 h-3 text-purple-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      <span className="text-xs font-medium text-purple-700">Résultat :</span>
                                    </div>
                                    <div className="text-xs text-gray-700 ml-4 whitespace-pre-wrap">{e.results}</div>
                  </div>
                                )}
                              </li>
                      ))}
                    </ul>
                        </div>
                      )}
                      
                      {/* Formulaire ajout traitement - seulement pour les consultations du jour */}
                      {isConsultationToday(c.date) ? (
                        treatmentForms[c.id]?.visible ? (
                          <form className="mt-4 p-3 bg-gray-50 rounded border" onSubmit={e => handleAddTreatment(c.id, e)}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center">
                                <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                <span className="text-sm font-medium text-gray-700">Ajouter un traitement :</span>
                              </div>
                              <button 
                                type="button" 
                                onClick={() => toggleTreatmentForm(c.id, c.date)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                            <div className="flex gap-2 mb-2">
                              <textarea
                        className="input-field flex-1"
                        placeholder="Médicament prescrit"
                        value={treatmentForms[c.id]?.medicationName || ''}
                        onChange={e => handleTreatmentChange(c.id, 'medicationName', e.target.value)}
                                rows={3}
                        required
                      />
                              <textarea
                                className="input-field flex-1"
                      placeholder="Notes (optionnel)"
                      value={treatmentForms[c.id]?.notes || ''}
                      onChange={e => handleTreatmentChange(c.id, 'notes', e.target.value)}
                                rows={3}
                    />
                            </div>
                            <div className="flex gap-2">
                    <button type="submit" className="btn-primary btn-xs" disabled={treatmentForms[c.id]?.loading}>
                      {treatmentForms[c.id]?.loading ? 'Ajout...' : 'Ajouter traitement'}
                    </button>
                              <button 
                                type="button" 
                                onClick={() => toggleTreatmentForm(c.id, c.date)}
                                className="btn-secondary btn-xs"
                              >
                                Annuler
                              </button>
                            </div>
                  </form>
                        ) : (
                          <div className="mt-3">
                            <button 
                              type="button" 
                              onClick={() => toggleTreatmentForm(c.id, c.date)}
                              className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              Ajouter un traitement
                            </button>
                          </div>
                        )
                      ) : (
                        <div className="mt-3 text-sm text-gray-500 italic">
                          Consultation passée - Traitements en lecture seule
                        </div>
                      )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="text-gray-500">Sélectionnez un patient pour voir son dossier.</div>
      )}
        </div>
    </div>
  );
}

const MedecinDashboard: React.FC = () => {
  return (
    <Layout title="Médecin" navigationItems={navigationItems} settingsPath="/medecin/settings">
      <GlobalErrorBoundary>
        <Routes>
          <Route path="/" element={<MedecinOverview />} />
          <Route path="/patients" element={<PatientsDossiers />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </GlobalErrorBoundary>
    </Layout>
  );
};

export default MedecinDashboard; 
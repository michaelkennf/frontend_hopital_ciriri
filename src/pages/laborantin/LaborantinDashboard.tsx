import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { GlobalErrorBoundary } from '../../components/GlobalErrorBoundary';
import { Routes, Route } from 'react-router-dom';
import Layout from '../../components/Layout';

// Styles CSS pour les composants
const styles = {
  inputField: "w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
  btnPrimary: "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed",
  btnSecondary: "inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
  btnXs: "inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
};

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  folderNumber: string;
  gender: string;
  dateOfBirth: string;
  weight?: number;
  address?: string;
  phone?: string;
}

interface Exam {
  id: number;
  date: string;
  examType: { id: number; name: string; price: number };
  results?: string;
  status: 'scheduled' | 'completed';
  updatedAt?: string;
}

const navigationItems = [
  { name: 'Vue d\'ensemble', href: '/laborantin', icon: (
    <svg className="mr-3 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" /></svg>
  ) },
  { name: 'Patients & Examens', href: '/laborantin/patients', icon: (
    <svg className="mr-3 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
  ) },
];

// Fonction helper pour formater l'affichage du sexe
const formatGender = (gender: string): string => {
  if (!gender) return 'Non spécifié';
  
  const genderLower = gender.toLowerCase();
  if (genderLower === 'm' || genderLower === 'masculin' || genderLower === 'h' || genderLower === 'homme') {
    return 'Homme';
  } else if (genderLower === 'f' || genderLower === 'féminin' || genderLower === 'femme' || genderLower === 'feminin') {
    return 'Femme';
  }
  
  return gender;
};

// Fonction helper pour obtenir la classe CSS du sexe
const getGenderClass = (gender: string): string => {
  const genderLower = gender?.toLowerCase();
  if (genderLower === 'm' || genderLower === 'masculin' || genderLower === 'h' || genderLower === 'homme') {
    return 'bg-blue-100 text-blue-800';
  } else if (genderLower === 'f' || genderLower === 'féminin' || genderLower === 'femme') {
    return 'bg-pink-100 text-pink-800';
  }
  return 'bg-gray-100 text-gray-800';
};

function LaborantinOverview() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get('/api/exams/stats');
        setStats(response.data);
      } catch (err: any) {
        console.error('Erreur lors du chargement des statistiques:', err);
        setError(err.response?.data?.error || 'Erreur lors du chargement des statistiques');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Tableau de bord Laborantin</h1>
      <p className="text-gray-600 mb-6">Bienvenue sur votre espace laborantin. Consultez les patients et réalisez les examens programmés.</p>
      
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
          <p className="font-medium">Erreur de chargement :</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Chargement des statistiques...</p>
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Statistiques aujourd'hui */}
          <div className="bg-white p-6 rounded-lg shadow-md border">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Aujourd'hui</h3>
                <p className="text-sm text-gray-600">{new Date().toLocaleDateString('fr-FR')}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Examens réalisés</span>
                <span className="text-2xl font-bold text-blue-600">{stats.today?.exams || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Patients consultés</span>
                <span className="text-2xl font-bold text-green-600">{stats.today?.patients || 0}</span>
              </div>
            </div>
          </div>

          {/* Statistiques ce mois */}
          <div className="bg-white p-6 rounded-lg shadow-md border">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-green-100 text-green-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Ce mois</h3>
                <p className="text-sm text-gray-600">{new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Examens réalisés</span>
                <span className="text-2xl font-bold text-green-600">{stats.thisMonth?.exams || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Patients consultés</span>
                <span className="text-2xl font-bold text-blue-600">{stats.thisMonth?.patients || 0}</span>
              </div>
            </div>
          </div>

          {/* Statistiques mois passé */}
          <div className="bg-white p-6 rounded-lg shadow-md border">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-purple-100 text-purple-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Mois passé</h3>
                <p className="text-sm text-gray-600">
                  {new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Examens réalisés</span>
                <span className="text-2xl font-bold text-purple-600">{stats.lastMonth?.exams || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Patients consultés</span>
                <span className="text-2xl font-bold text-purple-600">{stats.lastMonth?.patients || 0}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          Aucune donnée disponible
        </div>
      )}
    </div>
  );
} 

function PatientsExamens({ 
  patients, 
  selectedPatient, 
  dossier, 
  loading, 
  error, 
  searchTerm, 
  addingExam, 
  newExamResult,
  onSearchTermChange,
  onSelectPatient,
  onMarkAsCompleted,
  onNewExamResultChange,
  onRefreshDossier,
  onRefreshPatients
}: {
  patients: Patient[];
  selectedPatient: Patient | null;
  dossier: any;
  loading: boolean;
  error: string | null;
  searchTerm: string;
  addingExam: boolean;
  newExamResult: string;
  onSearchTermChange: (term: string) => void;
  onSelectPatient: (patient: Patient) => void;
  onMarkAsCompleted: (exam: Exam) => void;
  onNewExamResultChange: (result: string) => void;
  onRefreshDossier: () => void;
  onRefreshPatients: () => void;
}) {
  // État pour forcer la mise à jour de l'interface en temps réel
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Mise à jour en temps réel pour maintenir l'interface active
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Mise à jour toutes les secondes
    
    return () => clearInterval(interval);
  }, []);
  
  // Fonction pour vérifier si un examen peut être modifié (dans les 5 minutes)
  const canEditExam = (exam: Exam, allExams: any[]) => {
    // Désactivé - plus de modification des résultats
    return false;
  };

  // Filtrer les patients selon le terme de recherche
  const filteredPatients = patients.filter(patient => {
    const searchLower = searchTerm.toLowerCase();
    return (
      patient.lastName?.toLowerCase().includes(searchLower) ||
      patient.firstName?.toLowerCase().includes(searchLower) ||
      patient.folderNumber?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="p-6">
      <h2 className="font-semibold text-lg mb-2">Patients & Examens</h2>
      <p className="text-gray-600 mb-6">Interface pour réaliser les examens programmés et modifier les résultats dans les 5 minutes après soumission.</p>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-medium">Erreur</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste des patients */}
        <div className="lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Sélectionner un patient</h2>
            <button
              onClick={onRefreshPatients}
              className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors text-sm"
              title="Rafraîchir la liste des patients"
            >
              <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Rafraîchir
            </button>
          </div>
          
          {/* Barre de recherche et filtres */}
          <div className="mb-4 space-y-3">
            {/* Recherche */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Rechercher par nom, prénom ou dossier..."
                className={styles.inputField}
                value={searchTerm}
                onChange={(e) => onSearchTermChange(e.target.value)}
              />
              
              <button
                onClick={() => onSearchTermChange('')}
                className={`${styles.btnSecondary} px-3`}
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
                {searchTerm ? 'Aucun patient trouvé' : 'Aucun patient avec examens programmés'}
              </div>
            ) : (
              filteredPatients.map(patient => (
                <div
                  key={patient.id}
                  onClick={() => onSelectPatient(patient)}
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
                      <div className="text-xs text-gray-500">
                        {patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString('fr-FR') : 'Date non spécifiée'}
                      </div>
                      {/* Indicateur de service */}
                      <div className="text-xs mt-1">
                        <span className={`px-2 py-1 rounded-full ${
                          (patient as any).service === 'Maternité' 
                            ? 'bg-pink-100 text-pink-800' 
                            : (patient as any).service === 'Patient visiteur'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {(patient as any).service === 'Maternité' ? '🤱 Maternité' : 
                           (patient as any).service === 'Patient visiteur' ? '👤 Visiteur' :
                           '🏥 Hospitalisation'}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full ${getGenderClass(patient.gender)}`}>
                        {formatGender(patient.gender)}
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Dossier de {selectedPatient.lastName} {selectedPatient.firstName}</h2>
              <button
                onClick={onRefreshDossier}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-sm"
                title="Rafraîchir le dossier"
              >
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Rafraîchir
              </button>
            </div>
            
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
                  <span className="ml-2 text-gray-600">{formatGender(selectedPatient.gender)}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Date de naissance :</span> 
                  <span className="ml-2 text-gray-600">{selectedPatient.dateOfBirth ? new Date(selectedPatient.dateOfBirth).toLocaleDateString('fr-FR') : 'Non spécifiée'}</span>
                </div>
                {selectedPatient.weight && (
                  <div>
                    <span className="font-medium text-gray-700">Poids :</span> 
                    <span className="ml-2 text-gray-600">{selectedPatient.weight} kg</span>
                  </div>
                )}
                {selectedPatient.address && (
                  <div>
                    <span className="font-medium text-gray-700">Adresse :</span> 
                    <span className="ml-2 text-gray-600">{selectedPatient.address}</span>
                  </div>
                )}
                {selectedPatient.phone && (
                  <div>
                    <span className="font-medium text-gray-700">Téléphone :</span> 
                    <span className="ml-2 text-gray-600">{selectedPatient.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Formulaire pour ajouter un résultat d'examen */}
            <div className="mb-6 p-4 bg-green-50 rounded border-l-4 border-green-400">
              <h3 className="font-semibold mb-2 text-green-800">Ajouter un résultat d'examen</h3>
              
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Résultat de l'examen *</label>
                <textarea
                  className={styles.inputField}
                  rows={3}
                  value={newExamResult}
                  onChange={e => onNewExamResultChange(e.target.value)}
                  placeholder="Saisir le résultat de l'examen..."
                  required
                />
              </div>
              
              <button 
                className={styles.btnPrimary}
                disabled={addingExam || !newExamResult.trim()}
                onClick={() => {
                  // Trouver le premier examen programmé
                  const scheduledExam = dossier.exams?.find((e: any) => e.status === 'scheduled');
                  if (scheduledExam) {
                    onMarkAsCompleted(scheduledExam);
                  }
                }}
              >
                {addingExam ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Validation...
                  </div>
                ) : (
                  'Marquer comme réalisé'
                )}
              </button>
            </div>
            
            {/* Historique des examens */}
            <div className="mb-4">
              <h3 className="font-semibold mb-3">Examens du patient</h3>
              {dossier.exams && dossier.exams.length > 0 ? (
                <div className="space-y-3">
                  {dossier.exams.map((exam: any) => {
                    const isCompleted = exam.status === 'completed';
                    const isScheduled = exam.status === 'scheduled';
                    
                    return (
                      <div key={exam.id} className={`bg-white p-4 rounded-lg border shadow-sm ${
                        isCompleted ? 'border-green-200' : 'border-yellow-200'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            {isCompleted ? (
                              <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                            <span className="font-medium text-gray-900">{exam.examType?.name || 'Examen'}</span>
                            <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                              isCompleted 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {isCompleted ? 'Réalisé' : 'Programmé'}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">
                            <div>le {new Date(exam.date).toLocaleDateString('fr-FR')}</div>
                            <div>à {new Date(exam.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                            {exam.updatedAt && exam.updatedAt !== exam.date && (
                              <div className="text-xs text-blue-600 mt-1">
                                Soumis le {new Date(exam.updatedAt).toLocaleDateString('fr-FR')} 
                                à {new Date(exam.updatedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Affichage du résultat si existant */}
                        {exam.results && (
                          <div className="mt-3 p-3 bg-gray-50 rounded border-l-4 border-blue-400">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center">
                                <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <strong className="text-blue-800 text-sm">Résultat :</strong>
                              </div>
                            </div>
                            
                            {/* Affichage du résultat en lecture seule */}
                            <div className="text-sm text-gray-700 ml-6 whitespace-pre-wrap">{exam.results}</div>
                            
                            {/* Informations sur l'examen - version simplifiée */}
                            <div className="text-xs text-gray-500 mt-2 ml-6">
                              {exam.updatedAt && (
                                <div className="text-gray-500">
                                  Soumis le {new Date(exam.updatedAt).toLocaleDateString('fr-FR')} 
                                  à {new Date(exam.updatedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-gray-500 text-center py-4 bg-gray-50 rounded">
                  Aucun examen programmé ou réalisé pour ce patient.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 text-gray-500 text-center py-8 bg-gray-50 rounded">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <p className="text-lg font-medium">Aucun patient sélectionné</p>
            <p className="text-sm">Cliquez sur un patient dans la liste pour voir ses examens.</p>
          </div>
        )}
      </div>
    </div>
  );
} 

const LaborantinDashboard: React.FC = () => {
  // États gérés au niveau parent pour persister lors de la navigation
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [dossier, setDossier] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // États pour la gestion des examens
  const [addingExam, setAddingExam] = useState(false);
  const [newExamResult, setNewExamResult] = useState('');

  // Charger la liste des patients au montage
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    const loadPatients = async () => {
      try {
        const response = await axios.get('/api/exams/scheduled');
        const scheduledExams = response.data.exams || [];
        
        // Créer une liste unique de patients avec des examens programmés
        const patientsWithExams = scheduledExams.map((exam: any) => {
          const patient = exam.patient;
          let service = 'Patient visiteur';
          
          if (exam.hospitalizationId) {
            service = 'Hospitalisation';
          } else if (exam.maternityHistoryId) {
            service = 'Maternité';
          } else {
            service = 'Caisse';
          }
          
          return {
            ...patient,
            service,
            examId: exam.id,
            examDate: exam.date,
            examStatus: exam.status,
            examType: exam.examType?.name || 'Examen'
          };
        });
        
        // Dédupliquer les patients en gardant tous les examens
        const uniquePatients = patientsWithExams.filter((patient: any, index: number, self: any[]) => 
          patient?.id && index === self.findIndex((p: any) => p?.id === patient?.id)
        );
        
        // Ajouter les nouveaux patients à la liste existante au lieu de les remplacer
        setPatients(prevPatients => {
          const existingPatientIds = new Set(prevPatients.map((p: Patient) => p.id));
          const newPatients = uniquePatients.filter((p: any) => !existingPatientIds.has(p.id));
          
          if (newPatients.length > 0) {
            console.log(`✅ ${newPatients.length} nouveaux patients ajoutés à la liste existante`);
          }
          
          // Retourner la liste complète : anciens + nouveaux patients
          const updatedList = [...prevPatients, ...newPatients];
          console.log(`📊 Total patients dans la liste: ${updatedList.length}`);
          return updatedList;
        });
        
        // Si un patient est déjà sélectionné, maintenir son dossier
        if (selectedPatient && !uniquePatients.find((p: Patient) => p.id === selectedPatient.id)) {
          console.log('⚠️ Patient sélectionné n\'a plus d\'examens programmés, mais on garde le dossier');
        }
        
      } catch (error: any) {
        console.error('❌ Erreur lors du chargement des patients:', error);
        setError('Erreur lors du chargement des patients');
        
        // En cas d'erreur, garder les patients existants si possible
        if (patients.length === 0) {
          setError('Impossible de charger les patients. Vérifiez votre connexion.');
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadPatients();
  }, []); // Charger seulement au montage

  // Fonction pour rafraîchir la liste des patients sans perdre les existants
  const handleRefreshPatients = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('/api/exams/scheduled');
      const scheduledExams = response.data.exams || [];
      
      // Créer une liste unique de patients avec des examens programmés
      const patientsWithExams = scheduledExams.map((exam: any) => {
        const patient = exam.patient;
        let service = 'Patient visiteur';
        
        if (exam.hospitalizationId) {
          service = 'Hospitalisation';
        } else if (exam.maternityHistoryId) {
          service = 'Maternité';
        } else {
          service = 'Caisse';
        }
        
        return {
          ...patient,
          service,
          examId: exam.id,
          examDate: exam.date,
          examStatus: exam.status,
          examType: exam.examType?.name || 'Examen'
        };
      });
      
      // Dédupliquer les patients
      const uniquePatients = patientsWithExams.filter((patient: any, index: number, self: any[]) => 
        patient?.id && index === self.findIndex((p: any) => p?.id === patient?.id)
      );
      
      // Mettre à jour la liste en préservant tous les patients existants
      setPatients(prevPatients => {
        const existingPatientIds = new Set(prevPatients.map((p: Patient) => p.id));
        const newPatients = uniquePatients.filter((p: any) => !existingPatientIds.has(p.id));
        
        if (newPatients.length > 0) {
          console.log(`🔄 ${newPatients.length} nouveaux patients ajoutés lors du rafraîchissement`);
        }
        
        // Retourner la liste complète : anciens + nouveaux patients
        const updatedList = [...prevPatients, ...newPatients];
        console.log(`📊 Total patients après rafraîchissement: ${updatedList.length}`);
        return updatedList;
      });
      
    } catch (error: any) {
      console.error('❌ Erreur lors du rafraîchissement des patients:', error);
      setError('Erreur lors du rafraîchissement des patients');
    } finally {
      setLoading(false);
    }
  };

  // Charger le dossier du patient sélectionné
  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setLoading(true);
    setError(null);
    
    const loadDossier = async () => {
      try {
        const response = await axios.get(`/api/exams/history/${patient.id}`);
        setDossier(response.data);
        console.log('✅ Dossier chargé pour:', patient.firstName, patient.lastName);
        
        // Vérifier que le dossier contient des examens
        if (response.data.exams && response.data.exams.length > 0) {
          const scheduledExams = response.data.exams.filter((e: any) => e.status === 'scheduled');
          const completedExams = response.data.exams.filter((e: any) => e.status === 'completed');
          
          console.log(`📊 Dossier: ${scheduledExams.length} examens programmés, ${completedExams.length} examens réalisés`);
        }
        
      } catch (error: any) {
        console.error('❌ Erreur lors du chargement du dossier:', error);
        setError('Erreur lors du chargement du dossier patient');
        
        // En cas d'erreur, garder le patient sélectionné mais afficher l'erreur
        console.log('⚠️ Patient sélectionné maintenu malgré l\'erreur de chargement du dossier');
      } finally {
        setLoading(false);
      }
    };
    
    loadDossier();
  };

  // Auto-refresh du dossier pour maintenir la visibilité
  useEffect(() => {
    if (selectedPatient && dossier) {
      const refreshInterval = setInterval(async () => {
        try {
          const dossierRes = await axios.get(`/api/exams/history/${selectedPatient.id}`);
          setDossier(dossierRes.data);
          console.log('🔄 Dossier rafraîchi automatiquement');
        } catch (error) {
          console.log('⚠️ Erreur lors du rafraîchissement auto:', error);
        }
      }, 30000); // Rafraîchir toutes les 30 secondes
      
      return () => clearInterval(refreshInterval);
    }
  }, [selectedPatient, dossier]);

  // Fonction pour rafraîchir manuellement le dossier
  const handleRefreshDossier = async () => {
    if (selectedPatient) {
      try {
        const dossierRes = await axios.get(`/api/exams/history/${selectedPatient.id}`);
        setDossier(dossierRes.data);
        console.log('🔄 Dossier rafraîchi manuellement');
      } catch (error) {
        console.error('❌ Erreur lors du rafraîchissement manuel:', error);
      }
    }
  };

  // Fonction pour marquer un examen comme réalisé
  const handleMarkAsCompleted = async (exam: Exam) => {
    if (!newExamResult.trim()) {
      setError('Veuillez saisir un résultat avant de marquer l\'examen comme réalisé.');
      return;
    }

    setAddingExam(true);
    setError(null);
    
    // Capturer l'heure exacte à l'instantané de la soumission
    const submissionTimestamp = new Date();
    const submissionISO = submissionTimestamp.toISOString();
    
    console.log('🕐 Heure de soumission capturée:', submissionISO);
    console.log('🕐 Heure locale:', submissionTimestamp.toLocaleString('fr-FR'));
    
    try {
      const response = await axios.patch(`/api/exams/${exam.id}/complete`, {
        results: newExamResult.trim(),
        completedAt: submissionISO // Heure exacte de soumission
      });
      
      console.log(`✅ Examen ${exam.examType?.name || 'Examen'} marqué comme réalisé`);
      console.log('📡 Réponse API:', response.data);
      
      // Rafraîchir le dossier immédiatement pour maintenir la visibilité
      if (selectedPatient) {
        try {
          const dossierRes = await axios.get(`/api/exams/history/${selectedPatient.id}`);
          console.log('📋 Dossier rafraîchi après soumission');
          
          // Vérifier que l'examen a bien été mis à jour
          const updatedExam = dossierRes.data.exams?.find((e: any) => e.id === exam.id);
          if (updatedExam) {
            console.log('🔍 Examen mis à jour:', {
              id: updatedExam.id,
              status: updatedExam.status,
              results: updatedExam.results,
              updatedAt: updatedExam.updatedAt
            });
          }
          
          setDossier(dossierRes.data);
          
          // Vérifier s'il reste des examens programmés
          const remainingScheduled = dossierRes.data.exams?.filter((e: any) => e.status === 'scheduled');
          if (remainingScheduled && remainingScheduled.length > 0) {
            console.log(`📋 Il reste ${remainingScheduled.length} examen(s) programmé(s)`);
          } else {
            console.log('📋 Tous les examens sont réalisés');
          }
          
        } catch (dossierError: any) {
          console.error('⚠️ Erreur lors du rafraîchissement du dossier:', dossierError);
          // Ne pas afficher d'erreur à l'utilisateur, le dossier reste visible
        }
      }
      
      // Réinitialiser le formulaire
      setNewExamResult('');
      
    } catch (error: any) {
      console.error('❌ Erreur lors de la validation de l\'examen:', error);
      setError(error.response?.data?.error || 'Erreur lors de la validation de l\'examen');
    } finally {
      setAddingExam(false);
    }
  };

  return (
    <Layout title="Laborantin" navigationItems={navigationItems}>
      <GlobalErrorBoundary>
        <Routes>
          <Route path="/" element={<LaborantinOverview />} />
          <Route path="/patients" element={
            <PatientsExamens 
              patients={patients}
              selectedPatient={selectedPatient}
              dossier={dossier}
              loading={loading}
              error={error}
              searchTerm={searchTerm}
              addingExam={addingExam}
              newExamResult={newExamResult}
              onSearchTermChange={setSearchTerm}
              onSelectPatient={handleSelectPatient}
              onMarkAsCompleted={handleMarkAsCompleted}
              onNewExamResultChange={setNewExamResult}
              onRefreshDossier={handleRefreshDossier}
              onRefreshPatients={handleRefreshPatients}
            />
          } />
        </Routes>
      </GlobalErrorBoundary>
    </Layout>
  );
};

export default LaborantinDashboard; 
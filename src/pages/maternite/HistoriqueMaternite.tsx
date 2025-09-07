import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Instance axios authentifiée pour les routes maternité
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
  }
};

const initialFilters = {
  // Champs spécifiques à la maternité seulement
  numeroAnnuel: '',
  numeroMensuel: '',
  nomPostNomPrenom: '',
  age: '',
  adresse: '',
  typeAccouchement: '',
  jumeaux: '',
  dateAccouchement: '',
  heureAccouchement: '',
  sexeNouveauNe: '',
  poidsGrammes: '',
  apgar1: '',
  apgar2: '',
  apgar3: '',
  reanimation: '',
  atbq: '',
  indicationCesarienne: '',
  cpn: '',
  formuleObstetricale: '',
  ddr: '',
  saignementVaginal: '',
  formuleObstetricaleG: '',
  formuleObstetricaleP: '',
  formuleObstetricaleEV: '',
  formuleObstetricaleAV: '',
  formuleObstetricaleMortNe: '',
  // Champs pour les jumeaux
  jumeau1Sexe: '',
  jumeau1Poids: '',
  jumeau1Apgar1: '',
  jumeau1Apgar2: '',
  jumeau1Apgar3: '',
  jumeau2Sexe: '',
  jumeau2Poids: '',
  jumeau2Apgar1: '',
  jumeau2Apgar2: '',
  jumeau2Apgar3: '',
  jumeau3Sexe: '',
  jumeau3Poids: '',
  jumeau3Apgar1: '',
  jumeau3Apgar2: '',
  jumeau3Apgar3: '',
  jumeau4Sexe: '',
  jumeau4Poids: '',
  jumeau4Apgar1: '',
  jumeau4Apgar2: '',
  jumeau4Apgar3: ''
};

const HistoriqueMaternite: React.FC = () => {
  const [filters, setFilters] = useState(initialFilters);
  const [maternites, setMaternites] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fonction pour vérifier si la colonne césarienne doit être affichée
  const shouldShowCesarienneColumn = () => {
    return filters.typeAccouchement?.toLowerCase().includes('césarienne') || 
           filters.typeAccouchement?.toLowerCase().includes('cesarienne') ||
           filters.typeAccouchement?.toLowerCase().includes('cesar');
  };

  // Fonction pour vérifier si les champs jumeaux doivent être affichés
  const shouldShowJumeauxFields = () => {
    console.log('🔍 Vérification jumeaux:', {
      jumeaux: filters.jumeaux,
      resultat: filters.jumeaux === 'Oui'
    });
    return filters.jumeaux === 'Oui';
  };

  // Fonction pour vérifier si des données de jumeaux existent
  const hasJumeauxData = (maternite: any) => {
    return maternite.jumeau1Sexe || maternite.jumeau1Poids || maternite.jumeau1Apgar1 ||
           maternite.jumeau2Sexe || maternite.jumeau2Poids || maternite.jumeau2Apgar1 ||
           maternite.jumeau3Sexe || maternite.jumeau3Poids || maternite.jumeau3Apgar1 ||
           maternite.jumeau4Sexe || maternite.jumeau4Poids || maternite.jumeau4Apgar1;
  };

  // Fonction pour afficher les données d'un jumeau
  const renderJumeauData = (jumeauNum: number, maternite: any) => {
    const sexe = maternite[`jumeau${jumeauNum}Sexe`];
    const poids = maternite[`jumeau${jumeauNum}Poids`];
    const apgar1 = maternite[`jumeau${jumeauNum}Apgar1`];
    const apgar2 = maternite[`jumeau${jumeauNum}Apgar2`];
    const apgar3 = maternite[`jumeau${jumeauNum}Apgar3`];
    
    // Si aucune donnée pour ce jumeau, ne pas afficher
    if (!sexe && !poids && !apgar1 && !apgar2 && !apgar3) {
      return null;
    }
    
    return (
      <div className="border rounded p-3 bg-white shadow-sm">
        <h4 className="font-semibold text-blue-800 mb-3 text-sm">Jumeau {jumeauNum}</h4>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="font-medium text-gray-600">Sexe:</span>
            <span className="font-semibold">{sexe || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-600">Poids:</span>
            <span className="font-semibold">{poids ? `${poids}g` : '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-600">APGAR:</span>
            <span className="font-semibold">{apgar1 || '-'} / {apgar2 || '-'} / {apgar3 || '-'}</span>
          </div>
        </div>
      </div>
    );
  };

  // Charger les historiques de maternité
  const fetchMaternites = async () => {
    try {
      setLoading(true);
      console.log('🔍 Récupération des historiques de maternité...');
      
      // Récupérer TOUS les historiques de la table maternity-history
      const response = await authenticatedAxios.get('/api/maternity-history');
      console.log('📥 Réponse API maternity-history:', response.data);
      
      const allHistories = response.data.histories || [];
      console.log(`📊 Total des historiques reçus: ${allHistories.length}`);
      
      // TEMPORAIRE: Afficher TOUTES les données pour déboguer
      console.log('🔍 Données reçues:', allHistories);
      
      // Afficher TOUS les historiques pour le moment
      setMaternites(allHistories);
      
    } catch (error: any) {
      console.error('Erreur lors de la récupération des historiques:', error);
      setError('Erreur lors de la récupération des historiques');
    } finally {
      setLoading(false);
    }
  };

  // Charger les données au montage
  useEffect(() => {
    fetchMaternites();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const newFilters = { ...filters, [e.target.name]: e.target.value };
    setFilters(newFilters);
    
    // Log pour déboguer les changements de jumeaux
    if (e.target.name === 'jumeaux') {
      console.log('🔄 Changement jumeaux:', {
        nouvelleValeur: e.target.value,
        ancienneValeur: filters.jumeaux,
        shouldShow: e.target.value === 'Oui'
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Construire la formule obstétricale avant l'envoi
      let formuleObstetricale = '';
      if (filters.formuleObstetricaleG && filters.formuleObstetricaleG !== '') {
        formuleObstetricale += `${filters.formuleObstetricaleG}G `;
      }
      if (filters.formuleObstetricaleP && filters.formuleObstetricaleP !== '') {
        formuleObstetricale += `${filters.formuleObstetricaleP}P `;
      }
      if (filters.formuleObstetricaleEV && filters.formuleObstetricaleEV !== '') {
        formuleObstetricale += `${filters.formuleObstetricaleEV}EV `;
      }
      if (filters.formuleObstetricaleAV && filters.formuleObstetricaleAV !== '') {
        formuleObstetricale += `${filters.formuleObstetricaleAV}AV `;
      }
      if (filters.formuleObstetricaleMortNe && filters.formuleObstetricaleMortNe !== '') {
        formuleObstetricale += `${filters.formuleObstetricaleMortNe}MN`;
      }
      
      console.log('🔍 Formule obstétricale construite:', {
        formuleFinale: formuleObstetricale,
        champsIndividuels: {
          G: filters.formuleObstetricaleG,
          P: filters.formuleObstetricaleP,
          EV: filters.formuleObstetricaleEV,
          AV: filters.formuleObstetricaleAV,
          MN: filters.formuleObstetricaleMortNe
        }
      });
      
      // IMPORTANT: NE JAMAIS créer de patients depuis cette page
      // Les données vont UNIQUEMENT dans la table maternity-history
      // Cela garantit l'isolation complète
      
      // Mapper les champs du formulaire vers ceux attendus par l'API
      const dataToSend = {
        // PAS DE patientId - Données complètement isolées
        patientId: null, // Toujours null pour l'historique
        
        // Champs obligatoires pour l'API
        patientName: filters.nomPostNomPrenom || '',
        gender: 'Féminin', // Toujours féminin pour la maternité
        age: filters.age || '',
        service: 'maternite_historique', // Service simple pour l'historique
        entryDate: filters.dateAccouchement || new Date().toISOString().split('T')[0],
        entryTime: filters.heureAccouchement || '',
        
        // FLAGS D'ISOLATION SIMPLES ET EFFICACES
        isHistoryOnly: true, // Flag principal d'isolation
        interfaceOrigin: 'maternite_historique', // Origine simple
        shouldNotBeShared: true, // Flag de sécurité
        
        // Champs spécifiques à la maternité
        numeroAnnuel: filters.numeroAnnuel,
        numeroMensuel: filters.numeroMensuel,
        postNom: filters.nomPostNomPrenom ? filters.nomPostNomPrenom.split(' ').slice(1).join(' ') : '',
        typeAccouchement: filters.typeAccouchement,
        jumeaux: filters.jumeaux,
        dateAccouchement: filters.dateAccouchement,
        heureAccouchement: filters.heureAccouchement,
        sexeNouveauNe: filters.sexeNouveauNe,
        poidsGrammes: filters.poidsGrammes,
        apgar1: filters.apgar1,
        apgar2: filters.apgar2,
        apgar3: filters.apgar3,
        reanimation: filters.reanimation,
        atbq: filters.atbq,
        indicationCesarienne: filters.indicationCesarienne,
        cpn: filters.cpn,
        ddr: filters.ddr,
        saignementVaginal: filters.saignementVaginal,
        
        // Champs de la formule obstétricale
        formuleObstetricale: formuleObstetricale,
        formuleObstetricaleG: filters.formuleObstetricaleG,
        formuleObstetricaleP: filters.formuleObstetricaleP,
        formuleObstetricaleEV: filters.formuleObstetricaleEV,
        formuleObstetricaleAV: filters.formuleObstetricaleAV,
        formuleObstetricaleMortNe: filters.formuleObstetricaleMortNe,
        
        // Champs pour les jumeaux
        jumeau1Sexe: filters.jumeau1Sexe,
        jumeau1Poids: filters.jumeau1Poids,
        jumeau1Apgar1: filters.jumeau1Apgar1,
        jumeau1Apgar2: filters.jumeau1Apgar2,
        jumeau1Apgar3: filters.jumeau1Apgar3,
        jumeau2Sexe: filters.jumeau2Sexe,
        jumeau2Poids: filters.jumeau2Poids,
        jumeau2Apgar1: filters.jumeau2Apgar1,
        jumeau2Apgar2: filters.jumeau2Apgar2,
        jumeau2Apgar3: filters.jumeau2Apgar3,
        jumeau3Sexe: filters.jumeau3Sexe,
        jumeau3Poids: filters.jumeau3Poids,
        jumeau3Apgar1: filters.jumeau3Apgar1,
        jumeau3Apgar2: filters.jumeau3Apgar2,
        jumeau3Apgar3: filters.jumeau3Apgar3,
        jumeau4Sexe: filters.jumeau4Sexe,
        jumeau4Poids: filters.jumeau4Poids,
        jumeau4Apgar1: filters.jumeau4Apgar1,
        jumeau4Apgar2: filters.jumeau4Apgar2,
        jumeau4Apgar3: filters.jumeau4Apgar3,
        
        // Champs supplémentaires
        address: filters.adresse,
        weight: filters.poidsGrammes
      };

      console.log('📤 Données envoyées à l\'API:', dataToSend);
      
      // CONFIRMATION: Les données sont isolées et ne seront JAMAIS partagées
      console.log('🔒 ISOLATION CONFIRMÉE: Données stockées uniquement dans maternity-history, jamais partagées');
      
      const response = await authenticatedAxios.post('/api/maternity-history', dataToSend);
      setSuccess('Historique de maternité enregistré avec succès !');
      setFilters(initialFilters);
      fetchMaternites();
    } catch (error: any) {
      console.error('Détails de l\'erreur:', error.response?.data);
      setError(error.response?.data?.error || error.response?.data?.details || 'Erreur lors de l\'enregistrement de l\'historique');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Historique des maternités</h1>
      
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
      
      <div className="overflow-x-auto">
          {/* Message d'isolation supprimé - L'utilisateur ne veut pas le voir */}
          
          <form onSubmit={handleSave}>
          <table className="min-w-full border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-4 py-3 text-sm font-medium">N° ANN</th>
                <th className="border px-4 py-3 text-sm font-medium">N° MENS</th>
                <th className="border px-4 py-3 text-sm font-medium">NOM, POST-NOM, PRÉNOM</th>
                <th className="border px-4 py-3 text-sm font-medium">AGE</th>
                <th className="border px-4 py-3 text-sm font-medium">ADRESSE</th>
                <th className="border px-4 py-3 text-sm font-medium">TYPE ACC</th>
                <th className="border px-4 py-3 text-sm font-medium">JUMEAUX</th>
                <th className="border px-4 py-3 text-sm font-medium">DATE</th>
                <th className="border px-4 py-3 text-sm font-medium">HEURE</th>
                <th className="border px-4 py-3 text-sm font-medium">SEXE N-NÉ</th>
                <th className="border px-4 py-3 text-sm font-medium">POIDS EN GRAMME</th>
                <th className="border px-4 py-3 text-sm font-medium">APGAR</th>
                <th className="border px-4 py-3 text-sm">RÉANIMATION</th>
                <th className="border px-4 py-3 text-sm">ATBQ</th>
                {shouldShowCesarienneColumn() && (
                  <th className="border px-4 py-3 text-sm font-medium">INDIC SI CÉSAR</th>
                )}
                <th className="border px-4 py-3 text-sm font-medium">CPN</th>
                <th className="border px-4 py-3 text-sm font-medium">FORMULE OBSTÉTRICALE</th>
                <th className="border px-4 py-3 text-sm font-medium">DDR</th>
                <th className="border px-4 py-3 text-sm font-medium">SAIGNEMENT VAGINAL</th>
                <th className="border px-4 py-3 text-sm"></th>
              </tr>
              {shouldShowJumeauxFields() && (
                <tr className="bg-blue-50">
                  <th colSpan={3} className="border px-4 py-2 text-sm font-medium text-blue-800">JUMEAU 1</th>
                  <th colSpan={3} className="border px-4 py-2 text-sm font-medium text-blue-800">JUMEAU 2</th>
                  <th colSpan={3} className="border px-4 py-2 text-sm font-medium text-blue-800">JUMEAU 3</th>
                  <th colSpan={3} className="border px-4 py-2 text-sm font-medium text-blue-800">JUMEAU 4</th>
                  <th colSpan={shouldShowCesarienneColumn() ? 5 : 4} className="border px-4 py-2 text-sm font-medium text-blue-800">AUTRES CHAMPS</th>
                </tr>
              )}
              <tr>
                <td className="border px-4 py-3">
                  <input name="numeroAnnuel" value={filters.numeroAnnuel} onChange={handleChange} className="input-field w-full text-sm p-2" placeholder="N° annuel..." type="text" />
                </td>
                <td className="border px-4 py-3">
                  <input name="numeroMensuel" value={filters.numeroMensuel} onChange={handleChange} className="input-field w-full text-sm p-2" placeholder="N° mensuel..." type="text" />
                </td>
                <td className="border px-4 py-3">
                  <input name="nomPostNomPrenom" value={filters.nomPostNomPrenom} onChange={handleChange} className="input-field w-full text-sm p-2 min-w-[200px]" placeholder="Nom, post-nom, prénom..." />
                </td>
                <td className="border px-4 py-3">
                  <input name="age" value={filters.age} onChange={handleChange} className="input-field w-full text-sm p-2 min-w-[80px]" placeholder="Age..." type="number" min="0" />
                </td>
                <td className="border px-4 py-3">
                  <input name="adresse" value={filters.adresse} onChange={handleChange} className="input-field w-full text-sm p-2 min-w-[150px]" placeholder="Adresse..." />
                </td>
                <td className="border px-4 py-3">
                  <select name="typeAccouchement" value={filters.typeAccouchement} onChange={handleChange} className="input-field w-full text-sm p-2 min-w-[150px]">
                    <option value="">Sélectionner</option>
                    <option value="Accouchement normal">Accouchement normal</option>
                    <option value="Accouchement avec césarienne">Accouchement avec césarienne</option>
                  </select>
                </td>
                <td className="border px-4 py-3">
                  <select name="jumeaux" value={filters.jumeaux} onChange={handleChange} className="input-field w-full text-sm p-2 min-w-[100px]">
                    <option value="">Sélectionner</option>
                    <option value="Oui">Oui</option>
                    <option value="Non">Non</option>
                  </select>
                </td>
                <td className="border px-4 py-3">
                  <input name="dateAccouchement" value={filters.dateAccouchement} onChange={handleChange} className="input-field w-full text-sm p-2 min-w-[120px]" type="date" />
                </td>
                <td className="border px-4 py-3">
                  <input name="heureAccouchement" value={filters.heureAccouchement} onChange={handleChange} className="input-field w-full text-sm p-2 min-w-[100px]" type="time" />
                </td>
                <td className="border px-4 py-3">
                  <select name="sexeNouveauNe" value={filters.sexeNouveauNe} onChange={handleChange} className="input-field w-full text-sm p-2 min-w-[100px]">
                    <option value="">Sélectionner</option>
                    <option value="M">M</option>
                    <option value="F">F</option>
                  </select>
                </td>
                <td className="border px-4 py-3">
                  <input name="poidsGrammes" value={filters.poidsGrammes} onChange={handleChange} className="input-field w-full text-sm p-2 min-w-[120px]" placeholder="Poids (g)..." type="number" min="0" />
                </td>
                <td className="border px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <input name="apgar1" value={filters.apgar1} onChange={handleChange} className="input-field w-12 text-sm text-center p-2" placeholder="1" type="number" min="0" max="10" />
                    <span className="text-gray-500 font-medium">/</span>
                    <input name="apgar2" value={filters.apgar2} onChange={handleChange} className="input-field w-12 text-sm text-center p-2" placeholder="2" type="number" min="0" max="10" />
                    <span className="text-gray-500 font-medium">/</span>
                    <input name="apgar3" value={filters.apgar3} onChange={handleChange} className="input-field w-12 text-sm text-center p-2" placeholder="3" type="number" min="0" max="10" />
                  </div>
                </td>
                <td className="border px-4 py-3">
                  <select name="reanimation" value={filters.reanimation} onChange={handleChange} className="input-field w-full text-sm p-2 min-w-[100px]">
                    <option value="">Sélectionner</option>
                    <option value="Oui">Oui</option>
                    <option value="Non">Non</option>
                  </select>
                </td>
                <td className="border px-4 py-3">
                  <select name="atbq" value={filters.atbq} onChange={handleChange} className="input-field w-full text-sm p-2 min-w-[100px]">
                    <option value="">Sélectionner</option>
                    <option value="Oui">Oui</option>
                    <option value="Non">Non</option>
                  </select>
                </td>
                {shouldShowCesarienneColumn() && (
                  <td className="border px-4 py-3">
                    <input name="indicationCesarienne" value={filters.indicationCesarienne} onChange={handleChange} className="input-field w-full text-sm p-2 min-w-[150px]" placeholder="Indication césarienne..." />
                  </td>
                )}
                <td className="border px-4 py-3">
                  <select name="cpn" value={filters.cpn} onChange={handleChange} className="input-field w-full text-sm p-2 min-w-[100px]">
                    <option value="">Sélectionner</option>
                    <option value="Oui">Oui</option>
                    <option value="Non">Non</option>
                  </select>
                </td>
                <td className="border px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <input name="formuleObstetricaleG" value={filters.formuleObstetricaleG} onChange={handleChange} className="input-field w-12 text-sm text-center p-2" placeholder="G" type="number" min="0" />
                    <span className="text-gray-500 font-medium">,</span>
                    <input name="formuleObstetricaleP" value={filters.formuleObstetricaleP} onChange={handleChange} className="input-field w-12 text-sm text-center p-2" placeholder="P" type="number" min="0" />
                    <span className="text-gray-500 font-medium">,</span>
                    <input name="formuleObstetricaleEV" value={filters.formuleObstetricaleEV} onChange={handleChange} className="input-field w-12 text-sm text-center p-2" placeholder="EV" type="number" min="0" />
                    <span className="text-gray-500 font-medium">,</span>
                    <input name="formuleObstetricaleAV" value={filters.formuleObstetricaleAV} onChange={handleChange} className="input-field w-12 text-sm text-center p-2" placeholder="AV" type="number" min="0" />
                    <span className="text-gray-500 font-medium">,</span>
                    <input name="formuleObstetricaleMortNe" value={filters.formuleObstetricaleMortNe} onChange={handleChange} className="input-field w-12 text-sm text-center p-2" placeholder="Mort-né" type="number" min="0" />
                  </div>
                </td>
                <td className="border px-4 py-3">
                  <input name="ddr" value={filters.ddr} onChange={handleChange} className="input-field w-full text-sm p-2 min-w-[120px]" type="date" />
                </td>
                <td className="border px-4 py-3">
                  <select name="saignementVaginal" value={filters.saignementVaginal} onChange={handleChange} className="input-field w-full text-sm p-2 min-w-[120px]">
                    <option value="">Sélectionner</option>
                    <option value="Oui">Oui</option>
                    <option value="Non">Non</option>
                  </select>
                </td>
                <td className="border px-4 py-3">
                  <button type="submit" disabled={saving} className="btn-primary w-full">
                    {saving ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </td>
              </tr>
              {shouldShowJumeauxFields() && (
                <tr className="bg-blue-50">
                  {/* Jumeau 1 */}
                  <td className="border px-4 py-3">
                    <select name="jumeau1Sexe" value={filters.jumeau1Sexe} onChange={handleChange} className="input-field w-full text-sm p-2">
                      <option value="">Sexe</option>
                      <option value="M">M</option>
                      <option value="F">F</option>
                    </select>
                  </td>
                  <td className="border px-4 py-3">
                    <input name="jumeau1Poids" value={filters.jumeau1Poids} onChange={handleChange} className="input-field w-full text-sm p-2" placeholder="Poids (g)..." type="number" min="0" />
                  </td>
                  <td className="border px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <input name="jumeau1Apgar1" value={filters.jumeau1Apgar1} onChange={handleChange} className="input-field w-12 text-sm text-center p-2" placeholder="1" type="number" min="0" max="10" />
                      <span className="text-gray-500 font-medium">/</span>
                      <input name="jumeau1Apgar2" value={filters.jumeau1Apgar2} onChange={handleChange} className="input-field w-12 text-sm text-center p-2" placeholder="2" type="number" min="0" max="10" />
                      <span className="text-gray-500 font-medium">/</span>
                      <input name="jumeau1Apgar3" value={filters.jumeau1Apgar3} onChange={handleChange} className="input-field w-12 text-sm text-center p-2" placeholder="3" type="number" min="0" max="10" />
                    </div>
                  </td>
                  {/* Jumeau 2 */}
                  <td className="border px-4 py-3">
                    <select name="jumeau2Sexe" value={filters.jumeau2Sexe} onChange={handleChange} className="input-field w-full text-sm p-2">
                      <option value="">Sexe</option>
                      <option value="M">M</option>
                      <option value="F">F</option>
                    </select>
                  </td>
                  <td className="border px-4 py-3">
                    <input name="jumeau2Poids" value={filters.jumeau2Poids} onChange={handleChange} className="input-field w-full text-sm p-2" placeholder="Poids (g)..." type="number" min="0" />
                  </td>
                  <td className="border px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <input name="jumeau2Apgar1" value={filters.jumeau2Apgar1} onChange={handleChange} className="input-field w-12 text-sm text-center p-2" placeholder="1" type="number" min="0" max="10" />
                      <span className="text-gray-500 font-medium">/</span>
                      <input name="jumeau2Apgar2" value={filters.jumeau2Apgar2} onChange={handleChange} className="input-field w-12 text-sm text-center p-2" placeholder="2" type="number" min="0" max="10" />
                      <span className="text-gray-500 font-medium">/</span>
                      <input name="jumeau2Apgar3" value={filters.jumeau2Apgar3} onChange={handleChange} className="input-field w-12 text-sm text-center p-2" placeholder="3" type="number" min="0" max="10" />
                    </div>
                  </td>
                  {/* Jumeau 3 */}
                  <td className="border px-4 py-3">
                    <select name="jumeau3Sexe" value={filters.jumeau3Sexe} onChange={handleChange} className="input-field w-full text-sm p-2">
                      <option value="">Sexe</option>
                      <option value="M">M</option>
                      <option value="F">F</option>
                    </select>
                  </td>
                  <td className="border px-4 py-3">
                    <input name="jumeau3Poids" value={filters.jumeau3Poids} onChange={handleChange} className="input-field w-full text-sm p-2" placeholder="Poids (g)..." type="number" min="0" />
                  </td>
                  <td className="border px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <input name="jumeau3Apgar1" value={filters.jumeau3Apgar1} onChange={handleChange} className="input-field w-12 text-sm text-center p-2" placeholder="1" type="number" min="0" max="10" />
                      <span className="text-gray-500 font-medium">/</span>
                      <input name="jumeau3Apgar2" value={filters.jumeau3Apgar2} onChange={handleChange} className="input-field w-12 text-sm text-center p-2" placeholder="2" type="number" min="0" max="10" />
                      <span className="text-gray-500 font-medium">/</span>
                      <input name="jumeau3Apgar3" value={filters.jumeau3Apgar3} onChange={handleChange} className="input-field w-12 text-sm text-center p-2" placeholder="3" type="number" min="0" max="10" />
                    </div>
                  </td>
                  {/* Jumeau 4 */}
                  <td className="border px-4 py-3">
                    <select name="jumeau4Sexe" value={filters.jumeau4Sexe} onChange={handleChange} className="input-field w-full text-sm p-2">
                      <option value="">Sexe</option>
                      <option value="M">M</option>
                      <option value="F">F</option>
                    </select>
                  </td>
                  <td className="border px-4 py-3">
                    <input name="jumeau4Poids" value={filters.jumeau4Poids} onChange={handleChange} className="input-field w-full text-sm p-2" placeholder="Poids (g)..." type="number" min="0" />
                  </td>
                  <td className="border px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <input name="jumeau4Apgar1" value={filters.jumeau4Apgar1} onChange={handleChange} className="input-field w-12 text-sm text-center p-2" placeholder="1" type="number" min="0" max="10" />
                      <span className="text-gray-500 font-medium">/</span>
                      <input name="jumeau4Apgar2" value={filters.jumeau4Apgar2} onChange={handleChange} className="input-field w-12 text-sm text-center p-2" placeholder="2" type="number" min="0" max="10" />
                      <span className="text-gray-500 font-medium">/</span>
                      <input name="jumeau4Apgar3" value={filters.jumeau4Apgar3} onChange={handleChange} className="input-field w-12 text-sm text-center p-2" placeholder="3" type="number" min="0" max="10" />
                    </div>
                  </td>
                  <td colSpan={shouldShowCesarienneColumn() ? 5 : 4} className="border px-4 py-3 text-sm text-gray-500">
                    Informations des jumeaux (optionnel)
                  </td>
                </tr>
              )}
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={shouldShowCesarienneColumn() ? 20 : 19} className="text-center text-gray-500 py-4">Chargement...</td>
                </tr>
              ) : maternites.length === 0 ? (
                <tr>
                  <td colSpan={shouldShowCesarienneColumn() ? 20 : 19} className="text-center text-gray-500 py-4">Aucune maternité trouvée</td>
                </tr>
              ) : (
                maternites.map((maternite) => (
                  <React.Fragment key={maternite.id}>
                    {/* Ligne principale */}
                    <tr>
                      <td className="border px-4 py-3 text-sm">{maternite.numeroAnnuel || '-'}</td>
                      <td className="border px-4 py-3 text-sm">{maternite.numeroMensuel || '-'}</td>
                      <td className="border px-4 py-3 text-sm">{maternite.patientName || '-'}</td>
                      <td className="border px-4 py-3 text-sm">{maternite.age || '-'}</td>
                      <td className="border px-4 py-3 text-sm">{maternite.address || '-'}</td>
                      <td className="border px-4 py-3 text-sm">{maternite.typeAccouchement || '-'}</td>
                      <td className="border px-4 py-3 text-sm">{maternite.jumeaux || '-'}</td>
                      <td className="border px-4 py-3 text-sm">{maternite.dateAccouchement ? new Date(maternite.dateAccouchement).toLocaleDateString('fr-FR') : '-'}</td>
                      <td className="border px-4 py-3 text-sm">{maternite.heureAccouchement || '-'}</td>
                      <td className="border px-4 py-3 text-sm">{maternite.sexeNouveauNe || '-'}</td>
                      <td className="border px-4 py-3 text-sm">{maternite.poidsGrammes || '-'}</td>
                      <td className="border px-4 py-3 text-sm">{maternite.apgar1 || '-'} / {maternite.apgar2 || '-'} / {maternite.apgar3 || '-'}</td>
                      <td className="border px-4 py-3 text-sm">{maternite.reanimation || '-'}</td>
                      <td className="border px-4 py-3 text-sm">{maternite.atbq || '-'}</td>
                      {shouldShowCesarienneColumn() && (
                        <td className="border px-4 py-3 text-sm">{maternite.indicationCesarienne || '-'}</td>
                      )}
                      <td className="border px-4 py-3 text-sm">{maternite.cpn || '-'}</td>
                      <td className="border px-4 py-3 text-sm">
                        {(() => {
                          // Construire la formule obstétricale à partir des champs individuels
                          let formule = '';
                          if (maternite.formuleObstetricaleG && maternite.formuleObstetricaleG !== '' && maternite.formuleObstetricaleG !== 'N/A') {
                            formule += `${maternite.formuleObstetricaleG}G `;
                          }
                          if (maternite.formuleObstetricaleP && maternite.formuleObstetricaleP !== '' && maternite.formuleObstetricaleP !== 'N/A') {
                            formule += `${maternite.formuleObstetricaleP}P `;
                          }
                          if (maternite.formuleObstetricaleEV && maternite.formuleObstetricaleEV !== '' && maternite.formuleObstetricaleEV !== 'N/A') {
                            formule += `${maternite.formuleObstetricaleEV}EV `;
                          }
                          if (maternite.formuleObstetricaleAV && maternite.formuleObstetricaleAV !== '' && maternite.formuleObstetricaleAV !== 'N/A') {
                            formule += `${maternite.formuleObstetricaleAV}AV `;
                          }
                          if (maternite.formuleObstetricaleMortNe && maternite.formuleObstetricaleMortNe !== '' && maternite.formuleObstetricaleMortNe !== 'N/A') {
                            formule += `${maternite.formuleObstetricaleMortNe}MN`;
                          }
                          return formule.trim() || '-';
                        })()}
                      </td>
                      <td className="border px-4 py-3 text-sm">{maternite.ddr ? new Date(maternite.ddr).toLocaleDateString('fr-FR') : '-'}</td>
                      <td className="border px-4 py-3 text-sm">{maternite.saignementVaginal || '-'}</td>
                      <td className="border px-4 py-3 text-sm"></td>
                    </tr>
                    
                    {/* Ligne des jumeaux si applicable */}
                    {maternite.jumeaux === 'Oui' && hasJumeauxData(maternite) && (
                      <tr className="bg-blue-50">
                        <td colSpan={shouldShowCesarienneColumn() ? 20 : 19} className="border px-4 py-3 text-sm">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {renderJumeauData(1, maternite)}
                            {renderJumeauData(2, maternite)}
                            {renderJumeauData(3, maternite)}
                            {renderJumeauData(4, maternite)}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </form>
      </div>
    </div>
  );
};

export default HistoriqueMaternite; 

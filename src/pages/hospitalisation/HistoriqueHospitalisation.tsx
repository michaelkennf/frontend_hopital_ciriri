import React, { useState, useEffect } from 'react';
import { apiClient } from '../../utils/apiClient';

const initialFilters = {
  name: '',
  gender: '',
  age: '',
  weight: '',
  address: '',
  profession: '',
  maritalStatus: '',
  service: '',
  entryDate: '',
  entryTime: '',
  exitDate: '',
};

const HistoriqueHospitalisation: React.FC = () => {
  const [filters, setFilters] = useState(initialFilters);
  const [hospitalisations, setHospitalisations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Charger les historiques d'hospitalisation
  const fetchHospitalisations = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/hospitalization-history');
      setHospitalisations(response.data.histories);
    } catch (error: any) {
      setError('Erreur lors du chargement des historiques');
      console.error('Erreur fetch hospitalisations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Charger les données au montage
  useEffect(() => {
    fetchHospitalisations();
  }, []);

  // Récupérer le dernier patient hospitalisé pour pré-remplir
  const fetchLastHospitalizedPatient = async () => {
    try {
      const response = await apiClient.get('/api/hospitalizations');
      const hospitalizations = response.data.hospitalizations;
      
      if (hospitalizations.length > 0) {
        const lastHosp = hospitalizations[0]; // Le plus récent
        const patient = lastHosp.patient;
        
        // Calculer l'âge
        const birthDate = new Date(patient.dateOfBirth);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
        
        setFilters(f => ({
          ...f,
          // Ne pas pré-remplir le nom - l'utilisateur doit le saisir manuellement
          name: '',
          gender: patient.gender,
          age: actualAge.toString(),
          weight: patient.weight?.toString() || '',
          address: patient.address,
          entryDate: new Date().toISOString().slice(0, 10),
          // Ne pas pré-remplir l'heure - l'utilisateur doit la saisir manuellement
          entryTime: '',
        }));
      }
    } catch (error: any) {
      console.error('Erreur lors de la récupération du dernier patient hospitalisé:', error);
    }
  };

  // Pré-remplir avec le dernier patient hospitalisé
  useEffect(() => {
    fetchLastHospitalizedPatient();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Validation des champs obligatoires
      if (!filters.name || !filters.gender || !filters.age || !filters.entryDate || !filters.entryTime) {
        setError('Veuillez remplir tous les champs obligatoires (nom, sexe, âge, date d\'entrée, heure)');
        setSaving(false);
        return;
      }

      // Essayer de trouver le patient correspondant au nom (optionnel)
      let patientId = null;
      try {
        const patientsResponse = await apiClient.get('/api/patients');
        const patients = patientsResponse.data.patients;
        const [lastName, firstName] = filters.name.split(' ');
        const patient = patients.find((p: any) => 
          p.lastName === lastName && p.firstName === firstName
        );
        if (patient) {
          patientId = patient.id;
        }
      } catch (error) {
        console.log('Patient non trouvé dans la base de données, création d\'un historique sans lien patient');
      }

      // Créer l'historique d'hospitalisation
      const historyData = {
        patientId: patientId || 1, // Utiliser un ID par défaut si le patient n'est pas trouvé
        patientName: filters.name,
        gender: filters.gender,
        age: parseInt(filters.age, 10),
        weight: filters.weight ? parseFloat(filters.weight) : null,
        address: filters.address,
        profession: filters.profession,
        maritalStatus: filters.maritalStatus,
        service: filters.service,
        entryDate: filters.entryDate,
        entryTime: filters.entryTime,
        exitDate: filters.exitDate || null,
        treatment: '', // À remplir plus tard
        notes: '' // À remplir plus tard
      };

      await apiClient.post('/api/hospitalization-history', historyData);
      
      setSuccess('Historique d\'hospitalisation enregistré avec succès !');
      
      // Réinitialiser le formulaire
      setFilters(initialFilters);
      
      // Recharger les données
      await fetchHospitalisations();
      
      // Re-pré-remplir avec le dernier patient
      await fetchLastHospitalizedPatient();
      
    } catch (error: any) {
      console.error('Erreur lors de l\'enregistrement:', error);
      setError(error.response?.data?.error || 'Erreur lors de l\'enregistrement de l\'historique');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Historique des hospitalisations</h1>
      
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
        <form onSubmit={handleSave}>
          <table className="min-w-full border border-gray-300">
            <thead>
              <tr className="bg-gray-100 text-sm">
                <th className="border px-4 py-3 min-w-[250px] w-[250px]">NOM ET POST NOM</th>
                <th className="border px-4 py-3 min-w-[120px] w-[120px]">SEXE</th>
                <th className="border px-4 py-3 min-w-[100px] w-[100px]">AGE</th>
                <th className="border px-4 py-3 min-w-[120px] w-[120px]">POIDS</th>
                <th className="border px-4 py-3 min-w-[300px] w-[300px]">ADRESSE</th>
                <th className="border px-4 py-3 min-w-[200px] w-[200px]">PROFESSION</th>
                <th className="border px-4 py-3 min-w-[150px] w-[150px]">ETAT CIVIL</th>
                <th className="border px-4 py-3">SERVICE</th>
                <th className="border px-4 py-3">DATE D'ENTREE</th>
                <th className="border px-4 py-3">HEURE</th>
                <th className="border px-4 py-3">DATE DE SORTIE</th>
                <th className="border px-4 py-3"></th>
              </tr>
              <tr>
                <td className="border px-4 py-3 min-w-[250px] w-[250px]">
                  <input 
                    name="name" 
                    value={filters.name} 
                    onChange={handleChange} 
                    className="input-field w-full text-base py-2 px-3" 
                    placeholder="Nom..." 
                    required
                  />
                </td>
                <td className="border px-4 py-3 min-w-[120px] w-[120px]">
                  <select name="gender" value={filters.gender} onChange={handleChange} className="input-field w-full text-base py-2 px-3" required>
                    <option value="">Sélectionner</option>
                    <option value="M">M</option>
                    <option value="F">F</option>
                  </select>
                </td>
                <td className="border px-4 py-3 min-w-[100px] w-[100px]">
                  <input 
                    name="age" 
                    value={filters.age} 
                    onChange={handleChange} 
                    className="input-field w-full text-base py-2 px-3" 
                    placeholder="Age..." 
                    type="number" 
                    min="0" 
                    required
                  />
                </td>
                <td className="border px-4 py-3 min-w-[120px] w-[120px]">
                  <input 
                    name="weight" 
                    value={filters.weight} 
                    onChange={handleChange} 
                    className="input-field w-full text-base py-2 px-3" 
                    placeholder="Poids..." 
                    type="number" 
                    min="0" 
                  />
                </td>
                <td className="border px-4 py-3 min-w-[300px] w-[300px]">
                  <input 
                    name="address" 
                    value={filters.address} 
                    onChange={handleChange} 
                    className="input-field w-full text-base py-2 px-3" 
                    placeholder="Adresse..." 
                  />
                </td>
                <td className="border px-4 py-3 min-w-[200px] w-[200px]">
                  <input 
                    name="profession" 
                    value={filters.profession} 
                    onChange={handleChange} 
                    className="input-field w-full text-base py-2 px-3" 
                    placeholder="Profession..." 
                  />
                </td>
                <td className="border px-4 py-3 min-w-[150px] w-[150px]">
                  <input 
                    name="maritalStatus" 
                    value={filters.maritalStatus} 
                    onChange={handleChange} 
                    className="input-field w-full text-base py-2 px-3" 
                    placeholder="Etat civil..." 
                  />
                </td>
                <td className="border px-4 py-3">
                  <input 
                    name="service" 
                    value={filters.service} 
                    onChange={handleChange} 
                    className="input-field w-full text-base py-2 px-3" 
                    placeholder="Service..." 
                  />
                </td>
                <td className="border px-4 py-3">
                  <input 
                    name="entryDate" 
                    value={filters.entryDate} 
                    onChange={handleChange} 
                    className="input-field w-full text-base py-2 px-3" 
                    type="date" 
                    required
                  />
                </td>
                <td className="border px-4 py-3">
                  <input 
                    name="entryTime" 
                    value={filters.entryTime} 
                    onChange={handleChange} 
                    className="input-field w-full text-base py-2 px-3" 
                    type="time" 
                    required
                  />
                </td>
                <td className="border px-4 py-3">
                  <input 
                    name="exitDate" 
                    value={filters.exitDate} 
                    onChange={handleChange} 
                    className="input-field w-full text-base py-2 px-3" 
                    type="date" 
                  />
                </td>
                <td className="border px-4 py-3 text-center">
                  <button type="submit" className="btn-primary py-2 px-4 text-base" disabled={saving}>
                    {saving ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </td>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={12} className="text-center text-gray-500 py-4">Chargement...</td>
                </tr>
              ) : hospitalisations.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center text-gray-500 py-4">Aucune hospitalisation trouvée</td>
                </tr>
              ) : (
                hospitalisations.map((hosp) => (
                  <tr key={hosp.id}>
                    <td className="border px-4 py-3 text-base min-w-[250px] w-[250px]">{hosp.patientName || '-'}</td>
                    <td className="border px-4 py-3 text-base min-w-[120px] w-[120px]">{hosp.gender || '-'}</td>
                    <td className="border px-4 py-3 text-base min-w-[100px] w-[100px]">{hosp.age || '-'}</td>
                    <td className="border px-4 py-3 text-base min-w-[120px] w-[120px]">{hosp.weight || '-'}</td>
                    <td className="border px-4 py-3 text-base min-w-[300px] w-[300px]">{hosp.address || '-'}</td>
                    <td className="border px-4 py-3 text-base min-w-[200px] w-[200px]">{hosp.profession || '-'}</td>
                    <td className="border px-4 py-3 text-base min-w-[150px] w-[150px]">{hosp.maritalStatus || '-'}</td>
                    <td className="border px-4 py-3 text-base">{hosp.service || '-'}</td>
                    <td className="border px-4 py-3 text-base">{hosp.entryDate || '-'}</td>
                    <td className="border px-4 py-3 text-base">{hosp.entryTime || '-'}</td>
                    <td className="border px-4 py-3 text-base">{hosp.exitDate || '-'}</td>
                    <td className="border px-4 py-3"></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </form>
      </div>
    </div>
  );
};

export default HistoriqueHospitalisation; 
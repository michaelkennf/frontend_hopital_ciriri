import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  address: string;
  dateOfBirth: string;
  photo?: string;
  maritalStatus: string;
  salary: number;
  function: string;
  createdAt: string;
  sexe: string;
  contact: string;
}

const EmployeesList: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get('/api/employees');
        setEmployees(res.data || []);
      } catch (e: any) {
        setError(e.response?.data?.error || 'Erreur lors du chargement des employés');
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Liste des employés</h1>
      <p className="text-gray-600 mb-6">Consultez la liste complète des employés et leurs informations.</p>
      {error && <div className="bg-red-100 text-red-700 p-2 mb-2 rounded">{error}</div>}
      <div className="card overflow-x-auto">
        {loading ? (
          <div>Chargement...</div>
        ) : employees.length === 0 ? (
          <div>Aucun employé trouvé.</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2">Prénom</th>
                <th className="p-2">Nom</th>
                <th className="p-2">Adresse</th>
                <th className="p-2">Date de naissance</th>
                <th className="p-2">Statut matrimonial</th>
                <th className="p-2">Sexe</th>
                <th className="p-2">Contact</th>
                <th className="p-2">Fonction</th>
                <th className="p-2">Salaire ($)</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id} className="border-b">
                  <td className="p-2">{emp.firstName}</td>
                  <td className="p-2">{emp.lastName}</td>
                  <td className="p-2">{emp.address}</td>
                  <td className="p-2">{emp.dateOfBirth ? new Date(emp.dateOfBirth).toLocaleDateString('fr-FR') : ''}</td>
                  <td className="p-2">{emp.maritalStatus}</td>
                  <td className="p-2">{emp.sexe}</td>
                  <td className="p-2">{emp.contact}</td>
                  <td className="p-2">{emp.function}</td>
                  <td className="p-2">{emp.salary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default EmployeesList; 
import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import axios from 'axios';

const getDaysInMonth = (month: number, year: number) => {
  const days: { day: string; date: string }[] = [];
  const date = new Date(year, month, 1);
  const daysOfWeek = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
  while (date.getMonth() === month) {
    const day = daysOfWeek[date.getDay()];
    const dayNum = date.getDate().toString().padStart(2, '0');
    days.push({ day, date: `Le ${dayNum}/${(month+1).toString().padStart(2, '0')}` });
    date.setDate(date.getDate() + 1);
  }
  return days;
};

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  function: string;
}

const Attendance: React.FC = () => {
  const [employeeName, setEmployeeName] = useState('');
  const [employeeRole, setEmployeeRole] = useState('');
  const [month, setMonth] = useState<number>(new Date().getMonth());
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [printingAll, setPrintingAll] = useState(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await axios.get('/api/employees');
        setEmployees(res.data || []);
      } catch {
        setEmployees([]);
      }
    };
    fetchEmployees();
  }, []);

  const handlePrintAttendanceSheet = (name?: string, role?: string) => {
    const days = getDaysInMonth(month, year);
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Optimisation pour une seule page
    const startY = 60; // Réduit de 70 à 60
    const rowHeight = 6; // Réduit de 8 à 6
    const colWidths = [12, 20, 28, 28, 28, 28, 26]; // Légèrement réduit
    const colX = [15];
    for (let i = 0; i < colWidths.length; i++) {
      colX.push(colX[i] + colWidths[i]);
    }
    const headers = ['JOURS', 'Date', "Heure d'arrivée", 'Signature', 'Heure de sortie', 'Signature', 'Observation'];

    // Entête institutionnelle optimisée
    doc.addImage('/logo_polycliniques.jpg', 'JPEG', 10, 5, 25, 25); // Logo plus petit
    doc.setFontSize(9); // Police plus petite
      doc.setFont('helvetica', 'bold');
    doc.text('REPUBLIQUE DEMOCRATIQUE DU CONGO', 40, 10);
    doc.text('PROVINCE DU SUD-KIVU', 40, 14);
    doc.text('VILLE DE BUKAVU', 40, 18);
    doc.text('ZONE DE SANTE URBAINE DE KADUTU', 40, 22);
      doc.setTextColor(230,0,0);
    doc.text('FONDATION UMOJA', 40, 26);
      doc.setTextColor(0,153,0);
    doc.text('"F.U" asbl', 40, 30);
      doc.setTextColor(0,0,0);
    doc.text('DEPARTEMENT DES OEUVRES MEDICALES', 40, 34);
    doc.setFontSize(11);
      doc.setTextColor(0,153,0);
    doc.text('POLYCLINIQUE DES APOTRES', 40, 38);
      doc.setTextColor(0,0,0);
      doc.setDrawColor(230,0,0);
      doc.setLineWidth(1.2);
    doc.line(10, 42, 200, 42); // Ligne plus haute
    
      // Infos employé
    doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
    doc.text(`Nom : ${name || employeeName || '...........................................'}`, 15, 50);
    doc.text(`Fonction : ${role || employeeRole || '...........................................'}`, 120, 50);
    
    // Tableau optimisé
      doc.setFont('helvetica', 'bold');
    doc.setFontSize(8); // Police encore plus petite pour l'en-tête
      doc.setDrawColor(0,0,0);
      doc.setLineWidth(0.3);
    
    // En-tête du tableau
      headers.forEach((h, i) => {
        const xCenter = colX[i] + colWidths[i]/2;
        doc.text(h, xCenter, startY + rowHeight/2, { align: 'center', baseline: 'middle' });
      });
    
      // Bordures de l'en-tête
      for (let i = 0; i < colX.length; i++) {
      doc.line(colX[i], startY, colX[i], startY + rowHeight + rowHeight * days.length);
      }
      doc.line(colX[0], startY, colX[colX.length-1], startY); // haut
      doc.line(colX[0], startY + rowHeight, colX[colX.length-1], startY + rowHeight); // sous en-tête
    
    // Lignes du tableau avec tous les jours
      let y = startY + rowHeight;
    doc.setFontSize(7); // Police plus petite pour le contenu
    days.forEach(({ day, date }) => {
        doc.text(day, colX[0] + colWidths[0]/2, y + rowHeight/2, { align: 'center', baseline: 'middle' });
        doc.text(date, colX[1] + colWidths[1]/2, y + rowHeight/2, { align: 'center', baseline: 'middle' });
        doc.line(colX[0], y, colX[colX.length-1], y);
        y += rowHeight;
      });
      doc.line(colX[0], y, colX[colX.length-1], y);
      for (let i = 0; i < colX.length; i++) {
        doc.line(colX[i], startY, colX[i], y);
      }
    
    // Footer optimisé
    const footerY = 290;
    doc.setFontSize(9);
      doc.setTextColor(0,0,0);
    doc.text('Adresse : DRCONGO/SK/BKV/Av. BUHOZI/KAJANGU/CIRIRI', 105, footerY - 8, { align: 'center' });
    doc.text('Tél : (+243) 975 822 376, 843 066 779', 105, footerY - 4, { align: 'center' });
      doc.text('Email : polycliniquedesapotres1121@gmail.com', 105, footerY, { align: 'center' });
    
    doc.save(`fiche_presence_${name || employeeName || 'employe'}_${month+1}_${year}.pdf`);
  };

  const handlePrintAll = async () => {
    setPrintingAll(true);
    for (const emp of employees) {
      await new Promise(resolve => setTimeout(resolve, 300)); // pour éviter les collisions de téléchargement
      handlePrintAttendanceSheet(`${emp.firstName} ${emp.lastName}`, emp.function);
    }
    setPrintingAll(false);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Présences</h1>
      <p className="text-gray-600 mb-6">Générez la fiche de présence mensuelle d’un employé ou de tout le personnel.</p>
      <div className="card mb-6 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            className="input-field"
            placeholder="Nom de l'employé"
            value={employeeName}
            onChange={e => setEmployeeName(e.target.value)}
            style={{ minWidth: 200 }}
          />
          <input
            type="text"
            className="input-field"
            placeholder="Fonction"
            value={employeeRole}
            onChange={e => setEmployeeRole(e.target.value)}
            style={{ minWidth: 200 }}
          />
          <select
            className="input-field"
            value={month}
            onChange={e => setMonth(Number(e.target.value))}
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i} value={i}>{new Date(0, i).toLocaleString('fr-FR', { month: 'long' })}</option>
            ))}
          </select>
          <input
            type="number"
            className="input-field"
            value={year}
            min={2000}
            max={2100}
            onChange={e => setYear(Number(e.target.value))}
            style={{ width: 100 }}
          />
        </div>
        <button className="btn-primary w-fit" onClick={() => handlePrintAttendanceSheet()}>
          Générer la fiche de présence
        </button>
        <button
          className="btn-secondary w-fit"
          onClick={handlePrintAll}
          disabled={printingAll || employees.length === 0}
        >
          {printingAll ? 'Impression en cours...' : `Imprimer toutes les fiches de présence du mois (${employees.length})`}
        </button>
      </div>
    </div>
  );
};

export default Attendance; 
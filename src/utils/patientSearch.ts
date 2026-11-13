export function folderYear(folderNumber?: string | null): number | null {
  const match = (folderNumber || '').match(/^(?:HOSP-|MAT-)?(20\d{2})/);
  return match ? Number(match[1]) : null;
}

export function patientYears(
  patients: Array<{ folderNumber?: string | null }>,
  currentYear = new Date().getFullYear()
): number[] {
  const years = new Set<number>([currentYear]);
  for (const patient of patients) {
    const year = folderYear(patient.folderNumber);
    if (year) years.add(year);
  }
  return Array.from(years).sort((a, b) => b - a);
}

export function matchesPatientQuery(
  patient: { folderNumber?: string | null; firstName?: string | null; lastName?: string | null },
  search: string,
  year: string
): boolean {
  if (year && String(folderYear(patient.folderNumber) ?? '') !== year) return false;
  const query = search.trim().toLowerCase();
  if (!query) return true;
  const text = `${patient.folderNumber || ''} ${patient.lastName || ''} ${patient.firstName || ''}`.toLowerCase();
  return text.includes(query);
}

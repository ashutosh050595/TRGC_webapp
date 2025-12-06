import { ApplicationData } from '../types';

export const generateCSV = (data: ApplicationData) => {
  // Define columns in a specific order for the Excel Database
  const columns: { header: string; key: keyof ApplicationData }[] = [
    { header: 'Post Applied For', key: 'postAppliedFor' },
    { header: 'Category', key: 'category' },
    { header: 'Name', key: 'name' },
    { header: 'Father Name', key: 'fatherName' },
    { header: 'DOB', key: 'dob' },
    { header: 'Email', key: 'email' },
    { header: 'Phone 1', key: 'contactNo1' },
    { header: 'Phone 2', key: 'contactNo2' },
    { header: 'Address', key: 'correspondenceAddress' },
    { header: 'Masters Score', key: 'academicMasters' },
    { header: 'Graduation Score', key: 'academicGraduation' },
    { header: '12th Score', key: 'academic12th' },
    { header: 'Teaching Exp Score', key: 'teachingExpAbove15' },
    { header: 'Research Score', key: 'research' },
    { header: 'Drive Link', key: 'googleDriveLink' },
    { header: 'UTR No', key: 'utrNo' },
    { header: 'Draft Amount', key: 'draftAmount' },
    { header: 'Draft Date', key: 'draftDate' },
    { header: 'Bank Name', key: 'bankName' },
    { header: 'Submission Date', key: 'date' }
  ];

  const headers = columns.map(c => c.header).join(',');
  const values = columns.map(c => {
    const val = data[c.key];

    if (c.key === 'research') {
      return '"See PDF for details"';
    }

    const stringValue = String(val || '');
    // Escape quotes and wrap in quotes to handle commas
    return `"${stringValue.replace(/"/g, '""')}"`;
  }).join(',');

  const csvContent = `data:text/csv;charset=utf-8,${headers}\n${values}`;
  const encodedUri = encodeURI(csvContent);
  
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `TRGC_DB_Record_${data.name.replace(/\s+/g, '_')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
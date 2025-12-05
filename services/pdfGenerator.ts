import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FormData } from '../types';

interface PDFOutput {
  dataUri: string;
  blob: Blob;
}

export const generatePDF = (data: FormData, shouldDownload: boolean = true): PDFOutput => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  // Helper for centering text
  const centerText = (text: string, y: number, size: number = 10, font: string = 'helvetica', style: string = 'normal') => {
    doc.setFont(font, style);
    doc.setFontSize(size);
    doc.text(text, pageWidth / 2, y, { align: 'center' });
  };

  // --- HEADER ---
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  centerText("TIKA RAM GIRLS COLLEGE, SONEPAT", 15, 14, 'helvetica', 'bold');
  centerText("(Affiliated to M.D., University, Rohtak)", 22, 10);
  doc.setFontSize(9);
  doc.text("Website : www.trgc.edu.in", 14, 28);
  doc.text("email : principal.trgc@gmail.com", pageWidth - 14, 28, { align: 'right' });
  doc.setLineWidth(0.5);
  doc.line(10, 30, pageWidth - 10, 30);

  // --- PHOTO ---
  if (data.photo) {
    // Add placeholder box or actual image
    doc.addImage(data.photo, 'JPEG', pageWidth - 50, 40, 35, 45);
  } else {
    doc.rect(pageWidth - 50, 40, 35, 45); // Placeholder rectangle
    doc.text("Latest Photograph", pageWidth - 32.5, 60, { align: 'center', maxWidth: 30 });
  }

  // --- PAGE 1: PERSONAL INFO ---
  doc.setFontSize(10);
  doc.text("To", 14, 40);
  doc.text("The General Secretary", 20, 45);
  doc.text("Tika Ram Education Society (Regd.)", 20, 50);
  doc.text("Add: Tika Ram Model School", 20, 55);
  doc.text("West Ram Nagar, Sonepat-131001", 20, 60);

  doc.setFont('helvetica', 'bold');
  doc.text(`Subject: Application for the post of ${data.postAppliedFor}`, 14, 75);
  doc.text(`Category: ${data.category}`, pageWidth - 70, 82);
  doc.setFont('helvetica', 'normal');

  doc.text(`With reference to your advertisement in ${data.advertisementRef}`, 14, 90);
  doc.text("I request you to consider my application for above said post. My biodata is given below:", 14, 95);

  const startY = 105;
  const gap = 8;
  
  const fields = [
    { label: "Name", val: data.name },
    { label: "Father's Name", val: data.fatherName },
    { label: "Date of Birth", val: data.dob },
    { label: "Permanent Address", val: data.permanentAddress },
    { label: "Correspondence Address", val: data.correspondenceAddress },
    { label: "Contact No", val: `${data.contactNo1}, ${data.contactNo2}` },
    { label: "Email-ID", val: data.email },
    { label: "Present Employer", val: data.presentEmployer },
  ];

  fields.forEach((field, i) => {
    doc.text(`•  ${field.label}`, 20, startY + (i * gap));
    doc.text(":", 70, startY + (i * gap));
    doc.text(field.val || "", 75, startY + (i * gap));
    // Underline value
    doc.line(75, startY + (i * gap) + 1, pageWidth - 20, startY + (i * gap) + 1);
  });

  doc.text("(Submit NOC in attached format)", 75, startY + (fields.length * gap) + 5);

  // --- PAGE 2: ACADEMIC SCORE ---
  doc.addPage();
  centerText("SCORE SHEETS", 15, 12, 'helvetica', 'bold');
  centerText("(As supplied from DGHE vide dated 18.04.2023)", 22, 10);
  doc.setFont('helvetica', 'bold');
  doc.text("1. Academic Record: Maximum 20 marks", 14, 30);
  
  const academicData = [
    ["1.", "Above 55% marks in Master's degree", "0.5 marks for each % (max 5)", data.academicMasters],
    ["2.", "Above 55% marks in Graduation", "0.4 marks for each % (max 5)", data.academicGraduation],
    ["3.", "Above 55% marks in 10+2/Prep.", "0.3 marks for each % (max 5)", data.academic12th],
    ["4.", "Above 55% marks in Matriculation", "0.2 marks for each % (max 5)", data.academicMatric],
  ];

  autoTable(doc, {
    startY: 35,
    head: [['S.No', 'Particulars', 'Marks Criteria', 'Self-appraisal Marks']],
    body: academicData,
    theme: 'grid',
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
  });

  // --- PAGE 2: TEACHING & ADMIN ---
  let finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.text("2. Teaching Experience and Assessment of Administrative Skill: Maximum 35 marks", 14, finalY);
  finalY += 6;
  doc.text("A. Teaching Experience: Maximum 10 marks", 14, finalY);

  autoTable(doc, {
    startY: finalY + 4,
    head: [['S.No', 'Particulars', 'Marks Criteria', 'Self-appraisal Marks']],
    body: [
      ["1.", "Above 15 years teaching experience", "1 mark for each year", data.teachingExpAbove15]
    ],
    theme: 'grid',
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
  });

  finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.text("B. Assessment of Administrative Skill: Maximum 25 marks", 14, finalY);
  finalY += 6;
  doc.text("(i) Experience of Administrative Responsibilities", 14, finalY);

  autoTable(doc, {
    startY: finalY + 4,
    head: [['S.No', 'Particulars', 'Marks Criteria', 'Self-appraisal Marks']],
    body: [
      ["1.", "Exp as Joint/Deputy/Assistant Director", "1 mark/year", data.adminJointDirector],
      ["2.", "Exp as Registrar/Admin post in Univ", "1 mark/year", data.adminRegistrar],
      ["3.", "Exp as Head of Higher Edu Inst (Principal)", "1 mark/year", data.adminHead],
    ],
    theme: 'grid',
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
  });

  // --- PAGE 3: KEY RESPONSIBILITIES ---
  doc.addPage();
  doc.text("(ii) Experience of Key responsibilities in colleges", 14, 15);
  
  const keyRespData = [
    ["1.", "Staff Rep / V.C. Nominee", "1 mark/year (max 3)", data.respStaffRep],
    ["2.", "Coordinator/Secy of Conference", "1 mark/year (max 3)", data.respCoordinator],
    ["3.", "Bursar", "1 mark/year (max 3)", data.respBursar],
    ["4.", "NSS Programme Officer", "1 mark/year (max 3)", data.respNSS],
    ["5.", "YRC Counsellor", "1 mark/year (max 3)", data.respYRC],
    ["6.", "Hostel Warden", "1 mark/year (max 3)", data.respWarden],
    ["7.", "Member of Statutory Body", "1 mark/year (max 2)", data.respStatutory],
    ["8.", "Associate NCC Officer", "1 mark/year (max 3)", data.respNCC],
  ];

  autoTable(doc, {
    startY: 20,
    head: [['S.No', 'Particulars', 'Marks Criteria', 'Self-appraisal Marks']],
    body: keyRespData,
    theme: 'grid',
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
  });

  // --- COMMITTEES ---
  finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.text("(iii) Experience of Committees in College", 14, finalY);

  const committeeData = [
    ["1.", "Co-ordinator IQAC", "1 mark/yr (max 2)", data.commIQAC],
    ["2.", "Editor in Chief, College Magazine", "1 mark/yr (max 2)", data.commEditor],
    ["3.", "Member, College Advisory Council", "1 mark/yr (max 2)", data.commAdvisory],
    ["4.", "Convener, Univ Work Committee", "1 mark/yr (max 2)", data.commWork],
    ["5.", "Convener, Cultural Affairs", "1 mark/yr (max 2)", data.commCultural],
    ["6.", "Convener, Purchase/Procurement", "1 mark/yr (max 2)", data.commPurchase],
    ["7.", "Convener, Building/Works", "1 mark/yr (max 2)", data.commBuilding],
    ["8.", "Convener, Sports Committee", "1 mark/yr (max 2)", data.commSports],
    ["9.", "Convener, Discipline Committee", "1 mark/yr (max 2)", data.commDiscipline],
    ["10.", "Convener, Internal Complaint", "1 mark/yr (max 2)", data.commInternal],
    ["11.", "Convener, Road Safety Club", "1 mark/yr (max 2)", data.commRoadSafety],
    ["12.", "Convener, Red Ribbon Club", "1 mark/yr (max 2)", data.commRedRibbon],
    ["13.", "Convener, Eco Club", "1 mark/yr (max 2)", data.commEco],
    ["14.", "In-charge, Placement Cell", "1 mark/yr (max 2)", data.commPlacement],
    ["15.", "Incharge, Women Cell", "1 mark/yr (max 2)", data.commWomen],
    ["16.", "In-charge, Time-table Committee", "1 mark/yr (max 2)", data.commTimeTable],
    ["17.", "In-charge, SC/BC Committee", "1 mark/yr (max 2)", data.commSCBC],
  ];

  autoTable(doc, {
    startY: finalY + 4,
    head: [['S.No', 'Particulars', 'Marks Criteria', 'Self-appraisal Marks']],
    body: committeeData,
    theme: 'grid',
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
    margin: { bottom: 20 }
  });

  // --- PAGE 4: RESEARCH & PAYMENT ---
  doc.addPage();
  doc.text("III. Academic/Research Score: Maximum 32.5 marks", 14, 15);
  
  autoTable(doc, {
    startY: 20,
    head: [['S.No', 'Particulars', 'Marks Criteria', 'Self-appraisal Marks']],
    body: [
      ["1.", "Research Score above 110", "0.3 mark per score > 110", data.researchScore]
    ],
    theme: 'grid',
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
  });

  finalY = (doc as any).lastAutoTable.finalY + 15;
  doc.setLineWidth(0.5);
  doc.rect(14, finalY, pageWidth - 28, 30);
  doc.text(`Bank Draft No: ${data.draftNo}`, 20, finalY + 10);
  doc.text(`Date: ${data.draftDate}`, 100, finalY + 10);
  doc.text(`Amount: ${data.draftAmount}`, 160, finalY + 10);
  doc.text(`Name of Bank: ${data.bankName}`, 20, finalY + 20);

  // --- DECLARATION ---
  finalY += 40;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const declarationText = `I ${data.name} D/o S/o W/o ${data.parentName} hereby declare that all the entries made by me in this application form are true and correct to the best of my knowledge and I have attached related proof of documents in form of self attested copies. If anything is found false or incorrect at any stage, my candidature/appointment is liable to be cancelled.`;
  
  doc.text(doc.splitTextToSize(declarationText, pageWidth - 40), 20, finalY);

  finalY += 30;
  doc.text(`Place: ${data.place}`, 20, finalY);
  doc.text(`Date: ${data.date}`, 20, finalY + 6);
  
  if (data.signature) {
    doc.addImage(data.signature, 'PNG', pageWidth - 70, finalY - 10, 40, 15);
  }
  doc.text("(Signature of Applicant)", pageWidth - 60, finalY + 10);

  // --- EMPLOYER CERT ---
  doc.addPage();
  centerText("CERTIFICATE FROM THE EMPLOYER, IF ANY", 15, 14, 'helvetica', 'bold');
  
  const empText = `The application of ${data.name} who is at present working as ${data.empDesignation} in ${data.empDept} is forwarded and recommended for consideration. In case he/she is selected in Tika Ram Girls College, Sonepat, he/she will be relieved from his/her present position on ${data.empNoticePeriod} notice.`;
  
  doc.setFont('helvetica', 'normal');
  doc.text(doc.splitTextToSize(empText, pageWidth - 40), 20, 30);
  
  doc.text("Place: ________________", 20, 70);
  doc.text("Date: _________________", 20, 80);
  
  doc.text("Signature of the Head of Institute", pageWidth - 80, 70);
  doc.text("(Seal of the office)", pageWidth - 80, 75);

  if (shouldDownload) {
    doc.save(`${data.name.replace(/\s+/g, '_')}_Application.pdf`);
  }
  
  return {
    dataUri: doc.output('datauristring'),
    blob: doc.output('blob')
  };
};
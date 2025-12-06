import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ApplicationData } from '../types';

interface PDFOutput {
  dataUri: string;
  blob: Blob;
  base64: string; 
}

export const generatePDF = (data: ApplicationData, shouldDownload: boolean = true): PDFOutput => {
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
    doc.addImage(data.photo, 'JPEG', pageWidth - 50, 40, 35, 45);
  } else {
    doc.rect(pageWidth - 50, 40, 35, 45);
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
    doc.line(75, startY + (i * gap) + 1, pageWidth - 20, startY + (i * gap) + 1);
  });

  doc.text("(Submit NOC in attached format)", 75, startY + (fields.length * gap) + 5);

  // --- PAGE 2: ACADEMIC SCORE ---
  doc.addPage();
  centerText("SCORE SHEETS", 15, 12, 'helvetica', 'bold');
  centerText("(As supplied from DGHE vide dated 18.04.2023)", 22, 10);
  doc.setFont('helvetica', 'bold');
  doc.text("I. Academic Record: Maximum 20 marks", 14, 30);
  
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
  doc.text("II. Teaching Experience and Assessment of Administrative Skill: Maximum 35 marks", 14, finalY);
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

  // --- PAGE 4: RESEARCH (FULL TABLE 2) ---
  doc.addPage();
  doc.text("III. Academic/Research Score (Table 2)", 14, 15);
  
  // Helper to format bold text in cells
  const r = data.research;
  const table2Body = [
    // 1. Research Papers
    [{ content: "1.", rowSpan: 2 }, { content: "Research Papers in Peer-reviewed / UGC Journals", styles: { fontStyle: 'bold' } }, "8/10", r.resPapers],
    [{ content: "For Direct Recruitment: Papers upto 13.06.2019...\nFor CAS: Papers upto 02.07.2023...", colSpan: 3, styles: { fontSize: 8 } }],
    
    // 2. Publications
    ["2.", { content: "Publications (other than Research papers)", styles: { fontStyle: 'bold' } }, "", ""],
    ["", "(a) Books authored which are published by;", "", ""],
    ["", "International publishers", "12", r.resBooksInt],
    ["", "National Publishers", "10", r.resBooksNat],
    ["", "Chapter in Edited Book", "05", r.resChapter],
    ["", "Editor of Book by International Publisher", "10", r.resEditorInt],
    ["", "Editor of Book by National Publisher", "08", r.resEditorNat],
    
    ["", "(b) Translation works in Indian/Foreign Languages", "", ""],
    ["", "Chapter or Research paper", "03", r.resTransChapter],
    ["", "Book", "08", r.resTransBook],

    // 3. ICT
    ["3.", { content: "Creation of ICT mediated Teaching Learning pedagogy...", styles: { fontStyle: 'bold' } }, "", ""],
    ["", "(a) Development of Innovative pedagogy", "05", r.resIctPedagogy],
    ["", "(b) Design of new curricula and courses", "02/curr", r.resIctCurricula],
    ["", "(c) MOOCs", "", ""],
    ["", "Dev of complete MOOCs (4 quadrants)", "20", r.resMoocs4Quad],
    ["", "MOOCs (developed in 4 quadrant) per module", "05", r.resMoocsModule],
    ["", "Content writer/subject matter expert", "02", r.resMoocsContent],
    ["", "Course Coordinator for MOOCs", "08", r.resMoocsCoord],
    ["", "(d) E-Content", "", ""],
    ["", "Dev of e-Content in 4 quadrants for complete course", "12", r.resEcontentComplete],
    ["", "e-Content (developed in 4 quadrants) per module", "05", r.resEcontentModule],
    ["", "Contribution to dev of e-content module", "02", r.resEcontentContrib],
    ["", "Editor of e-content for complete course", "10", r.resEcontentEditor],

    // 4. Guidance
    ["4.", { content: "(a) Research guidance", styles: { fontStyle: 'bold' } }, "", ""],
    ["", "Ph.D.", "10 / 05", r.resPhd],
    ["", "M.Phil./P.G dissertation", "02", r.resMphil],
    ["", "(b) Research Projects Completed", "", ""],
    ["", "More than 10 lakhs", "10", r.resProjMore10],
    ["", "Less than 10 lakhs", "05", r.resProjLess10],
    ["", "(c) Research Projects Ongoing", "", ""],
    ["", "More than 10 lakhs", "05", r.resProjOngoingMore10],
    ["", "Less than 10 lakhs", "02", r.resProjOngoingLess10],
    ["", "(d) Consultancy", "03", r.resConsultancy],

    // 5. Patents
    ["5.", { content: "(a) Patents", styles: { fontStyle: 'bold' } }, "", ""],
    ["", "International", "10", r.resPatentInt],
    ["", "National", "07", r.resPatentNat],
    ["", "(b) Policy Document", "", ""],
    ["", "International", "10", r.resPolicyInt],
    ["", "National", "07", r.resPolicyNat],
    ["", "State", "04", r.resPolicyState],
    ["", "(c) Awards/Fellowship", "", ""],
    ["", "International", "07", r.resAwardInt],
    ["", "National", "05", r.resAwardNat],

    // 6. Invited Lectures
    ["6.", { content: "*Invited lectures / Resource Person / Paper presentation...", styles: { fontStyle: 'bold' } }, "", ""],
    ["", "International (Abroad)", "07", r.resInvitedIntAbroad],
    ["", "International (within country)", "05", r.resInvitedIntWithin],
    ["", "National", "03", r.resInvitedNat],
    ["", "State/University", "02", r.resInvitedState],
  ];

  autoTable(doc, {
    startY: 20,
    head: [['S.No', 'Particulars', 'Marks Criteria', 'Self-appraisal Marks']],
    body: table2Body as any,
    theme: 'grid',
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
    styles: { fontSize: 8, cellPadding: 2 }
  });

  finalY = (doc as any).lastAutoTable.finalY + 15;
  doc.setLineWidth(0.5);
  doc.rect(14, finalY, pageWidth - 28, 40);
  doc.text(`UTR No: ${data.utrNo}`, 20, finalY + 10);
  doc.text(`Date: ${data.draftDate}`, 100, finalY + 10);
  doc.text(`Amount: ${data.draftAmount}`, 160, finalY + 10);
  doc.text(`Bank Name/UPI Provider: ${data.bankName}`, 20, finalY + 20);
  
  // Google Drive Link
  if (data.googleDriveLink) {
    doc.setTextColor(0, 0, 255);
    doc.text(`Google Drive Documents: ${data.googleDriveLink}`, 20, finalY + 30);
    doc.setTextColor(0, 0, 0);
  }

  finalY += 45;
  
  // Note Section
  if (finalY > 250) { doc.addPage(); finalY = 20; }

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  const noteText = "Note: The candidate is to attach the relevant documents in support of his/her claim mentioned in the application form, criteria, Table-2 (Appendix Il contd.) and the same documents are also to be sent with the copies to Dean College Development Council, M.D. University Rohtak and D.G.H.E., Shiksha Sadan, Sector-5, Panchkula Haryana.";
  doc.text(doc.splitTextToSize(noteText, pageWidth - 30), 15, finalY);

  // --- DECLARATION ---
  finalY += 30;
  if (finalY > 250) { doc.addPage(); finalY = 20; }
  
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

  if (shouldDownload) {
    doc.save(`${data.name.replace(/\s+/g, '_')}_Application.pdf`);
  }
  
  const dataUri = doc.output('datauristring');
  const base64 = dataUri.split(',')[1];

  return {
    dataUri,
    blob: doc.output('blob'),
    base64
  };
};
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ApplicationData } from '../types';

interface PDFOutput {
  dataUri: string;
  blob: Blob;
  base64: string; 
}

const formatDate = (dateString: string): string => {
  if (!dateString) return "";
  const [year, month, day] = dateString.split('-');
  return `${day}-${month}-${year}`;
};

export const generatePDF = (data: ApplicationData, shouldDownload: boolean = true): PDFOutput => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height; // Get page height for calculations
  
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
  // Category moved from here to the list below
  doc.setFont('helvetica', 'normal');

  doc.text(`With reference to your advertisement in ${data.advertisementRef}`, 14, 90);
  doc.text("I request you to consider my application for above said post. My biodata is given below:", 14, 95);

  const startY = 105;
  const gap = 8;
  
  const fields = [
    { label: "Name", val: data.name },
    { label: "Father's Name", val: data.fatherName },
    { label: "Date of Birth", val: formatDate(data.dob) }, // Formatted Date
    { label: "Category", val: data.category }, // Moved here
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
  centerText("(As supplied from DGHE vide dated 18.04.2023-Attached with this form in last)", 22, 10);
  doc.setFont('helvetica', 'bold');
  doc.text("I. Academic Record: Maximum 20 marks", 14, 30);
  
  const academicData = [
    ["1.", "Above 55% marks in Master's degree", "0.5 marks for each percentage (maximum 5 marks)", data.academicMasters],
    ["2.", "Above 55% marks in Graduation", "0.4 marks for each percentage (maximum 5 marks)", data.academicGraduation],
    ["3.", "Above 55% marks in 10+2/Prep.", "0.3 marks for each percentage (maximum 5 marks)", data.academic12th],
    ["4.", "Above 55% marks in Matriculation", "0.2 marks for each percentage (maximum 5 marks)", data.academicMatric],
  ];

  autoTable(doc, {
    startY: 35,
    head: [['S.No.', 'Particulars', 'Marks', 'Self-appraisal Marks']],
    body: academicData,
    theme: 'grid',
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineWidth: 0.1, lineColor: [0,0,0] },
    styles: { lineColor: [0,0,0], lineWidth: 0.1, textColor: [0,0,0] },
  });

  // --- PAGE 2: TEACHING & ADMIN ---
  let finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.text("II. Teaching Experience and Assessment of Administrative Skill: Maximum 35 marks", 14, finalY);
  finalY += 6;
  doc.text("A. Teaching Experience: Maximum 10 marks", 14, finalY);

  autoTable(doc, {
    startY: finalY + 4,
    head: [['S.No.', 'Particulars', 'Marks', 'Self-appraisal Marks']],
    body: [
      ["1.", "Above 15 years teaching experience", "1 mark for each year", data.teachingExpAbove15]
    ],
    theme: 'grid',
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineWidth: 0.1, lineColor: [0,0,0] },
    styles: { lineColor: [0,0,0], lineWidth: 0.1, textColor: [0,0,0] },
  });

  finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.text("B. Assessment of Administrative Skill: Maximum 25 marks", 14, finalY);
  finalY += 6;
  doc.text("(i) Experience of Administrative Responsibilities", 14, finalY);

  autoTable(doc, {
    startY: finalY + 4,
    head: [['S.No.', 'Particulars', 'Marks', 'Self-appraisal Marks']],
    body: [
      ["1.", "Experience as Joint/Deputy/Assistant Director in Directorate of Higher Education", "1 mark for each year", data.adminJointDirector],
      ["2.", "Experience as Registrar or any other Administrative post in any University", "1 mark for each year", data.adminRegistrar],
      ["3.", "Experience as Head of the Higher Education Institution i.e. Principal, Officiating Principal/DDO", "1 mark for each year", data.adminHead],
    ],
    theme: 'grid',
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineWidth: 0.1, lineColor: [0,0,0] },
    styles: { lineColor: [0,0,0], lineWidth: 0.1, textColor: [0,0,0] },
  });

  // --- PAGE 3: KEY RESPONSIBILITIES ---
  doc.addPage();
  doc.text("(ii) Experience of Key responsibilities in colleges", 14, 15);
  
  const keyRespData = [
    ["1.", "Staff Representative or V.C. Nominee in Managing Committee of any College", "1 mark for each year maximum upto 3 Marks", data.respStaffRep],
    ["2.", "Co-ordinator or Organizing Secretary of International/National/State Conference/Event", "1 mark for each year maximum upto 3 marks", data.respCoordinator],
    ["3.", "Bursar", "1 mark for each year maximum upto 3 Marks", data.respBursar],
    ["4.", "NSS Programme Officer", "1 mark for each year Maximum upto 3 marks", data.respNSS],
    ["5.", "YRC Counsellor", "1 mark for each year maximum upto 3 Marks", data.respYRC],
    ["6.", "Hostel Warden", "1 mark for each year Maximum upto 3 marks", data.respWarden],
    ["7.", "Member of any Statutory Body of University", "1 mark for each year Maximum upto 2 marks", data.respStatutory],
    ["8.", "Experience as Associate NCC Officer in HEI (s)", "1 mark for each year Maximum upto 3 marks", data.respNCC],
  ];

  autoTable(doc, {
    startY: 20,
    head: [['S.No.', 'Particulars', 'Marks', 'Self-appraisal Marks']],
    body: keyRespData,
    theme: 'grid',
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineWidth: 0.1, lineColor: [0,0,0] },
    styles: { lineColor: [0,0,0], lineWidth: 0.1, textColor: [0,0,0] },
  });

  // --- COMMITTEES ---
  finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.text("(iii) Experience of Committees in College", 14, finalY);

  const committeeData = [
    ["1.", "Co-ordinator IQAC", "1 mark for each academic Year maximum upto 2 marks", data.commIQAC],
    ["2.", "Editor in Chief, College Magazine", "1 mark for each academic Year maximum upto 2 marks", data.commEditor],
    ["3.", "Member, College Advisory Council", "1 mark for each academic Year maximum upto 2 marks", data.commAdvisory],
    ["4.", "Convener, University Work Committee", "1 mark for each academic Year maximum upto 2 marks", data.commWork],
    ["5.", "Convener, Cultural Affairs Committee", "1 mark for each academic Year maximum upto 2 marks", data.commCultural],
    ["6.", "Convener, Purchase/Procurement Committee", "1 mark for each academic year maximum upto 2 marks", data.commPurchase],
    ["7.", "Convener, Building/Works Committee", "1 mark for each academic year maximum upto 2 marks", data.commBuilding],
    ["8.", "Convener, Sports Committee", "1 mark for each academic Year maximum upto 2 marks", data.commSports],
    ["9.", "Convener, Discipline Committee", "1 mark for each academic Year maximum upto 2 marks", data.commDiscipline],
    ["10.", "Convener, Internal (Complaint) Committee", "1 mark for each academic Year maximum upto 2 marks", data.commInternal],
    ["11.", "Convener, Road Safety Club", "1 mark for each academic year maximum upto 2 marks", data.commRoadSafety],
    ["12.", "Convener, Red Ribbon Club", "1 mark for each academic Year maximum upto 2 marks", data.commRedRibbon],
    ["13.", "Convener, Eco Club", "1 mark for each academic Year maximum upto 2 marks", data.commEco],
    ["14.", "In-charge, Placement Cell", "1 mark for each academic Year maximum upto 2 marks", data.commPlacement],
    ["15.", "Incharge, Women Cell", "1 mark for each academic Year maximum upto 2 marks", data.commWomen],
    ["16.", "In-charge, Time-table Committee", "1 mark for each academic Year maximum upto 2 marks", data.commTimeTable],
    ["17.", "In-charge, SC/BC Committee", "1 mark for each academic Year maximum upto 2 marks", data.commSCBC],
  ];

  autoTable(doc, {
    startY: finalY + 4,
    head: [['S.No.', 'Particulars', 'Marks', 'Self-appraisal Marks']],
    body: committeeData,
    theme: 'grid',
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineWidth: 0.1, lineColor: [0,0,0] },
    styles: { lineColor: [0,0,0], lineWidth: 0.1, textColor: [0,0,0] },
    margin: { bottom: 20 }
  });

  // --- PAGE 4: RESEARCH (FULL TABLE 2) ---
  doc.addPage();
  doc.text("TABLE 2: Methodology for University and College Teachers for Calculating Academic/Research Score", 14, 15);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text("(Assessment must be based on evidence produced by the teacher such as : copy of publications, project sanction letter, utilization and completion certificates issued by University and acknowledgements for patent filing and approval letters, students Ph.D. award letter etc.)", 14, 20, { maxWidth: pageWidth - 28 });
  
  // Helper to format bold text in cells
  const r = data.research;
  const table2Body = [
    // 1. Research Papers
    [{ content: "1.", rowSpan: 2 }, { content: "For Direct Recruitment:\nResearch Papers in Peer-reviewed / UGC Journals upto 13.06.2019 and UGC CARE Listed Journals w.e.f. 14.06.2019", styles: { fontStyle: 'bold' } }, "8", "10", r.resPapers],
    [{ content: "For Career Advancement Scheme:\nResearch Papers in Peer-reviewed / UGC Journals upto 02.07.2023 and UGC CARE Listed Journals w.e.f. 03.07.2023", colSpan: 1, styles: { fontSize: 8 } }, {colSpan: 1, content: ""}, {colSpan: 1, content: ""}, {colSpan: 1, content: ""}],
    
    // 2. Publications
    ["2.", { content: "Publications (other than Research papers)", styles: { fontStyle: 'bold' } }, "", "", ""],
    ["", "(a) Books authored which are published by;", "", "", ""],
    ["", "International publishers", "12", "12", r.resBooksInt],
    ["", "National Publishers", "10", "10", r.resBooksNat],
    ["", "Chapter in Edited Book", "05", "05", r.resChapter],
    ["", "Editor of Book by International Publisher", "10", "10", r.resEditorInt],
    ["", "Editor of Book by National Publisher", "08", "08", r.resEditorNat],
    
    ["", "(b) Translation works in Indian and Foreign Languages by qualified faculties", "", "", ""],
    ["", "Chapter or Research paper", "03", "03", r.resTransChapter],
    ["", "Book", "08", "08", r.resTransBook],

    // 3. ICT
    ["3.", { content: "Creation of ICT mediated Teaching Learning pedagogy and content and development of new and innovative courses and curricula", styles: { fontStyle: 'bold' } }, "", "", ""],
    ["", "(a) Development of Innovative pedagogy", "05", "05", r.resIctPedagogy],
    ["", "(b) Design of new curricula and courses", "02/curr", "02/curr", r.resIctCurricula],
    ["", "(c) MOOCs", "", "", ""],
    ["", "Development of complete MOOCs in 4 quadrants (4 credit course)(In case of MOOCs of lesser credits 05 marks/credit)", "20", "20", r.resMoocs4Quad],
    ["", "MOOCs (developed in 4 quadrant) per module/lecture", "05", "05", r.resMoocsModule],
    ["", "Contentwriter/subject matter expert for each moduleof MOOCs (at least one quadrant)", "02", "02", r.resMoocsContent],
    ["", "Course Coordinator for MOOCs (4 credit course)(In case of MOOCs of lesser credits 02 marks/credit)", "08", "08", r.resMoocsCoord],
    ["", "(d) E-Content", "", "", ""],
    ["", "Development of e-Content in 4 quadrants for a complete course/e-book", "12", "12", r.resEcontentComplete],
    ["", "e-Content (developed in 4 quadrants) per module", "05", "05", r.resEcontentModule],
    ["", "Contribution to development of e-content module in complete course/paper/e-book (at least one quadrant)", "02", "02", r.resEcontentContrib],
    ["", "Editor of e-content for complete course/ paper /e-book", "10", "10", r.resEcontentEditor],

    // 4. Guidance
    ["4.", { content: "(a) Research guidance", styles: { fontStyle: 'bold' } }, "", "", ""],
    ["", "Ph.D. (10 per degree / 05 per thesis)", "10", "10", r.resPhd],
    ["", "M.Phil./P.G dissertation (02 per degree)", "02", "02", r.resMphil],
    ["", "(b) Research Projects Completed", "", "", ""],
    ["", "More than 10 lakhs", "10", "10", r.resProjMore10],
    ["", "Less than 10 lakhs", "05", "05", r.resProjLess10],
    ["", "(c) Research Projects Ongoing :", "", "", ""],
    ["", "More than 10 lakhs", "05", "05", r.resProjOngoingMore10],
    ["", "Less than 10 lakhs", "02", "02", r.resProjOngoingLess10],
    ["", "(d) Consultancy", "03", "03", r.resConsultancy],

    // 5. Patents
    ["5.", { content: "(a) Patents", styles: { fontStyle: 'bold' } }, "", "", ""],
    ["", "International", "10", "0", r.resPatentInt],
    ["", "National", "07", "0", r.resPatentNat],
    ["", "(b) *Policy Document (Submitted to an International body/organisation like UNO/UNESCO/World Bank/International Monetary Fund etc. or Central Government or State Government)", "", "", ""],
    ["", "International", "10", "10", r.resPolicyInt],
    ["", "National", "07", "07", r.resPolicyNat],
    ["", "State", "04", "04", r.resPolicyState],
    ["", "(c) Awards/Fellowship", "", "", ""],
    ["", "International", "07", "07", r.resAwardInt],
    ["", "National", "05", "05", r.resAwardNat],

    // 6. Invited Lectures
    ["6.", { content: "*Invited lectures / Resource Person/ paper presentation in Seminars/ Conferences/full paper in Conference Proceedings (Paper presented in Seminars/Conferences and also published as full paper in Conference Proceedings will be counted only once)", styles: { fontStyle: 'bold' } }, "", "", ""],
    ["", "International (Abroad)", "07", "0", r.resInvitedIntAbroad],
    ["", "International (Within Country)", "05", "0", r.resInvitedIntWithin],
    ["", "National", "03", "0", r.resInvitedNat],
    ["", "State/University", "02", "0", r.resInvitedState],
  ];

  autoTable(doc, {
    startY: 35,
    head: [['S.N.', 'Academic/Research Activity', 'Faculty of Sciences/Engineering/Agriculture/Medical/Veterinary Sciences', 'Faculty of Languages/Humanities/Arts/Social Sciences/Library/Education/Physical Education/Commerce/Management & other related disciplines', 'Self Appraisal Marks']],
    body: table2Body as any,
    theme: 'grid',
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineWidth: 0.1, lineColor: [0,0,0] },
    styles: { fontSize: 8, cellPadding: 2, lineWidth: 0.1, lineColor: [0,0,0], textColor: [0,0,0], valign: 'middle' },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 25, halign: 'center' }
    }
  });

  finalY = (doc as any).lastAutoTable.finalY + 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  
  const attachText = "** Attach copies as proof of documents for your calculated API score according to Annexure attached with this form – Table 2, Appendix II (as supplied by DGHE)";
  doc.text(doc.splitTextToSize(attachText, pageWidth - 28), 14, finalY);

  finalY += 15;
  
  // PAGE BREAK CHECK BEFORE PAYMENT SECTION
  // 50 units for height of payment box + margin. If not enough space, add new page.
  if (finalY + 50 > pageHeight) {
    doc.addPage();
    finalY = 20;
  }
  
  doc.setLineWidth(0.5);
  doc.rect(14, finalY, pageWidth - 28, 40);
  doc.text(`UTR No: ${data.utrNo}`, 20, finalY + 10);
  doc.text(`Date: ${formatDate(data.draftDate)}`, 100, finalY + 10);
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
  if (finalY + 30 > pageHeight) { doc.addPage(); finalY = 20; }

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  const noteText = "Note: The candidate is to attach the relevant documents in support of his/her claim mentioned in the application form, criteria, Table-2 (Appendix Il contd.) and the same documents are also to be sent with the copies to Dean College Development Council, M.D. University Rohtak and D.G.H.E., Shiksha Sadan, Sector-5, Panchkula Haryana.";
  doc.text(doc.splitTextToSize(noteText, pageWidth - 30), 15, finalY);

  // --- DECLARATION ---
  finalY += 30;
  if (finalY + 60 > pageHeight) { doc.addPage(); finalY = 20; }
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const declarationText = `I ${data.name} D/o S/o W/o ${data.parentName} hereby declare that all the entries made by me in this application form are true and correct to the best of my knowledge and I have attached related proof of documents in form of self attested copies. If anything is found false or incorrect at any stage, my candidature/appointment is liable to be cancelled.`;
  
  doc.text(doc.splitTextToSize(declarationText, pageWidth - 40), 20, finalY);

  finalY += 30;
  doc.text(`Place: ${data.place}`, 20, finalY);
  doc.text(`Date: ${formatDate(data.date)}`, 20, finalY + 6);
  
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
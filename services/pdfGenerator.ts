

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
  const pageHeight = doc.internal.pageSize.height; 
  
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
  doc.text("email : trgcrecruitment2025@gmail.com", pageWidth - 14, 28, { align: 'right' });
  doc.setLineWidth(0.5);
  doc.line(10, 30, pageWidth - 10, 30);
  
  // Application Number in Header (First Page)
  if (data.applicationNo) {
     doc.setFont('helvetica', 'bold');
     doc.setFontSize(10);
     doc.text(`App. No: ${data.applicationNo}`, pageWidth - 40, 20);
  }

  // --- PHOTO ---
  if (data.photo) {
    doc.addImage(data.photo, 'JPEG', pageWidth - 50, 40, 35, 45);
  }
  doc.rect(pageWidth - 50, 40, 35, 45); // Border for photo

  // --- PERSONAL DETAILS ---
  let yPos = 50;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  doc.text(`To`, 14, 45);
  doc.text(`The General Secretary`, 25, 50);
  doc.text(`Tika Ram Education Society (Regd.)`, 25, 55);
  doc.text(`Add: Tika Ram Model School`, 25, 60);
  doc.text(`West Ram Nagar, Sonepat-131001`, 25, 65);

  yPos = 80;
  doc.setFont('helvetica', 'bold');
  doc.text(`Subject: Application for the post of  ${data.postAppliedFor}`, 14, yPos);
  
  // REMOVED DUPLICATE CATEGORY HERE as per instructions
  yPos += 10;
  doc.setFont('helvetica', 'normal');

  doc.text(`With reference to your advertisement in ${data.advertisementRef}`, 14, yPos);
  doc.text(`I request you to consider my application for above said post. My biodata is given below:`, 14, yPos + 6);

  yPos += 15;
  const labels = [
    { label: "Name", val: data.name },
    { label: "Father's Name", val: data.fatherName },
    { label: "Date of Birth", val: formatDate(data.dob) },
    { label: "Category", val: data.category },
    { label: "Permanent Address", val: data.permanentAddress },
    { label: "Correspondence Address", val: data.correspondenceAddress },
    { label: "Contact No", val: `${data.contactNo1}, ${data.contactNo2}` },
    { label: "Email-ID", val: data.email },
    { label: "Present Employer", val: data.presentEmployer },
  ];

  labels.forEach(item => {
    doc.text(`•   ${item.label}`, 20, yPos);
    doc.text(`:   ${item.val}`, 70, yPos);
    yPos += 7;
  });

  doc.text("(Submit NOC in attached format)", 70, yPos);

  // --- I. ACADEMIC RECORD ---
  doc.addPage();
  yPos = 15;
  centerText("SCORE SHEETS", 15, 11, 'helvetica', 'bold');
  centerText("(As supplied from DGHE vide dated 18.04.2023-Attached with this form in last)", 20, 9);
  
  yPos = 30;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text("I. Academic Record: Maximum 20 marks", 14, yPos);
  
  autoTable(doc, {
    startY: yPos + 2,
    head: [['S.No.', 'Particulars', 'Marks Criteria', 'Self-Appraisal Marks']],
    body: [
      ['1.', 'Above 55% marks in Master\'s degree', '0.5 marks for each percentage (max 5 marks)', data.academicMasters],
      ['2.', 'Above 55% marks in Graduation', '0.4 marks for each percentage (max 5 marks)', data.academicGraduation],
      ['3.', 'Above 55% marks in 10+2/Prep.', '0.3 marks for each percentage (max 5 marks)', data.academic12th],
      ['4.', 'Above 55% marks in Matriculation', '0.2 marks for each percentage (max 5 marks)', data.academicMatric],
    ],
    theme: 'grid',
    headStyles: { fillColor: [255, 255, 255], textColor: 0, lineWidth: 0.1, lineColor: 0 },
    styles: { fontSize: 9, cellPadding: 2, lineColor: 0, lineWidth: 0.1 }
  });

  // --- II. TEACHING & ADMIN ---
  yPos = (doc as any).lastAutoTable.finalY + 10;
  doc.setFont('helvetica', 'bold');
  doc.text("II. Teaching Experience and Assessment of Administrative Skill: Maximum 35 marks", 14, yPos);
  yPos += 5;
  doc.text("A. Teaching Experience: Maximum 10 marks", 14, yPos);

  autoTable(doc, {
    startY: yPos + 2,
    head: [['S.No.', 'Particulars', 'Marks Criteria', 'Self-Appraisal Marks']],
    body: [
      ['1.', 'Above 15 years teaching experience', '1 mark for each year', data.teachingExpAbove15],
    ],
    theme: 'grid',
    headStyles: { fillColor: [255, 255, 255], textColor: 0, lineWidth: 0.1, lineColor: 0 },
    styles: { fontSize: 9, cellPadding: 2, lineColor: 0, lineWidth: 0.1 }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;
  doc.text("B. Assessment of Administrative Skill: Maximum 25 marks", 14, yPos);
  yPos += 5;
  doc.text("(i) Experience of Administrative Responsibilities", 14, yPos);

  autoTable(doc, {
    startY: yPos + 2,
    head: [['S.No.', 'Particulars', 'Marks Criteria', 'Self-Appraisal Marks']],
    body: [
      ['1.', 'Experience as Joint/Deputy/Assistant Director in Directorate of Higher Education', '1 mark for each year', data.adminJointDirector],
      ['2.', 'Experience as Registrar or any other Administrative post in any University', '1 mark for each year', data.adminRegistrar],
      ['3.', 'Experience as Head of the Higher Education Institution i.e. Principal, Officiating Principal/DDO', '1 mark for each year', data.adminHead],
    ],
    theme: 'grid',
    headStyles: { fillColor: [255, 255, 255], textColor: 0, lineWidth: 0.1, lineColor: 0 },
    styles: { fontSize: 9, cellPadding: 2, lineColor: 0, lineWidth: 0.1 }
  });

  // --- RESPONSIBILITIES (New Page) ---
  doc.addPage();
  yPos = 15;
  doc.setFont('helvetica', 'bold');
  doc.text("(ii) Experience of Key responsibilities in colleges", 14, yPos);

  autoTable(doc, {
    startY: yPos + 2,
    head: [['S.No.', 'Particulars', 'Marks Criteria', 'Self-Appraisal Marks']],
    body: [
      ['1.', 'Staff Representative or V.C. Nominee in Managing Committee of any College', '1 mark for each year maximum upto 3 Marks', data.respStaffRep],
      ['2.', 'Co-ordinator or Organizing Secretary of International/National/State Conference/Event', '1 mark for each year maximum upto 3 marks', data.respCoordinator],
      ['3.', 'Bursar', '1 mark for each year maximum upto 3 Marks', data.respBursar],
      ['4.', 'NSS Programme Officer', '1 mark for each year Maximum upto 3 marks', data.respNSS],
      ['5.', 'YRC Counsellor', '1 mark for each year maximum upto 3 Marks', data.respYRC],
      ['6.', 'Hostel Warden', '1 mark for each year Maximum upto 3 marks', data.respWarden],
      ['7.', 'Member of any Statutory Body of University', '1 mark for each year Maximum upto 2 marks', data.respStatutory],
      ['8.', 'Experience as Associate NCC Officer in HEI (s)', '1 mark for each year Maximum upto 3 marks', data.respNCC],
    ],
    theme: 'grid',
    headStyles: { fillColor: [255, 255, 255], textColor: 0, lineWidth: 0.1, lineColor: 0 },
    styles: { fontSize: 9, cellPadding: 2, lineColor: 0, lineWidth: 0.1 }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;
  doc.text("(iii) Experience of Committees in College", 14, yPos);

  autoTable(doc, {
    startY: yPos + 2,
    head: [['S.No.', 'Particulars', 'Marks Criteria', 'Self-Appraisal Marks']],
    body: [
      ['1.', 'Co-ordinator IQAC', '1 mark for each academic Year maximum upto 2 marks', data.commIQAC],
      ['2.', 'Editor in Chief, College Magazine', '1 mark for each academic Year maximum upto 2 marks', data.commEditor],
      ['3.', 'Member, College Advisory Council', '1 mark for each academic Year maximum upto 2 marks', data.commAdvisory],
      ['4.', 'Convener, University Work Committee', '1 mark for each academic Year maximum upto 2 marks', data.commWork],
      ['5.', 'Convener, Cultural Affairs Committee', '1 mark for each academic Year maximum upto 2 marks', data.commCultural],
      ['6.', 'Convener, Purchase/Procurement Committee', '1 mark for each academic year maximum upto 2 marks', data.commPurchase],
      ['7.', 'Convener, Building/Works Committee', '1 mark for each academic year maximum upto 2 marks', data.commBuilding],
      ['8.', 'Convener, Sports Committee', '1 mark for each academic Year maximum upto 2 marks', data.commSports],
      ['9.', 'Convener, Discipline Committee', '1 mark for each academic Year maximum upto 2 marks', data.commDiscipline],
      ['10.', 'Convener, Internal (Complaint) Committee', '1 mark for each academic Year maximum upto 2 marks', data.commInternal],
      ['11.', 'Convener, Road Safety Club', '1 mark for each academic year maximum upto 2 marks', data.commRoadSafety],
      ['12.', 'Convener, Red Ribbon Club', '1 mark for each academic Year maximum upto 2 marks', data.commRedRibbon],
      ['13.', 'Convener, Eco Club', '1 mark for each academic Year maximum upto 2 marks', data.commEco],
      ['14.', 'In-charge, Placement Cell', '1 mark for each academic Year maximum upto 2 marks', data.commPlacement],
      ['15.', 'Incharge, Women Cell', '1 mark for each academic Year maximum upto 2 marks', data.commWomen],
      ['16.', 'In-charge, Time-table Committee', '1 mark for each academic Year maximum upto 2 marks', data.commTimeTable],
      ['17.', 'In-charge, SC/BC Committee', '1 mark for each academic Year maximum upto 2 marks', data.commSCBC],
    ],
    theme: 'grid',
    headStyles: { fillColor: [255, 255, 255], textColor: 0, lineWidth: 0.1, lineColor: 0 },
    styles: { fontSize: 9, cellPadding: 2, lineColor: 0, lineWidth: 0.1 }
  });

  // --- III. RESEARCH SCORE (Table 2) ---
  doc.addPage();
  yPos = 15;
  doc.setFont('helvetica', 'bold');
  // Left aligned header as requested
  doc.setFontSize(11);
  doc.text("III. Academic/Research Score: Maximum 32.5 marks", 14, yPos);
  
  centerText("MDU AC PASSED TABLE 2: Methodology for University and College Teachers for Calculating Academic/Research Score", yPos + 6, 9, 'helvetica', 'bold');
  
  yPos += 15;
  // Print the assessment note
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const assessNote = "(Assessment must be based on evidence produced by the teacher such as : copy of publications, project sanction letter, utilization and completion certificates issued by University and acknowledgements for patent filing and approval letters, students Ph.D. award letter etc.)";
  const splitAssess = doc.splitTextToSize(assessNote, pageWidth - 28);
  doc.text(splitAssess, 14, yPos);
  
  yPos += (splitAssess.length * 4) + 2;

  autoTable(doc, {
    startY: yPos,
    head: [[
      'S.N.', 
      'Academic/Research Activity', 
      'Faculty of Sciences/\nEngineering/Agriculture/\nMedical/Veterinary Sciences', 
      'Faculty of Languages/\nHumanities/Arts/Social \nSciences/Library/Education/\nPhysical Education/Commerce/\nManagement & other related \ndisciplines', 
      'Self Appraisal Marks'
    ]],
    body: [
      // 1. Research Papers (Split for mixed styling)
      [
        { content: '1.', rowSpan: 4, styles: { valign: 'middle' } },
        { content: 'For Direct Recruitment:', styles: { fontStyle: 'bold' } }, // Bold
        { content: '08', rowSpan: 4, styles: { valign: 'middle', halign: 'center' } },
        { content: '10', rowSpan: 4, styles: { valign: 'middle', halign: 'center' } },
        { content: data.research.resPapers, rowSpan: 4, styles: { valign: 'middle', halign: 'center' } }
      ],
      [
        { content: 'Research Papers in Peer-reviewed / UGC Journals upto 13.06.2019 and UGC CARE Listed Journals w.e.f. 14.06.2019' }
      ],
      [
        { content: 'For Career Advancement Scheme:', styles: { fontStyle: 'bold' } } // Bold
      ],
      [
        { content: 'Research Papers in Peer-reviewed / UGC Journals upto 02.07.2023 and UGC CARE Listed Journals w.e.f. 03.07.2023' }
      ],
      
      // 2. Publications
      [{ content: '2. Publications (other than Research papers)', colSpan: 5, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }],
      
      // 2(a) Bold
      [{ content: '(a) Books authored which are published by;', colSpan: 5, styles: { fontStyle: 'bold' } }],
      ['', 'International publishers', '12', '12', data.research.resBooksInt],
      ['', 'National Publishers', '10', '10', data.research.resBooksNat],
      ['', 'Chapter in Edited Book', '05', '05', data.research.resChapter],
      ['', 'Editor of Book by International Publisher', '10', '10', data.research.resEditorInt],
      ['', 'Editor of Book by National Publisher', '08', '08', data.research.resEditorNat],
      
      // 2(b) Bold
      [{ content: '(b) Translation works in Indian and Foreign Languages by qualified faculties', colSpan: 5, styles: { fontStyle: 'bold' } }],
      ['', 'Chapter or Research paper', '03', '03', data.research.resTransChapter],
      ['', 'Book', '08', '08', data.research.resTransBook],

      // 3. ICT
      [{ content: '3. Creation of ICT mediated Teaching Learning pedagogy and content and development of new and innovative courses and curricula', colSpan: 5, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }],
      
      // 3(a) Bold
      [{ content: '(a) Development of Innovative pedagogy', colSpan: 5, styles: { fontStyle: 'bold' } }],
      ['', 'Development of Innovative pedagogy', '05', '05', data.research.resIctPedagogy],
      
      // 3(b) Bold
      [{ content: '(b) Design of new curricula and courses', colSpan: 5, styles: { fontStyle: 'bold' } }],
      ['', 'Design of new curricula and courses', '02 per curricula/course', '02 per curricula/course', data.research.resIctCurricula],

      // 3(c) Bold
      [{ content: '(c) MOOCs', colSpan: 5, styles: { fontStyle: 'bold' } }],
      ['', 'Development of complete MOOCs in 4 quadrants (4 credit course)(In case of MOOCs of lesser credits 05 marks/credit)', '20', '20', data.research.resMoocs4Quad],
      ['', 'MOOCs (developed in 4 quadrant) per module/lecture', '05', '05', data.research.resMoocsModule],
      ['', 'Content writer/Subject matter expert for each module of MOOCs (at least one quadrant)', '02', '02', data.research.resMoocsContent],
      ['', 'Course Coordinator for MOOCs (4 credit course)(In case of MOOCs of lesser credits 02 marks/credit)', '08', '08', data.research.resMoocsCoord],

      // 3(d) Bold
      [{ content: '(d) E-Content', colSpan: 5, styles: { fontStyle: 'bold' } }],
      ['', 'Development of e-Content in 4 quadrants for a complete course/e-book', '12', '12', data.research.resEcontentComplete],
      ['', 'e-Content (developed in 4 quadrants) per module', '05', '05', data.research.resEcontentModule],
      ['', 'Contribution to development of e-content module in complete course/paper/e-book (at least one quadrant)', '02', '02', data.research.resEcontentContrib],
      ['', 'Editor of e-content for complete course/ paper /e-book', '10', '10', data.research.resEcontentEditor],

      // 4. Guidance
      [{ content: '4. (a) Research guidance', colSpan: 5, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }],
      ['', 'Ph.D.\n(10 per degree awarded 05 per thesis submitted)', '10 per degree awarded 05 per thesis submitted', '10 per degree awarded 05 per thesis submitted', data.research.resPhd],
      ['', 'M.Phil./P.G dissertation', '02 per degree awarded', '02 per degree awarded', data.research.resMphil],

      // 4(b) Bold
      [{ content: '(b) Research Projects Completed', colSpan: 5, styles: { fontStyle: 'bold' } }],
      ['', 'More than 10 lakhs', '10', '10', data.research.resProjMore10],
      ['', 'Less than 10 lakhs', '05', '05', data.research.resProjLess10],

      // 4(c) Bold
      [{ content: '(c) Research Projects Ongoing :', colSpan: 5, styles: { fontStyle: 'bold' } }],
      ['', 'More than 10 lakhs', '05', '05', data.research.resProjOngoingMore10],
      ['', 'Less than 10 lakhs', '02', '02', data.research.resProjOngoingLess10],

      // 4(d) Bold
      [{ content: '(d) Consultancy', colSpan: 5, styles: { fontStyle: 'bold' } }],
      ['', 'Consultancy', '03', '03', data.research.resConsultancy],

      // 5. Patents
      [{ content: '5. (a) Patents', colSpan: 5, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }],
      ['', 'International', '10', '0', data.research.resPatentInt],
      ['', 'National', '07', '0', data.research.resPatentNat],

      // 5(b) Bold
      [{ content: '(b) *Policy Document (Submitted to an International body/organisation like UNO/UNESCO/World Bank/International Monetary Fund etc. or Central Government or State Government)', colSpan: 5, styles: { fontStyle: 'bold' } }],
      ['', 'International', '10', '10', data.research.resPolicyInt],
      ['', 'National', '07', '07', data.research.resPolicyNat],
      ['', 'State', '04', '04', data.research.resPolicyState],

      // 5(c) Bold
      [{ content: '(c) Awards/Fellowship', colSpan: 5, styles: { fontStyle: 'bold' } }],
      ['', 'International', '07', '07', data.research.resAwardInt],
      ['', 'National', '05', '05', data.research.resAwardNat],

      // 6. Invited Lectures
      [{ content: '6. *Invited lectures / Resource Person/ paper presentation in Seminars/ Conferences/full paper in Conference Proceedings (Paper presented in Seminars/Conferences and also published as full paper in Conference Proceedings will be counted only once)', colSpan: 5, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }],
      ['', 'International (Abroad)', '07', '0', data.research.resInvitedIntAbroad],
      ['', 'International (within country)', '05', '0', data.research.resInvitedIntWithin],
      ['', 'National', '03', '0', data.research.resInvitedNat],
      ['', 'State/University', '02', '0', data.research.resInvitedState],
    ],
    theme: 'grid',
    headStyles: { fillColor: [255, 255, 255], textColor: 0, lineWidth: 0.1, lineColor: 0 },
    styles: { fontSize: 8, cellPadding: 2, lineColor: 0, lineWidth: 0.1, valign: 'middle' },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 35, halign: 'center' }, // Adjusted for longer headers
      3: { cellWidth: 35, halign: 'center' },
      4: { cellWidth: 20, halign: 'center' }
    }
  });

  // --- ANNEXURE NOTE ---
  // Added right after the table finalY
  yPos = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  const attachNote = "** Attach copies as proof of documents for your calculated APl score according to Annexure attached with this form - Table 2, Appendix II (as supplied by DGHE)";
  const splitAttachNote = doc.splitTextToSize(attachNote, pageWidth - 28);
  
  // Check page break for Note
  if (yPos + (splitAttachNote.length * 4) > pageHeight - 20) {
     doc.addPage();
     yPos = 20;
  }
  
  doc.text(splitAttachNote, 14, yPos);
  yPos += (splitAttachNote.length * 4) + 5;


  if (data.googleDriveLink) {
    // Check page break for Drive Link
    if (yPos + 10 > pageHeight - 20) {
       doc.addPage();
       yPos = 20;
    }
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text(`Large Research Files Link: ${data.googleDriveLink}`, 14, yPos);
    yPos += 10;
  }

  // --- FOOTER NOTE (Page Break Check) ---
  yPos += 10;
  if (yPos > pageHeight - 40) {
    doc.addPage();
    yPos = 20;
  }
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  const note = "Note: The candidate is to attach the relevant documents in support of his/her claim mentioned in the application form, criteria, Table-2 (Appendix II contd.) and the same documents are also to be sent with the copies to Dean College Development Council, M.D. University Rohtak and D.G.H.E., Shiksha Sadan, Sector-5, Panchkula Haryana.";
  const splitNote = doc.splitTextToSize(note, pageWidth - 28);
  doc.text(splitNote, 14, yPos);

  // --- PAYMENT DETAILS SECTION ---
  yPos += 20;
  if (yPos > pageHeight - 60) {
     doc.addPage();
     yPos = 20;
  }

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text("Payment Details", 14, yPos);
  
  autoTable(doc, {
    startY: yPos + 5,
    body: [
      ['Amount Paid', `Rs. ${data.paymentAmount}`],
      ['UTR No.', data.utrNo],
      ['Date', formatDate(data.date)],
      ['UPI Provider', data.upiProvider],
      ['UPI Address', data.upiAddress],
      ['Account Holder Name', data.accountHolderName],
    ],
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } }
  });

  // Payment Screenshot
  if (data.filePaymentScreenshot) {
    yPos = (doc as any).lastAutoTable.finalY + 10;
    if (yPos > pageHeight - 80) {
       doc.addPage();
       yPos = 20;
    }
    doc.text("Payment Proof:", 14, yPos);
    try {
      doc.addImage(data.filePaymentScreenshot, 'JPEG', 14, yPos + 5, 80, 80); // Adjust size as needed
    } catch (e) {
      // Ignore format errors
    }
  }

  // --- DECLARATION ---
  doc.addPage();
  yPos = 20;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const declarationText = `I ${data.name} ${data.parentName ? (data.parentName.startsWith('D/o') || data.parentName.startsWith('S/o') ? '' : 'D/o S/o W/o') + ' ' + data.parentName : 'D/o S/o W/o...'} hereby declare that all the entries made by me in this application form are true and correct to the best of my knowledge and I have attached related proof of documents in form of self attested copies. If anything is found false or incorrect at any stage, my candidature/appointment is liable to be cancelled.`;
  
  const splitDec = doc.splitTextToSize(declarationText, pageWidth - 28);
  doc.text(splitDec, 14, yPos);

  yPos += 30;
  doc.text(`Place: ${data.place}`, 14, yPos);
  yPos += 7;
  doc.text(`Date: ${formatDate(data.date)}`, 14, yPos);

  if (data.signature) {
    doc.addImage(data.signature, 'JPEG', pageWidth - 70, yPos - 10, 50, 20);
  }
  doc.text("(Signature of Applicant)", pageWidth - 60, yPos + 15);


  // --- ADD FOOTER TO ALL PAGES ---
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`Application No: ${data.applicationNo || 'N/A'}`, 14, pageHeight - 10);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 25, pageHeight - 10);
  }

  const output: PDFOutput = {
    dataUri: doc.output('datauristring'),
    blob: doc.output('blob'),
    base64: doc.output('datauristring').split(',')[1]
  };

  if (shouldDownload) {
    doc.save(`${data.applicationNo || 'TRGC_Application'}_${data.name}.pdf`);
  }

  return output;
};
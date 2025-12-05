import { PDFDocument, PDFPage } from 'pdf-lib';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Helper to generate the Appendix PDF in memory if the file is missing
const generateAppendixPDF = (): ArrayBuffer => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // --- HEADER ---
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text("Table 2", pageWidth / 2, 10, { align: 'center' });
  doc.setFontSize(9);
  doc.text("(Appendix II Contd.)", pageWidth - 14, 10, { align: 'right' });
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  const title = "Methodology for University and College Teachers for calculating Academic/Research Score";
  doc.text(doc.splitTextToSize(title, pageWidth - 30), 15, 20);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  const subtext = "(Assessment must be based on evidence produced by the teacher such as: copy of publications, project sanction letter, utilization and completion certificates issued by the University and acknowledgements for patent filing and approval letters, students' Ph.D. award letter, etc.)";
  doc.text(doc.splitTextToSize(subtext, pageWidth - 30), 15, 30);

  // --- TABLE CONTENT ---
  const bodyData = [
    [
      { content: "1.", rowSpan: 2 },
      { content: "Research Papers in Peer-reviewed / UGC Journals", styles: { fontStyle: 'bold' } },
      { content: "8", styles: { halign: 'center' } },
      { content: "10", styles: { halign: 'center' } }
    ],
    [
      { content: "For Direct Recruitment:\nResearch Papers upto 13.06.2019 and UGC CARE Listed w.e.f. 14.06.2019\nFor Career Advancement Scheme:\nResearch Papers upto 02.07.2023 and UGC CARE Listed w.e.f. 03.07.2023", colSpan: 3 }
    ],
    // Section 2
    [
      "2.",
      { content: "Publications (other than Research papers)", styles: { fontStyle: 'bold' } },
      "",
      ""
    ],
    [
      "",
      "(a) Books authored which are published by;",
      "",
      ""
    ],
    ["", "International publishers", "12", "12"],
    ["", "National Publishers", "10", "10"],
    ["", "Chapter in Edited Book", "05", "05"],
    ["", "Editor of Book by International Publisher", "10", "10"],
    ["", "Editor of Book by National Publisher", "08", "08"],
    // Section 2b
    [
      "",
      "(b) Translation works in Indian and Foreign Languages by qualified faculties",
      "",
      ""
    ],
    ["", "Chapter or Research paper", "03", "03"],
    ["", "Book", "08", "08"],
    // Section 3
    [
      "3.",
      { content: "Creation of ICT mediated Teaching Learning pedagogy and content and development of new and innovative courses and curricula", styles: { fontStyle: 'bold' } },
      "",
      ""
    ],
    ["", "(a) Development of Innovative pedagogy", "05", "05"],
    ["", "(b) Design of new curricula and courses", "02 per curricula/course", "02 per curricula/course"],
    ["", "(c) MOOCs", "", ""],
    ["", "Development of complete MOOCs in 4 quadrants (4 credit course) (In case of MOOCs of lesser credits 05 marks/credit)", "20", "20"],
    ["", "MOOCs (developed in 4 quadrant) per module/lecture", "05", "05"],
    ["", "Content writer/subject matter expert for each module of MOOCs", "02", "02"],
    ["", "Course Coordinator for MOOCs (4 credit course)", "08", "08"],
    ["", "(d) E-Content", "", ""],
    ["", "Development of e-Content in 4 quadrants for a complete course/e-book", "12", "12"],
    ["", "e-Content (developed in 4 quadrants) per module", "05", "05"],
    ["", "Contribution to development of e-content module in complete course/paper/e-book", "02", "02"],
    ["", "Editor of e-content for complete course/paper/e-book", "10", "10"],
    // Section 4
    [
      "4.",
      { content: "(a) Research guidance", styles: { fontStyle: 'bold' } },
      "",
      ""
    ],
    ["", "Ph.D.", "10 per degree awarded\n05 per thesis submitted", "10 per degree awarded\n05 per thesis submitted"],
    ["", "M.Phil./P.G dissertation", "02 per degree awarded", "02 per degree awarded"],
    ["", "(b) Research Projects Completed", "", ""],
    ["", "More than 10 lakhs", "10", "10"],
    ["", "Less than 10 lakhs", "05", "05"],
    ["", "(c) Research Projects Ongoing:", "", ""],
    ["", "More than 10 lakhs", "05", "05"],
    ["", "Less than 10 lakhs", "02", "02"],
    ["", "(d) Consultancy", "03", "03"],
    // Section 5
    [
      "5.",
      { content: "(a) Patents", styles: { fontStyle: 'bold' } },
      "",
      ""
    ],
    ["", "International", "10", "10"],
    ["", "National", "07", "07"],
    ["", "(b) Policy Document (Submitted to an International body/organisation like UNO/UNESCO/World Bank/International Monetary Fund etc. or Central Government or State Government)", "", ""],
    ["", "International", "10", "10"],
    ["", "National", "07", "07"],
    ["", "State", "04", "04"],
    ["", "(c) Awards/Fellowship", "", ""],
    ["", "International", "07", "07"],
    ["", "National", "05", "05"],
    // Section 6
    [
      "6.",
      { content: "*Invited lectures / Resource Person/ paper presentation in Seminars/ Conferences/full paper in Conference Proceedings (Paper presented in Seminars/Conferences and also published as full paper in Conference Proceedings will be counted only once)", styles: { fontStyle: 'bold' } },
      "",
      ""
    ],
    ["", "International (Abroad)", "07", "07"],
    ["", "International (within country)", "05", "05"],
    ["", "National", "03", "03"],
    ["", "State/University", "02", "02"]
  ];

  autoTable(doc, {
    startY: 45,
    head: [[
      { content: "S.N.", styles: { halign: 'center', valign: 'middle' } },
      { content: "Academic/Research Activity", styles: { halign: 'center', valign: 'middle' } },
      { content: "Faculty of Sciences / Engineering / Agriculture / Medical / Veterinary Sciences", styles: { halign: 'center' } },
      { content: "Faculty of Languages / Humanities / Arts / Social Sciences / Library / Education / Commerce / Management & other related disciplines", styles: { halign: 'center' } }
    ]],
    body: bodyData,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontSize: 8, fontStyle: 'bold', lineWidth: 0.1 },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 35, halign: 'center' },
      3: { cellWidth: 35, halign: 'center' }
    }
  });

  // Footer / Notes
  let finalY = (doc as any).lastAutoTable.finalY + 10;
  
  // Check if we need a new page for notes
  if (finalY > 250) {
    doc.addPage();
    finalY = 20;
  }

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const notes = [
    "The Research score for research papers (Peer-Reviewed upto 02.07.2023 and UGC CARE List w.e.f. 03.07.2023) would be as follows:",
    "i) Paper in refereed journals without impact factor - 5 Points",
    "ii) Paper with impact factor less than 1 - 10 Points",
    "iii) Paper with impact factor between 1 and 2 - 15 Points",
    "iv) Paper with impact factor between 2 and 5 - 20 Points",
    "v) Paper with impact factor between 5 and 10 - 25 Points",
    "vi) Paper with impact factor > 10 - 30 Points",
    "(Impact factor to be determined as per Thomson Reuters list)",
    "",
    "(a) Two authors: 70% of total value of publication for each author.",
    "(b) More than two authors: 70% of total value of publication for the First/Principal/Supervisor/Co-supervisor Corresponding author and 30% of total value of publication for each of the joint authors.",
    "(c) For Publications other than Research Paper, 70% of total value of Publication for each author in case of two authors and 30% of total value of publication in case of more than 2 authors. However, first/corresponding author will get 70% marks irrespective of total number of authors.",
    "Joint Projects: Principal Investigator and Co-Investigator would get 50% each."
  ];

  notes.forEach(note => {
    if (finalY > 280) {
      doc.addPage();
      finalY = 20;
    }
    const lines = doc.splitTextToSize(note, pageWidth - 28);
    doc.text(lines, 14, finalY);
    finalY += (lines.length * 4) + 1;
  });

  return doc.output('arraybuffer');
};

export const mergePDFs = async (generatedPdfBlob: Blob): Promise<{ base64: string; blob: Blob }> => {
  try {
    // 1. Create a new PDF document to hold the merged content
    const mergedPdf = await PDFDocument.create();
    
    // 2. Load the Application Form PDF (Generated client-side)
    const genPdfBytes = await generatedPdfBlob.arrayBuffer();
    const genPdf = await PDFDocument.load(genPdfBytes);
    const genPages = await mergedPdf.copyPages(genPdf, genPdf.getPageIndices());
    genPages.forEach((page: PDFPage) => mergedPdf.addPage(page));

    // 3. Try to fetch external instructions.pdf, if fails, generate programmatically
    try {
      // NOTE: This fetch will likely fail if the file is not hosted.
      // We use a short timeout or just proceed to fallback immediately if 404.
      const response = await fetch('/instructions.pdf', { method: 'HEAD' });
      
      if (response.ok) {
        const fullResponse = await fetch('/instructions.pdf');
        const instPdfBytes = await fullResponse.arrayBuffer();
        const instPdf = await PDFDocument.load(instPdfBytes);
        const instPages = await mergedPdf.copyPages(instPdf, instPdf.getPageIndices());
        instPages.forEach((page: PDFPage) => mergedPdf.addPage(page));
        console.log("Merged external instructions.pdf successfully.");
      } else {
        throw new Error("File not found");
      }
    } catch (e) {
      console.warn("External instructions.pdf not found. Generating Appendix programmatically.");
      
      // FALLBACK: Generate Appendix PDF in-memory
      const appendixBuffer = generateAppendixPDF();
      const appendixPdf = await PDFDocument.load(appendixBuffer);
      const appPages = await mergedPdf.copyPages(appendixPdf, appendixPdf.getPageIndices());
      
      appPages.forEach((page: PDFPage) => mergedPdf.addPage(page));
    }

    // 4. Save and return
    const mergedBytes = await mergedPdf.save();
    
    // Cast to any to avoid TypeScript Blob/Uint8Array conflict
    const mergedBlob = new Blob([mergedBytes as any], { type: 'application/pdf' });

    // Convert to Base64
    let binary = '';
    const len = mergedBytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(mergedBytes[i]);
    }
    const base64 = btoa(binary);

    return { base64, blob: mergedBlob };

  } catch (error) {
    console.error("PDF Merge Failed:", error);
    // Fallback: return the original generated PDF if merge completely fails
    const reader = new FileReader();
    return new Promise((resolve) => {
      reader.readAsDataURL(generatedPdfBlob);
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve({ base64, blob: generatedPdfBlob });
      };
    });
  }
};
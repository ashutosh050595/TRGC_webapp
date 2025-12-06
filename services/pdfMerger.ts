import { PDFDocument, PDFPage } from 'pdf-lib';

/**
 * Merges the generated Application Form PDF with user uploaded documents
 * (Academic Docs, Teaching Docs, Research Docs, NOC)
 */
export const mergePDFs = async (
  mainFormBlob: Blob, 
  attachments: (string | null)[] // Array of Base64 strings (PDFs)
): Promise<{ base64: string; blob: Blob }> => {
  try {
    const mergedPdf = await PDFDocument.create();

    // 1. Load Main Application Form
    const formBuffer = await mainFormBlob.arrayBuffer();
    const formPdf = await PDFDocument.load(formBuffer);
    const formPages = await mergedPdf.copyPages(formPdf, formPdf.getPageIndices());
    formPages.forEach((page: PDFPage) => mergedPdf.addPage(page));

    // 2. Loop through attachments and append them
    for (const base64Pdf of attachments) {
      if (!base64Pdf) continue;

      try {
        // base64Pdf string usually comes with "data:application/pdf;base64," prefix from FileReader
        // We need to strip it if present, though PDFDocument.load might handle it, better safe.
        const cleanBase64 = base64Pdf.includes(',') ? base64Pdf.split(',')[1] : base64Pdf;
        
        // Convert Base64 to Uint8Array
        const binaryString = window.atob(cleanBase64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const attachedPdf = await PDFDocument.load(bytes);
        const attachedPages = await mergedPdf.copyPages(attachedPdf, attachedPdf.getPageIndices());
        attachedPages.forEach((page: PDFPage) => mergedPdf.addPage(page));
        
      } catch (e) {
        console.warn("Failed to merge an attachment:", e);
        // We continue merging other files even if one fails
      }
    }

    // 3. Save merged PDF
    const mergedBytes = await mergedPdf.save();
    const mergedBlob = new Blob([mergedBytes as any], { type: 'application/pdf' });

    // 4. Convert to Base64 safe for email
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64String = result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(mergedBlob);
    });

    return { base64, blob: mergedBlob };

  } catch (error) {
    console.error("PDF Merge Failed:", error);
    // Fallback: return just the form if merge fails
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(mainFormBlob);
    });
    return { base64, blob: mainFormBlob };
  }
};
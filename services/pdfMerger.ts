import { PDFDocument, PDFPage, rgb, StandardFonts } from 'pdf-lib';

interface Attachment {
  base64: string | null;
  title: string;
}

/**
 * Merges the generated Application Form PDF with user uploaded documents.
 * Adds a header title to each page of the attachments for verification.
 */
export const mergePDFs = async (
  mainFormBlob: Blob, 
  attachments: Attachment[] 
): Promise<{ base64: string; blob: Blob }> => {
  try {
    const mergedPdf = await PDFDocument.create();

    // 1. Load Main Application Form
    const formBuffer = await mainFormBlob.arrayBuffer();
    const formPdf = await PDFDocument.load(formBuffer);
    const formPages = await mergedPdf.copyPages(formPdf, formPdf.getPageIndices());
    formPages.forEach((page: PDFPage) => mergedPdf.addPage(page));

    // 2. Loop through attachments and append them
    for (const attach of attachments) {
      if (!attach.base64) continue;

      try {
        // base64 string usually comes with "data:application/pdf;base64," prefix from FileReader
        const cleanBase64 = attach.base64.includes(',') ? attach.base64.split(',')[1] : attach.base64;
        
        // Convert Base64 to Uint8Array
        const binaryString = window.atob(cleanBase64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const attachedPdf = await PDFDocument.load(bytes);
        const attachedPages = await mergedPdf.copyPages(attachedPdf, attachedPdf.getPageIndices());
        
        // Embed font for drawing title
        const font = await mergedPdf.embedFont(StandardFonts.HelveticaBold);

        attachedPages.forEach((page: PDFPage) => {
           // Add Header Title to each page
           const { width, height } = page.getSize();
           const fontSize = 12;
           const titleText = attach.title.toUpperCase();
           const textWidth = font.widthOfTextAtSize(titleText, fontSize);
           
           // Draw a small background rectangle for text readability
           page.drawRectangle({
             x: (width - textWidth) / 2 - 10,
             y: height - 25,
             width: textWidth + 20,
             height: 20,
             color: rgb(1, 1, 1), // White background
           });

           // Draw Title Text at top center
           page.drawText(titleText, {
             x: (width - textWidth) / 2,
             y: height - 15,
             size: fontSize,
             font: font,
             color: rgb(0, 0, 0.8), // Dark Blue color
           });

           mergedPdf.addPage(page);
        });
        
      } catch (e) {
        console.warn(`Failed to merge attachment ${attach.title}:`, e);
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
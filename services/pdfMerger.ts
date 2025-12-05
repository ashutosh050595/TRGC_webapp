import { PDFDocument } from 'pdf-lib';

export const mergePDFs = async (generatedPdfBlob: Blob): Promise<{ base64: string; blob: Blob }> => {
  try {
    // 1. Create a new PDF document to hold the merged content
    const mergedPdf = await PDFDocument.create();
    
    // 2. Load the Application Form PDF (Generated client-side)
    const genPdfBytes = await generatedPdfBlob.arrayBuffer();
    const genPdf = await PDFDocument.load(genPdfBytes);
    const genPages = await mergedPdf.copyPages(genPdf, genPdf.getPageIndices());
    genPages.forEach((page) => mergedPdf.addPage(page));

    // 3. Fetch the Instructions PDF (Must be in public/instructions.pdf)
    // If running on Vite/Vercel, files in 'public' are served at root '/'
    const response = await fetch('/instructions.pdf');
    
    if (response.ok) {
      const instPdfBytes = await response.arrayBuffer();
      const instPdf = await PDFDocument.load(instPdfBytes);
      const instPages = await mergedPdf.copyPages(instPdf, instPdf.getPageIndices());
      
      instPages.forEach((page) => mergedPdf.addPage(page));
      console.log("Merged instructions.pdf successfully.");
    } else {
      console.warn("Could not find 'instructions.pdf' in the public folder. Skipping merge.");
    }

    // 4. Save and return
    const mergedBytes = await mergedPdf.save();
    
    // Convert to Blob for download
    const mergedBlob = new Blob([mergedBytes], { type: 'application/pdf' });

    // Convert to Base64 for Email API
    let binary = '';
    const len = mergedBytes.byteLength;
    const bytes = new Uint8Array(mergedBytes);
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);

    return { base64, blob: mergedBlob };

  } catch (error) {
    console.error("PDF Merge Failed:", error);
    // Fallback: return the original generated PDF if merge fails
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
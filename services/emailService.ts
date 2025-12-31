
import type { ApplicationData } from '../types';

export interface EmailResult {
  success: boolean;
  message?: string;
}

/**
 * MANDATORY: YOU MUST REPLACE THIS URL WITH YOUR ACTUAL DEPLOYED WEB APP URL
 */
const GOOGLE_SCRIPT_URL: string = "https://script.google.com/macros/s/AKfycbwGuHUpVpJpYwHUD2o0-S0uV3EPIn5mQQtwhVUi25BHcdKWIE6Lcjh45AblvuPP4AVIIw/exec"; 

export const sendApplicationEmail = async (data: ApplicationData, pdfBase64: string): Promise<EmailResult> => {
  if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL === "" || GOOGLE_SCRIPT_URL.includes("AKfycbx_YOUR_URL")) {
    return { success: false, message: "Google Script URL not set in services/emailService.ts" };
  }

  try {
    // Base64 is roughly 33% larger than raw data. 
    // Google Apps Script has a 50MB limit for POST requests.
    // 30MB raw * 1.33 = ~40MB Base64. We leave 10MB buffer for other form data.
    const rawSizeMB = (pdfBase64.length * 0.75) / (1024 * 1024);
    
    if (rawSizeMB > 30) {
      return { 
        success: false, 
        message: `Your attachments are too large (${rawSizeMB.toFixed(1)}MB). Total limit is 30MB. Please compress your PDFs or provide a Google Drive link instead.` 
      };
    }

    const payload = {
      ...data,
      pdfBase64: pdfBase64,
      fileName: `TRGC_2025_${data.name.replace(/\s+/g, '_')}.pdf`,
      submissionTimestamp: new Date().toISOString()
    };

    console.log("Submitting to Google Script...", { 
      url: GOOGLE_SCRIPT_URL,
      estimatedBase64Size: `${(pdfBase64.length / (1024 * 1024)).toFixed(2)} MB`
    });

    // Send request
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify(payload)
    });

    // In no-cors, we assume success if fetch finishes without throwing.
    // The "Save First" logic in the script ensures the data is captured even if secondary steps fail.
    return { success: true };

  } catch (error) {
    console.error("Transmission Error:", error);
    return { 
      success: false, 
      message: "Network error. The file might be too large for your connection or the Script URL is invalid." 
    };
  }
};

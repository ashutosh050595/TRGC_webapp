
import type { ApplicationData } from '../types';

export interface EmailResult {
  success: boolean;
  message?: string;
}

/**
 * REPLACEMENT INSTRUCTIONS:
 * 1. Deploy your Google Script as a Web App.
 * 2. Set 'Execute As' to 'Me'.
 * 3. Set 'Who has access' to 'Anyone'.
 * 4. Paste the NEW URL below.
 */
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwGuHUpVpJpYwHUD2o0-S0uV3EPIn5mQQtwhVUi25BHcdKWIE6Lcjh45AblvuPP4AVIIw/exec"; 

export const sendApplicationEmail = async (data: ApplicationData, pdfBase64: string): Promise<EmailResult> => {
  if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes('AKfycbx')) {
    console.warn("Google Script URL is not configured.");
  }

  try {
    // 1. HARD LIMIT CHECK: Google Apps Script cannot receive more than 50MB.
    // Base64 is roughly 33% larger than the actual file. 
    // If the base64 string length is > 60,000,000 chars, it's roughly > 45MB.
    const approximateSizeMB = (pdfBase64.length * 0.75) / (1024 * 1024);
    
    if (approximateSizeMB > 48) {
      return { 
        success: false, 
        message: `Your application (including attachments) is ${approximateSizeMB.toFixed(1)}MB. Google Servers only accept up to 50MB. Please upload your large Research documents to your personal Google Drive and provide the link in the "Google Drive Link" field on Section 5 instead.` 
      };
    }

    // 2. Construct Payload
    const payload = {
      ...data,
      pdfBase64: pdfBase64,
      fileName: `TRGC_Application_2025_${data.name.replace(/\s+/g, '_')}.pdf`,
      research: { ...data.research },
      submissionTimestamp: new Date().toISOString()
    };

    /**
     * Using 'text/plain' to avoid CORS preflight, 
     * but ensuring we stringify the JSON.
     */
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', 
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify(payload)
    });

    return { success: true };

  } catch (error) {
    console.error("Submission error:", error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Network error. Please check your internet connection." 
    };
  }
};

import type { ApplicationData } from '../types';

export interface EmailResult {
  success: boolean;
  message?: string;
}

// !!! IMPORTANT !!!
// Replace the empty string below with your deployed Google Web App URL
// Example: "https://script.google.com/macros/s/AKfycbx.../exec"
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw0og9svKxuCUj1Zzu7czh5M9MoXom0oneuKvOYwj1HB4ZiNSEHi7tU1qDSwfCgjXVvqg/exec"; 

export const sendApplicationEmail = async (data: ApplicationData, pdfBase64: string): Promise<EmailResult> => {
  if (!GOOGLE_SCRIPT_URL) {
    return { success: false, message: "Google Script URL is missing in configuration." };
  }

  try {
    const payload = {
      ...data,
      pdfBase64: pdfBase64,
      fileName: `${data.name.replace(/\s+/g, '_')}_Application.pdf`
    };

    // Google Apps Script requires text/plain to avoid CORS preflight issues for simple POSTs
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', // 'no-cors' is required for simple calls to Google Scripts from client-side
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify(payload)
    });

    // With 'no-cors', we get an opaque response, so we can't read the status.
    // We assume success if no network error occurred.
    return { success: true };

  } catch (error) {
    console.error("Submission failed:", error);
    return { success: false, message: error instanceof Error ? error.message : "Network error" };
  }
};
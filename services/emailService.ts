import { FormData as AppFormData } from '../types';

export interface EmailResult {
  success: boolean;
  message?: string;
}

// Using FormSubmit.co for free emails with attachments
// No strict API Key required, just the destination email in the URL.
// First time setup: The owner of principal.trgc@gmail.com must click 'Activate' 
// in the first email received from FormSubmit.

export const sendApplicationEmail = async (data: AppFormData, pdfBlob: Blob): Promise<EmailResult> => {
  try {
    // Here 'FormData' now correctly refers to the browser's built-in FormData class
    const formData = new FormData();
    
    // Configuration Fields for FormSubmit
    formData.append("_subject", `New Application: ${data.name} - ${data.postAppliedFor}`);
    formData.append("_template", "table"); // Formats the data as a nice table
    formData.append("_captcha", "false"); // Disable captcha for cleaner UX
    
    // --- THIS SENDS THE EMAIL TO THE USER ---
    // We add the applicant's email (from the form input) as a CC (Carbon Copy).
    // FormSubmit will send the email to the Principal and CC the Applicant automatically.
    formData.append("_cc", data.email); 
    
    // Attach the PDF
    formData.append("Application PDF", pdfBlob, `${data.name.replace(/\s+/g, '_')}_Application.pdf`);

    // Append Form Data fields for the email body
    // We filter out the base64 images to keep the email body light (images are in the PDF)
    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'photo' && key !== 'signature' && value) {
        formData.append(camelCaseToTitle(key), String(value));
      }
    });

    // Send using Fetch
    // We target principal.trgc@gmail.com (The Principal)
    // The Applicant gets a copy via the _cc field above
    const response = await fetch("https://formsubmit.co/principal.trgc@gmail.com", {
      method: "POST",
      body: formData
    });

    if (response.ok) {
      return { success: true };
    } else {
      return { success: false, message: `Server responded with ${response.status}` };
    }

  } catch (error) {
    console.error("Email send failed:", error);
    return { success: false, message: error instanceof Error ? error.message : "Unknown error" };
  }
};

// Helper to make field names readable in the email table
function camelCaseToTitle(text: string) {
  const result = text.replace(/([A-Z])/g, " $1");
  return result.charAt(0).toUpperCase() + result.slice(1);
}
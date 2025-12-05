// --- INSTRUCTIONS ---
// 1. Go to https://sheets.google.com and create a new Sheet
// 2. Go to Extensions > Apps Script
// 3. Paste this code entirely
// 4. Click 'Deploy' > 'New Deployment'
// 5. Select type: 'Web app'
// 6. Description: 'TRGC Backend'
// 7. Execute as: 'Me' (your email)
// 8. Who has access: 'Anyone' (IMPORTANT)
// 9. Deploy and copy the URL.

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var data = JSON.parse(e.postData.contents);
    
    // --- 1. SAVE TO SHEET ---
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Create Header Row if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Timestamp",
        "Post Applied For",
        "Category",
        "Name",
        "Father's Name",
        "DOB",
        "Email",
        "Mobile 1",
        "Mobile 2",
        "UTR No",
        "Amount",
        "Date",
        "Bank",
        "Academic Score (Masters)",
        "Academic Score (Grad)",
        "Total Research Score",
        "Address"
      ]);
    }

    // Append Data
    sheet.appendRow([
      new Date(),
      data.postAppliedFor,
      data.category,
      data.name,
      data.fatherName,
      data.dob,
      data.email,
      data.contactNo1,
      data.contactNo2,
      data.utrNo,
      data.draftAmount,
      data.draftDate,
      data.bankName,
      data.academicMasters,
      data.academicGraduation,
      data.researchScore,
      data.correspondenceAddress
    ]);

    // --- 2. SEND EMAIL WITH PDF ---
    // Decode the Base64 PDF string passed from the React app
    var pdfBlob = Utilities.newBlob(Utilities.base64Decode(data.pdfBase64), 'application/pdf', data.fileName);

    // Email to Principal
    GmailApp.sendEmail("principal.trgc@gmail.com", "New Application: " + data.name, 
      "A new application has been submitted by " + data.name + " for the post of " + data.postAppliedFor + ".\n\nPlease find the application PDF attached.\n\nDatabase: " + SpreadsheetApp.getActiveSpreadsheet().getUrl(), 
      {
        attachments: [pdfBlob],
        name: 'TRGC Recruitment Portal'
      }
    );

    // Email to Applicant (CC)
    if (data.email) {
      GmailApp.sendEmail(data.email, "Application Received: TRGC Sonepat", 
        "Dear " + data.name + ",\n\nYour application for the post of " + data.postAppliedFor + " has been successfully received.\n\nPlease find your generated application form attached for your records.\n\nRegards,\nTika Ram Girls College, Sonepat", 
        {
          attachments: [pdfBlob],
          name: 'TRGC Recruitment Portal'
        }
      );
    }

    // Return Success
    return ContentService.createTextOutput(JSON.stringify({ 'result': 'success' })).setMimeType(ContentService.MimeType.JSON);

  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ 'result': 'error', 'error': e.toString() })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
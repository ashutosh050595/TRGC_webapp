// --- INSTRUCTIONS ---
// 1. Go to https://sheets.google.com and create a new Sheet
// 2. Go to Extensions > Apps Script
// 3. Paste this code entirely
// 4. Click 'Deploy' > 'New Deployment'
// 5. Select type: 'Web app'
// 6. Description: 'TRGC Backend V2'
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
    
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Timestamp", "Post Applied For", "Category", "Name", "Father's Name", 
        "DOB", "Email", "Mobile", "UTR No", "Amount", "Academic Score", "Research Score Summary"
      ]);
    }

    sheet.appendRow([
      new Date(), data.postAppliedFor, data.category, data.name, data.fatherName,
      data.dob, data.email, data.contactNo1, data.utrNo, data.draftAmount,
      data.academicMasters, "See PDF for details"
    ]);

    // --- 2. CREATE PDF BLOB ---
    // Decode the Base64 PDF string (Merged document)
    var pdfBlob = Utilities.newBlob(Utilities.base64Decode(data.pdfBase64), 'application/pdf', data.fileName);

    // --- 3. SAVE TO GOOGLE DRIVE ---
    var folderName = "TRGC_Applications";
    var folders = DriveApp.getFoldersByName(folderName);
    var folder;
    
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(folderName);
    }
    
    var file = folder.createFile(pdfBlob);
    var fileUrl = file.getUrl();

    // --- 4. SEND EMAIL ---
    GmailApp.sendEmail("principal.trgc@gmail.com", "New Application: " + data.name, 
      "A new application has been submitted by " + data.name + ".\n\nThe document has been saved to Drive: " + fileUrl + "\n\nPlease find the application PDF attached.", 
      {
        attachments: [pdfBlob],
        name: 'TRGC Recruitment Portal'
      }
    );

    if (data.email) {
      GmailApp.sendEmail(data.email, "Application Received: TRGC Sonepat", 
        "Dear " + data.name + ",\n\nYour application has been received successfully.\n\nRegards,\nTika Ram Girls College, Sonepat", 
        {
          attachments: [pdfBlob],
          name: 'TRGC Recruitment Portal'
        }
      );
    }

    return ContentService.createTextOutput(JSON.stringify({ 'result': 'success', 'driveUrl': fileUrl })).setMimeType(ContentService.MimeType.JSON);

  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ 'result': 'error', 'error': e.toString() })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
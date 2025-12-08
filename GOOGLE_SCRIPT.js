
// --- INSTRUCTIONS ---
// 1. Paste this code into your Google Apps Script editor connected to your Sheet.
// 2. Click 'Deploy' > 'New Deployment'.
// 3. Select type: 'Web app'.
// 4. Description: 'TRGC Backend Payment Update'.
// 5. Execute as: 'Me'.
// 6. Who has access: 'Anyone'.
// 7. Click Deploy.

function doPost(e) {
  var lock = LockService.getScriptLock();
  // Wait for up to 30 seconds for other processes to finish.
  lock.tryLock(30000);

  try {
    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);
    
    // --- 1. PREPARE SHEET ---
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Define All Headers (Approx 95 Columns)
    var headers = [
      "Timestamp", "PDF Drive Link", 
      // Personal
      "Post Applied For", "Category", "Adv Ref", "Name", "Father Name", "Parent Name", "DOB", 
      "Email", "Mobile 1", "Mobile 2", "Perm Address", "Corr Address", "Present Employer",
      // Academic
      "Masters %", "Graduation %", "12th %", "Matric %",
      // Teaching & Admin
      "Teaching Exp (Yrs)", "Admin: Jt Dir", "Admin: Registrar", "Admin: Head",
      // Responsibilities
      "Resp: StaffRep", "Resp: Coord", "Resp: Bursar", "Resp: NSS", "Resp: YRC", "Resp: Warden", "Resp: Statutory", "Resp: NCC",
      // Committees
      "Comm: IQAC", "Comm: Editor", "Comm: Advisory", "Comm: Work", "Comm: Cultural", "Comm: Purchase", "Comm: Building", 
      "Comm: Sports", "Comm: Discipline", "Comm: Internal", "Comm: RoadSafety", "Comm: RedRibbon", "Comm: Eco", 
      "Comm: Placement", "Comm: Women", "Comm: TimeTable", "Comm: SCBC",
      // Research (Table 2)
      "Res: Papers", "Res: Books Int", "Res: Books Nat", "Res: Chapter", "Res: Editor Int", "Res: Editor Nat", 
      "Res: Trans Chapter", "Res: Trans Book", "Res: ICT Pedagogy", "Res: ICT Curricula", 
      "Res: MOOCs 4Quad", "Res: MOOCs Module", "Res: MOOCs Content", "Res: MOOCs Coord", 
      "Res: E-Content Complete", "Res: E-Content Module", "Res: E-Content Contrib", "Res: E-Content Editor", 
      "Res: PhD", "Res: MPhil", "Res: Proj >10L", "Res: Proj <10L", "Res: Proj Ongoing >10L", "Res: Proj Ongoing <10L", 
      "Res: Consultancy", "Res: Patent Int", "Res: Patent Nat", "Res: Policy Int", "Res: Policy Nat", "Res: Policy State", 
      "Res: Award Int", "Res: Award Nat", "Res: Invited Int (Abr)", "Res: Invited Int (In)", "Res: Invited Nat", "Res: Invited State",
      "Google Drive Link (User)",
      // Payment (UPDATED)
      "Amount", "UTR No", "UPI Provider", "UPI Address", "Acc Holder Name",
      // NOC & Declaration
      "Has NOC?", "Emp Name", "Emp Desig", "Emp Dept", "Place", "Submission Date"
    ];

    // Set headers if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
    }

    // --- 2. HANDLE FILE SAVE TO DRIVE ---
    var fileUrl = "Failed to save";
    var pdfBlob = null;
    
    try {
      if (data.pdfBase64) {
        // Decode Base64
        pdfBlob = Utilities.newBlob(Utilities.base64Decode(data.pdfBase64), 'application/pdf', data.fileName);
        
        var folderName = "TRGC_Applications";
        var folders = DriveApp.getFoldersByName(folderName);
        var folder;
        
        if (folders.hasNext()) {
          folder = folders.next();
        } else {
          folder = DriveApp.createFolder(folderName);
        }
        
        var file = folder.createFile(pdfBlob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); // Make it accessible via link
        fileUrl = file.getUrl();
      } else {
        fileUrl = "No PDF Data Received";
      }
    } catch (fileError) {
      fileUrl = "Error: " + fileError.toString();
    }

    // --- 3. PREPARE ROW DATA ---
    var r = data.research || {};
    
    // Map data strictly to headers order
    var row = [
      new Date(), fileUrl,
      // Personal
      data.postAppliedFor, data.category, data.advertisementRef, data.name, data.fatherName, data.parentName, data.dob,
      data.email, data.contactNo1, data.contactNo2, data.permanentAddress, data.correspondenceAddress, data.presentEmployer,
      // Academic
      data.academicMasters, data.academicGraduation, data.academic12th, data.academicMatric,
      // Teaching
      data.teachingExpAbove15, data.adminJointDirector, data.adminRegistrar, data.adminHead,
      // Resp
      data.respStaffRep, data.respCoordinator, data.respBursar, data.respNSS, data.respYRC, data.respWarden, data.respStatutory, data.respNCC,
      // Comm
      data.commIQAC, data.commEditor, data.commAdvisory, data.commWork, data.commCultural, data.commPurchase, data.commBuilding,
      data.commSports, data.commDiscipline, data.commInternal, data.commRoadSafety, data.commRedRibbon, data.commEco,
      data.commPlacement, data.commWomen, data.commTimeTable, data.commSCBC,
      // Research
      r.resPapers, r.resBooksInt, r.resBooksNat, r.resChapter, r.resEditorInt, r.resEditorNat,
      r.resTransChapter, r.resTransBook, r.resIctPedagogy, r.resIctCurricula,
      r.resMoocs4Quad, r.resMoocsModule, r.resMoocsContent, r.resMoocsCoord,
      r.resEcontentComplete, r.resEcontentModule, r.resEcontentContrib, r.resEcontentEditor,
      r.resPhd, r.resMphil, r.resProjMore10, r.resProjLess10, r.resProjOngoingMore10, r.resProjOngoingLess10,
      r.resConsultancy, r.resPatentInt, r.resPatentNat, r.resPolicyInt, r.resPolicyNat, r.resPolicyState,
      r.resAwardInt, r.resAwardNat, r.resInvitedIntAbroad, r.resInvitedIntWithin, r.resInvitedNat, r.resInvitedState,
      data.googleDriveLink,
      // Payment (UPDATED)
      data.paymentAmount, data.utrNo, data.upiProvider, data.upiAddress, data.accountHolderName,
      // NOC
      data.hasNOC, data.empName, data.empDesignation, data.empDept, data.place, data.date
    ];

    sheet.appendRow(row);

    // --- 4. SEND EMAILS ---
    if (pdfBlob) { 
       // Send to Principal
       try {
         GmailApp.sendEmail("principal.trgc@gmail.com", "New Application: " + data.name, 
          "A new application has been submitted by " + data.name + ".\n\n" +
          "Post: " + data.postAppliedFor + "\n" +
          "Category: " + data.category + "\n" +
          "Google Drive Link to PDF: " + fileUrl + "\n\n" +
          "Please find the full application PDF attached.", 
          { attachments: [pdfBlob], name: 'TRGC Portal' }
         );
       } catch (e) {
         // If attachment is too large (25MB+), send without attachment
         GmailApp.sendEmail("principal.trgc@gmail.com", "New Application (Large File): " + data.name, 
          "A new application has been submitted by " + data.name + ".\n\nThe PDF was too large to attach. Please view it here: " + fileUrl,
          { name: 'TRGC Portal' }
         );
       }

       // Send to User
       if (data.email) {
         try {
            GmailApp.sendEmail(data.email, "Application Received: TRGC Sonepat", 
              "Dear " + data.name + ",\n\nWe have received your application for the post of " + data.postAppliedFor + ".\n\nA copy of your application is attached for your records.\n\nRegards,\nPrincipal\nTika Ram Girls College, Sonepat", 
              { attachments: [pdfBlob], name: 'TRGC Portal' }
            );
         } catch (e) {
             // Retry without attachment if too large
             GmailApp.sendEmail(data.email, "Application Received: TRGC Sonepat", 
              "Dear " + data.name + ",\n\nWe have received your application. The PDF copy is too large to email, but it has been successfully recorded in our system.\n\nRegards,\nPrincipal\nTRGC Sonepat",
              { name: 'TRGC Portal' }
            );
         }
       }
    }

    return ContentService.createTextOutput(JSON.stringify({ 'result': 'success', 'driveUrl': fileUrl })).setMimeType(ContentService.MimeType.JSON);

  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ 'result': 'error', 'error': e.toString() })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

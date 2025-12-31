export interface ScoreItem {
  id: string;
  label: string;
  maxMarksInfo: string;
  selfAppraisal: string; // string to allow empty state
}

// Detailed breakdown for Table 2
export interface ResearchData {
  resPapers: string;
  resBooksInt: string;
  resBooksNat: string;
  resChapter: string;
  resEditorInt: string;
  resEditorNat: string;
  resTransChapter: string;
  resTransBook: string;
  resIctPedagogy: string;
  resIctCurricula: string;
  resMoocs4Quad: string;
  resMoocsModule: string;
  resMoocsContent: string;
  resMoocsCoord: string;
  resEcontentComplete: string;
  resEcontentModule: string;
  resEcontentContrib: string;
  resEcontentEditor: string;
  resPhd: string;
  resMphil: string;
  resProjMore10: string;
  resProjLess10: string;
  resProjOngoingMore10: string;
  resProjOngoingLess10: string;
  resConsultancy: string;
  resPatentInt: string;
  resPatentNat: string;
  resPolicyInt: string;
  resPolicyNat: string;
  resPolicyState: string;
  resAwardInt: string;
  resAwardNat: string;
  resInvitedIntAbroad: string;
  resInvitedIntWithin: string;
  resInvitedNat: string;
  resInvitedState: string;
  resTotal?: string; // Made optional as per your update
}

export interface ApplicationData {
  // Personal Information (moved from "Personal Info" section)
  postAppliedFor: string;
  category: string;
  advertisementRef: string;
  name: string;
  fatherName: string;
  parentName: string; // Moved from Declaration section
  dob: string;
  email: string;
  confirmEmail: string; // Field for verification only
  contactNo1: string;
  contactNo2: string;
  permanentAddress: string;
  correspondenceAddress: string;
  presentEmployer: string;
  photo: string | null; // Base64 Image
  
  // I. Academic Record (Page 2) - removed fileAcademic from here
  academicMasters: string; 
  academicGraduation: string;
  academic12th: string;
  academicMatric: string;
  
  // II. Teaching Experience (Page 2) - removed fileTeaching from here
  teachingExpAbove15: string;
  
  // Admin Skills (Page 2 - B.i) - removed fileAdminSkill from here
  adminJointDirector: string;
  adminRegistrar: string;
  adminHead: string;

  // Key Responsibilities (Page 3 - B.ii) - removed fileResponsibilities from here
  respStaffRep: string;
  respCoordinator: string;
  respBursar: string;
  respNSS: string;
  respYRC: string;
  respWarden: string;
  respStatutory: string;
  respNCC: string;

  // Committees (Page 3/4 - B.iii) - removed fileAdmin from here
  commIQAC: string;
  commEditor: string;
  commAdvisory: string;
  commWork: string;
  commCultural: string;
  commPurchase: string;
  commBuilding: string;
  commSports: string;
  commDiscipline: string;
  commInternal: string;
  commRoadSafety: string;
  commRedRibbon: string;
  commEco: string;
  commPlacement: string;
  commWomen: string;
  commTimeTable: string;
  commSCBC: string;

  // III. Research (Table 2)
  research: ResearchData;
  
  // NEW FIELDS for research file handling (from your update)
  researchFileSize: 'yes' | 'no' | '';
  googleDriveLink: string;
  
  // Payment
  paymentAmount: string;
  utrNo: string;
  confirmUtrNo: string; // Verification field
  upiProvider: string; // Amazon, GPay, PhonePe, etc.
  upiAddress: string;
  accountHolderName: string;
  
  // NOC
  hasNOC: 'yes' | 'no' | ''; // Updated type to match your update
  empName: string;
  empDesignation: string;
  empDept: string;
  // Removed empNoticePeriod as per your update
  
  // Declaration
  place: string;
  date: string;
  signature: string | null; // Base64 Image
  
  // Files (consolidated from various sections)
  fileAcademic: string | null; // Base64 PDF
  fileTeaching: string | null; // Base64 PDF
  fileAdminSkill: string | null; // Base64 PDF for Admin Skill Docs
  fileResponsibilities: string | null; // Base64 PDF for Responsibilities
  fileAdmin: string | null; // Base64 PDF (Committees)
  fileResearch: string | null; // Base64 PDF
  fileNOC: string | null; // Base64 PDF (Replaces generated page)
  filePaymentScreenshot: string | null; // Base64 Image

  // Generated
  applicationNo?: string; // Unique Application Number generated at submission
}

// Added: Type for form validation errors
export interface ApplicationFormErrors {
  [key: string]: string;
}

// Added: Type for form submission status
export enum SubmissionStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

// Added: Type for application metadata
export interface ApplicationMetadata {
  submittedAt?: string;
  updatedAt?: string;
  submittedBy?: string;
  status: SubmissionStatus;
  version: number;
}

// Added: Type for file upload state
export interface FileUploadState {
  fileName: string;
  fileSize: number;
  uploadProgress: number;
  isUploading: boolean;
  error?: string;
}

export const INITIAL_RESEARCH: ResearchData = {
  resPapers: '',
  resBooksInt: '',
  resBooksNat: '',
  resChapter: '',
  resEditorInt: '',
  resEditorNat: '',
  resTransChapter: '',
  resTransBook: '',
  resIctPedagogy: '',
  resIctCurricula: '',
  resMoocs4Quad: '',
  resMoocsModule: '',
  resMoocsContent: '',
  resMoocsCoord: '',
  resEcontentComplete: '',
  resEcontentModule: '',
  resEcontentContrib: '',
  resEcontentEditor: '',
  resPhd: '',
  resMphil: '',
  resProjMore10: '',
  resProjLess10: '',
  resProjOngoingMore10: '',
  resProjOngoingLess10: '',
  resConsultancy: '',
  resPatentInt: '',
  resPatentNat: '',
  resPolicyInt: '',
  resPolicyNat: '',
  resPolicyState: '',
  resAwardInt: '',
  resAwardNat: '',
  resInvitedIntAbroad: '',
  resInvitedIntWithin: '',
  resInvitedNat: '',
  resInvitedState: '',
  // Note: resTotal is now optional, so we can initialize it or leave it out
  resTotal: '',
};

export const INITIAL_DATA: ApplicationData = {
  // Personal Information
  postAppliedFor: '',
  category: '',
  advertisementRef: '',
  name: '',
  fatherName: '',
  parentName: '',
  dob: '',
  email: '',
  confirmEmail: '',
  contactNo1: '',
  contactNo2: '',
  permanentAddress: '',
  correspondenceAddress: '',
  presentEmployer: '',
  photo: null,
  
  // Academic
  academicMasters: '',
  academicGraduation: '',
  academic12th: '',
  academicMatric: '',
  
  // Teaching & Admin
  teachingExpAbove15: '',
  adminJointDirector: '',
  adminRegistrar: '',
  adminHead: '',
  
  // Responsibilities
  respStaffRep: '',
  respCoordinator: '',
  respBursar: '',
  respNSS: '',
  respYRC: '',
  respWarden: '',
  respStatutory: '',
  respNCC: '',
  
  // Committees
  commIQAC: '',
  commEditor: '',
  commAdvisory: '',
  commWork: '',
  commCultural: '',
  commPurchase: '',
  commBuilding: '',
  commSports: '',
  commDiscipline: '',
  commInternal: '',
  commRoadSafety: '',
  commRedRibbon: '',
  commEco: '',
  commPlacement: '',
  commWomen: '',
  commTimeTable: '',
  commSCBC: '',
  
  // Research
  research: INITIAL_RESEARCH,
  
  // NEW FIELDS for research file handling
  researchFileSize: '',
  googleDriveLink: '',
  
  // Payment
  paymentAmount: '',
  utrNo: '',
  confirmUtrNo: '',
  upiProvider: '',
  upiAddress: '',
  accountHolderName: '',
  
  // NOC
  hasNOC: '',
  empName: '',
  empDesignation: '',
  empDept: '',
  
  // Declaration
  place: '',
  date: new Date().toISOString().split('T')[0],
  signature: null,
  
  // Files
  fileAcademic: null,
  fileTeaching: null,
  fileAdminSkill: null,
  fileResponsibilities: null,
  fileAdmin: null,
  fileResearch: null,
  fileNOC: null,
  filePaymentScreenshot: null,
  
  // Generated
  applicationNo: '',
};

// Added: Helper constant for file size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  PHOTO: 2 * 1024 * 1024, // 2MB
  PDF: 5 * 1024 * 1024, // 5MB
  SCREENSHOT: 2 * 1024 * 1024, // 2MB
};

// Added: Allowed file types
export const ALLOWED_FILE_TYPES = {
  IMAGE: ['image/jpeg', 'image/jpg', 'image/png'],
  PDF: ['application/pdf'],
};

// Added: UPI providers enum for dropdown options
export enum UpiProviders {
  GPAY = 'Google Pay',
  PHONEPE = 'PhonePe',
  PAYTM = 'Paytm',
  AMAZON_PAY = 'Amazon Pay',
  BHIM = 'BHIM UPI',
  OTHER = 'Other'
}

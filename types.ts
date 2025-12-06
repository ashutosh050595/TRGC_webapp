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
}

export interface ApplicationData {
  // Personal Info
  postAppliedFor: string;
  category: string;
  advertisementRef: string;
  name: string;
  fatherName: string;
  dob: string;
  permanentAddress: string;
  correspondenceAddress: string;
  contactNo1: string;
  contactNo2: string;
  email: string;
  confirmEmail: string; // Field for verification only
  presentEmployer: string;
  photo: string | null; // Base64 Image
  
  // I. Academic Record (Page 2)
  academicMasters: string; 
  academicGraduation: string;
  academic12th: string;
  academicMatric: string;
  fileAcademic: string | null; // Base64 PDF

  // II. Teaching Experience (Page 2)
  teachingExpAbove15: string;
  fileTeaching: string | null; // Base64 PDF

  // Admin Skills (Page 2 - B.i)
  adminJointDirector: string;
  adminRegistrar: string;
  adminHead: string;

  // Key Responsibilities (Page 3 - B.ii)
  respStaffRep: string;
  respCoordinator: string;
  respBursar: string;
  respNSS: string;
  respYRC: string;
  respWarden: string;
  respStatutory: string;
  respNCC: string;

  // Committees (Page 3/4 - B.iii)
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
  fileAdmin: string | null; // Base64 PDF

  // III. Research (Table 2)
  research: ResearchData;
  fileResearch: string | null; // Base64 PDF
  googleDriveLink: string; // New Field

  // Payment
  utrNo: string; 
  draftDate: string;
  draftAmount: string;
  bankName: string;

  // Declaration
  parentName: string; // D/o, S/o, W/o
  place: string;
  date: string;
  signature: string | null; // Base64 Image
  
  // Employer / NOC
  fileNOC: string | null; // Base64 PDF (Replaces generated page)
  empName: string;
  empDesignation: string;
  empDept: string;
  empNoticePeriod: string;
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
};

export const INITIAL_DATA: ApplicationData = {
  postAppliedFor: '',
  category: '',
  advertisementRef: '',
  name: '',
  fatherName: '',
  dob: '',
  permanentAddress: '',
  correspondenceAddress: '',
  contactNo1: '',
  contactNo2: '',
  email: '',
  confirmEmail: '',
  presentEmployer: '',
  photo: null,
  academicMasters: '',
  academicGraduation: '',
  academic12th: '',
  academicMatric: '',
  fileAcademic: null,
  teachingExpAbove15: '',
  fileTeaching: null,
  adminJointDirector: '',
  adminRegistrar: '',
  adminHead: '',
  respStaffRep: '',
  respCoordinator: '',
  respBursar: '',
  respNSS: '',
  respYRC: '',
  respWarden: '',
  respStatutory: '',
  respNCC: '',
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
  fileAdmin: null,
  research: INITIAL_RESEARCH,
  fileResearch: null,
  googleDriveLink: '',
  utrNo: '',
  draftDate: '',
  draftAmount: '',
  bankName: '',
  parentName: '',
  place: '',
  date: new Date().toISOString().split('T')[0],
  signature: null,
  fileNOC: null,
  empName: '',
  empDesignation: '',
  empDept: '',
  empNoticePeriod: ''
};
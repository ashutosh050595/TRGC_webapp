export interface ScoreItem {
  id: string;
  label: string;
  maxMarksInfo: string;
  selfAppraisal: string; // string to allow empty state
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
  presentEmployer: string;
  photo: string | null; // Base64
  
  // Academic Record (Page 2)
  academicMasters: string; // Self appraisal marks
  academicGraduation: string;
  academic12th: string;
  academicMatric: string;

  // Teaching Experience (Page 2)
  teachingExpAbove15: string;

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

  // Research (Page 4)
  researchScore: string;

  // Payment
  utrNo: string; // Changed from draftNo
  draftDate: string;
  draftAmount: string;
  bankName: string;

  // Declaration
  parentName: string; // D/o, S/o, W/o
  place: string;
  date: string;
  signature: string | null; // Base64
  
  // Employer Cert
  empName: string;
  empDesignation: string;
  empDept: string;
  empNoticePeriod: string;
}

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
  presentEmployer: '',
  photo: null,
  academicMasters: '',
  academicGraduation: '',
  academic12th: '',
  academicMatric: '',
  teachingExpAbove15: '',
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
  researchScore: '',
  utrNo: '',
  draftDate: '',
  draftAmount: '',
  bankName: '',
  parentName: '',
  place: '',
  date: new Date().toISOString().split('T')[0],
  signature: null,
  empName: '',
  empDesignation: '',
  empDept: '',
  empNoticePeriod: ''
};
import React, { useState } from 'react';
import { ChevronRight, CheckCircle, Download, Mail, Loader2, Link as LinkIcon, ChevronLeft } from 'lucide-react';
import { INITIAL_DATA, ApplicationData } from './types';
import { Input } from './components/Input';
import { ScoreRow } from './components/ScoreRow';
import { SectionHeader } from './components/SectionHeader';
import { generatePDF } from './services/pdfGenerator';
import { sendApplicationEmail } from './services/emailService';
import { mergePDFs } from './services/pdfMerger';

// Helper component for Table 2 Rows
const Table2Row = ({ 
  sn, 
  activity, 
  capScience, 
  capArts, 
  value, 
  onChange, 
  isHeader = false, 
  isSubHeader = false 
}: { 
  sn: string, 
  activity: string | React.ReactNode, 
  capScience: string, 
  capArts: string, 
  value?: string, 
  onChange?: (val: string) => void,
  isHeader?: boolean,
  isSubHeader?: boolean
}) => {
  if (isHeader) {
    return (
      <tr className="bg-slate-100 font-bold text-sm">
        <td className="border p-2">{sn}</td>
        <td className="border p-2" colSpan={4}>{activity}</td>
      </tr>
    );
  }

  // Calculate max for validation (taking the higher of the two if both exist)
  const maxVal = Math.max(
    parseFloat(capScience) || 0, 
    parseFloat(capArts) || 0
  );

  return (
    <tr className={`border-b ${isSubHeader ? 'bg-slate-50' : 'hover:bg-slate-50'}`}>
      <td className="border p-2 text-xs md:text-sm align-top">{sn}</td>
      <td className={`border p-2 text-xs md:text-sm align-top ${isSubHeader ? 'font-semibold pl-6' : ''}`}>
        {activity}
      </td>
      <td className="border p-2 text-center text-xs md:text-sm text-gray-600 align-top w-24">
        {capScience}
      </td>
      <td className="border p-2 text-center text-xs md:text-sm text-gray-600 align-top w-24">
        {capArts}
      </td>
      <td className="border p-2 w-24 align-top">
        {onChange && (
          <div className="flex flex-col">
            <input
              type="number"
              className="w-full px-2 py-1 border rounded text-right text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={value}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                // Basic validation: Don't allow negative or insanely high numbers relative to cap
                // We allow a bit of buffer or exact match depending on requirement, 
                // here strict to max of the row if numeric
                if (maxVal > 0 && val > maxVal) return; 
                if (val < 0) return;
                onChange(e.target.value);
              }}
            />
             {maxVal > 0 && <span className="text-[10px] text-gray-400 text-right">Max: {maxVal}</span>}
          </div>
        )}
      </td>
    </tr>
  );
};

function App() {
  const [step, setStep] = useState(0); 
  const [data, setData] = useState<ApplicationData>(INITIAL_DATA);
  const [errors, setErrors] = useState<Partial<Record<keyof ApplicationData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
  
  const [isStartInstructionsRead, setIsStartInstructionsRead] = useState(false); 
  const [isFinalNoteConfirmed, setIsFinalNoteConfirmed] = useState(false); 

  const updateField = (field: keyof ApplicationData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const updateResearch = (field: keyof typeof INITIAL_DATA.research, value: string) => {
    setData(prev => ({ 
      ...prev, 
      research: { ...prev.research, [field]: value } 
    }));
  };

  const handleFileUpload = (field: keyof ApplicationData, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 2MB for General Docs/Images, 10MB for Research PDF
      const isResearch = field === 'fileResearch';
      const limit = isResearch ? 10 * 1024 * 1024 : 2 * 1024 * 1024; 
      
      if (file.size > limit) {
        alert(`File size too large. Limit is ${isResearch ? '10MB' : '2MB'}. Please use the Google Drive link option for larger files.`);
        e.target.value = ''; // Reset input
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        updateField(field, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Partial<Record<keyof ApplicationData, string>> = {};
    let isValid = true;

    const requireField = (field: keyof ApplicationData, message = "This field is required") => {
      if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
        newErrors[field] = message;
        isValid = false;
      }
    };

    if (currentStep === 1) {
      requireField('postAppliedFor');
      requireField('category');
      requireField('advertisementRef');
      requireField('name');
      requireField('fatherName');
      requireField('dob');
      requireField('email');
      requireField('confirmEmail', "Please re-enter your email");
      requireField('contactNo1');
      requireField('permanentAddress');
      requireField('correspondenceAddress');
      requireField('photo', "Photograph is required");

      if (data.email && data.confirmEmail && data.email !== data.confirmEmail) {
        newErrors['confirmEmail'] = "Email addresses do not match.";
        isValid = false;
      }
    }

    if (currentStep === 2) {
      requireField('academicMasters');
      requireField('academicGraduation');
      requireField('academic12th');
      requireField('academicMatric');
    }

    if (currentStep === 3) {
      requireField('teachingExpAbove15');
      requireField('adminJointDirector');
      requireField('adminRegistrar');
      requireField('adminHead');
    }

    if (currentStep === 5) {
      requireField('utrNo');
      requireField('draftDate');
      requireField('draftAmount');
      requireField('bankName');
      
      if (!isFinalNoteConfirmed) {
        alert("Please acknowledge that you have read the instructions by checking the box.");
        return false;
      }
    }

    if (currentStep === 6) {
      requireField('parentName');
      requireField('place');
      requireField('date');
      requireField('signature', "Signature is required");
    }

    setErrors(newErrors);
    
    if (!isValid) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    return isValid;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(s => Math.min(s + 1, 6));
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    setStep(s => Math.max(s - 1, 0));
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    if (!validateStep(6)) return;

    setIsSubmitting(true);
    setEmailStatus('sending');

    try {
      // 1. Generate Form PDF
      const { blob: formPdfBlob } = generatePDF(data, false);
      
      // 2. Gather all attachments
      const attachments = [
        data.fileAcademic,
        data.fileTeaching,
        data.fileAdmin,
        data.fileResearch,
        data.fileNOC
      ];

      // 3. Merge Files
      const { base64: mergedBase64, blob: mergedBlob } = await mergePDFs(formPdfBlob, attachments);

      // 4. Download
      const link = document.createElement('a');
      link.href = URL.createObjectURL(mergedBlob);
      link.download = `${data.name.replace(/\s+/g, '_')}_Complete_App.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 5. Email / Drive Save
      const emailResult = await sendApplicationEmail(data, mergedBase64);
      
      if (emailResult.success) {
        setEmailStatus('sent');
      } else {
        setEmailStatus('failed');
      }
      
      setIsSuccess(true);
      window.scrollTo(0, 0);

    } catch (error) {
      console.error(error);
      alert("An unexpected error occurred during submission.");
      setIsSuccess(true);
      setEmailStatus('failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-100 p-4 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-lg w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Application Submitted!</h2>
          <p className="text-gray-600 mb-6">Your application has been merged and recorded.</p>
          <div className="space-y-4 mb-8">
             <div className="flex items-start p-4 bg-blue-50 rounded-lg text-left">
              <Download className="w-6 h-6 text-blue-600 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-900">1. Downloaded</h4>
                <p className="text-sm text-blue-800">Complete merged PDF downloaded.</p>
              </div>
            </div>
             <div className={`flex items-start p-4 rounded-lg text-left border ${emailStatus === 'sent' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
              <Mail className={`w-6 h-6 mt-1 mr-3 flex-shrink-0 ${emailStatus === 'sent' ? 'text-green-600' : 'text-yellow-600'}`} />
              <div>
                <h4 className={`font-semibold ${emailStatus === 'sent' ? 'text-green-900' : 'text-yellow-900'}`}>
                   Status: {emailStatus === 'sent' ? 'Sent' : 'Pending'}
                </h4>
                <p className="text-sm mt-1">
                   {emailStatus === 'sent' ? 'Sent to Principal & You. (Check Spam Folder)' : 'Please email the downloaded PDF manually to principal.trgc@gmail.com'}
                </p>
              </div>
            </div>
          </div>
          <button onClick={() => window.location.reload()} className="text-gray-500 hover:text-gray-700 text-sm">Start New</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 flex flex-col justify-between">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden w-full">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6">
            <div>
              <h1 className="text-2xl font-bold">TIKA RAM GIRLS COLLEGE</h1>
              <p className="text-slate-300 text-sm">Application Portal • Sonepat, Haryana</p>
            </div>
        </div>

        <div className="p-6 md:p-8">
          
          {/* STEP 0: INSTRUCTIONS */}
          {step === 0 && (
             <div className="space-y-6">
              <SectionHeader title="Instructions to the Candidates" subtitle="Please read the following guidelines carefully before proceeding." />
              
              <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm text-sm text-slate-700 space-y-4">
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">1. Submission of Hard Copy</h4>
                  <p>A copy of the filled application form along with all relevant documents must be sent to the following addresses:</p>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li><strong>The Dean</strong>, College Development Council, M.D. University, Rohtak – 124001</li>
                    <li><strong>Director General</strong>, Higher Education, Haryana, Shiksha Sadan, Sector-5, Panchkula</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 mb-1">2. Payment & Fees</h4>
                  <p>The candidate must pay the requisite fee via Demand Draft/NEFT/UPI. You will be required to enter the <strong>UTR No / Draft Number</strong>, Date, and Amount in this form.</p>
                </div>

                <div>
                   <h4 className="font-bold text-slate-900 mb-1">3. Document Uploads</h4>
                   <p>You can upload supporting documents directly in this form (PDF format). The system will merge them into a single application file.</p>
                   <ul className="list-disc pl-5 mt-1 text-slate-600">
                     <li>General Documents (Academic, Teaching, NOC): Max <strong>2 MB</strong> each.</li>
                     <li>Research Documents (Table 2): Max <strong>10 MB</strong>.</li>
                     <li><strong>Alternative:</strong> If your research files are very large, you may provide a Google Drive link in the Research section.</li>
                   </ul>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 mb-1">4. Self-Attestation</h4>
                  <p>All attached documents and the final printout must be self-attested by the candidate.</p>
                </div>

                <div>
                   <h4 className="font-bold text-slate-900 mb-1">5. NOC Requirement</h4>
                   <p>Applicants already in employment must submit a "No Objection Certificate" (NOC) from their present employer.</p>
                </div>
              </div>
              
              <div className="mt-6">
                    <a 
                    href="instructions.pdf" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-slate-100 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-200 transition-colors shadow-sm font-medium text-sm"
                    >
                    <Download className="w-4 h-4 mr-2" />
                    Download Detailed Instructions PDF
                    </a>
                </div>

               <div className="mt-8 flex items-start space-x-3 p-4 border-2 border-slate-200 rounded-lg bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer" onClick={() => setIsStartInstructionsRead(!isStartInstructionsRead)}>
                <div className="flex h-5 items-center">
                  <input type="checkbox" className="h-4 w-4 rounded cursor-pointer" checked={isStartInstructionsRead} onChange={(e) => setIsStartInstructionsRead(e.target.checked)} />
                </div>
                <div className="text-sm">
                  <label className="font-bold text-gray-800 cursor-pointer select-none">I have read all the instructions carefully and am ready to proceed.</label>
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <button onClick={handleNext} disabled={!isStartInstructionsRead} className={`flex items-center px-6 py-3 rounded-lg text-white font-medium ${isStartInstructionsRead ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'}`}>
                  Proceed <ChevronRight className="w-5 h-5 ml-2" />
                </button>
              </div>
             </div>
          )}

          {/* STEP 1: Personal Info */}
          {step === 1 && (
             <div className="space-y-6">
               <SectionHeader title="Personal Information" />
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Post Applied For" value={data.postAppliedFor} onChange={(e) => updateField('postAppliedFor', e.target.value)} error={errors.postAppliedFor} />
                <Input label="Category" value={data.category} onChange={(e) => updateField('category', e.target.value)} error={errors.category} />
                <Input label="Advertisement Reference" value={data.advertisementRef} onChange={(e) => updateField('advertisementRef', e.target.value)} error={errors.advertisementRef} />
                <Input label="Name" value={data.name} onChange={(e) => updateField('name', e.target.value)} error={errors.name} />
                <Input label="Father's Name" value={data.fatherName} onChange={(e) => updateField('fatherName', e.target.value)} error={errors.fatherName} />
                <Input label="Date of Birth" type="date" value={data.dob} onChange={(e) => updateField('dob', e.target.value)} error={errors.dob} />
                <Input label="Email ID" type="email" value={data.email} onChange={(e) => updateField('email', e.target.value)} error={errors.email} />
                <Input label="Re-enter Email ID" type="email" value={data.confirmEmail} onChange={(e) => updateField('confirmEmail', e.target.value)} error={errors.confirmEmail} onPaste={(e) => e.preventDefault()} />
                <Input label="Contact No 1" value={data.contactNo1} onChange={(e) => updateField('contactNo1', e.target.value)} error={errors.contactNo1} />
                <Input label="Contact No 2" value={data.contactNo2} onChange={(e) => updateField('contactNo2', e.target.value)} />
               </div>
               <Input label="Permanent Address" value={data.permanentAddress} onChange={(e) => updateField('permanentAddress', e.target.value)} error={errors.permanentAddress} />
               <Input label="Correspondence Address" value={data.correspondenceAddress} onChange={(e) => updateField('correspondenceAddress', e.target.value)} error={errors.correspondenceAddress} />
               <Input label="Present Employer" value={data.presentEmployer} onChange={(e) => updateField('presentEmployer', e.target.value)} />

               <div className="mt-4">
                  <label className="block text-sm font-semibold mb-2">Upload Photograph * (Max 2MB)</label>
                  <input type="file" accept="image/*" onChange={(e) => handleFileUpload('photo', e)} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
               </div>
             </div>
          )}

          {/* STEP 2: I. Academic Record */}
          {step === 2 && (
             <div>
                <SectionHeader title="I. Academic Record" subtitle="Max 20 marks" />
                <div className="overflow-x-auto mb-6">
                    <table className="w-full text-left border-collapse">
                        <thead><tr className="bg-slate-100 border-b text-sm"><th className="p-3 w-16">S.No</th><th className="p-3">Particulars</th><th className="p-3">Criteria</th><th className="p-3 w-32">Marks</th></tr></thead>
                        <tbody>
                            <ScoreRow sNo="1." particulars="Above 55% marks in Master's degree" marksCriteria="0.5 marks for each %" value={data.academicMasters} onChange={(v) => updateField('academicMasters', v)} max={5} />
                            <ScoreRow sNo="2." particulars="Above 55% marks in Graduation" marksCriteria="0.4 marks for each %" value={data.academicGraduation} onChange={(v) => updateField('academicGraduation', v)} max={5} />
                            <ScoreRow sNo="3." particulars="Above 55% marks in 10+2/Prep." marksCriteria="0.3 marks for each %" value={data.academic12th} onChange={(v) => updateField('academic12th', v)} max={5} />
                            <ScoreRow sNo="4." particulars="Above 55% marks in Matriculation" marksCriteria="0.2 marks for each %" value={data.academicMatric} onChange={(v) => updateField('academicMatric', v)} max={5} />
                        </tbody>
                    </table>
                </div>
                <div className="bg-slate-50 p-4 rounded border border-dashed border-slate-300">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Upload Academic Documents (PDF, Max 2MB)</label>
                    <input type="file" accept="application/pdf" onChange={(e) => handleFileUpload('fileAcademic', e)} className="block w-full text-sm"/>
                    {data.fileAcademic && <span className="text-xs text-green-600 flex items-center mt-1"><CheckCircle className="w-3 h-3 mr-1"/> File Selected</span>}
                </div>
             </div>
          )}

          {/* STEP 3: II. Teaching & Admin */}
          {step === 3 && (
            <div>
                <SectionHeader title="II. Teaching & Admin Experience" subtitle="Max 35 marks" />
                <h3 className="font-semibold text-slate-700 mt-4 mb-2">A. Teaching Experience</h3>
                <table className="w-full text-left border-collapse mb-4">
                    <tbody><ScoreRow sNo="1." particulars="Above 15 years teaching experience" marksCriteria="1 mark for each year" value={data.teachingExpAbove15} onChange={(v) => updateField('teachingExpAbove15', v)} max={10} /></tbody>
                </table>
                <div className="bg-slate-50 p-4 rounded border border-dashed border-slate-300 mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Upload Teaching Exp Documents (PDF, Max 2MB)</label>
                    <input type="file" accept="application/pdf" onChange={(e) => handleFileUpload('fileTeaching', e)} className="block w-full text-sm"/>
                </div>

                <h3 className="font-semibold text-slate-700 mb-2">B. Administrative Skill</h3>
                <p className="text-sm text-slate-500 mb-2">(i) Administrative Responsibilities</p>
                <table className="w-full text-left border-collapse">
                  <tbody>
                    <ScoreRow sNo="1." particulars="Exp as Joint/Deputy/Assistant Director" marksCriteria="1 mark/year" value={data.adminJointDirector} onChange={(v) => updateField('adminJointDirector', v)} />
                    <ScoreRow sNo="2." particulars="Exp as Registrar/Admin post in Univ" marksCriteria="1 mark/year" value={data.adminRegistrar} onChange={(v) => updateField('adminRegistrar', v)} />
                    <ScoreRow sNo="3." particulars="Exp as Head of Higher Edu Inst" marksCriteria="1 mark/year" value={data.adminHead} onChange={(v) => updateField('adminHead', v)} />
                  </tbody>
                </table>
            </div>
          )}

          {/* STEP 4: Responsibilities */}
          {step === 4 && (
             <div>
                <SectionHeader title="Responsibilities & Committees" />
                <p className="text-sm text-slate-500 mb-2">(ii) Key Responsibilities</p>
                <table className="w-full text-left border-collapse mb-6">
                  <tbody>
                    <ScoreRow sNo="1." particulars="Staff Representative / V.C. Nominee" marksCriteria="1 mark/year (max 3)" value={data.respStaffRep} onChange={(v) => updateField('respStaffRep', v)} max={3} />
                    <ScoreRow sNo="2." particulars="Coordinator/Secy of Conference" marksCriteria="1 mark/year (max 3)" value={data.respCoordinator} onChange={(v) => updateField('respCoordinator', v)} max={3} />
                    <ScoreRow sNo="3." particulars="Bursar" marksCriteria="1 mark/year (max 3)" value={data.respBursar} onChange={(v) => updateField('respBursar', v)} max={3} />
                    <ScoreRow sNo="4." particulars="NSS Programme Officer" marksCriteria="1 mark/year (max 3)" value={data.respNSS} onChange={(v) => updateField('respNSS', v)} max={3} />
                    <ScoreRow sNo="5." particulars="YRC Counsellor" marksCriteria="1 mark/year (max 3)" value={data.respYRC} onChange={(v) => updateField('respYRC', v)} max={3} />
                    <ScoreRow sNo="6." particulars="Hostel Warden" marksCriteria="1 mark/year (max 3)" value={data.respWarden} onChange={(v) => updateField('respWarden', v)} max={3} />
                    <ScoreRow sNo="7." particulars="Member of Statutory Body" marksCriteria="1 mark/year (max 2)" value={data.respStatutory} onChange={(v) => updateField('respStatutory', v)} max={2} />
                    <ScoreRow sNo="8." particulars="Associate NCC Officer" marksCriteria="1 mark/year (max 3)" value={data.respNCC} onChange={(v) => updateField('respNCC', v)} max={3} />
                  </tbody>
                </table>

                <p className="text-sm text-slate-500 mb-2">(iii) Committees</p>
                <table className="w-full text-left border-collapse mb-6">
                  <tbody>
                    <ScoreRow sNo="1." particulars="Co-ordinator IQAC" marksCriteria="1 mark/year (max 2)" value={data.commIQAC} onChange={(v) => updateField('commIQAC', v)} max={2} />
                    <ScoreRow sNo="2." particulars="Editor in Chief, College Magazine" marksCriteria="1 mark/year (max 2)" value={data.commEditor} onChange={(v) => updateField('commEditor', v)} max={2} />
                    <ScoreRow sNo="3." particulars="Member, College Advisory Council" marksCriteria="1 mark/year (max 2)" value={data.commAdvisory} onChange={(v) => updateField('commAdvisory', v)} max={2} />
                    <ScoreRow sNo="4." particulars="Convener, Univ Work Committee" marksCriteria="1 mark/year (max 2)" value={data.commWork} onChange={(v) => updateField('commWork', v)} max={2} />
                    <ScoreRow sNo="5." particulars="Convener, Cultural Affairs" marksCriteria="1 mark/year (max 2)" value={data.commCultural} onChange={(v) => updateField('commCultural', v)} max={2} />
                    <ScoreRow sNo="6." particulars="Convener, Purchase/Procurement" marksCriteria="1 mark/year (max 2)" value={data.commPurchase} onChange={(v) => updateField('commPurchase', v)} max={2} />
                    <ScoreRow sNo="7." particulars="Convener, Building/Works" marksCriteria="1 mark/year (max 2)" value={data.commBuilding} onChange={(v) => updateField('commBuilding', v)} max={2} />
                    <ScoreRow sNo="8." particulars="Convener, Sports Committee" marksCriteria="1 mark/year (max 2)" value={data.commSports} onChange={(v) => updateField('commSports', v)} max={2} />
                    <ScoreRow sNo="9." particulars="Convener, Discipline Committee" marksCriteria="1 mark/year (max 2)" value={data.commDiscipline} onChange={(v) => updateField('commDiscipline', v)} max={2} />
                    <ScoreRow sNo="10." particulars="Convener, Internal Complaint" marksCriteria="1 mark/year (max 2)" value={data.commInternal} onChange={(v) => updateField('commInternal', v)} max={2} />
                    <ScoreRow sNo="11." particulars="Convener, Road Safety Club" marksCriteria="1 mark/year (max 2)" value={data.commRoadSafety} onChange={(v) => updateField('commRoadSafety', v)} max={2} />
                    <ScoreRow sNo="12." particulars="Convener, Red Ribbon Club" marksCriteria="1 mark/year (max 2)" value={data.commRedRibbon} onChange={(v) => updateField('commRedRibbon', v)} max={2} />
                    <ScoreRow sNo="13." particulars="Convener, Eco Club" marksCriteria="1 mark/year (max 2)" value={data.commEco} onChange={(v) => updateField('commEco', v)} max={2} />
                    <ScoreRow sNo="14." particulars="In-charge, Placement Cell" marksCriteria="1 mark/year (max 2)" value={data.commPlacement} onChange={(v) => updateField('commPlacement', v)} max={2} />
                    <ScoreRow sNo="15." particulars="Incharge, Women Cell" marksCriteria="1 mark/year (max 2)" value={data.commWomen} onChange={(v) => updateField('commWomen', v)} max={2} />
                    <ScoreRow sNo="16." particulars="In-charge, Time-table Committee" marksCriteria="1 mark/year (max 2)" value={data.commTimeTable} onChange={(v) => updateField('commTimeTable', v)} max={2} />
                    <ScoreRow sNo="17." particulars="In-charge, SC/BC Committee" marksCriteria="1 mark/year (max 2)" value={data.commSCBC} onChange={(v) => updateField('commSCBC', v)} max={2} />
                  </tbody>
                </table>
                <div className="bg-slate-50 p-4 rounded border border-dashed border-slate-300">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Upload Admin/Committee Documents (PDF, Max 2MB)</label>
                    <input type="file" accept="application/pdf" onChange={(e) => handleFileUpload('fileAdmin', e)} className="block w-full text-sm"/>
                </div>
             </div>
          )}

          {/* STEP 5: Table 2 (Detailed) */}
          {step === 5 && (
             <div>
               <SectionHeader title="Table 2: Academic/Research Score" subtitle="Fill exactly as per Table 2 criteria" />
               <div className="overflow-x-auto mb-6">
                 <table className="w-full text-left border-collapse text-sm border">
                    <thead>
                      <tr className="bg-slate-200">
                        <th className="border p-2 w-12">S.N.</th>
                        <th className="border p-2">Academic/Research Activity</th>
                        <th className="border p-2 w-24">Faculty of Sciences/ Engg/ Ag/ Med/ Vet</th>
                        <th className="border p-2 w-24">Faculty of Lang/ Arts/ Soc Sci/ Edu/ Comm/ Mgmt</th>
                        <th className="border p-2 w-24 bg-blue-50">Self Appraisal Marks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* 1. Research Papers */}
                      <Table2Row sn="1." activity={<div>For Direct Recruitment: Research Papers in Peer-reviewed / UGC Journals upto 13.06.2019 and UGC CARE Listed Journals w.e.f. 14.06.2019<br/><br/>For Career Advancement Scheme: Research Papers in Peer-reviewed / UGC Journals upto 02.07.2023 and UGC CARE Listed Journals w.e.f. 03.07.2023</div>} capScience="8" capArts="10" value={data.research.resPapers} onChange={(v) => updateResearch('resPapers', v)} />

                      {/* 2. Publications */}
                      <Table2Row sn="2." activity="Publications (other than Research papers)" capScience="" capArts="" isHeader />
                      <Table2Row sn="" activity="(a) Books authored which are published by;" capScience="" capArts="" isSubHeader />
                      <Table2Row sn="" activity="International publishers" capScience="12" capArts="12" value={data.research.resBooksInt} onChange={(v) => updateResearch('resBooksInt', v)} />
                      <Table2Row sn="" activity="National Publishers" capScience="10" capArts="10" value={data.research.resBooksNat} onChange={(v) => updateResearch('resBooksNat', v)} />
                      <Table2Row sn="" activity="Chapter in Edited Book" capScience="05" capArts="05" value={data.research.resChapter} onChange={(v) => updateResearch('resChapter', v)} />
                      <Table2Row sn="" activity="Editor of Book by International Publisher" capScience="10" capArts="10" value={data.research.resEditorInt} onChange={(v) => updateResearch('resEditorInt', v)} />
                      <Table2Row sn="" activity="Editor of Book by National Publisher" capScience="08" capArts="08" value={data.research.resEditorNat} onChange={(v) => updateResearch('resEditorNat', v)} />
                      
                      <Table2Row sn="" activity="(b) Translation works in Indian and Foreign Languages by qualified faculties" capScience="" capArts="" isSubHeader />
                      <Table2Row sn="" activity="Chapter or Research paper" capScience="03" capArts="03" value={data.research.resTransChapter} onChange={(v) => updateResearch('resTransChapter', v)} />
                      <Table2Row sn="" activity="Book" capScience="08" capArts="08" value={data.research.resTransBook} onChange={(v) => updateResearch('resTransBook', v)} />

                      {/* 3. ICT */}
                      <Table2Row sn="3." activity="Creation of ICT mediated Teaching Learning pedagogy and content and development of new and innovative courses and curricula" capScience="" capArts="" isHeader />
                      <Table2Row sn="" activity="(a) Development of Innovative pedagogy" capScience="05" capArts="05" value={data.research.resIctPedagogy} onChange={(v) => updateResearch('resIctPedagogy', v)} />
                      <Table2Row sn="" activity="(b) Design of new curricula and courses" capScience="02" capArts="02" value={data.research.resIctCurricula} onChange={(v) => updateResearch('resIctCurricula', v)} />
                      
                      <Table2Row sn="" activity="(c) MOOCs" capScience="" capArts="" isSubHeader />
                      <Table2Row sn="" activity="Development of complete MOOCs in 4 quadrants (4 credit course)(In case of MOOCs of lesser credits 05 marks/credit)" capScience="20" capArts="20" value={data.research.resMoocs4Quad} onChange={(v) => updateResearch('resMoocs4Quad', v)} />
                      <Table2Row sn="" activity="MOOCs (developed in 4 quadrant) per module/lecture" capScience="05" capArts="05" value={data.research.resMoocsModule} onChange={(v) => updateResearch('resMoocsModule', v)} />
                      <Table2Row sn="" activity="Contentwriter/subject matter expert for each moduleof MOOCs (at least one quadrant)" capScience="02" capArts="02" value={data.research.resMoocsContent} onChange={(v) => updateResearch('resMoocsContent', v)} />
                      <Table2Row sn="" activity="Course Coordinator for MOOCs (4 credit course)(In case of MOOCs of lesser credits 02 marks/credit)" capScience="08" capArts="08" value={data.research.resMoocsCoord} onChange={(v) => updateResearch('resMoocsCoord', v)} />

                      <Table2Row sn="" activity="(d) E-Content" capScience="" capArts="" isSubHeader />
                      <Table2Row sn="" activity="Development of e-Content in 4 quadrants for a complete course/e-book" capScience="12" capArts="12" value={data.research.resEcontentComplete} onChange={(v) => updateResearch('resEcontentComplete', v)} />
                      <Table2Row sn="" activity="e-Content (developed in 4 quadrants) per module" capScience="05" capArts="05" value={data.research.resEcontentModule} onChange={(v) => updateResearch('resEcontentModule', v)} />
                      <Table2Row sn="" activity="Contribution to development of e-content module in complete course/paper/e-book (at least one quadrant)" capScience="02" capArts="02" value={data.research.resEcontentContrib} onChange={(v) => updateResearch('resEcontentContrib', v)} />
                      <Table2Row sn="" activity="Editor of e-content for complete course/ paper /e-book" capScience="10" capArts="10" value={data.research.resEcontentEditor} onChange={(v) => updateResearch('resEcontentEditor', v)} />

                      {/* 4. Research Guidance */}
                      <Table2Row sn="4." activity="(a) Research guidance" capScience="" capArts="" isHeader />
                      <Table2Row sn="" activity="Ph.D. (10 per degree / 05 per thesis)" capScience="10" capArts="10" value={data.research.resPhd} onChange={(v) => updateResearch('resPhd', v)} />
                      <Table2Row sn="" activity="M.Phil./P.G dissertation (02 per degree)" capScience="02" capArts="02" value={data.research.resMphil} onChange={(v) => updateResearch('resMphil', v)} />

                      <Table2Row sn="" activity="(b) Research Projects Completed" capScience="" capArts="" isSubHeader />
                      <Table2Row sn="" activity="More than 10 lakhs" capScience="10" capArts="10" value={data.research.resProjMore10} onChange={(v) => updateResearch('resProjMore10', v)} />
                      <Table2Row sn="" activity="Less than 10 lakhs" capScience="05" capArts="05" value={data.research.resProjLess10} onChange={(v) => updateResearch('resProjLess10', v)} />

                      <Table2Row sn="" activity="(c) Research Projects Ongoing :" capScience="" capArts="" isSubHeader />
                      <Table2Row sn="" activity="More than 10 lakhs" capScience="05" capArts="05" value={data.research.resProjOngoingMore10} onChange={(v) => updateResearch('resProjOngoingMore10', v)} />
                      <Table2Row sn="" activity="Less than 10 lakhs" capScience="02" capArts="02" value={data.research.resProjOngoingLess10} onChange={(v) => updateResearch('resProjOngoingLess10', v)} />

                      <Table2Row sn="" activity="(d) Consultancy" capScience="03" capArts="03" value={data.research.resConsultancy} onChange={(v) => updateResearch('resConsultancy', v)} />

                      {/* 5. Patents */}
                      <Table2Row sn="5." activity="(a) Patents" capScience="" capArts="" isHeader />
                      <Table2Row sn="" activity="International" capScience="10" capArts="0" value={data.research.resPatentInt} onChange={(v) => updateResearch('resPatentInt', v)} />
                      <Table2Row sn="" activity="National" capScience="07" capArts="0" value={data.research.resPatentNat} onChange={(v) => updateResearch('resPatentNat', v)} />

                      <Table2Row sn="" activity="(b) *Policy Document (Submitted to an International body/organisation like UNO/UNESCO/World Bank/International Monetary Fund etc. or Central Government or State Government)" capScience="" capArts="" isSubHeader />
                      <Table2Row sn="" activity="International" capScience="10" capArts="10" value={data.research.resPolicyInt} onChange={(v) => updateResearch('resPolicyInt', v)} />
                      <Table2Row sn="" activity="National" capScience="07" capArts="07" value={data.research.resPolicyNat} onChange={(v) => updateResearch('resPolicyNat', v)} />
                      <Table2Row sn="" activity="State" capScience="04" capArts="04" value={data.research.resPolicyState} onChange={(v) => updateResearch('resPolicyState', v)} />

                      <Table2Row sn="" activity="(c) Awards/Fellowship" capScience="" capArts="" isSubHeader />
                      <Table2Row sn="" activity="International" capScience="07" capArts="07" value={data.research.resAwardInt} onChange={(v) => updateResearch('resAwardInt', v)} />
                      <Table2Row sn="" activity="National" capScience="05" capArts="05" value={data.research.resAwardNat} onChange={(v) => updateResearch('resAwardNat', v)} />

                      {/* 6. Invited */}
                      <Table2Row sn="6." activity="*Invited lectures / Resource Person/ paper presentation in Seminars/ Conferences/full paper in Conference Proceedings (Paper presented in Seminars/Conferences and also published as full paper in Conference Proceedings will be counted only once)" capScience="" capArts="" isHeader />
                      <Table2Row sn="" activity="International (Abroad)" capScience="07" capArts="0" value={data.research.resInvitedIntAbroad} onChange={(v) => updateResearch('resInvitedIntAbroad', v)} />
                      <Table2Row sn="" activity="International (within country)" capScience="05" capArts="0" value={data.research.resInvitedIntWithin} onChange={(v) => updateResearch('resInvitedIntWithin', v)} />
                      <Table2Row sn="" activity="National" capScience="03" capArts="0" value={data.research.resInvitedNat} onChange={(v) => updateResearch('resInvitedNat', v)} />
                      <Table2Row sn="" activity="State/University" capScience="02" capArts="0" value={data.research.resInvitedState} onChange={(v) => updateResearch('resInvitedState', v)} />
                    </tbody>
                 </table>
               </div>
               
               <div className="bg-slate-50 p-4 rounded border border-dashed border-slate-300 mb-8">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Upload Research Documents (PDF, Max 10MB)</label>
                    <input type="file" accept="application/pdf" onChange={(e) => handleFileUpload('fileResearch', e)} className="block w-full text-sm mb-4"/>
                    {data.fileResearch && <span className="text-xs text-green-600 flex items-center mt-1 mb-2"><CheckCircle className="w-3 h-3 mr-1"/> File Selected</span>}
                    
                    {/* Google Drive Link Option */}
                    <div className="pt-2 border-t border-slate-200">
                      <div className="flex items-center mb-2">
                        <LinkIcon className="w-4 h-4 text-slate-500 mr-2"/>
                        <label className="text-sm font-medium text-slate-700">Alternative: Google Drive Link (For Large Files)</label>
                      </div>
                      <Input 
                        label="" 
                        placeholder="Paste your Google Drive folder/file link here..." 
                        value={data.googleDriveLink} 
                        onChange={(e) => updateField('googleDriveLink', e.target.value)} 
                        helperText="Ensure access is set to 'Anyone with the link can view'."
                        className="mb-0"
                      />
                    </div>
                </div>

               {/* Payment */}
               <div className="bg-blue-50 p-6 rounded-lg mb-8">
                 <h3 className="font-semibold text-slate-800 mb-4">Payment Details</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="UTR No" value={data.utrNo} onChange={(e) => updateField('utrNo', e.target.value)} error={errors.utrNo} />
                  <Input label="Date" type="date" value={data.draftDate} onChange={(e) => updateField('draftDate', e.target.value)} error={errors.draftDate} />
                  <Input label="Amount" type="number" value={data.draftAmount} onChange={(e) => updateField('draftAmount', e.target.value)} error={errors.draftAmount} />
                  <Input label="Bank Name/UPI Provider" value={data.bankName} onChange={(e) => updateField('bankName', e.target.value)} error={errors.bankName} />
                 </div>
               </div>

               {/* Acknowledgment */}
               <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <input id="note-ack" type="checkbox" className="h-4 w-4 mt-1" checked={isFinalNoteConfirmed} onChange={(e) => setIsFinalNoteConfirmed(e.target.checked)} />
                    <label htmlFor="note-ack" className="text-sm font-medium text-gray-700 cursor-pointer">
                      I have read the instructions regarding Table 2 and attached relevant documents.
                    </label>
                  </div>
               </div>
             </div>
          )}

          {/* STEP 6: Declaration (Updated for NOC upload) */}
          {step === 6 && (
            <div>
               <SectionHeader title="Declaration" subtitle="Finalize and Submit" />
               {/* Declaration Text ... */}
               <div className="prose text-sm text-gray-600 mb-6">
                <p>I hereby declare that all entries are true...</p>
               </div>
               
               {/* Place/Date/Sign ... */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                 <Input label="Parent's Name" value={data.parentName} onChange={(e) => updateField('parentName', e.target.value)} error={errors.parentName} />
                 <Input label="Place" value={data.place} onChange={(e) => updateField('place', e.target.value)} error={errors.place} />
                 <Input label="Date" type="date" value={data.date} onChange={(e) => updateField('date', e.target.value)} error={errors.date} />
               </div>

               <div className="mb-8">
                 <label className="block text-sm font-medium mb-2">Signature *</label>
                 <div className="w-full md:w-1/2 h-24 border-2 border-dashed rounded flex items-center justify-center bg-gray-50">
                   {data.signature ? <img src={data.signature} className="h-full p-2 object-contain"/> : <span className="text-gray-400 text-xs">Upload Signature</span>}
                 </div>
                 <input type="file" accept="image/*" className="mt-2 text-sm" onChange={(e) => handleFileUpload('signature', e)} />
                 {errors.signature && <p className="text-red-500 text-xs">{errors.signature}</p>}
               </div>

               <div className="border-t pt-6">
                 <h3 className="font-semibold text-gray-700 mb-4">Employer NOC (If Applicable)</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <Input label="Employer Name" value={data.empName} onChange={(e) => updateField('empName', e.target.value)} required={false} />
                  <Input label="Designation" value={data.empDesignation} onChange={(e) => updateField('empDesignation', e.target.value)} required={false} />
                 </div>
                 <div className="bg-slate-50 p-4 rounded border border-dashed border-slate-300">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Upload NOC Document (PDF, Max 2MB)</label>
                    <input type="file" accept="application/pdf" onChange={(e) => handleFileUpload('fileNOC', e)} className="block w-full text-sm"/>
                </div>
               </div>
            </div>
          )}

          {/* Navigation Buttons (Same as before) */}
           {step > 0 && (
            <div className="flex justify-between mt-8 pt-6 border-t">
              <button onClick={handleBack} disabled={isSubmitting} className="flex items-center px-4 py-2 border rounded hover:bg-slate-50"> <ChevronLeft className="w-4 h-4 mr-2" /> Back</button>
              {step < 6 ? (
                <button onClick={handleNext} className="flex items-center px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Next <ChevronRight className="w-4 h-4 ml-2" /></button>
              ) : (
                <button onClick={handleSubmit} disabled={isSubmitting} className="flex items-center px-8 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">
                  {isSubmitting ? <><Loader2 className="animate-spin mr-2"/> Submitting</> : 'Submit Application'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
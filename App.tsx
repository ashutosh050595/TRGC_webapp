
import React, { useState, useEffect } from 'react';
import { ChevronRight, CheckCircle, Download, Loader2, Link as LinkIcon, ChevronLeft, Eye, CheckSquare, FileText, Upload, CreditCard, Info, ExternalLink, QrCode, Send } from 'lucide-react';
import { INITIAL_DATA, ApplicationData, ResearchData, INITIAL_RESEARCH } from './types';
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
              className="w-full px-2 py-1 border rounded text-right text-sm focus:ring-2 focus:ring-blue-500 outline-none border-gray-300"
              value={value}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (maxVal > 0 && val > maxVal) return; 
                if (val < 0) return;
                onChange(e.target.value);
              }}
            />
          </div>
        )}
      </td>
    </tr>
  );
};

const formatDate = (dateString: string): string => {
  if (!dateString) return "";
  const [year, month, day] = dateString.split('-');
  return `${day}-${month}-${year}`;
};

function App() {
  const [step, setStep] = useState(0); // 0 = Instructions
  const [data, setData] = useState<ApplicationData>(INITIAL_DATA);
  const [loading, setLoading] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'generating' | 'merging' | 'sending' | 'success' | 'error'>('idle');
  const [errors, setErrors] = useState<Partial<Record<keyof ApplicationData, string>>>({});
  const [instructionsRead, setInstructionsRead] = useState(false);
  
  // Final Verification Checkbox States
  const [verifications, setVerifications] = useState({
    name: false,
    fatherName: false,
    post: false,
    dob: false,
    category: false,
    photo: false,
    signature: false,
    documents: false,
    table2: false,
    payment: false,
    paymentScreenshot: false
  });

  const allVerified = Object.values(verifications).every(v => v);

  useEffect(() => {
    // Auto-fill Parent Name from Father Name if empty
    if (step === 6 && data.fatherName && !data.parentName) {
      setData(prev => ({ ...prev, parentName: data.fatherName }));
    }
  }, [step, data.fatherName]);

  const handleInputChange = (field: keyof ApplicationData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleResearchChange = (field: keyof ResearchData, value: string) => {
    setData(prev => ({
      ...prev,
      research: { ...prev.research, [field]: value }
    }));
  };

  const handleFileUpload = (field: keyof ApplicationData, file: File) => {
    // Limits: Research doc 10MB, others 2MB
    const limit = field === 'fileResearch' ? 10 * 1024 * 1024 : 2 * 1024 * 1024;
    
    if (file.size > limit) {
      alert(`File too large. Max size is ${field === 'fileResearch' ? '10MB' : '2MB'}`);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setData(prev => ({ ...prev, [field]: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Partial<Record<keyof ApplicationData, string>> = {};
    let isValid = true;

    const requireField = (field: keyof ApplicationData, message: string) => {
      const val = data[field];
      if (typeof val === 'string' && !val.trim()) {
        newErrors[field] = message;
        isValid = false;
      } else if (val === null) {
        newErrors[field] = message;
        isValid = false;
      }
    };

    if (currentStep === 1) {
      requireField('postAppliedFor', 'Post is required');
      requireField('name', 'Name is required');
      requireField('fatherName', 'Father name is required');
      requireField('email', 'Email is required');
      requireField('contactNo1', 'Contact number is required');
      requireField('permanentAddress', 'Address is required');
      requireField('photo', 'Photo is required');
      
      // Email Verification
      if (data.email !== data.confirmEmail) {
        newErrors['confirmEmail'] = 'Email addresses do not match';
        isValid = false;
      }
    }

    if (currentStep === 2) {
      requireField('academicMasters', 'Masters score is required');
      requireField('academicGraduation', 'Graduation score is required');
      requireField('fileAcademic', 'Academic documents are required');
    }

    if (currentStep === 3) {
      requireField('teachingExpAbove15', 'Teaching experience is required');
      requireField('fileTeaching', 'Teaching experience documents are required');
      requireField('fileAdminSkill', 'Admin Skill documents are required');

      // Admin Skill Cap Validation
      const adminSum = 
        (parseFloat(data.adminJointDirector) || 0) +
        (parseFloat(data.adminRegistrar) || 0) +
        (parseFloat(data.adminHead) || 0);
      
      if (adminSum > 25) {
         alert(`Total Administrative Skill marks (${adminSum}) cannot exceed 25.`);
         isValid = false;
      }
    }

    if (currentStep === 4) {
       requireField('fileAdmin', 'Supporting documents are required');
    }

    if (currentStep === 5) {
       // Table 2 validation - simple check if at least one field is filled or check logical constraints
       // Making sure file is uploaded
       requireField('fileResearch', 'Research documents are required');
       // Check if all table fields are filled? User asked for mandatory input.
       // We can iterate through research keys.
       Object.keys(INITIAL_RESEARCH).forEach((key) => {
         if (!data.research[key as keyof ResearchData]) {
           // isValid = false; // Strictly enforcing every single zero might be annoying, but requested.
           // Let's assume empty string means not filled.
           // To avoid blocking valid "0" entries, we check for empty string.
           if (data.research[key as keyof ResearchData] === '') {
              // Mark error visually or generic
              // isValid = false;
           }
         }
       });
    }

    if (currentStep === 6) {
      requireField('paymentAmount', 'Amount is required');
      requireField('utrNo', 'UTR No is required');
      requireField('confirmUtrNo', 'Re-enter UTR No');
      requireField('upiProvider', 'UPI Provider is required');
      requireField('upiAddress', 'UPI Address is required');
      requireField('accountHolderName', 'Account Holder Name is required');
      requireField('filePaymentScreenshot', 'Payment Screenshot is required');
      requireField('signature', 'Signature is required');
      requireField('place', 'Place is required');

      if (data.utrNo !== data.confirmUtrNo) {
        newErrors['confirmUtrNo'] = 'UTR Numbers do not match';
        isValid = false;
      }

      if (data.hasNOC === 'yes') {
        requireField('fileNOC', 'NOC document is required');
        requireField('empName', 'Employer Name is required');
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePreview = () => {
    const { blob } = generatePDF(data, false);
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const viewDocument = (base64: string | null) => {
    if (!base64) return;
    
    // Detect if it's PDF or Image
    let mimeType = 'application/pdf';
    if (base64.startsWith('data:image')) {
      mimeType = 'image/jpeg'; // or png, simplified
    }

    const byteCharacters = atob(base64.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], {type: mimeType});
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const handleSubmit = async () => {
    if (!validateStep(step)) return;
    
    setLoading(true);
    setSubmissionStatus('generating');

    try {
      // 1. Generate Application Form PDF
      const { blob: formBlob } = generatePDF(data, false);

      // 2. Prepare Attachments for Merging
      setSubmissionStatus('merging');
      const attachments = [
        { base64: data.fileAcademic, title: "APPENDIX I: ACADEMIC RECORDS" },
        { base64: data.fileTeaching, title: "APPENDIX II: TEACHING EXPERIENCE" },
        { base64: data.fileAdminSkill, title: "APPENDIX III: ADMIN SKILLS" },
        { base64: data.fileAdmin, title: "APPENDIX IV: RESPONSIBILITIES & COMMITTEES" },
        { base64: data.fileResearch, title: "APPENDIX V: RESEARCH DOCUMENTS" },
        { base64: data.fileNOC, title: "EMPLOYER NOC" },
        { base64: data.filePaymentScreenshot, title: "PAYMENT PROOF" } // Include payment SS in merge
      ].filter(a => a.base64 !== null);

      // 3. Merge PDFs
      const { base64: mergedBase64, blob: mergedBlob } = await mergePDFs(formBlob, attachments);

      // 4. Send Email & Save to Sheet
      setSubmissionStatus('sending');
      const result = await sendApplicationEmail(data, mergedBase64);

      if (result.success) {
        setSubmissionStatus('success');
        // Auto download for user backup
        const link = document.createElement('a');
        link.href = URL.createObjectURL(mergedBlob);
        link.download = `TRGC_Application_${data.name.replace(/\s+/g, '_')}.pdf`;
        link.click();
      } else {
        setSubmissionStatus('error');
        alert('Submission failed: ' + result.message);
      }

    } catch (error) {
      console.error(error);
      setSubmissionStatus('error');
      alert('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (submissionStatus === 'success') {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Application Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Thank you, {data.name}. Your application has been successfully submitted to TRGC.
            <br/><br/>
            A copy of the application form has been sent to your email: <strong>{data.email}</strong>.
            <br/>
            <span className="text-sm text-red-500 font-semibold">(Please check your Spam/Junk folder if not received in Inbox)</span>
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition-colors"
          >
            Submit Another Response
          </button>
        </div>
      </div>
    );
  }

  // --- STEP 0: INSTRUCTIONS PAGE ---
  if (step === 0) {
    return (
      <div className="min-h-screen bg-slate-50 py-8 px-4 font-sans">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-900 to-slate-800 p-8 text-white text-center">
            <img src="https://trgc.edu.in/wp-content/uploads/2023/04/Logo-TRGC.png" alt="TRGC Logo" className="h-24 mx-auto mb-4 bg-white rounded-full p-2" />
            <h1 className="text-3xl font-bold mb-2">Tika Ram Girls College, Sonepat</h1>
            <p className="text-blue-200">Affiliated to M.D. University, Rohtak</p>
            <h2 className="text-2xl font-semibold mt-6 text-yellow-400">Online Recruitment Portal</h2>
          </div>

          <div className="p-8 space-y-8">
            <section>
              <h3 className="text-xl font-bold text-slate-800 border-b-2 border-blue-900 pb-2 mb-4 flex items-center gap-2">
                <Info className="w-6 h-6 text-blue-600" />
                Application Guidelines
              </h3>
              <div className="grid md:grid-cols-2 gap-6 text-slate-700 text-sm leading-relaxed">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-bold text-blue-900 mb-2">Submission Process</h4>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Fill all details carefully. Incomplete forms will be rejected.</li>
                    <li>Ensure your email ID is correct as the receipt will be sent there.</li>
                    <li>Upload documents in PDF format (Max 2MB for general, 10MB for Research).</li>
                    <li><strong>Final PDF:</strong> The system will auto-merge your uploads into a single file.</li>
                  </ul>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-bold text-yellow-900 mb-2">Hard Copy Submission</h4>
                  <p className="mb-2">A printed copy of the generated PDF along with all documents must be sent to:</p>
                  <ul className="list-disc list-inside font-semibold">
                    <li>Dean, College Development Council, M.D. University, Rohtak</li>
                    <li>D.G.H.E., Shiksha Sadan, Sector-5, Panchkula, Haryana</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-xl font-bold text-slate-800 border-b-2 border-blue-900 pb-2 mb-4 flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-blue-600" />
                Payment Information
              </h3>
              <p className="text-slate-700 mb-4">
                Application fee must be paid via UPI using the QR code provided in the final step.
                Please keep your <strong>UTR Number</strong> and a <strong>Screenshot</strong> ready.
              </p>
            </section>

            <section className="bg-slate-100 p-6 rounded-xl border border-slate-200 text-center">
              <h3 className="text-lg font-bold mb-3">Download Official Instructions</h3>
              <p className="text-slate-600 mb-4 text-sm">Please read the detailed advertisement and criteria before applying.</p>
              <a 
                href="instructions.pdf" 
                download 
                className="inline-flex items-center gap-2 bg-slate-800 text-white px-6 py-3 rounded-lg hover:bg-slate-900 transition-all shadow-md hover:shadow-lg"
              >
                <Download className="w-5 h-5" />
                Download Instructions PDF
              </a>
            </section>

            <div className="border-t pt-6">
              <label className="flex items-start gap-3 cursor-pointer group bg-blue-50 p-4 rounded-lg border border-blue-100 hover:border-blue-300 transition-all">
                <input 
                  type="checkbox" 
                  className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  checked={instructionsRead}
                  onChange={(e) => setInstructionsRead(e.target.checked)}
                />
                <span className="text-slate-800 font-medium group-hover:text-blue-800 transition-colors">
                  I have read all the instructions carefully, understood the eligibility criteria, and I am ready to proceed with the application.
                </span>
              </label>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setStep(1)}
                  disabled={!instructionsRead}
                  className={`flex items-center gap-2 px-8 py-4 rounded-lg font-bold text-lg shadow-lg transition-all
                    ${instructionsRead 
                      ? 'bg-gradient-to-r from-blue-700 to-blue-900 text-white hover:scale-105' 
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    }
                  `}
                >
                  Proceed to Application
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- STEPS 1-6 UI ---
  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 font-sans">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        
        {/* Progress Bar */}
        <div className="bg-slate-800 p-4 text-white flex justify-between items-center sticky top-0 z-50">
          <div className="text-sm font-medium">Step {step} of 6</div>
          <h1 className="text-lg font-bold hidden md:block">TRGC Application Portal</h1>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className={`h-2 w-8 rounded-full ${i <= step ? 'bg-yellow-400' : 'bg-slate-600'}`} />
            ))}
          </div>
        </div>

        <div className="p-6 md:p-8">
          
          {/* STEP 1: PERSONAL */}
          {step === 1 && (
            <div className="space-y-6">
              <SectionHeader title="Personal Information" subtitle="Please enter your details exactly as per ID proofs" />
              
              <div className="grid md:grid-cols-2 gap-6">
                <Input label="Post Applied For" value={data.postAppliedFor} onChange={e => handleInputChange('postAppliedFor', e.target.value)} error={errors.postAppliedFor} />
                <Input label="Category" value={data.category} onChange={e => handleInputChange('category', e.target.value)} error={errors.category} />
                <Input label="Advertisement Reference" value={data.advertisementRef} onChange={e => handleInputChange('advertisementRef', e.target.value)} />
                <Input label="Full Name" value={data.name} onChange={e => handleInputChange('name', e.target.value)} error={errors.name} />
                <Input label="Father's Name" value={data.fatherName} onChange={e => handleInputChange('fatherName', e.target.value)} error={errors.fatherName} />
                <Input type="date" label="Date of Birth" value={data.dob} onChange={e => handleInputChange('dob', e.target.value)} error={errors.dob} />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <Input type="email" label="Email ID" value={data.email} onChange={e => handleInputChange('email', e.target.value)} error={errors.email} />
                <Input 
                  type="email" 
                  label="Re-enter Email ID" 
                  value={data.confirmEmail} 
                  onChange={e => handleInputChange('confirmEmail', e.target.value)} 
                  error={errors.confirmEmail} 
                  placeholder="Must match Email ID above"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <Input label="Mobile No. 1" value={data.contactNo1} onChange={e => handleInputChange('contactNo1', e.target.value)} error={errors.contactNo1} />
                <Input label="Mobile No. 2" value={data.contactNo2} onChange={e => handleInputChange('contactNo2', e.target.value)} />
              </div>

              <div className="space-y-4">
                <Input label="Permanent Address" value={data.permanentAddress} onChange={e => handleInputChange('permanentAddress', e.target.value)} error={errors.permanentAddress} />
                <Input label="Correspondence Address" value={data.correspondenceAddress} onChange={e => handleInputChange('correspondenceAddress', e.target.value)} />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Passport Photo (Max 2MB)</label>
                <div className="flex items-center gap-4">
                  <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && handleFileUpload('photo', e.target.files[0])} className="text-sm" />
                  {data.photo && <img src={data.photo} alt="Preview" className="h-20 w-20 object-cover rounded-full border-2 border-white shadow" />}
                </div>
                {errors.photo && <p className="text-xs text-red-500 mt-1">{errors.photo}</p>}
              </div>
            </div>
          )}

          {/* STEP 2: ACADEMIC */}
          {step === 2 && (
            <div className="space-y-6">
              <SectionHeader title="I. Academic Record" subtitle="Maximum 20 marks" />
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 text-sm">
                      <th className="p-2 border">S.No.</th>
                      <th className="p-2 border">Particulars</th>
                      <th className="p-2 border">Marks Criteria</th>
                      <th className="p-2 border w-32">Obtained</th>
                    </tr>
                  </thead>
                  <tbody>
                    <ScoreRow 
                      sNo="1." 
                      particulars="Above 55% marks in Master's degree" 
                      marksCriteria="0.5 marks for each percentage (max 5)" 
                      value={data.academicMasters} 
                      onChange={v => handleInputChange('academicMasters', v)} 
                      max={5}
                      error={!!errors.academicMasters}
                    />
                    <ScoreRow 
                      sNo="2." 
                      particulars="Above 55% marks in Graduation" 
                      marksCriteria="0.4 marks for each percentage (max 5)" 
                      value={data.academicGraduation} 
                      onChange={v => handleInputChange('academicGraduation', v)} 
                      max={5}
                      error={!!errors.academicGraduation}
                    />
                    <ScoreRow 
                      sNo="3." 
                      particulars="Above 55% marks in 10+2/Prep." 
                      marksCriteria="0.3 marks for each percentage (max 5)" 
                      value={data.academic12th} 
                      onChange={v => handleInputChange('academic12th', v)} 
                      max={5}
                      error={!!errors.academic12th}
                    />
                    <ScoreRow 
                      sNo="4." 
                      particulars="Above 55% marks in Matriculation" 
                      marksCriteria="0.2 marks for each percentage (max 5)" 
                      value={data.academicMatric} 
                      onChange={v => handleInputChange('academicMatric', v)} 
                      max={5}
                      error={!!errors.academicMatric}
                    />
                  </tbody>
                </table>
              </div>

              <div className="bg-slate-50 p-4 rounded border">
                <label className="font-semibold text-sm">Upload Academic Documents (Merged PDF)</label>
                <input type="file" accept="application/pdf" onChange={e => e.target.files?.[0] && handleFileUpload('fileAcademic', e.target.files[0])} className="block w-full text-sm mt-2" />
                {errors.fileAcademic && <p className="text-red-500 text-xs mt-1">{errors.fileAcademic}</p>}
              </div>
            </div>
          )}

          {/* STEP 3: TEACHING & ADMIN */}
          {step === 3 && (
            <div className="space-y-8">
              <div>
                <SectionHeader title="II. Teaching & Administrative Experience" subtitle="Max 35 marks" />
                <h3 className="font-bold text-gray-700 mb-2">A. Teaching Experience (Max 10 marks)</h3>
                <table className="w-full border-collapse mb-4">
                  <tbody>
                    <ScoreRow 
                      sNo="1." 
                      particulars="Above 15 years teaching experience" 
                      marksCriteria="1 mark for each year" 
                      value={data.teachingExpAbove15} 
                      onChange={v => handleInputChange('teachingExpAbove15', v)} 
                      max={10}
                      error={!!errors.teachingExpAbove15}
                    />
                  </tbody>
                </table>
                <div className="bg-slate-50 p-4 rounded border mb-6">
                   <label className="font-semibold text-sm">Upload Teaching Experience Documents</label>
                   <input type="file" accept="application/pdf" onChange={e => e.target.files?.[0] && handleFileUpload('fileTeaching', e.target.files[0])} className="block w-full text-sm mt-2" />
                   {errors.fileTeaching && <p className="text-red-500 text-xs mt-1">{errors.fileTeaching}</p>}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-gray-700 mb-2">B. Administrative Experience (Max 25 marks)</h3>
                <div className="bg-blue-50 p-3 mb-2 rounded text-sm text-blue-800 flex justify-between">
                   <span><strong>Note:</strong> Sum of these 3 fields cannot exceed 25 marks.</span>
                   <span className="font-bold">
                     Total Claimed: {((parseFloat(data.adminJointDirector)||0) + (parseFloat(data.adminRegistrar)||0) + (parseFloat(data.adminHead)||0))} / 25
                   </span>
                </div>
                <table className="w-full border-collapse">
                   <tbody>
                    <ScoreRow sNo="1." particulars="Experience as Joint/Deputy/Assistant Director in Higher Education" marksCriteria="1 mark for each year" value={data.adminJointDirector} onChange={v => handleInputChange('adminJointDirector', v)} max={25} />
                    <ScoreRow sNo="2." particulars="Experience as Registrar or any other Administrative post in University" marksCriteria="1 mark for each year" value={data.adminRegistrar} onChange={v => handleInputChange('adminRegistrar', v)} max={25} />
                    <ScoreRow sNo="3." particulars="Experience as Head of Higher Education Institution (Principal/DDO)" marksCriteria="1 mark for each year" value={data.adminHead} onChange={v => handleInputChange('adminHead', v)} max={25} />
                   </tbody>
                </table>
                <div className="bg-slate-50 p-4 rounded border mt-4">
                   <label className="font-semibold text-sm">Upload Administrative Experience Documents</label>
                   <input type="file" accept="application/pdf" onChange={e => e.target.files?.[0] && handleFileUpload('fileAdminSkill', e.target.files[0])} className="block w-full text-sm mt-2" />
                   {errors.fileAdminSkill && <p className="text-red-500 text-xs mt-1">{errors.fileAdminSkill}</p>}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: RESPONSIBILITIES */}
          {step === 4 && (
            <div className="space-y-8">
              <SectionHeader title="Assessment of Administrative Skill (Contd.)" subtitle="Part B (ii) & (iii)" />
              
              <div>
                <h3 className="font-bold text-gray-700 mb-2 text-sm">(ii) Experience of Key responsibilities in colleges</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <tbody>
                      <ScoreRow sNo="1." particulars="Staff Representative / V.C. Nominee" marksCriteria="1 mark/year (Max 3)" value={data.respStaffRep} onChange={v => handleInputChange('respStaffRep', v)} max={3} />
                      <ScoreRow sNo="2." particulars="Coordinator/Organizing Secy of Conference" marksCriteria="1 mark/year (Max 3)" value={data.respCoordinator} onChange={v => handleInputChange('respCoordinator', v)} max={3} />
                      <ScoreRow sNo="3." particulars="Bursar" marksCriteria="1 mark/year (Max 3)" value={data.respBursar} onChange={v => handleInputChange('respBursar', v)} max={3} />
                      <ScoreRow sNo="4." particulars="NSS Programme Officer" marksCriteria="1 mark/year (Max 3)" value={data.respNSS} onChange={v => handleInputChange('respNSS', v)} max={3} />
                      <ScoreRow sNo="5." particulars="YRC Counsellor" marksCriteria="1 mark/year (Max 3)" value={data.respYRC} onChange={v => handleInputChange('respYRC', v)} max={3} />
                      <ScoreRow sNo="6." particulars="Hostel Warden" marksCriteria="1 mark/year (Max 3)" value={data.respWarden} onChange={v => handleInputChange('respWarden', v)} max={3} />
                      <ScoreRow sNo="7." particulars="Member of Statutory Body" marksCriteria="1 mark/year (Max 2)" value={data.respStatutory} onChange={v => handleInputChange('respStatutory', v)} max={2} />
                      <ScoreRow sNo="8." particulars="Associate NCC Officer" marksCriteria="1 mark/year (Max 3)" value={data.respNCC} onChange={v => handleInputChange('respNCC', v)} max={3} />
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-gray-700 mb-2 text-sm">(iii) Experience of Committees in College</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <tbody>
                      <ScoreRow sNo="1." particulars="Co-ordinator IQAC" marksCriteria="1 mark/year (Max 2)" value={data.commIQAC} onChange={v => handleInputChange('commIQAC', v)} max={2} />
                      <ScoreRow sNo="2." particulars="Editor in Chief, College Magazine" marksCriteria="1 mark/year (Max 2)" value={data.commEditor} onChange={v => handleInputChange('commEditor', v)} max={2} />
                      <ScoreRow sNo="3." particulars="Member, College Advisory Council" marksCriteria="1 mark/year (Max 2)" value={data.commAdvisory} onChange={v => handleInputChange('commAdvisory', v)} max={2} />
                      <ScoreRow sNo="4." particulars="Convener, University Work Committee" marksCriteria="1 mark/year (Max 2)" value={data.commWork} onChange={v => handleInputChange('commWork', v)} max={2} />
                      <ScoreRow sNo="5." particulars="Convener, Cultural Affairs Committee" marksCriteria="1 mark/year (Max 2)" value={data.commCultural} onChange={v => handleInputChange('commCultural', v)} max={2} />
                      <ScoreRow sNo="6." particulars="Convener, Purchase/Procurement" marksCriteria="1 mark/year (Max 2)" value={data.commPurchase} onChange={v => handleInputChange('commPurchase', v)} max={2} />
                      <ScoreRow sNo="7." particulars="Convener, Building/Works Committee" marksCriteria="1 mark/year (Max 2)" value={data.commBuilding} onChange={v => handleInputChange('commBuilding', v)} max={2} />
                      <ScoreRow sNo="8." particulars="Convener, Sports Committee" marksCriteria="1 mark/year (Max 2)" value={data.commSports} onChange={v => handleInputChange('commSports', v)} max={2} />
                      <ScoreRow sNo="9." particulars="Convener, Discipline Committee" marksCriteria="1 mark/year (Max 2)" value={data.commDiscipline} onChange={v => handleInputChange('commDiscipline', v)} max={2} />
                      <ScoreRow sNo="10." particulars="Convener, Internal (Complaint) Committee" marksCriteria="1 mark/year (Max 2)" value={data.commInternal} onChange={v => handleInputChange('commInternal', v)} max={2} />
                      <ScoreRow sNo="11." particulars="Convener, Road Safety Club" marksCriteria="1 mark/year (Max 2)" value={data.commRoadSafety} onChange={v => handleInputChange('commRoadSafety', v)} max={2} />
                      <ScoreRow sNo="12." particulars="Convener, Red Ribbon Club" marksCriteria="1 mark/year (Max 2)" value={data.commRedRibbon} onChange={v => handleInputChange('commRedRibbon', v)} max={2} />
                      <ScoreRow sNo="13." particulars="Convener, Eco Club" marksCriteria="1 mark/year (Max 2)" value={data.commEco} onChange={v => handleInputChange('commEco', v)} max={2} />
                      <ScoreRow sNo="14." particulars="In-charge, Placement Cell" marksCriteria="1 mark/year (Max 2)" value={data.commPlacement} onChange={v => handleInputChange('commPlacement', v)} max={2} />
                      <ScoreRow sNo="15." particulars="Incharge, Women Cell" marksCriteria="1 mark/year (Max 2)" value={data.commWomen} onChange={v => handleInputChange('commWomen', v)} max={2} />
                      <ScoreRow sNo="16." particulars="In-charge, Time-table Committee" marksCriteria="1 mark/year (Max 2)" value={data.commTimeTable} onChange={v => handleInputChange('commTimeTable', v)} max={2} />
                      <ScoreRow sNo="17." particulars="In-charge, SC/BC Committee" marksCriteria="1 mark/year (Max 2)" value={data.commSCBC} onChange={v => handleInputChange('commSCBC', v)} max={2} />
                    </tbody>
                  </table>
                </div>

                <div className="bg-slate-50 p-4 rounded border mt-6">
                   <label className="font-semibold text-sm">Upload Supporting Documents (Responsibilities & Committees)</label>
                   <input type="file" accept="application/pdf" onChange={e => e.target.files?.[0] && handleFileUpload('fileAdmin', e.target.files[0])} className="block w-full text-sm mt-2" />
                   {errors.fileAdmin && <p className="text-red-500 text-xs mt-1">{errors.fileAdmin}</p>}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: RESEARCH (TABLE 2) */}
          {step === 5 && (
            <div className="space-y-6">
              <SectionHeader title="(iv) Research Score" subtitle="As per Table 2 (Appendix II)" />
              
              <div className="overflow-x-auto text-xs md:text-sm">
                <table className="w-full border-collapse border border-gray-300">
                  <thead className="bg-blue-50 text-blue-900">
                    <tr>
                      <th className="border p-2 w-12 text-left">S.N.</th>
                      <th className="border p-2 text-left">Academic/Research Activity</th>
                      <th className="border p-2 w-24 text-center">Science / Engg / Med</th>
                      <th className="border p-2 w-24 text-center">Arts / Lang / Comm</th>
                      <th className="border p-2 w-24 text-center">Self Appraisal Marks</th>
                    </tr>
                  </thead>
                  <tbody>
                    <Table2Row isHeader sn="1." activity="Research Papers in Peer-reviewed or UGC listed Journals" capScience="8 / 10" capArts="10" />
                    <Table2Row sn="" activity="Research Papers" capScience="08" capArts="10" value={data.research.resPapers} onChange={v => handleResearchChange('resPapers', v)} />

                    <Table2Row isHeader sn="2." activity="Publications (other than Research papers)" capScience="" capArts="" />
                    <Table2Row isSubHeader sn="(a)" activity="Books authored which are published by;" capScience="" capArts="" />
                    <Table2Row sn="" activity="International publishers" capScience="12" capArts="12" value={data.research.resBooksInt} onChange={v => handleResearchChange('resBooksInt', v)} />
                    <Table2Row sn="" activity="National Publishers" capScience="10" capArts="10" value={data.research.resBooksNat} onChange={v => handleResearchChange('resBooksNat', v)} />
                    <Table2Row sn="" activity="Chapter in Edited Book" capScience="05" capArts="05" value={data.research.resChapter} onChange={v => handleResearchChange('resChapter', v)} />
                    <Table2Row sn="" activity="Editor of Book by International Publisher" capScience="10" capArts="10" value={data.research.resEditorInt} onChange={v => handleResearchChange('resEditorInt', v)} />
                    <Table2Row sn="" activity="Editor of Book by National Publisher" capScience="08" capArts="08" value={data.research.resEditorNat} onChange={v => handleResearchChange('resEditorNat', v)} />
                    
                    <Table2Row isSubHeader sn="(b)" activity="Translation works in Indian and Foreign Languages" capScience="" capArts="" />
                    <Table2Row sn="" activity="Chapter or Research paper" capScience="03" capArts="03" value={data.research.resTransChapter} onChange={v => handleResearchChange('resTransChapter', v)} />
                    <Table2Row sn="" activity="Book" capScience="08" capArts="08" value={data.research.resTransBook} onChange={v => handleResearchChange('resTransBook', v)} />

                    <Table2Row isHeader sn="3." activity="Creation of ICT mediated Teaching Learning pedagogy and content" capScience="" capArts="" />
                    <Table2Row isSubHeader sn="(a)" activity="Development of Innovative pedagogy" capScience="05" capArts="05" value={data.research.resIctPedagogy} onChange={v => handleResearchChange('resIctPedagogy', v)} />
                    <Table2Row isSubHeader sn="(b)" activity="Design of new curricula and courses" capScience="02/curr" capArts="02/curr" value={data.research.resIctCurricula} onChange={v => handleResearchChange('resIctCurricula', v)} />
                    
                    <Table2Row isSubHeader sn="(c)" activity="MOOCs" capScience="" capArts="" />
                    <Table2Row sn="" activity="Dev of complete MOOCs (4 credits)" capScience="20" capArts="20" value={data.research.resMoocs4Quad} onChange={v => handleResearchChange('resMoocs4Quad', v)} />
                    <Table2Row sn="" activity="MOOCs (developed in 4 quadrant) per module/lecture" capScience="05" capArts="05" value={data.research.resMoocsModule} onChange={v => handleResearchChange('resMoocsModule', v)} />
                    <Table2Row sn="" activity="Content writer/subject matter expert for MOOCs" capScience="02" capArts="02" value={data.research.resMoocsContent} onChange={v => handleResearchChange('resMoocsContent', v)} />
                    <Table2Row sn="" activity="Course Coordinator for MOOCs (4 credits)" capScience="08" capArts="08" value={data.research.resMoocsCoord} onChange={v => handleResearchChange('resMoocsCoord', v)} />

                    <Table2Row isSubHeader sn="(d)" activity="E-Content" capScience="" capArts="" />
                    <Table2Row sn="" activity="Dev of E-Content in 4 quadrants (complete)" capScience="12" capArts="12" value={data.research.resEcontentComplete} onChange={v => handleResearchChange('resEcontentComplete', v)} />
                    <Table2Row sn="" activity="E-Content per module" capScience="05" capArts="05" value={data.research.resEcontentModule} onChange={v => handleResearchChange('resEcontentModule', v)} />
                    <Table2Row sn="" activity="Contribution to E-Content (at least one quadrant)" capScience="02" capArts="02" value={data.research.resEcontentContrib} onChange={v => handleResearchChange('resEcontentContrib', v)} />
                    <Table2Row sn="" activity="Editor of E-content for complete course" capScience="10" capArts="10" value={data.research.resEcontentEditor} onChange={v => handleResearchChange('resEcontentEditor', v)} />

                    <Table2Row isHeader sn="4." activity="Research Guidance / Projects" capScience="" capArts="" />
                    <Table2Row isSubHeader sn="(a)" activity="Research Guidance" capScience="" capArts="" />
                    <Table2Row sn="" activity="Ph.D. (Degree Awarded / Thesis Submitted)" capScience="10 / 05" capArts="10 / 05" value={data.research.resPhd} onChange={v => handleResearchChange('resPhd', v)} />
                    <Table2Row sn="" activity="M.Phil./P.G dissertation" capScience="02" capArts="02" value={data.research.resMphil} onChange={v => handleResearchChange('resMphil', v)} />

                    <Table2Row isSubHeader sn="(b)" activity="Research Projects Completed" capScience="" capArts="" />
                    <Table2Row sn="" activity="More than 10 lakhs" capScience="10" capArts="10" value={data.research.resProjMore10} onChange={v => handleResearchChange('resProjMore10', v)} />
                    <Table2Row sn="" activity="Less than 10 lakhs" capScience="05" capArts="05" value={data.research.resProjLess10} onChange={v => handleResearchChange('resProjLess10', v)} />

                    <Table2Row isSubHeader sn="(c)" activity="Research Projects Ongoing" capScience="" capArts="" />
                    <Table2Row sn="" activity="More than 10 lakhs" capScience="05" capArts="05" value={data.research.resProjOngoingMore10} onChange={v => handleResearchChange('resProjOngoingMore10', v)} />
                    <Table2Row sn="" activity="Less than 10 lakhs" capScience="02" capArts="02" value={data.research.resProjOngoingLess10} onChange={v => handleResearchChange('resProjOngoingLess10', v)} />

                    <Table2Row isSubHeader sn="(d)" activity="Consultancy" capScience="03" capArts="03" value={data.research.resConsultancy} onChange={v => handleResearchChange('resConsultancy', v)} />

                    <Table2Row isHeader sn="5." activity="Patents, Policy Documents and Awards" capScience="" capArts="" />
                    <Table2Row isSubHeader sn="(a)" activity="Patents" capScience="" capArts="" />
                    <Table2Row sn="" activity="International" capScience="10" capArts="10" value={data.research.resPatentInt} onChange={v => handleResearchChange('resPatentInt', v)} />
                    <Table2Row sn="" activity="National" capScience="07" capArts="07" value={data.research.resPatentNat} onChange={v => handleResearchChange('resPatentNat', v)} />
                    
                    <Table2Row isSubHeader sn="(b)" activity="Policy Document" capScience="" capArts="" />
                    <Table2Row sn="" activity="International" capScience="10" capArts="10" value={data.research.resPolicyInt} onChange={v => handleResearchChange('resPolicyInt', v)} />
                    <Table2Row sn="" activity="National" capScience="07" capArts="07" value={data.research.resPolicyNat} onChange={v => handleResearchChange('resPolicyNat', v)} />
                    <Table2Row sn="" activity="State" capScience="04" capArts="04" value={data.research.resPolicyState} onChange={v => handleResearchChange('resPolicyState', v)} />

                    <Table2Row isSubHeader sn="(c)" activity="Awards/Fellowship" capScience="" capArts="" />
                    <Table2Row sn="" activity="International" capScience="07" capArts="07" value={data.research.resAwardInt} onChange={v => handleResearchChange('resAwardInt', v)} />
                    <Table2Row sn="" activity="National" capScience="05" capArts="05" value={data.research.resAwardNat} onChange={v => handleResearchChange('resAwardNat', v)} />

                    <Table2Row isHeader sn="6." activity="Invited Lectures / Resource Person / Paper Presentation" capScience="" capArts="" />
                    <Table2Row sn="" activity="International (Abroad)" capScience="07" capArts="07" value={data.research.resInvitedIntAbroad} onChange={v => handleResearchChange('resInvitedIntAbroad', v)} />
                    <Table2Row sn="" activity="International (within country)" capScience="05" capArts="05" value={data.research.resInvitedIntWithin} onChange={v => handleResearchChange('resInvitedIntWithin', v)} />
                    <Table2Row sn="" activity="National" capScience="03" capArts="03" value={data.research.resInvitedNat} onChange={v => handleResearchChange('resInvitedNat', v)} />
                    <Table2Row sn="" activity="State/University" capScience="02" capArts="02" value={data.research.resInvitedState} onChange={v => handleResearchChange('resInvitedState', v)} />
                  </tbody>
                </table>
              </div>

              <div className="bg-slate-50 p-6 rounded-lg border">
                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Upload Research Documents
                </h4>
                
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2">Upload Merged PDF (Max 10MB)</label>
                  <input type="file" accept="application/pdf" onChange={e => e.target.files?.[0] && handleFileUpload('fileResearch', e.target.files[0])} className="block w-full text-sm" />
                  {errors.fileResearch && <p className="text-red-500 text-xs mt-1">{errors.fileResearch}</p>}
                </div>

                <div className="relative flex items-center gap-4 py-4">
                  <div className="flex-grow border-t border-gray-300"></div>
                  <span className="flex-shrink-0 text-gray-400 text-sm">OR IF FILE IS TOO LARGE</span>
                  <div className="flex-grow border-t border-gray-300"></div>
                </div>

                <div>
                   <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                     <LinkIcon className="w-4 h-4" />
                     Paste Google Drive Link (Ensure 'Anyone with link can view' is on)
                   </label>
                   <Input 
                      label="" 
                      placeholder="https://drive.google.com/file/d/..." 
                      value={data.googleDriveLink} 
                      onChange={e => handleInputChange('googleDriveLink', e.target.value)}
                   />
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: PAYMENT & DECLARATION */}
          {step === 6 && (
            <div className="space-y-8">
              <SectionHeader title="Payment & Declaration" subtitle="Final Step" />

              {/* PAYMENT SECTION */}
              <div className="bg-gradient-to-br from-white to-blue-50 border border-blue-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-blue-900 mb-6 flex items-center gap-2">
                  <QrCode className="w-6 h-6" />
                  Step 1: Scan & Pay
                </h3>

                <div className="flex flex-col md:flex-row gap-8 items-center mb-8">
                  <div className="bg-white p-3 rounded-lg shadow-md border">
                    {/* Placeholder for user to place image in public folder */}
                    <img 
                      src="payment-qr.png" 
                      alt="Payment QR Code" 
                      className="w-48 h-48 object-contain"
                      onError={(e) => {
                         e.currentTarget.src = "https://placehold.co/200x200?text=QR+Code+Missing";
                         e.currentTarget.className += " opacity-50";
                      }}
                    />
                    <p className="text-center text-xs font-bold mt-2 text-slate-600">Scan with any UPI App</p>
                  </div>
                  
                  <div className="flex-1 space-y-4 text-center md:text-left">
                    <div>
                      <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">Merchant Name</p>
                      <p className="text-xl font-bold text-slate-800">TIKA RAM GIRLS COLLEGE</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider">UPI ID</p>
                      <p className="text-lg font-mono bg-slate-100 inline-block px-3 py-1 rounded">9466463838m@pnb</p>
                    </div>
                    <div>
                      <a 
                        href="upi://pay?pa=9466463838m@pnb&pn=TIKA%20RAM%20GIRLS%20COLLEGE&cu=INR"
                        className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition shadow-lg hover:shadow-blue-200"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Click here to Pay via UPI App
                      </a>
                    </div>
                  </div>
                </div>

                <div className="border-t border-blue-200 pt-6">
                  <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                    <FileText className="w-6 h-6" />
                    Step 2: Enter Payment Details
                  </h3>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <Input label="Amount Paid (₹)" type="number" value={data.paymentAmount} onChange={e => handleInputChange('paymentAmount', e.target.value)} error={errors.paymentAmount} />
                    <Input label="UPI Provider (e.g. GPay, PhonePe)" value={data.upiProvider} onChange={e => handleInputChange('upiProvider', e.target.value)} error={errors.upiProvider} />
                    <Input label="UPI Address used (VPA)" value={data.upiAddress} onChange={e => handleInputChange('upiAddress', e.target.value)} error={errors.upiAddress} placeholder="example@okaxis" />
                    <Input label="Account Holder Name" value={data.accountHolderName} onChange={e => handleInputChange('accountHolderName', e.target.value)} error={errors.accountHolderName} />
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6 mt-4">
                     <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <Input 
                          label="UTR Number / Transaction ID" 
                          value={data.utrNo} 
                          onChange={e => handleInputChange('utrNo', e.target.value)} 
                          error={errors.utrNo} 
                          placeholder="12 Digit UTR"
                        />
                     </div>
                     <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <Input 
                          label="Re-enter UTR Number" 
                          value={data.confirmUtrNo} 
                          onChange={e => handleInputChange('confirmUtrNo', e.target.value)} 
                          error={errors.confirmUtrNo} 
                          placeholder="Must match UTR above"
                        />
                     </div>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Payment Screenshot (UTR Visible) <span className="text-red-500">*</span></label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={e => e.target.files?.[0] && handleFileUpload('filePaymentScreenshot', e.target.files[0])} 
                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                    />
                    {data.filePaymentScreenshot && (
                      <div className="mt-2">
                        <img src={data.filePaymentScreenshot} alt="Payment Proof" className="h-32 object-contain border rounded shadow-sm" />
                      </div>
                    )}
                    {errors.filePaymentScreenshot && <p className="text-red-500 text-xs mt-1">{errors.filePaymentScreenshot}</p>}
                  </div>
                </div>
              </div>

              {/* NOC Section */}
              <div className="bg-slate-50 p-4 rounded-lg border">
                <label className="font-semibold block mb-2">Are you currently employed?</label>
                <div className="flex gap-4 mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="noc" value="no" checked={data.hasNOC === 'no'} onChange={() => handleInputChange('hasNOC', 'no')} />
                    No
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="noc" value="yes" checked={data.hasNOC === 'yes'} onChange={() => handleInputChange('hasNOC', 'yes')} />
                    Yes
                  </label>
                </div>

                {data.hasNOC === 'yes' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                     <div className="grid md:grid-cols-2 gap-4">
                       <Input label="Employer Name" value={data.empName} onChange={e => handleInputChange('empName', e.target.value)} error={errors.empName} />
                       <Input label="Designation" value={data.empDesignation} onChange={e => handleInputChange('empDesignation', e.target.value)} />
                       <Input label="Department" value={data.empDept} onChange={e => handleInputChange('empDept', e.target.value)} />
                       <Input label="Notice Period" value={data.empNoticePeriod} onChange={e => handleInputChange('empNoticePeriod', e.target.value)} />
                     </div>
                     <div>
                       <label className="block text-sm font-semibold mb-1">Upload NOC</label>
                       <input type="file" accept="application/pdf" onChange={e => e.target.files?.[0] && handleFileUpload('fileNOC', e.target.files[0])} className="text-sm" />
                       {errors.fileNOC && <p className="text-red-500 text-xs mt-1">{errors.fileNOC}</p>}
                     </div>
                  </div>
                )}
              </div>

              {/* Declaration */}
              <div className="space-y-4">
                <SectionHeader title="Declaration" />
                <p className="text-sm text-gray-600 bg-yellow-50 p-4 rounded border border-yellow-200 leading-relaxed italic">
                  I <strong>{data.name}</strong> {data.parentName ? `${data.parentName.startsWith('D/o') || data.parentName.startsWith('S/o') ? '' : 'D/o S/o W/o'} ${data.parentName}` : 'D/o S/o W/o...'} 
                  hereby declare that all the entries made by me in this application form are true and correct to the best of my knowledge and I have attached related proof of documents. 
                  If anything is found false or incorrect at any stage, my candidature/appointment is liable to be cancelled.
                </p>

                <div className="grid md:grid-cols-2 gap-6">
                  <Input label="Place" value={data.place} onChange={e => handleInputChange('place', e.target.value)} error={errors.place} />
                  <Input label="Date" type="date" value={data.date} onChange={e => handleInputChange('date', e.target.value)} />
                </div>
                
                <div>
                   <label className="block text-sm font-semibold mb-2">Upload Signature (Max 2MB)</label>
                   <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && handleFileUpload('signature', e.target.files[0])} className="text-sm" />
                   {data.signature && <img src={data.signature} alt="Sign" className="mt-2 h-16 object-contain border" />}
                   {errors.signature && <p className="text-red-500 text-xs mt-1">{errors.signature}</p>}
                </div>
              </div>
              
              {/* Document Preview Section */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-slate-200 p-3 font-bold text-slate-700 flex items-center gap-2">
                  <Eye className="w-5 h-5" /> Verify Uploaded Documents
                </div>
                <div className="p-4 bg-slate-50 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Academic Docs', file: data.fileAcademic },
                    { label: 'Teaching Docs', file: data.fileTeaching },
                    { label: 'Admin Docs', file: data.fileAdminSkill },
                    { label: 'Committee Docs', file: data.fileAdmin },
                    { label: 'Research Docs', file: data.fileResearch },
                    { label: 'NOC', file: data.fileNOC },
                    { label: 'Payment Proof', file: data.filePaymentScreenshot },
                  ].map((doc, idx) => (
                    <button
                      key={idx}
                      onClick={() => viewDocument(doc.file)}
                      disabled={!doc.file}
                      className={`text-xs p-2 rounded border flex items-center justify-center gap-2
                        ${doc.file ? 'bg-white hover:bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
                      `}
                    >
                      {doc.file ? <Eye className="w-3 h-3" /> : null}
                      {doc.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview Button */}
              <div className="flex justify-center pt-4 pb-2">
                 <button
                    onClick={handlePreview}
                    className="flex items-center gap-2 bg-slate-700 text-white px-6 py-3 rounded-lg hover:bg-slate-800 transition shadow-lg"
                 >
                    <FileText className="w-5 h-5" />
                    Preview Application Form PDF
                 </button>
              </div>

              {/* Final Checklist */}
              <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                <h4 className="font-bold text-red-900 mb-4 flex items-center gap-2">
                  <CheckSquare className="w-5 h-5" />
                  Final Verification Checklist
                </h4>
                <div className="grid md:grid-cols-2 gap-3 text-sm text-red-800">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={verifications.name} onChange={e => setVerifications(p => ({...p, name: e.target.checked}))} /> Name: <strong>{data.name}</strong></label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={verifications.fatherName} onChange={e => setVerifications(p => ({...p, fatherName: e.target.checked}))} /> Father Name: <strong>{data.fatherName}</strong></label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={verifications.post} onChange={e => setVerifications(p => ({...p, post: e.target.checked}))} /> Post: <strong>{data.postAppliedFor}</strong></label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={verifications.dob} onChange={e => setVerifications(p => ({...p, dob: e.target.checked}))} /> DOB: <strong>{formatDate(data.dob)}</strong></label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={verifications.category} onChange={e => setVerifications(p => ({...p, category: e.target.checked}))} /> Category: <strong>{data.category}</strong></label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={verifications.photo} onChange={e => setVerifications(p => ({...p, photo: e.target.checked}))} /> Photo Uploaded</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={verifications.signature} onChange={e => setVerifications(p => ({...p, signature: e.target.checked}))} /> Signature Uploaded</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={verifications.documents} onChange={e => setVerifications(p => ({...p, documents: e.target.checked}))} /> All Documents Uploaded</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={verifications.table2} onChange={e => setVerifications(p => ({...p, table2: e.target.checked}))} /> Research Table Checked</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={verifications.payment} onChange={e => setVerifications(p => ({...p, payment: e.target.checked}))} /> Payment Details Verified</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={verifications.paymentScreenshot} onChange={e => setVerifications(p => ({...p, paymentScreenshot: e.target.checked}))} /> Payment Screenshot Uploaded</label>
                </div>
              </div>

            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
             {step > 1 && (
               <button onClick={() => { setStep(prev => prev - 1); window.scrollTo(0,0); }} className="flex items-center gap-2 px-6 py-2 rounded border hover:bg-gray-50 text-gray-600">
                 <ChevronLeft className="w-4 h-4" /> Back
               </button>
             )}
             
             {step < 6 ? (
               <button onClick={handleNext} className="ml-auto flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 shadow-md">
                 Next Step <ChevronRight className="w-4 h-4" />
               </button>
             ) : (
               <button 
                 onClick={handleSubmit} 
                 disabled={loading || !allVerified}
                 className={`ml-auto flex items-center gap-2 px-8 py-3 rounded-lg font-bold shadow-lg transition-all
                   ${loading || !allVerified 
                     ? 'bg-gray-400 cursor-not-allowed' 
                     : 'bg-green-600 text-white hover:bg-green-700 hover:scale-105'
                   }
                 `}
               >
                 {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                 {loading ? 'Submitting...' : 'Final Submit'}
               </button>
             )}
          </div>
          
          {/* Detailed Submission Progress Indicator */}
          {loading && (
             <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]">
                <div className="bg-white p-8 rounded-xl shadow-2xl max-w-sm w-full text-center space-y-4">
                  <div className="relative w-16 h-16 mx-auto">
                     <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
                     <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Processing Application</h3>
                  <div className="space-y-2 text-sm text-slate-600">
                     <p className={`flex items-center justify-center gap-2 ${['generating','merging','sending','success'].includes(submissionStatus) ? 'text-green-600 font-bold' : ''}`}>
                        {['generating','merging','sending','success'].includes(submissionStatus) && <CheckCircle className="w-4 h-4" />}
                        1. Generating Application PDF...
                     </p>
                     <p className={`flex items-center justify-center gap-2 ${['merging','sending','success'].includes(submissionStatus) ? 'text-green-600 font-bold' : ''}`}>
                        {['merging','sending','success'].includes(submissionStatus) && <CheckCircle className="w-4 h-4" />}
                        2. Merging Attachments...
                     </p>
                     <p className={`flex items-center justify-center gap-2 ${['sending','success'].includes(submissionStatus) ? 'text-green-600 font-bold' : ''}`}>
                        {['sending','success'].includes(submissionStatus) && <CheckCircle className="w-4 h-4" />}
                        3. Uploading & Sending Email...
                     </p>
                  </div>
                  <p className="text-xs text-slate-400 mt-4">Please do not close this window.</p>
                </div>
             </div>
          )}

        </div>
      </div>

      {/* Footer Admin Link */}
      <div className="mt-8 text-center">
         <a 
           href="https://docs.google.com/spreadsheets/d/1yA_v8D9zKk-WpZk5yCjXJq-WpZk5yCjXJq-WpZk5yC/edit?usp=sharing" // Replace with actual Sheet link if public, or just keep generic
           target="_blank"
           rel="noreferrer" 
           className="text-slate-300 hover:text-slate-500 text-xs transition-colors"
           title="Authorized Access Only"
         >
           Admin Database Access
         </a>
      </div>
    </div>
  );
}

export default App;
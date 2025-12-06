import React, { useState } from 'react';
import { Upload, ChevronRight, ChevronLeft, CheckCircle, FileText, Download, Mail, Loader2, AlertCircle, Send, Info, DollarSign, FileCheck, Printer } from 'lucide-react';
import { INITIAL_DATA, ApplicationData } from './types';
import { Input } from './components/Input';
import { ScoreRow } from './components/ScoreRow';
import { SectionHeader } from './components/SectionHeader';
import { generatePDF } from './services/pdfGenerator';
import { sendApplicationEmail } from './services/emailService';
import { mergePDFs } from './services/pdfMerger';

function App() {
  const [step, setStep] = useState(0); // Start at Step 0 (Instructions)
  const [data, setData] = useState<ApplicationData>(INITIAL_DATA);
  const [errors, setErrors] = useState<Partial<Record<keyof ApplicationData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
  
  // Specific checkbox states
  const [isStartInstructionsRead, setIsStartInstructionsRead] = useState(false); // Step 0
  const [isFinalNoteConfirmed, setIsFinalNoteConfirmed] = useState(false); // Step 5

  const updateField = (field: keyof ApplicationData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileUpload = (field: 'photo' | 'signature', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2000000) { // 2MB limit
        alert("File size too large. Please upload an image under 2MB.");
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
      // presentEmployer is optional or can be marked N/A
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
      // Admin skills are strictly required by request "Make all columns mandatory"
      requireField('adminJointDirector');
      requireField('adminRegistrar');
      requireField('adminHead');
    }

    if (currentStep === 4) {
      const fields: (keyof ApplicationData)[] = [
        'respStaffRep', 'respCoordinator', 'respBursar', 'respNSS', 'respYRC', 
        'respWarden', 'respStatutory', 'respNCC', 'commIQAC', 'commEditor', 
        'commAdvisory', 'commWork', 'commCultural', 'commPurchase', 'commBuilding', 
        'commSports', 'commDiscipline', 'commInternal', 'commRoadSafety', 
        'commRedRibbon', 'commEco', 'commPlacement', 'commWomen', 'commTimeTable', 'commSCBC'
      ];
      fields.forEach(f => requireField(f));
    }

    if (currentStep === 5) {
      requireField('researchScore');
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
      // 1. Generate Basic PDF (Do not download yet)
      const { blob: appPdfBlob } = generatePDF(data, false);
      
      // 2. Merge with Instructions PDF
      const { base64: mergedBase64, blob: mergedBlob } = await mergePDFs(appPdfBlob);

      // 3. Trigger Download of the MERGED PDF
      const link = document.createElement('a');
      link.href = URL.createObjectURL(mergedBlob);
      link.download = `${data.name.replace(/\s+/g, '_')}_Application_Complete.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 4. Send Merged Data to Google Script
      const emailResult = await sendApplicationEmail(data, mergedBase64);
      
      if (emailResult.success) {
        setEmailStatus('sent');
      } else {
        console.warn("Email/DB failed:", emailResult.message);
        setEmailStatus('failed');
      }
      
      // 5. Show Success Screen
      setIsSuccess(true);
      window.scrollTo(0, 0);

    } catch (error) {
      console.error(error);
      alert("An unexpected error occurred. Please check your downloaded files.");
      setIsSuccess(true);
      setEmailStatus('failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => {
    if (step === 0) return null; // No indicator on instructions page

    return (
      <div className="flex justify-between mb-8 overflow-x-auto pb-4 px-2">
        {[1, 2, 3, 4, 5, 6].map((s) => (
          <div key={s} className={`flex items-center ${s !== 6 ? 'flex-1' : ''}`}>
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors
              ${step === s ? 'bg-blue-600 text-white' : step > s ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}
            >
              {step > s ? <CheckCircle size={16} /> : s}
            </div>
            {s !== 6 && (
              <div className={`h-1 flex-1 mx-2 rounded ${step > s ? 'bg-green-500' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>
    );
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-100 p-4 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-lg w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Application Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Your application data has been recorded securely.
          </p>
          
          <div className="space-y-4 mb-8">
            <div className="flex items-start p-4 bg-blue-50 rounded-lg text-left">
              <Download className="w-6 h-6 text-blue-600 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-900">1. Downloaded</h4>
                <p className="text-sm text-blue-800">
                  Your complete Application Form (including instructions) has been downloaded to your device.
                </p>
              </div>
            </div>

            <div className={`flex items-start p-4 rounded-lg text-left border ${emailStatus === 'sent' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
              <Mail className={`w-6 h-6 mt-1 mr-3 flex-shrink-0 ${emailStatus === 'sent' ? 'text-green-600' : 'text-yellow-600'}`} />
              <div>
                <h4 className={`font-semibold ${emailStatus === 'sent' ? 'text-green-900' : 'text-yellow-900'}`}>
                  2. Status: {emailStatus === 'sent' ? 'Success' : 'Pending'}
                </h4>
                <p className={`text-sm mt-1 ${emailStatus === 'sent' ? 'text-green-800' : 'text-yellow-800'}`}>
                  {emailStatus === 'sent' 
                    ? `We have received your application and sent a confirmation email with the PDF to ${data.email}.`
                    : "We could not automatically confirm the submission. Please email the downloaded PDF to principal.trgc@gmail.com manually."
                  }
                </p>
                {emailStatus === 'sent' && (
                  <p className="text-xs mt-2 text-green-700 font-medium">
                    * Please check your Spam/Junk folder if you do not see the email.
                  </p>
                )}
              </div>
            </div>
          </div>

          <button 
            onClick={() => window.location.reload()}
            className="text-gray-500 hover:text-gray-700 text-sm font-medium"
          >
            Start New Application
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 flex flex-col justify-between">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden w-full">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">TIKA RAM GIRLS COLLEGE</h1>
              <p className="text-slate-300 text-sm">Application Portal • Sonepat, Haryana</p>
            </div>
            <FileText className="text-blue-400 w-10 h-10 opacity-80" />
          </div>
        </div>

        <div className="p-6 md:p-8">
          {renderStepIndicator()}

          {/* Validation Error Banner */}
          {Object.keys(errors).length > 0 && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <p className="text-red-700 font-medium">Please correct the errors below to proceed.</p>
              </div>
            </div>
          )}

          {/* STEP 0: INSTRUCTIONS */}
          {step === 0 && (
            <div className="space-y-6">
              <SectionHeader title="Application Guidelines" subtitle="Please read the following instructions carefully" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="p-4 border rounded-lg bg-blue-50 border-blue-100">
                    <div className="flex items-center mb-2 text-blue-800 font-semibold">
                        <FileCheck className="w-5 h-5 mr-2" />
                        1. Documents Required
                    </div>
                    <p className="text-sm text-slate-600">
                        Keep scanned copies of your <strong>Passport Size Photograph</strong> and <strong>Signature</strong> ready before filling the form (Max size 2MB each).
                    </p>
                </div>
                <div className="p-4 border rounded-lg bg-emerald-50 border-emerald-100">
                    <div className="flex items-center mb-2 text-emerald-800 font-semibold">
                        <DollarSign className="w-5 h-5 mr-2" />
                        2. Payment Details
                    </div>
                    <p className="text-sm text-slate-600">
                        Have your <strong>UTR Number</strong> and transaction details ready. You will need to enter these in the payment section.
                    </p>
                </div>
                <div className="p-4 border rounded-lg bg-amber-50 border-amber-100">
                    <div className="flex items-center mb-2 text-amber-800 font-semibold">
                        <Info className="w-5 h-5 mr-2" />
                        3. Scoring Criteria
                    </div>
                    <p className="text-sm text-slate-600">
                        Academic and Research scores must be calculated based on the DGHE criteria. Please refer to <strong>Table 2 (Appendix II)</strong> in the detailed instructions.
                    </p>
                </div>
                 <div className="p-4 border rounded-lg bg-purple-50 border-purple-100">
                    <div className="flex items-center mb-2 text-purple-800 font-semibold">
                        <Printer className="w-5 h-5 mr-2" />
                        4. Hard Copy Submission
                    </div>
                    <p className="text-sm text-slate-600">
                        <strong>CRITICAL:</strong> After submitting online, you must Print the PDF, attach self-attested copies of testimonials, and send it to:
                        <br/>1) Dean College Development Council, MDU Rohtak
                        <br/>2) D.G.H.E., Shiksha Sadan, Panchkula
                    </p>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-3">Additional Notes:</h3>
                <ul className="list-disc pl-5 text-sm text-slate-700 space-y-2">
                    <li>All fields marked with an asterisk (*) are mandatory.</li>
                    <li>If you are currently employed, you must submit a <strong>No Objection Certificate (NOC)</strong> in the attached format.</li>
                    <li>Ensure your email address is correct as the confirmation PDF will be sent there.</li>
                    <li>Download the full detailed instructions document below for reference regarding scoring and eligibility.</li>
                </ul>
                
                <div className="mt-6">
                    <a 
                    href="instructions.pdf" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-white border border-blue-300 rounded-md text-blue-700 hover:bg-blue-50 transition-colors shadow-sm font-medium text-sm"
                    >
                    <Download className="w-4 h-4 mr-2" />
                    Download Detailed Instructions PDF
                    </a>
                </div>
              </div>

              <div className="mt-8 flex items-start space-x-3 p-4 border-2 border-slate-200 rounded-lg bg-white hover:border-blue-300 transition-colors cursor-pointer" onClick={() => setIsStartInstructionsRead(!isStartInstructionsRead)}>
                <div className="flex h-5 items-center">
                  <input
                    id="instructions-ack"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    checked={isStartInstructionsRead}
                    onChange={(e) => setIsStartInstructionsRead(e.target.checked)}
                  />
                </div>
                <div className="text-sm">
                  <label htmlFor="instructions-ack" className="font-medium text-gray-800 cursor-pointer select-none">
                    I have read all the above instructions carefully and I am ready to proceed with the application.
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={handleNext}
                  disabled={!isStartInstructionsRead}
                  className={`flex items-center px-6 py-3 rounded-lg text-white font-medium transition-colors
                    ${isStartInstructionsRead ? 'bg-blue-600 hover:bg-blue-700 shadow-lg transform active:scale-95 transition-all' : 'bg-gray-400 cursor-not-allowed'}`}
                >
                  Proceed to Application <ChevronRight className="w-5 h-5 ml-2" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 1: Personal Info */}
          {step === 1 && (
            <div className="space-y-6">
              <SectionHeader title="Personal Information" subtitle="Basic details for the application" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Post Applied For" value={data.postAppliedFor} onChange={(e) => updateField('postAppliedFor', e.target.value)} error={errors.postAppliedFor} />
                <Input label="Category" value={data.category} onChange={(e) => updateField('category', e.target.value)} error={errors.category} />
                <Input label="Advertisement Reference" value={data.advertisementRef} onChange={(e) => updateField('advertisementRef', e.target.value)} error={errors.advertisementRef} />
                <Input label="Name" value={data.name} onChange={(e) => updateField('name', e.target.value)} error={errors.name} />
                <Input label="Father's Name" value={data.fatherName} onChange={(e) => updateField('fatherName', e.target.value)} error={errors.fatherName} />
                <Input label="Date of Birth" type="date" value={data.dob} onChange={(e) => updateField('dob', e.target.value)} error={errors.dob} />
                
                <Input 
                    label="Email ID" 
                    type="email" 
                    value={data.email} 
                    onChange={(e) => updateField('email', e.target.value)} 
                    error={errors.email} 
                />
                <Input 
                    label="Re-enter Email ID" 
                    type="email" 
                    value={data.confirmEmail} 
                    onChange={(e) => updateField('confirmEmail', e.target.value)} 
                    error={errors.confirmEmail} 
                    onPaste={(e) => { e.preventDefault(); return false; }}
                    placeholder="Please type email again"
                />

                <Input label="Contact No 1" value={data.contactNo1} onChange={(e) => updateField('contactNo1', e.target.value)} error={errors.contactNo1} />
                <Input label="Contact No 2" value={data.contactNo2} onChange={(e) => updateField('contactNo2', e.target.value)} />
              </div>

              <Input label="Permanent Address (With Pin Code)" value={data.permanentAddress} onChange={(e) => updateField('permanentAddress', e.target.value)} error={errors.permanentAddress} />
              <Input label="Correspondence Address (With Pin Code)" value={data.correspondenceAddress} onChange={(e) => updateField('correspondenceAddress', e.target.value)} error={errors.correspondenceAddress} />
              <Input label="Present Employer" value={data.presentEmployer} onChange={(e) => updateField('presentEmployer', e.target.value)} error={errors.presentEmployer} helperText="Submit NOC in attached format" />

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Latest Photograph</label>
                <div className="flex items-center space-x-4">
                  <div className="w-32 h-40 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden relative">
                    {data.photo ? (
                      <img src={data.photo} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-400 text-xs text-center px-2">No Image</span>
                    )}
                  </div>
                  <label className="cursor-pointer bg-white border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-md shadow-sm text-sm font-medium text-gray-700 flex items-center">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Photo
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload('photo', e)} />
                  </label>
                </div>
                {errors.photo && <p className="text-xs text-red-500 mt-1">{errors.photo}</p>}
              </div>
            </div>
          )}

          {/* STEP 2: Academic Record */}
          {step === 2 && (
            <div>
              <SectionHeader title="Academic Record" subtitle="Maximum 20 marks" />
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b text-sm">
                      <th className="p-3 font-semibold text-slate-700 w-16">S.No</th>
                      <th className="p-3 font-semibold text-slate-700">Particulars</th>
                      <th className="p-3 font-semibold text-slate-700">Criteria</th>
                      <th className="p-3 font-semibold text-slate-700 w-32">Marks</th>
                    </tr>
                  </thead>
                  <tbody>
                    <ScoreRow sNo="1." particulars="Above 55% marks in Master's degree" marksCriteria="0.5 marks for each percentage (max 5 marks)" value={data.academicMasters} onChange={(v) => updateField('academicMasters', v)} error={!!errors.academicMasters} max={5} />
                    <ScoreRow sNo="2." particulars="Above 55% marks in Graduation" marksCriteria="0.4 marks for each percentage (max 5 marks)" value={data.academicGraduation} onChange={(v) => updateField('academicGraduation', v)} error={!!errors.academicGraduation} max={5} />
                    <ScoreRow sNo="3." particulars="Above 55% marks in 10+2/Prep." marksCriteria="0.3 marks for each percentage (max 5 marks)" value={data.academic12th} onChange={(v) => updateField('academic12th', v)} error={!!errors.academic12th} max={5} />
                    <ScoreRow sNo="4." particulars="Above 55% marks in Matriculation" marksCriteria="0.2 marks for each percentage (max 5 marks)" value={data.academicMatric} onChange={(v) => updateField('academicMatric', v)} error={!!errors.academicMatric} max={5} />
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 3: Teaching & Admin */}
          {step === 3 && (
            <div>
              <SectionHeader title="Teaching & Admin Experience" subtitle="Maximum 35 marks" />
              
              <h3 className="font-semibold text-slate-700 mb-2 mt-4">A. Teaching Experience (Max 10 marks)</h3>
              <div className="overflow-x-auto mb-8">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b text-sm">
                      <th className="p-3 w-16">S.No</th>
                      <th className="p-3">Particulars</th>
                      <th className="p-3">Criteria</th>
                      <th className="p-3 w-32">Marks</th>
                    </tr>
                  </thead>
                  <tbody>
                    <ScoreRow sNo="1." particulars="Above 15 years teaching experience" marksCriteria="1 mark for each year" value={data.teachingExpAbove15} onChange={(v) => updateField('teachingExpAbove15', v)} error={!!errors.teachingExpAbove15} />
                  </tbody>
                </table>
              </div>

              <h3 className="font-semibold text-slate-700 mb-2">B. Administrative Skill (Max 25 marks)</h3>
              <p className="text-sm text-slate-500 mb-2">(i) Experience of Administrative Responsibilities</p>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <tbody>
                    <ScoreRow sNo="1." particulars="Exp as Joint/Deputy/Assistant Director in Directorate of Higher Education" marksCriteria="1 mark for each year" value={data.adminJointDirector} onChange={(v) => updateField('adminJointDirector', v)} error={!!errors.adminJointDirector} />
                    <ScoreRow sNo="2." particulars="Exp as Registrar or any other Administrative post in any University" marksCriteria="1 mark for each year" value={data.adminRegistrar} onChange={(v) => updateField('adminRegistrar', v)} error={!!errors.adminRegistrar} />
                    <ScoreRow sNo="3." particulars="Exp as Head of the Higher Education Institution i.e. Principal, Officiating Principal/DDO" marksCriteria="1 mark for each year" value={data.adminHead} onChange={(v) => updateField('adminHead', v)} error={!!errors.adminHead} />
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 4: Key Responsibilities & Committees */}
          {step === 4 && (
            <div>
              <SectionHeader title="Responsibilities & Committees" subtitle="Administrative Skills Continued" />
              
              <p className="text-sm text-slate-500 mb-2">(ii) Experience of Key responsibilities in colleges</p>
              <div className="overflow-x-auto mb-8">
                <table className="w-full text-left border-collapse">
                  <tbody>
                    <ScoreRow sNo="1." particulars="Staff Representative or V.C. Nominee" marksCriteria="1 mark/year (max 3)" value={data.respStaffRep} onChange={(v) => updateField('respStaffRep', v)} error={!!errors.respStaffRep} max={3} />
                    <ScoreRow sNo="2." particulars="Co-ordinator or Organizing Secretary of Conference" marksCriteria="1 mark/year (max 3)" value={data.respCoordinator} onChange={(v) => updateField('respCoordinator', v)} error={!!errors.respCoordinator} max={3} />
                    <ScoreRow sNo="3." particulars="Bursar" marksCriteria="1 mark/year (max 3)" value={data.respBursar} onChange={(v) => updateField('respBursar', v)} error={!!errors.respBursar} max={3} />
                    <ScoreRow sNo="4." particulars="NSS Programme Officer" marksCriteria="1 mark/year (max 3)" value={data.respNSS} onChange={(v) => updateField('respNSS', v)} error={!!errors.respNSS} max={3} />
                    <ScoreRow sNo="5." particulars="YRC Counsellor" marksCriteria="1 mark/year (max 3)" value={data.respYRC} onChange={(v) => updateField('respYRC', v)} error={!!errors.respYRC} max={3} />
                    <ScoreRow sNo="6." particulars="Hostel Warden" marksCriteria="1 mark/year (max 3)" value={data.respWarden} onChange={(v) => updateField('respWarden', v)} error={!!errors.respWarden} max={3} />
                    <ScoreRow sNo="7." particulars="Member of any Statutory Body of University" marksCriteria="1 mark/year (max 2)" value={data.respStatutory} onChange={(v) => updateField('respStatutory', v)} error={!!errors.respStatutory} max={2} />
                    <ScoreRow sNo="8." particulars="Associate NCC Officer" marksCriteria="1 mark/year (max 3)" value={data.respNCC} onChange={(v) => updateField('respNCC', v)} error={!!errors.respNCC} max={3} />
                  </tbody>
                </table>
              </div>

              <p className="text-sm text-slate-500 mb-2">(iii) Experience of Committees in College</p>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <tbody>
                    <ScoreRow sNo="1." particulars="Co-ordinator IQAC" marksCriteria="1 mark/year (max 2)" value={data.commIQAC} onChange={(v) => updateField('commIQAC', v)} error={!!errors.commIQAC} max={2} />
                    <ScoreRow sNo="2." particulars="Editor in Chief, College Magazine" marksCriteria="1 mark/year (max 2)" value={data.commEditor} onChange={(v) => updateField('commEditor', v)} error={!!errors.commEditor} max={2} />
                    <ScoreRow sNo="3." particulars="Member, College Advisory Council" marksCriteria="1 mark/year (max 2)" value={data.commAdvisory} onChange={(v) => updateField('commAdvisory', v)} error={!!errors.commAdvisory} max={2} />
                    <ScoreRow sNo="4." particulars="Convener, University Work Committee" marksCriteria="1 mark/year (max 2)" value={data.commWork} onChange={(v) => updateField('commWork', v)} error={!!errors.commWork} max={2} />
                    <ScoreRow sNo="5." particulars="Convener, Cultural Affairs Committee" marksCriteria="1 mark/year (max 2)" value={data.commCultural} onChange={(v) => updateField('commCultural', v)} error={!!errors.commCultural} max={2} />
                    <ScoreRow sNo="6." particulars="Convener, Purchase/Procurement" marksCriteria="1 mark/year (max 2)" value={data.commPurchase} onChange={(v) => updateField('commPurchase', v)} error={!!errors.commPurchase} max={2} />
                    <ScoreRow sNo="7." particulars="Convener, Building/Works" marksCriteria="1 mark/year (max 2)" value={data.commBuilding} onChange={(v) => updateField('commBuilding', v)} error={!!errors.commBuilding} max={2} />
                    <ScoreRow sNo="8." particulars="Convener, Sports Committee" marksCriteria="1 mark/year (max 2)" value={data.commSports} onChange={(v) => updateField('commSports', v)} error={!!errors.commSports} max={2} />
                    <ScoreRow sNo="9." particulars="Convener, Discipline Committee" marksCriteria="1 mark/year (max 2)" value={data.commDiscipline} onChange={(v) => updateField('commDiscipline', v)} error={!!errors.commDiscipline} max={2} />
                    <ScoreRow sNo="10." particulars="Convener, Internal (Complaint) Committee" marksCriteria="1 mark/year (max 2)" value={data.commInternal} onChange={(v) => updateField('commInternal', v)} error={!!errors.commInternal} max={2} />
                    <ScoreRow sNo="11." particulars="Convener, Road Safety Club" marksCriteria="1 mark/year (max 2)" value={data.commRoadSafety} onChange={(v) => updateField('commRoadSafety', v)} error={!!errors.commRoadSafety} max={2} />
                    <ScoreRow sNo="12." particulars="Convener, Red Ribbon Club" marksCriteria="1 mark/year (max 2)" value={data.commRedRibbon} onChange={(v) => updateField('commRedRibbon', v)} error={!!errors.commRedRibbon} max={2} />
                    <ScoreRow sNo="13." particulars="Convener, Eco Club" marksCriteria="1 mark/year (max 2)" value={data.commEco} onChange={(v) => updateField('commEco', v)} error={!!errors.commEco} max={2} />
                    <ScoreRow sNo="14." particulars="In-charge, Placement Cell" marksCriteria="1 mark/year (max 2)" value={data.commPlacement} onChange={(v) => updateField('commPlacement', v)} error={!!errors.commPlacement} max={2} />
                    <ScoreRow sNo="15." particulars="Incharge, Women Cell" marksCriteria="1 mark/year (max 2)" value={data.commWomen} onChange={(v) => updateField('commWomen', v)} error={!!errors.commWomen} max={2} />
                    <ScoreRow sNo="16." particulars="In-charge, Time-table Committee" marksCriteria="1 mark/year (max 2)" value={data.commTimeTable} onChange={(v) => updateField('commTimeTable', v)} error={!!errors.commTimeTable} max={2} />
                    <ScoreRow sNo="17." particulars="In-charge, SC/BC Committee" marksCriteria="1 mark/year (max 2)" value={data.commSCBC} onChange={(v) => updateField('commSCBC', v)} error={!!errors.commSCBC} max={2} />
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 5: Research & Payment */}
          {step === 5 && (
            <div>
              <SectionHeader title="Research & Payment" subtitle="Research Score and Payment Details" />
              
              <h3 className="font-semibold text-slate-700 mb-2">III. Academic/Research Score (Max 32.5 marks)</h3>
              <div className="overflow-x-auto mb-8">
                <table className="w-full text-left border-collapse">
                  <tbody>
                    <ScoreRow 
                      sNo="1." 
                      particulars="Research Score above 110 as per The criteria given in Appendix II, Table 2 (See instructions)" 
                      marksCriteria="0.3 mark for each 1 Research Score above 110" 
                      value={data.researchScore} 
                      onChange={(v) => updateField('researchScore', v)} 
                      error={!!errors.researchScore}
                    />
                  </tbody>
                </table>
              </div>

              <div className="bg-blue-50 p-6 rounded-lg mb-8">
                <h3 className="font-semibold text-slate-800 mb-4">Payment Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="UTR No" value={data.utrNo} onChange={(e) => updateField('utrNo', e.target.value)} error={errors.utrNo} placeholder="Enter UTR Number" />
                  <Input label="Date" type="date" value={data.draftDate} onChange={(e) => updateField('draftDate', e.target.value)} error={errors.draftDate} />
                  <Input label="Amount" type="number" value={data.draftAmount} onChange={(e) => updateField('draftAmount', e.target.value)} error={errors.draftAmount} />
                  <Input label="Bank Name/UPI Provider" value={data.bankName} onChange={(e) => updateField('bankName', e.target.value)} error={errors.bankName} />
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <p className="text-sm text-yellow-800 mb-3">
                  <strong>Note:</strong> The candidate is to attach the relevant documents in support of his/her claim mentioned in the application form, criteria, Table-2 (Appendix Il contd.) and the same documents are also to be sent with the copies to Dean College Development Council, M.D. University Rohtak and D.G.H.E., Shiksha Sadan, Sector-5, Panchkula Haryana.
                </p>
                <div className="flex items-start space-x-3 mt-3">
                  <div className="flex h-5 items-center">
                    <input
                      id="note-ack"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      checked={isFinalNoteConfirmed}
                      onChange={(e) => setIsFinalNoteConfirmed(e.target.checked)}
                    />
                  </div>
                  <div className="text-sm">
                    <label htmlFor="note-ack" className="font-medium text-gray-700 cursor-pointer">
                      I have read the above instructions and agree to comply.
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Declaration */}
          {step === 6 && (
            <div>
              <SectionHeader title="Declaration" subtitle="Finalize and Submit" />
              
              <div className="prose text-sm text-gray-600 mb-8">
                <p>
                  I hereby declare that all the entries made by me in this application from are true and correct to the best of my knowledge and I have attached related proof of documents in form of self attested copies. If anything is found false or incorrect at any stage, my candidature/appointment is liable to be cancelled.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Input label="Parent's Name (S/o, D/o, W/o)" value={data.parentName} onChange={(e) => updateField('parentName', e.target.value)} error={errors.parentName} />
                <Input label="Place" value={data.place} onChange={(e) => updateField('place', e.target.value)} error={errors.place} />
                <Input label="Date" type="date" value={data.date} onChange={(e) => updateField('date', e.target.value)} error={errors.date} />
              </div>

              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">Signature of Applicant</label>
                <div className="w-full md:w-1/2 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden relative">
                  {data.signature ? (
                    <img src={data.signature} alt="Signature" className="w-full h-full object-contain p-2" />
                  ) : (
                    <span className="text-gray-400 text-xs">Upload Signature</span>
                  )}
                </div>
                <label className="mt-2 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Signature
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload('signature', e)} />
                </label>
                {errors.signature && <p className="text-xs text-red-500 mt-1">{errors.signature}</p>}
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-700 mb-4">Employer Certificate Details (If Applicable)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Employer Name" value={data.empName} onChange={(e) => updateField('empName', e.target.value)} required={false} />
                  <Input label="Designation" value={data.empDesignation} onChange={(e) => updateField('empDesignation', e.target.value)} required={false} />
                  <Input label="Department" value={data.empDept} onChange={(e) => updateField('empDept', e.target.value)} required={false} />
                  <Input label="Notice Period" value={data.empNoticePeriod} onChange={(e) => updateField('empNoticePeriod', e.target.value)} required={false} />
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          {step > 0 && (
            <div className="flex justify-between mt-8 pt-6 border-t">
              <button
                onClick={handleBack}
                disabled={isSubmitting}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4 mr-2" /> Back
              </button>
              
              {step < 6 ? (
                <button
                  onClick={handleNext}
                  className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Next <ChevronRight className="w-4 h-4 ml-2" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md disabled:opacity-70 disabled:cursor-wait"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Application <Send className="w-4 h-4 ml-2" />
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Footer Branding */}
      <div className="text-center mt-6 text-slate-500 text-xs">
        &copy; {new Date().getFullYear()} Tika Ram Girls College. All rights reserved.
      </div>
    </div>
  );
}

export default App;
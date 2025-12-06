import React, { useState } from 'react';
import { ChevronRight, CheckCircle, Download, Mail, Loader2 } from 'lucide-react';
import { INITIAL_DATA, ApplicationData } from './types';
import { Input } from './components/Input';
import { ScoreRow } from './components/ScoreRow';
import { SectionHeader } from './components/SectionHeader';
import { generatePDF } from './services/pdfGenerator';
import { sendApplicationEmail } from './services/emailService';
import { mergePDFs } from './services/pdfMerger';

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

  const handleFileUpload = (field: keyof ApplicationData, e: React.ChangeEvent<HTMLInputElement>, isPdf = false) => {
    const file = e.target.files?.[0];
    if (file) {
      // 2MB for images, 5MB for PDF sections, 50MB for Research (handled by specific check)
      const limit = isPdf ? 50000000 : 2000000; 
      
      if (file.size > limit) {
        alert(`File size too large. Limit is ${isPdf ? '50MB' : '2MB'}. Note: Very large files may fail to email.`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        // For PDFs, we strictly want DataURL to handle in logic
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

    if (currentStep === 4) {
      // Validation for Responsibilities & Committees
      // (Optional validation logic can be added here if needed strictly)
    }

    if (currentStep === 5) {
      // Research Section - Table 2 is largely self-appraisal, maybe not strictly mandatory for every single row
      // But Payment is mandatory
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

  // ... (Render logic similar to before, but with updated steps)

  if (isSuccess) {
    // ... (Success Screen same as before)
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
                   {emailStatus === 'sent' ? 'Sent to Principal & You.' : 'Please email the downloaded PDF manually to principal.trgc@gmail.com'}
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
            {/* Steps & Error Banner */}
          {/* STEP 0: INSTRUCTIONS (Same as before) */}
          {step === 0 && (
             <div className="space-y-6">
              <SectionHeader title="Application Guidelines" subtitle="Please read carefully" />
              <div className="bg-blue-50 p-4 rounded text-sm text-blue-900 mb-4">
                  <strong>New:</strong> You can now upload your supporting documents (PDFs) directly in the form. They will be merged into a single file. 
                  <br/>Max file size for documents: <strong>5MB</strong> (50MB for Research). 
                  <br/>Total attachment size should be kept reasonable for email delivery.
              </div>
              
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

               <div className="mt-8 flex items-start space-x-3 p-4 border-2 border-slate-200 rounded-lg bg-white hover:border-blue-300 transition-colors cursor-pointer" onClick={() => setIsStartInstructionsRead(!isStartInstructionsRead)}>
                <div className="flex h-5 items-center">
                  <input type="checkbox" className="h-4 w-4 rounded cursor-pointer" checked={isStartInstructionsRead} onChange={(e) => setIsStartInstructionsRead(e.target.checked)} />
                </div>
                <div className="text-sm">
                  <label className="font-medium text-gray-800 cursor-pointer select-none">I have read the instructions.</label>
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <button onClick={handleNext} disabled={!isStartInstructionsRead} className={`flex items-center px-6 py-3 rounded-lg text-white font-medium ${isStartInstructionsRead ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'}`}>
                  Proceed <ChevronRight className="w-5 h-5 ml-2" />
                </button>
              </div>
             </div>
          )}

          {/* STEP 1: Personal Info (Same fields) */}
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
                  <label className="block text-sm font-semibold mb-2">Upload Photograph *</label>
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
                    <label className="block text-sm font-medium text-slate-700 mb-2">Upload Academic Documents (PDF, Max 5MB)</label>
                    <input type="file" accept="application/pdf" onChange={(e) => handleFileUpload('fileAcademic', e, true)} className="block w-full text-sm"/>
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
                    <label className="block text-sm font-medium text-slate-700 mb-2">Upload Teaching Exp Documents (PDF, Max 5MB)</label>
                    <input type="file" accept="application/pdf" onChange={(e) => handleFileUpload('fileTeaching', e, true)} className="block w-full text-sm"/>
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
                    <label className="block text-sm font-medium text-slate-700 mb-2">Upload Admin/Committee Documents (PDF, Max 5MB)</label>
                    <input type="file" accept="application/pdf" onChange={(e) => handleFileUpload('fileAdmin', e, true)} className="block w-full text-sm"/>
                </div>
             </div>
          )}

          {/* STEP 5: III. Research (Full Table 2) */}
          {step === 5 && (
             <div>
               <SectionHeader title="III. Academic/Research Score (Table 2)" />
               <div className="overflow-x-auto mb-6">
                 <table className="w-full text-left border-collapse border text-sm">
                   <thead>
                     <tr className="bg-slate-100"><th className="border p-2 w-10">SN</th><th className="border p-2">Activity</th><th className="border p-2 w-24">Cap</th><th className="border p-2 w-24">Self Score</th></tr>
                   </thead>
                   <tbody>
                      {/* 1. Papers */}
                      <ScoreRow sNo="1." particulars="Research Papers in Peer-reviewed/UGC Journals" marksCriteria="8 / 10" value={data.research.resPapers} onChange={(v) => updateResearch('resPapers', v)} labelClass="font-bold" />
                      
                      {/* 2. Publications */}
                      <tr><td colSpan={4} className="bg-slate-50 border p-2 font-bold">2. Publications (other than Research papers)</td></tr>
                      <ScoreRow sNo="" particulars="(a) Books authored: International Publishers" marksCriteria="12" value={data.research.resBooksInt} onChange={(v) => updateResearch('resBooksInt', v)} />
                      <ScoreRow sNo="" particulars="National Publishers" marksCriteria="10" value={data.research.resBooksNat} onChange={(v) => updateResearch('resBooksNat', v)} />
                      <ScoreRow sNo="" particulars="Chapter in Edited Book" marksCriteria="05" value={data.research.resChapter} onChange={(v) => updateResearch('resChapter', v)} />
                      <ScoreRow sNo="" particulars="Editor of Book by International" marksCriteria="10" value={data.research.resEditorInt} onChange={(v) => updateResearch('resEditorInt', v)} />
                      <ScoreRow sNo="" particulars="Editor of Book by National" marksCriteria="08" value={data.research.resEditorNat} onChange={(v) => updateResearch('resEditorNat', v)} />
                      
                      <ScoreRow sNo="" particulars="(b) Translation works: Chapter/Paper" marksCriteria="03" value={data.research.resTransChapter} onChange={(v) => updateResearch('resTransChapter', v)} />
                      <ScoreRow sNo="" particulars="Translation: Book" marksCriteria="08" value={data.research.resTransBook} onChange={(v) => updateResearch('resTransBook', v)} />

                      {/* 3. ICT */}
                      <tr><td colSpan={4} className="bg-slate-50 border p-2 font-bold">3. Creation of ICT mediated Teaching Learning pedagogy</td></tr>
                      <ScoreRow sNo="" particulars="(a) Dev of Innovative pedagogy" marksCriteria="05" value={data.research.resIctPedagogy} onChange={(v) => updateResearch('resIctPedagogy', v)} />
                      <ScoreRow sNo="" particulars="(b) Design of new curricula" marksCriteria="02/curr" value={data.research.resIctCurricula} onChange={(v) => updateResearch('resIctCurricula', v)} />
                      <ScoreRow sNo="" particulars="(c) MOOCs (4 quadrants)" marksCriteria="20" value={data.research.resMoocs4Quad} onChange={(v) => updateResearch('resMoocs4Quad', v)} />
                      <ScoreRow sNo="" particulars="MOOCs per module" marksCriteria="05" value={data.research.resMoocsModule} onChange={(v) => updateResearch('resMoocsModule', v)} />
                      <ScoreRow sNo="" particulars="Content writer for MOOCs" marksCriteria="02" value={data.research.resMoocsContent} onChange={(v) => updateResearch('resMoocsContent', v)} />
                      <ScoreRow sNo="" particulars="Course Coordinator MOOCs" marksCriteria="08" value={data.research.resMoocsCoord} onChange={(v) => updateResearch('resMoocsCoord', v)} />
                      
                      <ScoreRow sNo="" particulars="(d) E-Content (Complete Course)" marksCriteria="12" value={data.research.resEcontentComplete} onChange={(v) => updateResearch('resEcontentComplete', v)} />
                      <ScoreRow sNo="" particulars="E-Content (Per Module)" marksCriteria="05" value={data.research.resEcontentModule} onChange={(v) => updateResearch('resEcontentModule', v)} />
                      <ScoreRow sNo="" particulars="Contribution to E-Content" marksCriteria="02" value={data.research.resEcontentContrib} onChange={(v) => updateResearch('resEcontentContrib', v)} />
                      <ScoreRow sNo="" particulars="Editor of E-Content" marksCriteria="10" value={data.research.resEcontentEditor} onChange={(v) => updateResearch('resEcontentEditor', v)} />

                      {/* 4. Guidance */}
                      <tr><td colSpan={4} className="bg-slate-50 border p-2 font-bold">4. Research Guidance & Projects</td></tr>
                      <ScoreRow sNo="" particulars="(a) Ph.D." marksCriteria="10/5" value={data.research.resPhd} onChange={(v) => updateResearch('resPhd', v)} />
                      <ScoreRow sNo="" particulars="M.Phil./P.G" marksCriteria="02" value={data.research.resMphil} onChange={(v) => updateResearch('resMphil', v)} />
                      <ScoreRow sNo="" particulars="(b) Projects Completed > 10L" marksCriteria="10" value={data.research.resProjMore10} onChange={(v) => updateResearch('resProjMore10', v)} />
                      <ScoreRow sNo="" particulars="Projects Completed < 10L" marksCriteria="05" value={data.research.resProjLess10} onChange={(v) => updateResearch('resProjLess10', v)} />
                      <ScoreRow sNo="" particulars="(c) Projects Ongoing > 10L" marksCriteria="05" value={data.research.resProjOngoingMore10} onChange={(v) => updateResearch('resProjOngoingMore10', v)} />
                      <ScoreRow sNo="" particulars="Projects Ongoing < 10L" marksCriteria="02" value={data.research.resProjOngoingLess10} onChange={(v) => updateResearch('resProjOngoingLess10', v)} />
                      <ScoreRow sNo="" particulars="(d) Consultancy" marksCriteria="03" value={data.research.resConsultancy} onChange={(v) => updateResearch('resConsultancy', v)} />

                      {/* 5. Patents */}
                      <tr><td colSpan={4} className="bg-slate-50 border p-2 font-bold">5. Patents & Policy</td></tr>
                      <ScoreRow sNo="" particulars="(a) Patents (International)" marksCriteria="10" value={data.research.resPatentInt} onChange={(v) => updateResearch('resPatentInt', v)} />
                      <ScoreRow sNo="" particulars="Patents (National)" marksCriteria="07" value={data.research.resPatentNat} onChange={(v) => updateResearch('resPatentNat', v)} />
                      <ScoreRow sNo="" particulars="(b) Policy (International)" marksCriteria="10" value={data.research.resPolicyInt} onChange={(v) => updateResearch('resPolicyInt', v)} />
                      <ScoreRow sNo="" particulars="Policy (National)" marksCriteria="07" value={data.research.resPolicyNat} onChange={(v) => updateResearch('resPolicyNat', v)} />
                      <ScoreRow sNo="" particulars="Policy (State)" marksCriteria="04" value={data.research.resPolicyState} onChange={(v) => updateResearch('resPolicyState', v)} />
                      <ScoreRow sNo="" particulars="(c) Awards (International)" marksCriteria="07" value={data.research.resAwardInt} onChange={(v) => updateResearch('resAwardInt', v)} />
                      <ScoreRow sNo="" particulars="Awards (National)" marksCriteria="05" value={data.research.resAwardNat} onChange={(v) => updateResearch('resAwardNat', v)} />

                      {/* 6. Invited */}
                      <tr><td colSpan={4} className="bg-slate-50 border p-2 font-bold">6. Invited Lectures / Papers</td></tr>
                      <ScoreRow sNo="" particulars="International (Abroad)" marksCriteria="07" value={data.research.resInvitedIntAbroad} onChange={(v) => updateResearch('resInvitedIntAbroad', v)} />
                      <ScoreRow sNo="" particulars="International (Within Country)" marksCriteria="05" value={data.research.resInvitedIntWithin} onChange={(v) => updateResearch('resInvitedIntWithin', v)} />
                      <ScoreRow sNo="" particulars="National" marksCriteria="03" value={data.research.resInvitedNat} onChange={(v) => updateResearch('resInvitedNat', v)} />
                      <ScoreRow sNo="" particulars="State/University" marksCriteria="02" value={data.research.resInvitedState} onChange={(v) => updateResearch('resInvitedState', v)} />
                   </tbody>
                 </table>
               </div>
               
               <div className="bg-slate-50 p-4 rounded border border-dashed border-slate-300 mb-8">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Upload Research Documents (PDF, Max 50MB)</label>
                    <input type="file" accept="application/pdf" onChange={(e) => handleFileUpload('fileResearch', e, true)} className="block w-full text-sm"/>
                    {data.fileResearch && <span className="text-xs text-green-600 flex items-center mt-1"><CheckCircle className="w-3 h-3 mr-1"/> File Selected</span>}
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
                    <label className="block text-sm font-medium text-slate-700 mb-2">Upload NOC Document (PDF)</label>
                    <input type="file" accept="application/pdf" onChange={(e) => handleFileUpload('fileNOC', e, true)} className="block w-full text-sm"/>
                </div>
               </div>
            </div>
          )}

          {/* Navigation Buttons (Same as before) */}
           {step > 0 && (
            <div className="flex justify-between mt-8 pt-6 border-t">
              <button onClick={handleBack} disabled={isSubmitting} className="px-4 py-2 border rounded hover:bg-slate-50">Back</button>
              {step < 6 ? (
                <button onClick={handleNext} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Next</button>
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
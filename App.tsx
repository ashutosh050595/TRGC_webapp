import React, { useState } from 'react';
import { Upload, ChevronRight, ChevronLeft, CheckCircle, FileText, Send, AlertCircle, Download, Mail, Loader2 } from 'lucide-react';
import { INITIAL_DATA, ApplicationData } from './types';
import { Input } from './components/Input';
import { ScoreRow } from './components/ScoreRow';
import { SectionHeader } from './components/SectionHeader';
import { generatePDF } from './services/pdfGenerator';
import { sendApplicationEmail } from './services/emailService';

function App() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<ApplicationData>(INITIAL_DATA);
  const [errors, setErrors] = useState<Partial<Record<keyof ApplicationData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');

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
      requireField('contactNo1');
      requireField('permanentAddress');
      requireField('correspondenceAddress');
      requireField('presentEmployer', "Enter N/A if not applicable");
      requireField('photo', "Photograph is required");
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

  const handleSubmit = async () => {
    if (!validateStep(6)) return;

    setIsSubmitting(true);
    setEmailStatus('sending');

    try {
      // 1. Generate PDF (returns pure base64 for API)
      const { base64: pdfBase64 } = generatePDF(data, true); // true = triggers download for user
      
      // 2. Send Data + PDF to Google Script
      const emailResult = await sendApplicationEmail(data, pdfBase64);
      
      if (emailResult.success) {
        setEmailStatus('sent');
      } else {
        console.warn("Email/DB failed:", emailResult.message);
        setEmailStatus('failed');
      }
      
      // 3. Show Success Screen
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

  const renderStepIndicator = () => (
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
                  A copy of your Application Form (PDF) has been downloaded to your device.
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
                <AlertCircle className="text-red-500 mr-2" size={20} />
                <p className="text-red-700 font-medium">Please fix the highlighted errors before proceeding.</p>
              </div>
            </div>
          )}

          {/* Step 1: Personal Info */}
          {step === 1 && (
            <div className="animate-fade-in">
              <SectionHeader title="Personal Information" subtitle="All fields are mandatory" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Post Applied For" value={data.postAppliedFor} onChange={(e) => updateField('postAppliedFor', e.target.value)} error={errors.postAppliedFor} />
                <Input label="Category" value={data.category} onChange={(e) => updateField('category', e.target.value)} error={errors.category} />
                <Input label="Advertisement Reference" className="md:col-span-2" value={data.advertisementRef} onChange={(e) => updateField('advertisementRef', e.target.value)} error={errors.advertisementRef} />
                
                <div className="md:col-span-2 border-t my-4 pt-4">
                  <h3 className="font-semibold text-gray-700 mb-4">Biodata Details</h3>
                </div>

                <Input label="Full Name" value={data.name} onChange={(e) => updateField('name', e.target.value)} error={errors.name} />
                <Input label="Father's Name" value={data.fatherName} onChange={(e) => updateField('fatherName', e.target.value)} error={errors.fatherName} />
                <Input label="Date of Birth" type="date" value={data.dob} onChange={(e) => updateField('dob', e.target.value)} error={errors.dob} />
                <Input label="Email Address" type="email" value={data.email} onChange={(e) => updateField('email', e.target.value)} error={errors.email} />
                <Input label="Contact No. (1)" type="tel" value={data.contactNo1} onChange={(e) => updateField('contactNo1', e.target.value)} error={errors.contactNo1} />
                <Input label="Contact No. (2)" type="tel" value={data.contactNo2} onChange={(e) => updateField('contactNo2', e.target.value)} helperText="Optional" />
                
                <Input label="Permanent Address" className="md:col-span-2" value={data.permanentAddress} onChange={(e) => updateField('permanentAddress', e.target.value)} error={errors.permanentAddress} />
                <Input label="Correspondence Address" className="md:col-span-2" value={data.correspondenceAddress} onChange={(e) => updateField('correspondenceAddress', e.target.value)} error={errors.correspondenceAddress} />
                
                <Input label="Present Employer" className="md:col-span-2" value={data.presentEmployer} onChange={(e) => updateField('presentEmployer', e.target.value)} error={errors.presentEmployer} helperText="Type 'N/A' if not applicable" />

                <div className={`md:col-span-2 mt-4 p-4 bg-blue-50 rounded-lg border ${errors.photo ? 'border-red-500 ring-1 ring-red-200' : 'border-blue-100'}`}>
                  <label className="block text-sm font-semibold text-blue-900 mb-2">Upload Photograph <span className="text-red-500">*</span></label>
                  <div className="flex items-center gap-4">
                    <input type="file" accept="image/*" onChange={(e) => handleFileUpload('photo', e)} className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200" />
                    {data.photo && <img src={data.photo} alt="Preview" className="h-16 w-16 object-cover rounded-md border" />}
                  </div>
                  {errors.photo && <p className="text-xs text-red-500 mt-2">{errors.photo}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Academic Record */}
          {step === 2 && (
            <div className="animate-fade-in">
              <SectionHeader title="Academic Record" subtitle="All fields mandatory (Enter 0 if not applicable)" />
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-100 text-gray-700 font-semibold uppercase">
                    <tr>
                      <th className="p-3 w-12">S.No</th>
                      <th className="p-3">Particulars</th>
                      <th className="p-3">Marks Criteria</th>
                      <th className="p-3 w-32 text-right">Self Appraisal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <ScoreRow sNo="1." particulars="Above 55% marks in Master's degree" marksCriteria="0.5 marks for each % (max 5 marks)" value={data.academicMasters} onChange={(v) => updateField('academicMasters', v)} error={!!errors.academicMasters} />
                    <ScoreRow sNo="2." particulars="Above 55% marks in Graduation" marksCriteria="0.4 marks for each % (max 5 marks)" value={data.academicGraduation} onChange={(v) => updateField('academicGraduation', v)} error={!!errors.academicGraduation} />
                    <ScoreRow sNo="3." particulars="Above 55% marks in 10+2/Prep." marksCriteria="0.3 marks for each % (max 5 marks)" value={data.academic12th} onChange={(v) => updateField('academic12th', v)} error={!!errors.academic12th} />
                    <ScoreRow sNo="4." particulars="Above 55% marks in Matriculation" marksCriteria="0.2 marks for each % (max 5 marks)" value={data.academicMatric} onChange={(v) => updateField('academicMatric', v)} error={!!errors.academicMatric} />
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Step 3: Experience */}
          {step === 3 && (
            <div className="animate-fade-in">
              <SectionHeader title="Teaching & Admin Experience" subtitle="Enter 0 if not applicable" />
              
              <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-4">A. Teaching Experience (Max 10 marks)</h3>
              <div className="overflow-x-auto mb-8">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-100"><tr><th className="p-3">Particulars</th><th className="p-3">Criteria</th><th className="p-3 w-32 text-right">Marks</th></tr></thead>
                  <tbody>
                    <ScoreRow sNo="1." particulars="Above 15 years teaching experience" marksCriteria="1 mark for each year" value={data.teachingExpAbove15} onChange={(v) => updateField('teachingExpAbove15', v)} error={!!errors.teachingExpAbove15} />
                  </tbody>
                </table>
              </div>

              <h3 className="text-lg font-semibold text-gray-800 mb-2">B. Administrative Responsibilities (Max 25 marks)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-100"><tr><th className="p-3">Particulars</th><th className="p-3">Criteria</th><th className="p-3 w-32 text-right">Marks</th></tr></thead>
                  <tbody>
                    <ScoreRow sNo="1." particulars="Exp. as Joint/Deputy/Assistant Director" marksCriteria="1 mark for each year" value={data.adminJointDirector} onChange={(v) => updateField('adminJointDirector', v)} error={!!errors.adminJointDirector} />
                    <ScoreRow sNo="2." particulars="Exp. as Registrar or Admin post in University" marksCriteria="1 mark for each year" value={data.adminRegistrar} onChange={(v) => updateField('adminRegistrar', v)} error={!!errors.adminRegistrar} />
                    <ScoreRow sNo="3." particulars="Exp. as Head of Higher Edu Inst (Principal/DDO)" marksCriteria="1 mark for each year" value={data.adminHead} onChange={(v) => updateField('adminHead', v)} error={!!errors.adminHead} />
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Step 4: Committees */}
          {step === 4 && (
            <div className="animate-fade-in">
              <SectionHeader title="Key Responsibilities & Committees" subtitle="Enter 0 if not applicable" />
              
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Key Responsibilities in Colleges</h3>
              <div className="overflow-x-auto mb-8 border rounded-lg">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-100"><tr><th className="p-3 w-10">#</th><th className="p-3">Particulars</th><th className="p-3">Criteria</th><th className="p-3 w-28">Marks</th></tr></thead>
                  <tbody className="divide-y">
                    <ScoreRow sNo="1" particulars="Staff Rep / V.C. Nominee" marksCriteria="1 mark/yr (max 3)" value={data.respStaffRep} onChange={(v) => updateField('respStaffRep', v)} error={!!errors.respStaffRep} />
                    <ScoreRow sNo="2" particulars="Coordinator/Secy of Conference" marksCriteria="1 mark/yr (max 3)" value={data.respCoordinator} onChange={(v) => updateField('respCoordinator', v)} error={!!errors.respCoordinator} />
                    <ScoreRow sNo="3" particulars="Bursar" marksCriteria="1 mark/yr (max 3)" value={data.respBursar} onChange={(v) => updateField('respBursar', v)} error={!!errors.respBursar} />
                    <ScoreRow sNo="4" particulars="NSS Programme Officer" marksCriteria="1 mark/yr (max 3)" value={data.respNSS} onChange={(v) => updateField('respNSS', v)} error={!!errors.respNSS} />
                    <ScoreRow sNo="5" particulars="YRC Counsellor" marksCriteria="1 mark/yr (max 3)" value={data.respYRC} onChange={(v) => updateField('respYRC', v)} error={!!errors.respYRC} />
                    <ScoreRow sNo="6" particulars="Hostel Warden" marksCriteria="1 mark/yr (max 3)" value={data.respWarden} onChange={(v) => updateField('respWarden', v)} error={!!errors.respWarden} />
                    <ScoreRow sNo="7" particulars="Member of Statutory Body" marksCriteria="1 mark/yr (max 2)" value={data.respStatutory} onChange={(v) => updateField('respStatutory', v)} error={!!errors.respStatutory} />
                    <ScoreRow sNo="8" particulars="Associate NCC Officer" marksCriteria="1 mark/yr (max 3)" value={data.respNCC} onChange={(v) => updateField('respNCC', v)} error={!!errors.respNCC} />
                  </tbody>
                </table>
              </div>

              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Committees in College</h3>
              <div className="overflow-x-auto border rounded-lg max-h-96 overflow-y-auto scrollbar-thin">
                <table className="w-full text-left text-sm">
                   <thead className="bg-gray-100 sticky top-0"><tr><th className="p-3 w-10">#</th><th className="p-3">Particulars</th><th className="p-3">Criteria</th><th className="p-3 w-28">Marks</th></tr></thead>
                   <tbody className="divide-y">
                    <ScoreRow sNo="1" particulars="Co-ordinator IQAC" marksCriteria="1 mark/yr (max 2)" value={data.commIQAC} onChange={(v) => updateField('commIQAC', v)} error={!!errors.commIQAC} />
                    <ScoreRow sNo="2" particulars="Editor in Chief, Magazine" marksCriteria="1 mark/yr (max 2)" value={data.commEditor} onChange={(v) => updateField('commEditor', v)} error={!!errors.commEditor} />
                    <ScoreRow sNo="3" particulars="Member, Advisory Council" marksCriteria="1 mark/yr (max 2)" value={data.commAdvisory} onChange={(v) => updateField('commAdvisory', v)} error={!!errors.commAdvisory} />
                    <ScoreRow sNo="4" particulars="Convener, Work Committee" marksCriteria="1 mark/yr (max 2)" value={data.commWork} onChange={(v) => updateField('commWork', v)} error={!!errors.commWork} />
                    <ScoreRow sNo="5" particulars="Convener, Cultural Affairs" marksCriteria="1 mark/yr (max 2)" value={data.commCultural} onChange={(v) => updateField('commCultural', v)} error={!!errors.commCultural} />
                    <ScoreRow sNo="6" particulars="Convener, Purchase/Procurement" marksCriteria="1 mark/yr (max 2)" value={data.commPurchase} onChange={(v) => updateField('commPurchase', v)} error={!!errors.commPurchase} />
                    <ScoreRow sNo="7" particulars="Convener, Building/Works" marksCriteria="1 mark/yr (max 2)" value={data.commBuilding} onChange={(v) => updateField('commBuilding', v)} error={!!errors.commBuilding} />
                    <ScoreRow sNo="8" particulars="Convener, Sports" marksCriteria="1 mark/yr (max 2)" value={data.commSports} onChange={(v) => updateField('commSports', v)} error={!!errors.commSports} />
                    <ScoreRow sNo="9" particulars="Convener, Discipline" marksCriteria="1 mark/yr (max 2)" value={data.commDiscipline} onChange={(v) => updateField('commDiscipline', v)} error={!!errors.commDiscipline} />
                    <ScoreRow sNo="10" particulars="Convener, Internal Complaint" marksCriteria="1 mark/yr (max 2)" value={data.commInternal} onChange={(v) => updateField('commInternal', v)} error={!!errors.commInternal} />
                    <ScoreRow sNo="11" particulars="Convener, Road Safety" marksCriteria="1 mark/yr (max 2)" value={data.commRoadSafety} onChange={(v) => updateField('commRoadSafety', v)} error={!!errors.commRoadSafety} />
                    <ScoreRow sNo="12" particulars="Convener, Red Ribbon" marksCriteria="1 mark/yr (max 2)" value={data.commRedRibbon} onChange={(v) => updateField('commRedRibbon', v)} error={!!errors.commRedRibbon} />
                    <ScoreRow sNo="13" particulars="Convener, Eco Club" marksCriteria="1 mark/yr (max 2)" value={data.commEco} onChange={(v) => updateField('commEco', v)} error={!!errors.commEco} />
                    <ScoreRow sNo="14" particulars="In-charge, Placement Cell" marksCriteria="1 mark/yr (max 2)" value={data.commPlacement} onChange={(v) => updateField('commPlacement', v)} error={!!errors.commPlacement} />
                    <ScoreRow sNo="15" particulars="Incharge, Women Cell" marksCriteria="1 mark/yr (max 2)" value={data.commWomen} onChange={(v) => updateField('commWomen', v)} error={!!errors.commWomen} />
                    <ScoreRow sNo="16" particulars="In-charge, Time-table" marksCriteria="1 mark/yr (max 2)" value={data.commTimeTable} onChange={(v) => updateField('commTimeTable', v)} error={!!errors.commTimeTable} />
                    <ScoreRow sNo="17" particulars="In-charge, SC/BC" marksCriteria="1 mark/yr (max 2)" value={data.commSCBC} onChange={(v) => updateField('commSCBC', v)} error={!!errors.commSCBC} />
                   </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Step 5: Research & Payment */}
          {step === 5 && (
            <div className="animate-fade-in">
              <SectionHeader title="Research Score & Payment" subtitle="Final Scoring" />
              
              <div className="mb-8">
                <h3 className="font-semibold text-gray-700 mb-2">III. Academic/Research Score (Max 32.5 marks)</h3>
                <ScoreRow sNo="1" particulars="Research Score above 110 (See Appendix II, Table 2)" marksCriteria="0.3 marks for each 1 Research Score above 110" value={data.researchScore} onChange={(v) => updateField('researchScore', v)} error={!!errors.researchScore} />
                <p className="text-xs text-gray-500 mt-2 p-2 bg-yellow-50 border border-yellow-100 rounded">
                  ** Attach copies as proof of documents for your calculated API score according to Annexure.
                </p>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-700 mb-4">Bank Transaction Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="UTR No." value={data.utrNo} onChange={(e) => updateField('utrNo', e.target.value)} error={errors.utrNo} placeholder="e.g. UTR123456789" />
                  <Input label="Dated" type="date" value={data.draftDate} onChange={(e) => updateField('draftDate', e.target.value)} error={errors.draftDate} />
                  <Input label="Amount" type="number" value={data.draftAmount} onChange={(e) => updateField('draftAmount', e.target.value)} error={errors.draftAmount} />
                  <Input label="Name of Bank" value={data.bankName} onChange={(e) => updateField('bankName', e.target.value)} error={errors.bankName} />
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Declaration */}
          {step === 6 && (
            <div className="animate-fade-in">
              <SectionHeader title="Declaration & Signature" subtitle="Final Submission" />
              
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-sm leading-relaxed text-gray-700 mb-8">
                <div className="flex flex-wrap gap-2 items-center mb-2">
                  <span>I</span>
                  <span className="font-bold border-b border-gray-400 px-2">{data.name}</span>
                  <div className="flex items-center">
                    <span className="mr-2">D/o S/o W/o <span className="text-red-500">*</span></span>
                    <input 
                      type="text" 
                      placeholder="Parent/Spouse Name" 
                      className={`border-b bg-transparent focus:outline-none px-2 font-bold w-48 ${errors.parentName ? 'border-red-500' : 'border-gray-400'}`}
                      value={data.parentName}
                      onChange={(e) => updateField('parentName', e.target.value)}
                    />
                  </div>
                </div>
                <p>
                  hereby declare that all the entries made by me in this application from are true and correct to the best of my knowledge and I have attached related proof of documents in form of self attested copies. If anything is found false or incorrect at any stage, my candidature/appointment is liable to be cancelled.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <Input label="Place" value={data.place} onChange={(e) => updateField('place', e.target.value)} error={errors.place} />
                  <Input label="Date" type="date" value={data.date} onChange={(e) => updateField('date', e.target.value)} error={errors.date} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Signature <span className="text-red-500">*</span></label>
                  <div className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors ${errors.signature ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}>
                    <Upload className="text-gray-400 mb-2" />
                    <input type="file" accept="image/*" onChange={(e) => handleFileUpload('signature', e)} className="w-full text-sm text-center text-gray-500 file:hidden" />
                    <span className="text-xs text-gray-400 mt-1">Click to upload image</span>
                  </div>
                  {errors.signature && <p className="text-xs text-red-500 mt-1 text-center">{errors.signature}</p>}
                  {data.signature && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">Preview:</p>
                      <img src={data.signature} alt="Signature" className="h-12 object-contain border bg-white" />
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-6 mb-6">
                <SectionHeader title="Certificate From Employer (If Any)" subtitle="Optional" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Employer Name/Org" value={data.empName} onChange={(e) => updateField('empName', e.target.value)} />
                  <Input label="Designation" value={data.empDesignation} onChange={(e) => updateField('empDesignation', e.target.value)} />
                  <Input label="Department" value={data.empDept} onChange={(e) => updateField('empDept', e.target.value)} />
                  <Input label="Notice Period" placeholder="e.g. 1 month" value={data.empNoticePeriod} onChange={(e) => updateField('empNoticePeriod', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex justify-between pt-6 border-t">
            <button
              onClick={() => {
                 setStep(s => Math.max(s - 1, 1));
                 window.scrollTo(0, 0);
              }}
              disabled={step === 1 || isSubmitting}
              className={`flex items-center px-6 py-2 rounded-lg font-medium transition-colors
                ${step === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <ChevronLeft size={20} className="mr-1" /> Back
            </button>

            {step < 6 ? (
              <button
                onClick={handleNext}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
              >
                Next Step <ChevronRight size={20} className="ml-1" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center px-8 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>Processing <Loader2 className="ml-2 animate-spin" size={18} /></>
                ) : (
                  <>Submit Application <Send size={18} className="ml-2" /></>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
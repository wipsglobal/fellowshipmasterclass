import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Loader2, ChevronLeft, ChevronRight, CheckCircle2, Upload, X, FileText, User, GraduationCap, Briefcase, FileSignature, CreditCard, Building } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";

type FormStep = "personal" | "programme" | "academic" | "professional" | "employment" | "eligibility" | "statement" | "referees" | "documents" | "declaration" | "review";

interface AcademicQualification {
  id: string;
  qualification: string;
  discipline: string;
  institution: string;
  yearObtained: string;
}

interface ProfessionalQualification {
  id: string;
  professionalBody: string;
  designation: string;
  yearAdmitted: string;
  membershipStatus: string;
}

interface Employment {
  id: string;
  organization: string;
  positionHeld: string;
  periodFrom: string;
  periodTo: string;
  keyResponsibilities: string;
}

interface Referee {
  id: string;
  refereeName: string;
  positionOrganization: string;
  email: string;
  phoneNumber: string;
}

export default function ApplicationFormNew() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState<FormStep>("personal");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch data
  const { data: cohorts } = trpc.cohorts.list.useQuery();
  const { data: tracks } = trpc.tracks.list.useQuery();
  const createAppMutation = trpc.applications.create.useMutation();

  // Automatically select all tracks when they load
  useEffect(() => {
    if (formData.selectedTracks.length === 0) {
      if (tracks && tracks.length > 0) {
        // If tracks from database exist, select all of them
        const allTrackCodes = tracks.map((track: any) => track.code);
        setFormData((prev) => ({ ...prev, selectedTracks: allTrackCodes }));
      } else {
        // Fallback: select the three default tracks
        setFormData((prev) => ({ ...prev, selectedTracks: ["FIBAKM", "FCBA", "FCKM"] }));
      }
    }
  }, [tracks]);

  // Form state - Section A: Personal Information
  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    title: "",
    titleOther: "",
    dateOfBirth: "",
    gender: "",
    nationality: "",
    countryOfResidence: "",
    contactAddress: "",
    email: user?.email || "",
    mobileNumber: "",
    whatsappNumber: "",
    linkedinProfile: "",
    
    // Section B: Programme Selection
    cohortId: "",
    participationMode: "" as "physical" | "virtual" | "",
    selectedTracks: [] as string[],
    
    // Section C: Academic Qualifications
    highestQualification: "",
    classOfDegree: "",
    
    // Section D: Professional Qualifications
    isIbakmmember: false,
    ibakmmembershipNumber: "",
    
    // Section E: Employment
    totalYearsExperience: "",
    
    // Section F: Eligibility
    eligibilityCategory: "",
    
    // Section G: Statement
    statementOfPurpose: "",
    
    // Section J: Declaration
    declarationAccepted: false,
    dataConsentAccepted: false,
    confirmationAccepted: false,
    updatesAccepted: false,
  });

  // Dynamic arrays
  const [academicQualifications, setAcademicQualifications] = useState<AcademicQualification[]>([
    { id: "1", qualification: "", discipline: "", institution: "", yearObtained: "" }
  ]);

  const [professionalQualifications, setProfessionalQualifications] = useState<ProfessionalQualification[]>([
    { id: "1", professionalBody: "", designation: "", yearAdmitted: "", membershipStatus: "" }
  ]);

  const [employmentHistory, setEmploymentHistory] = useState<Employment[]>([
    { id: "1", organization: "", positionHeld: "", periodFrom: "", periodTo: "", keyResponsibilities: "" }
  ]);

  const [referees, setReferees] = useState<Referee[]>([
    { id: "1", refereeName: "", positionOrganization: "", email: "", phoneNumber: "" },
    { id: "2", refereeName: "", positionOrganization: "", email: "", phoneNumber: "" }
  ]);

  // Document uploads state
  const [uploadedDocuments, setUploadedDocuments] = useState<{
    academic: File | null;
    professional: File | null;
    cv: File | null;
    photo: File | null;
    id: File | null;
  }>({
    academic: null,
    professional: null,
    cv: null,
    photo: null,
    id: null,
  });

  // Track uploaded document metadata (Google Drive links)
  const [uploadedToCloud, setUploadedToCloud] = useState<{
    academic: { fileId: string; webViewLink: string } | null;
    professional: { fileId: string; webViewLink: string } | null;
    cv: { fileId: string; webViewLink: string } | null;
    photo: { fileId: string; webViewLink: string } | null;
    id: { fileId: string; webViewLink: string } | null;
  }>({
    academic: null,
    professional: null,
    cv: null,
    photo: null,
    id: null,
  });

  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const uploadDocumentMutation = trpc.documents.upload.useMutation();

  const handleFileUpload = async (documentType: keyof typeof uploadedDocuments, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (2MB = 2 * 1024 * 1024 bytes)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File size must be less than 2MB");
      return;
    }
    
    // Validate file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      toast.error("File must be PDF or JPEG/PNG format");
      return;
    }
    
    // Store file locally first
    setUploadedDocuments((prev) => ({ ...prev, [documentType]: file }));
    
    // Map document type to API enum
    const docTypeMap: Record<string, string> = {
      academic: "academic_certificate",
      professional: "professional_certificate",
      cv: "cv",
      photo: "passport_photo",
      id: "identification",
    };

    try {
      setUploadingDoc(documentType);
      toast.loading(`Uploading ${file.name} to Google Drive...`, { id: documentType });

      // Convert file to base64
      const fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Upload to Google Drive via tRPC (will need applicationId when submitting)
      // For now, just show success - actual upload will happen on form submission
      toast.success(`${file.name} ready to upload`, { id: documentType });
      
    } catch (error) {
      console.error("File upload error:", error);
      toast.error("Failed to prepare file for upload", { id: documentType });
      setUploadedDocuments((prev) => ({ ...prev, [documentType]: null }));
    } finally {
      setUploadingDoc(null);
    }
  };

  const removeDocument = (documentType: keyof typeof uploadedDocuments) => {
    setUploadedDocuments((prev) => ({ ...prev, [documentType]: null }));
    toast.info("Document removed");
  };

  const handleTrackToggle = (trackCode: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedTracks: prev.selectedTracks.includes(trackCode)
        ? prev.selectedTracks.filter((t) => t !== trackCode)
        : [...prev.selectedTracks, trackCode],
    }));
  };

  const addAcademicQualification = () => {
    setAcademicQualifications([...academicQualifications, {
      id: Date.now().toString(),
      qualification: "",
      discipline: "",
      institution: "",
      yearObtained: ""
    }]);
  };

  const removeAcademicQualification = (id: string) => {
    if (academicQualifications.length > 1) {
      setAcademicQualifications(academicQualifications.filter(q => q.id !== id));
    }
  };

  const updateAcademicQualification = (id: string, field: string, value: string) => {
    setAcademicQualifications(academicQualifications.map(q =>
      q.id === id ? { ...q, [field]: value } : q
    ));
  };

  const addProfessionalQualification = () => {
    setProfessionalQualifications([...professionalQualifications, {
      id: Date.now().toString(),
      professionalBody: "",
      designation: "",
      yearAdmitted: "",
      membershipStatus: ""
    }]);
  };

  const removeProfessionalQualification = (id: string) => {
    if (professionalQualifications.length > 1) {
      setProfessionalQualifications(professionalQualifications.filter(q => q.id !== id));
    }
  };

  const updateProfessionalQualification = (id: string, field: string, value: string) => {
    setProfessionalQualifications(professionalQualifications.map(q =>
      q.id === id ? { ...q, [field]: value } : q
    ));
  };

  const addEmployment = () => {
    setEmploymentHistory([...employmentHistory, {
      id: Date.now().toString(),
      organization: "",
      positionHeld: "",
      periodFrom: "",
      periodTo: "",
      keyResponsibilities: ""
    }]);
  };

  const removeEmployment = (id: string) => {
    if (employmentHistory.length > 1) {
      setEmploymentHistory(employmentHistory.filter(e => e.id !== id));
    }
  };

  const updateEmployment = (id: string, field: string, value: string) => {
    setEmploymentHistory(employmentHistory.map(e =>
      e.id === id ? { ...e, [field]: value } : e
    ));
  };

  const updateReferee = (id: string, field: string, value: string) => {
    setReferees(referees.map(r =>
      r.id === id ? { ...r, [field]: value } : r
    ));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.fullName || !formData.email || !formData.mobileNumber) {
      toast.error("Please fill in all required personal information");
      return;
    }

    if (!formData.cohortId || !formData.selectedTracks.length) {
      toast.error("Please select cohort and at least one track");
      return;
    }

    if (formData.statementOfPurpose.length < 250) {
      toast.error("Statement of purpose must be at least 250 characters");
      return;
    }

    if (!formData.declarationAccepted || !formData.dataConsentAccepted) {
      toast.error("Please accept the declaration and data consent");
      return;
    }

    setIsSubmitting(true);
    try {
      // Step 1: Create the application as draft with all data
      const result = await createAppMutation.mutateAsync({
        // Basic info
        cohortId: parseInt(formData.cohortId),
        fullName: formData.fullName,
        email: formData.email,
        mobileNumber: formData.mobileNumber,
        
        // Personal details
        title: formData.title || undefined,
        titleOther: formData.titleOther || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        gender: formData.gender as "male" | "female" | "other" | undefined,
        nationality: formData.nationality || undefined,
        countryOfResidence: formData.countryOfResidence || undefined,
        contactAddress: formData.contactAddress || undefined,
        whatsappNumber: formData.whatsappNumber || undefined,
        linkedinProfile: formData.linkedinProfile || undefined,
        
        // Programme
        participationMode: formData.participationMode as "physical" | "virtual",
        selectedTracks: formData.selectedTracks,
        
        // Academic
        highestQualification: formData.highestQualification || undefined,
        classOfDegree: formData.classOfDegree || undefined,
        
        // Professional
        isIbakmmember: formData.isIbakmmember,
        ibakmmembershipNumber: formData.ibakmmembershipNumber || undefined,
        
        // Employment
        totalYearsExperience: formData.totalYearsExperience ? parseInt(formData.totalYearsExperience) : undefined,
        
        // Eligibility & Statement
        eligibilityCategory: formData.eligibilityCategory,
        statementOfPurpose: formData.statementOfPurpose,
        
        // Declaration
        declarationAccepted: formData.declarationAccepted,
        dataConsentAccepted: formData.dataConsentAccepted,
        
        // Related data arrays
        academicQualifications: academicQualifications
          .filter(aq => aq.qualification && aq.institution)
          .map(aq => ({
            qualification: aq.qualification,
            discipline: aq.discipline,
            institution: aq.institution,
            yearObtained: parseInt(aq.yearObtained) || new Date().getFullYear(),
          })),
        
        professionalQualifications: professionalQualifications
          .filter(pq => pq.professionalBody && pq.designation)
          .map(pq => ({
            professionalBody: pq.professionalBody,
            designation: pq.designation,
            yearAdmitted: parseInt(pq.yearAdmitted) || new Date().getFullYear(),
            membershipStatus: pq.membershipStatus,
          })),
        
        employmentHistory: employmentHistory
          .filter(eh => eh.organization && eh.positionHeld)
          .map(eh => ({
            organization: eh.organization,
            positionHeld: eh.positionHeld,
            periodFrom: eh.periodFrom,
            periodTo: eh.periodTo,
            keyResponsibilities: eh.keyResponsibilities || '',
          })),
        
        referees: referees
          .filter(ref => ref.refereeName && ref.email)
          .map(ref => ({
            refereeName: ref.refereeName,
            positionOrganization: ref.positionOrganization,
            email: ref.email,
            phoneNumber: ref.phoneNumber,
          })),
      });

      // Store application ID and documents for later upload after payment
      // Use sessionStorage instead of localStorage (auto-clears when tab closes)
      sessionStorage.setItem('pendingApplicationId', result.id.toString());
      sessionStorage.setItem('pendingTimestamp', Date.now().toString());
      
      const documentsToUpload = Object.entries(uploadedDocuments)
        .filter(([_, file]) => file !== null)
        .map(([key, file]) => ({
          key,
          name: file!.name,
          type: file!.type,
          size: file!.size,
        }));
      sessionStorage.setItem('pendingDocuments', JSON.stringify(documentsToUpload));
      
      // Store file objects temporarily as base64 in sessionStorage
      const docTypeMap: Record<string, string> = {
        academic: "academic_certificate",
        professional: "professional_certificate",
        cv: "cv",
        photo: "passport_photo",
        id: "identification",
      };
      
      for (const [key, file] of Object.entries(uploadedDocuments)) {
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            sessionStorage.setItem(`pendingFile_${key}`, JSON.stringify({
              base64,
              name: file.name,
              type: file.type,
              size: file.size,
              docType: docTypeMap[key]
            }));
          };
          reader.readAsDataURL(file);
        }
      }

      toast.success("Application saved! Proceeding to payment...");
      
      // Step 2: Redirect to payment page which will handle the payment flow
      navigate(`/application/${result.id}`);
    } catch (error) {
      toast.error("Failed to submit application");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps: { id: FormStep; label: string; icon: any }[] = [
    { id: "personal", label: "Personal Info", icon: User },
    { id: "programme", label: "Programme", icon: Building },
    { id: "academic", label: "Academic", icon: GraduationCap },
    { id: "professional", label: "Professional", icon: Briefcase },
    { id: "employment", label: "Employment", icon: Briefcase },
    { id: "eligibility", label: "Eligibility", icon: CheckCircle2 },
    { id: "statement", label: "Statement", icon: FileText },
    { id: "referees", label: "Referees", icon: User },
    { id: "documents", label: "Documents", icon: Upload },
    { id: "declaration", label: "Declaration", icon: FileSignature },
    { id: "review", label: "Review", icon: CheckCircle2 },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Fellowship Certification Application</h1>
              <p className="text-slate-600 mt-1">Institute of Business Administration and Knowledge Management (IBAKM®)</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Step {currentStepIndex + 1} of {steps.length}</p>
              <p className="text-xs text-slate-400">Application in progress</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4">
          <div className="relative">
            <div className="overflow-x-auto">
              <div className="flex items-center py-4 min-w-max">
                {steps.map((step, index) => {
                  const StepIcon = step.icon;
                  const isActive = currentStep === step.id;
                  const isCompleted = index < currentStepIndex;
                  
                  return (
                    <div key={step.id} className="flex items-center">
                      <button
                        onClick={() => setCurrentStep(step.id)}
                        className={`flex flex-col items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                          isActive
                            ? "bg-blue-600 text-white scale-105"
                            : isCompleted
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isActive ? "bg-white/20" : isCompleted ? "bg-green-500/20" : "bg-slate-200"
                        }`}>
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <StepIcon className="w-5 h-5" />
                          )}
                        </div>
                        <span className="text-xs font-medium whitespace-nowrap">{step.label}</span>
                      </button>
                      {index < steps.length - 1 && (
                        <div className={`w-12 h-1 mx-1 ${
                          index < currentStepIndex ? "bg-green-500" : "bg-slate-200"
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto shadow-lg border-slate-200">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
            <CardTitle className="text-2xl flex items-center gap-2">
              {steps[currentStepIndex].icon && (() => {
                const Icon = steps[currentStepIndex].icon;
                return <Icon className="w-6 h-6 text-blue-600" />;
              })()}
              SECTION {String.fromCharCode(65 + currentStepIndex)}: {steps[currentStepIndex].label.toUpperCase()}
            </CardTitle>
            <CardDescription className="text-base">
              {currentStep === "personal" && "Provide your personal and contact information"}
              {currentStep === "programme" && "Select your cohort and fellowship tracks"}
              {currentStep === "academic" && "List your academic qualifications"}
              {currentStep === "professional" && "Provide professional certifications and memberships"}
              {currentStep === "employment" && "Detail your career history and experience"}
              {currentStep === "eligibility" && "Select your eligibility category"}
              {currentStep === "statement" && "Share your professional profile and goals"}
              {currentStep === "referees" && "Provide professional or academic referees"}
              {currentStep === "documents" && "Upload supporting documents"}
              {currentStep === "declaration" && "Read and accept the terms"}
              {currentStep === "review" && "Review your application before submission"}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* SECTION A: Personal Information */}
            {currentStep === "personal" && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800 font-medium">
                    <User className="w-4 h-4 inline mr-2" />
                    All fields marked with * are required
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="fullName" className="text-base font-semibold">
                      1. Full Name (as to appear on certificate) *
                    </Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange("fullName", e.target.value)}
                      placeholder="Enter your full legal name"
                      className="mt-2"
                    />
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-base font-semibold">2. Title *</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                      {["Dr", "Prof", "Mr", "Mrs", "Ms", "Engr"].map((title) => (
                        <div key={title} className="flex items-center space-x-2">
                          <RadioGroup value={formData.title} onValueChange={(v) => handleInputChange("title", v)}>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value={title} id={`title-${title}`} />
                              <Label htmlFor={`title-${title}`} className="cursor-pointer">{title}.</Label>
                            </div>
                          </RadioGroup>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Checkbox
                        id="title-other"
                        checked={formData.title === "Other"}
                        onCheckedChange={(checked: boolean) => {
                          if (checked) handleInputChange("title", "Other");
                        }}
                      />
                      <Label htmlFor="title-other" className="cursor-pointer">Other:</Label>
                      {formData.title === "Other" && (
                        <Input
                          value={formData.titleOther}
                          onChange={(e) => handleInputChange("titleOther", e.target.value)}
                          placeholder="Specify title"
                          className="w-40"
                        />
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dateOfBirth" className="text-base font-semibold">3. Date of Birth *</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label className="text-base font-semibold">4. Gender *</Label>
                      <RadioGroup value={formData.gender} onValueChange={(v) => handleInputChange("gender", v)} className="flex gap-4 mt-2">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="male" id="gender-male" />
                          <Label htmlFor="gender-male" className="cursor-pointer">Male</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="female" id="gender-female" />
                          <Label htmlFor="gender-female" className="cursor-pointer">Female</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="other" id="gender-other" />
                          <Label htmlFor="gender-other" className="cursor-pointer">Other</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nationality" className="text-base font-semibold">5. Nationality *</Label>
                      <Input
                        id="nationality"
                        value={formData.nationality}
                        onChange={(e) => handleInputChange("nationality", e.target.value)}
                        placeholder="Your nationality"
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="countryOfResidence" className="text-base font-semibold">6. Country of Residence *</Label>
                      <Input
                        id="countryOfResidence"
                        value={formData.countryOfResidence}
                        onChange={(e) => handleInputChange("countryOfResidence", e.target.value)}
                        placeholder="Country where you reside"
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label htmlFor="contactAddress" className="text-base font-semibold">
                      7. Contact Address *
                    </Label>
                    <Textarea
                      id="contactAddress"
                      value={formData.contactAddress}
                      onChange={(e) => handleInputChange("contactAddress", e.target.value)}
                      placeholder="Street, City, State, Country, Postal Code"
                      rows={3}
                      className="mt-2"
                    />
                  </div>

                  <Separator />

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email" className="text-base font-semibold">8. Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="your.email@example.com"
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="mobileNumber" className="text-base font-semibold">9. Mobile/WhatsApp Number *</Label>
                      <Input
                        id="mobileNumber"
                        value={formData.mobileNumber}
                        onChange={(e) => handleInputChange("mobileNumber", e.target.value)}
                        placeholder="+234 XXX XXX XXXX"
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label htmlFor="linkedinProfile" className="text-base font-semibold">
                      10. LinkedIn Profile (if available)
                    </Label>
                    <Input
                      id="linkedinProfile"
                      value={formData.linkedinProfile}
                      onChange={(e) => handleInputChange("linkedinProfile", e.target.value)}
                      placeholder="https://linkedin.com/in/yourprofile"
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SECTION B: Programme Selection */}
            {currentStep === "programme" && (
              <div className="space-y-6">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-sm text-purple-800 font-medium">
                    <Building className="w-4 h-4 inline mr-2" />
                    Select your preferred cohort, mode, and fellowship tracks
                  </p>
                </div>

                <div>
                  <Label htmlFor="cohortId" className="text-base font-semibold">1. Selected Cohort *</Label>
                  <p className="text-sm text-slate-600 mb-3">Choose at least one cohort you wish to join</p>
                  <RadioGroup value={formData.cohortId} onValueChange={(v) => handleInputChange("cohortId", v)} className="grid md:grid-cols-2 gap-4 mt-2">
                    {cohorts && cohorts.length > 0 ? (
                      cohorts.map((cohort: any) => (
                        <div key={cohort.id} className="flex items-center space-x-3 p-4 border-2 rounded-lg hover:border-blue-500 cursor-pointer transition-colors">
                          <RadioGroupItem value={cohort.id.toString()} id={`cohort-${cohort.id}`} />
                          <Label htmlFor={`cohort-${cohort.id}`} className="cursor-pointer flex-1 font-medium">
                            {cohort.name} {cohort.year}
                          </Label>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-slate-500">
                        Loading cohorts...
                      </div>
                    )}
                  </RadioGroup>
                </div>

                <Separator />

                <div>
                  <Label className="text-base font-semibold">2. Preferred Mode of Participation *</Label>
                  <RadioGroup value={formData.participationMode} onValueChange={(v) => handleInputChange("participationMode", v)} className="space-y-3 mt-2">
                    <div className="flex items-center space-x-2 p-4 border-2 rounded-lg hover:border-blue-500 cursor-pointer">
                      <RadioGroupItem value="physical" id="mode-physical" />
                      <Label htmlFor="mode-physical" className="cursor-pointer flex-1">
                        <span className="font-semibold">Physical (In-person)</span>
                        <p className="text-sm text-slate-600">Attend sessions at the institute location</p>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-4 border-2 rounded-lg hover:border-blue-500 cursor-pointer">
                      <RadioGroupItem value="virtual" id="mode-virtual" />
                      <Label htmlFor="mode-virtual" className="cursor-pointer flex-1">
                        <span className="font-semibold">Virtual (Online/Hybrid Access)</span>
                        <p className="text-sm text-slate-600">Participate remotely via online platform</p>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <Separator />

                <div>
                  <Label className="text-base font-semibold">3. Programme Track(s) Applying For *</Label>
                  <p className="text-sm text-slate-600 mb-3">Applicants are to select all the tracks</p>
                  <div className="space-y-3">
                    {tracks && tracks.length > 0 ? (
                      tracks.map((track: any) => (
                        <div key={track.id} className="flex items-start gap-3 p-4 border-2 rounded-lg hover:border-blue-500 cursor-pointer">
                          <Checkbox
                            id={track.code}
                            checked={formData.selectedTracks.includes(track.code)}
                            onCheckedChange={() => handleTrackToggle(track.code)}
                            className="mt-1"
                          />
                          <Label htmlFor={track.code} className="cursor-pointer flex-1">
                            <span className="font-semibold text-blue-600">{track.code}</span>
                            <p className="text-sm text-slate-700 mt-1">{track.name}</p>
                            {track.description && (
                              <p className="text-xs text-slate-500 mt-1">{track.description}</p>
                            )}
                          </Label>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="flex items-start gap-3 p-4 border-2 rounded-lg hover:border-blue-500 cursor-pointer">
                          <Checkbox
                            id="FIBAKM"
                            checked={formData.selectedTracks.includes("FIBAKM")}
                            onCheckedChange={() => handleTrackToggle("FIBAKM")}
                            className="mt-1"
                          />
                          <Label htmlFor="FIBAKM" className="cursor-pointer flex-1">
                            <span className="font-semibold text-blue-600">FIBAKM</span>
                            <p className="text-sm text-slate-700 mt-1">Fellow of the Institute of Business Administration and Knowledge Management</p>
                          </Label>
                        </div>
                        <div className="flex items-start gap-3 p-4 border-2 rounded-lg hover:border-blue-500 cursor-pointer">
                          <Checkbox
                            id="FCBA"
                            checked={formData.selectedTracks.includes("FCBA")}
                            onCheckedChange={() => handleTrackToggle("FCBA")}
                            className="mt-1"
                          />
                          <Label htmlFor="FCBA" className="cursor-pointer flex-1">
                            <span className="font-semibold text-blue-600">FCBA</span>
                            <p className="text-sm text-slate-700 mt-1">Fellow Certified Business Administrator</p>
                          </Label>
                        </div>
                        <div className="flex items-start gap-3 p-4 border-2 rounded-lg hover:border-blue-500 cursor-pointer">
                          <Checkbox
                            id="FCKM"
                            checked={formData.selectedTracks.includes("FCKM")}
                            onCheckedChange={() => handleTrackToggle("FCKM")}
                            className="mt-1"
                          />
                          <Label htmlFor="FCKM" className="cursor-pointer flex-1">
                            <span className="font-semibold text-blue-600">FCKM</span>
                            <p className="text-sm text-slate-700 mt-1">Fellow Certified Knowledge Manager</p>
                          </Label>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SECTION C: Academic Qualifications */}
            {currentStep === "academic" && (
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800 font-medium">
                    <GraduationCap className="w-4 h-4 inline mr-2" />
                    List all your academic qualifications
                  </p>
                </div>

                {academicQualifications.map((qual, index) => (
                  <Card key={qual.id} className="p-4 bg-slate-50">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold">Qualification #{index + 1}</h3>
                      {academicQualifications.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAcademicQualification(qual.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Input
                        placeholder="Qualification (e.g., Bachelor's)"
                        value={qual.qualification}
                        onChange={(e) => updateAcademicQualification(qual.id, "qualification", e.target.value)}
                      />
                      <Input
                        placeholder="Discipline (e.g., Business Admin)"
                        value={qual.discipline}
                        onChange={(e) => updateAcademicQualification(qual.id, "discipline", e.target.value)}
                      />
                      <Input
                        placeholder="Institution"
                        value={qual.institution}
                        onChange={(e) => updateAcademicQualification(qual.id, "institution", e.target.value)}
                      />
                      <Input
                        placeholder="Year Obtained"
                        type="number"
                        value={qual.yearObtained}
                        onChange={(e) => updateAcademicQualification(qual.id, "yearObtained", e.target.value)}
                      />
                    </div>
                  </Card>
                ))}

                <Button onClick={addAcademicQualification} variant="outline" className="w-full">
                  + Add Another Qualification
                </Button>

                <Separator />

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="highestQualification" className="text-base font-semibold">
                      Highest Academic Qualification
                    </Label>
                    <Input
                      id="highestQualification"
                      value={formData.highestQualification}
                      onChange={(e) => handleInputChange("highestQualification", e.target.value)}
                      placeholder="e.g., PhD in Business Administration"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="classOfDegree" className="text-base font-semibold">
                      Class of Degree/Grade (if applicable)
                    </Label>
                    <Input
                      id="classOfDegree"
                      value={formData.classOfDegree}
                      onChange={(e) => handleInputChange("classOfDegree", e.target.value)}
                      placeholder="e.g., First Class, 2:1, Distinction"
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SECTION D: Professional Qualifications */}
            {currentStep === "professional" && (
              <div className="space-y-6">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-sm text-orange-800 font-medium">
                    <Briefcase className="w-4 h-4 inline mr-2" />
                    Provide your professional certifications and memberships
                  </p>
                </div>

                {professionalQualifications.map((qual, index) => (
                  <Card key={qual.id} className="p-4 bg-slate-50">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold">Professional Qualification #{index + 1}</h3>
                      {professionalQualifications.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeProfessionalQualification(qual.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Input
                        placeholder="Professional Body"
                        value={qual.professionalBody}
                        onChange={(e) => updateProfessionalQualification(qual.id, "professionalBody", e.target.value)}
                      />
                      <Input
                        placeholder="Designation (e.g., CBA, ACCA)"
                        value={qual.designation}
                        onChange={(e) => updateProfessionalQualification(qual.id, "designation", e.target.value)}
                      />
                      <Input
                        placeholder="Year Admitted"
                        type="number"
                        value={qual.yearAdmitted}
                        onChange={(e) => updateProfessionalQualification(qual.id, "yearAdmitted", e.target.value)}
                      />
                      <Input
                        placeholder="Membership Status"
                        value={qual.membershipStatus}
                        onChange={(e) => updateProfessionalQualification(qual.id, "membershipStatus", e.target.value)}
                      />
                    </div>
                  </Card>
                ))}

                <Button onClick={addProfessionalQualification} variant="outline" className="w-full">
                  + Add Another Professional Qualification
                </Button>

                <Separator />

                <div>
                  <Label className="text-base font-semibold mb-3 block">
                    Are you a Member of IBAKM® or CIBAKM®?
                  </Label>
                  <RadioGroup value={formData.isIbakmmember ? "yes" : "no"} onValueChange={(v) => handleInputChange("isIbakmmember", v === "yes")} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="ibakm-yes" />
                      <Label htmlFor="ibakm-yes" className="cursor-pointer">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="ibakm-no" />
                      <Label htmlFor="ibakm-no" className="cursor-pointer">No</Label>
                    </div>
                  </RadioGroup>

                  {formData.isIbakmmember && (
                    <div className="mt-4">
                      <Label htmlFor="ibakmmembershipNumber">Membership Number</Label>
                      <Input
                        id="ibakmmembershipNumber"
                        value={formData.ibakmmembershipNumber}
                        onChange={(e) => handleInputChange("ibakmmembershipNumber", e.target.value)}
                        placeholder="Enter your IBAKM/CIBAKM membership number"
                        className="mt-2"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SECTION E: Employment History */}
            {currentStep === "employment" && (
              <div className="space-y-6">
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <p className="text-sm text-indigo-800 font-medium">
                    <Briefcase className="w-4 h-4 inline mr-2" />
                    Detail your career history and professional experience
                  </p>
                </div>

                {employmentHistory.map((emp, index) => (
                  <Card key={emp.id} className="p-4 bg-slate-50">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold">Employment #{index + 1}</h3>
                      {employmentHistory.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEmployment(emp.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <Input
                          placeholder="Organization"
                          value={emp.organization}
                          onChange={(e) => updateEmployment(emp.id, "organization", e.target.value)}
                        />
                        <Input
                          placeholder="Position Held"
                          value={emp.positionHeld}
                          onChange={(e) => updateEmployment(emp.id, "positionHeld", e.target.value)}
                        />
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`periodFrom-${emp.id}`} className="text-sm font-medium mb-1 block">
                            Period From *
                          </Label>
                          <Input
                            id={`periodFrom-${emp.id}`}
                            type="month"
                            placeholder="Period From (YYYY-MM)"
                            value={emp.periodFrom}
                            onChange={(e) => updateEmployment(emp.id, "periodFrom", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`periodTo-${emp.id}`} className="text-sm font-medium mb-1 block">
                            Period To *
                          </Label>
                          <Input
                            id={`periodTo-${emp.id}`}
                            type="month"
                            placeholder="Period To (YYYY-MM or Present)"
                            value={emp.periodTo}
                            onChange={(e) => updateEmployment(emp.id, "periodTo", e.target.value)}
                          />
                          <p className="text-xs text-slate-500 mt-1">Leave empty or type "Present" if currently employed</p>
                        </div>
                      </div>
                      <Textarea
                        placeholder="Key Responsibilities / Achievements"
                        value={emp.keyResponsibilities}
                        onChange={(e) => updateEmployment(emp.id, "keyResponsibilities", e.target.value)}
                        rows={3}
                      />
                    </div>
                  </Card>
                ))}

                <Button onClick={addEmployment} variant="outline" className="w-full">
                  + Add Another Employment Record
                </Button>

                <Separator />

                <div>
                  <Label htmlFor="totalYearsExperience" className="text-base font-semibold">
                    Total Years of Professional Experience *
                  </Label>
                  <Input
                    id="totalYearsExperience"
                    type="number"
                    value={formData.totalYearsExperience}
                    onChange={(e) => handleInputChange("totalYearsExperience", e.target.value)}
                    placeholder="e.g., 15"
                    className="mt-2"
                  />
                </div>
              </div>
            )}

            {/* SECTION F: Eligibility Category */}
            {currentStep === "eligibility" && (
              <div className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 font-medium">
                    <CheckCircle2 className="w-4 h-4 inline mr-2" />
                    Select the category that best suits your qualifications
                  </p>
                </div>

                <div>
                  <Label className="text-base font-semibold mb-3 block">
                    Eligibility Category *
                  </Label>
                  <RadioGroup value={formData.eligibilityCategory} onValueChange={(v) => handleInputChange("eligibilityCategory", v)} className="space-y-3">
                    {[
                      { value: "phd", label: "PhD in Business Administration/Management with minimum 5 years post-doctoral experience" },
                      { value: "mba", label: "HND/Bachelor's Degree in Business Administration/Management + MBA with minimum 10 years post-master experience" },
                      { value: "professional", label: "HND/Bachelor's Degree in non-related discipline + ACA/ACCA/ACIS/ACIB etc. with minimum 15 years post-professional experience" },
                      { value: "bachelor_15", label: "HND/Bachelor's Degree in Business Administration/Management with minimum 15 years post-graduation experience" },
                      { value: "management_20", label: "HND/Bachelor's Degree in Management Sciences with minimum 20 years post-graduation experience" },
                      { value: "other_25", label: "HND/Bachelor's Degree in Sciences, Engineering, Law, Arts, etc. with minimum 25 years post-graduation experience" },
                      { value: "cibakm", label: "CIBAKM® Certified Business Administrator Member" },
                    ].map((category) => (
                      <div key={category.value} className="flex items-start space-x-3 p-4 border-2 rounded-lg hover:border-blue-500 cursor-pointer">
                        <RadioGroupItem value={category.value} id={`eligibility-${category.value}`} className="mt-1" />
                        <Label htmlFor={`eligibility-${category.value}`} className="cursor-pointer flex-1 text-sm">
                          {category.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            )}

            {/* SECTION G: Statement of Purpose */}
            {currentStep === "statement" && (
              <div className="space-y-6">
                <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                  <p className="text-sm text-pink-800 font-medium">
                    <FileText className="w-4 h-4 inline mr-2" />
                    Share your professional achievements and goals (minimum 250 words)
                  </p>
                </div>

                <div>
                  <Label htmlFor="statementOfPurpose" className="text-base font-semibold">
                    Statement of Purpose / Professional Profile *
                  </Label>
                  <p className="text-sm text-slate-600 mt-2 mb-3">
                    Please provide a concise statement (minimum 250 words) outlining your professional achievements, 
                    leadership experience, and how participation in the Fellowship Certification Masterclass aligns 
                    with your professional growth and organizational impact goals.
                  </p>
                  <Textarea
                    id="statementOfPurpose"
                    value={formData.statementOfPurpose}
                    onChange={(e) => handleInputChange("statementOfPurpose", e.target.value)}
                    placeholder="Write your statement here..."
                    rows={15}
                    className="font-mono text-sm"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-sm text-slate-500">
                      {formData.statementOfPurpose.length} characters
                      {formData.statementOfPurpose.length < 250 && (
                        <span className="text-red-500 ml-2">
                          (Minimum 250 characters required)
                        </span>
                      )}
                    </p>
                    {formData.statementOfPurpose.length >= 250 && (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SECTION H: Referees */}
            {currentStep === "referees" && (
              <div className="space-y-6">
                <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
                  <p className="text-sm text-cyan-800 font-medium">
                    <User className="w-4 h-4 inline mr-2" />
                    Provide at least two professional or academic referees
                  </p>
                  <p className="text-xs text-cyan-700 mt-1">
                    Referees should be senior professionals, academics, or fellows of reputable institutions
                  </p>
                </div>

                {referees.map((ref, index) => (
                  <Card key={ref.id} className="p-4 bg-slate-50">
                    <h3 className="font-semibold mb-4">Referee #{index + 1}</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Input
                        placeholder="Referee Name *"
                        value={ref.refereeName}
                        onChange={(e) => updateReferee(ref.id, "refereeName", e.target.value)}
                      />
                      <Input
                        placeholder="Position/Organization *"
                        value={ref.positionOrganization}
                        onChange={(e) => updateReferee(ref.id, "positionOrganization", e.target.value)}
                      />
                      <Input
                        placeholder="Email Address *"
                        type="email"
                        value={ref.email}
                        onChange={(e) => updateReferee(ref.id, "email", e.target.value)}
                      />
                      <Input
                        placeholder="Phone Number *"
                        value={ref.phoneNumber}
                        onChange={(e) => updateReferee(ref.id, "phoneNumber", e.target.value)}
                      />
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* SECTION I: Supporting Documents */}
            {currentStep === "documents" && (
              <div className="space-y-6">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-sm text-purple-800 font-medium">
                    <Upload className="w-4 h-4 inline mr-2" />
                    Upload your supporting documents (PDF/JPEG/PNG, max 2MB each)
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    { id: "academic" as const, label: "Academic Certificates (Bachelor's, Master's, PhD, etc.)", required: true },
                    { id: "professional" as const, label: "Professional Certificates (CBA, CKM, ACA, ACCA, PMP, etc.)", required: true },
                    { id: "cv" as const, label: "Curriculum Vitae (CV)", required: true },
                    { id: "photo" as const, label: "Passport Photograph", required: true },
                    { id: "id" as const, label: "Means of Identification (National ID, International Passport, or Driver's License)", required: true },
                  ].map((doc) => (
                    <div key={doc.id} className="border-2 border-dashed rounded-lg p-6 hover:border-blue-500 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <Label className="text-base font-semibold">
                            {doc.label} {doc.required && <span className="text-red-500">*</span>}
                          </Label>
                          <p className="text-sm text-slate-500 mt-1">PDF, JPEG, or PNG • Max 2MB</p>
                          {uploadedDocuments[doc.id] && (
                            <div className="mt-2 flex items-center gap-2">
                              <FileText className="w-4 h-4 text-green-600" />
                              <span className="text-sm text-green-700 font-medium">{uploadedDocuments[doc.id]?.name}</span>
                              <span className="text-xs text-slate-500">
                                ({(uploadedDocuments[doc.id]!.size / 1024).toFixed(1)} KB)
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="file"
                            id={`file-${doc.id}`}
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={(e) => handleFileUpload(doc.id, e)}
                            disabled={uploadingDoc === doc.id}
                          />
                          <Button
                            type="button"
                            variant={uploadedDocuments[doc.id] ? "outline" : "default"}
                            onClick={() => document.getElementById(`file-${doc.id}`)?.click()}
                            disabled={uploadingDoc === doc.id}
                          >
                            {uploadingDoc === doc.id ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mr-2" />
                                {uploadedDocuments[doc.id] ? "Change" : "Choose File"}
                              </>
                            )}
                          </Button>
                          {uploadedDocuments[doc.id] && uploadingDoc !== doc.id && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeDocument(doc.id)}
                            >
                              <X className="w-4 h-4 text-red-600" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                  <p className="text-sm text-blue-800">
                    <strong>Uploaded:</strong> {Object.values(uploadedDocuments).filter(Boolean).length} of 5 documents
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800">
                    <strong>Note:</strong> All documents must be uploaded before final submission. 
                    Ensure files are clear and readable.
                  </p>
                </div>
              </div>
            )}

            {/* SECTION J: Declaration and Consent */}
            {currentStep === "declaration" && (
              <div className="space-y-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800 font-medium">
                    <FileSignature className="w-4 h-4 inline mr-2" />
                    Please read carefully and accept all declarations
                  </p>
                </div>

                <Card className="p-6 bg-slate-50">
                  <h3 className="font-bold text-lg mb-4">DECLARATION AND CONSENT</h3>
                  
                  <div className="space-y-4 text-sm text-slate-700 mb-6">
                    <p>
                      I hereby declare that the information provided in this application form is true and accurate 
                      to the best of my knowledge. I understand that any falsification, misrepresentation, or 
                      omission of facts may result in the disqualification of my application or revocation of my 
                      fellowship award.
                    </p>
                    <p>
                      I further agree to abide by the ethical standards, professional code of conduct, and regulations 
                      governing the operations of the Institute of Business Administration and Knowledge Management (IBAKM®) 
                      and the Chartered Institute of Business Administration and Knowledge Management (CIBAKM®).
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start space-x-3 p-4 border-2 rounded-lg">
                      <Checkbox
                        id="declaration"
                        checked={formData.declarationAccepted}
                        onCheckedChange={(checked: boolean) => handleInputChange("declarationAccepted", checked)}
                      />
                      <Label htmlFor="declaration" className="cursor-pointer text-sm">
                        <strong>I accept the declaration above</strong> and confirm that all information provided is 
                        true and accurate to the best of my knowledge.
                      </Label>
                    </div>

                    <div className="flex items-start space-x-3 p-4 border-2 rounded-lg">
                      <Checkbox
                        id="dataConsent"
                        checked={formData.dataConsentAccepted}
                        onCheckedChange={(checked: boolean) => handleInputChange("dataConsentAccepted", checked)}
                      />
                      <Label htmlFor="dataConsent" className="cursor-pointer text-sm">
                        <strong>I hereby consent</strong> to the collection, verification, and processing of my 
                        personal and professional data for the purpose of admission, certification, and professional 
                        record management in compliance with relevant Data Protection and Privacy Laws (NDPA 2023, 
                        GDPR EU 2018).
                      </Label>
                    </div>

                    <div className="flex items-start space-x-3 p-4 border-2 rounded-lg">
                      <Checkbox
                        id="confirmation"
                        checked={formData.confirmationAccepted}
                        onCheckedChange={(checked: boolean) => handleInputChange("confirmationAccepted", checked)}
                      />
                      <Label htmlFor="confirmation" className="cursor-pointer text-sm">
                        <strong>I confirm</strong> that I have completed this form truthfully and understand the 
                        eligibility and certification requirements.
                      </Label>
                    </div>

                    <div className="flex items-start space-x-3 p-4 border-2 rounded-lg">
                      <Checkbox
                        id="updates"
                        checked={formData.updatesAccepted}
                        onCheckedChange={(checked: boolean) => handleInputChange("updatesAccepted", checked)}
                      />
                      <Label htmlFor="updates" className="cursor-pointer text-sm">
                        <strong>I agree</strong> to receive updates and official communications from IBAKM®/CIBAKM® 
                        regarding this and future programmes.
                      </Label>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  <div>
                    <Label className="text-base font-semibold mb-2 block">Digital Signature</Label>
                    <p className="text-sm text-slate-600 mb-3">
                      Type your full name as electronic signature
                    </p>
                    <Input
                      placeholder="Type your full name here"
                      className="font-serif text-lg italic"
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      Date: {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </Card>
              </div>
            )}

            {/* SECTION K: Review & Submit */}
            {currentStep === "review" && (
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800 font-medium">
                    <CheckCircle2 className="w-4 h-4 inline mr-2" />
                    Review your application before final submission
                  </p>
                </div>

                <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50">
                  <h3 className="font-bold text-xl mb-4">Application Summary</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold text-blue-600 mb-2">Personal Information</h4>
                      <div className="grid md:grid-cols-2 gap-3 text-sm">
                        <div><span className="text-slate-600">Name:</span> <strong>{formData.fullName}</strong></div>
                        <div><span className="text-slate-600">Email:</span> <strong>{formData.email}</strong></div>
                        <div><span className="text-slate-600">Mobile:</span> <strong>{formData.mobileNumber}</strong></div>
                        <div><span className="text-slate-600">Nationality:</span> <strong>{formData.nationality}</strong></div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold text-purple-600 mb-2">Programme Selection</h4>
                      <div className="grid md:grid-cols-2 gap-3 text-sm">
                        <div><span className="text-slate-600">Cohort:</span> <strong>Cohort #{formData.cohortId}</strong></div>
                        <div><span className="text-slate-600">Mode:</span> <strong className="capitalize">{formData.participationMode}</strong></div>
                        <div className="md:col-span-2">
                          <span className="text-slate-600">Tracks:</span> 
                          <strong> {formData.selectedTracks.join(", ") || "None selected"}</strong>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold text-green-600 mb-2">Qualifications & Experience</h4>
                      <div className="grid md:grid-cols-2 gap-3 text-sm">
                        <div><span className="text-slate-600">Highest Qualification:</span> <strong>{formData.highestQualification}</strong></div>
                        <div><span className="text-slate-600">Years of Experience:</span> <strong>{formData.totalYearsExperience} years</strong></div>
                        <div className="md:col-span-2">
                          <span className="text-slate-600">Eligibility Category:</span> 
                          <strong className="block mt-1">{formData.eligibilityCategory}</strong>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold text-orange-600 mb-2">Declaration Status</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          {formData.declarationAccepted ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <X className="w-4 h-4 text-red-500" />
                          )}
                          <span>Declaration Accepted</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {formData.dataConsentAccepted ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <X className="w-4 h-4 text-red-500" />
                          )}
                          <span>Data Consent Given</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-amber-50 border-2 border-amber-300">
                  <h3 className="font-bold text-lg mb-3 text-amber-900">Important Notes</h3>
                  <ul className="list-disc list-inside space-y-2 text-sm text-amber-800">
                    <li>Incomplete applications will not be processed</li>
                    <li>All supporting documents must be authentic and verifiable</li>
                    <li>Applicants will be notified via email regarding admission decision</li>
                    <li>Inducted Fellows will be authorized to use professional post-nominals (FIBAKM, FCBA, FCKM)</li>
                    <li>The Institute reserves the right to verify all submissions</li>
                  </ul>
                </Card>

                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6">
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Application Fee Payment
                  </h3>
                  <p className="text-sm text-slate-700 mb-4">
                    After submission, you will be redirected to make the application fee payment. 
                    Your application will be processed once payment is confirmed.
                  </p>
                  <div className="text-xs text-slate-600">
                    Payment Options: Online Payment (Debit/Credit Card) • Bank Transfer • Corporate Sponsorship
                  </div>
                </div>
              </div>
            )}
          </CardContent>

          {/* Navigation Buttons */}
          <div className="border-t bg-slate-50 px-6 py-4 flex justify-between items-center">
            <Button
              variant="outline"
              onClick={() => {
                const currentIndex = steps.findIndex((s) => s.id === currentStep);
                if (currentIndex > 0) {
                  setCurrentStep(steps[currentIndex - 1].id);
                }
              }}
              disabled={currentStepIndex === 0}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>

            <div className="text-center">
              <p className="text-sm text-slate-600">
                Section {String.fromCharCode(65 + currentStepIndex)} of {String.fromCharCode(65 + steps.length - 1)}
              </p>
            </div>

            {currentStepIndex === steps.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.declarationAccepted || !formData.dataConsentAccepted}
                className="gap-2 bg-green-600 hover:bg-green-700"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Submit Application
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={() => {
                  const currentIndex = steps.findIndex((s) => s.id === currentStep);
                  if (currentIndex < steps.length - 1) {
                    setCurrentStep(steps[currentIndex + 1].id);
                  }
                }}
                className="gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

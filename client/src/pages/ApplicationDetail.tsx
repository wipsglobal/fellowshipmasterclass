import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Loader2, Upload, Trash2, Eye, Download, CheckCircle, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function ApplicationDetail() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [appId, setAppId] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<string>("");
  const [pendingDocuments, setPendingDocuments] = useState<any[]>([]);

  // Get app ID from URL
  const pathMatch = window.location.pathname.match(/\/application\/(\d+)/);
  const applicationId = pathMatch ? parseInt(pathMatch[1]) : null;

  // Load pending documents from sessionStorage
  useEffect(() => {
    if (applicationId) {
      const storedAppId = sessionStorage.getItem('pendingApplicationId');
      if (storedAppId === applicationId.toString()) {
        const docTypeMap: Record<string, string> = {
          academic: "academic_certificate",
          professional: "professional_certificate",
          cv: "cv",
          photo: "passport_photo",
          id: "identification",
        };
        
        const docs = [];
        for (const [key, label] of Object.entries({
          academic: "Academic Certificate",
          professional: "Professional Certificate",
          cv: "CV/Resume",
          photo: "Passport Photo",
          id: "ID Card",
        })) {
          const fileData = sessionStorage.getItem(`pendingFile_${key}`);
          if (fileData) {
            const parsed = JSON.parse(fileData);
            docs.push({
              key,
              label,
              name: parsed.name,
              size: parsed.size,
              type: parsed.type,
            });
          }
        }
        setPendingDocuments(docs);
      }
    }
  }, [applicationId]);

  if (!applicationId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-slate-600 mb-4">Application not found.</p>
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch application details
  const { data: application, isLoading } = trpc.applications.getById.useQuery(
    applicationId
  );

  const { data: documents } = trpc.documents.list.useQuery(applicationId);
  const { data: payments } = trpc.payments.getByApplication.useQuery(applicationId);

  const uploadDocMutation = trpc.documents.add.useMutation();
  const deleteDocMutation = trpc.documents.delete.useMutation();
  const initiatePaymentMutation = trpc.payments.initiate.useMutation();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedDocType) {
      toast.error("Please select a document type");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    // Validate file type
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only PDF, JPEG, and PNG files are allowed");
      return;
    }

    setIsUploading(true);
    try {
      // In a real implementation, you would upload to Google Drive here
      // For now, we'll store the file metadata
      await uploadDocMutation.mutateAsync({
        applicationId,
        documentType: selectedDocType as any,
        fileName: file.name,
        cloudinaryUrl: `https://drive.google.com/file/${file.name}`, // Placeholder
        cloudinaryPublicId: `drive_${Date.now()}`,
        fileSize: file.size,
        mimeType: file.type,
      });

      toast.success("Document uploaded successfully");
      setSelectedDocType("");
      e.target.value = "";
    } catch (error) {
      toast.error("Failed to upload document");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (docId: number) => {
    try {
      await deleteDocMutation.mutateAsync(docId);
      toast.success("Document deleted");
    } catch (error) {
      toast.error("Failed to delete document");
      console.error(error);
    }
  };

  const handleInitiatePayment = async () => {
    if (!application) return;

    try {
      toast.loading("Initializing payment...", { id: "payment-init" });
      
      const result = await initiatePaymentMutation.mutateAsync({
        applicationId,
      });

      toast.dismiss("payment-init");

      if (result.authorizationUrl) {
        toast.success("Redirecting to payment gateway...");
        window.location.href = result.authorizationUrl;
      } else {
        toast.error("Payment initialization failed - no authorization URL received");
      }
    } catch (error: any) {
      toast.dismiss("payment-init");
      const errorMessage = error?.message || "Failed to initiate payment";
      toast.error(errorMessage);
      console.error("[Payment] Initialization error:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-slate-600 mb-4">Application not found.</p>
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const documentTypes = [
    { value: "academic_certificate", label: "Academic Certificate" },
    { value: "professional_certificate", label: "Professional Certificate" },
    { value: "cv", label: "Curriculum Vitae (CV)" },
    { value: "passport_photo", label: "Passport Photograph" },
    { value: "identification", label: "Identification Document" },
    { value: "other", label: "Other Document" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-slate-900">
            Application {application.applicationNumber}
          </h1>
          <p className="text-slate-600 mt-1">
            Status: <span className="font-semibold capitalize">{application.status}</span>
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Admission Status Alert */}
        {application.admissionStatus === "approved" && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <AlertTitle className="text-green-900 font-semibold text-lg">Congratulations! You've Been Admitted!</AlertTitle>
            <AlertDescription className="text-green-800 mt-2">
              Your application has been approved and you have been admitted to the fellowship program.
              {application.dateOfApproval && (
                <span className="block mt-1 font-medium">
                  Approved on: {new Date(application.dateOfApproval).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              )}
              {application.remarks && (
                <span className="block mt-2 italic">"{application.remarks}"</span>
              )}
            </AlertDescription>
          </Alert>
        )}
        {application.admissionStatus === "declined" && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <XCircle className="h-5 w-5 text-red-600" />
            <AlertTitle className="text-red-900 font-semibold text-lg">Application Not Approved</AlertTitle>
            <AlertDescription className="text-red-800 mt-2">
              Unfortunately, your application was not approved at this time.
              {application.remarks && (
                <span className="block mt-2 italic">"{application.remarks}"</span>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-3 gap-6">
          {/* Main Panel */}
          <div className="col-span-2 space-y-6">
            {/* Application Info */}
            <Card>
              <CardHeader>
                <CardTitle>Application Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Full Name</p>
                    <p className="font-medium">{application.fullName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Email</p>
                    <p className="font-medium">{application.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Mobile Number</p>
                    <p className="font-medium">{application.mobileNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Participation Mode</p>
                    <p className="font-medium capitalize">{application.participationMode}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Selected Tracks</p>
                    <p className="font-medium">{application.selectedTracks.join(", ")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Years of Experience</p>
                    <p className="font-medium">{application.totalYearsExperience} years</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Documents */}
            <Card>
              <CardHeader>
                <CardTitle>Supporting Documents</CardTitle>
                <CardDescription>
                  Upload required documents (PDF, JPEG, PNG - Max 5MB each)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Upload Form */}
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="docType">Document Type *</Label>
                      <select
                        id="docType"
                        value={selectedDocType}
                        onChange={(e) => setSelectedDocType(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md"
                      >
                        <option value="">Select a document type</option>
                        {documentTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="file">Choose File *</Label>
                      <Input
                        id="file"
                        type="file"
                        onChange={handleFileUpload}
                        disabled={isUploading || !selectedDocType}
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                    </div>
                  </div>
                </div>

                {/* Uploaded Documents */}
                {documents && documents.length > 0 ? (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-slate-900">Uploaded Documents</h4>
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{doc.fileName}</p>
                          <p className="text-sm text-slate-600">
                            {doc.documentType.replace(/_/g, " ")} •{" "}
                            {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(2)} KB` : "N/A"}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => window.open(doc.cloudinaryUrl, '_blank')}
                            title="View document"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Download document"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = doc.cloudinaryUrl.replace('/upload/', '/upload/fl_attachment/');
                              link.download = doc.fileName;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteDocument(doc.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-600 text-center py-4">
                    No documents uploaded yet
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pending Documents Preview */}
            {application.paymentStatus === "pending" && pendingDocuments.length > 0 && (
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-blue-900">Documents Ready for Upload</CardTitle>
                  <CardDescription className="text-blue-700">
                    These documents will be uploaded after payment confirmation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {pendingDocuments.map((doc) => (
                    <div
                      key={doc.key}
                      className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-200"
                    >
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-900 truncate">{doc.name}</p>
                        <p className="text-xs text-slate-600">{doc.label} • {(doc.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                  ))}
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <p className="text-xs text-blue-700 flex items-center gap-1">
                      <Upload className="w-3 h-3" />
                      {pendingDocuments.length} document{pendingDocuments.length > 1 ? 's' : ''} pending upload
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Payment Status */}
            <Card>
              <CardHeader>
                <CardTitle>Payment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-slate-600">Application Fee</p>
                  <p className="text-2xl font-bold text-slate-900">
                    ₦{Number(application.applicationFee).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Payment Status</p>
                  <p className="font-medium capitalize">{application.paymentStatus}</p>
                </div>

                {application.paymentStatus === "pending" && (
                  <Button
                    onClick={handleInitiatePayment}
                    className="w-full"
                    disabled={isUploading}
                  >
                    {isUploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Pay Now
                  </Button>
                )}

                {payments && payments.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-slate-900 mb-2">Payment History</h4>
                    {payments.map((payment) => (
                      <div key={payment.id} className="text-sm">
                        <p className="text-slate-600">
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </p>
                        <p className="font-medium capitalize">{payment.status}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Application Status */}
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-slate-600">Current Status</p>
                  <p className="font-medium capitalize">{application.status}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Admission Decision</p>
                  <p className="font-medium capitalize">{application.admissionStatus}</p>
                </div>
                {application.remarks && (
                  <div>
                    <p className="text-sm text-slate-600">Remarks</p>
                    <p className="text-sm text-slate-700">{application.remarks}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

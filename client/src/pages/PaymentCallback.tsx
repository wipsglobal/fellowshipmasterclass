import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, Upload } from "lucide-react";
import { toast } from "sonner";

export default function PaymentCallback() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<"verifying" | "uploading" | "success" | "failed">("verifying");
  const verifyPaymentMutation = trpc.payments.verify.useMutation();
  const uploadDocumentMutation = trpc.documents.upload.useMutation();

  useEffect(() => {
    // Clean up old pending data (older than 1 hour)
    const cleanupOldData = () => {
      const timestamp = sessionStorage.getItem('pendingTimestamp');
      if (timestamp) {
        const age = Date.now() - parseInt(timestamp);
        const oneHour = 60 * 60 * 1000;
        if (age > oneHour) {
          // Clear stale data
          const pendingDocs = sessionStorage.getItem('pendingDocuments');
          if (pendingDocs) {
            const documents = JSON.parse(pendingDocs);
            documents.forEach((doc: any) => {
              sessionStorage.removeItem(`pendingFile_${doc.key}`);
            });
          }
          sessionStorage.removeItem('pendingApplicationId');
          sessionStorage.removeItem('pendingDocuments');
          sessionStorage.removeItem('pendingTimestamp');
        }
      }
    };

    cleanupOldData();

    // Get payment reference from URL query params
    const params = new URLSearchParams(window.location.search);
    const reference = params.get("reference");
    const trxref = params.get("trxref"); // Paystack also sends trxref

    const paymentRef = reference || trxref;

    if (!paymentRef) {
      setStatus("failed");
      // Clean up session storage immediately on failure
      const pendingDocs = sessionStorage.getItem('pendingDocuments');
      if (pendingDocs) {
        const documents = JSON.parse(pendingDocs);
        documents.forEach((doc: any) => {
          sessionStorage.removeItem(`pendingFile_${doc.key}`);
        });
      }
      sessionStorage.removeItem('pendingApplicationId');
      sessionStorage.removeItem('pendingDocuments');
      sessionStorage.removeItem('pendingTimestamp');
      return;
    }

    // Verify payment with backend
    verifyPaymentMutation
      .mutateAsync({ reference: paymentRef })
      .then(async () => {
        // Payment successful, now upload documents
        const applicationId = sessionStorage.getItem('pendingApplicationId');
        const pendingDocs = sessionStorage.getItem('pendingDocuments');
        
        if (applicationId && pendingDocs) {
          setStatus("uploading");
          
          const documents = JSON.parse(pendingDocs);
          const uploadPromises: Promise<any>[] = [];
          
          for (const doc of documents) {
            const fileData = sessionStorage.getItem(`pendingFile_${doc.key}`);
            if (fileData) {
              const parsedFile = JSON.parse(fileData);
              
              uploadPromises.push(
                uploadDocumentMutation.mutateAsync({
                  applicationId: parseInt(applicationId),
                  documentType: parsedFile.docType,
                  fileName: parsedFile.name,
                  fileData: parsedFile.base64,
                  mimeType: parsedFile.type,
                  fileSize: parsedFile.size,
                })
              );
            }
          }
          
          try {
            await Promise.all(uploadPromises);
            toast.success("Documents uploaded successfully!");
            
            // Clean up sessionStorage
            sessionStorage.removeItem('pendingApplicationId');
            sessionStorage.removeItem('pendingDocuments');
            sessionStorage.removeItem('pendingTimestamp');
            documents.forEach((doc: any) => {
              sessionStorage.removeItem(`pendingFile_${doc.key}`);
            });
          } catch (error) {
            console.error("Document upload failed:", error);
            toast.error("Some documents failed to upload. Please contact support.");
          }
        }
        
        setStatus("success");
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          navigate("/dashboard");
        }, 3000);
      })
      .catch((error) => {
        console.error("Payment verification failed:", error);
        setStatus("failed");
        
        // Clean up session storage immediately on payment failure
        const pendingDocs = sessionStorage.getItem('pendingDocuments');
        if (pendingDocs) {
          const documents = JSON.parse(pendingDocs);
          documents.forEach((doc: any) => {
            sessionStorage.removeItem(`pendingFile_${doc.key}`);
          });
        }
        sessionStorage.removeItem('pendingApplicationId');
        sessionStorage.removeItem('pendingDocuments');
        sessionStorage.removeItem('pendingTimestamp');
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-center">Payment Verification</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          {status === "verifying" && (
            <div className="py-8">
              <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-slate-600 text-lg mb-2">Verifying your payment...</p>
              <p className="text-sm text-slate-500">Please wait while we confirm your transaction.</p>
            </div>
          )}

          {status === "uploading" && (
            <div className="py-8">
              <Upload className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-pulse" />
              <p className="text-slate-600 text-lg mb-2">Uploading documents to Google Drive...</p>
              <p className="text-sm text-slate-500">Please wait while we upload your supporting documents.</p>
            </div>
          )}

          {status === "success" && (
            <div className="py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <p className="text-green-600 text-2xl font-bold mb-2">Payment Successful!</p>
              <p className="text-slate-600 mb-4">
                Your payment has been confirmed. Your application fee has been processed.
              </p>
              <p className="text-sm text-slate-500 mb-6">
                Redirecting to dashboard in 3 seconds...
              </p>
              <Button onClick={() => navigate("/dashboard")} className="w-full">
                Go to Dashboard Now
              </Button>
            </div>
          )}

          {status === "failed" && (
            <div className="py-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-10 h-10 text-red-600" />
              </div>
              <p className="text-red-600 text-2xl font-bold mb-2">Payment Failed</p>
              <p className="text-slate-600 mb-6">
                We couldn't verify your payment. This could be due to a cancelled transaction or an error.
              </p>
              <div className="space-y-2">
                <Button onClick={() => navigate("/dashboard")} className="w-full">
                  Back to Dashboard
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()} 
                  className="w-full"
                >
                  Retry Verification
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

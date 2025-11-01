import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { FileText, Plus, Eye, Download, Clock, CheckCircle, XCircle, AlertCircle, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { data: applications, isLoading } = trpc.applications.myApplications.useQuery();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "declined":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "submitted":
      case "under_review":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <FileText className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-50 text-green-700 border-green-200";
      case "declined":
        return "bg-red-50 text-red-700 border-red-200";
      case "submitted":
      case "under_review":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const hasApplications = applications && applications.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">My Dashboard</h1>
              <p className="text-slate-600 mt-1">Welcome back, {user?.name}</p>
            </div>
            <div className="flex gap-3">
              <Link href="/">
                <Button variant="outline">Home</Button>
              </Link>
              <Button variant="ghost" onClick={() => logout()}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !hasApplications ? (
          // No applications yet - Show welcome message
          <div className="max-w-3xl mx-auto">
            <Alert className="mb-6 bg-blue-50 border-blue-200">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <AlertTitle className="text-blue-900 font-semibold">Welcome to Your Dashboard!</AlertTitle>
              <AlertDescription className="text-blue-800 mt-2">
                You haven't submitted any fellowship applications yet. Start your journey by creating your first application below.
              </AlertDescription>
            </Alert>

            <Card className="shadow-lg">
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-full">
                    <FileText className="w-12 h-12 text-white" />
                  </div>
                </div>
                <CardTitle className="text-2xl">Apply for Fellowship Program</CardTitle>
                <CardDescription className="text-base mt-2">
                  Begin your application for FIBAKM, FCBA, or FCKM fellowship certification
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-slate-50 rounded-lg p-6 space-y-4">
                  <h3 className="font-semibold text-slate-900 mb-3">What you'll need:</h3>
                  <ul className="space-y-2 text-slate-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Personal and contact information</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Academic qualifications and certificates</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Professional certifications (if applicable)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Employment history</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Statement of purpose (minimum 250 words)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Two professional referees</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Supporting documents (CV, certificates, ID, passport photo)</span>
                    </li>
                  </ul>
                </div>

                <div className="text-center pt-4">
                  <Link href="/apply">
                    <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                      <Plus className="w-5 h-5 mr-2" />
                      Start Your Application
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                  <p className="text-sm text-slate-500 mt-3">
                    Your application will be saved as a draft and you can continue anytime
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Has applications - Show list
          <div>
            {/* Admission Status Alerts */}
            {applications.some((app: any) => app.admissionStatus === "approved") && (
              <Alert className="mb-6 bg-green-50 border-green-200">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <AlertTitle className="text-green-900 font-semibold">Congratulations! You've Been Admitted!</AlertTitle>
                <AlertDescription className="text-green-800 mt-2">
                  Your application has been approved. Check your application details below for more information.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Your Applications</h2>
              <Link href="/apply">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Application
                </Button>
              </Link>
            </div>
            
            <div className="space-y-4">
              {applications.map((app: any) => (
                <Card key={app.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-900">
                            {app.applicationNumber}
                          </h3>
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(app.status)}`}>
                            {getStatusIcon(app.status)}
                            {app.status.replace(/_/g, " ").toUpperCase()}
                          </span>
                        </div>
                        <p className="text-slate-600 mb-3">
                          {app.fullName} • {app.selectedTracks?.join(", ") || "No tracks"}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-slate-500">Cohort</p>
                            <p className="font-medium text-slate-900">Cohort #{app.cohortId}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Mode</p>
                            <p className="font-medium text-slate-900 capitalize">{app.participationMode}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Payment Status</p>
                            <p className="font-medium text-slate-900 capitalize">{app.paymentStatus}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Admission</p>
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
                              app.admissionStatus === 'approved' ? 'bg-green-100 text-green-800' :
                              app.admissionStatus === 'declined' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {app.admissionStatus === 'approved' && <CheckCircle className="w-3 h-3" />}
                              {app.admissionStatus === 'declined' && <XCircle className="w-3 h-3" />}
                              {app.admissionStatus === 'pending' && <Clock className="w-3 h-3" />}
                              {app.admissionStatus.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Link href={`/application/${app.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </Link>
                        {app.status === "approved" && (
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-1" />
                            Certificate
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

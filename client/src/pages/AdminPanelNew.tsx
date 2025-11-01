import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, Eye, CheckCircle, XCircle, Clock, Search, Filter, Download, Users, FileText, Mail, Phone, MapPin, Briefcase, GraduationCap, Calendar, BadgeCheck, DollarSign, Settings, BarChart3, Edit, User, Building, CreditCard, CheckCircle2, ExternalLink, FolderOpen } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Documents Section Component
function DocumentsSection({ applicationId }: { applicationId: number }) {
  const { data: documents, isLoading } = trpc.documents.list.useQuery(applicationId);

  if (isLoading) {
    return (
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
          <FolderOpen className="w-5 h-5" />
          Supporting Documents
        </h3>
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      </div>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
          <FolderOpen className="w-5 h-5" />
          Supporting Documents
        </h3>
        <p className="text-sm text-slate-500 italic">No documents uploaded yet</p>
      </div>
    );
  }

  const formatFileSize = (bytes: number | null | undefined) => {
    if (!bytes) return 'Unknown size';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'passport': 'Passport Photo',
      'id_card': 'ID Card',
      'cv': 'CV/Resume',
      'certificate': 'Certificate',
      'transcript': 'Transcript',
      'recommendation': 'Recommendation Letter',
      'other': 'Other Document'
    };
    return labels[type] || type;
  };

  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
        <FolderOpen className="w-5 h-5" />
        Supporting Documents ({documents.length})
      </h3>
      <div className="space-y-3">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1">
              <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{doc.fileName}</p>
                <div className="flex gap-3 text-xs text-slate-500 mt-1">
                  <span className="font-semibold text-slate-700">{getDocumentTypeLabel(doc.documentType)}</span>
                  <span>•</span>
                  <span>{formatFileSize(doc.fileSize)}</span>
                  <span>•</span>
                  <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <a
                href={doc.cloudinaryUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  View
                </Button>
              </a>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
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
                Download
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminPanel() {
  const { user, logout } = useAuth();
  const [selectedApp, setSelectedApp] = useState<number | null>(null);
  const [reviewStatus, setReviewStatus] = useState<"approved" | "pending" | "declined">("pending");
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [cohortFilter, setCohortFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("applications");

  // Fee Management State
  const [selectedCohortForFee, setSelectedCohortForFee] = useState<number | null>(null);
  const [newFeeAmount, setNewFeeAmount] = useState<string>("");
  const [feeDescription, setFeeDescription] = useState<string>("");

  // Fetch applications
  const { data: applications, isLoading, refetch } = trpc.applications.adminList.useQuery({
    limit: 100,
    offset: 0,
  });

  // Fetch cohorts
  const { data: cohorts } = trpc.cohorts.list.useQuery();

  const updateStatusMutation = trpc.applications.adminUpdateStatus.useMutation();
  const updateFeeMutation = trpc.feeConfig.adminUpdate.useMutation();

  // Filter and search applications
  const filteredApplications = useMemo(() => {
    if (!applications) return [];

    return applications.filter((app) => {
      const matchesSearch = 
        searchQuery === "" ||
        app.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.applicationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.mobileNumber.includes(searchQuery);

      const matchesStatus = 
        statusFilter === "all" || 
        app.admissionStatus === statusFilter;

      const matchesCohort = 
        cohortFilter === "all" || 
        app.cohortId.toString() === cohortFilter;

      return matchesSearch && matchesStatus && matchesCohort;
    });
  }, [applications, searchQuery, statusFilter, cohortFilter]);

  // Statistics
  const stats = useMemo(() => {
    if (!applications) return { total: 0, approved: 0, pending: 0, declined: 0, submitted: 0, revenue: 0 };

    const revenue = applications.reduce((sum, app) => sum + parseFloat(app.applicationFee || '0'), 0);

    return {
      total: applications.length,
      approved: applications.filter(a => a.admissionStatus === "approved").length,
      pending: applications.filter(a => a.admissionStatus === "pending").length,
      declined: applications.filter(a => a.admissionStatus === "declined").length,
      submitted: applications.filter(a => a.status === "submitted").length,
      revenue,
    };
  }, [applications]);

  // Cohort statistics
  const cohortStats = useMemo(() => {
    if (!cohorts || !applications) return [];

    return cohorts.map(cohort => {
      const cohortApps = applications.filter(app => app.cohortId === cohort.id);
      const revenue = cohortApps.reduce((sum, app) => sum + parseFloat(app.applicationFee || '0'), 0);
      
      return {
        cohort,
        applications: cohortApps.length,
        approved: cohortApps.filter(a => a.admissionStatus === "approved").length,
        revenue,
      };
    });
  }, [cohorts, applications]);

  // Check authorization
  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-slate-600 mb-4">You do not have access to the admin panel.</p>
            <Button variant="outline">Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleReview = async (appId: number) => {
    if (!reviewStatus) {
      toast.error("Please select a status");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateStatusMutation.mutateAsync({
        id: appId,
        admissionStatus: reviewStatus,
        remarks: remarks || undefined,
        verifiedBy: user?.name || "Admin",
      });

      toast.success(`Application ${reviewStatus}`);
      setSelectedApp(null);
      setRemarks("");
      setReviewStatus("pending");
      refetch();
    } catch (error) {
      toast.error("Failed to update application");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateFee = async () => {
    if (!selectedCohortForFee || !newFeeAmount) {
      toast.error("Please select a cohort and enter fee amount");
      return;
    }

    const amount = parseFloat(newFeeAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid fee amount");
      return;
    }

    try {
      await updateFeeMutation.mutateAsync({
        cohortId: selectedCohortForFee,
        amount: amount,
        currency: "NGN",
        description: feeDescription || `Application fee for cohort`,
        isActive: true,
      });

      toast.success("Fee configuration updated successfully! This will affect new payments.");
      setNewFeeAmount("");
      setFeeDescription("");
      setSelectedCohortForFee(null);
    } catch (error) {
      toast.error("Failed to update fee configuration");
      console.error(error);
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
        return <Eye className="w-5 h-5 text-slate-400" />;
    }
  };

  function exportApplicationsCSV(applications: any[]) {
    if (!applications || applications.length === 0) {
      toast.error("No applications to export");
      return;
    }
    const headers = [
      "Application Number",
      "Full Name",
      "Email",
      "Phone",
      "Cohort",
      "Status",
      "Admission Status",
      "Fee",
      "Payment Status",
      "Submitted At",
      "Approved At",
      "Verified By"
    ];
    const rows = applications.map(app => [
      app.applicationNumber,
      app.fullName,
      app.email,
      app.mobileNumber,
      app.cohortId,
      app.status,
      app.admissionStatus,
      app.applicationFee,
      app.paymentStatus,
      app.submittedAt ? new Date(app.submittedAt).toLocaleString() : "",
      app.dateOfApproval ? new Date(app.dateOfApproval).toLocaleString() : "",
      app.verifiedBy || ""
    ]);
    const csvContent = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `applications_export_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Applications exported as CSV");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
              <p className="text-slate-600 mt-1">Comprehensive fellowship management system</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2" onClick={() => exportApplicationsCSV(applications ?? [])}>
                <Download className="w-4 h-4" />
                Export Data
              </Button>
              <Button variant="destructive" onClick={logout} className="gap-2">
                Sign Out
              </Button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Total Registrants</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Submitted</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.submitted}</p>
                  </div>
                  <FileText className="w-8 h-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Approved</p>
                    <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Pending Review</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-600">
                      ₦{stats.revenue.toLocaleString()}
                    </p>
                  </div>
                  <BadgeCheck className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content with Tabs */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="applications" className="gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Applications</span>
            </TabsTrigger>
            <TabsTrigger value="fees" className="gap-2">
              <DollarSign className="w-4 h-4" />
              <span className="hidden sm:inline">Fee Management</span>
            </TabsTrigger>
            <TabsTrigger value="cohorts" className="gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Cohorts</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>

          {/* Applications Tab */}
          <TabsContent value="applications" className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Search */}
                  <div className="md:col-span-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        placeholder="Search by name, email, or application number..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Status Filter */}
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="declined">Declined</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Cohort Filter */}
                  <Select value={cohortFilter} onValueChange={setCohortFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by cohort" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Cohorts</SelectItem>
                      {cohorts?.map((cohort) => (
                        <SelectItem key={cohort.id} value={cohort.id.toString()}>
                          {cohort.name} {cohort.year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
                  <Filter className="w-4 h-4" />
                  <span>
                    Showing {filteredApplications.length} of {applications?.length || 0} applications
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Applications List */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : filteredApplications && filteredApplications.length > 0 ? (
              <div className="space-y-4">
                {filteredApplications.map((app) => (
                  <Card key={app.id} className="hover:shadow-lg transition-all duration-200">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <Users className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2 flex-wrap">
                                <h3 className="text-xl font-bold text-slate-900">
                                  {app.fullName}
                                </h3>
                                <span className="text-sm text-slate-500 font-mono">
                                  {app.applicationNumber}
                                </span>
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(app.admissionStatus)}`}>
                                  {getStatusIcon(app.admissionStatus)}
                                  {app.admissionStatus.toUpperCase()}
                                </span>
                              </div>
                              
                              <div className="flex flex-wrap gap-4 text-sm text-slate-600 mb-3">
                                <div className="flex items-center gap-1">
                                  <Mail className="w-4 h-4" />
                                  {app.email}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Phone className="w-4 h-4" />
                                  {app.mobileNumber}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-slate-50 rounded-lg p-4">
                            <div>
                              <p className="text-slate-500 mb-1">Cohort</p>
                              <p className="font-semibold text-slate-900">
                                {cohorts?.find(c => c.id === app.cohortId)?.name || `#${app.cohortId}`}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-500 mb-1">Tracks</p>
                              <p className="font-semibold text-slate-900">{app.selectedTracks.length} Track(s)</p>
                            </div>
                            <div>
                              <p className="text-slate-500 mb-1">Fee</p>
                              <p className="font-bold text-green-700">₦{parseFloat(app.applicationFee).toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 mb-1">Payment</p>
                              <p className="font-semibold text-slate-900 capitalize">{app.paymentStatus}</p>
                            </div>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-shrink-0"
                          onClick={() => setSelectedApp(app.id)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 text-lg mb-2">No applications found</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Fee Management Tab */}
          <TabsContent value="fees" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Update Cohort Application Fees</CardTitle>
                <CardDescription>
                  Change the application fee for each cohort. New fees will apply to all future payments.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="cohort-select">Select Cohort *</Label>
                    <Select 
                      value={selectedCohortForFee?.toString() || ""} 
                      onValueChange={(v) => setSelectedCohortForFee(parseInt(v))}
                    >
                      <SelectTrigger id="cohort-select">
                        <SelectValue placeholder="Choose a cohort..." />
                      </SelectTrigger>
                      <SelectContent>
                        {cohorts?.map((cohort) => (
                          <SelectItem key={cohort.id} value={cohort.id.toString()}>
                            {cohort.name} {cohort.year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="fee-amount">New Fee Amount (₦) *</Label>
                    <Input
                      id="fee-amount"
                      type="number"
                      placeholder="Enter amount (e.g., 100000)"
                      value={newFeeAmount}
                      onChange={(e) => setNewFeeAmount(e.target.value)}
                      min="0"
                      step="1000"
                    />
                    <p className="text-sm text-slate-500 mt-1">
                      Current default: ₦100,000
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="fee-description">Description (Optional)</Label>
                    <Textarea
                      id="fee-description"
                      placeholder="Enter fee description or reason for change..."
                      value={feeDescription}
                      onChange={(e) => setFeeDescription(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <Button 
                    onClick={handleUpdateFee}
                    disabled={!selectedCohortForFee || !newFeeAmount || updateFeeMutation.isPending}
                    className="w-full"
                    size="lg"
                  >
                    {updateFeeMutation.isPending && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    <Settings className="w-4 h-4 mr-2" />
                    Update Fee Configuration
                  </Button>
                </div>

                {/* Current Fees Display */}
                <div className="border-t pt-6">
                  <h4 className="font-semibold text-slate-900 mb-4">Current Fee Configuration</h4>
                  <div className="grid gap-3">
                    {cohorts?.map((cohort) => {
                      const cohortApps = applications?.filter(app => app.cohortId === cohort.id) || [];
                      const currentFee = cohortApps[0]?.applicationFee || "100000";
                      
                      return (
                        <div key={cohort.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                          <div>
                            <p className="font-medium text-slate-900">
                              {cohort.name} {cohort.year}
                            </p>
                            <p className="text-sm text-slate-600">
                              {cohortApps.length} application(s)
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-700">
                              ₦{parseFloat(currentFee).toLocaleString()}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedCohortForFee(cohort.id);
                                setNewFeeAmount(currentFee);
                              }}
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cohorts Tab */}
          <TabsContent value="cohorts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cohort Overview</CardTitle>
                <CardDescription>
                  View all cohorts, their application statistics, and revenue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cohortStats.map(({ cohort, applications: appCount, approved, revenue }) => (
                    <Card key={cohort.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-slate-900 mb-2">
                              {cohort.name} {cohort.year}
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-slate-600">Status</p>
                                <span className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${
                                  cohort.status === "open" 
                                    ? "bg-green-100 text-green-700" 
                                    : "bg-slate-100 text-slate-700"
                                }`}>
                                  {cohort.status.toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="text-slate-600">Applications</p>
                                <p className="font-semibold text-slate-900 mt-1">{appCount}</p>
                              </div>
                              <div>
                                <p className="text-slate-600">Approved</p>
                                <p className="font-semibold text-green-600 mt-1">{approved}</p>
                              </div>
                              <div>
                                <p className="text-slate-600">Revenue</p>
                                <p className="font-semibold text-green-700 mt-1">₦{revenue.toLocaleString()}</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-slate-600">Application Deadline</p>
                                <p className="font-semibold text-slate-900 mt-1">
                                  {new Date(cohort.applicationDeadline).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-slate-600">Start - End Date</p>
                                <p className="font-semibold text-slate-900 mt-1">
                                  {new Date(cohort.startDate).toLocaleDateString()} - {new Date(cohort.endDate).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Application Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                        <div>
                          <p className="font-semibold text-slate-900">Approved</p>
                          <p className="text-sm text-slate-600">Applications accepted</p>
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Clock className="w-8 h-8 text-yellow-600" />
                        <div>
                          <p className="font-semibold text-slate-900">Pending</p>
                          <p className="text-sm text-slate-600">Awaiting review</p>
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <XCircle className="w-8 h-8 text-red-600" />
                        <div>
                          <p className="font-semibold text-slate-900">Declined</p>
                          <p className="text-sm text-slate-600">Applications rejected</p>
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-red-600">{stats.declined}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-slate-600 mb-1">Total Revenue</p>
                      <p className="text-3xl font-bold text-green-600">
                        ₦{stats.revenue.toLocaleString()}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="font-semibold text-slate-900">Revenue by Cohort</p>
                      {cohortStats.map(({ cohort, revenue }) => (
                        <div key={cohort.id} className="flex items-center justify-between p-3 bg-slate-50 rounded">
                          <span className="text-sm text-slate-700">
                            {cohort.name} {cohort.year}
                          </span>
                          <span className="font-semibold text-green-700">
                            ₦{revenue.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* View Application Dialog */}
      <Dialog open={selectedApp !== null} onOpenChange={(open) => !open && setSelectedApp(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              Review complete application information
            </DialogDescription>
          </DialogHeader>

          {selectedApp && applications && (() => {
            const app = applications.find(a => a.id === selectedApp);
            if (!app) return <p>Application not found</p>;

            return (
              <div className="space-y-6">
                {/* Personal Information */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Full Name</p>
                      <p className="font-medium">{app.fullName}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Email</p>
                      <p className="font-medium">{app.email}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Mobile Number</p>
                      <p className="font-medium">{app.mobileNumber}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Application Number</p>
                      <p className="font-medium font-mono">{app.applicationNumber}</p>
                    </div>
                  </div>
                </div>

                {/* Programme Details */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    Programme Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Cohort</p>
                      <p className="font-medium">
                        {cohorts?.find(c => c.id === app.cohortId)?.name || `#${app.cohortId}`}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Participation Mode</p>
                      <p className="font-medium capitalize">{app.participationMode}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Selected Tracks</p>
                      <p className="font-medium">{app.selectedTracks.join(', ')}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Eligibility Category</p>
                      <p className="font-medium">{app.eligibilityCategory}</p>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Payment Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Application Fee</p>
                      <p className="font-bold text-green-700">₦{parseFloat(app.applicationFee).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Payment Status</p>
                      <p className="font-medium capitalize">{app.paymentStatus}</p>
                    </div>
                    {app.paymentReference && (
                      <div>
                        <p className="text-slate-500">Payment Reference</p>
                        <p className="font-medium font-mono text-xs">{app.paymentReference}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Statement of Purpose */}
                {app.statementOfPurpose && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Statement of Purpose
                    </h3>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{app.statementOfPurpose}</p>
                  </div>
                )}

                {/* Supporting Documents */}
                <DocumentsSection applicationId={app.id} />

                {/* Application Status */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Application Status
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Status</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(app.admissionStatus)}`}>
                        {app.admissionStatus.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-slate-500">Submitted At</p>
                      <p className="font-medium">
                        {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    {app.verifiedBy && (
                      <div>
                        <p className="text-slate-500">Verified By</p>
                        <p className="font-medium">{app.verifiedBy}</p>
                      </div>
                    )}
                    {app.dateOfApproval && (
                      <div>
                        <p className="text-slate-500">Date of Approval</p>
                        <p className="font-medium">
                          {new Date(app.dateOfApproval).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {app.remarks && (
                      <div className="col-span-2">
                        <p className="text-slate-500">Remarks</p>
                        <p className="font-medium">{app.remarks}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Review Actions */}
                <div className="border rounded-lg p-4 bg-slate-50">
                  <h3 className="font-semibold text-lg mb-3">Update Status</h3>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="review-status">Application Status</Label>
                      <Select value={reviewStatus} onValueChange={(val: any) => setReviewStatus(val)}>
                        <SelectTrigger id="review-status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="declined">Declined</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="review-remarks">Remarks (Optional)</Label>
                      <Textarea
                        id="review-remarks"
                        placeholder="Add any comments or feedback..."
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <Button
                      onClick={() => handleReview(app.id)}
                      disabled={isSubmitting || !reviewStatus}
                      className="w-full"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        'Update Application Status'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

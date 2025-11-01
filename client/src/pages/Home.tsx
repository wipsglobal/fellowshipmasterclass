import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl, APP_LOGO, APP_TITLE } from "@/const";
import { Link } from "wouter";
import { CheckCircle2, Users, Award, FileText, Zap } from "lucide-react";

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Navigation */}
      <nav className="border-b border-slate-200 bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            {APP_LOGO && <img src={"/ibakm-logo.png"} alt="Logo" className="h-8 w-8" />}
            <h1 className="text-xl font-bold text-slate-900">{APP_TITLE}</h1>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-slate-600">Welcome, {user?.name}</span>
                <Link href={user?.role === "admin" ? "/admin" : "/dashboard"}>
                  <Button variant="outline" size="sm">
                    {user?.role === "admin" ? "Admin Panel" : "Dashboard"}
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => logout()}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Professional Fellowship Certification Masterclass
          </h2>
          <p className="text-xl text-slate-600 mb-8">
            Elevate your professional credentials with our prestigious fellowship programmes:
            FIBAKM, FCBA, and FCKM
          </p>
          {!isAuthenticated ? (
            <div className="flex gap-4 justify-center">
              <Link href="/login">
                <Button variant="outline" size="lg">
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="lg">
                  Get Started
                </Button>
              </Link>
            </div>
          ) : (
            <Link href="/apply">
              <Button size="lg">Apply Now</Button>
            </Link>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <Award className="w-8 h-8 text-blue-600 mb-2" />
              <CardTitle>Three Fellowship Tracks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Choose from FIBAKM, FCBA, or FCKM based on your professional background and goals.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="w-8 h-8 text-blue-600 mb-2" />
              <CardTitle>Four Annual Cohorts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Apply for March, June, September, or December cohorts that suit your schedule.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="w-8 h-8 text-blue-600 mb-2" />
              <CardTitle>Flexible Participation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Choose between physical in-person or virtual online/hybrid access modes.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Requirements Section */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Eligibility Requirements</CardTitle>
            <CardDescription>
              You must meet one of the following categories to apply
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-900">PhD Holders</p>
                  <p className="text-sm text-slate-600">PhD in Business Administration/Management + 5 years post-doctoral experience</p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-900">MBA Graduates</p>
                  <p className="text-sm text-slate-600">Bachelor's + MBA + 10 years post-master experience</p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-900">Professional Certified</p>
                  <p className="text-sm text-slate-600">Bachelor's + Professional Certification (ACA/ACCA/ACIS/ACIB) + 15 years experience</p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-900">Experienced Professionals</p>
                  <p className="text-sm text-slate-600">Bachelor's + 15-25 years professional experience</p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-900">CIBAKM Members</p>
                  <p className="text-sm text-slate-600">Existing CIBAKM® Certified Business Administrator Members</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Application Process */}
        <Card>
          <CardHeader>
            <CardTitle>Application Process</CardTitle>
            <CardDescription>
              Simple steps to submit your fellowship application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">1</div>
                <div>
                  <p className="font-medium text-slate-900">Create Account</p>
                  <p className="text-sm text-slate-600">Sign up or login to access the application form</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">2</div>
                <div>
                  <p className="font-medium text-slate-900">Complete Application</p>
                  <p className="text-sm text-slate-600">Fill in all required sections with your professional information</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">3</div>
                <div>
                  <p className="font-medium text-slate-900">Upload Documents</p>
                  <p className="text-sm text-slate-600">Submit academic, professional certificates, CV, and identification</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">4</div>
                <div>
                  <p className="font-medium text-slate-900">Pay Application Fee</p>
                  <p className="text-sm text-slate-600">Complete payment via Paystack (online payment gateway)</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">5</div>
                <div>
                  <p className="font-medium text-slate-900">Await Decision</p>
                  <p className="text-sm text-slate-600">Track your application status in your dashboard</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-slate-600">
          <p>&copy; 2024 Institute of Business Administration and Knowledge Management (IBAKM®). All rights reserved.</p>
          <p className="text-sm mt-2">Data Protection: All personal data is processed in accordance with NDPA 2023 and GDPR standards.</p>
        </div>
      </footer>
    </div>
  );
}

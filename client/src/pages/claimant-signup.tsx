import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, FileText, Camera, Smartphone } from "lucide-react";
import { Link } from "wouter";

export default function ClaimantSignup() {
  const handleSignup = () => {
    // Set role preference in localStorage before redirecting to auth
    localStorage.setItem('pendingUserRole', 'claimant');
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-100">
      {/* Header */}
      <nav className="bg-white border-b border-neutral-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Shield className="text-white h-4 w-4" />
              </div>
              <span className="text-xl font-bold text-neutral-800">ClaimFlow AI</span>
            </div>
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/broker-signup">
              <Button variant="ghost" className="text-neutral-600 hover:text-primary">
                Broker Portal
              </Button>
            </Link>
            <Link href="/adjudicator-signup">
              <Button variant="ghost" className="text-neutral-600 hover:text-primary">
                Adjudicator Portal
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="text-neutral-800">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="text-white h-8 w-8" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Submit Your Insurance Claim
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get your motor accident claim processed quickly with our AI-powered platform. 
            Upload photos, track progress, and get faster settlements.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <Card className="text-center">
            <CardHeader>
              <Camera className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <CardTitle className="text-lg">AI Photo Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Upload damage photos and get instant AI-powered assessment of vehicle damage.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Smartphone className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <CardTitle className="text-lg">Mobile Friendly</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Submit claims directly from your phone at the accident scene or from anywhere.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Shield className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <CardTitle className="text-lg">Secure & Fast</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Your data is protected with enterprise-grade security and processed within hours.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sign Up Section */}
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Start Your Claim</CardTitle>
            <p className="text-gray-600">
              Sign up to submit your motor accident claim and track its progress.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleSignup}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
              size="lg"
            >
              <span className="mr-2">🚗</span>
              Sign Up with Google
            </Button>
            
            <div className="text-center text-sm text-gray-500">
              <p>Already have an account?</p>
              <Button variant="link" onClick={handleSignup} className="p-0 h-auto text-blue-600">
                Sign In Here
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* What You'll Need */}
        <div className="mt-12 bg-blue-50 rounded-lg p-6 max-w-2xl mx-auto">
          <h3 className="font-semibold text-blue-900 mb-3">What You'll Need:</h3>
          <ul className="text-blue-800 space-y-2 text-sm">
            <li>• Photos of vehicle damage (multiple angles)</li>
            <li>• Insurance policy number</li>
            <li>• Driver's license information</li>
            <li>• Accident details (date, time, location)</li>
            <li>• Other party information (if applicable)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
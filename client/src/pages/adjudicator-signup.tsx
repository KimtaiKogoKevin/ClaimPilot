import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Scale, Eye, CheckCircle } from "lucide-react";
import { Link } from "wouter";

export default function AdjudicatorSignup() {
  const handleSignup = () => {
    // Set role preference in localStorage before redirecting to auth
    localStorage.setItem('pendingUserRole', 'adjudicator');
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
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
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Scale className="text-white h-8 w-8" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Claims Adjudicator Portal
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Join ClaimFlow AI as a professional adjudicator to evaluate claims with 
            AI-powered insights and make informed decisions.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <Card className="text-center">
            <CardHeader>
              <Eye className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <CardTitle className="text-lg">AI-Assisted Review</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Leverage computer vision and AI analysis to assess vehicle damage accurately.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <CheckCircle className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <CardTitle className="text-lg">Decision Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Access comprehensive claim data and automated risk assessments.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Scale className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <CardTitle className="text-lg">Fair Evaluation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Ensure consistent and unbiased claim evaluations with AI support.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sign Up Section */}
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Get Started as an Adjudicator</CardTitle>
            <p className="text-gray-600">
              Sign up with your professional credentials to access the adjudicator portal.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleSignup}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
              size="lg"
            >
              <span className="mr-2">⚖️</span>
              Sign Up with Google
            </Button>
            
            <div className="text-center text-sm text-gray-500">
              <p>Already have an account?</p>
              <Button variant="link" onClick={handleSignup} className="p-0 h-auto text-green-600">
                Sign In Here
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Requirements */}
        <div className="mt-12 bg-green-50 rounded-lg p-6 max-w-2xl mx-auto">
          <h3 className="font-semibold text-green-900 mb-3">Adjudicator Requirements:</h3>
          <ul className="text-green-800 space-y-2 text-sm">
            <li>• Professional insurance adjudicator certification</li>
            <li>• Minimum 2 years of claims experience</li>
            <li>• Completion of platform training modules</li>
            <li>• Background verification and compliance check</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
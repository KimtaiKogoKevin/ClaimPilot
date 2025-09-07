import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, FileText, TrendingUp } from "lucide-react";
import { Link } from "wouter";

export default function BrokerSignup() {
  const handleSignup = () => {
    // Set role preference in localStorage before redirecting to auth
    localStorage.setItem('pendingUserRole', 'broker');
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
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
            <Users className="text-white h-8 w-8" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Insurance Broker Portal
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Join ClaimFlow AI as an insurance broker to streamline your claims management 
            and provide exceptional service to your clients.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <Card className="text-center">
            <CardHeader>
              <FileText className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <CardTitle className="text-lg">Claims Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Review and process client claims efficiently with our AI-powered dashboard.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <TrendingUp className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <CardTitle className="text-lg">Analytics & Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Track claim trends, processing times, and client satisfaction metrics.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <CardTitle className="text-lg">Client Portal</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Provide your clients with real-time updates on their claim status.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sign Up Section */}
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Get Started as a Broker</CardTitle>
            <p className="text-gray-600">
              Sign up with your professional credentials to access the broker portal.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleSignup}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
              size="lg"
            >
              <span className="mr-2">🔒</span>
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

        {/* Requirements */}
        <div className="mt-12 bg-blue-50 rounded-lg p-6 max-w-2xl mx-auto">
          <h3 className="font-semibold text-blue-900 mb-3">Broker Requirements:</h3>
          <ul className="text-blue-800 space-y-2 text-sm">
            <li>• Valid insurance broker license</li>
            <li>• Professional email address</li>
            <li>• Completion of verification process</li>
            <li>• Agreement to platform terms of service</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
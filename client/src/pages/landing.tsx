import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Brain, Smartphone, Clock } from "lucide-react";

export default function Landing() {
  const handleStartClaim = () => {
    window.location.href = "/claim";
  };

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const handleStaffPortal = () => {
    window.location.href = "/staff";
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <nav className="bg-white border-b border-neutral-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Shield className="text-white h-4 w-4" />
            </div>
            <span className="text-xl font-bold text-neutral-800">ClaimFlow AI</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" className="text-neutral-600 hover:text-primary">
              Help
            </Button>
            <Button
              variant="outline"
              onClick={handleStaffPortal}
              className="bg-neutral-100 text-neutral-800 hover:bg-neutral-200"
            >
              Staff Portal
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary to-blue-700 text-white">
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                AI-Powered Motor<br/>Insurance Claims
              </h1>
              <p className="text-xl mb-8 text-blue-100">
                Submit your claim in minutes with our intelligent platform. 
                Our AI analyzes damage instantly for faster processing.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleStartClaim}
                  size="lg"
                  className="bg-white text-primary hover:bg-neutral-50 transform hover:scale-105 transition-all shadow-lg"
                >
                  <span className="mr-2">+</span>
                  Start New Claim
                </Button>
                <Button
                  variant="outline"
                  onClick={handleLogin}
                  size="lg"
                  className="border-2 border-white bg-white bg-opacity-10 text-white hover:bg-white hover:text-primary font-semibold"
                >
                  <span className="mr-2">G</span>
                  Sign In with Google
                </Button>
              </div>
            </div>
            <div className="hidden lg:block">
              <img
                src="https://images.unsplash.com/photo-1544717297-fa95b6ee9643?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=600"
                alt="Insurance professional documenting car accident damage with tablet"
                className="rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-neutral-800 mb-4">Why Choose ClaimFlow AI?</h2>
          <p className="text-xl text-neutral-600">Advanced technology meets insurance expertise</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="text-center p-6 border-none shadow-sm">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-ai-purple rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <Brain className="text-white h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3">AI Damage Analysis</h3>
              <p className="text-neutral-600">Our computer vision instantly identifies and assesses vehicle damage from photos</p>
            </CardContent>
          </Card>
          <Card className="text-center p-6 border-none shadow-sm">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-secondary rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <Smartphone className="text-white h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Mobile Optimized</h3>
              <p className="text-neutral-600">Submit claims on-the-go with our mobile-first guided photo capture</p>
            </CardContent>
          </Card>
          <Card className="text-center p-6 border-none shadow-sm">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-primary rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <Clock className="text-white h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Faster Processing</h3>
              <p className="text-neutral-600">Intelligent forms and automated analysis reduce processing time by 60%</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

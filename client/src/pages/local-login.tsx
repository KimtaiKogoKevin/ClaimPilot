import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, User, Mail } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function LocalLogin() {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: ''
  });
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest('/api/auth/local-login', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Logged in successfully!",
      });
      window.location.href = "/";
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }
    loginMutation.mutate(formData);
  };

  const handleChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <Shield className="text-white h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-800">ClaimFlow AI</h1>
          <p className="text-neutral-600 mt-2">Local Development Login</p>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Developer Access
            </CardTitle>
            <CardDescription>
              Enter your details to access the claims platform locally
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" className="flex items-center gap-2 mb-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange('email')}
                  placeholder="developer@example.com"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={handleChange('firstName')}
                    placeholder="John"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={handleChange('lastName')}
                    placeholder="Doe"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Logging in..." : "Enter Platform"}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-neutral-100 rounded-lg">
              <h4 className="font-medium text-sm text-neutral-800 mb-2">Development Notes:</h4>
              <ul className="text-xs text-neutral-600 space-y-1">
                <li>• This is a simplified login for local development</li>
                <li>• In production, this uses Google OAuth via Replit</li>
                <li>• Your session will persist for 7 days</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
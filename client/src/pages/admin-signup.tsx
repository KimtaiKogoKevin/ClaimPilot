import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Shield, Mail, Lock, User, Building2, FileCheck, Users, BarChart3, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

const adminSignupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Please confirm your password"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  companyName: z.string().min(1, "Company name is required"),
  companyType: z.enum(['insurance_company', 'broker', 'other'], {
    required_error: "Please select a company type",
  }),
  businessRegistrationNumber: z.string().optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  reason: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type AdminSignupForm = z.infer<typeof adminSignupSchema>;

export default function AdminSignupPage() {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);

  const form = useForm<AdminSignupForm>({
    resolver: zodResolver(adminSignupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      companyName: "",
      companyType: undefined,
      businessRegistrationNumber: "",
      phoneNumber: "",
      address: "",
      reason: "",
    }
  });

  const signupMutation = useMutation({
    mutationFn: async (data: AdminSignupForm) => {
      const response = await apiRequest("POST", "/api/auth/signup/admin", data);
      return response.json();
    },
    onSuccess: () => {
      setApplicationSubmitted(true);
      toast({
        title: "Application Submitted",
        description: "Your admin access request has been submitted for review.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to submit application",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (data: AdminSignupForm) => {
    signupMutation.mutate(data);
  };

  if (applicationSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg shadow-xl">
          <CardHeader className="space-y-2 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold">
              Application Submitted
            </CardTitle>
            <CardDescription>
              Your admin access request is pending approval
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <Alert>
              <AlertDescription className="text-center">
                Thank you for applying for admin access. Our team will review your application 
                and verify your business credentials. You will receive an email notification 
                once your account has been approved.
              </AlertDescription>
            </Alert>

            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-gray-900">What happens next?</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start space-x-2">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">1</span>
                  <span>Our team will verify your business registration details</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">2</span>
                  <span>We may contact you for additional information if needed</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">3</span>
                  <span>You'll receive an email once your account is approved</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">4</span>
                  <span>Approval typically takes 1-3 business days</span>
                </li>
              </ul>
            </div>

            <div className="text-center space-y-2 pt-4 border-t">
              <Link href="/auth">
                <Button variant="outline" className="w-full" data-testid="button-back-to-signin">
                  Back to Sign In
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-6 text-center lg:text-left lg:sticky lg:top-8">
          <div className="space-y-2">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900">
              Partner With Us
            </h1>
            <h2 className="text-3xl lg:text-4xl font-bold text-blue-600">
              Streamline Claims
            </h2>
          </div>
          
          <p className="text-lg text-gray-600 max-w-md mx-auto lg:mx-0">
            Join our platform as an insurance company or broker. Access powerful tools 
            for claims management, AI-powered damage assessment, and comprehensive analytics.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto lg:mx-0">
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
              <FileCheck className="h-8 w-8 text-blue-500" />
              <div>
                <div className="font-semibold text-sm">Claims Management</div>
                <div className="text-xs text-gray-500">Review & approve claims</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
              <BarChart3 className="h-8 w-8 text-green-500" />
              <div>
                <div className="font-semibold text-sm">Analytics Dashboard</div>
                <div className="text-xs text-gray-500">Insights & reporting</div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
              <Users className="h-8 w-8 text-purple-500" />
              <div>
                <div className="font-semibold text-sm">User Management</div>
                <div className="text-xs text-gray-500">Manage team access</div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
              <Shield className="h-8 w-8 text-indigo-500" />
              <div>
                <div className="font-semibold text-sm">Secure Platform</div>
                <div className="text-xs text-gray-500">Enterprise security</div>
              </div>
            </div>
          </div>

          <Alert className="max-w-md mx-auto lg:mx-0">
            <AlertDescription className="text-sm">
              <strong>Approval Process:</strong> Admin accounts require verification. 
              Our team will review your business credentials before granting access. 
              This typically takes 1-3 business days.
            </AlertDescription>
          </Alert>
        </div>

        <Card className="w-full max-w-lg mx-auto shadow-xl">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl font-bold text-center">
              Apply for Admin Access
            </CardTitle>
            <CardDescription className="text-center">
              Register your insurance company or brokerage
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span>First Name</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            data-testid="input-first-name"
                            placeholder="John" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input 
                            data-testid="input-last-name"
                            placeholder="Doe" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2">
                        <Mail className="h-4 w-4" />
                        <span>Email</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          data-testid="input-email"
                          placeholder="john.doe@company.com" 
                          type="email"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2">
                        <Building2 className="h-4 w-4" />
                        <span>Company Name</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          data-testid="input-company-name"
                          placeholder="ABC Insurance Ltd" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="companyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-company-type">
                            <SelectValue placeholder="Select company type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="insurance_company">Insurance Company</SelectItem>
                          <SelectItem value="broker">Broker</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="businessRegistrationNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Registration Number (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          data-testid="input-registration-number"
                          placeholder="e.g., BN-123456789" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          data-testid="input-phone-number"
                          placeholder="+1 (555) 000-0000" 
                          type="tel"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Address (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          data-testid="input-address"
                          placeholder="123 Business St, City, Country" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2">
                        <Lock className="h-4 w-4" />
                        <span>Password</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            data-testid="input-password"
                            placeholder="Choose a strong password" 
                            type={showPassword ? "text" : "password"}
                            {...field} 
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowPassword(!showPassword)}
                            data-testid="button-toggle-password"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            data-testid="input-confirm-password"
                            placeholder="Confirm your password" 
                            type={showConfirmPassword ? "text" : "password"}
                            {...field} 
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            data-testid="button-toggle-confirm-password"
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason for Admin Access (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          data-testid="textarea-reason"
                          placeholder="Tell us why you need admin access and how you plan to use the platform..."
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={signupMutation.isPending}
                  data-testid="button-submit-application"
                >
                  {signupMutation.isPending ? "Submitting Application..." : "Submit Application"}
                </Button>

                <div className="text-center space-y-2 pt-4 border-t">
                  <p className="text-sm text-gray-600">
                    Already have an account?{" "}
                    <Link href="/auth" className="text-blue-600 hover:text-blue-800 font-medium" data-testid="link-signin">
                      Sign In
                    </Link>
                  </p>
                  <p className="text-sm text-gray-600">
                    Are you a claimant?{" "}
                    <Link href="/auth/insured" className="text-blue-600 hover:text-blue-800 font-medium" data-testid="link-insured-signup">
                      Create Insured Account
                    </Link>
                  </p>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

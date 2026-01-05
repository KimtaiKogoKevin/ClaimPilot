import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Shield, Mail, Lock, User, FileText, Clock, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

const insuredSignupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Please confirm your password"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type InsuredSignupForm = z.infer<typeof insuredSignupSchema>;

export default function InsuredSignupPage() {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<InsuredSignupForm>({
    resolver: zodResolver(insuredSignupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
    }
  });

  const signupMutation = useMutation({
    mutationFn: async (data: InsuredSignupForm) => {
      const response = await apiRequest("POST", "/api/auth/signup/insured", data);
      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem("auth_token", data.token);
      toast({
        title: "Registration Successful",
        description: "Welcome to Motor Claims Platform!",
      });
      window.location.href = "/";
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (data: InsuredSignupForm) => {
    signupMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        <div className="space-y-6 text-center lg:text-left">
          <div className="space-y-2">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900">
              File Your Claims
            </h1>
            <h2 className="text-3xl lg:text-4xl font-bold text-blue-600">
              With Confidence
            </h2>
          </div>
          
          <p className="text-lg text-gray-600 max-w-md mx-auto lg:mx-0">
            Create your insured account to submit motor accident claims, track their progress, 
            and receive fast settlements with our AI-powered platform.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto lg:mx-0">
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
              <FileText className="h-8 w-8 text-blue-500" />
              <div>
                <div className="font-semibold text-sm">Easy Claims</div>
                <div className="text-xs text-gray-500">Simple submission process</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
              <Clock className="h-8 w-8 text-green-500" />
              <div>
                <div className="font-semibold text-sm">Fast Processing</div>
                <div className="text-xs text-gray-500">AI-powered assessment</div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
              <Shield className="h-8 w-8 text-purple-500" />
              <div>
                <div className="font-semibold text-sm">Secure Platform</div>
                <div className="text-xs text-gray-500">Your data is protected</div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
              <CheckCircle className="h-8 w-8 text-indigo-500" />
              <div>
                <div className="font-semibold text-sm">Track Progress</div>
                <div className="text-xs text-gray-500">Real-time updates</div>
              </div>
            </div>
          </div>
        </div>

        <Card className="w-full max-w-md mx-auto shadow-xl">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl font-bold text-center">
              Create Insured Account
            </CardTitle>
            <CardDescription className="text-center">
              Sign up to start filing your motor accident claims
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
                          placeholder="john.doe@example.com" 
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

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={signupMutation.isPending}
                  data-testid="button-submit-signup"
                >
                  {signupMutation.isPending ? "Creating Account..." : "Create Account"}
                </Button>

                <div className="text-center space-y-2 pt-4 border-t">
                  <p className="text-sm text-gray-600">
                    Already have an account?{" "}
                    <Link href="/auth" className="text-blue-600 hover:text-blue-800 font-medium" data-testid="link-signin">
                      Sign In
                    </Link>
                  </p>
                  <p className="text-sm text-gray-600">
                    Are you an insurance company or broker?{" "}
                    <Link href="/auth/admin" className="text-blue-600 hover:text-blue-800 font-medium" data-testid="link-admin-signup">
                      Apply for Admin Access
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

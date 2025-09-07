import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff, Shield, Mail, Lock, User, UserCheck, ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

// Validation schemas
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  twoFactorCode: z.string().optional()
});

const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Please confirm your password"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum(['insured', 'insurer', 'broker', 'service_provider']).default('insured')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address")
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Please confirm your password")
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;
type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;
type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  
  // Check if we have a reset token in URL
  const urlParams = new URLSearchParams(window.location.search);
  const resetToken = urlParams.get('reset');

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      twoFactorCode: ""
    }
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      role: "insured"
    }
  });

  const forgotPasswordForm = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: ""
    }
  });

  const resetPasswordForm = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: resetToken || "",
      password: "",
      confirmPassword: ""
    }
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        toast({
          title: "Two-Factor Authentication Required",
          description: "Please enter your 6-digit authentication code",
        });
        return;
      }

      localStorage.setItem("auth_token", data.token);
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
      // Force page reload to ensure authentication state is updated
      window.location.href = "/";
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    }
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      const response = await apiRequest("POST", "/api/auth/register", data);
      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem("auth_token", data.token);
      toast({
        title: "Registration Successful",
        description: "Welcome to Motor Claims Platform!",
      });
      // Force page reload to ensure authentication state is updated
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

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordForm) => {
      const response = await apiRequest("POST", "/api/auth/forgot-password", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Password Reset Email Sent",
        description: data.message,
      });
      // In development, show the reset URL
      if (data.resetUrl) {
        console.log('Reset URL:', data.resetUrl);
        setTimeout(() => {
          window.location.href = data.resetUrl;
        }, 2000);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email",
        variant: "destructive",
      });
    }
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPasswordForm) => {
      const response = await apiRequest("POST", "/api/auth/reset-password", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Password Reset Successful",
        description: data.message,
      });
      // Clear URL params and show login form
      window.history.replaceState({}, document.title, "/auth");
      setShowResetPassword(false);
    },
    onError: (error: any) => {
      toast({
        title: "Password Reset Failed",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    }
  });

  const handleLogin = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  const handleRegister = (data: RegisterForm) => {
    registerMutation.mutate(data);
  };

  const handleForgotPassword = (data: ForgotPasswordForm) => {
    forgotPasswordMutation.mutate(data);
  };

  const handleResetPassword = (data: ResetPasswordForm) => {
    resetPasswordMutation.mutate(data);
  };

  // Show reset password form if we have a token
  if (resetToken && !showResetPassword) {
    setShowResetPassword(true);
    setShowForgotPassword(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Hero Section */}
        <div className="space-y-6 text-center lg:text-left">
          <div className="space-y-2">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900">
              AI-Powered Claims
            </h1>
            <h2 className="text-3xl lg:text-4xl font-bold text-blue-600">
              Made Simple
            </h2>
          </div>
          
          <p className="text-lg text-gray-600 max-w-md mx-auto lg:mx-0">
            Streamline your motor accident claims with intelligent damage assessment, 
            automated processing, and secure document management.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto lg:mx-0">
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
              <Shield className="h-8 w-8 text-green-500" />
              <div>
                <div className="font-semibold text-sm">Secure Platform</div>
                <div className="text-xs text-gray-500">End-to-end encryption</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
              <UserCheck className="h-8 w-8 text-blue-500" />
              <div>
                <div className="font-semibold text-sm">Role-Based Access</div>
                <div className="text-xs text-gray-500">Tailored dashboards</div>
              </div>
            </div>
          </div>
        </div>

        {/* Authentication Form */}
        <Card className="w-full max-w-md mx-auto shadow-xl">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl font-bold text-center">
              Welcome
            </CardTitle>
            <CardDescription className="text-center">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="login" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="register">Create Account</TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login" className="space-y-4">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center space-x-2">
                            <Mail className="h-4 w-4" />
                            <span>Email</span>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your email" 
                              type="email"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={loginForm.control}
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
                                placeholder="Enter your password" 
                                type={showPassword ? "text" : "password"}
                                {...field} 
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {requiresTwoFactor && (
                      <FormField
                        control={loginForm.control}
                        name="twoFactorCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center space-x-2">
                              <Shield className="h-4 w-4" />
                              <span>Two-Factor Code</span>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter 6-digit code" 
                                maxLength={6}
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Signing In..." : "Sign In"}
                    </Button>

                    <div className="text-center">
                      <Button
                        type="button"
                        variant="link"
                        className="text-sm text-blue-600 hover:text-blue-800"
                        onClick={() => setShowForgotPassword(true)}
                      >
                        Forgot your password?
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register" className="space-y-4">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={registerForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center space-x-2">
                            <Mail className="h-4 w-4" />
                            <span>Email</span>
                          </FormLabel>
                          <FormControl>
                            <Input 
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
                      control={registerForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center space-x-2">
                            <User className="h-4 w-4" />
                            <span>Role</span>
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="insured">Insured/Client</SelectItem>
                              <SelectItem value="broker">Broker/Agent</SelectItem>
                              <SelectItem value="insurer">Insurer/Underwriter</SelectItem>
                              <SelectItem value="service_provider">Service Provider</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
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
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
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
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Creating Account..." : "Create Account"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Forgot Password Modal */}
        {showForgotPassword && (
          <Card className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md mx-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Reset Password</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowForgotPassword(false)}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription>
                    Enter your email address and we'll send you a link to reset your password.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...forgotPasswordForm}>
                    <form onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)} className="space-y-4">
                      <FormField
                        control={forgotPasswordForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your email" 
                                type="email"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1"
                          onClick={() => setShowForgotPassword(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          className="flex-1" 
                          disabled={forgotPasswordMutation.isPending}
                        >
                          {forgotPasswordMutation.isPending ? "Sending..." : "Send Reset Link"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </Card>
        )}

        {/* Reset Password Modal */}
        {showResetPassword && (
          <Card className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md mx-4">
              <Card>
                <CardHeader>
                  <CardTitle>Set New Password</CardTitle>
                  <CardDescription>
                    Enter your new password below.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...resetPasswordForm}>
                    <form onSubmit={resetPasswordForm.handleSubmit(handleResetPassword)} className="space-y-4">
                      <FormField
                        control={resetPasswordForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  placeholder="Enter new password" 
                                  type={showPassword ? "text" : "password"}
                                  {...field} 
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3"
                                  onClick={() => setShowPassword(!showPassword)}
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
                        control={resetPasswordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  placeholder="Confirm new password" 
                                  type={showConfirmPassword ? "text" : "password"}
                                  {...field} 
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                        disabled={resetPasswordMutation.isPending}
                      >
                        {resetPasswordMutation.isPending ? "Updating Password..." : "Update Password"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
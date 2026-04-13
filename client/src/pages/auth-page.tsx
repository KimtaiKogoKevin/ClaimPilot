import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Eye, EyeOff, Shield, Mail, Lock, User, UserCheck, ArrowLeft,
  Brain, Zap, CheckCircle, ArrowRight
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  twoFactorCode: z.string().optional()
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address")
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Please confirm your password")
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginForm = z.infer<typeof loginSchema>;
type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;
type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

const BRAND_FEATURES = [
  { icon: Brain, text: "AI damage assessment from photos" },
  { icon: Zap, text: "Faster claims processing — up to 60%" },
  { icon: Shield, text: "Enterprise-grade security & encryption" },
  { icon: CheckCircle, text: "Real-time status tracking" },
];

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  const urlParams = new URLSearchParams(window.location.search);
  const resetToken = urlParams.get('reset');

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", twoFactorCode: "" }
  });

  const forgotPasswordForm = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" }
  });

  const resetPasswordForm = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token: resetToken || "", password: "", confirmPassword: "" }
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const res = await apiRequest("POST", "/api/auth/login", data);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        toast({ title: "Two-factor authentication required", description: "Enter your 6-digit code." });
        return;
      }
      localStorage.setItem("auth_token", data.token);
      toast({ title: "Signed in", description: "Welcome back!" });
      window.location.href = "/";
    },
    onError: (error: any) => {
      toast({ title: "Sign in failed", description: error.message || "Invalid credentials", variant: "destructive" });
    }
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordForm) => {
      const res = await apiRequest("POST", "/api/auth/forgot-password", data);
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Reset email sent", description: data.message });
      if (data.resetUrl) {
        setTimeout(() => { window.location.href = data.resetUrl; }, 2000);
      }
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to send reset email", variant: "destructive" });
    }
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPasswordForm) => {
      const res = await apiRequest("POST", "/api/auth/reset-password", data);
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Password updated", description: data.message });
      window.history.replaceState({}, document.title, "/auth");
      setShowResetPassword(false);
    },
    onError: (error: any) => {
      toast({ title: "Reset failed", description: error.message || "Failed to reset password", variant: "destructive" });
    }
  });

  if (resetToken && !showResetPassword) {
    setShowResetPassword(true);
    setShowForgotPassword(false);
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left brand panel ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-12 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-violet-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="flex items-center gap-2.5 relative z-10">
          <div className="w-9 h-9 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <Shield className="text-white h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">ClaimFlow <span className="text-blue-400">AI</span></span>
        </div>

        {/* Headline */}
        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight mb-4">
              Motor claims,<br />
              <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                resolved faster
              </span>
            </h1>
            <p className="text-slate-300 text-lg leading-relaxed max-w-sm">
              Submit a claim in minutes. AI assesses the damage, insurers get everything they need instantly.
            </p>
          </div>

          <ul className="space-y-4">
            {BRAND_FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="h-4 w-4 text-blue-300" />
                </div>
                <span className="text-slate-200 text-sm">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom tagline */}
        <p className="text-slate-500 text-xs relative z-10">&copy; {new Date().getFullYear()} ClaimFlow AI. All rights reserved.</p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-sm mx-auto">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-700 rounded-lg flex items-center justify-center">
              <Shield className="text-white h-4 w-4" />
            </div>
            <span className="text-lg font-bold">ClaimFlow <span className="text-primary">AI</span></span>
          </div>

          {/* ── Forgot password overlay ── */}
          {showForgotPassword && (
            <div className="animate-fade-in">
              <button
                onClick={() => setShowForgotPassword(false)}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </button>
              <h2 className="text-2xl font-bold text-foreground mb-1">Reset your password</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Enter your email and we'll send you a reset link.
              </p>
              <Form {...forgotPasswordForm}>
                <form onSubmit={forgotPasswordForm.handleSubmit(d => forgotPasswordMutation.mutate(d))} className="space-y-4">
                  <FormField control={forgotPasswordForm.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email address</FormLabel>
                      <FormControl>
                        <Input placeholder="you@example.com" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full gap-2" disabled={forgotPasswordMutation.isPending}>
                    {forgotPasswordMutation.isPending ? "Sending…" : "Send reset link"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </form>
              </Form>
            </div>
          )}

          {/* ── Reset password ── */}
          {showResetPassword && !showForgotPassword && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-foreground mb-1">Set new password</h2>
              <p className="text-sm text-muted-foreground mb-6">Choose a strong password for your account.</p>
              <Form {...resetPasswordForm}>
                <form onSubmit={resetPasswordForm.handleSubmit(d => resetPasswordMutation.mutate(d))} className="space-y-4">
                  <FormField control={resetPasswordForm.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel>New password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input placeholder="At least 8 characters" type={showPassword ? "text" : "password"} {...field} />
                          <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={resetPasswordForm.control} name="confirmPassword" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input placeholder="Repeat password" type={showConfirmPassword ? "text" : "password"} {...field} />
                          <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full" disabled={resetPasswordMutation.isPending}>
                    {resetPasswordMutation.isPending ? "Updating…" : "Update password"}
                  </Button>
                </form>
              </Form>
            </div>
          )}

          {/* ── Main login / register ── */}
          {!showForgotPassword && !showResetPassword && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-foreground mb-1">
                {activeTab === 'login' ? 'Welcome back' : 'Create an account'}
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                {activeTab === 'login'
                  ? "Sign in to access your claims dashboard."
                  : "Choose your account type to get started."}
              </p>

              {/* Tab pills */}
              <div className="flex gap-1 bg-muted rounded-lg p-1 mb-6">
                {(['login', 'register'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all duration-150 ${
                      activeTab === tab
                        ? 'bg-white text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab === 'login' ? 'Sign in' : 'Create account'}
                  </button>
                ))}
              </div>

              {/* Login form */}
              {activeTab === 'login' && (
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(d => loginMutation.mutate(d))} className="space-y-4">
                    <FormField control={loginForm.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input className="pl-10" placeholder="you@example.com" type="email" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={loginForm.control} name="password" render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between mb-1.5">
                          <FormLabel className="mb-0">Password</FormLabel>
                          <button type="button" onClick={() => setShowForgotPassword(true)} className="text-xs text-primary hover:underline">
                            Forgot password?
                          </button>
                        </div>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input className="pl-10 pr-10" placeholder="Your password" type={showPassword ? "text" : "password"} {...field} />
                            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {requiresTwoFactor && (
                      <FormField control={loginForm.control} name="twoFactorCode" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Two-factor code</FormLabel>
                          <FormControl>
                            <Input placeholder="6-digit code" maxLength={6} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    )}

                    <Button type="submit" className="w-full gap-2 mt-2" disabled={loginMutation.isPending}>
                      {loginMutation.isPending ? "Signing in…" : "Sign in"}
                      {!loginMutation.isPending && <ArrowRight className="h-4 w-4" />}
                    </Button>
                  </form>
                </Form>
              )}

              {/* Register choices */}
              {activeTab === 'register' && (
                <div className="space-y-3 animate-fade-in">
                  <button
                    onClick={() => setLocation("/auth/insured")}
                    data-testid="signup-insured-btn"
                    className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-all duration-150 text-left group"
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-foreground">I'm a policy holder</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Submit and track motor accident claims</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                  </button>

                  <button
                    onClick={() => setLocation("/auth/admin")}
                    data-testid="signup-admin-btn"
                    className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-all duration-150 text-left group"
                  >
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-200 transition-colors">
                      <Shield className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-foreground">I'm an insurer / broker</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Request admin access to manage claims</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                  </button>

                  <p className="text-xs text-center text-muted-foreground pt-2">
                    Admin accounts require approval from existing administrators
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

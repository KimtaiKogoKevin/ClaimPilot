import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Shield, Mail, Lock, User, FileText, Clock, CheckCircle, ArrowRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

const insuredSignupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Please confirm your password"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type InsuredSignupForm = z.infer<typeof insuredSignupSchema>;

const PERKS = [
  { icon: FileText,    color: "bg-blue-100 text-blue-600",    text: "Guided multi-step claim forms" },
  { icon: Clock,       color: "bg-emerald-100 text-emerald-600", text: "AI damage assessment in minutes" },
  { icon: Shield,      color: "bg-violet-100 text-violet-600",  text: "Secure, encrypted document storage" },
  { icon: CheckCircle, color: "bg-amber-100 text-amber-600",   text: "Real-time claim status tracking" },
];

export default function InsuredSignupPage() {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<InsuredSignupForm>({
    resolver: zodResolver(insuredSignupSchema),
    defaultValues: { email: "", password: "", confirmPassword: "", firstName: "", lastName: "" }
  });

  const signupMutation = useMutation({
    mutationFn: async (data: InsuredSignupForm) => {
      const res = await apiRequest("POST", "/api/auth/signup/insured", data);
      return res.json();
    },
    onSuccess: (data) => {
      localStorage.setItem("auth_token", data.token);
      toast({ title: "Account created", description: "Welcome to ClaimFlow AI!" });
      window.location.href = "/";
    },
    onError: (error: any) => {
      toast({ title: "Registration failed", description: error.message || "Failed to create account", variant: "destructive" });
    }
  });

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-2/5 flex-col justify-between bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-12 relative overflow-hidden">
        <div className="absolute -top-24 -right-12 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-2.5 relative z-10">
          <div className="w-9 h-9 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <Shield className="text-white h-5 w-5" />
          </div>
          <span className="text-xl font-bold">ClaimFlow <span className="text-blue-400">AI</span></span>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight mb-3">
              File claims with{" "}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                confidence
              </span>
            </h2>
            <p className="text-slate-300 text-base leading-relaxed">
              Create your account to submit motor accident claims and track them in real time.
            </p>
          </div>
          <ul className="space-y-3">
            {PERKS.map(({ icon: Icon, color, text }) => (
              <li key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="h-4 w-4 text-blue-300" />
                </div>
                <span className="text-slate-200 text-sm">{text}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-slate-500 text-xs relative z-10">&copy; {new Date().getFullYear()} ClaimFlow AI</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 bg-background overflow-y-auto">
        <div className="w-full max-w-sm mx-auto">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-700 rounded-lg flex items-center justify-center">
              <Shield className="text-white h-4 w-4" />
            </div>
            <span className="text-lg font-bold">ClaimFlow <span className="text-primary">AI</span></span>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-1">Create your account</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Already have an account?{" "}
            <Link href="/auth" className="text-primary font-medium hover:underline" data-testid="link-signin">
              Sign in
            </Link>
          </p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(d => signupMutation.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="firstName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>First name</FormLabel>
                    <FormControl>
                      <Input data-testid="input-first-name" placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="lastName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last name</FormLabel>
                    <FormControl>
                      <Input data-testid="input-last-name" placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email address</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input data-testid="input-email" className="pl-10" placeholder="you@example.com" type="email" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input data-testid="input-password" className="pl-10 pr-10" placeholder="At least 8 characters" type={showPassword ? "text" : "password"} {...field} />
                      <button type="button" data-testid="button-toggle-password" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input data-testid="input-confirm-password" className="pr-10" placeholder="Repeat password" type={showConfirmPassword ? "text" : "password"} {...field} />
                      <button type="button" data-testid="button-toggle-confirm-password" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <Button type="submit" className="w-full gap-2 mt-2" disabled={signupMutation.isPending} data-testid="button-submit-signup">
                {signupMutation.isPending ? "Creating account…" : "Create account"}
                {!signupMutation.isPending && <ArrowRight className="h-4 w-4" />}
              </Button>

              <p className="text-xs text-center text-muted-foreground pt-2">
                An insurance company or broker?{" "}
                <Link href="/auth/admin" className="text-primary hover:underline" data-testid="link-admin-signup">
                  Apply for admin access
                </Link>
              </p>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}

import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useStandaloneAuth } from "@/hooks/useStandaloneAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import ClaimForm from "@/pages/claim-form";
import ClaimDetails from "@/pages/claim-details";
import DraftDashboard from "@/pages/draft-dashboard";
import ClaimantDashboard from "@/pages/claimant-dashboard";
import AuthPage from "@/pages/auth-page";
import InsuredSignupPage from "@/pages/insured-signup";
import AdminSignupPage from "@/pages/admin-signup";
import AdminDashboard from "@/pages/admin-dashboard";

function Router() {
  const { user, isAuthenticated, isLoading } = useStandaloneAuth();

  // Show loading while authentication state is being determined
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated routes
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/auth/insured" component={InsuredSignupPage} />
        <Route path="/auth/admin" component={AdminSignupPage} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Authenticated routes based on role
  if (user.role === 'insured') {
    return (
      <Switch>
        <Route path="/" component={ClaimantDashboard} />
        <Route path="/claim-form/:id" component={ClaimForm} />
        <Route path="/claim-form" component={ClaimForm} />
        <Route path="/claim-details/:id" component={ClaimDetails} />
        <Route path="/drafts" component={DraftDashboard} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  if (user.role === 'admin') {
    return (
      <Switch>
        <Route path="/" component={AdminDashboard} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin-dashboard" component={AdminDashboard} />
        <Route path="/admin/users" component={AdminDashboard} />
        <Route path="/admin/claims" component={AdminDashboard} />
        <Route path="/admin/settings" component={AdminDashboard} />
        <Route path="/admin/audit" component={AdminDashboard} />
        <Route path="/claim-form/:id" component={ClaimForm} />
        <Route path="/claim-form" component={ClaimForm} />
        <Route path="/claim-details/:id" component={ClaimDetails} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Default fallback - redirect to auth if no valid role
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

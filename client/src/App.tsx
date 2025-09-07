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
import StaffPortal from "@/pages/staff-portal";
import RoleSelection from "@/pages/role-selection";
import BrokerSignup from "@/pages/broker-signup";
import AdjudicatorSignup from "@/pages/adjudicator-signup";
import ClaimantSignup from "@/pages/claimant-signup";
import AuthPage from "@/pages/auth-page";
import AnalyticsDashboard from "@/pages/analytics-dashboard";

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
        <Route path="/staff-portal" component={Landing} />
        <Route path="/broker-signup" component={BrokerSignup} />
        <Route path="/adjudicator-signup" component={AdjudicatorSignup} />
        <Route path="/claimant-signup" component={ClaimantSignup} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // No role assigned - redirect to role selection
  if (!user?.role) {
    return (
      <Switch>
        <Route path="*" component={RoleSelection} />
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
        <Route path="/role-selection" component={RoleSelection} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  if (user.role === 'insurer') {
    return (
      <Switch>
        <Route path="/" component={AnalyticsDashboard} />
        <Route path="/analytics" component={AnalyticsDashboard} />
        <Route path="/claims-review" component={StaffPortal} />
        <Route path="/claim-details/:id" component={ClaimDetails} />
        <Route path="/role-selection" component={RoleSelection} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  if (user.role === 'broker') {
    return (
      <Switch>
        <Route path="/" component={AnalyticsDashboard} />
        <Route path="/analytics" component={AnalyticsDashboard} />
        <Route path="/client-claims" component={StaffPortal} />
        <Route path="/claim-form/:id" component={ClaimForm} />
        <Route path="/claim-form" component={ClaimForm} />
        <Route path="/claim-details/:id" component={ClaimDetails} />
        <Route path="/role-selection" component={RoleSelection} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  if (user.role === 'service_provider') {
    return (
      <Switch>
        <Route path="/" component={StaffPortal} />
        <Route path="/assigned-claims" component={StaffPortal} />
        <Route path="/claim-details/:id" component={ClaimDetails} />
        <Route path="/role-selection" component={RoleSelection} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Default fallback
  return (
    <Switch>
      <Route path="/" component={StaffPortal} />
      <Route path="/staff-portal" component={StaffPortal} />
      <Route path="/role-selection" component={RoleSelection} />
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

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

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/staff-portal" component={Landing} />
          <Route path="/claim" component={ClaimForm} />
          <Route path="/broker-signup" component={BrokerSignup} />
          <Route path="/adjudicator-signup" component={AdjudicatorSignup} />
          <Route path="/claimant-signup" component={ClaimantSignup} />
        </>
      ) : !user?.role ? (
        // Redirect to role selection if authenticated but no role set
        <Route path="*" component={RoleSelection} />
      ) : (
        <>
          {/* Role selection route */}
          <Route path="/role-selection" component={RoleSelection} />
          
          {/* Role-based dashboard routes */}
          {user.role === 'insured' ? (
            <>
              <Route path="/" component={ClaimantDashboard} />
              <Route path="/claim-form/:id?" component={ClaimForm} />
              <Route path="/claim-details/:id" component={ClaimDetails} />
              <Route path="/drafts" component={DraftDashboard} />
            </>
          ) : user.role === 'insurer' ? (
            <>
              <Route path="/" component={AnalyticsDashboard} />
              <Route path="/analytics" component={AnalyticsDashboard} />
              <Route path="/claims-review" component={StaffPortal} />
              <Route path="/claim-details/:id" component={ClaimDetails} />
            </>
          ) : user.role === 'broker' ? (
            <>
              <Route path="/" component={AnalyticsDashboard} />
              <Route path="/analytics" component={AnalyticsDashboard} />
              <Route path="/client-claims" component={StaffPortal} />
              <Route path="/claim/:id?" component={ClaimForm} />
              <Route path="/claim-details/:id" component={ClaimDetails} />
            </>
          ) : user.role === 'service_provider' ? (
            <>
              <Route path="/" component={StaffPortal} />
              <Route path="/assigned-claims" component={StaffPortal} />
              <Route path="/claim-details/:id" component={ClaimDetails} />
            </>
          ) : (
            <>
              <Route path="/" component={StaffPortal} />
              <Route path="/staff-portal" component={StaffPortal} />
            </>
          )}
        </>
      )}
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

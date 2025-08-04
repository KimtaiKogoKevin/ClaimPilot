import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import ClaimForm from "@/pages/claim-form";
import ClaimantDashboard from "@/pages/claimant-dashboard";
import StaffPortal from "@/pages/staff-portal";
import RoleSelection from "@/pages/role-selection";

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/staff-portal" component={StaffPortal} />
          <Route path="/claim" component={ClaimForm} />
        </>
      ) : !user?.role ? (
        // Redirect to role selection if authenticated but no role set
        <Route path="*" component={RoleSelection} />
      ) : (
        <>
          {/* Role selection route */}
          <Route path="/role-selection" component={RoleSelection} />
          
          {/* Main routes based on user role */}
          {user.role === 'claimant' ? (
            <>
              <Route path="/" component={ClaimantDashboard} />
              <Route path="/claim/:id?" component={ClaimForm} />
              <Route path="/staff-portal" component={() => <div className="p-8 text-center">Access denied. You don't have staff permissions.</div>} />
            </>
          ) : (
            <>
              <Route path="/" component={StaffPortal} />
              <Route path="/staff-portal" component={StaffPortal} />
              <Route path="/claim/:id?" component={ClaimForm} />
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

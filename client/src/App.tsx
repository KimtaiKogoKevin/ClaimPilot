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

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/staff" component={StaffPortal} />
          <Route path="/claim" component={ClaimForm} />
        </>
      ) : (
        <>
          <Route path="/" component={ClaimantDashboard} />
          <Route path="/claim/:id?" component={ClaimForm} />
          <Route path="/staff" component={StaffPortal} />
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

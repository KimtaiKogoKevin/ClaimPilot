import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, BarChart3, Users, FileText, Settings, LogOut } from "lucide-react";
import { useLocation } from "wouter";
import { useStandaloneAuth } from "@/hooks/useStandaloneAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AppHeader() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useStandaloneAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
      localStorage.removeItem("auth_token");
    },
    onSuccess: () => {
      queryClient.clear();
      setLocation("/");
      toast({
        title: "Logged out successfully",
        description: "You have been securely logged out.",
      });
    },
    onError: (error) => {
      console.error("Logout error:", error);
      // Clear local storage anyway
      localStorage.removeItem("auth_token");
      queryClient.clear();
      setLocation("/");
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getDashboardRoute = () => {
    if (!user?.role) return "/";
    
    switch (user.role) {
      case 'insurer':
      case 'broker':
        return "/analytics";
      case 'insured':
        return "/";
      case 'service_provider':
        return "/assigned-claims";
      default:
        return "/";
    }
  };

  const getDashboardLabel = () => {
    if (!user?.role) return "Dashboard";
    
    switch (user.role) {
      case 'insurer':
        return "Analytics Dashboard";
      case 'broker':
        return "Broker Dashboard";
      case 'insured':
        return "My Claims";
      case 'service_provider':
        return "Service Dashboard";
      default:
        return "Dashboard";
    }
  };

  const getDashboardIcon = () => {
    if (!user?.role) return BarChart3;
    
    switch (user.role) {
      case 'insurer':
      case 'broker':
        return BarChart3;
      case 'insured':
        return FileText;
      case 'service_provider':
        return Settings;
      default:
        return BarChart3;
    }
  };

  const formatUserRole = (role: string) => {
    switch (role) {
      case 'insured':
        return 'Client';
      case 'insurer':
        return 'Underwriter';
      case 'broker':
        return 'Agent';
      case 'service_provider':
        return 'Service Provider';
      default:
        return role;
    }
  };

  const DashboardIcon = getDashboardIcon();

  return (
    <nav className="bg-white border-b border-neutral-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <div 
          className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => setLocation("/")}
        >
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Shield className="text-white h-4 w-4" />
          </div>
          <span className="text-xl font-bold text-neutral-800">ClaimFlow AI</span>
        </div>

        {/* Navigation Items */}
        <div className="flex items-center space-x-4">
          {/* Help Link - Always visible */}
          <Button variant="ghost" className="text-neutral-600 hover:text-primary">
            Help
          </Button>

          {/* Authenticated User Navigation */}
          {isAuthenticated && user ? (
            <div className="flex items-center space-x-4">
              {/* Role-based Dashboard Button */}
              <Button
                variant="outline"
                onClick={() => setLocation(getDashboardRoute())}
                className="flex items-center space-x-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
              >
                <DashboardIcon className="h-4 w-4" />
                <span>{getDashboardLabel()}</span>
              </Button>

              {/* User Info */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-neutral-800">
                    {user.firstName} {user.lastName}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {formatUserRole(user.role)}
                  </Badge>
                </div>

                {/* Logout Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-neutral-600 hover:text-red-600"
                  disabled={logoutMutation.isPending}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            /* Non-authenticated Navigation */
            <div className="flex items-center space-x-2">
              <Button variant="ghost" className="text-neutral-600 hover:text-primary">
                Contact Us
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
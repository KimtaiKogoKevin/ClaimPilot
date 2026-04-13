import { Shield, LogOut, LayoutDashboard, ChevronDown, User, Settings } from "lucide-react";
import { useLocation } from "wouter";
import { useStandaloneAuth } from "@/hooks/useStandaloneAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function getInitials(firstName?: string, lastName?: string): string {
  const f = (firstName || '').charAt(0).toUpperCase();
  const l = (lastName || '').charAt(0).toUpperCase();
  return f + l || '?';
}

function getAvatarColor(role?: string): string {
  switch (role) {
    case 'admin': return 'from-violet-600 to-indigo-600';
    case 'insured': return 'from-blue-500 to-cyan-500';
    default: return 'from-slate-500 to-slate-600';
  }
}

function getRoleLabel(role?: string): string {
  switch (role) {
    case 'admin': return 'Administrator';
    case 'insured': return 'Policy Holder';
    default: return role || 'User';
  }
}

function getDashboardRoute(role?: string): string {
  if (role === 'admin') return '/admin-dashboard';
  return '/';
}

export default function AppHeader() {
  const [location, setLocation] = useLocation();
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
      toast({ title: "Signed out", description: "You have been securely signed out." });
    },
    onError: () => {
      localStorage.removeItem("auth_token");
      queryClient.clear();
      setLocation("/");
    },
  });

  const isLanding = location === '/';

  return (
    <header className={`sticky top-0 z-50 w-full border-b border-border/60 transition-all duration-200 ${isLanding ? 'bg-white/80 backdrop-blur-md' : 'bg-white/95 backdrop-blur-sm shadow-sm'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => setLocation(isAuthenticated ? getDashboardRoute(user?.role) : "/")}
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
            <Shield className="text-white h-4 w-4" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            ClaimFlow <span className="text-primary">AI</span>
          </span>
        </button>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getAvatarColor(user.role)} flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
                    {getInitials(user.firstName, user.lastName)}
                  </div>
                  {/* Name + role */}
                  <div className="text-left hidden sm:block">
                    <div className="text-sm font-semibold text-foreground leading-none mb-0.5">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground leading-none">
                      {getRoleLabel(user.role)}
                    </div>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-1">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-foreground">{user.firstName} {user.lastName}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocation(getDashboardRoute(user.role))} className="gap-2 cursor-pointer">
                  <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                  <span>Dashboard</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                  className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLocation('/auth')}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
              >
                Sign in
              </button>
              <button
                onClick={() => setLocation('/auth/insured')}
                className="text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors px-4 py-1.5 rounded-lg shadow-sm"
              >
                Get started
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

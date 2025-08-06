import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  twoFactorEnabled: boolean;
}

interface AuthResponse {
  token: string;
  user: User;
  message: string;
}

interface LoginData {
  email: string;
  password: string;
  twoFactorCode?: string;
}

interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  role: 'claimant' | 'broker' | 'adjudicator';
}

// Custom hook for standalone authentication
export function useStandaloneAuth() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get the current user data
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['/api/auth/user'],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        return null;
      }

      try {
        const response = await fetch('/api/auth/user', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('auth_token');
            return null;
          }
          throw new Error('Failed to fetch user');
        }

        return await response.json();
      } catch (error) {
        localStorage.removeItem('auth_token');
        return null;
      }
    },
    retry: false,
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const response = await apiRequest("POST", "/api/auth/login", credentials);
      return await response.json();
    },
    onSuccess: (data: AuthResponse & { requiresTwoFactor?: boolean }) => {
      if (!data.requiresTwoFactor && data.token) {
        localStorage.setItem('auth_token', data.token);
        queryClient.setQueryData(['/api/auth/user'], data.user);
        queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterData) => {
      const response = await apiRequest("POST", "/api/auth/register", credentials);
      return await response.json();
    },
    onSuccess: (data: AuthResponse) => {
      localStorage.setItem('auth_token', data.token);
      queryClient.setQueryData(['/api/auth/user'], data.user);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      localStorage.removeItem('auth_token');
      queryClient.setQueryData(['/api/auth/user'], null);
      queryClient.clear();
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 2FA setup mutation
  const setup2FAMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to setup 2FA');
      }

      return await response.json();
    },
    onError: (error: Error) => {
      toast({
        title: "2FA setup failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 2FA enable mutation
  const enable2FAMutation = useMutation({
    mutationFn: async (token: string) => {
      const authToken = localStorage.getItem('auth_token');
      const response = await fetch('/api/auth/2fa/enable', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        throw new Error('Invalid verification code');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Two-factor authentication enabled",
        description: "Your account is now more secure",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to enable 2FA",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 2FA disable mutation
  const disable2FAMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to disable 2FA');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Two-factor authentication disabled",
        description: "2FA has been removed from your account",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to disable 2FA",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    user: user || null,
    isLoading,
    error,
    isAuthenticated: !!user,
    loginMutation,
    registerMutation,
    logoutMutation,
    setup2FAMutation,
    enable2FAMutation,
    disable2FAMutation,
  };
}
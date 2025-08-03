import { useState, useEffect, createContext, useContext } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  simpleLogin: (userData: SimpleLoginData) => Promise<void>;
  logout: () => void;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface SimpleLoginData {
  email: string;
  firstName?: string;
  lastName?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Token management
const TOKEN_KEY = 'claims_auth_token';

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

function setStoredToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

function removeStoredToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
}

// API helper with token
async function apiRequest(url: string, options: RequestInit = {}) {
  const token = getStoredToken();
  const headers = new Headers(options.headers);
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`${response.status}: ${error}`);
  }

  return response.json();
}

export function useStandaloneAuth() {
  const queryClient = useQueryClient();
  
  // Get current user
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: () => apiRequest('/api/auth/me'),
    enabled: !!getStoredToken(),
    retry: false,
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await apiRequest('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      return response;
    },
    onSuccess: (data) => {
      setStoredToken(data.token);
      queryClient.setQueryData(['auth', 'user'], data.user);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    }
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const response = await apiRequest('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      return response;
    },
    onSuccess: (data) => {
      setStoredToken(data.token);
      queryClient.setQueryData(['auth', 'user'], data.user);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    }
  });

  // Simple login mutation (for development)
  const simpleLoginMutation = useMutation({
    mutationFn: async (userData: SimpleLoginData) => {
      const response = await apiRequest('/api/auth/simple-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      return response;
    },
    onSuccess: (data) => {
      setStoredToken(data.token);
      queryClient.setQueryData(['auth', 'user'], data.user);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    }
  });

  const logout = () => {
    removeStoredToken();
    queryClient.setQueryData(['auth', 'user'], null);
    queryClient.clear();
    window.location.href = '/';
  };

  return {
    user: user || null,
    isLoading: isLoading || loginMutation.isPending || registerMutation.isPending || simpleLoginMutation.isPending,
    isAuthenticated: !!user && !error,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    simpleLogin: simpleLoginMutation.mutateAsync,
    logout,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
  };
}

// Query client setup with auth headers
export function createAuthenticatedQueryClient() {
  return {
    defaultOptions: {
      queries: {
        queryFn: async ({ queryKey }: { queryKey: any[] }) => {
          const url = queryKey[0];
          return apiRequest(url);
        },
      },
    },
  };
}

// Custom hook for authenticated API requests
export function useAuthenticatedRequest() {
  return {
    get: (url: string) => apiRequest(url),
    post: (url: string, data: any) => apiRequest(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),
    put: (url: string, data: any) => apiRequest(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),
    delete: (url: string) => apiRequest(url, { method: 'DELETE' })
  };
}
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useRef } from "react";
import { DraftPersistenceManager } from "@/lib/draftPersistence";

export interface DraftData {
  step: number;
  data: any;
  progressPercentage: number;
}

export function useDraftManager(claimId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const persistenceManagerRef = useRef<DraftPersistenceManager | null>(null);
  
  // Initialize persistence manager
  useEffect(() => {
    if (claimId) {
      persistenceManagerRef.current = new DraftPersistenceManager({
        claimId,
        autoSaveDelay: 2000, // 2 second debounce
        enableLocalBackup: true,
        conflictResolution: 'merge'
      });
    }
    
    return () => {
      persistenceManagerRef.current?.destroy();
    };
  }, [claimId]);

  // Get user's draft claims
  const { data: draftClaims, isLoading: isLoadingDrafts } = useQuery({
    queryKey: ['/api/claims/drafts'],
    enabled: !claimId, // Only fetch when not working on a specific claim
  });

  // Get specific draft for resuming with intelligent loading
  const { data: currentDraft, isLoading: isLoadingDraft } = useQuery({
    queryKey: ['/api/claims', claimId, 'resume'],
    queryFn: async () => {
      if (!claimId) return null;
      
      // Use the persistence manager for intelligent loading
      if (persistenceManagerRef.current) {
        return await persistenceManagerRef.current.loadDraft();
      }
      
      // Fallback to direct API call
      const response = await apiRequest('GET', `/api/claims/${claimId}/resume`);
      return response.json();
    },
    enabled: !!claimId,
    staleTime: 5000, // Consider data fresh for 5 seconds only
    refetchOnWindowFocus: false, // Prevent excessive refetching
  });

  // Save draft mutation
  const saveDraftMutation = useMutation({
    mutationFn: async ({ claimId, step, data, progressPercentage }: { claimId: string } & DraftData) => {
      const response = await apiRequest('PUT', `/api/claims/${claimId}/save-draft`, {
        step,
        data,
        progressPercentage,
      });
      return response;
    },
    onSuccess: () => {
      // Don't show toast for auto-saves, it's too disruptive
      // toast({
      //   title: "Draft Saved",
      //   description: "Your progress has been saved automatically.",
      //   variant: "default",
      // });
      // Don't invalidate the current draft query to prevent re-loading
      // Only invalidate the list queries
      queryClient.invalidateQueries({ queryKey: ['/api/claims/drafts'] });
      // Don't invalidate the current draft to prevent restoration loop
      // queryClient.invalidateQueries({ queryKey: ['/api/claims'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Save Draft",
        description: error.message || "Your progress could not be saved. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Smart save function that uses persistence manager
  const saveDraft = (claimId: string, step: number, data: any, progressPercentage: number) => {
    if (!claimId || !persistenceManagerRef.current) return;
    
    // Use persistence manager for intelligent saving
    persistenceManagerRef.current.saveDraft(data, step);
  };

  // Manual save with immediate feedback
  const manualSave = async (claimId: string, step: number, data: any, progressPercentage: number) => {
    if (!claimId) {
      toast({
        title: "Save Failed",
        description: "No claim ID available for saving.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (persistenceManagerRef.current) {
        // Force immediate save through persistence manager
        await persistenceManagerRef.current.forceSave();
      } else {
        // Fallback to direct mutation
        await saveDraftMutation.mutateAsync({
          claimId,
          step,
          data,
          progressPercentage,
        });
      }
      
      toast({
        title: "Draft Saved",
        description: "Your progress has been saved successfully.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save draft. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    // Data
    draftClaims,
    currentDraft,
    
    // Loading states
    isLoadingDrafts,
    isLoadingDraft,
    isSaving: saveDraftMutation.isPending,
    
    // Actions
    saveDraft,
    manualSave,
    
    // Progress helpers
    getProgress: (claim: any) => parseFloat(claim?.formProgress || '0'),
    getCurrentStep: (claim: any) => claim?.currentFormStep || 1,
    getLastSaved: (claim: any) => claim?.lastSavedAt ? new Date(claim.lastSavedAt) : null,
  };
}
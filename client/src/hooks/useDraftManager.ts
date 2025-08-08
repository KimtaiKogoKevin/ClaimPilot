import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export interface DraftData {
  step: number;
  data: any;
  progressPercentage: number;
}

export function useDraftManager(claimId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user's draft claims
  const { data: draftClaims, isLoading: isLoadingDrafts } = useQuery({
    queryKey: ['/api/claims/drafts'],
    enabled: !claimId, // Only fetch when not working on a specific claim
  });

  // Get specific draft for resuming
  const { data: currentDraft, isLoading: isLoadingDraft } = useQuery({
    queryKey: ['/api/claims', claimId, 'resume'],
    enabled: !!claimId,
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

  // Auto-save function with debouncing
  const autoSaveDraft = (claimId: string, step: number, data: any, progressPercentage: number) => {
    if (!claimId) return;
    
    saveDraftMutation.mutate({
      claimId,
      step,
      data,
      progressPercentage,
    });
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
    saveDraft: autoSaveDraft,
    
    // Progress helpers
    getProgress: (claim: any) => parseFloat(claim?.formProgress || '0'),
    getCurrentStep: (claim: any) => claim?.currentFormStep || 1,
    getLastSaved: (claim: any) => claim?.lastSavedAt ? new Date(claim.lastSavedAt) : null,
  };
}
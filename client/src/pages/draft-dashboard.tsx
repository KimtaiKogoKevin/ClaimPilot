import { useStandaloneAuth } from "@/hooks/useStandaloneAuth";
import { useDraftManager } from "@/hooks/useDraftManager";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { Clock, FileText, ArrowRight, Plus } from "lucide-react";

export default function DraftDashboard() {
  const { isAuthenticated, isLoading } = useStandaloneAuth();
  const { draftClaims, isLoadingDrafts, getProgress, getCurrentStep, getLastSaved } = useDraftManager();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Redirect if not authenticated
  if (!isLoading && !isAuthenticated) {
    setLocation("/auth");
    return null;
  }

  if (isLoading || isLoadingDrafts) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading draft claims...</p>
        </div>
      </div>
    );
  }

  const handleCreateNewClaim = () => {
    setLocation("/claim-form");
  };

  const handleResumeDraft = (claimId: string) => {
    setLocation(`/claim-form/${claimId}`);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Draft Claims</h1>
            <p className="text-neutral-600 mt-2">
              Continue working on your saved claims or start a new one.
            </p>
          </div>
          <Button onClick={handleCreateNewClaim} className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>New Claim</span>
          </Button>
        </div>

        {!draftClaims || draftClaims.length === 0 ? (
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <FileText className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
              <CardTitle>No Draft Claims</CardTitle>
              <CardDescription>
                You don't have any saved drafts yet. Start a new claim to begin.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={handleCreateNewClaim} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Start New Claim
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {draftClaims.map((draft) => (
              <Card key={draft.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleResumeDraft(draft.id)}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {draft.claimReferenceNumber || 'Draft Claim'}
                    </CardTitle>
                    <Badge variant="outline">
                      {getProgress(draft)}% Complete
                    </Badge>
                  </div>
                  <CardDescription>
                    Step {getCurrentStep(draft)} of 4 • {draft.insuredType === 'individual' ? 'Individual' : 'Corporate'} Claim
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Progress bar */}
                    <div className="w-full bg-neutral-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${getProgress(draft)}%` }}
                      ></div>
                    </div>

                    {/* Policy details if available */}
                    {draft.policyNumber && (
                      <div className="text-sm text-neutral-600">
                        Policy: {draft.policyNumber}
                      </div>
                    )}

                    {/* Last saved info */}
                    <div className="flex items-center text-sm text-neutral-500">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>
                        {getLastSaved(draft) 
                          ? `Saved ${getLastSaved(draft)?.toLocaleDateString()}`
                          : 'Not saved yet'
                        }
                      </span>
                    </div>

                    {/* Action button */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-4"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResumeDraft(draft.id);
                      }}
                    >
                      Continue <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
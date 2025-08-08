import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useStandaloneAuth } from "@/hooks/useStandaloneAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Clock, CheckCircle, DollarSign, Plus } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import type { ClaimWithDetails } from "@shared/schema";

export default function ClaimantDashboard() {
  const { user, isAuthenticated, isLoading } = useStandaloneAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/auth";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: claims = [], isLoading: claimsLoading } = useQuery({
    queryKey: ["/api/claims"],
    enabled: isAuthenticated,
  });

  const handleNewClaim = () => {
    window.location.href = "/claim";
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    window.location.href = "/auth";
  };

  const handleViewClaim = (claimId: string) => {
    window.location.href = `/claim-details/${claimId}`;
  };

  const handleDownloadPDF = async (claimId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/claims/${claimId}/pdf`, {
        method: 'GET',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: "Unauthorized",
            description: "You are logged out. Logging in again...",
            variant: "destructive",
          });
          setTimeout(() => {
            window.location.href = "/auth";
          }, 500);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `claim-${claimId.substring(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "PDF Downloaded",
        description: "Your claim report has been downloaded successfully.",
      });
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast({
        title: "Download Failed",
        description: "Failed to download PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  const stats = {
    totalClaims: claims.length,
    pendingClaims: claims.filter((c: ClaimWithDetails) => c.status === 'under_review').length,
    approvedClaims: claims.filter((c: ClaimWithDetails) => c.status === 'approved').length,
    totalPayout: 0, // Would calculate from actual claim amounts
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'submitted':
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'paid':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <AppHeader />
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Dashboard Overview */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-neutral-800 mb-6">My Claims Dashboard</h2>
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="shadow-sm border-neutral-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center">
                    <FileText className="text-primary h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-neutral-800">{stats.totalClaims}</div>
                    <div className="text-sm text-neutral-600">Total Claims</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm border-neutral-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Clock className="text-yellow-600 h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-neutral-800">{stats.pendingClaims}</div>
                    <div className="text-sm text-neutral-600">Pending</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm border-neutral-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="text-green-600 h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-neutral-800">{stats.approvedClaims}</div>
                    <div className="text-sm text-neutral-600">Approved</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm border-neutral-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="text-green-600 h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-neutral-800">$0</div>
                    <div className="text-sm text-neutral-600">Total Payout</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 flex space-x-4">
          <Button variant="outline" onClick={() => setLocation("/drafts")} className="shadow-lg">
            <FileText className="h-4 w-4 mr-2" />
            View Drafts
          </Button>
          <Button onClick={handleNewClaim} className="shadow-lg">
            <Plus className="h-4 w-4 mr-2" />
            Submit New Claim
          </Button>
        </div>

        {/* Claims List */}
        <Card className="shadow-sm border-neutral-200">
          <div className="p-6 border-b border-neutral-200">
            <h3 className="text-lg font-semibold text-neutral-800">Recent Claims</h3>
          </div>
          <div className="overflow-x-auto">
            {claimsLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-neutral-600">Loading claims...</p>
              </div>
            ) : claims.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-800 mb-2">No Claims Yet</h3>
                <p className="text-neutral-600 mb-4">You haven't submitted any claims yet.</p>
                <Button onClick={handleNewClaim}>
                  <Plus className="h-4 w-4 mr-2" />
                  Submit Your First Claim
                </Button>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Claim ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Vehicle</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">AI Analysis</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {claims.map((claim: ClaimWithDetails) => (
                    <tr key={claim.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-neutral-800">{claim.id.substring(0, 8)}...</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-600">
                          {new Date(claim.createdAt!).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-800">
                          {claim.vehicle ? `${claim.vehicle.make} ${claim.vehicle.model}` : 'Not specified'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(claim.status)}`}>
                          {claim.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-2 ${claim.damagedPhotos.length > 0 ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                          <span className="text-sm text-neutral-600">
                            {claim.damagedPhotos.length > 0 ? 'Complete' : 'Pending'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {claim.status === 'draft' ? (
                          <Button
                            size="sm"
                            onClick={() => window.location.href = `/claim/${claim.id}`}
                            className="bg-primary hover:bg-blue-600 mr-3"
                          >
                            Continue
                          </Button>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-primary hover:text-blue-600 mr-3"
                            onClick={() => handleViewClaim(claim.id)}
                          >
                            View Details
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-neutral-600 hover:text-neutral-800"
                          onClick={() => handleDownloadPDF(claim.id)}
                        >
                          Download PDF
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

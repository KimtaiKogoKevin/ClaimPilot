import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Shield, Clock, Eye, CheckCircle, Brain, BarChart3, Filter, Download, FileText, User, Phone } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ClaimWithDetails } from "@shared/schema";
import { useState } from "react";

export default function StaffPortal() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const { data: claims = [], isLoading } = useQuery({
    queryKey: ["/api/staff/claims"],
    retry: false,
  });

  const { data: selectedClaim } = useQuery({
    queryKey: ["/api/staff/claims", selectedClaimId],
    enabled: !!selectedClaimId,
    retry: false,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ claimId, status }: { claimId: string; status: string }) => {
      await apiRequest(`/api/staff/claims/${claimId}/status`, {
        method: "PUT",
        body: { status },
      });
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "Claim status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/staff/claims"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update claim status",
        variant: "destructive",
      });
    },
  });

  const handleViewDetails = (claimId: string) => {
    setSelectedClaimId(claimId);
    setIsDetailsOpen(true);
  };

  const handleDownloadPDF = async (claimId: string) => {
    try {
      const response = await fetch(`/api/staff/claims/${claimId}/pdf`, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `claim-${claimId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "PDF Downloaded",
        description: "Claim report has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download PDF report.",
        variant: "destructive",
      });
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Calculate queue statistics
  const stats = {
    pending: claims.filter((c: ClaimWithDetails) => c.status === 'submitted').length,
    inReview: claims.filter((c: ClaimWithDetails) => c.status === 'under_review').length,
    aiProcessed: claims.filter((c: ClaimWithDetails) => c.damagedPhotos.length > 0).length,
    completedToday: claims.filter((c: ClaimWithDetails) => {
      const today = new Date().toDateString();
      return c.updatedAt && new Date(c.updatedAt).toDateString() === today;
    }).length,
    avgProcessingTime: "2.3h", // Would be calculated from actual data
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800';
      case 'under_review':
        return 'bg-blue-100 text-blue-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'paid':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (claim: ClaimWithDetails) => {
    // Simple priority logic based on AI analysis confidence and damage count
    const damageCount = claim.damagedPhotos.reduce((sum, photo) => sum + photo.detectedDamages.length, 0);
    if (damageCount >= 3) return 'bg-red-100 text-red-800';
    if (damageCount >= 2) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getPriorityText = (claim: ClaimWithDetails) => {
    const damageCount = claim.damagedPhotos.reduce((sum, photo) => sum + photo.detectedDamages.length, 0);
    if (damageCount >= 3) return 'High';
    if (damageCount >= 2) return 'Medium';
    return 'Low';
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Staff Header */}
      <nav className="bg-neutral-800 text-white px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <Shield className="text-white h-4 w-4" />
            </div>
            <span className="text-xl font-bold">ClaimFlow AI - Staff Portal</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <span className="text-neutral-300">Logged in as:</span>
              <span className="font-medium ml-1">{user?.firstName} {user?.lastName}</span>
              <span className="text-neutral-300 mx-2">•</span>
              <span className="text-neutral-300 capitalize">{user?.role || 'Staff'}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-neutral-300 hover:text-white">
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Staff Dashboard Overview */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-neutral-800 mb-6">Claims Processing Dashboard</h2>
          <div className="grid md:grid-cols-5 gap-6 mb-8">
            <Card className="shadow-sm border-neutral-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Clock className="text-yellow-600 h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-neutral-800">{stats.pending}</div>
                    <div className="text-sm text-neutral-600">Pending Review</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm border-neutral-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Eye className="text-blue-600 h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-neutral-800">{stats.inReview}</div>
                    <div className="text-sm text-neutral-600">In Review</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm border-neutral-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-ai-purple bg-opacity-10 rounded-lg flex items-center justify-center">
                    <Brain className="text-ai-purple h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-neutral-800">{stats.aiProcessed}</div>
                    <div className="text-sm text-neutral-600">AI Processed</div>
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
                    <div className="text-2xl font-bold text-neutral-800">{stats.completedToday}</div>
                    <div className="text-sm text-neutral-600">Completed Today</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm border-neutral-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="text-neutral-600 h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <div className="text-2xl font-bold text-neutral-800">{stats.avgProcessingTime}</div>
                    <div className="text-sm text-neutral-600">Avg. Processing</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Claims Queue */}
        <Card className="shadow-sm border-neutral-200">
          <div className="p-6 border-b border-neutral-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-neutral-800">Claims Queue</h3>
              <div className="flex space-x-3">
                <Select defaultValue="all">
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Claims</SelectItem>
                    <SelectItem value="pending">Pending Review</SelectItem>
                    <SelectItem value="ai_analyzed">AI Analyzed</SelectItem>
                    <SelectItem value="high_priority">High Priority</SelectItem>
                  </SelectContent>
                </Select>
                <Button className="bg-primary hover:bg-blue-600">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            {claims.length === 0 ? (
              <div className="p-8 text-center">
                <Eye className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-800 mb-2">No Claims in Queue</h3>
                <p className="text-neutral-600">All claims have been processed.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Claim ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Claimant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Submitted</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Priority</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">AI Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {claims.map((claim: ClaimWithDetails) => (
                    <tr key={claim.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-neutral-800">{claim.id.substring(0, 8)}...</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-800">
                          {claim.claimant.firstName} {claim.claimant.lastName}
                        </div>
                        <div className="text-xs text-neutral-500">Policy: {claim.policyNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-600">
                          {claim.submittedAt 
                            ? new Date(claim.submittedAt).toLocaleDateString()
                            : new Date(claim.createdAt!).toLocaleDateString()
                          }
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(claim)}`}>
                          {getPriorityText(claim)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            claim.damagedPhotos.length > 0 ? 'bg-green-400' : 'bg-gray-400'
                          }`}></div>
                          <span className="text-sm text-neutral-600">
                            {claim.damagedPhotos.length > 0 ? 'Complete' : 'Pending'}
                          </span>
                          {claim.damagedPhotos.length > 0 && (
                            <Button variant="ghost" size="sm" className="ml-2 text-ai-purple hover:text-purple-700">
                              <Brain className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(claim.status)}`}>
                          {claim.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleViewDetails(claim.id)}
                            className="bg-primary hover:bg-blue-600"
                            disabled={claim.status === 'draft'}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDownloadPDF(claim.id)}
                            className="text-neutral-600 hover:text-neutral-800"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Select
                            value={claim.status}
                            onValueChange={(status) => updateStatusMutation.mutate({ claimId: claim.id, status })}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="submitted">Submitted</SelectItem>
                              <SelectItem value="under_review">Under Review</SelectItem>
                              <SelectItem value="approved">Approved</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                              <SelectItem value="paid">Paid</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>

        {/* Claim Details Modal */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Claim Details - #{selectedClaim?.id.slice(0, 8)}...
              </DialogTitle>
            </DialogHeader>
            
            {selectedClaim && (
              <div className="grid gap-6">
                {/* Claim Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Claim Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-4">
                    <div>
                      <strong>Policy Number:</strong> {selectedClaim.policyNumber}
                    </div>
                    <div>
                      <strong>Status:</strong> <Badge className={getStatusColor(selectedClaim.status)}>{selectedClaim.status}</Badge>
                    </div>
                    <div>
                      <strong>Branch:</strong> {selectedClaim.branchName || 'N/A'}
                    </div>
                    <div>
                      <strong>Agent:</strong> {selectedClaim.agentName || 'N/A'}
                    </div>
                    <div>
                      <strong>Created:</strong> {new Date(selectedClaim.createdAt).toLocaleDateString()}
                    </div>
                    <div>
                      <strong>Submitted:</strong> {selectedClaim.submittedAt ? new Date(selectedClaim.submittedAt).toLocaleDateString() : 'N/A'}
                    </div>
                  </CardContent>
                </Card>

                {/* Claimant Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Claimant Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-4">
                    <div>
                      <strong>Name:</strong> {selectedClaim.claimant.firstName} {selectedClaim.claimant.lastName}
                    </div>
                    <div>
                      <strong>Email:</strong> {selectedClaim.claimant.email}
                    </div>
                    {selectedClaim.individualDetails && (
                      <>
                        <div>
                          <strong>ID Number:</strong> {selectedClaim.individualDetails.idNumber}
                        </div>
                        <div>
                          <strong>Mobile:</strong> {selectedClaim.individualDetails.mobile || 'N/A'}
                        </div>
                      </>
                    )}
                    {selectedClaim.corporateDetails && (
                      <>
                        <div>
                          <strong>Company:</strong> {selectedClaim.corporateDetails.registeredName}
                        </div>
                        <div>
                          <strong>Registration:</strong> {selectedClaim.corporateDetails.registrationNumber}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Accident Details */}
                {selectedClaim.accidentDescription && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Accident Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <strong>Date:</strong> {selectedClaim.accidentDate ? new Date(selectedClaim.accidentDate).toLocaleDateString() : 'N/A'}
                        </div>
                        <div>
                          <strong>Time:</strong> {selectedClaim.accidentTime || 'N/A'}
                        </div>
                        <div className="md:col-span-2">
                          <strong>Location:</strong> {selectedClaim.accidentLocation || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <strong>Description:</strong>
                        <p className="mt-2 text-neutral-600">{selectedClaim.accidentDescription}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* AI Analysis */}
                {selectedClaim.damagedPhotos && selectedClaim.damagedPhotos.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        AI Damage Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4">
                        <div className="grid md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <strong>Photos:</strong> {selectedClaim.damagedPhotos.length}
                          </div>
                          <div>
                            <strong>Detected Damages:</strong> {selectedClaim.damagedPhotos.reduce((sum, photo) => sum + (photo.detectedDamages?.length || 0), 0)}
                          </div>
                          <div>
                            <strong>AI Confidence:</strong> High
                          </div>
                        </div>
                        <div className="space-y-2">
                          {selectedClaim.damagedPhotos.map((photo, index) => (
                            <div key={photo.id} className="p-3 bg-neutral-50 rounded-lg">
                              <div className="flex justify-between items-center">
                                <span className="font-medium">{photo.angle} - {photo.isGoodsPhoto ? 'Goods' : 'Vehicle'}</span>
                                <span className="text-sm text-neutral-600">{photo.detectedDamages?.length || 0} damages</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => handleDownloadPDF(selectedClaim.id)}>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button onClick={() => setIsDetailsOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Clock, Eye, CheckCircle, Brain, BarChart3, Filter } from "lucide-react";
import type { ClaimWithDetails } from "@shared/schema";

export default function StaffPortal() {
  // Note: In production, this would need proper staff authentication
  const { data: claims = [], isLoading } = useQuery({
    queryKey: ["/api/staff/claims"],
    retry: false,
  });

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
              <span className="font-medium ml-1">Staff Member</span>
              <span className="text-neutral-300 mx-2">•</span>
              <span className="text-neutral-300">Senior Adjudicator</span>
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
                        <Button 
                          size="sm" 
                          className="bg-primary hover:bg-blue-600 mr-2"
                          disabled={claim.status === 'draft'}
                        >
                          Review
                        </Button>
                        <Button variant="ghost" size="sm" className="text-neutral-600 hover:text-neutral-800">
                          <Eye className="h-4 w-4" />
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

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useStandaloneAuth } from "@/hooks/useStandaloneAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AppHeader from "@/components/AppHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from "recharts";
import { 
  TrendingUp, 
  DollarSign, 
  FileText, 
  Clock, 
  Users, 
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Filter,
  Search,
  MoreHorizontal
} from "lucide-react";
import type { User } from "@shared/schema";

interface DashboardAnalytics {
  claimsOverview: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    processing: number;
  };
  severityBreakdown: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  monthlyTrends: Array<{
    month: string;
    claims: number;
    settlements: number;
    avgAmount: number;
  }>;
  costAnalysis: {
    totalPayouts: number;
    avgClaimAmount: number;
    largestClaim: number;
    reserves: number;
  };
  performanceMetrics: {
    avgProcessingTime: number;
    settlementRate: number;
    customerSatisfaction: number;
    reopenRate: number;
  };
}

interface ClaimWithDetails {
  id: string;
  claimReferenceNumber: string;
  policyNumber: string;
  status: string;
  submittedAt?: string;
  createdAt: string;
  insured?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  vehicle?: {
    make: string;
    model: string;
    registrationNumber_primemover: string;
  };
  totalAmount?: number;
}

export default function AnalyticsDashboard() {
  const { user, isLoading: authLoading } = useStandaloneAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Permission check - broker and insurer get full analytics, insured get limited claims access
  const canAccessAnalytics = user?.role === 'broker' || user?.role === 'insurer';
  const canAccessClaimsManagement = user?.role === 'broker' || user?.role === 'insurer' || user?.role === 'insured';
  const hasFullAccess = user?.role === 'insurer'; // Insurers see all data
  const hasBrokerAccess = user?.role === 'broker'; // Brokers see their clients only
  const isInsuredUser = user?.role === 'insured'; // Insured users have limited permissions

  // Claims management state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedClaim, setSelectedClaim] = useState<ClaimWithDetails | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: analytics, isLoading, error } = useQuery<DashboardAnalytics>({
    queryKey: ['/api/analytics/dashboard'],
    enabled: !!user && canAccessAnalytics,
  });

  // Fetch claims based on user role
  const { data: claims, isLoading: claimsLoading } = useQuery<ClaimWithDetails[]>({
    queryKey: isInsuredUser ? ['/api/claims'] : ['/api/staff/claims'],
    enabled: !!user && canAccessClaimsManagement,
  });

  // Delete claim mutation
  const deleteClaimMutation = useMutation({
    mutationFn: async (claimId: string) => {
      // Role-based delete permissions
      if (isInsuredUser) {
        // Insured can only delete draft claims
        const claim = claims?.find(c => c.id === claimId);
        if (!claim || claim.status !== 'draft') {
          throw new Error('You can only delete draft claims');
        }
        return apiRequest(`/api/claims/${claimId}`, 'DELETE');
      } else {
        // Insurers and brokers can delete any claim
        return apiRequest(`/api/staff/claims/${claimId}`, 'DELETE');
      }
    },
    onSuccess: () => {
      // Invalidate the correct cache based on user role
      if (isInsuredUser) {
        queryClient.invalidateQueries({ queryKey: ['/api/claims'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['/api/staff/claims'] });
        queryClient.invalidateQueries({ queryKey: ['/api/analytics/dashboard'] });
      }
      toast({
        title: "Success",
        description: "Claim deleted successfully.",
      });
      setShowDeleteDialog(false);
      setSelectedClaim(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete claim.",
        variant: "destructive",
      });
    },
  });

  // Filter claims based on search and status
  const filteredClaims = claims?.filter(claim => {
    const matchesSearch = !searchTerm || 
      claim.claimReferenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.policyNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (claim.insured?.firstName + ' ' + claim.insured?.lastName).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || claim.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-12 w-80" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!canAccessClaimsManagement) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
              Access Restricted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              This page is only available for authenticated users with claims access.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Unable to load dashboard data. Please try again later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusColors = {
    pending: '#f59e0b',
    approved: '#10b981', 
    rejected: '#ef4444',
    processing: '#3b82f6'
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <div className="max-w-7xl mx-auto p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Analytics Dashboard
            </h1>
            <p className="text-gray-600">
              {hasFullAccess 
                ? "Complete claims analytics across all brokers and clients"
                : "Your clients' claims analytics and performance metrics"
              }
            </p>
          </div>
          <Badge variant={hasFullAccess ? "default" : "secondary"} className="text-sm">
            {hasFullAccess ? "Full Access" : "Broker Access"}
          </Badge>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.claimsOverview.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                {analytics?.claimsOverview.pending || 0} pending review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(analytics?.costAnalysis.totalPayouts || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Avg: {formatCurrency(analytics?.costAnalysis.avgClaimAmount || 0)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Settlement Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics?.performanceMetrics.settlementRate || 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics?.performanceMetrics.avgProcessingTime || 0} days avg
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Reserves</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(analytics?.costAnalysis.reserves || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                For open claims
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="claims">Claims Management</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Claims Status Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Claims by Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Pending', value: analytics?.claimsOverview.pending || 0, color: statusColors.pending },
                            { name: 'Approved', value: analytics?.claimsOverview.approved || 0, color: statusColors.approved },
                            { name: 'Rejected', value: analytics?.claimsOverview.rejected || 0, color: statusColors.rejected },
                            { name: 'Processing', value: analytics?.claimsOverview.processing || 0, color: statusColors.processing }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {[
                            { name: 'Pending', value: analytics?.claimsOverview.pending || 0, color: statusColors.pending },
                            { name: 'Approved', value: analytics?.claimsOverview.approved || 0, color: statusColors.approved },
                            { name: 'Rejected', value: analytics?.claimsOverview.rejected || 0, color: statusColors.rejected },
                            { name: 'Processing', value: analytics?.claimsOverview.processing || 0, color: statusColors.processing }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Damage Severity Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Damage Severity Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics?.severityBreakdown || []}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {(analytics?.severityBreakdown || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Claims Management Tab */}
          <TabsContent value="claims" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Claims Management</h3>
                <p className="text-sm text-muted-foreground">
                  {hasFullAccess 
                    ? "Manage all claims across brokers and clients" 
                    : hasBrokerAccess 
                    ? "Manage your clients' claims"
                    : "Manage your draft claims"
                  }
                </p>
              </div>
              {(hasFullAccess || hasBrokerAccess) && (
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Claim
                </Button>
              )}
            </div>

            {/* Search and Filter Controls */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search claims by reference, policy, or claimant..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Claims Table */}
            <Card>
              <CardContent className="p-0">
                {claimsLoading ? (
                  <div className="p-6">
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  </div>
                ) : filteredClaims.length === 0 ? (
                  <div className="p-12 text-center">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Claims Found</h3>
                    <p className="text-muted-foreground">
                      {searchTerm || statusFilter !== 'all' 
                        ? "No claims match your current filters." 
                        : "No claims have been created yet."
                      }
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Reference</TableHead>
                        <TableHead>Claimant</TableHead>
                        <TableHead>Policy</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClaims.map((claim) => (
                        <TableRow key={claim.id}>
                          <TableCell className="font-medium">
                            <div>
                              <div className="font-mono text-sm">
                                {claim.claimReferenceNumber}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {claim.id.substring(0, 8)}...
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {claim.insured?.firstName} {claim.insured?.lastName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                ID: {claim.insured?.id.substring(0, 8)}...
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-mono text-sm">
                              {claim.policyNumber}
                            </div>
                          </TableCell>
                          <TableCell>
                            {claim.vehicle ? (
                              <div>
                                <div className="text-sm">
                                  {claim.vehicle.make} {claim.vehicle.model}
                                </div>
                                <div className="text-xs text-muted-foreground font-mono">
                                  {claim.vehicle.registrationNumber_primemover}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                claim.status === 'approved' ? 'default' :
                                claim.status === 'rejected' ? 'destructive' :
                                claim.status === 'pending' ? 'secondary' :
                                'outline'
                              }
                            >
                              {claim.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {new Date(claim.createdAt).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(claim.createdAt).toLocaleTimeString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            {claim.totalAmount ? (
                              <div className="font-mono">
                                ${claim.totalAmount.toLocaleString()}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                {(hasFullAccess || hasBrokerAccess) && (
                                  <>
                                    <DropdownMenuItem>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit Claim
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Download className="h-4 w-4 mr-2" />
                                      Download PDF
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {/* Role-based delete permissions */}
                                {((hasFullAccess || hasBrokerAccess) || (isInsuredUser && claim.status === 'draft')) && (
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      setSelectedClaim(claim);
                                      setShowDeleteDialog(true);
                                    }}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Claim
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Enhanced Analytics for Claims Management */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {filteredClaims.slice(0, 5).map((claim) => (
                      <div key={claim.id} className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">
                            {claim.claimReferenceNumber}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(claim.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <Badge 
                          variant={
                            claim.status === 'approved' ? 'default' :
                            claim.status === 'rejected' ? 'destructive' :
                            'outline'
                          }
                          className="text-xs"
                        >
                          {claim.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Claims</span>
                    <span className="font-bold">{filteredClaims.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Draft Claims</span>
                    <span className="font-bold">
                      {filteredClaims.filter(c => c.status === 'draft').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Pending Review</span>
                    <span className="font-bold">
                      {filteredClaims.filter(c => c.status === 'pending').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Approved</span>
                    <span className="font-bold text-green-600">
                      {filteredClaims.filter(c => c.status === 'approved').length}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Your Permissions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className={`h-4 w-4 ${hasFullAccess || hasBrokerAccess ? 'text-green-500' : 'text-muted-foreground'}`} />
                    <span className="text-sm">Create Claims</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">View Claims</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className={`h-4 w-4 ${hasFullAccess || hasBrokerAccess ? 'text-green-500' : 'text-muted-foreground'}`} />
                    <span className="text-sm">Edit Claims</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className={`h-4 w-4 ${hasFullAccess || hasBrokerAccess ? 'text-green-500' : 'text-yellow-500'}`} />
                    <span className="text-sm">
                      Delete Claims {isInsuredUser && '(Drafts Only)'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Claim</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete claim{" "}
                  <strong>{selectedClaim?.claimReferenceNumber}</strong>?
                  This action cannot be undone and will permanently remove all
                  associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    if (selectedClaim) {
                      deleteClaimMutation.mutate(selectedClaim.id);
                    }
                  }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={deleteClaimMutation.isPending}
                >
                  {deleteClaimMutation.isPending ? "Deleting..." : "Delete Claim"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Claims and Settlements Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics?.monthlyTrends || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="claims" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                        <Area type="monotone" dataKey="settlements" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Processing Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Average Processing Time</span>
                    <span className="text-lg font-bold">{analytics?.performanceMetrics.avgProcessingTime || 0} days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Settlement Rate</span>
                    <span className="text-lg font-bold">{analytics?.performanceMetrics.settlementRate || 0}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Customer Satisfaction</span>
                    <span className="text-lg font-bold">{analytics?.performanceMetrics.customerSatisfaction || 0}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Reopen Rate</span>
                    <span className="text-lg font-bold">{analytics?.performanceMetrics.reopenRate || 0}%</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Monthly Average Claim Amount</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analytics?.monthlyTrends || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                        <Line type="monotone" dataKey="avgAmount" stroke="#f59e0b" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Financial Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Payouts</span>
                    <span className="text-lg font-bold">{formatCurrency(analytics?.costAnalysis.totalPayouts || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Average Claim</span>
                    <span className="text-lg font-bold">{formatCurrency(analytics?.costAnalysis.avgClaimAmount || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Largest Claim</span>
                    <span className="text-lg font-bold">{formatCurrency(analytics?.costAnalysis.largestClaim || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Active Reserves</span>
                    <span className="text-lg font-bold">{formatCurrency(analytics?.costAnalysis.reserves || 0)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
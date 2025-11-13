import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useStandaloneAuth } from "@/hooks/useStandaloneAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import AppHeader from "@/components/AppHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogFooter,
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import {
  Users,
  FileText,
  Settings,
  Activity,
  Trash2,
  Edit,
  Plus,
  BarChart3,
  Shield,
  Search,
  Filter,
  UserPlus,
  ClipboardList,
} from "lucide-react";
import type { User, AuditLog, SystemSetting, AdminAnalytics } from "@shared/schema";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface SystemStats {
  totalUsers: number;
  totalClaims: number;
  claimsByStatus: Array<{ status: string; count: number }>;
  usersByRole: Array<{ role: string; count: number }>;
  recentClaims: any[];
  analytics?: AdminAnalytics;
}

interface ClaimForAdmin {
  id: string;
  claimReferenceNumber: string;
  status: string;
  insuredId: string;
  policyNumber: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const { user } = useStandaloneAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("analytics");

  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showDeleteUserDialog, setShowDeleteUserDialog] = useState(false);

  const [settingKey, setSettingKey] = useState("");
  const [settingValue, setSettingValue] = useState("");
  const [settingCategory, setSettingCategory] = useState("general");
  const [settingDescription, setSettingDescription] = useState("");
  const [showSettingDialog, setShowSettingDialog] = useState(false);

  const [selectedClaims, setSelectedClaims] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState("");

  const [auditFilter, setAuditFilter] = useState({ entityType: "", adminId: "" });

  const { data: stats, isLoading: statsLoading } = useQuery<SystemStats>({
    queryKey: ['/api/admin/stats'],
    enabled: !!user && user.role === 'admin',
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users', { role: userRoleFilter !== 'all' ? userRoleFilter : undefined, search: userSearchTerm || undefined }],
    enabled: !!user && user.role === 'admin',
  });

  const { data: claims = [], isLoading: claimsLoading } = useQuery<ClaimForAdmin[]>({
    queryKey: ['/api/staff/claims'],
    enabled: !!user && user.role === 'admin',
  });

  const { data: settings = [], isLoading: settingsLoading } = useQuery<SystemSetting[]>({
    queryKey: ['/api/admin/settings'],
    enabled: !!user && user.role === 'admin',
  });

  const { data: auditLogs = [], isLoading: auditLogsLoading } = useQuery<AuditLog[]>({
    queryKey: ['/api/admin/audit-logs', auditFilter],
    enabled: !!user && user.role === 'admin',
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: Partial<User>) => {
      return apiRequest('/api/admin/users', 'POST', userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({ title: "Success", description: "User created successfully." });
      setShowUserDialog(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create user.", variant: "destructive" });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<User> }) => {
      return apiRequest(`/api/admin/users/${id}`, 'PUT', updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({ title: "Success", description: "User updated successfully." });
      setShowUserDialog(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update user.", variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/admin/users/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({ title: "Success", description: "User deleted successfully." });
      setShowDeleteUserDialog(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete user.", variant: "destructive" });
    },
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      return apiRequest(`/api/admin/users/${id}/role`, 'PUT', { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({ title: "Success", description: "User role updated successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update role.", variant: "destructive" });
    },
  });

  const bulkUpdateClaimStatusMutation = useMutation({
    mutationFn: async ({ claimIds, status }: { claimIds: string[]; status: string }) => {
      return apiRequest('/api/admin/claims/bulk-status', 'POST', { claimIds, status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/staff/claims'] });
      toast({ title: "Success", description: "Claims updated successfully." });
      setSelectedClaims([]);
      setBulkStatus("");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update claims.", variant: "destructive" });
    },
  });

  const bulkDeleteClaimsMutation = useMutation({
    mutationFn: async (claimIds: string[]) => {
      return apiRequest('/api/admin/claims/bulk-delete', 'POST', { claimIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/staff/claims'] });
      toast({ title: "Success", description: "Claims deleted successfully." });
      setSelectedClaims([]);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete claims.", variant: "destructive" });
    },
  });

  const upsertSettingMutation = useMutation({
    mutationFn: async (setting: { key: string; value: string; category: string; description?: string }) => {
      return apiRequest('/api/admin/settings', 'PUT', setting);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      toast({ title: "Success", description: "Setting saved successfully." });
      setShowSettingDialog(false);
      setSettingKey("");
      setSettingValue("");
      setSettingDescription("");
      setSettingCategory("general");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to save setting.", variant: "destructive" });
    },
  });

  const deleteSettingMutation = useMutation({
    mutationFn: async (key: string) => {
      return apiRequest(`/api/admin/settings/${key}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      toast({ title: "Success", description: "Setting deleted successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete setting.", variant: "destructive" });
    },
  });

  const handleSaveUser = () => {
    if (!selectedUser) return;

    if (selectedUser.id) {
      updateUserMutation.mutate({ id: selectedUser.id, updates: selectedUser });
    } else {
      createUserMutation.mutate(selectedUser);
    }
  };

  const handleToggleClaimSelection = (claimId: string) => {
    setSelectedClaims(prev =>
      prev.includes(claimId)
        ? prev.filter(id => id !== claimId)
        : [...prev, claimId]
    );
  };

  const handleBulkUpdateStatus = () => {
    if (selectedClaims.length === 0 || !bulkStatus) {
      toast({ title: "Error", description: "Select claims and status", variant: "destructive" });
      return;
    }
    bulkUpdateClaimStatusMutation.mutate({ claimIds: selectedClaims, status: bulkStatus });
  };

  const handleBulkDeleteClaims = () => {
    if (selectedClaims.length === 0) {
      toast({ title: "Error", description: "Select claims to delete", variant: "destructive" });
      return;
    }
    if (confirm(`Delete ${selectedClaims.length} claims?`)) {
      bulkDeleteClaimsMutation.mutate(selectedClaims);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You must be an admin to access this page.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold" data-testid="heading-admin-dashboard">Admin Dashboard</h1>
            <p className="text-muted-foreground">System administration and management</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="overflow-x-auto">
            <TabsList className="grid w-full grid-cols-5 min-w-max lg:min-w-0">
              <TabsTrigger value="analytics" data-testid="tab-analytics">
                <BarChart3 className="h-4 w-4 sm:mr-2" aria-label="Analytics" />
                <span className="sr-only sm:not-sr-only">Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="users" data-testid="tab-users">
                <Users className="h-4 w-4 sm:mr-2" aria-label="Users" />
                <span className="sr-only sm:not-sr-only">Users</span>
              </TabsTrigger>
              <TabsTrigger value="claims" data-testid="tab-claims">
                <FileText className="h-4 w-4 sm:mr-2" aria-label="Claims" />
                <span className="sr-only sm:not-sr-only">Claims</span>
              </TabsTrigger>
              <TabsTrigger value="settings" data-testid="tab-settings">
                <Settings className="h-4 w-4 sm:mr-2" aria-label="Settings" />
                <span className="sr-only sm:not-sr-only">Settings</span>
              </TabsTrigger>
              <TabsTrigger value="audit" data-testid="tab-audit">
                <Activity className="h-4 w-4 sm:mr-2" aria-label="Audit Logs" />
                <span className="sr-only sm:not-sr-only">Audit Logs</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
              <Card data-testid="card-total-users">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="stat-total-users">
                    {statsLoading ? "..." : stats?.totalUsers || 0}
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-total-claims">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="stat-total-claims">
                    {statsLoading ? "..." : stats?.totalClaims || 0}
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-users-by-role">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Users by Role</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {statsLoading ? (
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  ) : (
                    stats?.usersByRole.map(({ role, count }) => (
                      <div key={role} className="flex justify-between text-sm" data-testid={`role-count-${role}`}>
                        <span className="capitalize">{role}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card data-testid="card-claims-by-status">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Claims by Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {statsLoading ? (
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  ) : (
                    stats?.claimsByStatus.slice(0, 5).map(({ status, count }) => (
                      <div key={status} className="flex justify-between text-sm" data-testid={`status-count-${status}`}>
                        <span className="capitalize">{status.replace(/_/g, ' ')}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Analytics Visualizations */}
            {stats?.analytics && (
              <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 mt-4">
                {/* User Growth Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle>User Growth Trend (12 Months)</CardTitle>
                    <CardDescription>New users registered per month by role</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.analytics.userGrowth}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Area type="monotone" dataKey="roleData.admin" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" name="Admin" />
                          <Area type="monotone" dataKey="roleData.insurer" stackId="1" stroke="#3b82f6" fill="#3b82f6" name="Insurer" />
                          <Area type="monotone" dataKey="roleData.broker" stackId="1" stroke="#10b981" fill="#10b981" name="Broker" />
                          <Area type="monotone" dataKey="roleData.insured" stackId="1" stroke="#f59e0b" fill="#f59e0b" name="Insured" />
                          <Area type="monotone" dataKey="roleData.service_provider" stackId="1" stroke="#ef4444" fill="#ef4444" name="Service Provider" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Role Mix Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Role Mix: Current vs Previous Month</CardTitle>
                    <CardDescription>New user composition comparison</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={(() => {
                          // Restructure data to group by role with current and previous values
                          if (!stats?.analytics) return [];
                          
                          const analytics = stats.analytics; // Store to satisfy TypeScript
                          const roles = new Set([
                            ...analytics.roleMix.current.map(d => d.role),
                            ...analytics.roleMix.previous.map(d => d.role)
                          ]);
                          
                          return Array.from(roles).map(role => {
                            const currentData = analytics.roleMix.current.find(d => d.role === role);
                            const previousData = analytics.roleMix.previous.find(d => d.role === role);
                            
                            return {
                              role: role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, ' '),
                              current: currentData?.count || 0,
                              previous: previousData?.count || 0,
                            };
                          });
                        })()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="role" angle={-20} textAnchor="end" height={80} />
                          <YAxis label={{ value: 'New Users', angle: -90, position: 'insideLeft' }} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="previous" fill="#94a3b8" name="Previous Month" />
                          <Bar dataKey="current" fill="#3b82f6" name="Current Month" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* SLA Compliance */}
                <Card>
                  <CardHeader>
                    <CardTitle>Claims SLA Compliance</CardTitle>
                    <CardDescription>Average processing time vs SLA targets (days)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.analytics.slaCompliance}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="status" angle={-45} textAnchor="end" height={100} />
                          <YAxis label={{ value: 'Days', angle: -90, position: 'insideLeft' }} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="avgDays" fill="#3b82f6" name="Avg Processing Days" />
                          <Bar dataKey="slaTarget" fill="#10b981" name="SLA Target" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Backlog Aging */}
                <Card>
                  <CardHeader>
                    <CardTitle>Operational Backlog Aging</CardTitle>
                    <CardDescription>Open claims grouped by age (days)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.analytics.backlogAging}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="bucket" />
                          <YAxis label={{ value: 'Claims Count', angle: -90, position: 'insideLeft' }} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="count" fill="#f59e0b" name="Claims Count" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>User Management</CardTitle>
                  <Button
                    onClick={() => {
                      setSelectedUser({ id: '', email: '', firstName: '', lastName: '', role: 'insured' } as any);
                      setShowUserDialog(true);
                    }}
                    data-testid="button-create-user"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create User
                  </Button>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search users..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      data-testid="input-search-users"
                    />
                  </div>
                  <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-role-filter">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="insurer">Insurer</SelectItem>
                      <SelectItem value="broker">Broker</SelectItem>
                      <SelectItem value="insured">Insured</SelectItem>
                      <SelectItem value="service_provider">Service Provider</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="md:hidden space-y-4">
                  {usersLoading ? (
                    <p className="text-center text-muted-foreground">Loading...</p>
                  ) : users.length === 0 ? (
                    <p className="text-center text-muted-foreground">No users found</p>
                  ) : (
                    users.map((u) => (
                      <Card key={u.id} data-testid={`card-user-${u.id}`}>
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Name</p>
                              <p className="font-medium" data-testid={`text-user-name-${u.id}`}>
                                {u.firstName} {u.lastName}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Email</p>
                              <p data-testid={`text-user-email-${u.id}`}>{u.email}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Role</p>
                              <Badge variant="outline" data-testid={`badge-role-${u.id}`}>
                                {u.role}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Created</p>
                              <p>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}</p>
                            </div>
                            <div className="flex gap-2 pt-2">
                              <Button
                                variant="outline"
                                className="flex-1 min-h-[44px]"
                                onClick={() => {
                                  setSelectedUser(u);
                                  setShowUserDialog(true);
                                }}
                                data-testid={`button-edit-user-${u.id}`}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                className="flex-1 min-h-[44px]"
                                onClick={() => {
                                  setSelectedUser(u);
                                  setShowDeleteUserDialog(true);
                                }}
                                disabled={u.id === user?.id}
                                data-testid={`button-delete-user-${u.id}`}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
                <div className="overflow-x-auto md:overflow-visible">
                  <Table className="hidden md:table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersLoading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center">Loading...</TableCell>
                        </TableRow>
                      ) : users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center">No users found</TableCell>
                        </TableRow>
                      ) : (
                        users.map((u) => (
                          <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
                            <TableCell data-testid={`text-user-name-${u.id}`}>
                              {u.firstName} {u.lastName}
                            </TableCell>
                            <TableCell data-testid={`text-user-email-${u.id}`}>{u.email}</TableCell>
                            <TableCell>
                              <Badge variant="outline" data-testid={`badge-role-${u.id}`}>
                                {u.role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUser(u);
                                    setShowUserDialog(true);
                                  }}
                                  data-testid={`button-edit-user-${u.id}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUser(u);
                                    setShowDeleteUserDialog(true);
                                  }}
                                  disabled={u.id === user?.id}
                                  data-testid={`button-delete-user-${u.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="claims" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <CardTitle>Claims Management</CardTitle>
                  </div>
                  {selectedClaims.length > 0 && (
                    <>
                      <p className="text-sm text-muted-foreground mb-2 md:hidden" data-testid="text-selected-count">
                        {selectedClaims.length} claim{selectedClaims.length !== 1 ? 's' : ''} selected
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
                        <Select value={bulkStatus} onValueChange={setBulkStatus}>
                          <SelectTrigger className="w-full sm:w-auto" data-testid="select-bulk-status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="submitted">Submitted</SelectItem>
                            <SelectItem value="under_review">Under Review</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button onClick={handleBulkUpdateStatus} className="w-full sm:w-auto min-h-[44px]" data-testid="button-bulk-update">
                          Update Status ({selectedClaims.length})
                        </Button>
                        <Button variant="destructive" onClick={handleBulkDeleteClaims} className="w-full sm:w-auto min-h-[44px]" data-testid="button-bulk-delete">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete ({selectedClaims.length})
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="md:hidden space-y-4">
                  {claimsLoading ? (
                    <p className="text-center text-muted-foreground">Loading...</p>
                  ) : claims.length === 0 ? (
                    <p className="text-center text-muted-foreground">No claims found</p>
                  ) : (
                    claims.map((claim) => (
                      <Card key={claim.id} data-testid={`card-claim-${claim.id}`}>
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <Checkbox
                                checked={selectedClaims.includes(claim.id)}
                                onCheckedChange={() => handleToggleClaimSelection(claim.id)}
                                aria-label={`Select claim ${claim.claimReferenceNumber}`}
                                className="mt-1"
                                data-testid={`checkbox-select-claim-${claim.id}`}
                              />
                              <div className="flex-1 space-y-3">
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Reference</p>
                                  <p className="font-medium" data-testid={`text-claim-ref-${claim.id}`}>
                                    {claim.claimReferenceNumber}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                                  <Badge variant="outline" data-testid={`badge-status-${claim.id}`}>
                                    {claim.status}
                                  </Badge>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Policy Number</p>
                                  <p>{claim.policyNumber}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Created</p>
                                  <p>{new Date(claim.createdAt).toLocaleDateString()}</p>
                                </div>
                              </div>
                            </div>
                            <Link href={`/claim-form/${claim.id}`} className="w-full">
                              <Button variant="outline" size="sm" className="w-full min-h-[44px]" data-testid={`button-edit-claim-card-${claim.id}`}>
                                <Edit className="h-4 w-4 mr-2" />
                                View/Edit Claim
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
                <div className="overflow-x-auto md:overflow-visible">
                  <Table className="hidden md:table">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedClaims.length === claims.length && claims.length > 0}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedClaims(claims.map(c => c.id));
                              } else {
                                setSelectedClaims([]);
                              }
                            }}
                            aria-label="Select all claims"
                            data-testid="checkbox-select-all-claims"
                          />
                        </TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Policy Number</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {claimsLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center">Loading...</TableCell>
                        </TableRow>
                      ) : claims.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center">No claims found</TableCell>
                        </TableRow>
                      ) : (
                        claims.map((claim) => (
                          <TableRow key={claim.id} data-testid={`row-claim-${claim.id}`}>
                            <TableCell>
                              <Checkbox
                                checked={selectedClaims.includes(claim.id)}
                                onCheckedChange={() => handleToggleClaimSelection(claim.id)}
                                aria-label={`Select claim ${claim.claimReferenceNumber}`}
                                data-testid={`checkbox-select-claim-${claim.id}`}
                              />
                            </TableCell>
                            <TableCell data-testid={`text-claim-ref-${claim.id}`}>
                              {claim.claimReferenceNumber}
                            </TableCell>
                            <TableCell>{claim.policyNumber}</TableCell>
                            <TableCell>
                              <Badge variant="outline" data-testid={`badge-status-${claim.id}`}>
                                {claim.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(claim.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Link href={`/claim-form/${claim.id}`}>
                                <Button variant="outline" size="sm" data-testid={`button-edit-claim-${claim.id}`}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>System Settings</CardTitle>
                  <Button
                    onClick={() => {
                      setSettingKey("");
                      setSettingValue("");
                      setSettingDescription("");
                      setSettingCategory("general");
                      setShowSettingDialog(true);
                    }}
                    data-testid="button-create-setting"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Setting
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="md:hidden space-y-4">
                  {settingsLoading ? (
                    <p className="text-center text-muted-foreground">Loading...</p>
                  ) : settings.length === 0 ? (
                    <p className="text-center text-muted-foreground">No settings configured</p>
                  ) : (
                    settings.map((setting) => (
                      <Card key={setting.id} data-testid={`card-setting-${setting.key}`}>
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Key</p>
                              <p className="font-mono font-medium" data-testid={`text-setting-key-${setting.key}`}>
                                {setting.key}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Value</p>
                              <p className="break-words" data-testid={`text-setting-value-${setting.key}`}>
                                {setting.value}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Category</p>
                              <Badge variant="outline">{setting.category}</Badge>
                            </div>
                            {setting.description && (
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Description</p>
                                <p className="text-sm">{setting.description}</p>
                              </div>
                            )}
                            <div className="flex gap-2 pt-2">
                              <Button
                                variant="outline"
                                className="flex-1 min-h-[44px]"
                                onClick={() => {
                                  setSettingKey(setting.key);
                                  setSettingValue(setting.value);
                                  setSettingCategory(setting.category || 'general');
                                  setSettingDescription(setting.description || '');
                                  setShowSettingDialog(true);
                                }}
                                data-testid={`button-edit-setting-${setting.key}`}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                className="flex-1 min-h-[44px]"
                                onClick={() => {
                                  if (confirm(`Delete setting "${setting.key}"?`)) {
                                    deleteSettingMutation.mutate(setting.key);
                                  }
                                }}
                                data-testid={`button-delete-setting-${setting.key}`}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
                <div className="overflow-x-auto md:overflow-visible">
                  <Table className="hidden md:table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Key</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {settingsLoading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center">Loading...</TableCell>
                        </TableRow>
                      ) : settings.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center">No settings configured</TableCell>
                        </TableRow>
                      ) : (
                        settings.map((setting) => (
                          <TableRow key={setting.id} data-testid={`row-setting-${setting.key}`}>
                            <TableCell className="font-mono" data-testid={`text-setting-key-${setting.key}`}>
                              {setting.key}
                            </TableCell>
                            <TableCell className="max-w-xs truncate" data-testid={`text-setting-value-${setting.key}`}>
                              {setting.value}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{setting.category}</Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate text-muted-foreground">
                              {setting.description || 'No description'}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSettingKey(setting.key);
                                    setSettingValue(setting.value);
                                    setSettingCategory(setting.category || 'general');
                                    setSettingDescription(setting.description || '');
                                    setShowSettingDialog(true);
                                  }}
                                  data-testid={`button-edit-setting-${setting.key}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    if (confirm(`Delete setting "${setting.key}"?`)) {
                                      deleteSettingMutation.mutate(setting.key);
                                    }
                                  }}
                                  data-testid={`button-delete-setting-${setting.key}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Audit Logs</CardTitle>
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                  <Select
                    value={auditFilter.entityType || "all"}
                    onValueChange={(value) => setAuditFilter(prev => ({ ...prev, entityType: value === "all" ? "" : value }))}
                  >
                    <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-entity-filter">
                      <SelectValue placeholder="Filter by entity type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="claim">Claim</SelectItem>
                      <SelectItem value="system_setting">System Setting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="md:hidden space-y-4">
                  {auditLogsLoading ? (
                    <p className="text-center text-muted-foreground">Loading...</p>
                  ) : auditLogs.length === 0 ? (
                    <p className="text-center text-muted-foreground">No audit logs found</p>
                  ) : (
                    auditLogs.map((log) => (
                      <Card key={log.id} data-testid={`card-audit-${log.id}`}>
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Timestamp</p>
                              <p>{new Date(log.createdAt!).toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Admin</p>
                              <p className="font-medium">{log.adminId}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Action</p>
                              <Badge variant="outline" data-testid={`badge-action-${log.action}`}>
                                {log.action}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Entity</p>
                              <p className="capitalize">{log.entityType}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
                <div className="overflow-x-auto md:overflow-visible">
                  <Table className="hidden md:table">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Admin</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Entity Type</TableHead>
                        <TableHead>Entity ID</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogsLoading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center">Loading...</TableCell>
                        </TableRow>
                      ) : auditLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center">No audit logs found</TableCell>
                        </TableRow>
                      ) : (
                        auditLogs.map((log) => (
                          <TableRow key={log.id} data-testid={`row-audit-${log.id}`}>
                            <TableCell>
                              {new Date(log.createdAt!).toLocaleString()}
                            </TableCell>
                            <TableCell>{log.adminId}</TableCell>
                            <TableCell>
                              <Badge variant="outline" data-testid={`badge-action-${log.action}`}>
                                {log.action}
                              </Badge>
                            </TableCell>
                            <TableCell>{log.entityType}</TableCell>
                            <TableCell className="font-mono text-sm">
                              {log.entityId?.slice(0, 8)}...
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="max-w-full sm:max-w-2xl" data-testid="dialog-user-form">
          <DialogHeader>
            <DialogTitle>{selectedUser?.id ? 'Edit User' : 'Create User'}</DialogTitle>
            <DialogDescription>
              {selectedUser?.id ? 'Update user information' : 'Create a new user account'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={selectedUser?.firstName || ''}
                onChange={(e) => setSelectedUser(prev => prev ? { ...prev, firstName: e.target.value } : null)}
                data-testid="input-user-firstname"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={selectedUser?.lastName || ''}
                onChange={(e) => setSelectedUser(prev => prev ? { ...prev, lastName: e.target.value } : null)}
                data-testid="input-user-lastname"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={selectedUser?.email || ''}
                onChange={(e) => setSelectedUser(prev => prev ? { ...prev, email: e.target.value } : null)}
                data-testid="input-user-email"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={selectedUser?.role || 'insured'}
                onValueChange={(value) => setSelectedUser(prev => prev ? { ...prev, role: value as any } : null)}
              >
                <SelectTrigger data-testid="select-user-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="insurer">Insurer</SelectItem>
                  <SelectItem value="broker">Broker</SelectItem>
                  <SelectItem value="insured">Insured</SelectItem>
                  <SelectItem value="service_provider">Service Provider</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowUserDialog(false)} className="w-full sm:w-auto" data-testid="button-cancel-user">
              Cancel
            </Button>
            <Button
              onClick={handleSaveUser}
              disabled={createUserMutation.isPending || updateUserMutation.isPending}
              className="w-full sm:w-auto"
              data-testid="button-save-user"
            >
              {createUserMutation.isPending || updateUserMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteUserDialog} onOpenChange={setShowDeleteUserDialog}>
        <AlertDialogContent className="max-w-full sm:max-w-2xl" data-testid="dialog-delete-user">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto" data-testid="button-cancel-delete-user">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedUser && deleteUserMutation.mutate(selectedUser.id)}
              className="bg-destructive text-destructive-foreground w-full sm:w-auto"
              data-testid="button-confirm-delete-user"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showSettingDialog} onOpenChange={setShowSettingDialog}>
        <DialogContent className="max-w-full sm:max-w-2xl" data-testid="dialog-setting-form">
          <DialogHeader>
            <DialogTitle>{settingKey ? 'Edit Setting' : 'Add Setting'}</DialogTitle>
            <DialogDescription>
              Configure system settings
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="settingKey">Key</Label>
              <Input
                id="settingKey"
                value={settingKey}
                onChange={(e) => setSettingKey(e.target.value)}
                placeholder="SETTING_KEY"
                data-testid="input-setting-key"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="settingValue">Value</Label>
              <Textarea
                id="settingValue"
                value={settingValue}
                onChange={(e) => setSettingValue(e.target.value)}
                placeholder="Setting value"
                data-testid="input-setting-value"
              />
            </div>
            <div>
              <Label htmlFor="settingCategory">Category</Label>
              <Select value={settingCategory} onValueChange={setSettingCategory}>
                <SelectTrigger data-testid="select-setting-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="settingDescription">Description</Label>
              <Textarea
                id="settingDescription"
                value={settingDescription}
                onChange={(e) => setSettingDescription(e.target.value)}
                placeholder="Optional description"
                data-testid="input-setting-description"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowSettingDialog(false)} className="w-full sm:w-auto" data-testid="button-cancel-setting">
              Cancel
            </Button>
            <Button
              onClick={() => upsertSettingMutation.mutate({
                key: settingKey,
                value: settingValue,
                category: settingCategory,
                description: settingDescription || undefined,
              })}
              disabled={!settingKey || !settingValue || upsertSettingMutation.isPending}
              className="w-full sm:w-auto"
              data-testid="button-save-setting"
            >
              {upsertSettingMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

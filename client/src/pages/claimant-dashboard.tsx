import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useStandaloneAuth } from "@/hooks/useStandaloneAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import {
  FileText, Clock, CheckCircle, DollarSign, Plus, LayoutDashboard,
  ArrowRight, Car, Download, Eye, Edit, ChevronRight, Layers, TrendingUp
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import type { ClaimWithDetails } from "@shared/schema";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; dot: string }> = {
    draft:        { label: "Draft",        cls: "badge-draft",     dot: "bg-slate-400" },
    submitted:    { label: "Submitted",    cls: "badge-submitted", dot: "bg-blue-500" },
    under_review: { label: "Under Review", cls: "badge-review",    dot: "bg-amber-500" },
    approved:     { label: "Approved",     cls: "badge-approved",  dot: "bg-emerald-500" },
    rejected:     { label: "Rejected",     cls: "badge-rejected",  dot: "bg-red-500" },
    paid:         { label: "Paid",         cls: "badge-paid",      dot: "bg-purple-500" },
    completed:    { label: "Completed",    cls: "badge-approved",  dot: "bg-emerald-500" },
  };
  const s = map[status] || { label: status, cls: "badge-draft", dot: "bg-slate-400" };
  return (
    <span className={s.cls}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function StatCard({ icon: Icon, value, label, sub, color, trend }: {
  icon: any; value: string; label: string; sub?: string; color: string; trend?: string;
}) {
  return (
    <div className="stat-card group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center shadow-sm`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-xs font-medium text-emerald-600">
            <TrendingUp className="h-3 w-3" />
            {trend}
          </div>
        )}
      </div>
      <div className="text-2xl font-extrabold text-foreground tracking-tight">{value}</div>
      <div className="text-sm font-medium text-foreground mt-0.5">{label}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr>
      {[...Array(6)].map((_, i) => (
        <td key={i} className="px-6 py-4">
          <div className="skeleton h-4 w-24" />
        </td>
      ))}
    </tr>
  );
}

export default function ClaimantDashboard() {
  const { user, isAuthenticated, isLoading } = useStandaloneAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({ title: "Session expired", description: "Please sign in again.", variant: "destructive" });
      setTimeout(() => { window.location.href = "/auth"; }, 500);
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: claims = [], isLoading: claimsLoading } = useQuery<ClaimWithDetails[]>({
    queryKey: ["/api/claims"],
    enabled: isAuthenticated,
  });

  const handleDownloadPDF = async (claimId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/claims/${claimId}/pdf`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        credentials: 'include',
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `claim-${claimId.substring(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({ title: "PDF downloaded", description: "Your claim report has been downloaded." });
    } catch {
      toast({ title: "Download failed", description: "Please try again.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground font-medium">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const stats = {
    total: claims.length,
    pending: claims.filter(c => c.status === 'under_review' || c.status === 'submitted').length,
    approved: claims.filter(c => c.status === 'approved' || c.status === 'paid' || c.status === 'completed').length,
    payout: claims
      .filter(c => c.status === 'paid' || c.status === 'approved')
      .reduce((s, c) => s + Number(c.finalSettlementAmount || 0), 0),
    drafts: claims.filter(c => c.status === 'draft').length,
  };

  const recentClaims = [...claims].sort((a, b) =>
    new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
  );

  return (
    <div className="min-h-screen bg-[hsl(210,20%,98%)]">
      <AppHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
              Welcome back, {user?.firstName}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Here's an overview of your insurance claims
            </p>
          </div>
          <div className="flex items-center gap-3">
            {stats.drafts > 0 && (
              <Button variant="outline" onClick={() => setLocation("/drafts")} className="gap-2 shadow-sm">
                <Layers className="h-4 w-4" />
                Drafts
                <span className="ml-1 bg-amber-100 text-amber-700 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                  {stats.drafts}
                </span>
              </Button>
            )}
            <Button onClick={() => setLocation("/claim-form")} className="gap-2 shadow-sm">
              <Plus className="h-4 w-4" />
              New claim
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-slide-up">
          <StatCard
            icon={FileText}
            value={String(stats.total)}
            label="Total claims"
            sub="All time"
            color="bg-gradient-to-br from-blue-500 to-blue-600"
          />
          <StatCard
            icon={Clock}
            value={String(stats.pending)}
            label="Under review"
            sub="Awaiting decision"
            color="bg-gradient-to-br from-amber-400 to-orange-500"
          />
          <StatCard
            icon={CheckCircle}
            value={String(stats.approved)}
            label="Approved"
            sub="Successfully settled"
            color="bg-gradient-to-br from-emerald-500 to-teal-600"
          />
          <StatCard
            icon={DollarSign}
            value={stats.payout.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
            label="Total payout"
            sub="From approved claims"
            color="bg-gradient-to-br from-violet-500 to-purple-600"
          />
        </div>

        {/* Claims table */}
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div>
              <h2 className="font-semibold text-foreground">Recent claims</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{claims.length} claim{claims.length !== 1 ? 's' : ''} total</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setLocation("/claim-form")} className="gap-1.5 text-primary hover:text-primary">
              <Plus className="h-3.5 w-3.5" />
              New claim
            </Button>
          </div>

          <div className="overflow-x-auto">
            {claimsLoading ? (
              <table className="w-full">
                <tbody>{[...Array(4)].map((_, i) => <SkeletonRow key={i} />)}</tbody>
              </table>
            ) : claims.length === 0 ? (
              /* Empty state */
              <div className="py-20 text-center px-6">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Car className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1">No claims yet</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
                  Submit your first motor accident claim and our AI will assess the damage automatically.
                </p>
                <Button onClick={() => setLocation("/claim-form")} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Submit your first claim
                </Button>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-border">
                    {["Reference", "Date", "Vehicle", "Status", "AI Analysis", "Actions"].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentClaims.map((claim) => (
                    <tr
                      key={claim.id}
                      className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                      onClick={() => claim.status === 'draft'
                        ? setLocation(`/claim-form/${claim.id}`)
                        : setLocation(`/claim-details/${claim.id}`)
                      }
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-primary/10 rounded-md flex items-center justify-center">
                            <FileText className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <span className="text-sm font-semibold text-foreground font-mono">
                            {claim.claimReference || claim.id.substring(0, 8).toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-muted-foreground">
                          {new Date(claim.createdAt!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-foreground">
                          {claim.vehicle ? `${claim.vehicle.make} ${claim.vehicle.model}` : <span className="text-muted-foreground italic">Not specified</span>}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={claim.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {claim.damagedPhotos?.length > 0 ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                            <CheckCircle className="h-3.5 w-3.5" />
                            Complete
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {claim.status === 'draft' ? (
                            <Button size="sm" variant="ghost" onClick={() => setLocation(`/claim-form/${claim.id}`)} className="h-7 px-2 gap-1 text-primary hover:text-primary hover:bg-primary/10">
                              <Edit className="h-3.5 w-3.5" />
                              Continue
                            </Button>
                          ) : (
                            <Button size="sm" variant="ghost" onClick={() => setLocation(`/claim-details/${claim.id}`)} className="h-7 px-2 gap-1 text-primary hover:text-primary hover:bg-primary/10">
                              <Eye className="h-3.5 w-3.5" />
                              View
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => handleDownloadPDF(claim.id)} className="h-7 px-2 gap-1 text-muted-foreground hover:text-foreground">
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:opacity-0 transition-opacity" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

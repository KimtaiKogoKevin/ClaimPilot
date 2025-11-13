import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, Lock, Unlock, Wifi, WifiOff } from "lucide-react";
import type { CollaborationStatus } from "@/hooks/useClaimCollaboration";

interface ClaimCollaborationStatusProps {
  status: CollaborationStatus;
}

export function ClaimCollaborationStatus({ status }: ClaimCollaborationStatusProps) {
  if (!status.isConnected) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg border">
        <WifiOff className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Offline</span>
      </div>
    );
  }

  if (status.isLocked && status.lockedBy) {
    const isAdmin = status.lockedBy.userRole === 'admin';
    const lockLabel = isAdmin ? 'Admin' : status.lockedBy.userRole.charAt(0).toUpperCase() + status.lockedBy.userRole.slice(1);
    
    return (
      <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20" data-testid="alert-claim-locked">
        <Lock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        <AlertDescription className="text-sm">
          <span className="font-medium">{lockLabel} {status.lockedBy.userName}</span> is currently editing this claim.
          You can view but not edit until they finish.
        </AlertDescription>
      </Alert>
    );
  }

  if (status.isEditor) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800" data-testid="div-editing-status">
        <Unlock className="h-4 w-4 text-green-600 dark:text-green-400" />
        <span className="text-sm font-medium text-green-700 dark:text-green-300">You are editing</span>
        <Badge variant="secondary" className="ml-auto">
          <Wifi className="h-3 w-3 mr-1" />
          Live
        </Badge>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg border">
      <Users className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">Viewing</span>
      <Badge variant="outline" className="ml-auto">
        <Wifi className="h-3 w-3 mr-1" />
        Connected
      </Badge>
    </div>
  );
}

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, RefreshCw, User, FileEdit } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { ChangeHistoryItem } from "@/hooks/useClaimCollaboration";

interface ClaimChangeHistoryProps {
  history: ChangeHistoryItem[];
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function ClaimChangeHistory({ 
  history, 
  onRefresh,
  isRefreshing = false 
}: ClaimChangeHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'insurer':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'broker':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'insured':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const formatFieldName = (fieldName?: string) => {
    if (!fieldName) return '';
    return fieldName
      .split(/(?=[A-Z])/)
      .join(' ')
      .toLowerCase()
      .replace(/^./, str => str.toUpperCase());
  };

  return (
    <Card data-testid="card-change-history">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5" />
            <div>
              <CardTitle className="text-lg">Change History</CardTitle>
              <CardDescription>
                Track all changes made to this claim
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isRefreshing}
                data-testid="button-refresh-history"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center" data-testid="div-no-history">
              <FileEdit className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                No changes recorded yet
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item, index) => (
                <div
                  key={item.id || index}
                  className="border-l-2 border-muted pl-4 pb-4 last:pb-0 relative"
                  data-testid={`div-history-item-${index}`}
                >
                  <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-primary" />
                  
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{item.userName}</span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getRoleBadgeColor(item.userRole)}`}
                      >
                        {item.userRole}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm">
                      <span className="text-muted-foreground">{item.action}</span>
                      {item.fieldName && (
                        <span className="font-medium ml-1">
                          {formatFieldName(item.fieldName)}
                        </span>
                      )}
                    </p>
                    
                    {item.description && (
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    )}

                    {item.newValue && (
                      <div className="mt-2 text-xs bg-muted/50 rounded p-2">
                        <span className="text-muted-foreground">New value: </span>
                        <span className="font-mono">
                          {item.newValue.length > 100 
                            ? `${item.newValue.substring(0, 100)}...` 
                            : item.newValue}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

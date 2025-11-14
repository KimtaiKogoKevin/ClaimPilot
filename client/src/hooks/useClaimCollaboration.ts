import { useState, useEffect, useCallback, useRef } from 'react';
import type { ClaimEditSession } from '@shared/schema';

export interface CollaborationStatus {
  isConnected: boolean;
  isEditor: boolean;
  isLocked: boolean;
  lockedBy?: {
    userId: string;
    userName: string;
    userRole: string;
    since: string;
  };
  sessionId?: string;
}

export interface FieldUpdate {
  field: string;
  value: any;
  changedBy: {
    userId: string;
    userName: string;
    userRole: string;
  };
}

export interface ChangeHistoryItem {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  description?: string;
  createdAt: string;
}

export function useClaimCollaboration(
  claimId: string | undefined,
  userId: string | undefined,
  userName: string,
  userRole: string,
  onFieldUpdate?: (update: FieldUpdate) => void
) {
  const [status, setStatus] = useState<CollaborationStatus>({
    isConnected: false,
    isEditor: false,
    isLocked: false,
  });
  const [history, setHistory] = useState<ChangeHistoryItem[]>([]);
  const [lastUpdate, setLastUpdate] = useState<FieldUpdate | null>(null);
  
  const ws = useRef<WebSocket | null>(null);
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);

  const connect = useCallback(() => {
    if (!claimId || !userId || !isMounted.current || ws.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    
    // Get auth token from localStorage (set by authentication)
    const authToken = localStorage.getItem('authToken');
    const wsUrl = authToken
      ? `${protocol}//${window.location.host}/ws/collaboration?token=${authToken}`
      : `${protocol}//${window.location.host}/ws/collaboration`;
    
    console.log('[Collaboration] Connecting to:', wsUrl);
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('[Collaboration] Connected');
      
      // Ensure websocket is still open and mounted before sending
      if (!ws.current || ws.current.readyState !== WebSocket.OPEN || !isMounted.current) {
        return;
      }
      
      try {
        // If no token in URL, authenticate via message
        if (!authToken) {
          const token = localStorage.getItem('authToken');
          if (token) {
            ws.current.send(JSON.stringify({
              type: 'authenticate',
              token,
            }));
          }
        }
        
        // Join the claim room
        ws.current.send(JSON.stringify({
          type: 'join_claim',
          claimId,
        }));
      } catch (error) {
        console.error('[Collaboration] Error sending initial messages:', error);
      }

      // Start heartbeat
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
      heartbeatInterval.current = setInterval(() => {
        if (ws.current?.readyState === WebSocket.OPEN) {
          try {
            ws.current.send(JSON.stringify({ type: 'heartbeat' }));
          } catch (error) {
            console.error('[Collaboration] Error sending heartbeat:', error);
          }
        }
      }, 30000);
    };

    ws.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('[Collaboration] Message received:', message.type);

        switch (message.type) {
          case 'joined':
            setStatus(prev => ({
              ...prev,
              isConnected: true,
              isEditor: message.isEditor,
              sessionId: message.sessionId,
              isLocked: false,
            }));
            // Request history when joined
            if (ws.current?.readyState === WebSocket.OPEN) {
              try {
                ws.current.send(JSON.stringify({ 
                  type: 'request_history',
                  claimId 
                }));
              } catch (error) {
                console.error('[Collaboration] Error requesting history:', error);
              }
            }
            break;

          case 'claim_locked':
            setStatus(prev => ({
              ...prev,
              isConnected: true,
              isEditor: false,
              isLocked: true,
              lockedBy: message.lockedBy,
            }));
            break;

          case 'user_joined':
            // Another user joined the claim
            console.log('[Collaboration] User joined:', message.user.userName);
            break;

          case 'user_left':
            console.log('[Collaboration] User left:', message.userName);
            break;

          case 'field_changed':
            const update: FieldUpdate = {
              field: message.field,
              value: message.value,
              changedBy: message.changedBy,
            };
            setLastUpdate(update);
            if (onFieldUpdate) {
              onFieldUpdate(update);
            }
            break;

          case 'history':
            setHistory(message.history);
            break;

          case 'heartbeat_ack':
            // Heartbeat acknowledged
            break;

          case 'error':
            console.error('[Collaboration] Error:', message.message);
            break;
        }
      } catch (error) {
        console.error('[Collaboration] Message parsing error:', error);
      }
    };

    ws.current.onclose = () => {
      console.log('[Collaboration] Disconnected');
      setStatus(prev => ({ ...prev, isConnected: false, isEditor: false }));
      
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
        heartbeatInterval.current = null;
      }

      // Attempt reconnect after 3 seconds
      reconnectTimeout.current = setTimeout(() => {
        connect();
      }, 3000);
    };

    ws.current.onerror = (error) => {
      console.error('[Collaboration] WebSocket error:', error);
    };
  }, [claimId, userId, userName, userRole, onFieldUpdate]);

  const disconnect = useCallback(() => {
    if (ws.current) {
      // Only send leave message if websocket is already open
      if (ws.current.readyState === WebSocket.OPEN) {
        try {
          ws.current.send(JSON.stringify({ type: 'leave_claim' }));
        } catch (error) {
          console.error('[Collaboration] Error sending leave message:', error);
        }
      }
      ws.current.close();
      ws.current = null;
    }
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
      heartbeatInterval.current = null;
    }
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }
  }, []);

  const sendFieldUpdate = useCallback((field: string, value: any) => {
    if (ws.current?.readyState === WebSocket.OPEN && status.isEditor) {
      ws.current.send(JSON.stringify({
        type: 'field_update',
        claimId,
        field,
        value,
      }));
    }
  }, [claimId, status.isEditor]);

  const refreshHistory = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ 
        type: 'request_history',
        claimId 
      }));
    }
  }, [claimId]);

  useEffect(() => {
    isMounted.current = true;
    if (claimId && userId) {
      connect();
    }
    return () => {
      isMounted.current = false;
      disconnect();
    };
  }, [claimId, userId, connect, disconnect]);

  return {
    status,
    history,
    lastUpdate,
    sendFieldUpdate,
    refreshHistory,
    disconnect,
  };
}

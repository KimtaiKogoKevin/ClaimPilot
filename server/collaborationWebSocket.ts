import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { storage } from './storage';
import type { ClaimEditSession } from '@shared/schema';
import { verifyToken } from './auth/jwt';
import { parse } from 'url';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  userName?: string;
  userRole?: string;
  claimId?: string;
  sessionId?: string;
  isAuthenticated?: boolean;
}

interface WebSocketMessage {
  type: 'authenticate' | 'join_claim' | 'leave_claim' | 'field_update' | 'heartbeat' | 'lock_status' | 'request_history';
  token?: string;
  claimId?: string;
  field?: string;
  value?: any;
}

export function setupCollaborationWebSocket(server: Server) {
  const wss = new WebSocketServer({ 
    server,
    path: '/ws/collaboration'
  });

  // Map of claimId -> Set of connected clients
  const claimRooms = new Map<string, Set<AuthenticatedWebSocket>>();

  // Heartbeat to detect dead connections
  const interval = setInterval(() => {
    wss.clients.forEach((ws: any) => {
      if (ws.isAlive === false) {
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  wss.on('connection', async (ws: AuthenticatedWebSocket, req) => {
    console.log('[Collaboration WS] New connection');
    (ws as any).isAlive = true;
    ws.isAuthenticated = false;

    // Try to authenticate from query params if token is provided
    const parsedUrl = parse(req.url || '', true);
    const tokenFromQuery = parsedUrl.query.token as string;

    if (tokenFromQuery) {
      try {
        const decoded = verifyToken(tokenFromQuery);
        if (decoded && decoded.userId) {
          const user = await storage.getUser(decoded.userId);
          if (user) {
            ws.userId = user.id;
            ws.userName = `${user.firstName} ${user.lastName}`;
            ws.userRole = user.role;
            ws.isAuthenticated = true;
            console.log('[Collaboration WS] Authenticated via query param:', ws.userName);
          }
        }
      } catch (error) {
        console.error('[Collaboration WS] Token validation failed:', error);
      }
    }

    ws.on('pong', () => {
      (ws as any).isAlive = true;
    });

    ws.on('message', async (data: Buffer) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString());
        console.log('[Collaboration WS] Received:', message.type, message.claimId);

        switch (message.type) {
          case 'authenticate':
            await handleAuthenticate(ws, message);
            break;

          case 'join_claim':
            await handleJoinClaim(ws, message);
            break;

          case 'leave_claim':
            await handleLeaveClaim(ws);
            break;

          case 'field_update':
            await handleFieldUpdate(ws, message);
            break;

          case 'heartbeat':
            // Update session activity
            if (ws.sessionId) {
              await storage.updateEditSessionActivity(ws.sessionId);
            }
            ws.send(JSON.stringify({ type: 'heartbeat_ack' }));
            break;

          case 'request_history':
            await handleHistoryRequest(ws, message);
            break;
        }
      } catch (error) {
        console.error('[Collaboration WS] Error:', error);
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: error instanceof Error ? error.message : 'Unknown error'
        }));
      }
    });

    ws.on('close', async () => {
      console.log('[Collaboration WS] Connection closed');
      await handleLeaveClaim(ws);
    });

    ws.on('error', (error) => {
      console.error('[Collaboration WS] Error:', error);
    });
  });

  async function handleAuthenticate(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    if (!message.token) {
      ws.send(JSON.stringify({ type: 'error', message: 'Authentication token required' }));
      return;
    }

    try {
      const decoded = verifyToken(message.token);
      if (!decoded || !decoded.userId) {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid token' }));
        return;
      }

      const user = await storage.getUser(decoded.userId);
      if (!user) {
        ws.send(JSON.stringify({ type: 'error', message: 'User not found' }));
        return;
      }

      ws.userId = user.id;
      ws.userName = `${user.firstName} ${user.lastName}`;
      ws.userRole = user.role;
      ws.isAuthenticated = true;

      ws.send(JSON.stringify({ 
        type: 'authenticated',
        user: {
          id: user.id,
          name: ws.userName,
          role: user.role
        }
      }));

      console.log('[Collaboration WS] Authenticated:', ws.userName);
    } catch (error) {
      console.error('[Collaboration WS] Authentication error:', error);
      ws.send(JSON.stringify({ type: 'error', message: 'Authentication failed' }));
    }
  }

  async function handleJoinClaim(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    const { claimId } = message;

    // Validate authentication
    if (!ws.isAuthenticated || !ws.userId || !ws.userName || !ws.userRole) {
      ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated. Please authenticate first.' }));
      return;
    }

    if (!claimId) {
      ws.send(JSON.stringify({ type: 'error', message: 'Missing claimId' }));
      return;
    }

    try {
      // Check if there's already an active edit session
      const existingSession = await storage.getActiveEditSession(claimId);

      if (existingSession && existingSession.userId !== ws.userId) {
        // Claim is locked by another user
        ws.send(JSON.stringify({ 
          type: 'claim_locked',
          lockedBy: {
            userId: existingSession.userId,
            userName: existingSession.userName,
            userRole: existingSession.userRole,
            since: existingSession.startedAt
          }
        }));
        
        // Add to room as viewer only (can't edit)
        ws.claimId = claimId;
        
        if (!claimRooms.has(claimId)) {
          claimRooms.set(claimId, new Set());
        }
        claimRooms.get(claimId)!.add(ws);
        
        return;
      }

      // Start edit session (or rejoin existing session)
      const session = await storage.startEditSession(claimId, ws.userId, ws.userName, ws.userRole);

      ws.claimId = claimId;
      ws.sessionId = session.id;

      // Add to claim room
      if (!claimRooms.has(claimId)) {
        claimRooms.set(claimId, new Set());
      }
      claimRooms.get(claimId)!.add(ws);

      // Notify all clients in the room about the new editor
      broadcastToRoom(claimId, {
        type: 'user_joined',
        user: {
          userId: ws.userId,
          userName: ws.userName,
          userRole: ws.userRole,
          isEditor: true
        }
      }, ws);

      // Send success response
      ws.send(JSON.stringify({
        type: 'joined',
        sessionId: session.id,
        isEditor: true
      }));

      console.log(`[Collaboration WS] User ${ws.userName} joined claim ${claimId} as editor`);
    } catch (error) {
      console.error('[Collaboration WS] Error joining claim:', error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to join claim'
      }));
    }
  }

  async function handleLeaveClaim(ws: AuthenticatedWebSocket) {
    if (!ws.claimId) return;

    const claimId = ws.claimId;

    // End edit session if exists
    if (ws.sessionId) {
      try {
        await storage.endEditSession(ws.sessionId);
      } catch (error) {
        console.error('[Collaboration WS] Error ending session:', error);
      }
    }

    // Remove from room
    const room = claimRooms.get(claimId);
    if (room) {
      room.delete(ws);
      
      // Notify others that user left
      broadcastToRoom(claimId, {
        type: 'user_left',
        userId: ws.userId,
        userName: ws.userName
      });

      // Clean up empty rooms
      if (room.size === 0) {
        claimRooms.delete(claimId);
      }
    }

    console.log(`[Collaboration WS] User ${ws.userName} left claim ${claimId}`);
  }

  async function handleFieldUpdate(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    const { claimId, field, value } = message;

    if (!ws.sessionId || !claimId || !field) {
      ws.send(JSON.stringify({ type: 'error', message: 'Not authorized to edit' }));
      return;
    }

    try {
      // Log the change to history
      await storage.addClaimChange({
        claimId,
        userId: ws.userId!,
        userName: ws.userName!,
        userRole: ws.userRole as any,
        action: 'updated',
        fieldName: field,
        newValue: typeof value === 'string' ? value : JSON.stringify(value),
        description: `Updated ${field}`
      });

      // Broadcast field update to all other clients in the room
      broadcastToRoom(claimId, {
        type: 'field_changed',
        field,
        value,
        changedBy: {
          userId: ws.userId,
          userName: ws.userName,
          userRole: ws.userRole
        }
      }, ws);

      console.log(`[Collaboration WS] Field ${field} updated in claim ${claimId}`);
    } catch (error) {
      console.error('[Collaboration WS] Error updating field:', error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Failed to update field' 
      }));
    }
  }

  async function handleHistoryRequest(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    const { claimId } = message;

    if (!claimId) {
      ws.send(JSON.stringify({ type: 'error', message: 'Missing claimId' }));
      return;
    }

    try {
      const history = await storage.getClaimChangeHistory(claimId, 100);
      ws.send(JSON.stringify({
        type: 'history',
        history
      }));
    } catch (error) {
      console.error('[Collaboration WS] Error fetching history:', error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Failed to fetch history' 
      }));
    }
  }

  function broadcastToRoom(claimId: string, message: any, excludeWs?: WebSocket) {
    const room = claimRooms.get(claimId);
    if (!room) return;

    const messageStr = JSON.stringify(message);
    room.forEach((client) => {
      if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  console.log('[Collaboration WS] WebSocket server initialized on /ws/collaboration');

  return wss;
}

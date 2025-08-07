import { io, Socket } from 'socket.io-client';

interface SocketEvents {
  // Client to Server Events
  'join-room': (data: { roomId: string; userId: string }) => void;
  'leave-room': (data: { roomId: string; userId: string }) => void;
  'send-message': (data: { roomId: string; message: string; userId: string }) => void;
  'cast-vote': (data: { motionId: string; vote: 'for' | 'against' | 'abstain'; userId: string }) => void;
  'request-speak': (data: { roomId: string; userId: string }) => void;

  // Server to Client Events
  'user-joined': (data: { userId: string; userName: string; roomId: string }) => void;
  'user-left': (data: { userId: string; userName: string; roomId: string }) => void;
  'new-message': (data: { messageId: string; userId: string; message: string; timestamp: string; userName: string }) => void;
  'vote-cast': (data: { motionId: string; vote: string; userId: string; totalVotes: any }) => void;
  'motion-status-changed': (data: { motionId: string; newStatus: string; previousStatus: string }) => void;
  'speak-request': (data: { userId: string; userName: string; roomId: string }) => void;
  'speaker-approved': (data: { userId: string; userName: string; roomId: string }) => void;
  'speaker-denied': (data: { userId: string; userName: string; roomId: string; reason?: string }) => void;
}

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(userId: string): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    
    this.socket = io(SOCKET_URL, {
      auth: {
        token: localStorage.getItem('parliament_token'),
        userId,
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
    });

    this.setupEventListeners();
    return this.socket;
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected successfully');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.handleReconnect();
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.socket?.connect();
      }, 2000 * this.reconnectAttempts);
    }
  }

  // Room management
  joinRoom(roomId: string, userId: string): void {
    this.socket?.emit('join-room', { roomId, userId });
  }

  leaveRoom(roomId: string, userId: string): void {
    this.socket?.emit('leave-room', { roomId, userId });
  }

  // Messaging
  sendMessage(roomId: string, message: string, userId: string): void {
    this.socket?.emit('send-message', { roomId, message, userId });
  }

  // Voting
  castVote(motionId: string, vote: 'for' | 'against' | 'abstain', userId: string): void {
    this.socket?.emit('cast-vote', { motionId, vote, userId });
  }

  // Speaking requests
  requestToSpeak(roomId: string, userId: string): void {
    this.socket?.emit('request-speak', { roomId, userId });
  }

  // Event listeners
  onUserJoined(callback: (data: { userId: string; userName: string; roomId: string }) => void): void {
    this.socket?.on('user-joined', callback);
  }

  onUserLeft(callback: (data: { userId: string; userName: string; roomId: string }) => void): void {
    this.socket?.on('user-left', callback);
  }

  onNewMessage(callback: (data: { messageId: string; userId: string; message: string; timestamp: string; userName: string }) => void): void {
    this.socket?.on('new-message', callback);
  }

  onVoteCast(callback: (data: { motionId: string; vote: string; userId: string; totalVotes: any }) => void): void {
    this.socket?.on('vote-cast', callback);
  }

  onMotionStatusChanged(callback: (data: { motionId: string; newStatus: string; previousStatus: string }) => void): void {
    this.socket?.on('motion-status-changed', callback);
  }

  onSpeakRequest(callback: (data: { userId: string; userName: string; roomId: string }) => void): void {
    this.socket?.on('speak-request', callback);
  }

  onSpeakerApproved(callback: (data: { userId: string; userName: string; roomId: string }) => void): void {
    this.socket?.on('speaker-approved', callback);
  }

  onSpeakerDenied(callback: (data: { userId: string; userName: string; roomId: string; reason?: string }) => void): void {
    this.socket?.on('speaker-denied', callback);
  }

  // Remove event listeners
  off(event: string, callback?: (...args: any[]) => void): void {
    this.socket?.off(event, callback);
  }

  // Disconnect
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Get socket instance
  getSocket(): Socket | null {
    return this.socket;
  }

  // Check connection status
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;
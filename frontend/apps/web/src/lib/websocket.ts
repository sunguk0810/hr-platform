import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/authStore';

export interface WebSocketConfig {
  url?: string;
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

export interface WebSocketEvents {
  // Notifications
  'notification:new': (notification: NotificationEvent) => void;
  'notification:read': (notificationId: string) => void;
  'notification:count': (count: number) => void;

  // Approvals
  'approval:status_changed': (event: ApprovalStatusEvent) => void;
  'approval:new_request': (event: ApprovalRequestEvent) => void;

  // Attendance
  'attendance:checked_in': (event: AttendanceEvent) => void;
  'attendance:checked_out': (event: AttendanceEvent) => void;

  // General
  'connect': () => void;
  'disconnect': (reason: string) => void;
  'error': (error: Error) => void;
}

export interface NotificationEvent {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  data?: Record<string, unknown>;
}

export interface ApprovalStatusEvent {
  approvalId: string;
  documentNumber: string;
  title: string;
  status: string;
  approverName: string;
  processedAt: string;
}

export interface ApprovalRequestEvent {
  approvalId: string;
  documentNumber: string;
  title: string;
  requesterName: string;
  type: string;
  createdAt: string;
}

export interface AttendanceEvent {
  employeeId: string;
  employeeName: string;
  time: string;
  date: string;
}

type EventCallback<T> = (data: T) => void;

class WebSocketClient {
  private socket: Socket | null = null;
  private config: WebSocketConfig;
  private eventHandlers: Map<string, Set<EventCallback<unknown>>> = new Map();

  constructor(config: WebSocketConfig = {}) {
    this.config = {
      url: import.meta.env.VITE_WS_URL || 'ws://localhost:8080',
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      ...config,
    };
  }

  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    const { accessToken, tenantId } = useAuthStore.getState();

    if (!accessToken) {
      console.warn('WebSocket: No access token available');
      return;
    }

    this.socket = io(this.config.url!, {
      autoConnect: true,
      reconnection: this.config.reconnection,
      reconnectionAttempts: this.config.reconnectionAttempts,
      reconnectionDelay: this.config.reconnectionDelay,
      auth: {
        token: accessToken,
        tenantId,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupSocketListeners();
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private setupSocketListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      import.meta.env.DEV && console.log('WebSocket connected');
      this.emit('connect');
    });

    this.socket.on('disconnect', (reason) => {
      import.meta.env.DEV && console.log('WebSocket disconnected:', reason);
      this.emit('disconnect', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.emit('error', error);
    });

    // Notification events
    this.socket.on('notification:new', (data: NotificationEvent) => {
      this.emit('notification:new', data);
    });

    this.socket.on('notification:read', (notificationId: string) => {
      this.emit('notification:read', notificationId);
    });

    this.socket.on('notification:count', (count: number) => {
      this.emit('notification:count', count);
    });

    // Approval events
    this.socket.on('approval:status_changed', (data: ApprovalStatusEvent) => {
      this.emit('approval:status_changed', data);
    });

    this.socket.on('approval:new_request', (data: ApprovalRequestEvent) => {
      this.emit('approval:new_request', data);
    });

    // Attendance events
    this.socket.on('attendance:checked_in', (data: AttendanceEvent) => {
      this.emit('attendance:checked_in', data);
    });

    this.socket.on('attendance:checked_out', (data: AttendanceEvent) => {
      this.emit('attendance:checked_out', data);
    });
  }

  on<K extends keyof WebSocketEvents>(
    event: K,
    callback: WebSocketEvents[K]
  ): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(callback as EventCallback<unknown>);

    return () => {
      this.eventHandlers.get(event)?.delete(callback as EventCallback<unknown>);
    };
  }

  off<K extends keyof WebSocketEvents>(
    event: K,
    callback?: WebSocketEvents[K]
  ): void {
    if (callback) {
      this.eventHandlers.get(event)?.delete(callback as EventCallback<unknown>);
    } else {
      this.eventHandlers.delete(event);
    }
  }

  private emit<K extends keyof WebSocketEvents>(
    event: K,
    ...args: Parameters<WebSocketEvents[K]>
  ): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          (handler as (...args: unknown[]) => void)(...args);
        } catch (error) {
          console.error(`Error in WebSocket event handler for ${event}:`, error);
        }
      });
    }
  }

  send(event: string, data?: unknown): void {
    if (!this.socket?.connected) {
      console.warn('WebSocket is not connected');
      return;
    }
    this.socket.emit(event, data);
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

// Singleton instance
export const wsClient = new WebSocketClient();

// React hook for WebSocket connection management
export function useWebSocket() {
  return {
    connect: () => wsClient.connect(),
    disconnect: () => wsClient.disconnect(),
    isConnected: wsClient.isConnected(),
    on: wsClient.on.bind(wsClient),
    off: wsClient.off.bind(wsClient),
    send: wsClient.send.bind(wsClient),
  };
}

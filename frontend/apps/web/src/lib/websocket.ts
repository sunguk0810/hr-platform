import { useAuthStore } from '@/stores/authStore';

export interface WebSocketConfig {
  url?: string;
  autoConnect?: boolean;
}

export interface WebSocketEvents {
  'notification:new': (notification: NotificationEvent) => void;
  'notification:read': (notificationId: string) => void;
  'notification:count': (count: number) => void;
  'approval:status_changed': (event: ApprovalStatusEvent) => void;
  'approval:new_request': (event: ApprovalRequestEvent) => void;
  'attendance:checked_in': (event: AttendanceEvent) => void;
  'attendance:checked_out': (event: AttendanceEvent) => void;
  connect: () => void;
  disconnect: (reason: string) => void;
  error: (error: Error) => void;
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
  private eventSource: EventSource | null = null;
  private config: WebSocketConfig;
  private eventHandlers: Map<string, Set<EventCallback<unknown>>> = new Map();
  private connected = false;

  constructor(config: WebSocketConfig = {}) {
    this.config = {
      url: import.meta.env.VITE_WS_URL || '/api/v1/notifications/sse/subscribe',
      autoConnect: false,
      ...config,
    };
  }

  connect(): void {
    if (this.eventSource) {
      return;
    }

    const { accessToken } = useAuthStore.getState();
    if (!accessToken) {
      return;
    }

    const baseUrl = this.config.url || '/api/v1/notifications/sse/subscribe';
    const separator = baseUrl.includes('?') ? '&' : '?';
    const url = `${baseUrl}${separator}access_token=${encodeURIComponent(accessToken)}`;

    this.eventSource = new EventSource(url);

    this.eventSource.onopen = () => {
      this.connected = true;
      this.emit('connect');
    };

    this.eventSource.onerror = () => {
      const error = new Error('SSE connection error');
      this.emit('error', error);
      this.disconnect('sse_error');
    };

    this.eventSource.addEventListener('notification', (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data);
        const notification: NotificationEvent = {
          id: payload.id,
          type: payload.type,
          title: payload.title,
          message: payload.content || payload.message || '',
          createdAt: payload.createdAt,
          data: payload,
        };
        this.emit('notification:new', notification);
      } catch {
        // ignore parse errors for malformed payloads
      }
    });
  }

  disconnect(reason = 'manual'): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    if (this.connected) {
      this.connected = false;
      this.emit('disconnect', reason);
    }
  }

  on<K extends keyof WebSocketEvents>(event: K, callback: WebSocketEvents[K]): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(callback as EventCallback<unknown>);

    return () => {
      this.eventHandlers.get(event)?.delete(callback as EventCallback<unknown>);
    };
  }

  off<K extends keyof WebSocketEvents>(event: K, callback?: WebSocketEvents[K]): void {
    if (callback) {
      this.eventHandlers.get(event)?.delete(callback as EventCallback<unknown>);
    } else {
      this.eventHandlers.delete(event);
    }
  }

  private emit<K extends keyof WebSocketEvents>(event: K, ...args: Parameters<WebSocketEvents[K]>): void {
    const handlers = this.eventHandlers.get(event);
    if (!handlers) {
      return;
    }
    handlers.forEach((handler) => {
      try {
        (handler as (...inner: unknown[]) => void)(...args);
      } catch {
        // swallow handler errors
      }
    });
  }

  send(_event: string, _data?: unknown): void {
    // SSE is server-push only. Kept for API compatibility.
  }

  isConnected(): boolean {
    return this.connected;
  }
}

export const wsClient = new WebSocketClient();

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

// src/lib/api/websocket.ts
// WebSocket client for real-time bidirectional communication

const WS_URL: string = import.meta.env.VITE_WS_URL ?? "ws://127.0.0.1:9089/ws";
void WS_URL; // reserved for future WebSocket implementation

export interface WSCallbacks {
  onMessage: (data: unknown) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export interface WSController {
  send: (data: unknown) => void;
  close: () => void;
}

export function connectWebSocket(_callbacks: WSCallbacks): WSController {
  // Stub — will be implemented when backend WebSocket is ready
  console.warn("[ws] WebSocket not yet implemented, using mock mode");

  return {
    send: (_data: unknown) => {
      console.warn("[ws] send() called in stub mode");
    },
    close: () => {
      console.warn("[ws] close() called in stub mode");
    },
  };
}

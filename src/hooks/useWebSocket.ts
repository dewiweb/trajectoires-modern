import { useCallback, useRef, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { WSMessage, OSCSendPayload, ConnectionStatusPayload, Point3D } from '@shared/types';

// Try to connect to the server - in dev mode, always use localhost:3000
function getWebSocketUrl(): string {
  // In development, connect directly to the Node server
  if (import.meta.env.DEV) {
    return 'ws://localhost:3000/ws';
  }
  // In production, use the same host
  return `ws://${window.location.host}/ws`;
}

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  
  const { setConnected, setOSCConfig } = useAppStore();

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const wsUrl = getWebSocketUrl();
    console.log('Connecting to WebSocket:', wsUrl);

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setConnected(true);
        
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setConnected(false);
        
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = window.setTimeout(() => {
          console.log('Attempting to reconnect...');
          connect();
        }, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          handleMessage(message);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };
    } catch (err) {
      console.error('Failed to connect WebSocket:', err);
      setConnected(false);
    }
  }, [setConnected]);

  const handleMessage = useCallback((message: WSMessage) => {
    switch (message.type) {
      case 'connection:status': {
        const payload = message.payload as ConnectionStatusPayload;
        setConnected(payload.connected);
        if (payload.oscConfig) {
          setOSCConfig(payload.oscConfig);
        }
        break;
      }
      case 'osc:receive': {
        // Handle incoming OSC messages if needed
        console.log('OSC received:', message.payload);
        break;
      }
    }
  }, [setConnected, setOSCConfig]);

  const send = useCallback((message: WSMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const sendOSC = useCallback((address: string, args: (number | string | boolean)[]) => {
    send({
      type: 'osc:send',
      payload: { address, args } as OSCSendPayload,
      timestamp: Date.now(),
    });
  }, [send]);

  const streamPoint = useCallback((sourceNumber: number, point: Point3D) => {
    send({
      type: 'trajectory:stream',
      payload: { sourceNumber, point },
      timestamp: Date.now(),
    });
  }, [send]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connect,
    disconnect,
    send,
    sendOSC,
    streamPoint,
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
  };
}

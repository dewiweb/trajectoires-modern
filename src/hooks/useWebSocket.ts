import { useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { WSMessage, OSCSendPayload, ConnectionStatusPayload, Point3D } from '@shared/types';

// Try to connect to the server - in dev mode, always use localhost:3000
function getWebSocketUrl(): string {
  if (import.meta.env.DEV) {
    return 'ws://localhost:3000/ws';
  }
  return `ws://${window.location.host}/ws`;
}

// Singleton WebSocket instance shared across all hook calls
let sharedWs: WebSocket | null = null;
let reconnectTimeout: number | null = null;

function setupWebSocket(setConnected: (c: boolean) => void, setOSCConfig: (c: Partial<import('@shared/types').OSCConfig>) => void): void {
  if (sharedWs?.readyState === WebSocket.OPEN || sharedWs?.readyState === WebSocket.CONNECTING) {
    return;
  }

  const wsUrl = getWebSocketUrl();
  console.log('Connecting to WebSocket:', wsUrl);

  try {
    const ws = new WebSocket(wsUrl);
    sharedWs = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setConnected(true);
      
      // Sync OSC mapping to server on connect
      const currentMapping = useAppStore.getState().oscMapping;
      ws.send(JSON.stringify({
        type: 'osc:mapping',
        payload: currentMapping,
        timestamp: Date.now(),
      }));
      
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      sharedWs = null;
      setConnected(false);
      
      // Attempt to reconnect after 3 seconds
      reconnectTimeout = window.setTimeout(() => {
        console.log('Attempting to reconnect...');
        setupWebSocket(setConnected, setOSCConfig);
      }, 3000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data);
        handleMessage(message, setConnected, setOSCConfig);
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };
  } catch (err) {
    console.error('Failed to connect WebSocket:', err);
    setConnected(false);
  }
}

function handleMessage(
  message: WSMessage,
  setConnected: (c: boolean) => void,
  setOSCConfig: (c: Partial<import('@shared/types').OSCConfig>) => void
): void {
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
      console.log('OSC received:', message.payload);
      break;
    }
  }
}

export function useWebSocket() {
  const { setConnected, setOSCConfig } = useAppStore();

  const connect = useCallback(() => {
    setupWebSocket(setConnected, setOSCConfig);
  }, [setConnected, setOSCConfig]);

  const send = useCallback((message: WSMessage) => {
    if (sharedWs?.readyState === WebSocket.OPEN) {
      sharedWs.send(JSON.stringify(message));
    } else {
      console.warn('WS not connected, cannot send:', message.type);
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
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
    
    if (sharedWs) {
      sharedWs.close();
      sharedWs = null;
    }
  }, []);

  return {
    connect,
    disconnect,
    send,
    sendOSC,
    streamPoint,
    isConnected: sharedWs?.readyState === WebSocket.OPEN,
  };
}

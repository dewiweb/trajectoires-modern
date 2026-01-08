import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { OSCBridge } from './osc-bridge.js';
import type { WSMessage, OSCSendPayload, OSCConfig } from '../shared/types.js';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// Default OSC configuration (Holophonix defaults)
let oscConfig: OSCConfig = {
  outputIP: '127.0.0.1',
  outputPort: 4003,
  inputPort: 9000,
  protocol: 'udp',
};

// Create OSC bridge
let oscBridge = new OSCBridge(oscConfig);

// Store connected clients
const clients = new Set<WebSocket>();

// Broadcast to all connected clients
function broadcast(message: WSMessage): void {
  const data = JSON.stringify(message);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

// Handle incoming OSC messages
oscBridge.on('message', (address: string, args: (number | string | boolean)[]) => {
  broadcast({
    type: 'osc:receive',
    payload: { address, args },
    timestamp: Date.now(),
  });
});

// WebSocket connection handling
wss.on('connection', (ws: WebSocket) => {
  console.log('Client connected');
  clients.add(ws);

  // Send current connection status
  ws.send(JSON.stringify({
    type: 'connection:status',
    payload: { connected: true, oscConfig },
    timestamp: Date.now(),
  }));

  ws.on('message', (data: Buffer) => {
    try {
      const message: WSMessage = JSON.parse(data.toString());
      handleMessage(ws, message);
    } catch (err) {
      console.error('Invalid message:', err);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws);
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
    clients.delete(ws);
  });
});

function handleMessage(ws: WebSocket, message: WSMessage): void {
  switch (message.type) {
    case 'osc:send': {
      const payload = message.payload as OSCSendPayload;
      oscBridge.send(payload.address, payload.args);
      break;
    }

    case 'osc:config': {
      const newConfig = message.payload as OSCConfig;
      oscConfig = { ...oscConfig, ...newConfig };
      
      // Recreate OSC bridge with new config
      oscBridge.close();
      oscBridge = new OSCBridge(oscConfig);
      oscBridge.on('message', (address: string, args: (number | string | boolean)[]) => {
        broadcast({
          type: 'osc:receive',
          payload: { address, args },
          timestamp: Date.now(),
        });
      });

      // Broadcast new config to all clients
      broadcast({
        type: 'connection:status',
        payload: { connected: true, oscConfig },
        timestamp: Date.now(),
      });
      break;
    }

    case 'trajectory:stream': {
      const { sourceNumber, point } = message.payload as { sourceNumber: number; point: { x: number; y: number; z: number } };
      // Send as Spat format: /spat/source/N/xyz x y z
      oscBridge.send(`/spat/source/${sourceNumber}/xyz`, [point.x, point.y, point.z]);
      break;
    }

    default:
      console.log('Unknown message type:', message.type);
  }
}

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('dist/client'));
}

// Health check endpoint
app.get('/health', (_, res) => {
  res.json({ status: 'ok', oscConfig });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║           TRAJECTOIRES SERVER v2.0.0                   ║
╠════════════════════════════════════════════════════════╣
║  HTTP Server:  http://localhost:${PORT}                   ║
║  WebSocket:    ws://localhost:${PORT}/ws                  ║
║  OSC Output:   ${oscConfig.outputIP}:${oscConfig.outputPort}                    ║
║  OSC Input:    port ${oscConfig.inputPort}                           ║
╚════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down...');
  oscBridge.close();
  server.close();
  process.exit(0);
});

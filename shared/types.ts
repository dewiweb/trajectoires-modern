// Core types shared between client and server

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface TimedPoint extends Point3D {
  t: number; // timestamp in ms
  orientation?: Orientation;
}

export interface Orientation {
  yaw: number;
  pitch: number;
  roll: number;
}

export interface Trajectory {
  id: string;
  sourceNumber: number; // 1-8
  points: TimedPoint[];
  color: string;
  createdAt: number;
  updatedAt: number;
}

export interface Session {
  id: string;
  name: string;
  trajectories: Trajectory[];
  createdAt: number;
  updatedAt: number;
}

// OSC Configuration
export interface OSCConfig {
  outputIP: string;
  outputPort: number;
  inputPort: number;
  protocol: 'udp' | 'tcp';
}

// OSC Mapping Configuration for coordinate transformation
export interface BoundingBox {
  enabled: boolean;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

export interface OSCMapping {
  trackOffset: number;      // Added to source number (e.g., 7 to start at track 8)
  xOffset: number;          // Added to X coordinate
  yOffset: number;          // Added to Y coordinate
  zOffset: number;          // Added to Z coordinate
  boundingBox: BoundingBox; // Constrain coordinates to this area
}

// WebSocket message types
export type WSMessageType = 
  | 'osc:send'
  | 'osc:receive'
  | 'osc:config'
  | 'osc:mapping'
  | 'connection:status'
  | 'trajectory:stream'
  | 'trajectory:play'
  | 'trajectory:stop';

export interface WSMessage<T = unknown> {
  type: WSMessageType;
  payload: T;
  timestamp: number;
}

export interface OSCSendPayload {
  address: string;
  args: (number | string | boolean)[];
}

export interface OSCReceivePayload {
  address: string;
  args: (number | string | boolean)[];
}

export interface ConnectionStatusPayload {
  connected: boolean;
  oscConfig?: OSCConfig;
}

export interface TrajectoryStreamPayload {
  sourceNumber: number;
  point: Point3D;
}

// Source colors matching original app
export const SOURCE_COLORS: Record<number, string> = {
  1: '#e94560', // Red-pink
  2: '#f39c12', // Orange
  3: '#2ecc71', // Green
  4: '#3498db', // Blue
  5: '#9b59b6', // Purple
  6: '#1abc9c', // Teal
  7: '#e67e22', // Dark orange
  8: '#95a5a6', // Gray
};

export function getSourceColor(sourceNumber: number): string {
  return SOURCE_COLORS[sourceNumber] || SOURCE_COLORS[1];
}

// Generate unique IDs
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

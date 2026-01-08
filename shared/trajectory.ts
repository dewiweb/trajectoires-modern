import { 
  Trajectory, 
  TimedPoint, 
  Point3D, 
  Orientation,
  generateId, 
  getSourceColor 
} from './types';

export function createTrajectory(sourceNumber: number = 1): Trajectory {
  return {
    id: generateId(),
    sourceNumber,
    points: [],
    color: getSourceColor(sourceNumber),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function addPoint(
  trajectory: Trajectory,
  x: number,
  y: number,
  z: number,
  t: number,
  orientation?: Orientation
): Trajectory {
  const newPoint: TimedPoint = { x, y, z, t, orientation };
  return {
    ...trajectory,
    points: [...trajectory.points, newPoint],
    updatedAt: Date.now(),
  };
}

export function getDuration(trajectory: Trajectory): number {
  if (trajectory.points.length === 0) return 0;
  return trajectory.points[trajectory.points.length - 1].t;
}

export function getPointAtTime(trajectory: Trajectory, time: number): Point3D | null {
  const { points } = trajectory;
  if (points.length === 0) return null;
  if (points.length === 1) return points[0];
  
  // Find the two points to interpolate between
  let i = 0;
  while (i < points.length - 1 && points[i + 1].t <= time) {
    i++;
  }
  
  if (i >= points.length - 1) {
    return points[points.length - 1];
  }
  
  const p1 = points[i];
  const p2 = points[i + 1];
  
  // Linear interpolation
  const dt = p2.t - p1.t;
  if (dt === 0) return p1;
  
  const ratio = (time - p1.t) / dt;
  
  return {
    x: p1.x + (p2.x - p1.x) * ratio,
    y: p1.y + (p2.y - p1.y) * ratio,
    z: p1.z + (p2.z - p1.z) * ratio,
  };
}

export function scaleTime(trajectory: Trajectory, factor: number): Trajectory {
  return {
    ...trajectory,
    points: trajectory.points.map(p => ({ ...p, t: Math.floor(p.t * factor) })),
    updatedAt: Date.now(),
  };
}

export function scaleSpace(trajectory: Trajectory, factor: number): Trajectory {
  return {
    ...trajectory,
    points: trajectory.points.map(p => ({
      ...p,
      x: p.x * factor,
      y: p.y * factor,
      z: p.z * factor,
    })),
    updatedAt: Date.now(),
  };
}

export function translate(
  trajectory: Trajectory,
  dx: number,
  dy: number,
  dz: number
): Trajectory {
  return {
    ...trajectory,
    points: trajectory.points.map(p => ({
      ...p,
      x: p.x + dx,
      y: p.y + dy,
      z: p.z + dz,
    })),
    updatedAt: Date.now(),
  };
}

export function rotate(
  trajectory: Trajectory,
  centerX: number,
  centerY: number,
  angle: number // in radians
): Trajectory {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  
  return {
    ...trajectory,
    points: trajectory.points.map(p => {
      const dx = p.x - centerX;
      const dy = p.y - centerY;
      return {
        ...p,
        x: centerX + dx * cos - dy * sin,
        y: centerY + dx * sin + dy * cos,
      };
    }),
    updatedAt: Date.now(),
  };
}

export function mirrorX(trajectory: Trajectory): Trajectory {
  return {
    ...trajectory,
    points: trajectory.points.map(p => ({ ...p, y: -p.y })),
    updatedAt: Date.now(),
  };
}

export function mirrorY(trajectory: Trajectory): Trajectory {
  return {
    ...trajectory,
    points: trajectory.points.map(p => ({ ...p, x: -p.x })),
    updatedAt: Date.now(),
  };
}

export function reverseTime(trajectory: Trajectory): Trajectory {
  const duration = getDuration(trajectory);
  const reversed = [...trajectory.points].reverse().map((p, i, arr) => ({
    ...p,
    t: i === 0 ? 0 : duration - arr[arr.length - 1 - i].t,
  }));
  
  return {
    ...trajectory,
    points: reversed,
    updatedAt: Date.now(),
  };
}

export function simplify(trajectory: Trajectory, tolerance: number): Trajectory {
  // Douglas-Peucker simplification algorithm
  const points = trajectory.points;
  if (points.length <= 2) return trajectory;
  
  const simplified = douglasPeucker(points, tolerance);
  
  return {
    ...trajectory,
    points: simplified,
    updatedAt: Date.now(),
  };
}

function douglasPeucker(points: TimedPoint[], tolerance: number): TimedPoint[] {
  if (points.length <= 2) return points;
  
  let maxDist = 0;
  let maxIndex = 0;
  
  const first = points[0];
  const last = points[points.length - 1];
  
  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(points[i], first, last);
    if (dist > maxDist) {
      maxDist = dist;
      maxIndex = i;
    }
  }
  
  if (maxDist > tolerance) {
    const left = douglasPeucker(points.slice(0, maxIndex + 1), tolerance);
    const right = douglasPeucker(points.slice(maxIndex), tolerance);
    return [...left.slice(0, -1), ...right];
  }
  
  return [first, last];
}

function perpendicularDistance(
  point: Point3D,
  lineStart: Point3D,
  lineEnd: Point3D
): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const dz = lineEnd.z - lineStart.z;
  
  const lineLengthSq = dx * dx + dy * dy + dz * dz;
  
  if (lineLengthSq === 0) {
    return Math.sqrt(
      Math.pow(point.x - lineStart.x, 2) +
      Math.pow(point.y - lineStart.y, 2) +
      Math.pow(point.z - lineStart.z, 2)
    );
  }
  
  const t = Math.max(0, Math.min(1, (
    (point.x - lineStart.x) * dx +
    (point.y - lineStart.y) * dy +
    (point.z - lineStart.z) * dz
  ) / lineLengthSq));
  
  const projX = lineStart.x + t * dx;
  const projY = lineStart.y + t * dy;
  const projZ = lineStart.z + t * dz;
  
  return Math.sqrt(
    Math.pow(point.x - projX, 2) +
    Math.pow(point.y - projY, 2) +
    Math.pow(point.z - projZ, 2)
  );
}

export function clone(trajectory: Trajectory): Trajectory {
  return {
    ...trajectory,
    id: generateId(),
    points: trajectory.points.map(p => ({ ...p })),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function changeSource(trajectory: Trajectory, sourceNumber: number): Trajectory {
  return {
    ...trajectory,
    sourceNumber,
    color: getSourceColor(sourceNumber),
    updatedAt: Date.now(),
  };
}

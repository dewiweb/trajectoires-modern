import { useCallback, useRef, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useWebSocket } from './useWebSocket';
import { getPointAtTime, getDuration } from '@shared/trajectory';
import type { Trajectory } from '@shared/types';

// Create worker inline to avoid bundler issues
const createTimerWorker = (): Worker => {
  const workerCode = `
    let intervalId = null;
    self.onmessage = (e) => {
      const { command, interval } = e.data;
      if (command === 'start') {
        if (intervalId) clearInterval(intervalId);
        intervalId = setInterval(() => {
          self.postMessage({ type: 'tick', time: performance.now() });
        }, interval || 16);
      } else if (command === 'stop') {
        if (intervalId) { clearInterval(intervalId); intervalId = null; }
      }
    };
  `;
  const blob = new Blob([workerCode], { type: 'application/javascript' });
  return new Worker(URL.createObjectURL(blob));
};

export function useTrajectoryPlayer() {
  const workerRef = useRef<Worker | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);

  const {
    trajectories,
    currentTrajectoryIndex,
    isPlaying,
    isLooping,
    multiPlayMode,
    playbackTime,
    setPlaying,
    setPlaybackTime,
  } = useAppStore();

  const { streamPoint } = useWebSocket();

  const getCurrentTrajectory = useCallback((): Trajectory | null => {
    if (currentTrajectoryIndex < 0 || currentTrajectoryIndex >= trajectories.length) {
      return null;
    }
    return trajectories[currentTrajectoryIndex];
  }, [trajectories, currentTrajectoryIndex]);

  const getTrajectoriesToPlay = useCallback((): Trajectory[] => {
    if (multiPlayMode) {
      // In multi-play mode, play one trajectory per source
      const sourceMap = new Map<number, Trajectory>();
      trajectories.forEach((t) => {
        if (!sourceMap.has(t.sourceNumber)) {
          sourceMap.set(t.sourceNumber, t);
        }
      });
      return Array.from(sourceMap.values());
    } else {
      const current = getCurrentTrajectory();
      return current ? [current] : [];
    }
  }, [multiPlayMode, trajectories, getCurrentTrajectory]);

  const getMaxDuration = useCallback((): number => {
    const toPlay = getTrajectoriesToPlay();
    return Math.max(0, ...toPlay.map(getDuration));
  }, [getTrajectoriesToPlay]);

  const tick = useCallback(() => {
    const now = performance.now();
    // Get current speed from store (allows live updates)
    const currentSpeed = useAppStore.getState().playbackSpeed;
    const realElapsed = now - startTimeRef.current;
    const scaledElapsed = realElapsed * currentSpeed;
    const maxDuration = getMaxDuration();

    if (scaledElapsed >= maxDuration) {
      if (isLooping) {
        startTimeRef.current = now;
        setPlaybackTime(0);
      } else {
        setPlaying(false);
        setPlaybackTime(maxDuration);
        return;
      }
    } else {
      setPlaybackTime(scaledElapsed);
    }

    // Stream points for all playing trajectories
    const toPlay = getTrajectoriesToPlay();
    toPlay.forEach((trajectory) => {
      const point = getPointAtTime(trajectory, scaledElapsed);
      if (point) {
        streamPoint(trajectory.sourceNumber, point);
      }
    });

  }, [isLooping, getMaxDuration, getTrajectoriesToPlay, setPlaying, setPlaybackTime, streamPoint]);

  const play = useCallback(() => {
    if (trajectories.length === 0) return;

    const maxDuration = getMaxDuration();
    const currentSpeed = useAppStore.getState().playbackSpeed;
    if (playbackTime >= maxDuration) {
      // Reset to start if at end
      startTimeRef.current = performance.now();
      setPlaybackTime(0);
    } else {
      // Resume from current position (account for speed)
      startTimeRef.current = performance.now() - (playbackTime / currentSpeed);
    }

    setPlaying(true);
  }, [trajectories.length, playbackTime, getMaxDuration, setPlaying, setPlaybackTime]);

  const pause = useCallback(() => {
    setPlaying(false);
    pauseTimeRef.current = playbackTime;
  }, [playbackTime, setPlaying]);

  const stop = useCallback(() => {
    setPlaying(false);
    setPlaybackTime(0);
    startTimeRef.current = 0;
    pauseTimeRef.current = 0;
  }, [setPlaying, setPlaybackTime]);

  const seek = useCallback((time: number) => {
    const maxDuration = getMaxDuration();
    const clampedTime = Math.max(0, Math.min(time, maxDuration));
    const currentSpeed = useAppStore.getState().playbackSpeed;
    
    setPlaybackTime(clampedTime);
    
    if (isPlaying) {
      startTimeRef.current = performance.now() - (clampedTime / currentSpeed);
    } else {
      pauseTimeRef.current = clampedTime;
      startTimeRef.current = performance.now() - (clampedTime / currentSpeed);
    }

    // Stream current position
    const toPlay = getTrajectoriesToPlay();
    toPlay.forEach((trajectory) => {
      const point = getPointAtTime(trajectory, clampedTime);
      if (point) {
        streamPoint(trajectory.sourceNumber, point);
      }
    });
  }, [isPlaying, getMaxDuration, getTrajectoriesToPlay, setPlaybackTime, streamPoint]);

  const toggle = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  // Web Worker timer - not throttled by Chrome in background
  useEffect(() => {
    if (isPlaying) {
      if (!workerRef.current) {
        workerRef.current = createTimerWorker();
      }
      workerRef.current.onmessage = () => tick();
      workerRef.current.postMessage({ command: 'start', interval: 16 });
    } else {
      workerRef.current?.postMessage({ command: 'stop' });
    }

    return () => {
      workerRef.current?.postMessage({ command: 'stop' });
    };
  }, [isPlaying, tick]);

  // Cleanup worker on unmount
  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  return {
    play,
    pause,
    stop,
    seek,
    toggle,
    isPlaying,
    playbackTime,
    duration: getMaxDuration(),
  };
}

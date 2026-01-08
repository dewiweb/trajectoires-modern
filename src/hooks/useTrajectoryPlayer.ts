import { useCallback, useRef, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useWebSocket } from './useWebSocket';
import { getPointAtTime, getDuration } from '@shared/trajectory';
import type { Trajectory } from '@shared/types';

export function useTrajectoryPlayer() {
  const animationRef = useRef<number | null>(null);
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

  const tick = useCallback((timestamp: number) => {
    const elapsed = timestamp - startTimeRef.current;
    const maxDuration = getMaxDuration();

    if (elapsed >= maxDuration) {
      if (isLooping) {
        startTimeRef.current = timestamp;
        setPlaybackTime(0);
      } else {
        setPlaying(false);
        setPlaybackTime(maxDuration);
        return;
      }
    } else {
      setPlaybackTime(elapsed);
    }

    // Stream points for all playing trajectories
    const toPlay = getTrajectoriesToPlay();
    toPlay.forEach((trajectory) => {
      const point = getPointAtTime(trajectory, elapsed);
      if (point) {
        streamPoint(trajectory.sourceNumber, point);
      }
    });

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(tick);
    }
  }, [isPlaying, isLooping, getMaxDuration, getTrajectoriesToPlay, setPlaying, setPlaybackTime, streamPoint]);

  const play = useCallback(() => {
    if (trajectories.length === 0) return;

    const maxDuration = getMaxDuration();
    if (playbackTime >= maxDuration) {
      // Reset to start if at end
      startTimeRef.current = performance.now();
      setPlaybackTime(0);
    } else {
      // Resume from current position
      startTimeRef.current = performance.now() - playbackTime;
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
    
    setPlaybackTime(clampedTime);
    
    if (isPlaying) {
      startTimeRef.current = performance.now() - clampedTime;
    } else {
      pauseTimeRef.current = clampedTime;
      startTimeRef.current = performance.now() - clampedTime;
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

  // Animation loop effect
  useEffect(() => {
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(tick);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isPlaying, tick]);

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

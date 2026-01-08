import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Trajectory, Session, OSCConfig } from '@shared/types';
import { createTrajectory, addPoint, clone, changeSource } from '@shared/trajectory';
import { generateId, getSourceColor } from '@shared/types';

interface AppState {
  // Trajectories
  trajectories: Trajectory[];
  currentTrajectoryIndex: number;
  currentSourceNumber: number;
  drawingTrajectory: Trajectory | null;

  // Sessions
  sessions: Session[];
  currentSessionIndex: number;

  // Playback
  isPlaying: boolean;
  isLooping: boolean;
  playbackTime: number;
  multiPlayMode: boolean;

  // UI State
  settingsPanelOpen: boolean;
  zSliderVisible: boolean;
  currentZ: number;
  canvasZoom: number;
  speakerDistance: number;

  // Connection
  connected: boolean;
  oscConfig: OSCConfig;

  // Actions - Trajectories
  addTrajectory: (trajectory: Trajectory) => void;
  removeTrajectory: (index: number) => void;
  updateTrajectory: (index: number, trajectory: Trajectory) => void;
  selectTrajectory: (index: number) => void;
  selectNextTrajectory: () => void;
  selectPreviousTrajectory: () => void;
  clearAllTrajectories: () => void;
  duplicateTrajectory: (index: number) => void;

  // Actions - Drawing
  startDrawing: (x: number, y: number, z: number) => void;
  addDrawingPoint: (x: number, y: number, z: number, t: number) => void;
  finishDrawing: () => void;
  cancelDrawing: () => void;

  // Actions - Source
  setCurrentSource: (sourceNumber: number) => void;
  changeTrajectorySource: (index: number, sourceNumber: number) => void;

  // Actions - Sessions
  createSession: (name: string) => void;
  deleteSession: (index: number) => void;
  selectSession: (index: number) => void;
  selectNextSession: () => void;
  selectPreviousSession: () => void;
  saveCurrentSession: () => void;
  loadSession: (index: number) => void;

  // Actions - Playback
  setPlaying: (playing: boolean) => void;
  setLooping: (looping: boolean) => void;
  setPlaybackTime: (time: number) => void;
  setMultiPlayMode: (multiPlay: boolean) => void;

  // Actions - UI
  toggleSettingsPanel: () => void;
  setZSliderVisible: (visible: boolean) => void;
  setCurrentZ: (z: number) => void;
  setCanvasZoom: (zoom: number) => void;
  setSpeakerDistance: (distance: number) => void;

  // Actions - Connection
  setConnected: (connected: boolean) => void;
  setOSCConfig: (config: Partial<OSCConfig>) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      trajectories: [],
      currentTrajectoryIndex: -1,
      currentSourceNumber: 1,
      drawingTrajectory: null,

      sessions: [],
      currentSessionIndex: 0,

      isPlaying: false,
      isLooping: false,
      playbackTime: 0,
      multiPlayMode: false,

      settingsPanelOpen: false,
      zSliderVisible: false,
      currentZ: 0,
      canvasZoom: 1,
      speakerDistance: 1,

      connected: false,
      oscConfig: {
        outputIP: '127.0.0.1',
        outputPort: 4003,
        inputPort: 9000,
        protocol: 'udp',
      },

      // Trajectory actions
      addTrajectory: (trajectory) => set((state) => ({
        trajectories: [...state.trajectories, trajectory],
        currentTrajectoryIndex: state.trajectories.length,
      })),

      removeTrajectory: (index) => set((state) => {
        const newTrajectories = state.trajectories.filter((_, i) => i !== index);
        let newIndex = state.currentTrajectoryIndex;
        if (newIndex >= newTrajectories.length) {
          newIndex = Math.max(0, newTrajectories.length - 1);
        }
        if (newTrajectories.length === 0) {
          newIndex = -1;
        }
        return {
          trajectories: newTrajectories,
          currentTrajectoryIndex: newIndex,
        };
      }),

      updateTrajectory: (index, trajectory) => set((state) => ({
        trajectories: state.trajectories.map((t, i) => i === index ? trajectory : t),
      })),

      selectTrajectory: (index) => set({ currentTrajectoryIndex: index }),

      selectNextTrajectory: () => set((state) => ({
        currentTrajectoryIndex: state.trajectories.length > 0
          ? (state.currentTrajectoryIndex + 1) % state.trajectories.length
          : -1,
      })),

      selectPreviousTrajectory: () => set((state) => ({
        currentTrajectoryIndex: state.trajectories.length > 0
          ? (state.currentTrajectoryIndex - 1 + state.trajectories.length) % state.trajectories.length
          : -1,
      })),

      clearAllTrajectories: () => set({
        trajectories: [],
        currentTrajectoryIndex: -1,
      }),

      duplicateTrajectory: (index) => set((state) => {
        const trajectory = state.trajectories[index];
        if (!trajectory) return state;
        const duplicated = clone(trajectory);
        return {
          trajectories: [...state.trajectories, duplicated],
          currentTrajectoryIndex: state.trajectories.length,
        };
      }),

      // Drawing actions
      startDrawing: (x, y, z) => set((state) => {
        const trajectory = createTrajectory(state.currentSourceNumber);
        const withPoint = addPoint(trajectory, x, y, z, 0);
        return { drawingTrajectory: withPoint };
      }),

      addDrawingPoint: (x, y, z, t) => set((state) => {
        if (!state.drawingTrajectory) return state;
        return {
          drawingTrajectory: addPoint(state.drawingTrajectory, x, y, z, t),
        };
      }),

      finishDrawing: () => set((state) => {
        if (!state.drawingTrajectory || state.drawingTrajectory.points.length < 3) {
          return { drawingTrajectory: null };
        }
        return {
          trajectories: [...state.trajectories, state.drawingTrajectory],
          currentTrajectoryIndex: state.trajectories.length,
          drawingTrajectory: null,
        };
      }),

      cancelDrawing: () => set({ drawingTrajectory: null }),

      // Source actions
      setCurrentSource: (sourceNumber) => set({ currentSourceNumber: sourceNumber }),

      changeTrajectorySource: (index, sourceNumber) => set((state) => ({
        trajectories: state.trajectories.map((t, i) =>
          i === index ? changeSource(t, sourceNumber) : t
        ),
      })),

      // Session actions
      createSession: (name) => set((state) => {
        const session: Session = {
          id: generateId(),
          name,
          trajectories: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        return {
          sessions: [...state.sessions, session],
          currentSessionIndex: state.sessions.length,
        };
      }),

      deleteSession: (index) => set((state) => ({
        sessions: state.sessions.filter((_, i) => i !== index),
        currentSessionIndex: Math.max(0, state.currentSessionIndex - (index <= state.currentSessionIndex ? 1 : 0)),
      })),

      selectSession: (index) => set({ currentSessionIndex: index }),

      selectNextSession: () => set((state) => ({
        currentSessionIndex: state.sessions.length > 0
          ? (state.currentSessionIndex + 1) % state.sessions.length
          : 0,
      })),

      selectPreviousSession: () => set((state) => ({
        currentSessionIndex: state.sessions.length > 0
          ? (state.currentSessionIndex - 1 + state.sessions.length) % state.sessions.length
          : 0,
      })),

      saveCurrentSession: () => set((state) => {
        const session = state.sessions[state.currentSessionIndex];
        if (!session) return state;
        
        const updatedSession: Session = {
          ...session,
          trajectories: [...state.trajectories],
          updatedAt: Date.now(),
        };
        
        return {
          sessions: state.sessions.map((s, i) =>
            i === state.currentSessionIndex ? updatedSession : s
          ),
        };
      }),

      loadSession: (index) => set((state) => {
        const session = state.sessions[index];
        if (!session) return state;
        
        return {
          trajectories: [...session.trajectories],
          currentTrajectoryIndex: session.trajectories.length > 0 ? 0 : -1,
          currentSessionIndex: index,
        };
      }),

      // Playback actions
      setPlaying: (playing) => set({ isPlaying: playing }),
      setLooping: (looping) => set({ isLooping: looping }),
      setPlaybackTime: (time) => set({ playbackTime: time }),
      setMultiPlayMode: (multiPlay) => set({ multiPlayMode: multiPlay }),

      // UI actions
      toggleSettingsPanel: () => set((state) => ({ settingsPanelOpen: !state.settingsPanelOpen })),
      setZSliderVisible: (visible) => set({ zSliderVisible: visible }),
      setCurrentZ: (z) => set({ currentZ: z }),
      setCanvasZoom: (zoom) => set({ canvasZoom: Math.max(0.1, Math.min(5, zoom)) }),
      setSpeakerDistance: (distance) => set({ speakerDistance: distance }),

      // Connection actions
      setConnected: (connected) => set({ connected }),
      setOSCConfig: (config) => set((state) => ({
        oscConfig: { ...state.oscConfig, ...config },
      })),
    }),
    {
      name: 'trajectoires-storage',
      partialize: (state) => ({
        sessions: state.sessions,
        oscConfig: state.oscConfig,
        speakerDistance: state.speakerDistance,
        isLooping: state.isLooping,
        multiPlayMode: state.multiPlayMode,
      }),
    }
  )
);

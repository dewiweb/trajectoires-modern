import { useEffect } from 'react';
import { TrajectoryCanvas } from './components/TrajectoryCanvas';
import { Toolbar } from './components/Toolbar';
import { SourceSelector } from './components/SourceSelector';
import { PlaybackControls } from './components/PlaybackControls';
import { SettingsPanel } from './components/SettingsPanel';
import { StatusBar } from './components/StatusBar';
import { useAppStore } from './store/useAppStore';
import { useWebSocket } from './hooks/useWebSocket';

function App() {
  const { settingsPanelOpen } = useAppStore();
  const { connect } = useWebSocket();

  useEffect(() => {
    connect();
  }, [connect]);

  return (
    <div className="h-full flex flex-col bg-traj-bg overflow-hidden no-select">
      {/* Top toolbar */}
      <Toolbar />

      {/* Main content area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Canvas */}
        <TrajectoryCanvas />

        {/* Source selector (left side) */}
        <SourceSelector />

        {/* Playback controls (bottom left) */}
        <PlaybackControls />

        {/* Settings panel (right side, conditional) */}
        {settingsPanelOpen && <SettingsPanel />}
      </div>

      {/* Status bar */}
      <StatusBar />
    </div>
  );
}

export default App;

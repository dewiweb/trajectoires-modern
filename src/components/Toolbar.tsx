import { 
  ChevronLeft, 
  ChevronRight, 
  Trash2, 
  RefreshCw, 
  Settings,
  Copy
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export function Toolbar() {
  const {
    trajectories,
    currentTrajectoryIndex,
    selectPreviousTrajectory,
    selectNextTrajectory,
    removeTrajectory,
    clearAllTrajectories,
    duplicateTrajectory,
    toggleSettingsPanel,
    settingsPanelOpen,
  } = useAppStore();

  const hasTrajectories = trajectories.length > 0;
  const currentTrajectory = currentTrajectoryIndex >= 0 ? trajectories[currentTrajectoryIndex] : null;

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-traj-surface border-b border-white/10">
      {/* Left side - Trajectory navigation */}
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-traj-primary rounded-lg overflow-hidden">
          <button
            onClick={selectPreviousTrajectory}
            disabled={!hasTrajectories}
            className="p-2 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Previous trajectory"
          >
            <ChevronLeft size={20} />
          </button>
          
          <span className="px-3 py-1 min-w-[60px] text-center font-medium">
            {hasTrajectories ? `${currentTrajectoryIndex + 1}/${trajectories.length}` : '0/0'}
          </span>
          
          <button
            onClick={selectNextTrajectory}
            disabled={!hasTrajectories}
            className="p-2 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Next trajectory"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={() => currentTrajectoryIndex >= 0 && duplicateTrajectory(currentTrajectoryIndex)}
            disabled={!currentTrajectory}
            className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Duplicate trajectory"
          >
            <Copy size={18} />
          </button>
          
          <button
            onClick={() => currentTrajectoryIndex >= 0 && removeTrajectory(currentTrajectoryIndex)}
            disabled={!currentTrajectory}
            className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-red-400 hover:text-red-300"
            title="Delete trajectory"
          >
            <Trash2 size={18} />
          </button>
          
          <button
            onClick={clearAllTrajectories}
            disabled={!hasTrajectories}
            className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Clear all trajectories"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Center - Title */}
      <h1 className="text-lg font-bold tracking-wide text-traj-accent">
        TRAJECTOIRES
      </h1>

      {/* Right side - Settings */}
      <div className="flex items-center gap-2">
        {currentTrajectory && (
          <span 
            className="px-3 py-1 rounded-full text-sm font-medium"
            style={{ backgroundColor: currentTrajectory.color + '40', color: currentTrajectory.color }}
          >
            Source {currentTrajectory.sourceNumber}
          </span>
        )}
        
        <button
          onClick={toggleSettingsPanel}
          className={`p-2 rounded-lg transition-colors ${
            settingsPanelOpen ? 'bg-traj-accent text-white' : 'hover:bg-white/10'
          }`}
          title="Settings"
        >
          <Settings size={20} />
        </button>
      </div>
    </header>
  );
}

import { useAppStore } from '../store/useAppStore';
import { SOURCE_COLORS } from '@shared/types';

export function SourceSelector() {
  const { 
    currentSourceNumber, 
    setCurrentSource,
    trajectories,
    currentTrajectoryIndex,
    changeTrajectorySource,
  } = useAppStore();

  const handleSourceClick = (sourceNumber: number) => {
    setCurrentSource(sourceNumber);
    
    // Also change the current trajectory's source if one is selected
    if (currentTrajectoryIndex >= 0) {
      changeTrajectorySource(currentTrajectoryIndex, sourceNumber);
    }
  };

  return (
    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col gap-2">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((sourceNum) => {
        const isActive = sourceNum === currentSourceNumber;
        const color = SOURCE_COLORS[sourceNum];
        const hasTrajectory = trajectories.some(t => t.sourceNumber === sourceNum);
        
        return (
          <button
            key={sourceNum}
            onClick={() => handleSourceClick(sourceNum)}
            className={`
              source-btn
              ${isActive ? 'active ring-2 ring-white ring-offset-2 ring-offset-traj-bg' : ''}
              ${hasTrajectory ? 'shadow-lg' : 'opacity-70'}
            `}
            style={{ 
              backgroundColor: color,
              boxShadow: hasTrajectory ? `0 0 10px ${color}` : undefined,
            }}
            title={`Source ${sourceNum}`}
          >
            {sourceNum}
          </button>
        );
      })}
    </div>
  );
}

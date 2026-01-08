import { Play, Pause, Square, Repeat, Layers, ZoomIn, ZoomOut } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useTrajectoryPlayer } from '../hooks/useTrajectoryPlayer';

export function PlaybackControls() {
  const {
    isLooping,
    multiPlayMode,
    setLooping,
    setMultiPlayMode,
    canvasZoom,
    setCanvasZoom,
    zSliderVisible,
    setZSliderVisible,
    currentZ,
    setCurrentZ,
  } = useAppStore();

  const { play, pause, stop, toggle, isPlaying, playbackTime, duration } = useTrajectoryPlayer();

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const millis = Math.floor((ms % 1000) / 10);
    return `${seconds}.${millis.toString().padStart(2, '0')}s`;
  };

  return (
    <div className="absolute left-3 bottom-3 flex flex-col gap-3">
      {/* Zoom controls */}
      <div className="panel flex flex-col gap-1">
        <button
          onClick={() => setCanvasZoom(canvasZoom * 1.2)}
          className="p-2 rounded hover:bg-white/10 transition-colors"
          title="Zoom in"
        >
          <ZoomIn size={18} />
        </button>
        <button
          onClick={() => setCanvasZoom(canvasZoom / 1.2)}
          className="p-2 rounded hover:bg-white/10 transition-colors"
          title="Zoom out"
        >
          <ZoomOut size={18} />
        </button>
      </div>

      {/* Playback controls */}
      <div className="panel flex flex-col gap-2">
        {/* Play mode toggles */}
        <div className="flex gap-1">
          <button
            onClick={() => setLooping(!isLooping)}
            className={`p-2 rounded transition-colors ${
              isLooping ? 'bg-traj-accent text-white' : 'hover:bg-white/10'
            }`}
            title="Loop mode"
          >
            <Repeat size={18} />
          </button>
          <button
            onClick={() => setMultiPlayMode(!multiPlayMode)}
            className={`p-2 rounded transition-colors ${
              multiPlayMode ? 'bg-traj-accent text-white' : 'hover:bg-white/10'
            }`}
            title="Multi-play mode"
          >
            <Layers size={18} />
          </button>
        </div>

        {/* Play/Stop buttons */}
        <div className="flex gap-1">
          <button
            onClick={toggle}
            className="flex-1 p-3 rounded-lg bg-traj-accent hover:bg-opacity-90 transition-colors"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button
            onClick={stop}
            className="p-3 rounded-lg hover:bg-white/10 transition-colors"
            title="Stop"
          >
            <Square size={20} />
          </button>
        </div>

        {/* Time display */}
        <div className="text-xs text-center text-gray-400">
          {formatTime(playbackTime)} / {formatTime(duration)}
        </div>
      </div>

      {/* Z-axis control */}
      <div className="panel">
        <button
          onClick={() => setZSliderVisible(!zSliderVisible)}
          className={`w-full p-2 rounded text-sm font-medium transition-colors ${
            zSliderVisible ? 'bg-traj-accent text-white' : 'hover:bg-white/10'
          }`}
        >
          Z: {currentZ.toFixed(2)}
        </button>
        
        {zSliderVisible && (
          <div className="mt-2 flex items-center gap-2">
            <input
              type="range"
              min="-1"
              max="1"
              step="0.01"
              value={currentZ}
              onChange={(e) => setCurrentZ(parseFloat(e.target.value))}
              className="flex-1"
              style={{ writingMode: 'vertical-lr', direction: 'rtl', height: '100px' }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

import { Play, Pause, Square, Repeat, Layers, ZoomIn, ZoomOut, Gauge } from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useTrajectoryPlayer } from '../hooks/useTrajectoryPlayer';

export function PlaybackControls() {
  const {
    isLooping,
    multiPlayMode,
    playbackSpeed,
    setLooping,
    setMultiPlayMode,
    setPlaybackSpeed,
    canvasZoom,
    setCanvasZoom,
    zSliderVisible,
    setZSliderVisible,
    currentZ,
    setCurrentZ,
  } = useAppStore();

  const [speedControlVisible, setSpeedControlVisible] = useState(false);

  const { stop, toggle, isPlaying, playbackTime, duration } = useTrajectoryPlayer();

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

        {/* Speed control */}
        <div className="border-t border-white/10 pt-2">
          <button
            onClick={() => setSpeedControlVisible(!speedControlVisible)}
            className={`w-full p-2 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2 touch-manipulation ${
              speedControlVisible ? 'bg-traj-accent text-white' : 'hover:bg-white/10'
            }`}
          >
            <Gauge size={16} />
            <span>{playbackSpeed.toFixed(1)}x</span>
          </button>
          
          {speedControlVisible && (
            <div className="mt-2 space-y-2">
              {/* Preset speed buttons */}
              <div className="grid grid-cols-4 gap-1">
                {[0.25, 0.5, 1, 2].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => setPlaybackSpeed(speed)}
                    className={`p-2 text-xs rounded transition-colors touch-manipulation ${
                      Math.abs(playbackSpeed - speed) < 0.05
                        ? 'bg-traj-accent text-white'
                        : 'bg-white/5 hover:bg-white/10 active:bg-white/20'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
              
              {/* Fine speed slider */}
              <input
                type="range"
                min="0.1"
                max="4"
                step="0.1"
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                className="w-full h-8 touch-manipulation"
              />
            </div>
          )}
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

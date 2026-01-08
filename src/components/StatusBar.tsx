import { Wifi, WifiOff } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export function StatusBar() {
  const { connected, oscConfig } = useAppStore();

  return (
    <footer className="flex items-center justify-between px-4 py-1.5 bg-traj-surface border-t border-white/10 text-xs">
      <div className="flex items-center gap-4">
        {/* Connection status */}
        <div className={`flex items-center gap-1.5 ${connected ? 'text-green-400' : 'text-red-400'}`}>
          {connected ? <Wifi size={14} /> : <WifiOff size={14} />}
          <span>{connected ? 'Connected' : 'Disconnected'}</span>
        </div>

        {/* OSC Info */}
        <div className="text-gray-400">
          OSC → {oscConfig.outputIP}:{oscConfig.outputPort}
        </div>
      </div>

      <div className="flex items-center gap-4 text-gray-400">
        {/* Instructions */}
        <span>Draw: Click & drag</span>
        <span>|</span>
        <span>Select source: Left panel</span>
      </div>
    </footer>
  );
}

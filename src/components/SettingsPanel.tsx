import { X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useWebSocket } from '../hooks/useWebSocket';

export function SettingsPanel() {
  const {
    oscConfig,
    setOSCConfig,
    speakerDistance,
    setSpeakerDistance,
    toggleSettingsPanel,
  } = useAppStore();

  const { send } = useWebSocket();

  const handleOSCConfigChange = (key: keyof typeof oscConfig, value: string | number) => {
    const newConfig = { ...oscConfig, [key]: value };
    setOSCConfig(newConfig);
    
    // Send config update to server
    send({
      type: 'osc:config',
      payload: newConfig,
      timestamp: Date.now(),
    });
  };

  return (
    <div className="absolute right-0 top-0 bottom-0 w-80 bg-traj-surface border-l border-white/10 overflow-y-auto">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">Settings</h2>
          <button
            onClick={toggleSettingsPanel}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* OSC Configuration */}
        <section className="mb-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
            OSC Configuration
          </h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Output IP</label>
              <input
                type="text"
                value={oscConfig.outputIP}
                onChange={(e) => handleOSCConfigChange('outputIP', e.target.value)}
                className="w-full px-3 py-2 bg-traj-primary rounded-lg border border-white/10 focus:border-traj-accent focus:outline-none"
                placeholder="127.0.0.1"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-300 mb-1">Output Port</label>
              <input
                type="number"
                value={oscConfig.outputPort}
                onChange={(e) => handleOSCConfigChange('outputPort', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-traj-primary rounded-lg border border-white/10 focus:border-traj-accent focus:outline-none"
                placeholder="4003"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-300 mb-1">Input Port</label>
              <input
                type="number"
                value={oscConfig.inputPort}
                onChange={(e) => handleOSCConfigChange('inputPort', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-traj-primary rounded-lg border border-white/10 focus:border-traj-accent focus:outline-none"
                placeholder="9000"
              />
            </div>
          </div>
        </section>

        {/* Display Settings */}
        <section className="mb-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Display
          </h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-300 mb-1">
                Speaker Distance: {speakerDistance.toFixed(1)}m
              </label>
              <input
                type="range"
                min="0.5"
                max="5"
                step="0.1"
                value={speakerDistance}
                onChange={(e) => setSpeakerDistance(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </section>

        {/* Presets */}
        <section className="mb-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Quick Presets
          </h3>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                handleOSCConfigChange('outputIP', '127.0.0.1');
                handleOSCConfigChange('outputPort', 4003);
              }}
              className="p-2 text-sm bg-traj-primary rounded-lg hover:bg-white/10 transition-colors"
            >
              Holophonix Local
            </button>
            <button
              onClick={() => {
                handleOSCConfigChange('outputIP', 'holophonix.local');
                handleOSCConfigChange('outputPort', 4003);
              }}
              className="p-2 text-sm bg-traj-primary rounded-lg hover:bg-white/10 transition-colors"
            >
              Holophonix Network
            </button>
            <button
              onClick={() => {
                handleOSCConfigChange('outputIP', '127.0.0.1');
                handleOSCConfigChange('outputPort', 9001);
              }}
              className="p-2 text-sm bg-traj-primary rounded-lg hover:bg-white/10 transition-colors"
            >
              SPAT Revolution
            </button>
            <button
              onClick={() => {
                handleOSCConfigChange('outputIP', '127.0.0.1');
                handleOSCConfigChange('outputPort', 8000);
              }}
              className="p-2 text-sm bg-traj-primary rounded-lg hover:bg-white/10 transition-colors"
            >
              Default OSC
            </button>
          </div>
        </section>

        {/* About */}
        <section className="text-center text-xs text-gray-500">
          <p>Trajectoires v2.0.0</p>
          <p className="mt-1">Based on IRCAM original by</p>
          <p>X. Favory, J. Garcia, J. Bresson</p>
        </section>
      </div>
    </div>
  );
}

import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useWebSocket } from '../hooks/useWebSocket';
import type { OSCMapping, BoundingBox } from '@shared/types';

export function SettingsPanel() {
  const {
    oscConfig,
    setOSCConfig,
    oscMapping,
    setOSCMapping,
    speakerDistance,
    setSpeakerDistance,
    toggleSettingsPanel,
  } = useAppStore();

  const { send } = useWebSocket();
  const [mappingExpanded, setMappingExpanded] = useState(false);
  const [boundingBoxExpanded, setBoundingBoxExpanded] = useState(false);

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

  const handleMappingChange = (key: keyof OSCMapping, value: number) => {
    const newMapping = { ...oscMapping, [key]: value };
    setOSCMapping({ [key]: value });
    
    // Send mapping update to server
    send({
      type: 'osc:mapping',
      payload: newMapping,
      timestamp: Date.now(),
    });
  };

  const handleBoundingBoxChange = (key: keyof BoundingBox, value: number | boolean) => {
    const newBoundingBox = { ...oscMapping.boundingBox, [key]: value };
    setOSCMapping({ boundingBox: newBoundingBox });
    
    // Send mapping update to server
    send({
      type: 'osc:mapping',
      payload: { ...oscMapping, boundingBox: newBoundingBox },
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

        {/* OSC Mapping - Track & Coordinate Offsets */}
        <section className="mb-6">
          <button
            onClick={() => setMappingExpanded(!mappingExpanded)}
            className="w-full flex items-center justify-between text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3 p-2 -mx-2 rounded-lg hover:bg-white/5 active:bg-white/10 transition-colors touch-manipulation"
          >
            <span>Track & Offsets</span>
            {mappingExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          
          {mappingExpanded && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Track ID Offset: +{oscMapping.trackOffset}
                </label>
                <input
                  type="range"
                  min="0"
                  max="64"
                  step="1"
                  value={oscMapping.trackOffset}
                  onChange={(e) => handleMappingChange('trackOffset', parseInt(e.target.value))}
                  className="w-full h-8 touch-manipulation"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Source 1 → Track {1 + oscMapping.trackOffset}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">
                    X Offset: {oscMapping.xOffset.toFixed(2)}m
                  </label>
                  <input
                    type="range"
                    min="-5"
                    max="5"
                    step="0.1"
                    value={oscMapping.xOffset}
                    onChange={(e) => handleMappingChange('xOffset', parseFloat(e.target.value))}
                    className="w-full h-8 touch-manipulation"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-300 mb-2">
                    Y Offset: {oscMapping.yOffset.toFixed(2)}m
                  </label>
                  <input
                    type="range"
                    min="-5"
                    max="5"
                    step="0.1"
                    value={oscMapping.yOffset}
                    onChange={(e) => handleMappingChange('yOffset', parseFloat(e.target.value))}
                    className="w-full h-8 touch-manipulation"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Z Offset: {oscMapping.zOffset.toFixed(2)}m
                </label>
                <input
                  type="range"
                  min="-2"
                  max="5"
                  step="0.1"
                  value={oscMapping.zOffset}
                  onChange={(e) => handleMappingChange('zOffset', parseFloat(e.target.value))}
                  className="w-full h-8 touch-manipulation"
                />
              </div>

              <button
                onClick={() => {
                  handleMappingChange('trackOffset', 0);
                  handleMappingChange('xOffset', 0);
                  handleMappingChange('yOffset', 0);
                  handleMappingChange('zOffset', 0);
                }}
                className="w-full p-3 text-sm bg-traj-primary rounded-lg hover:bg-white/10 active:bg-white/20 transition-colors touch-manipulation"
              >
                Reset Offsets
              </button>
            </div>
          )}
        </section>

        {/* Bounding Box Constraints */}
        <section className="mb-6">
          <button
            onClick={() => setBoundingBoxExpanded(!boundingBoxExpanded)}
            className="w-full flex items-center justify-between text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3 p-2 -mx-2 rounded-lg hover:bg-white/5 active:bg-white/10 transition-colors touch-manipulation"
          >
            <span>Bounding Box</span>
            {boundingBoxExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          
          {boundingBoxExpanded && (
            <div className="space-y-4">
              <label className="flex items-center gap-3 p-3 bg-traj-primary rounded-lg cursor-pointer touch-manipulation">
                <input
                  type="checkbox"
                  checked={oscMapping.boundingBox.enabled}
                  onChange={(e) => handleBoundingBoxChange('enabled', e.target.checked)}
                  className="w-5 h-5 rounded touch-manipulation"
                />
                <span className="text-sm">Enable Bounding Box</span>
              </label>
              
              {oscMapping.boundingBox.enabled && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">
                        Min X: {oscMapping.boundingBox.minX.toFixed(1)}m
                      </label>
                      <input
                        type="range"
                        min="-10"
                        max="0"
                        step="0.1"
                        value={oscMapping.boundingBox.minX}
                        onChange={(e) => handleBoundingBoxChange('minX', parseFloat(e.target.value))}
                        className="w-full h-8 touch-manipulation"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">
                        Max X: {oscMapping.boundingBox.maxX.toFixed(1)}m
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="0.1"
                        value={oscMapping.boundingBox.maxX}
                        onChange={(e) => handleBoundingBoxChange('maxX', parseFloat(e.target.value))}
                        className="w-full h-8 touch-manipulation"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">
                        Min Y: {oscMapping.boundingBox.minY.toFixed(1)}m
                      </label>
                      <input
                        type="range"
                        min="-10"
                        max="0"
                        step="0.1"
                        value={oscMapping.boundingBox.minY}
                        onChange={(e) => handleBoundingBoxChange('minY', parseFloat(e.target.value))}
                        className="w-full h-8 touch-manipulation"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">
                        Max Y: {oscMapping.boundingBox.maxY.toFixed(1)}m
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="0.1"
                        value={oscMapping.boundingBox.maxY}
                        onChange={(e) => handleBoundingBoxChange('maxY', parseFloat(e.target.value))}
                        className="w-full h-8 touch-manipulation"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">
                        Min Z: {oscMapping.boundingBox.minZ.toFixed(1)}m
                      </label>
                      <input
                        type="range"
                        min="-5"
                        max="0"
                        step="0.1"
                        value={oscMapping.boundingBox.minZ}
                        onChange={(e) => handleBoundingBoxChange('minZ', parseFloat(e.target.value))}
                        className="w-full h-8 touch-manipulation"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">
                        Max Z: {oscMapping.boundingBox.maxZ.toFixed(1)}m
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="0.1"
                        value={oscMapping.boundingBox.maxZ}
                        onChange={(e) => handleBoundingBoxChange('maxZ', parseFloat(e.target.value))}
                        className="w-full h-8 touch-manipulation"
                      />
                    </div>
                  </div>
                  
                  <div className="p-3 bg-traj-primary/50 rounded-lg text-xs text-gray-400">
                    <p>Coordinates will be clamped to:</p>
                    <p className="mt-1 font-mono">
                      X: [{oscMapping.boundingBox.minX.toFixed(1)}, {oscMapping.boundingBox.maxX.toFixed(1)}]
                    </p>
                    <p className="font-mono">
                      Y: [{oscMapping.boundingBox.minY.toFixed(1)}, {oscMapping.boundingBox.maxY.toFixed(1)}]
                    </p>
                    <p className="font-mono">
                      Z: [{oscMapping.boundingBox.minZ.toFixed(1)}, {oscMapping.boundingBox.maxZ.toFixed(1)}]
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
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

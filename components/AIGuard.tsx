import React, { useState, useEffect, useCallback } from 'react';
import { SensorStatus } from '../types';

interface AIGuardProps {
  onTriggerSOS: () => void;
}

const AIGuard: React.FC<AIGuardProps> = ({ onTriggerSOS }) => {
  const [status, setStatus] = useState<SensorStatus>({
    isListening: false,
    isWatching: false,
    screamDetected: false,
    motionRisk: 0,
  });

  const [logs, setLogs] = useState<string[]>([]);

  // Simulation of sensors
  const toggleMonitoring = () => {
    setStatus(prev => ({
      ...prev,
      isListening: !prev.isListening,
      isWatching: !prev.isWatching
    }));
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (status.isListening) {
      // Simulate checking sensors
      interval = setInterval(() => {
        const randomMotion = Math.random() * 100;
        
        // Randomly simulate an event for demonstration
        if (Math.random() > 0.98) {
           addLog("⚠️ Unusual acceleration detected (Motion Anomaly)");
           setStatus(prev => ({ ...prev, motionRisk: 60 }));
        }

        if (Math.random() > 0.99) {
            addLog("🎤 High decibel audio spike detected.");
            // In a real app, verify frequency here.
        }

      }, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status.isListening]);

  const addLog = (msg: string) => {
    setLogs(prev => [new Date().toLocaleTimeString() + " - " + msg, ...prev.slice(0, 4)]);
  };

  return (
    <div className="p-4 bg-surface rounded-xl border border-gray-800 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-display text-primary">Guardian AI</h2>
        <button 
            onClick={toggleMonitoring}
            className={`px-3 py-1 rounded-full text-xs font-bold ${status.isListening ? 'bg-green-900 text-green-300 border border-green-500' : 'bg-gray-800 text-gray-400'}`}
        >
            {status.isListening ? 'ACTIVE' : 'DISABLED'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className={`p-3 rounded-lg border ${status.motionRisk > 50 ? 'border-red-500 bg-red-900/20' : 'border-gray-700 bg-gray-900'}`}>
            <div className="text-gray-400 text-xs uppercase mb-1">Motion</div>
            <div className="text-lg font-bold">{status.motionRisk > 50 ? 'Unstable' : 'Normal'}</div>
        </div>
        <div className={`p-3 rounded-lg border ${status.screamDetected ? 'border-red-500 bg-red-900/20' : 'border-gray-700 bg-gray-900'}`}>
            <div className="text-gray-400 text-xs uppercase mb-1">Audio</div>
            <div className="text-lg font-bold">{status.screamDetected ? 'SCREAM' : 'Clear'}</div>
        </div>
      </div>

      <div className="bg-black/50 p-3 rounded-lg h-32 overflow-y-auto font-mono text-xs text-green-400">
        <div className="text-gray-500 border-b border-gray-800 pb-1 mb-2">System Logs</div>
        {logs.length === 0 ? <span className="text-gray-600 opacity-50">Waiting for sensor data...</span> : logs.map((log, i) => (
            <div key={i} className="mb-1">{log}</div>
        ))}
      </div>

      <div className="pt-2">
         <button className="w-full py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm text-gray-300 flex items-center justify-center gap-2">
            <span>📷</span> Run Face Threat Scan
         </button>
      </div>
    </div>
  );
};

export default AIGuard;
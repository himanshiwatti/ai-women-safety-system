
import React, { useState, useEffect } from 'react';
import { analyzeImagePrivacy } from '../services/geminiService';

const DigitalShield: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'SCAN' | 'VAULT' | 'METADATA'>('SCAN');
  const [scanProgress, setScanProgress] = useState(0);
  const [threats, setThreats] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  
  // Vault State
  const [vaultFiles, setVaultFiles] = useState<string[]>([]);
  
  // Fake Threat Data
  const possibleThreats = [
    { app: 'SocialLens', risk: 'High', issue: 'Background Camera Access Detected 3 times in 1 hour.' },
    { app: 'QuickGallery', risk: 'Medium', issue: 'Attempted to read location history.' },
    { app: 'FilterMagic', risk: 'High', issue: 'Secretly uploading metadata to cloud.' }
  ];

  const startScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    setThreats([]);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setScanProgress(progress);
      
      if (progress === 40) {
        setThreats(prev => [...prev, possibleThreats[0]]);
      }
      if (progress === 70) {
        setThreats(prev => [...prev, possibleThreats[1]]);
      }

      if (progress >= 100) {
        clearInterval(interval);
        setIsScanning(false);
      }
    }, 100);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
       const fileName = e.target.files[0].name;
       // Simulate AI Check
       const result = await analyzeImagePrivacy("credit card and personal ID"); // Mock context
       
       if (!result.isSafe) {
           alert(`⚠️ PRIVACY WARNING: ${result.warning}. Recommendation: Lock in Vault.`);
       }
       setVaultFiles(prev => [...prev, fileName]);
    }
  };

  const renderScanner = () => (
    <div className="space-y-6 animate-fadeIn">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700 flex flex-col items-center text-center relative overflow-hidden">
            {isScanning && <div className="absolute inset-0 bg-primary/10 animate-pulse"></div>}
            
            <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center text-5xl mb-4 relative z-10 transition-all ${isScanning ? 'border-accent shadow-[0_0_30px_#FF4FF9] animate-spin' : 'border-green-500 shadow-[0_0_20px_#10B981]'}`}>
                {isScanning ? '⚙️' : '🛡️'}
            </div>
            
            <h3 className="text-xl font-display font-bold text-white relative z-10">
                {isScanning ? `Scanning Apps... ${scanProgress}%` : 'System Protected'}
            </h3>
            <p className="text-xs text-gray-400 mt-2 max-w-xs relative z-10">
                {isScanning ? 'Analyzing background permission usage and gallery access patterns.' : 'AI Watchdog is monitoring for unauthorized photo access.'}
            </p>

            {!isScanning && (
                <button onClick={startScan} className="mt-6 bg-primary hover:bg-purple-600 text-white font-bold py-2 px-8 rounded-full transition-all relative z-10">
                    Run Deep Scan
                </button>
            )}
        </div>

        {threats.length > 0 && (
            <div className="space-y-3">
                <h4 className="text-red-400 font-bold uppercase text-xs tracking-widest pl-1">Threats Detected ({threats.length})</h4>
                {threats.map((t, i) => (
                    <div key={i} className="bg-red-900/20 border border-red-500/50 p-4 rounded-xl flex items-start gap-3">
                        <span className="text-2xl">⚠️</span>
                        <div className="flex-1">
                            <div className="flex justify-between">
                                <span className="font-bold text-white">{t.app}</span>
                                <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full">{t.risk}</span>
                            </div>
                            <p className="text-xs text-gray-300 mt-1">{t.issue}</p>
                            <div className="mt-2 flex gap-2">
                                <button className="text-[10px] bg-red-900 text-red-200 px-3 py-1 rounded border border-red-700">Block Access</button>
                                <button className="text-[10px] bg-gray-800 text-gray-300 px-3 py-1 rounded border border-gray-600">Open Settings</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
        
        {!isScanning && threats.length === 0 && (
             <div className="p-4 rounded-xl border border-dashed border-gray-700 text-center text-gray-500 text-sm">
                No recent suspicious activity detected.
             </div>
        )}
    </div>
  );

  const renderVault = () => (
    <div className="space-y-6 animate-fadeIn">
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 text-center">
            <span className="text-4xl block mb-2">🔐</span>
            <h3 className="text-white font-bold">Encrypted Photo Vault</h3>
            <p className="text-xs text-gray-400 mt-1">Photos stored here are invisible to other apps and gallery.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
            <label className="aspect-square rounded-xl bg-gray-900 border-2 border-dashed border-gray-700 flex flex-col items-center justify-center cursor-pointer hover:border-accent hover:bg-gray-800 transition-all">
                <span className="text-2xl text-gray-500">+</span>
                <span className="text-xs text-gray-500 mt-2 font-bold">Add Photo</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
            </label>
            {vaultFiles.map((file, i) => (
                <div key={i} className="aspect-square rounded-xl bg-gray-800 border border-gray-700 flex flex-col items-center justify-center relative group overflow-hidden">
                    <span className="text-4xl">🖼️</span>
                    <span className="text-[10px] text-gray-400 mt-2 truncate w-full px-2 text-center">{file}</span>
                    <div className="absolute inset-0 bg-black/60 hidden group-hover:flex items-center justify-center gap-2">
                        <button className="text-xs bg-red-600 p-1 rounded">Del</button>
                        <button className="text-xs bg-blue-600 p-1 rounded">View</button>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );

  const renderMetadata = () => (
      <div className="space-y-6 animate-fadeIn">
          <div className="bg-blue-900/20 p-6 rounded-2xl border border-blue-800 text-center">
            <span className="text-4xl block mb-2">🧼</span>
            <h3 className="text-white font-bold">Metadata Scrubber</h3>
            <p className="text-xs text-gray-300 mt-1">Remove GPS location and device ID from photos before sharing on social media.</p>
          </div>
          
          <div className="bg-surface p-4 rounded-xl border border-gray-800">
             <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-300">Auto-Clean on Share</span>
                <div className="w-10 h-5 bg-primary rounded-full relative cursor-pointer">
                    <div className="w-3 h-3 bg-white rounded-full absolute top-1 right-1"></div>
                </div>
             </div>
             <p className="text-[10px] text-gray-500">
                When enabled, Guardian Eye will automatically strip EXIF data when you share via the app.
             </p>
          </div>
          
          <button className="w-full py-3 bg-gray-800 border border-gray-600 rounded-lg text-sm font-bold text-gray-300 hover:bg-gray-700">
              Select Photo to Clean
          </button>
      </div>
  );

  return (
    <div className="pb-24">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-2xl font-display text-white">Digital Shield</h2>
        <span className="px-2 py-0.5 bg-accent/20 text-accent text-[10px] rounded border border-accent/50 font-bold uppercase">Beta</span>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-gray-800 rounded-lg mb-6">
        <button 
            onClick={() => setActiveTab('SCAN')}
            className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${activeTab === 'SCAN' ? 'bg-surface text-white shadow' : 'text-gray-400'}`}
        >
            SCAN
        </button>
        <button 
            onClick={() => setActiveTab('VAULT')}
            className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${activeTab === 'VAULT' ? 'bg-surface text-white shadow' : 'text-gray-400'}`}
        >
            VAULT
        </button>
        <button 
            onClick={() => setActiveTab('METADATA')}
            className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${activeTab === 'METADATA' ? 'bg-surface text-white shadow' : 'text-gray-400'}`}
        >
            CLEANER
        </button>
      </div>

      {activeTab === 'SCAN' && renderScanner()}
      {activeTab === 'VAULT' && renderVault()}
      {activeTab === 'METADATA' && renderMetadata()}
    </div>
  );
};

export default DigitalShield;

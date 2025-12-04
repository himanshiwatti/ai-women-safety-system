
import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import SOSButton from './components/SOSButton';
import FakeShutdown from './components/FakeShutdown';
import SafeRouteMap from './components/SafeRouteMap';
import AIGuard from './components/AIGuard';
import ContactsManager from './components/ContactsManager';
import VoiceGuard from './components/VoiceGuard';
import DigitalShield from './components/DigitalShield';
import { ViewState, ChatMessage, EmergencyContact } from './types';
import { getSafetyAdvice, chatWithGuardian } from './services/geminiService';
import { SAFETY_TIPS, APP_NAME, MOCK_CONTACTS } from './constants';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.DASHBOARD);
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [dailyTip, setDailyTip] = useState(SAFETY_TIPS[0]);
  const [contacts, setContacts] = useState<EmergencyContact[]>(MOCK_CONTACTS);

  // Live Sharing State
  const [isLiveSharing, setIsLiveSharing] = useState(false);
  const [sharingContactIds, setSharingContactIds] = useState<string[]>([]);

  useEffect(() => {
    // Rotate tip on mount
    setDailyTip(SAFETY_TIPS[Math.floor(Math.random() * SAFETY_TIPS.length)]);
  }, []);

  // Simulate Live Sharing Background Service
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isLiveSharing && sharingContactIds.length > 0) {
        console.log("Starting Live Location Service...");
        interval = setInterval(() => {
            console.log(`📡 Sending encrypted location packet to ${sharingContactIds.length} contacts...`);
        }, 5000);
    }
    return () => clearInterval(interval);
  }, [isLiveSharing, sharingContactIds]);

  const triggerSOS = () => {
    setIsSOSActive(true);
    
    // SOS Protocol: Force enable Live Sharing for ALL contacts
    const allContactIds = contacts.map(c => c.id);
    setSharingContactIds(allContactIds);
    setIsLiveSharing(true);

    // Simulate API calls
    navigator.vibrate?.([500, 200, 500]);
    
    // Process Alerts
    setTimeout(() => {
        let alertSummary = `ALERTS SENT TO ${contacts.length} GUARDIANS:\n`;
        
        contacts.forEach(c => {
            const type = c.alertType || 'STANDARD';
            const msg = c.customAlertMessage ? `Custom Msg: "${c.customAlertMessage}"` : 'Standard SOS';
            
            if (type === 'URGENT_CALL') {
                alertSummary += `\n📞 Calling ${c.name} (Parent) - Priority Line`;
            } else if (type === 'VIDEO_LINK') {
                 alertSummary += `\n📹 Sent Live Video Link to ${c.name}`;
            } else {
                 alertSummary += `\n💬 SMS sent to ${c.name}`;
            }
        });

        alertSummary += `\n\nLocation shared with Police.\nAudio Recording Started.\nLIVE TRACKING ENABLED.`;
        alert(alertSummary);
    }, 800);
  };

  const cancelSOS = () => {
    setIsSOSActive(false);
    // Optional: Keep live sharing on until manually turned off? 
    // For safety, let's keep it on but maybe prompt user. 
    // For this demo, we assume user goes to settings to turn it off.
  };

  const handleAddContact = (contact: EmergencyContact) => {
    setContacts(prev => [...prev, contact]);
  };

  const handleDeleteContact = (id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id));
    setSharingContactIds(prev => prev.filter(cid => cid !== id));
  };

  const toggleShareContact = (id: string) => {
    setSharingContactIds(prev => {
        if (prev.includes(id)) {
            return prev.filter(cid => cid !== id);
        } else {
            return [...prev, id];
        }
    });
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: chatInput, timestamp: Date.now() };
    setChatHistory(prev => [...prev, newMsg]);
    setChatInput("");

    // Call Gemini
    const responseText = await chatWithGuardian(chatHistory, newMsg.text);
    
    setChatHistory(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now()
    }]);
  };

  const renderContent = () => {
    switch (view) {
      // Fake Shutdown is handled at the root level for full screen overlay
      case ViewState.FAKE_SHUTDOWN:
        return null;
      
      case ViewState.CONTACTS:
        return (
            <ContactsManager 
                contacts={contacts}
                onAdd={handleAddContact}
                onDelete={handleDeleteContact}
                onBack={() => setView(ViewState.DASHBOARD)}
            />
        );
        
      case ViewState.VOICE_CHAT:
        return <VoiceGuard />;
      
      case ViewState.DIGITAL_SHIELD:
        return <DigitalShield />;

      case ViewState.LIVE_SHARE:
        return (
            <div className="space-y-6 animate-fadeIn">
                <div className="flex items-center gap-4 mb-2">
                    <button onClick={() => setView(ViewState.DASHBOARD)} className="bg-gray-800 p-2 rounded-full hover:bg-gray-700 transition-colors">
                        ⬅️
                    </button>
                    <h2 className="text-2xl font-display text-white">Live Location</h2>
                </div>

                {/* Main Toggle */}
                <div className={`p-6 rounded-2xl border transition-all duration-500 flex flex-col items-center justify-center gap-4 text-center ${isLiveSharing ? 'bg-green-900/20 border-green-500 shadow-[0_0_30px_rgba(16,185,129,0.2)]' : 'bg-gray-800 border-gray-700'}`}>
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl border-4 transition-all duration-500 ${isLiveSharing ? 'bg-green-500 border-green-300 animate-pulse' : 'bg-gray-600 border-gray-500'}`}>
                        {isLiveSharing ? '📡' : '📍'}
                    </div>
                    <div>
                        <h3 className={`text-xl font-bold ${isLiveSharing ? 'text-green-400' : 'text-gray-300'}`}>
                            {isLiveSharing ? 'SHARING ACTIVE' : 'SHARING PAUSED'}
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">
                            {isLiveSharing ? 'Real-time location is being sent to selected contacts.' : 'Tap below to start sharing your journey.'}
                        </p>
                    </div>
                    <button 
                        onClick={() => setIsLiveSharing(!isLiveSharing)}
                        className={`w-full py-4 rounded-xl font-bold tracking-widest transition-all ${isLiveSharing ? 'bg-red-900/50 text-red-300 hover:bg-red-900' : 'bg-green-600 text-white hover:bg-green-500'}`}
                    >
                        {isLiveSharing ? 'STOP SHARING' : 'START SHARING'}
                    </button>
                </div>

                {/* Contact Selector */}
                <div className="bg-surface p-4 rounded-xl border border-gray-800">
                    <h3 className="text-white font-bold mb-4 flex justify-between items-center">
                        <span>Share with:</span>
                        <span className="text-xs text-gray-400">{sharingContactIds.length} selected</span>
                    </h3>
                    <div className="space-y-2">
                        {contacts.map(contact => {
                            const isSelected = sharingContactIds.includes(contact.id);
                            return (
                                <div 
                                    key={contact.id} 
                                    onClick={() => toggleShareContact(contact.id)}
                                    className={`p-3 rounded-lg flex justify-between items-center cursor-pointer border transition-all ${isSelected ? 'bg-primary/20 border-primary' : 'bg-gray-900 border-gray-800'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm">
                                            {contact.relation === 'Parent' ? '👪' : '👤'}
                                        </div>
                                        <div>
                                            <div className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-gray-400'}`}>{contact.name}</div>
                                            <div className="text-[10px] text-gray-500">{contact.relation}</div>
                                        </div>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'bg-primary border-primary' : 'border-gray-600'}`}>
                                        {isSelected && <span className="text-[10px]">✓</span>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-900/50 flex gap-3 items-center">
                     <span className="text-lg">🔐</span>
                     <p className="text-[10px] text-blue-200">
                        Location data is end-to-end encrypted. Only selected contacts can view your live movements on their map.
                     </p>
                </div>
            </div>
        );

      case ViewState.MAP:
        return (
          <div className="space-y-4 animate-fadeIn">
            <h2 className="text-2xl font-display text-white">Safe Route</h2>
            <SafeRouteMap />
            <div className="bg-surface p-4 rounded-lg border border-gray-800">
                <h3 className="text-accent font-bold mb-2">AI Analysis</h3>
                <p className="text-gray-300 text-sm">
                    Avoiding Zone B due to reported lighting issues and recent crowd anomaly. 
                    Adding 2 mins to walk but decreasing risk score by 45%.
                </p>
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={() => {
                        // Open Google Maps URL
                        window.open("https://www.google.com/maps/dir/?api=1&destination=Police+Station", "_blank");
                    }}
                    className="flex-1 bg-primary py-3 rounded-lg font-bold hover:bg-purple-700 transition-colors"
                >
                    Start Navigation
                </button>
                <button 
                    onClick={() => setView(ViewState.LIVE_SHARE)}
                    className="flex-1 bg-gray-800 py-3 rounded-lg font-bold hover:bg-gray-700 transition-colors text-accent border border-gray-700"
                >
                    {isLiveSharing ? 'Manage Sharing' : 'Share Live'}
                </button>
            </div>
          </div>
        );

      case ViewState.AI_GUARD:
        return (
          <div className="space-y-6 animate-fadeIn">
             <AIGuard onTriggerSOS={triggerSOS} />
             
             <div className="bg-surface p-4 rounded-xl border border-gray-800">
                <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                    <span>📡</span> Community Radar
                </h3>
                <p className="text-xs text-gray-400 mb-4">
                    4 Guardians nearby. Safe zones detected at 'City Library' (200m).
                </p>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 w-3/4"></div>
                </div>
                <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                    <span>Safety Score</span>
                    <span>75/100</span>
                </div>
             </div>
          </div>
        );

      case ViewState.CHAT:
        return (
            <div className="flex flex-col h-[calc(100vh-140px)]">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {chatHistory.length === 0 && (
                        <div className="text-center text-gray-500 mt-10">
                            <p>👋 Hi, I'm Guardian.</p>
                            <p className="text-xs">Ask me about laws, safety tips, or report an incident anonymously.</p>
                        </div>
                    )}
                    {chatHistory.map(msg => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-3 rounded-xl text-sm ${msg.role === 'user' ? 'bg-primary text-white rounded-br-none' : 'bg-gray-800 text-gray-200 rounded-bl-none'}`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                </div>
                <form onSubmit={handleChatSubmit} className="p-2 border-t border-gray-800 flex gap-2">
                    <input 
                        type="text" 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Type safety concern..."
                        className="flex-1 bg-black border border-gray-700 rounded-full px-4 py-2 text-sm focus:border-accent outline-none"
                    />
                    <button type="submit" className="bg-accent text-black rounded-full p-2 font-bold w-10 h-10 flex items-center justify-center">
                        ➤
                    </button>
                </form>
            </div>
        );

      case ViewState.SETTINGS:
        return (
            <div className="space-y-4">
                <h2 className="text-xl font-display">Settings</h2>
                <button onClick={() => setView(ViewState.CONTACTS)} className="w-full p-4 bg-gray-800 rounded-lg text-left hover:bg-gray-700 border border-gray-700 flex justify-between items-center">
                    <div>
                        <div className="font-bold text-white">Emergency Contacts</div>
                        <div className="text-xs text-gray-400">Manage parents & friends ({contacts.length})</div>
                    </div>
                    <span className="text-xl">👥</span>
                </button>
                <button onClick={() => setView(ViewState.FAKE_SHUTDOWN)} className="w-full p-4 bg-gray-800 rounded-lg text-left hover:bg-gray-700 border border-gray-700">
                    <div className="font-bold text-white">Fake Shutdown Mode</div>
                    <div className="text-xs text-gray-400">Tap to test stealth recording screen</div>
                </button>
                <div className="p-4 bg-gray-800 rounded-lg border border-gray-700 opacity-50">
                    <div className="font-bold text-white">Offline Vault</div>
                    <div className="text-xs text-gray-400">0 Photos, 0 Audio files encrypted</div>
                </div>
                <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <div className="font-bold text-white">Shake Sensitivity</div>
                    <input type="range" className="w-full mt-2 accent-primary" />
                </div>
            </div>
        );

      default: // Dashboard
        return (
          <div className="flex flex-col items-center">
            {/* Header Status */}
            <div className="w-full bg-surface p-4 rounded-xl border border-gray-800 mb-6 flex justify-between items-center shadow-lg relative overflow-hidden">
                {isLiveSharing && <div className="absolute top-0 left-0 w-full h-1 bg-green-500 animate-pulse"></div>}
                <div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-widest">Current Status</div>
                    <div className={`font-bold flex items-center gap-1 ${isLiveSharing ? 'text-green-400' : 'text-gray-300'}`}>
                        <span className={`w-2 h-2 rounded-full ${isLiveSharing ? 'bg-green-500 animate-ping' : 'bg-gray-500'}`}></span>
                        {isLiveSharing ? 'LIVE SHARING ON' : 'SECURE'}
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] text-gray-400 uppercase tracking-widest">Location</div>
                    <div className="text-white text-sm font-semibold">Downtown, 5th Ave</div>
                </div>
            </div>

            {/* SOS Button with z-index control */}
            <div className="relative z-10">
                <SOSButton onTrigger={triggerSOS} isSOSActive={isSOSActive} />
            </div>
            
            {isSOSActive && (
                <button 
                    onClick={cancelSOS} 
                    className="mt-4 text-sm text-gray-400 underline decoration-gray-600 hover:text-white z-20"
                >
                    False Alarm? Cancel SOS
                </button>
            )}

            <div className="w-full grid grid-cols-2 gap-4 mt-8 z-20 relative">
                <button onClick={() => setView(ViewState.VOICE_CHAT)} className="col-span-2 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 p-4 rounded-xl flex items-center justify-center gap-3 border border-gray-700 transition-all group">
                    <span className="text-2xl group-hover:scale-110 transition-transform">🎙️</span>
                    <span className="font-bold text-sm text-accent">Talk to Guardian AI</span>
                </button>

                <button onClick={() => setView(ViewState.MAP)} className="bg-gray-800 hover:bg-gray-700 p-4 rounded-xl flex flex-col items-center border border-gray-700 transition-all">
                    <span className="text-2xl mb-2">🚶‍♀️</span>
                    <span className="font-bold text-sm">Safe Route</span>
                </button>
                <button onClick={() => setView(ViewState.AI_GUARD)} className="bg-gray-800 hover:bg-gray-700 p-4 rounded-xl flex flex-col items-center border border-gray-700 transition-all">
                    <span className="text-2xl mb-2">👁️</span>
                    <span className="font-bold text-sm">AI Guard</span>
                </button>
                <button onClick={() => setView(ViewState.DIGITAL_SHIELD)} className="bg-gray-800 hover:bg-gray-700 p-4 rounded-xl flex flex-col items-center border border-gray-700 transition-all">
                    <span className="text-2xl mb-2">🔐</span>
                    <span className="font-bold text-sm">Digital Shield</span>
                </button>
                <button onClick={() => setView(ViewState.LIVE_SHARE)} className={`hover:bg-gray-700 p-4 rounded-xl flex flex-col items-center border transition-all ${isLiveSharing ? 'bg-green-900/30 border-green-800' : 'bg-gray-800 border-gray-700'}`}>
                    <span className="text-2xl mb-2">📍</span>
                    <span className={`font-bold text-sm ${isLiveSharing ? 'text-green-400' : 'text-white'}`}>
                        {isLiveSharing ? 'Sharing On' : 'Live Share'}
                    </span>
                </button>
            </div>

            <div className="mt-8 w-full bg-gradient-to-r from-primary/20 to-secondary/20 p-4 rounded-xl border border-primary/30">
                <h4 className="text-accent font-bold text-xs uppercase mb-1">Daily Safety Tip</h4>
                <p className="text-sm text-gray-200 leading-tight">"{dailyTip}"</p>
            </div>
          </div>
        );
    }
  };

  // Full screen override for Fake Shutdown
  if (view === ViewState.FAKE_SHUTDOWN) {
      return <FakeShutdown onExit={() => setView(ViewState.DASHBOARD)} />;
  }

  return (
    <div className="min-h-screen bg-dark pb-24 text-white font-sans selection:bg-accent selection:text-black">
      {/* Top Header */}
      <header className="px-6 pt-6 pb-2 flex justify-between items-center">
        <h1 className="font-display text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-secondary">
          {APP_NAME}
        </h1>
        <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-600 flex items-center justify-center">
            <span className="text-xs">👤</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 pt-4">
        {renderContent()}
      </main>

      <Navigation currentView={view} setView={setView} />
    </div>
  );
};

export default App;

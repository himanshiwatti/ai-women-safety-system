
import React from 'react';
import { ViewState } from '../types';

interface NavigationProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, setView }) => {
  const navItems = [
    { view: ViewState.DASHBOARD, label: 'Home', icon: '🏠' },
    { view: ViewState.MAP, label: 'Map', icon: '🗺️' },
    { view: ViewState.VOICE_CHAT, label: 'Voice', icon: '🎙️' },
    { view: ViewState.DIGITAL_SHIELD, label: 'Shield', icon: '🔐' },
    { view: ViewState.AI_GUARD, label: 'Guard', icon: '🛡️' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur-md border-t border-gray-800 pb-safe pt-2 px-4 z-40">
      <div className="flex justify-between items-center max-w-md mx-auto">
        {navItems.map((item) => (
          <button
            key={item.view}
            onClick={() => setView(item.view)}
            className={`flex flex-col items-center p-2 transition-colors duration-200 ${
              currentView === item.view ? 'text-accent' : 'text-gray-400'
            }`}
          >
            <span className="text-xl mb-1">{item.icon}</span>
            <span className="text-[10px] uppercase font-bold tracking-wider">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;

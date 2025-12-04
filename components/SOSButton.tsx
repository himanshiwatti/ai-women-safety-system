import React, { useState, useEffect } from 'react';

interface SOSButtonProps {
  onTrigger: () => void;
  isSOSActive: boolean;
}

const SOSButton: React.FC<SOSButtonProps> = ({ onTrigger, isSOSActive }) => {
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);

  // Simulate hold to trigger to prevent accidental presses (optional logic)
  // For this "Emergency" app, immediate tap is usually better, but let's do a 
  // rapid tap or a very reliable simple tap. 
  // We will use a visual ripple effect.

  return (
    <div className="relative flex justify-center items-center my-8 z-0">
      {/* Ripples - ADDED pointer-events-none to prevent blocking clicks */}
      <div className={`absolute w-64 h-64 rounded-full border-4 border-secondary opacity-20 pointer-events-none ${isSOSActive ? 'animate-ping' : ''}`}></div>
      <div className={`absolute w-52 h-52 rounded-full border-4 border-secondary opacity-40 pointer-events-none ${isSOSActive ? 'animate-ping-slow' : ''}`}></div>
      
      {/* Button */}
      <button
        onClick={onTrigger}
        className={`
          relative w-48 h-48 rounded-full 
          bg-gradient-to-br from-[#D50000] to-[#8a0000]
          shadow-[0_0_40px_rgba(213,0,0,0.6)]
          border-4 border-red-500
          flex flex-col items-center justify-center
          transition-transform active:scale-95
          z-10 cursor-pointer
          ${isSOSActive ? 'animate-pulse-fast' : ''}
        `}
      >
        <span className="font-display text-4xl font-black text-white tracking-widest drop-shadow-md">
          {isSOSActive ? 'ACTIVE' : 'SOS'}
        </span>
        <span className="text-xs text-red-100 mt-1 uppercase tracking-widest font-semibold">
          {isSOSActive ? 'SENDING ALERT' : 'TAP FOR HELP'}
        </span>
      </button>
    </div>
  );
};

export default SOSButton;
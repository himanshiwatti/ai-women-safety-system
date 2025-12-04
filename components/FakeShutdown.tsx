import React, { useState, useEffect, useRef } from 'react';

interface FakeShutdownProps {
  onExit: () => void;
}

const FakeShutdown: React.FC<FakeShutdownProps> = ({ onExit }) => {
  const [recording, setRecording] = useState(false);
  const tripleTapRef = useRef<number>(0);

  useEffect(() => {
    // Start "recording" immediately
    setRecording(true);
    const interval = setInterval(() => {
        // Simulating recording process logs
        console.log("Stealth Recording: capturing audio/video stream...");
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleInteraction = () => {
    // Triple tap logic to exit
    const now = Date.now();
    if (now - tripleTapRef.current < 500) {
      // Successive tap
      tripleTapRef.current = now;
      // If we had a counter we would increment, but let's just say a rapid double/triple interaction exits
      onExit();
    } else {
      tripleTapRef.current = now;
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black z-50 cursor-none touch-none flex items-center justify-center"
      onClick={handleInteraction}
    >
      {/* Pure black screen. Hidden UI element for developer to know it's on */}
      <div className="opacity-0 hover:opacity-10 text-gray-800 text-[10px] select-none pointer-events-none">
        Recording active. Double-tap rapidly to exit.
      </div>
    </div>
  );
};

export default FakeShutdown;

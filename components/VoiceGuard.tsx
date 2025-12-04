import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

// --- Audio Helper Functions ---

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function createBlob(data: Float32Array): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// --- Component ---

const VoiceGuard: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<'DISCONNECTED' | 'CONNECTING' | 'LISTENING' | 'SPEAKING'>('DISCONNECTED');
  const [error, setError] = useState<string | null>(null);
  
  // Audio Contexts & Nodes
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const inputNodeRef = useRef<GainNode | null>(null);
  const outputNodeRef = useRef<GainNode | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  // Session & Timing
  const nextStartTimeRef = useRef<number>(0);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);

  const startSession = async () => {
    try {
      setError(null);
      setStatus('CONNECTING');
      
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API Key missing");
      
      const ai = new GoogleGenAI({ apiKey });

      // Initialize Audio Contexts
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      inputAudioContextRef.current = inputCtx;
      outputAudioContextRef.current = outputCtx;
      
      // Setup Nodes
      const inputNode = inputCtx.createGain();
      const outputNode = outputCtx.createGain();
      inputNode.connect(inputCtx.destination); // Mute local mic feedback? No, script processor handles it.
      outputNode.connect(outputCtx.destination);
      
      inputNodeRef.current = inputNode;
      outputNodeRef.current = outputNode;

      // Get Mic Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Connect to Gemini
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setStatus('LISTENING');
            // Stream audio input
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              if (!isActive) return; 
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputNode); // Keep chain alive
          },
          onmessage: async (message: LiveServerMessage) => {
             // Handle Audio Output
             const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
             if (base64Audio) {
                setStatus('SPEAKING');
                const ctx = outputAudioContextRef.current;
                if (!ctx) return;

                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                
                const audioBuffer = await decodeAudioData(
                    decode(base64Audio),
                    ctx,
                    24000,
                    1
                );
                
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputNodeRef.current!);
                
                source.addEventListener('ended', () => {
                    sourcesRef.current.delete(source);
                    // Simple heuristic: if no sources playing, we are back to listening
                    if (sourcesRef.current.size === 0) setStatus('LISTENING');
                });
                
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                sourcesRef.current.add(source);
             }
             
             // Handle Interruption
             if (message.serverContent?.interrupted) {
                 sourcesRef.current.forEach(s => {
                     try { s.stop(); } catch(e) {}
                     sourcesRef.current.delete(s);
                 });
                 nextStartTimeRef.current = 0;
                 setStatus('LISTENING');
             }
          },
          onclose: () => {
             setStatus('DISCONNECTED');
             setIsActive(false);
          },
          onerror: (e) => {
             console.error(e);
             setError("Connection Error");
             setStatus('DISCONNECTED');
             setIsActive(false);
          }
        },
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
            },
            systemInstruction: "You are Guardian Eye, a futuristic, capable, and comforting AI safety assistant. Speak concisely and calmly. If the user is in danger, provide short, clear instructions."
        }
      });
      
      sessionPromiseRef.current = sessionPromise;
      setIsActive(true);
      
    } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to start session");
        setStatus('DISCONNECTED');
    }
  };
  
  const stopSession = () => {
      // Clean up audio contexts
      inputAudioContextRef.current?.close();
      outputAudioContextRef.current?.close();
      
      // We can't strictly 'close' the session via a method on sessionPromise easily without keeping reference to the session object returned.
      // But clearing state will stop logic in callbacks.
      // Ideally we would call session.close() if exposed.
      // For this demo, reloading or strictly managing state is fine.
      
      setIsActive(false);
      setStatus('DISCONNECTED');
      window.location.reload(); // Simplest way to ensure clean audio state/socket close for this demo
  };

  useEffect(() => {
      return () => {
          // Cleanup on unmount
          if (isActive) stopSession();
      }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-160px)] px-6 relative overflow-hidden">
        {/* Background Ambient Effects */}
        <div className={`absolute w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] transition-all duration-1000 ${status === 'SPEAKING' ? 'scale-125 opacity-40' : 'scale-100 opacity-20'}`}></div>
        
        {/* Main Interface */}
        <div className="relative z-10 flex flex-col items-center gap-8">
            <h2 className="font-display text-2xl text-white tracking-widest text-center">
                GUARDIAN VOICE
            </h2>
            
            {/* The Orb */}
            <div className="relative">
                <div className={`w-40 h-40 rounded-full border-4 flex items-center justify-center transition-all duration-300
                    ${status === 'CONNECTING' ? 'border-yellow-500 animate-pulse' : ''}
                    ${status === 'LISTENING' ? 'border-primary shadow-[0_0_50px_#6A0DAD]' : ''}
                    ${status === 'SPEAKING' ? 'border-accent shadow-[0_0_80px_#FF4FF9] scale-110' : ''}
                    ${status === 'DISCONNECTED' ? 'border-gray-700 bg-gray-900' : 'bg-black/50 backdrop-blur'}
                `}>
                    {status === 'CONNECTING' && <span className="text-4xl">⏳</span>}
                    {status === 'LISTENING' && <span className="text-4xl animate-pulse">👂</span>}
                    {status === 'SPEAKING' && <div className="flex gap-1 items-center h-8">
                        <div className="w-1 bg-accent h-full animate-[ping_0.5s_infinite]"></div>
                        <div className="w-1 bg-accent h-3/4 animate-[ping_0.6s_infinite]"></div>
                        <div className="w-1 bg-accent h-full animate-[ping_0.7s_infinite]"></div>
                    </div>}
                    {status === 'DISCONNECTED' && <span className="text-4xl text-gray-600">🎙️</span>}
                </div>
                
                {/* Rings */}
                {isActive && (
                    <>
                        <div className="absolute inset-0 rounded-full border border-primary/30 scale-125 animate-[spin_10s_linear_infinite]"></div>
                        <div className="absolute inset-0 rounded-full border border-accent/20 scale-150 animate-[spin_15s_linear_infinite_reverse]"></div>
                    </>
                )}
            </div>

            {/* Status Text */}
            <div className="text-center h-12">
                <p className="text-sm font-bold tracking-widest text-gray-300 uppercase">
                    {status}
                </p>
                {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
                {status === 'LISTENING' && <p className="text-xs text-gray-500 mt-1">Listening to you...</p>}
                {status === 'SPEAKING' && <p className="text-xs text-accent mt-1">Guardian is speaking...</p>}
            </div>

            {/* Controls */}
            {!isActive ? (
                <button 
                    onClick={startSession}
                    className="bg-primary hover:bg-purple-600 text-white font-display font-bold py-4 px-12 rounded-full text-lg shadow-[0_0_20px_rgba(106,13,173,0.5)] transition-all transform active:scale-95"
                >
                    INITIALIZE VOICE
                </button>
            ) : (
                <button 
                    onClick={stopSession}
                    className="bg-red-900/50 hover:bg-red-900 text-red-200 border border-red-500 font-bold py-3 px-8 rounded-full text-sm transition-all"
                >
                    TERMINATE SESSION
                </button>
            )}
            
            <p className="text-[10px] text-gray-500 max-w-xs text-center">
                Powered by Gemini 2.5 Native Audio. 
                <br/>Latency optimized for emergency response.
            </p>
        </div>
    </div>
  );
};

export default VoiceGuard;
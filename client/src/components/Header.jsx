import React, { useState, useEffect } from 'react';
import { Sparkles, Terminal, AlertCircle, RefreshCw } from 'lucide-react';

export default function Header({ onToggleTerminal, logCount = 0, isGenerating = false }) {
  const [apiStatus, setApiStatus] = useState('checking'); // 'healthy' | 'unhealthy' | 'checking'

  const checkHealth = async () => {
    setApiStatus('checking');
    try {
      const res = await fetch('/api/health', { cache: 'no-store' });
      if (res.ok) {
        setApiStatus('healthy');
      } else {
        setApiStatus('unhealthy');
      }
    } catch {
      setApiStatus('unhealthy');
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-30 bg-black/80 backdrop-blur-md border-b border-zinc-800/80 px-3 sm:px-8 py-3">
      <div className="max-w-[1700px] mx-auto flex items-center justify-between gap-2">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2.5 shrink-0">
          <img 
            src="/logo1.png" 
            alt="NotesMaker AI Logo" 
            className="w-8 h-8 sm:w-9 sm:h-9 object-contain shrink-0" 
          />
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-zinc-50">
                NotesMaker A<i>I</i>
              </h1>
              <span className="xs:inline-flex px-2 py-0.5 text-[9px] sm:text-[10px] font-mono tracking-wider uppercase rounded-md bg-zinc-900 text-zinc-400 border border-zinc-800">
                v1.0
              </span>
            </div>
            {/* <p className="text-[11px] text-zinc-400 hidden md:block">
              Autonomous Video Lecture Summarization & Multi-Agent Note Synthesis
            </p> */}
          </div>
        </div>

        {/* Status Badges & Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* API Health Indicator */}
          <div 
            onClick={checkHealth}
            title="Click to check API connection"
            className="cursor-pointer flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-md bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 hover:border-zinc-700 transition text-[11px] sm:text-xs font-medium text-zinc-300"
          >
            {apiStatus === 'checking' && (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span className="text-zinc-400 hidden sm:inline">Connecting...</span>
              </>
            )}
            {apiStatus === 'healthy' && (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-emerald-400 hidden sm:inline">API Connected</span>
                <span className="text-emerald-400 sm:hidden">API</span>
              </>
            )}
            {apiStatus === 'unhealthy' && (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-rose-400 hidden sm:inline">API Offline</span>
                <span className="text-rose-400 sm:hidden">Offline</span>
              </>
            )}
          </div>

          {/* Terminal Toggle Button */}
          <button
            onClick={onToggleTerminal}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-md text-xs font-medium transition-all shadow-sm ${
              isGenerating
                ? 'bg-zinc-100 text-zinc-900 shadow-zinc-100/10 animate-pulse font-semibold'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-400" />
            <span className="hidden xs:inline">Terminal</span>
            {logCount > 0 && (
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-zinc-950 text-zinc-300 border border-zinc-800">
                {logCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

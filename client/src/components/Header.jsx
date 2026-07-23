import React, { useState, useEffect } from 'react';
import { Sparkles, Terminal, AlertCircle, RefreshCw, LogIn, LogOut, User, History, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Header({ 
  onToggleTerminal, 
  logCount = 0, 
  isGenerating = false, 
  onOpenAuthModal,
  apiStatus = 'checking',
  checkHealth,
  setShowDisconnectModal,
  onToggleHistory
}) {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const { currentUser, logout, getUserDisplayName } = useAuth();

  const handleLogout = async () => {
    setUserDropdownOpen(false);
    try {
      await logout();
    } catch (err) {
      console.error('Failed to log out:', err);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-[90] bg-black/80 backdrop-blur-md border-b border-zinc-800/80 px-3 sm:px-8 py-3">
      <div className="max-w-[1700px] mx-auto flex items-center justify-between gap-2">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <img 
            src="/logo2.png" 
            alt="NotesMaker AI Logo" 
            className="w-4 h-4 sm:w-6 sm:h-6 object-contain shrink-0" 
          />
          <div>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-zinc-50">
                NotesMaker A<i>I</i>
              </h1>
              <span className="inline-flex items-center justify-center px-2 py-0.5 text-[9px] sm:text-[10px] font-mono tracking-wider uppercase rounded-md bg-zinc-900 text-zinc-400 border border-zinc-800 align-middle">
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
            onClick={() => {
              if (apiStatus === 'unhealthy') {
                setShowDisconnectModal(true);
              } else {
                checkHealth();
              }
            }}
            title={apiStatus === 'unhealthy' ? "Click to connect API" : "Click to check API connection"}
            className="cursor-pointer hidden lg:flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-md bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 hover:border-zinc-700 transition text-[11px] sm:text-xs font-medium text-zinc-300"
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
                <span className="text-rose-400 hidden sm:inline">Connect API</span>
                <span className="text-rose-400 sm:hidden">Connect</span>
              </>
            )}
          </div>

          {/* History / Menu Button */}
          <button
            onClick={onToggleHistory}
            className={`items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-md text-xs font-medium transition-all shadow-sm bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 ${
              currentUser ? 'flex' : 'flex lg:hidden'
            }`}
            title="Open menu & history"
          >
            <Menu className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-400 lg:hidden" />
            <History className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-400 hidden lg:inline" />
            <span className="hidden lg:inline">History</span>
          </button>

          {/* Terminal Toggle Button */}
          <button
            onClick={onToggleTerminal}
            className={`hidden lg:flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-md text-xs font-medium transition-all shadow-sm ${
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

          {/* User Authentication Control */}
          {currentUser ? (
            <div className="relative hidden lg:block">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-200 transition"
              >
                <div className="w-5 h-5 rounded-full bg-zinc-700 text-zinc-200 flex items-center justify-center text-[10px] font-bold uppercase">
                  {getUserDisplayName(currentUser).charAt(0)}
                </div>
                <span className="max-w-[100px] truncate hidden sm:inline">
                  {getUserDisplayName(currentUser)}
                </span>
              </button>

              {/* Dropdown Menu */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl py-1 z-50 animate-fadeIn">
                  <div className="px-3 py-2 border-b border-zinc-800 text-xs flex items-center justify-between gap-1">
                    <div className="min-w-0">
                      <p className="text-zinc-400">Signed in as</p>
                      <p className="font-semibold text-sm py-0.5 text-zinc-100 truncate">{getUserDisplayName(currentUser)}</p>
                    </div>
                    <button
                      onClick={() => setUserDropdownOpen(false)}
                      className="text-zinc-500 hover:text-zinc-300 p-0.5 rounded transition shrink-0"
                      title="Close menu"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:bg-zinc-900 flex items-center gap-2 transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => onOpenAuthModal('login')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold transition shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

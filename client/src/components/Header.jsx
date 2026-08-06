import React, { useState, useEffect } from 'react';
import { Sparkles, Terminal, AlertCircle, RefreshCw, LogIn, LogOut, User, History, Menu, X, Key } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Header({ 
  onToggleTerminal, 
  logCount = 0, 
  isGenerating = false, 
  onOpenAuthModal,
  apiStatus = 'checking',
  checkHealth,
  setShowDisconnectModal,
  onToggleHistory,
  onOpenApiKeySettings,
  globalTab = 'home',
  setGlobalTab
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
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <img 
              src="/logo2.png" 
              alt="NotesMaker AI Logo" 
              className="w-4 h-4 sm:w-6 sm:h-6 object-contain shrink-0" 
            />
            <div className="flex items-center gap-1 sm:gap-1.5">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-zinc-50">
                NotesMaker A<i>I</i>
              </h1>
              <span className="inline-flex items-center justify-center px-2 py-0.5 text-[9px] sm:text-[10px] font-mono tracking-wider uppercase rounded-md bg-zinc-900 text-zinc-400 border border-zinc-800 align-middle">
                v1.0
              </span>
            </div>
          </div>

          {/* Global Nav Links */}
          <nav className="flex items-center gap-1 sm:gap-1.5 ml-1 sm:ml-4 pl-1 sm:pl-4 border-l border-zinc-800">
            <button
              onClick={() => setGlobalTab('home')}
              className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-md text-[11px] sm:text-xs font-semibold tracking-wide transition ${
                globalTab === 'home' 
                  ? 'bg-zinc-900 text-zinc-100' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setGlobalTab('workspace')}
              className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-md text-[11px] sm:text-xs font-semibold tracking-wide transition ${
                globalTab === 'workspace' 
                  ? 'bg-zinc-900 text-zinc-100' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Workspace
            </button>
          </nav>
        </div>

        {/* Status Badges & Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Menu / Drawer Toggle Button (Visible on all sizes) */}
          <button
            onClick={onToggleHistory}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-md text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 transition-all duration-150 cursor-pointer"
            title="Open menu & controls"
          >
            <Menu className="w-4 h-4 text-zinc-400" />
            <span className="hidden sm:inline">Menu</span>
          </button>
        </div>
      </div>
    </header>
  );
}

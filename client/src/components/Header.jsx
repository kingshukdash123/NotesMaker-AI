import React from 'react';
import { Menu } from 'lucide-react';

export default function Header({ 
  globalTab = 'home',
  setGlobalTab,
  isSidebarMobileOpen = false,
  setIsSidebarMobileOpen
}) {
  return (
    <header className="fixed top-0 left-0 right-0 z-[90] bg-black/80 backdrop-blur-md border-b border-zinc-800/80 px-3 sm:px-8 py-3">
      <div className="max-w-[1700px] mx-auto flex items-center justify-between gap-2">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {globalTab === 'workspace' && (
            <button
              onClick={() => setIsSidebarMobileOpen(!isSidebarMobileOpen)}
              className="lg:hidden p-2 rounded-lg text-zinc-400 cursor-pointer"
            >
              <Menu className="w-3.5 h-3.5" />
            </button>
          )}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <img 
              src="/logo2.png" 
              alt="NotesMaker AI Logo" 
              className="w-4 h-4 sm:w-6 sm:h-6 object-contain shrink-0" 
            />
            <div className="flex items-center gap-1 sm:gap-1.5">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-zinc-50">
                NotesMaker <span className="text-orange-500 font-bold">A<i>I</i></span>
              </h1>
            </div>
          </div>

          {/* Global Nav Links */}
          <nav className="flex items-center gap-1 sm:gap-2 ml-1 sm:ml-4 pl-1 sm:pl-4 border-l border-zinc-800">
            <button
              onClick={() => setGlobalTab('home')}
              className={`px-3 py-2 text-[11px] sm:text-xs font-semibold tracking-wide transition relative cursor-pointer ${
                globalTab === 'home' 
                  ? 'text-zinc-100 font-bold' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <span>Home</span>
              {globalTab === 'home' && (
                <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-orange-500 rounded-full animate-fadeIn" />
              )}
            </button>
            <button
              onClick={() => setGlobalTab('workspace')}
              className={`px-3 py-2 text-[11px] sm:text-xs font-semibold tracking-wide transition relative cursor-pointer ${
                globalTab === 'workspace' 
                  ? 'text-zinc-100 font-bold' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <span>Workspace</span>
              {globalTab === 'workspace' && (
                <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-orange-500 rounded-full animate-fadeIn" />
              )}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}

import React, { useState, useEffect } from 'react';
import { Menu, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Header({ 
  globalTab = 'home',
  setGlobalTab,
  isSidebarMobileOpen = false,
  setIsSidebarMobileOpen
}) {
  const { currentUser, logout, getUserDisplayName } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Close profile dropdown when clicking anywhere else
  useEffect(() => {
    const handleOutsideClick = () => {
      setIsProfileOpen(false);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

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

        {/* Right Side: Profile Icon (Home Page Only, when logged in) */}
        {globalTab === 'home' && currentUser && (
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 text-orange-500 hover:border-zinc-700 transition flex items-center justify-center text-xs font-black uppercase shadow-inner cursor-pointer select-none"
            >
              {getUserDisplayName(currentUser).charAt(0)}
            </button>

            {/* Profile Dropdown Bar */}
            {isProfileOpen && (
              <div className="absolute right-0 top-10 w-64 bg-zinc-950 border border-zinc-800 shadow-2xl rounded-2xl p-4 space-y-4 z-50 animate-in fade-in slide-in-from-top-1 duration-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 text-orange-500 flex items-center justify-center text-sm font-black uppercase shadow-inner select-none">
                    {getUserDisplayName(currentUser).charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-zinc-50 truncate">{getUserDisplayName(currentUser)}</h4>
                    <p className="text-[10px] text-zinc-500 truncate">{currentUser.email}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-900 flex flex-col gap-2">
                  {/* Go to Workspace shortcut */}
                  <button
                    type="button"
                    onClick={() => {
                      setGlobalTab('workspace');
                      setIsProfileOpen(false);
                    }}
                    className="w-full py-2 px-3 hover:bg-zinc-900/60 border border-zinc-900 text-zinc-350 hover:text-zinc-100 font-semibold text-[11px] rounded-lg transition duration-250 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Go to Workspace</span>
                  </button>

                  {/* Sign Out Button */}
                  <button
                    type="button"
                    onClick={async () => {
                      setIsProfileOpen(false);
                      try {
                        await logout();
                      } catch (err) {
                        console.error('Logout failed:', err);
                      }
                    }}
                    className="w-full py-2 px-3 bg-red-950/20 hover:bg-red-900/10 border border-red-950/40 hover:border-red-900/60 text-red-500 font-semibold text-[11px] rounded-lg transition duration-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

import { useState, useEffect } from 'react';
import { Menu, Maximize2, Minimize2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from './common/ThemeToggle';

export default function Header({
  isSidebarMobileOpen = false,
  setIsSidebarMobileOpen,
}) {
  const { currentUser } = useAuth();
  const { setActiveSection, setIsProfileOpen, resetActiveVideo } = useApp();
  const { isDark } = useTheme();
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(false);

  // Sync state with native browser fullscreen changes (e.g. Fn+F11 or Esc)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = Boolean(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsBrowserFullscreen(isFull);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const handleToggleBrowserFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
          await document.documentElement.webkitRequestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) {
          await document.documentElement.msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          await document.msExitFullscreen();
        }
      }
    } catch (err) {
      console.error('Browser fullscreen toggle error:', err);
    }
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-[90] backdrop-blur-md px-3 sm:px-8 py-3 transition-colors duration-200 border-b ${isDark ? 'bg-black/80 border-zinc-800/80' : 'bg-white/90 border-orange-200/80 shadow-xs'
      }`}>
      <div className="max-w-[1700px] mx-auto flex items-center justify-between gap-2">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {currentUser && (
            <button
              type="button"
              onClick={() => setIsSidebarMobileOpen(!isSidebarMobileOpen)}
              className="btn-icon lg:hidden"
              aria-label="Toggle sidebar menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}

          <div
            className="flex items-center gap-1.5 sm:gap-2 shrink-0 cursor-pointer select-none"
            onClick={() => {
              if (currentUser) {
                resetActiveVideo();
                setActiveSection('dashboard');
              }
            }}
          >
            <img
              src="/logo2.png"
              alt="Pathshala Logo"
              className="w-5 h-5 sm:w-6 sm:h-6 object-contain shrink-0"
            />
            <div className="flex items-center gap-1 sm:gap-1.5">
              <h1 className={`text-base sm:text-lg font-bold tracking-tight ${isDark ? 'text-zinc-50' : 'text-orange-950'
                }`}>
                Pathshala <span className="text-orange-500 font-bold">A<i>I</i></span>
              </h1>
            </div>
          </div>
        </div>

        {/* Right Side: Fullscreen, Theme Toggle & Profile Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Full Screen (Fn+F11) Toggle - Only shown on Desktop/Laptop views after login */}
          {currentUser && (
            <button
              type="button"
              onClick={handleToggleBrowserFullscreen}
              className={`hidden lg:flex w-8 h-8 rounded-full border transition items-center justify-center cursor-pointer select-none ${isDark
                  ? 'bg-zinc-900 border-zinc-800 text-orange-500 hover:border-zinc-700'
                  : 'bg-orange-100 border-orange-300 text-orange-700 hover:bg-orange-200'
                }`}
              title={isBrowserFullscreen ? "Exit Fullscreen (F11)" : "Enter Fullscreen (F11)"}
              aria-label={isBrowserFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isBrowserFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Theme Mode Toggle Button */}
          <ThemeToggle />

          {/* Quick Profile Access if logged in */}
          {currentUser && (
            <button
              type="button"
              onClick={() => setIsProfileOpen(true)}
              className={`w-8 h-8 rounded-full transition flex items-center justify-center text-xs font-black uppercase shadow-inner cursor-pointer select-none ${isDark
                  ? 'bg-zinc-900 border border-zinc-800 text-orange-500 hover:border-zinc-700'
                  : 'bg-orange-100 border border-orange-300 text-orange-700 hover:bg-orange-200'
                }`}
              title="User Profile"
              aria-label="Open User Profile"
            >
              {currentUser.email?.charAt(0) || 'U'}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

import { useState, useEffect } from 'react';
import {
  Menu,
  X,
  Maximize2,
  Minimize2,
  LogIn,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from './common/ThemeToggle';

const NAV_LINKS = [
  { id: 'home', label: 'Home', isRoute: true, routeUrl: '/' },
  { id: 'features', label: 'Features' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'faq', label: 'FAQ' },
  { id: 'privacy', label: 'Policies', isRoute: true, routeUrl: '/privacy' },
];

export default function Header({
  isSidebarMobileOpen = false,
  setIsSidebarMobileOpen,
  onOpenAuthModal,
}) {
  const { currentUser, getUserDisplayName } = useAuth();
  const { activeSection, setActiveSection, setIsProfileOpen, resetActiveVideo } = useApp();
  const { isDark } = useTheme();
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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

  const handleLogoClick = () => {
    resetActiveVideo();
    setActiveSection('dashboard');
    const targetUrl = currentUser ? '/dashboard' : '/';
    if (window.location.pathname !== targetUrl) {
      window.history.pushState(null, '', targetUrl);
    }
    if (!currentUser && window.location.pathname === targetUrl) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  const handleNavClick = (link) => {
    setIsMobileMenuOpen(false);

    if (link.id === 'home' || link.routeUrl === '/') {
      resetActiveVideo();
      setActiveSection('dashboard');
      if (window.location.pathname !== '/') {
        window.history.pushState(null, '', '/');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (link.isRoute) {
      setActiveSection(link.id);
      if (window.location.pathname !== link.routeUrl) {
        window.history.pushState(null, '', link.routeUrl);
      }
      return;
    }

    // Scroll to section on home landing page
    if (activeSection !== 'dashboard') {
      setActiveSection('dashboard');
      if (window.location.pathname !== '/') {
        window.history.pushState(null, '', '/');
      }
      setTimeout(() => {
        const el = document.getElementById(link.id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const el = document.getElementById(link.id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const navLinkClass = isDark
    ? 'text-zinc-400 hover:text-orange-400 hover:bg-orange-500/10'
    : 'text-zinc-600 hover:text-orange-600 hover:bg-orange-50';

  return (
    <header className={`fixed top-0 left-0 right-0 z-[90] backdrop-blur-md px-3 sm:px-8 py-2.5 sm:py-3 transition-colors duration-200 border-b bg-transparent ${
      isDark ? 'border-zinc-800/80' : 'border-zinc-200/80 shadow-xs'
    }`}>
      <div className="w-full flex items-center justify-between gap-3 sm:gap-6">
        
        {/* Left: Brand Logo & Name */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {currentUser && (
            <button
              type="button"
              onClick={() => setIsSidebarMobileOpen?.(!isSidebarMobileOpen)}
              className="lg:hidden p-1.5 text-zinc-400 hover:text-zinc-200 cursor-pointer bg-transparent"
              aria-label="Toggle sidebar menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div
            role="button"
            tabIndex={0}
            aria-label="Go to Home"
            onClick={handleLogoClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleLogoClick();
              }
            }}
            className="flex items-center gap-1.5 sm:gap-2 shrink-0 cursor-pointer select-none transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <img
              src="/logo2.png"
              alt="Pathshala AI Logo"
              width="24"
              height="24"
              fetchpriority="high"
              className="w-5 h-5 sm:w-6 sm:h-6 object-contain shrink-0"
            />
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className={`text-base sm:text-lg font-bold tracking-tight ${
                isDark ? 'text-zinc-50' : 'text-zinc-900'
              }`}>
                Pathshala <span className="text-orange-500 font-bold">A<i>I</i></span>
              </span>
            </div>
          </div>
        </div>

        {/* Center: Desktop Navigation Links (For Unauthenticated Visitors) */}
        {!currentUser && (
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2" aria-label="Main Navigation">
            {NAV_LINKS.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => handleNavClick(link)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${navLinkClass}`}
              >
                <span>{link.label}</span>
              </button>
            ))}
          </nav>
        )}

        {/* Right Side: Auth buttons, Fullscreen, Theme Toggle & Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Unauthenticated Quick Actions */}
          {!currentUser ? (
            <>
              {/* Sign In Button */}
              {/* <button
                type="button"
                onClick={() => onOpenAuthModal?.('login')}
                className={`hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                  isDark
                    ? 'border-zinc-800 text-zinc-300 hover:text-orange-400 hover:border-orange-500/40 bg-zinc-900/60'
                    : 'border-zinc-200 text-zinc-700 hover:text-orange-600 hover:border-orange-300 bg-zinc-50 hover:bg-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button> */}

              {/* Get Started Button */}
              <button
                type="button"
                onClick={() => onOpenAuthModal?.('register')}
                className="btn-primary text-xs font-bold px-3.5 sm:px-4 py-1.5 inline-flex items-center gap-1.5 shadow-sm hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer !rounded-xl"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5 hidden sm:inline" />
              </button>

              {/* Theme Mode Toggle Button */}
              <ThemeToggle />

              {/* Mobile Menu Hamburger Button */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`lg:hidden w-8 h-8 flex items-center justify-center transition cursor-pointer bg-transparent ${
                  isDark ? 'text-zinc-300 hover:text-white' : 'text-zinc-700 hover:text-zinc-900'
                }`}
                aria-label="Toggle navigation menu"
              >
                {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </>
          ) : (
            <>
              {/* Full Screen (Fn+F11) Toggle - Only shown on Desktop/Laptop views after login */}
              <button
                type="button"
                onClick={handleToggleBrowserFullscreen}
                className={`hidden lg:flex w-8 h-8 rounded-full transition items-center justify-center cursor-pointer select-none bg-transparent ${
                  isDark
                    ? 'text-orange-500 hover:text-orange-400'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
                title={isBrowserFullscreen ? 'Exit Fullscreen (F11)' : 'Enter Fullscreen (F11)'}
                aria-label={isBrowserFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              >
                {isBrowserFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>

              {/* Theme Mode Toggle Button */}
              <ThemeToggle />

              {/* Quick Profile Access if logged in */}
              <button
                type="button"
                onClick={() => setIsProfileOpen(true)}
                className={`w-8 h-8 rounded-full transition flex items-center justify-center text-xs font-black uppercase shadow-inner cursor-pointer select-none ${
                  isDark
                    ? 'bg-zinc-900 border border-zinc-800 text-orange-500 hover:border-zinc-700'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
                title="User Profile"
                aria-label="Open User Profile"
              >
                {getUserDisplayName(currentUser)?.charAt(0) || currentUser.phoneNumber?.slice(-2) || 'U'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile Navigation Dropdown Menu (For Unauthenticated Visitors) */}
      {!currentUser && isMobileMenuOpen && (
        <div className={`lg:hidden mt-2.5 pt-3 pb-4 px-2 border-t space-y-2 animate-in fade-in slide-in-from-top-2 duration-150 ${
          isDark ? 'border-zinc-800/80 bg-zinc-950/95' : 'border-zinc-200/80 bg-white/95'
        }`}>
          <div className="grid grid-cols-2 gap-1.5">
            {NAV_LINKS.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => handleNavClick(link)}
                className={`p-2.5 rounded-xl text-xs font-semibold transition text-left cursor-pointer ${
                  isDark
                    ? 'bg-zinc-900/60 text-zinc-300 hover:bg-orange-500/10 hover:text-orange-400'
                    : 'bg-zinc-50 text-zinc-700 hover:bg-orange-50 hover:text-orange-600'
                }`}
              >
                <span className="truncate">{link.label}</span>
              </button>
            ))}
          </div>

          <div className="pt-2 flex items-center gap-2">
            {/* <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenAuthModal?.('login');
              }}
              className={`flex-1 py-2.5 text-xs font-semibold rounded-xl border text-center transition cursor-pointer ${
                isDark
                  ? 'border-zinc-800 text-zinc-300 hover:bg-zinc-900'
                  : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenAuthModal?.('register');
              }}
              className="flex-1 btn-primary py-2.5 text-xs font-bold text-center transition cursor-pointer !rounded-xl"
            >
              Get Started
            </button> */}
          </div>
        </div>
      )}
    </header>
  );
}

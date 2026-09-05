import { useState, useEffect, useRef, useCallback } from 'react';
import Header from './components/Header';
import Sidebar from './components/layout/Sidebar';
import SettingsModal from './components/layout/SettingsModal';
import ProfileModal from './components/layout/ProfileModal';
import CustomDialogModal from './components/layout/CustomDialogModal';
import AuthModal from './components/AuthModal';
import ApiDisconnectModal from './components/ApiDisconnectModal';
import RightAssistantSidebar from './components/chat/RightAssistantSidebar';
import HomeSection from './components/layout/HomeSection';

// Pages
import DashboardPage from './pages/DashboardPage';
import DiscoverPage from './pages/DiscoverPage';
import LibraryPage from './pages/LibraryPage';
import PlannerPage from './pages/PlannerPage';
import AssistantPage from './pages/AssistantPage';
import PolicyPage from './pages/PolicyPage';

// Context
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { fetchYoutubeMetadata } from './services/server/api';
import { checkServerHealth, subscribeToApiDisconnect } from './services/server/serverHealth';
import { logUserActivity } from './services/firebase/activityService';
import { parseLocation, buildUrl } from './utils/router';
import { updatePageSEO } from './utils/seo';
import { LEGAL_SECTIONS, LEGAL_NAV_ITEMS } from './constants';

function MainApp() {
  const { currentUser } = useAuth();
  const { isDark } = useTheme();
  const {
    activeSection,
    setActiveSection,
    libraryTab,
    setLibraryTab,
    plannerTab,
    setPlannerTab,
    videoTab,
    setVideoTab,
    searchQuery,
    setSearchQuery,
    searchCategory,
    setSearchCategory,
    searchType,
    setSearchType,
    activePlaylistId,
    setActivePlaylistId,
    activeVideoId,
    setActiveVideoId,
    setActiveVideoUrl,
    activeVideoMetadata,
    setActiveVideoMetadata,
    resetActiveVideo,
    isVideoFullscreen,
    isSidebarCollapsed
  } = useApp();

  // Navigation & Drawer States
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [assistantMode, setAssistantMode] = useState(() => localStorage.getItem('assistant_mode') || 'sidebar');

  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'signup'
  const [authNotice, setAuthNotice] = useState(null);

  // API Status & Disconnect Modal State
  const [apiStatus, setApiStatus] = useState('checking'); // 'healthy' | 'unhealthy' | 'checking'
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);

  // Handle browser back/forward (popstate) navigation
  useEffect(() => {
    const handlePopState = () => {
      const parsed = parseLocation(window.location.pathname, window.location.search);
      if (!currentUser) {
        if (LEGAL_SECTIONS.has(parsed.section)) {
          setActiveSection(parsed.section);
        } else {
          setActiveSection('dashboard');
        }
        return;
      }

      if (parsed.videoId) {
        setActiveSection('discover');
        setActiveVideoId(parsed.videoId);
        setActiveVideoUrl(`https://www.youtube.com/watch?v=${parsed.videoId}`);
        if (parsed.videoTab) {
          setVideoTab(parsed.videoTab);
        }
      } else {
        if (activeVideoId) {
          resetActiveVideo();
        }
        setActiveSection(parsed.section || 'dashboard');
        if (parsed.section === 'library' && parsed.libraryTab) {
          setLibraryTab(parsed.libraryTab);
        }
        if (parsed.section === 'planner' && parsed.plannerTab) {
          setPlannerTab(parsed.plannerTab);
        }
      }

      if (parsed.searchQuery !== undefined) {
        setSearchQuery(parsed.searchQuery);
      }
      if (parsed.searchCategory !== undefined) {
        setSearchCategory(parsed.searchCategory);
      }
      if (parsed.searchType !== undefined) {
        setSearchType(parsed.searchType);
      }
      setActivePlaylistId(parsed.playlistId || '');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [
    currentUser,
    activeVideoId,
    setActiveSection,
    setActiveVideoId,
    setActiveVideoUrl,
    setVideoTab,
    setLibraryTab,
    setPlannerTab,
    setSearchQuery,
    setSearchCategory,
    setSearchType,
    setActivePlaylistId,
    resetActiveVideo
  ]);

  // Auto-fetch metadata if activeVideoId is present but metadata is missing
  useEffect(() => {
    if (!activeVideoId) return;
    if (activeVideoMetadata && (activeVideoMetadata.video_id === activeVideoId || activeVideoMetadata.id === activeVideoId)) return;

    let isMounted = true;
    fetchYoutubeMetadata(`https://www.youtube.com/watch?v=${activeVideoId}`)
      .then((meta) => {
        if (isMounted && meta) {
          setActiveVideoMetadata(meta);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch video metadata on URL load:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [activeVideoId, activeVideoMetadata, setActiveVideoMetadata]);

  // Log user activity for streak calculation when they open the app
  useEffect(() => {
    if (currentUser) {
      logUserActivity(currentUser.uid);
    }
  }, [currentUser]);

  // Detect logout and redirect to home page
  const prevUserRef = useRef(currentUser);
  useEffect(() => {
    if (prevUserRef.current && !currentUser) {
      resetActiveVideo();
      setActiveSection('dashboard');
      window.history.replaceState(null, '', '/');
      updatePageSEO({ isLoggedIn: false });
    }
    prevUserRef.current = currentUser;
  }, [currentUser, resetActiveVideo, setActiveSection]);

  // Sync state back to URL and update SEO metadata
  useEffect(() => {
    if (!currentUser) {
      // Allow legal/policy pages to remain accessible and update URL for logged-out visitors
      if (LEGAL_SECTIONS.has(activeSection)) {
        const targetUrl = activeSection === 'legal' ? '/privacy' : `/${activeSection}`;
        if (window.location.pathname !== targetUrl) {
          window.history.pushState(null, '', targetUrl);
        }
        updatePageSEO({ isLoggedIn: false, section: activeSection === 'legal' ? 'privacy' : activeSection });
      } else {
        if (window.location.pathname !== '/' && window.location.pathname !== '') {
          window.history.pushState(null, '', '/');
        }
        updatePageSEO({ isLoggedIn: false });
      }
      return;
    }

    const targetUrl = buildUrl({
      section: activeSection,
      libraryTab,
      plannerTab,
      videoId: activeVideoId,
      videoTab,
      searchQuery: activeSection === 'discover' ? searchQuery : '',
      searchCategory: activeSection === 'discover' ? searchCategory : 'all',
      searchType: activeSection === 'discover' ? searchType : 'all',
      playlistId: activeSection === 'discover' ? activePlaylistId : '',
    });

    const currentUrl = window.location.pathname + window.location.search;
    if (currentUrl !== targetUrl) {
      window.history.pushState(null, '', targetUrl);
    }

    updatePageSEO({
      section: activeSection,
      libraryTab,
      plannerTab,
      videoId: activeVideoId,
      videoTab,
      searchQuery: activeSection === 'discover' ? searchQuery : '',
      videoMetadata: activeVideoMetadata,
      isLoggedIn: true,
    });
  }, [
    currentUser,
    activeSection,
    libraryTab,
    plannerTab,
    activeVideoId,
    videoTab,
    searchQuery,
    searchCategory,
    searchType,
    activePlaylistId,
    activeVideoMetadata,
  ]);

  const handleOpenAuthModal = (mode = 'login', notice = null) => {
    setAuthModalMode(mode);
    setAuthNotice(notice);
    setIsAuthModalOpen(true);
  };

  const handleToggleAssistantMode = (newMode) => {
    const targetMode = typeof newMode === 'string'
      ? newMode
      : (assistantMode === 'sidebar' ? 'floating' : 'sidebar');
    setAssistantMode(targetMode);
    localStorage.setItem('assistant_mode', targetMode);
  };

  // Check backend server health
  const checkHealth = useCallback(async (isManualRetry = false) => {
    setApiStatus('checking');
    const success = await checkServerHealth(isManualRetry);

    if (success) {
      setApiStatus('healthy');
    } else {
      setApiStatus('unhealthy');
      // Only show modal if this was a user request or manual reconnect
      if (isManualRetry) {
        setShowDisconnectModal(true);
      }
    }

    return success;
  }, []);

  // Silent server wake-up on mount and background polling (never opens modal)
  useEffect(() => {
    checkHealth(false);
    const interval = setInterval(() => checkHealth(false), 45000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  // Show modal if an API request fails while server is asleep/offline
  useEffect(() => {
    return subscribeToApiDisconnect(() => {
      setShowDisconnectModal(true);
      checkHealth(true);
    });
  }, [checkHealth]);

  const isWorkspaceActive = Boolean(currentUser);

  return (
    <div className={`${isWorkspaceActive ? 'h-screen overflow-hidden' : 'min-h-screen overflow-y-auto'} bg-black text-zinc-100 flex flex-col selection:bg-zinc-800 relative transition-colors duration-200`}>
      {/* Top Header Navbar (Hidden in Fullscreen Video Mode) */}
      {!isVideoFullscreen && (
        <Header
          isSidebarMobileOpen={isSidebarMobileOpen}
          setIsSidebarMobileOpen={setIsSidebarMobileOpen}
        />
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        notice={authNotice}
      />

      {/* API Disconnect Modal */}
      <ApiDisconnectModal
        isOpen={showDisconnectModal}
        onClose={() => setShowDisconnectModal(false)}
        onConnect={() => checkHealth(true)}
        apiStatus={apiStatus}
      />

      {/* Settings Modal */}
      <SettingsModal
        apiStatus={apiStatus}
        onOpenApiModal={() => {
          setShowDisconnectModal(true);
          checkHealth(true);
        }}
      />

      {/* Profile Modal */}
      <ProfileModal />

      {/* Custom Dialog Modal (Confirm/Alert) */}
      <CustomDialogModal />

      {/* Main Content Area */}
      {!currentUser ? (
        <>
          {/* Global Background Grid and moving ambient glow bubbles for landing page */}
          <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            <div className="premium-grid-bg h-full w-full"></div>
            <div className="hero-glow-orb-1"></div>
            <div className="hero-glow-orb-2"></div>
            <div className="hero-glow-orb-3"></div>
            <div className="hero-glow-orb-4"></div>
          </div>

          <div className="flex-1 w-full flex flex-col px-4 sm:px-8 pb-12 pt-20 sm:pt-24 max-w-7xl mx-auto transition-all duration-300 relative z-10">
            <main className={`flex-1 min-w-0 w-full ${LEGAL_SECTIONS.has(activeSection) ? 'flex flex-col' : 'flex items-center justify-center'
              }`}>
              {LEGAL_SECTIONS.has(activeSection)
                ? <PolicyPage slug={activeSection} />
                : <HomeSection onOpenAuthModal={handleOpenAuthModal} />
              }
            </main>
          </div>

          <footer className={`relative z-10 border-t transition-colors backdrop-blur-sm ${isDark ? 'border-zinc-900 bg-black/80' : 'border-orange-200/80 bg-white/75'
            }`}>
            <div className="max-w-6xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Brand */}
              <button
                type="button"
                onClick={() => {
                  resetActiveVideo();
                  setActiveSection('dashboard');
                }}
                className={`text-xs font-medium shrink-0 cursor-pointer hover:underline text-left ${isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-orange-900/60 hover:text-orange-950'
                  }`}
                title="Go to Home"
              >
                &copy; {new Date().getFullYear()} Pathshala A<i>I</i> &mdash; All Rights Reserved
              </button>
              {/* Legal Links */}
              <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
                {LEGAL_NAV_ITEMS.map(({ slug, shortLabel, label }) => (
                  <button
                    key={slug}
                    type="button"
                    onClick={() => setActiveSection(slug)}
                    className={`text-[11px] transition hover:underline underline-offset-2 cursor-pointer ${isDark ? 'text-zinc-500 hover:text-orange-400' : 'text-orange-900/60 hover:text-orange-600'
                      }`}
                  >
                    {shortLabel || label}
                  </button>
                ))}
              </nav>
            </div>
          </footer>
        </>
      ) : (
        /* Workspace (Authenticated) Layout */
        <div className={`flex-1 w-full flex relative overflow-hidden transition-all duration-300 ${isVideoFullscreen ? 'h-screen mt-0' : 'h-[calc(100vh-53px)] mt-[53px]'
          }`}>
          {/* Left Navigation Sidebar (Hidden in Fullscreen Video Mode) */}
          {!isVideoFullscreen && (
            <Sidebar
              isSidebarMobileOpen={isSidebarMobileOpen}
              setIsSidebarMobileOpen={setIsSidebarMobileOpen}
            />
          )}

          {/* Right Scrollable Page Pane */}
          <div className={`flex-1 min-w-0 ${isVideoFullscreen ? 'pl-0' : isSidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'} flex flex-col h-full overflow-hidden transition-all duration-300`}>
            <div className="flex-1 w-full relative z-10 overflow-hidden flex flex-col h-full min-h-0 bg-zinc-950/10">
              {activeSection === 'dashboard' && <DashboardPage />}
              {activeSection === 'discover' && <DiscoverPage />}
              {activeSection === 'library' && <LibraryPage />}
              {activeSection === 'planner' && <PlannerPage />}
              {activeSection === 'assistant' && <AssistantPage />}
              {LEGAL_SECTIONS.has(activeSection) && <PolicyPage slug={activeSection} />}
            </div>
          </div>

          {/* Right Floating Guruji Assistant Drawer (Hidden in Fullscreen Video Mode) */}
          {!isVideoFullscreen && activeSection !== 'assistant' && (
            <RightAssistantSidebar
              currentUser={currentUser}
              isOpen={isAssistantOpen}
              onClose={() => setIsAssistantOpen(false)}
              mode={assistantMode}
              onToggleMode={handleToggleAssistantMode}
              onZoom={() => {
                setActiveSection('assistant');
                setIsAssistantOpen(false);
              }}
            />
          )}

          {/* Floating launcher widget button (Hidden in Fullscreen Video Mode) */}
          {!isVideoFullscreen && !isAssistantOpen && activeSection !== 'assistant' && (
            <button
              onClick={() => setIsAssistantOpen(true)}
              className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 md:bottom-8 md:right-8 w-12 h-12 sm:w-13 sm:h-13 rounded-full flex items-center justify-center shadow-2xl z-[100] cursor-pointer bg-black hover:scale-105 active:scale-95 transition-all hover:shadow-orange-500/20 hover:shadow-2xl overflow-hidden border border-zinc-800"
              title="Ask Guruji"
              aria-label="Guruji"
            >
              <img
                src="/nova.png"
                alt="Guruji"
                className="w-full h-full object-cover select-none pointer-events-none"
              />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <MainApp />
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}


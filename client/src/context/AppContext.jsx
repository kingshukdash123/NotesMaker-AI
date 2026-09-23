import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getUserNotes } from '../services/firebase/notesService';
import { subscribeUserMonthlyUsage } from '../services/firebase/usageService';
import { UsageModel } from '../models/usageModel';
import { parseLocation } from '../utils/router';

const AppContext = createContext(null);

export function useApp() {
  return useContext(AppContext);
}

export function AppProvider({ children }) {
  const { currentUser, userProfile } = useAuth();
  
  // Initialize state directly from the current URL
  const [initialRoute] = useState(() => parseLocation(window.location.pathname, window.location.search));
  const [activeSection, setActiveSectionState] = useState(initialRoute.section || 'dashboard');
  const [previousSection, setPreviousSection] = useState(null);

  const setActiveSection = (nextSectionOrFn) => {
    setActiveSectionState((prev) => {
      const next = typeof nextSectionOrFn === 'function' ? nextSectionOrFn(prev) : nextSectionOrFn;
      if (prev && prev !== next) {
        setPreviousSection(prev);
      }
      return next;
    });
  };
  const [libraryTab, setLibraryTab] = useState(initialRoute.libraryTab || 'history');
  const [plannerTab, setPlannerTab] = useState(initialRoute.plannerTab || 'daily');
  const [videoTab, setVideoTab] = useState(initialRoute.videoTab || 'notes');
  const [searchQuery, setSearchQuery] = useState(initialRoute.searchQuery || '');
  const [searchCategory, setSearchCategory] = useState(initialRoute.searchCategory || 'all');
  const [searchType, setSearchType] = useState(initialRoute.searchType || 'all');
  const [activePlaylistId, setActivePlaylistId] = useState(initialRoute.playlistId || '');
  const [processedVideoIds, setProcessedVideoIds] = useState(new Set());

  // User Monthly Usage State
  const [monthlyUsage, setMonthlyUsage] = useState(() => new UsageModel());
  const [isUsageLoading, setIsUsageLoading] = useState(true);
  
  // Upgrade Modal State
  const [upgradeModalState, setUpgradeModalState] = useState({
    isOpen: false,
    reason: null,
  });

  const openUpgradeModal = (reason = null) => {
    setUpgradeModalState({
      isOpen: true,
      reason,
    });
  };

  const closeUpgradeModal = () => {
    setUpgradeModalState({ isOpen: false, reason: null });
  };
  
  // States for the active video content page (watch/study)
  const [activeVideoId, setActiveVideoId] = useState(initialRoute.videoId || '');
  const [activeVideoUrl, setActiveVideoUrl] = useState(
    initialRoute.videoId ? `https://www.youtube.com/watch?v=${initialRoute.videoId}` : ''
  );
  const [activeVideoMetadata, setActiveVideoMetadata] = useState(null);
  const [activeVideoNoteResult, setActiveVideoNoteResult] = useState(null);
  const [activeVideoNoteId, setActiveVideoNoteId] = useState(null);
  const [videoProcessStatus, setVideoProcessStatus] = useState('IDLE'); // IDLE | PROCESSING | COMPLETED | FAILED
  const [videoProcessError, setVideoProcessError] = useState(null);
  const [videoPipelineTaskId, setVideoPipelineTaskId] = useState(null);
  const [isVideoFullscreen, setIsVideoFullscreen] = useState(false);
  const [isVideoCollapsed, setIsVideoCollapsed] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsedState] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  // Modal open states (Settings, Profile, Assistant, Mobile/Tablet Sidebar)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpenState] = useState(false);
  const [assistantMode, setAssistantModeState] = useState(() => {
    return localStorage.getItem('assistant_mode') || 'sidebar';
  });

  const setAssistantMode = (newModeOrFn) => {
    setAssistantModeState((prev) => {
      const next = typeof newModeOrFn === 'function' ? newModeOrFn(prev) : newModeOrFn;
      localStorage.setItem('assistant_mode', next);
      // If switching to docked 'sidebar' mode, collapse the left navigation sidebar so both full sidebars don't crowd the screen
      if (next === 'sidebar') {
        setIsSidebarCollapsedState(true);
        localStorage.setItem('sidebar_collapsed', 'true');
      }
      return next;
    });
  };

  const [isSidebarMobileOpen, setIsSidebarMobileOpenState] = useState(false);

  const setIsSidebarMobileOpen = (valueOrFn) => {
    setIsSidebarMobileOpenState((prev) => {
      const next = typeof valueOrFn === 'function' ? valueOrFn(prev) : valueOrFn;
      // If mobile/tablet left drawer is opened, close the chat assistant
      if (next) {
        setIsAssistantOpenState(false);
      }
      return next;
    });
  };

  const setIsSidebarCollapsed = (value) => {
    setIsSidebarCollapsedState(value);
    localStorage.setItem('sidebar_collapsed', String(value));
    // If left sidebar is expanded (!value) and assistant is in docked 'sidebar' mode, close the chat assistant
    // If assistant is in 'floating' mode, both can co-exist simultaneously
    if (!value && assistantMode === 'sidebar') {
      setIsAssistantOpenState(false);
      setIsSidebarMobileOpenState(false);
    } else if (!value) {
      setIsSidebarMobileOpenState(false);
    }
  };

  const setIsAssistantOpen = (valueOrFn) => {
    setIsAssistantOpenState((prev) => {
      const next = typeof valueOrFn === 'function' ? valueOrFn(prev) : valueOrFn;
      // Only collapse desktop sidebar if opening docked 'sidebar' mode; in 'floating' mode, keep sidebar state
      if (next) {
        if (assistantMode === 'sidebar') {
          setIsSidebarCollapsedState(true);
          localStorage.setItem('sidebar_collapsed', 'true');
        }
        setIsSidebarMobileOpenState(false);
      }
      return next;
    });
  };

  // Custom Dialog Modal states (Confirm / Alert)
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'confirm', // 'confirm' | 'alert'
    resolveRef: null
  });

  const showConfirm = (message, title = 'Are you sure?') => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        title,
        message,
        type: 'confirm',
        resolveRef: resolve
      });
    });
  };

  const showAlert = (message, title = 'Notification') => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        title,
        message,
        type: 'alert',
        resolveRef: resolve
      });
    });
  };

  const handleDialogResponse = (approved) => {
    if (dialogState.resolveRef) {
      dialogState.resolveRef(approved);
    }
    setDialogState(prev => ({ ...prev, isOpen: false, resolveRef: null }));
  };

  useEffect(() => {
    if (!currentUser) {
      setProcessedVideoIds(new Set());
      setMonthlyUsage(new UsageModel());
      setIsUsageLoading(false);
      return;
    }

    setIsUsageLoading(true);

    const fetchNotesArchive = async () => {
      try {
        const notes = await getUserNotes(currentUser.uid);
        const ids = new Set(notes.map(n => n.metadata?.video_id).filter(Boolean));
        setProcessedVideoIds(ids);
      } catch (err) {
        console.error("Failed to load processed video IDs:", err);
      }
    };
    fetchNotesArchive();

    // Subscribe to real-time 30-day billing cycle usage
    const cyclePeriod = UsageModel.getCurrentPeriod(userProfile);
    const unsubscribeUsage = subscribeUserMonthlyUsage(
      currentUser.uid,
      (usage) => {
        setMonthlyUsage(usage);
        setIsUsageLoading(false);
      },
      cyclePeriod
    );

    return () => {
      unsubscribeUsage();
    };
  }, [
    currentUser,
    userProfile?.subscription?.startedAt,
    userProfile?.subscription?.validUntil,
    userProfile?.subscription?.planId,
    userProfile?.createdAt
  ]);

  // Helper to load a video into the unified watch/study page
  const loadVideo = (videoId, videoUrl, metadata = null, noteId = null, noteResult = null, tab = 'notes') => {
    setActiveVideoId(videoId);
    setActiveVideoUrl(videoUrl || (videoId ? `https://www.youtube.com/watch?v=${videoId}` : ''));
    setActiveVideoMetadata(metadata);
    setActiveVideoNoteId(noteId);
    setActiveVideoNoteResult(noteResult);
    if (tab && ['notes', 'summary', 'qa'].includes(tab)) {
      setVideoTab(tab);
    }
    if (noteResult) {
      setVideoProcessStatus('COMPLETED');
    } else {
      setVideoProcessStatus('IDLE');
    }
    setVideoProcessError(null);
    setVideoPipelineTaskId(null);
    setIsVideoCollapsed(false);
    setActiveSection('discover'); // Unified watch workspace
  };

  // Helper to reset the active video states (back to input search or empty watch page)
  const resetActiveVideo = () => {
    setActiveVideoId('');
    setActiveVideoUrl('');
    setActiveVideoMetadata(null);
    setActiveVideoNoteResult(null);
    setActiveVideoNoteId(null);
    setVideoTab('notes');
    setVideoProcessStatus('IDLE');
    setVideoProcessError(null);
    setVideoPipelineTaskId(null);
    setIsVideoFullscreen(false);
    setIsVideoCollapsed(false);
  };

  // Whenever a timestamp is clicked, make sure the video is open/unhidden
  useEffect(() => {
    const handleSeekGlobal = () => {
      setIsVideoCollapsed(false);
      if (activeVideoId && activeSection !== 'discover') {
        setActiveSection('discover');
      }
    };
    window.addEventListener('seek-video', handleSeekGlobal);
    return () => window.removeEventListener('seek-video', handleSeekGlobal);
  }, [activeVideoId, activeSection]);

  const value = {
    activeSection,
    previousSection,
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
    activeVideoUrl,
    setActiveVideoUrl,
    activeVideoMetadata,
    setActiveVideoMetadata,
    activeVideoNoteResult,
    setActiveVideoNoteResult,
    activeVideoNoteId,
    setActiveVideoNoteId,
    videoProcessStatus,
    setVideoProcessStatus,
    videoProcessError,
    setVideoProcessError,
    videoPipelineTaskId,
    setVideoPipelineTaskId,
    isVideoFullscreen,
    setIsVideoFullscreen,
    isVideoCollapsed,
    setIsVideoCollapsed,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    isSettingsOpen,
    setIsSettingsOpen,
    isProfileOpen,
    setIsProfileOpen,
    isAssistantOpen,
    setIsAssistantOpen,
    assistantMode,
    setAssistantMode,
    isSidebarMobileOpen,
    setIsSidebarMobileOpen,
    dialogState,
    showConfirm,
    showAlert,
    handleDialogResponse,
    processedVideoIds,
    setProcessedVideoIds,
    loadVideo,
    resetActiveVideo,
    monthlyUsage,
    isUsageLoading,
    upgradeModalState,
    openUpgradeModal,
    closeUpgradeModal,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

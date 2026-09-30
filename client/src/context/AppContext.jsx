import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { subscribeUserNotes, extractYoutubeVideoId } from '../services/firebase/notesService';
import { subscribeUserMonthlyUsage } from '../services/firebase/usageService';
import { 
  getUserPlaylists, 
  getUserSavedVideos, 
  saveVideoToLibrary, 
  removeVideoFromLibrary, 
  addVideoToPlaylist, 
  removeVideoFromPlaylist, 
  createPlaylist, 
  createPlaylistWithVideos 
} from '../services/firebase/libraryService';
import { fetchYouTubePlaylistItems } from '../services/server/api';
import { PlaylistModel, SavedVideoModel } from '../models';
import { formatVideoDuration } from '../utils/formatters';
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
  const [activePlaylistSummary, setActivePlaylistSummary] = useState(null);
  const [playlistReturnChannel, setPlaylistReturnChannel] = useState(null);
  const [processedVideoIds, setProcessedVideoIds] = useState(new Set());

  // User Library State (Saved videos & Playlists accessible application-wide)
  const [savedVideos, setSavedVideos] = useState([]);
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [isLibraryLoading, setIsLibraryLoading] = useState(false);

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

  // Auth Modal State
  const [authModalState, setAuthModalState] = useState({
    isOpen: false,
    mode: 'login', // 'login' | 'signup'
    notice: null
  });

  const openAuthModal = (mode = 'login', notice = null) => {
    setAuthModalState({
      isOpen: true,
      mode: mode || 'login',
      notice: notice || null
    });
  };

  const closeAuthModal = () => {
    setAuthModalState(prev => ({ ...prev, isOpen: false, notice: null }));
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

  // Channel Explorer Drawer State
  const [channelDrawerState, setChannelDrawerState] = useState(() => ({
    isOpen: Boolean(initialRoute.channelId || initialRoute.channelTitle),
    channelId: initialRoute.channelId || null,
    channelTitle: initialRoute.channelTitle || '',
  }));

  const openChannelExplorer = (channelId, channelTitle = '') => {
    if (!channelId && !channelTitle) return;
    setChannelDrawerState({
      isOpen: true,
      channelId: channelId || null,
      channelTitle: channelTitle || '',
    });
  };

  const closeChannelExplorer = () => {
    setChannelDrawerState({
      isOpen: false,
      channelId: null,
      channelTitle: '',
    });
  };
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

    // Subscribe to real-time generated notes archive
    const unsubscribeNotes = subscribeUserNotes(currentUser.uid, (notes) => {
      const ids = new Set(
        notes
          .map((n) => n.videoId || n.video_id || n.metadata?.videoId || n.metadata?.video_id || (n.videoUrl ? extractYoutubeVideoId(n.videoUrl) : ''))
          .filter(Boolean)
      );
      setProcessedVideoIds(ids);
    });

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

    // Fetch library info (saved videos & user playlists)
    setIsLibraryLoading(true);
    Promise.all([
      getUserSavedVideos(currentUser.uid),
      getUserPlaylists(currentUser.uid)
    ])
      .then(([videosData, playlistsData]) => {
        setSavedVideos(videosData || []);
        setUserPlaylists(playlistsData || []);
      })
      .catch((err) => {
        console.error('Failed to fetch initial library data in AppContext:', err);
      })
      .finally(() => {
        setIsLibraryLoading(false);
      });

    return () => {
      unsubscribeNotes();
      unsubscribeUsage();
    };
  }, [
    currentUser,
    userProfile?.subscription?.startedAt,
    userProfile?.subscription?.validUntil,
    userProfile?.subscription?.planId,
    userProfile?.createdAt
  ]);

  // Global Library CRUD Handlers
  const handleToggleSaveVideo = useCallback(async (video) => {
    if (!currentUser) {
      openAuthModal('login', 'Sign in to save videos to your library.');
      return;
    }
    const targetVideoId = video?.videoId || video?.id;
    if (!targetVideoId) return;

    const isCurrentlySaved = savedVideos.some((v) => (v.videoId || v.id) === targetVideoId);
    try {
      if (isCurrentlySaved) {
        await removeVideoFromLibrary(currentUser.uid, targetVideoId);
        setSavedVideos((prev) => prev.filter((v) => (v.videoId || v.id) !== targetVideoId));
      } else {
        const rawMeta = video.metadata || video;
        const metadataToSave = {
          title: rawMeta.title || video.title || 'YouTube Video',
          channel: rawMeta.channel || video.channel || 'YouTube Creator',
          thumbnail: rawMeta.thumbnail || video.thumbnail || `https://img.youtube.com/vi/${targetVideoId}/hqdefault.jpg`,
          duration: Number(rawMeta.duration || video.duration || 0) || 0,
          duration_formatted: rawMeta.duration_formatted || rawMeta.durationFormatted || video.durationFormatted || '',
          publishedAt: rawMeta.publishedAt || video.publishedAt || '',
          description: rawMeta.description || video.description || '',
          view_count: rawMeta.view_count || rawMeta.viewCount || video.viewCount || '',
          is_live: Boolean(rawMeta.is_live || rawMeta.isLive || video.isLive),
        };
        const videoUrlToSave = video.videoUrl || `https://www.youtube.com/watch?v=${targetVideoId}`;

        await saveVideoToLibrary(
          currentUser.uid,
          targetVideoId,
          videoUrlToSave,
          metadataToSave
        );

        const newSavedModel = new SavedVideoModel({
          id: `${currentUser.uid}_${targetVideoId}`,
          userId: currentUser.uid,
          videoId: targetVideoId,
          videoUrl: videoUrlToSave,
          metadata: metadataToSave,
          savedAt: new Date(),
        });

        setSavedVideos((prev) => [
          newSavedModel,
          ...prev.filter((v) => (v.videoId || v.id) !== targetVideoId),
        ]);
      }
    } catch (err) {
      console.error('Failed to toggle save video in AppContext:', err);
    }
  }, [currentUser, savedVideos, openAuthModal]);

  const handleTogglePlaylistAssociation = useCallback(async (videoId, playlistId, alreadyAssociated, video) => {
    if (!currentUser) {
      openAuthModal('login', 'Sign in to add videos to your playlists.');
      return;
    }

    try {
      const rawMeta = video?.metadata || video || {};
      const durationSec = Number(rawMeta.duration || video?.duration || rawMeta.duration_seconds || video?.duration_seconds || 0) || 0;
      let durationFmt = String(rawMeta.duration_formatted || rawMeta.durationFormatted || video?.durationFormatted || video?.duration_formatted || '').trim();
      if (!durationFmt && durationSec > 0) {
        durationFmt = formatVideoDuration(durationSec);
      }

      const videoEntry = {
        videoId,
        videoUrl: video?.videoUrl || `https://www.youtube.com/watch?v=${videoId}`,
        duration: durationSec,
        durationFormatted: durationFmt,
        metadata: {
          title: rawMeta.title || video?.title || 'YouTube Video',
          channel: rawMeta.channel || video?.channel || 'Unknown Creator',
          thumbnail: rawMeta.thumbnail || video?.thumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          duration: durationSec,
          duration_formatted: durationFmt,
          durationFormatted: durationFmt,
          publishedAt: rawMeta.publishedAt || video?.publishedAt || '',
          description: rawMeta.description || video?.description || '',
          view_count: rawMeta.view_count || rawMeta.viewCount || video?.viewCount || '',
          is_live: Boolean(rawMeta.is_live || rawMeta.isLive || video?.isLive),
        },
        addedAt: new Date().toISOString(),
      };

      if (alreadyAssociated) {
        await removeVideoFromPlaylist(currentUser.uid, videoId, playlistId);
        setUserPlaylists((prev) =>
          prev.map((pl) => {
            if (pl.id === playlistId) {
              const updatedVideos = (pl.videos || []).filter((v) => (v.videoId || v.id) !== videoId);
              return { ...pl, videos: updatedVideos, videoCount: updatedVideos.length };
            }
            return pl;
          })
        );
      } else {
        await addVideoToPlaylist(currentUser.uid, videoId, playlistId, videoEntry);
        setUserPlaylists((prev) =>
          prev.map((pl) => {
            if (pl.id === playlistId) {
              const existing = pl.videos || [];
              const updatedVideos = existing.some((v) => (v.videoId || v.id) === videoId) ? existing : [...existing, videoEntry];
              return { ...pl, videos: updatedVideos, videoCount: updatedVideos.length };
            }
            return pl;
          })
        );
      }
    } catch (err) {
      console.error('Error toggling playlist association in AppContext:', err);
    }
  }, [currentUser, openAuthModal]);

  const handleCreatePlaylist = useCallback(async (name) => {
    if (!currentUser) {
      openAuthModal('login', 'Sign in to create playlists.');
      return;
    }

    try {
      const id = await createPlaylist(currentUser.uid, name);
      setUserPlaylists((prev) => [
        { id, name, videoCount: 0, userId: currentUser.uid, createdAt: new Date() },
        ...prev,
      ]);
      return id;
    } catch (err) {
      console.error('Error creating playlist in AppContext:', err);
    }
  }, [currentUser, openAuthModal]);

  const handleSavePlaylistToLibrary = useCallback(async (playlistData, currentVideos = []) => {
    if (!currentUser) {
      openAuthModal('login', 'Sign in to save playlists to your library.');
      return;
    }
    if (!playlistData) return;

    const targetPlaylistId = playlistData.playlistId || playlistData.id || activePlaylistId;
    if (!targetPlaylistId) return;

    let orderedVideos = Array.isArray(currentVideos) && currentVideos.length > 0 ? [...currentVideos] : [];

    try {
      const fullPlaylist = await fetchYouTubePlaylistItems(targetPlaylistId, '', true);
      if (fullPlaylist?.videos && fullPlaylist.videos.length > 0) {
        orderedVideos = fullPlaylist.videos;
      }
    } catch (err) {
      console.warn('Could not fetch complete playlist via fetchAll, using currently loaded sequence:', err);
    }

    if (orderedVideos.length === 0) {
      throw new Error('No videos found to save.');
    }

    const playlistTitle = playlistData.title || activePlaylistSummary?.title || 'Course Playlist';
    const created = await createPlaylistWithVideos(currentUser.uid, playlistTitle, orderedVideos, targetPlaylistId);

    const newModel = new PlaylistModel({
      id: created.id,
      name: created.name,
      videos: created.videos,
      sourcePlaylistId: targetPlaylistId,
      userId: currentUser.uid,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    setUserPlaylists((prev) => [
      newModel,
      ...prev.filter((pl) => pl.id !== created.id && pl.sourcePlaylistId !== targetPlaylistId),
    ]);
  }, [currentUser, activePlaylistId, activePlaylistSummary, openAuthModal]);

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
    activePlaylistSummary,
    setActivePlaylistSummary,
    playlistReturnChannel,
    setPlaylistReturnChannel,
    savedVideos,
    setSavedVideos,
    userPlaylists,
    setUserPlaylists,
    isLibraryLoading,
    handleToggleSaveVideo,
    handleTogglePlaylistAssociation,
    handleCreatePlaylist,
    handleSavePlaylistToLibrary,
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
    authModalState,
    openAuthModal,
    closeAuthModal,
    channelDrawerState,
    openChannelExplorer,
    closeChannelExplorer,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

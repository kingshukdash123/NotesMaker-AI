import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getUserNotes } from '../services/firebase/notesService';
import { parseLocation } from '../utils/router';

const AppContext = createContext(null);

export function useApp() {
  return useContext(AppContext);
}

export function AppProvider({ children }) {
  const { currentUser } = useAuth();
  
  // Initialize state directly from the current URL
  const [initialRoute] = useState(() => parseLocation(window.location.pathname, window.location.search));
  const [activeSection, setActiveSection] = useState(initialRoute.section || 'dashboard');
  const [libraryTab, setLibraryTab] = useState(initialRoute.libraryTab || 'history');
  const [plannerTab, setPlannerTab] = useState(initialRoute.plannerTab || 'daily');
  const [videoTab, setVideoTab] = useState(initialRoute.videoTab || 'notes');
  const [searchQuery, setSearchQuery] = useState(initialRoute.searchQuery || '');
  const [searchCategory, setSearchCategory] = useState(initialRoute.searchCategory || 'all');
  const [searchType, setSearchType] = useState(initialRoute.searchType || 'all');
  const [activePlaylistId, setActivePlaylistId] = useState(initialRoute.playlistId || '');
  const [processedVideoIds, setProcessedVideoIds] = useState(new Set());
  
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

  const setIsSidebarCollapsed = (value) => {
    setIsSidebarCollapsedState(value);
    localStorage.setItem('sidebar_collapsed', String(value));
  };

  // Modal open states (Settings, Profile)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

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
      return;
    }
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
  }, [currentUser]);

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
    dialogState,
    showConfirm,
    showAlert,
    handleDialogResponse,
    processedVideoIds,
    setProcessedVideoIds,
    loadVideo,
    resetActiveVideo
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import UrlInput from './components/UrlInput';
import VideoCard from './components/VideoCard';
import PipelineTracker from './components/PipelineTracker';
import LogTerminal from './components/LogTerminal';
import NotesViewer from './components/NotesViewer';
import AuthModal from './components/AuthModal';
import ApiDisconnectModal from './components/ApiDisconnectModal';
import Tabs from './components/Tabs';
import AuthWall from './components/AuthWall';
import VideoQa from './components/VideoQa';
import SummaryOverview from './components/SummaryOverview';
import LoadingModal from './components/LoadingModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import { fetchYoutubeMetadata, startNoteGeneration, getTaskStatus, streamTaskLogs, API_BASE_URL } from './services/server/api';
import { saveNotes, getUserNotes, deleteNotes, saveUserApiKeys, getUserApiKeys, getNoteByVideoId, extractYoutubeVideoId } from './services/firebase/notesService';
import { Sparkles, Video, Terminal, Layers, AlertCircle, RefreshCw, Lock, ArrowRight, ArrowLeft, BookOpen, MessageSquare, BarChart2, History, Settings, Plus, Search, Trash2, Copy, Check, Key, Cpu, Clock, ExternalLink, Save, Eye, EyeOff, CheckCircle2, User, LogOut, Loader2, Menu, ChevronDown, MoreVertical } from 'lucide-react';

const mapErrorMessage = (errorMsg) => {
  if (!errorMsg) return 'Notes generation failed.';
  const msg = errorMsg.toLowerCase();

  // 1. API Rate Limit Reached
  if (
    msg.includes('rate limit') ||
    msg.includes('too many requests') ||
    msg.includes('429') ||
    msg.includes('resource_exhausted') ||
    msg.includes('quota')
  ) {
    return 'API Rate Limit reached. Please check your Google Gemini API key quota limits.';
  }

  // 2. Failed to Fetch Metadata
  if (
    msg.includes('metadata') ||
    msg.includes('yt-dlp') ||
    msg.includes('youtube') ||
    msg.includes('transcript') ||
    msg.includes('video details')
  ) {
    return 'Failed to fetch video details or transcript. Please verify the YouTube URL and try again.';
  }

  // 3. Invalid API Key
  if (
    msg.includes('invalid_api_key') ||
    msg.includes('invalid api key') ||
    msg.includes('api key invalid') ||
    msg.includes('unauthorized') ||
    msg.includes('401')
  ) {
    return 'Invalid API Key. Please verify your API Key settings.';
  }

  // 4. Technical / Internal Causes
  if (
    msg.includes('tool call failed') ||
    msg.includes('keyerror') ||
    msg.includes('valueerror') ||
    msg.includes('nameerror') ||
    msg.includes('internal server error') ||
    msg.includes('500') ||
    msg.includes('exception') ||
    msg.includes('failed to merge') ||
    msg.includes('reducer_node_error') ||
    msg.includes('fanout_node_error') ||
    msg.includes('runtimeerror') ||
    msg.includes('tool_call_failed')
  ) {
    return 'An internal error occurred. Please try again later.';
  }

  // Fallback to the original error if it's friendly, otherwise generic
  return errorMsg;
};

function HomeSection({ setGlobalTab, setWorkspaceTab, isAuthenticated, onOpenAuthModal, onLoadMockData }) {
  return (
    <div className="max-w-5xl mx-auto relative overflow-hidden py-6">
      {/* Ambient Background Radial Glow behind Hero Title */}
      <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-orange-500/5 rounded-full blur-[120px] pointer-events-none z-0"></div>

      <div className="space-y-16 relative z-10">
        {/* Hero Block */}
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <h2 className="text-4xl sm:text-6xl font-black tracking-tight text-zinc-50 leading-tight">
            Transcribe, Outline &{' '}
            <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent">
              Synthesize Lectures
            </span>
          </h2>
          <p className="text-base sm:text-lg text-zinc-400 leading-relaxed max-w-2xl mx-auto">
            An autonomous multi-agent pipeline designed to extract transcripts, conduct online academic research, and compile publication-grade study notes from any YouTube lecture.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            {isAuthenticated ? (
              <button
                onClick={() => { setGlobalTab('workspace'); setWorkspaceTab('notes'); }}
                className="px-6 py-3 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-sm shadow-xl transition duration-150 hover:scale-[1.02] flex items-center gap-2 cursor-pointer"
              >
                <span>Go To Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => onOpenAuthModal('signup')}
                  className="px-6 py-3 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-sm shadow-xl transition duration-150 hover:scale-[1.02] flex items-center gap-2 cursor-pointer"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* How it Works timeline */}
        <div className="space-y-8 pt-4 relative">
          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold text-zinc-200">The Multi-Agent Synthesis Pipeline</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">Here is how our autonomous engine processes your videos step-by-step.</p>
          </div>

          <div className="relative mt-8">
            {/* Connecting horizontal line (Desktop only) */}
            <div className="hidden md:block absolute top-5 left-[12.5%] right-[12.5%] h-[1px] bg-gradient-to-r from-zinc-850 via-zinc-700 to-zinc-850 z-0" />

            {/* Connecting vertical line (Mobile only) */}
            <div className="absolute left-[20px] top-5 bottom-5 w-[1px] bg-gradient-to-b from-zinc-850 via-zinc-700 to-zinc-850 md:hidden z-0" />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-6 relative z-10">
              <div className="relative pl-12 md:pl-0 md:text-center space-y-2 md:space-y-3 group">
                <div className="absolute left-0 md:relative md:mx-auto w-10 h-10 rounded-full bg-zinc-950 border border-zinc-800 text-xs font-mono font-bold flex items-center justify-center text-zinc-400 group-hover:border-zinc-500 group-hover:text-white transition duration-300 z-10">1</div>
                <div className="space-y-1 md:space-y-2">
                  <h5 className="text-xs font-bold text-zinc-200">Video Extraction</h5>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">Fetches the YouTube audio, metadata, and automatic or manual sub-transcripts.</p>
                </div>
              </div>
              <div className="relative pl-12 md:pl-0 md:text-center space-y-2 md:space-y-3 group">
                <div className="absolute left-0 md:relative md:mx-auto w-10 h-10 rounded-full bg-zinc-950 border border-zinc-800 text-xs font-mono font-bold flex items-center justify-center text-zinc-400 group-hover:border-zinc-500 group-hover:text-white transition duration-300 z-10">2</div>
                <div className="space-y-1 md:space-y-2">
                  <h5 className="text-xs font-bold text-zinc-200">Outline Planning</h5>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">Orchestrates a comprehensive course syllabus mapping every key concept and term.</p>
                </div>
              </div>
              <div className="relative pl-12 md:pl-0 md:text-center space-y-2 md:space-y-3 group">
                <div className="absolute left-0 md:relative md:mx-auto w-10 h-10 rounded-full bg-zinc-950 border border-zinc-800 text-xs font-mono font-bold flex items-center justify-center text-zinc-400 group-hover:border-zinc-500 group-hover:text-white transition duration-300 z-10">3</div>
                <div className="space-y-1 md:space-y-2">
                  <h5 className="text-xs font-bold text-zinc-200">Academic Research</h5>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">Runs background research agents to fetch equations, research papers, and code.</p>
                </div>
              </div>
              <div className="relative pl-12 md:pl-0 md:text-center space-y-2 md:space-y-3 group">
                <div className="absolute left-0 md:relative md:mx-auto w-10 h-10 rounded-full bg-zinc-950 border border-zinc-800 text-xs font-mono font-bold flex items-center justify-center text-zinc-400 group-hover:border-zinc-500 group-hover:text-white transition duration-300 z-10">4</div>
                <div className="space-y-1 md:space-y-2">
                  <h5 className="text-xs font-bold text-zinc-200">Final Reducer</h5>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">Merges parallel sections into unified, high-grade study guides and lecture summaries.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {/* Card 1: Notes Generator */}
          <div className="group relative border border-zinc-800 bg-zinc-950/40 backdrop-blur-sm rounded-2xl p-6 hover:border-zinc-700 hover:shadow-2xl hover:shadow-white/[0.01] transition duration-300 space-y-4 shadow-xl flex flex-col justify-between overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.01] to-transparent opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none" />
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-300 group-hover:text-white transition duration-300">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-100">Structured Notes Generator</h3>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Automatically generate study notes complete with code snippets, LaTeX equations, bulleted outline structures, and direct bibliographic links.
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Video Q&A */}
          <div className="group relative border border-zinc-800 bg-zinc-950/40 backdrop-blur-sm rounded-2xl p-6 hover:border-zinc-700 hover:shadow-2xl hover:shadow-white/[0.01] transition duration-300 space-y-4 shadow-xl flex flex-col justify-between overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.01] to-transparent opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none" />
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-300 group-hover:text-white transition duration-300">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-100">Interactive Video Q&A</h3>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Ask specific questions about the lecture contents. Get instant timestamped references to clarify difficult parts of the presentation.
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Summary Overview */}
          <div className="group relative border border-zinc-800 bg-zinc-950/40 backdrop-blur-sm rounded-2xl p-6 hover:border-zinc-700 hover:shadow-2xl hover:shadow-white/[0.01] transition duration-300 space-y-4 shadow-xl flex flex-col justify-between overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.01] to-transparent opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none" />
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-300 group-hover:text-white transition duration-300">
                <BarChart2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-100">Summary Dashboard</h3>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Obtain a high-level syllabus overview containing checklists of learning objectives, tags of core concepts, and structural topic breakdowns.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MainApp() {
  const { currentUser, logout, getUserDisplayName } = useAuth();

  // 1. Navigation & Viewport State
  const [globalTab, setGlobalTab] = useState('home');
  const [workspaceTab, setWorkspaceTab] = useState('notes');
  const [isNotesFullscreen, setIsNotesFullscreen] = useState(false);
  const [isViewingHistory, setIsViewingHistory] = useState(false);
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);

  // 2. Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'signup'
  const [authNotice, setAuthNotice] = useState(null);

  // 3. API Key Settings States (Embedded Settings form)
  const [activeWorkspaceView, setActiveWorkspaceView] = useState('generator'); // 'generator' | 'configure' | 'profile'
  const [googleKey1, setGoogleKey1] = useState('');
  const [googleKey2, setGoogleKey2] = useState('');
  const [googleKey3, setGoogleKey3] = useState('');
  const [showGoogle1, setShowGoogle1] = useState(false);
  const [showGoogle2, setShowGoogle2] = useState(false);
  const [showGoogle3, setShowGoogle3] = useState(false);
  const [isSavingKeys, setIsSavingKeys] = useState(false);
  const [isFetchingKeys, setIsFetchingKeys] = useState(false);
  const [keysError, setKeysError] = useState('');
  const [keysSuccess, setKeysSuccess] = useState('');

  // 4. URL & Ingestion State
  const [url, setUrl] = useState('');
  const [loadedUrl, setLoadedUrl] = useState('');
  const [loadedNoteId, setLoadedNoteId] = useState(null);

  // 5. API Status & Disconnect Modal State
  const [apiStatus, setApiStatus] = useState('checking'); // 'healthy' | 'unhealthy' | 'checking'
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [hasShownModal, setHasShownModal] = useState(false);
  const isConnectingRef = useRef(false);
  const mockTimersRef = useRef([]);

  // 6. Metadata State
  const [metadata, setMetadata] = useState(null);
  const [isLoadingMeta, setIsLoadingMeta] = useState(false);
  const [metaError, setMetaError] = useState(null);

  // 7. Note Generation State
  const [taskId, setTaskId] = useState(null);
  const [taskStatus, setTaskStatus] = useState('IDLE'); // IDLE | PROCESSING | COMPLETED | FAILED
  const [taskResult, setTaskResult] = useState(null);
  const [taskError, setTaskError] = useState(null);

  // 8. Section Visibility States
  const [showMetadata, setShowMetadata] = useState(true);
  const [showPipeline, setShowPipeline] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  // 9. History embedded States
  const [notesHistory, setNotesHistory] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [isMobileHistoryExpanded, setIsMobileHistoryExpanded] = useState(false);
  const [activeMenuNoteId, setActiveMenuNoteId] = useState(null);
  const [expandedVideoIds, setExpandedVideoIds] = useState({});

  const handleToggleVideoExpand = (videoId, e) => {
    if (e) e.stopPropagation();
    setExpandedVideoIds(prev => ({
      ...prev,
      [videoId]: !prev[videoId]
    }));
  };

  // Close history 3-dot menus on clicking anywhere on the window
  useEffect(() => {
    const handleGlobalClick = () => {
      setActiveMenuNoteId(null);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const [isSidebarSqueezed, setIsSidebarSqueezed] = useState(false);
  useEffect(() => {
    if (loadedNoteId) {
      const activeNote = notesHistory.find(item => item.id === loadedNoteId);
      if (activeNote) {
        const videoId = extractYoutubeVideoId(activeNote.videoUrl);
        if (videoId) {
          setExpandedVideoIds(prev => ({
            ...prev,
            [videoId]: true
          }));
        }
      }
    }
  }, [loadedNoteId, notesHistory]);
  const [isInitialRouteResolved, setIsInitialRouteResolved] = useState(false);

  // 10. Terminal & Logs State
  const [logs, setLogs] = useState([]);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const eventSourceRef = useRef(null);

  // 11. Refs
  const pollIntervalRef = useRef(null);

  // --- Effects & Synchronizers ---

  // Sync globalTab and workspaceTab to URL pathnames and handle initial load routing
  useEffect(() => {
    const handleUrlRouting = async () => {
      const path = window.location.pathname;
      const parts = path.split('/').filter(Boolean); // e.g. ["workspace", "notes", "dQw4w9WgXcQ"]

      if (parts[0] === 'workspace') {
        // Redirection for guests trying to access workspace via URL path
        if (currentUser === null) {
          window.history.replaceState(null, '', '/');
          setGlobalTab('home');
          setIsInitialRouteResolved(true);
          return;
        }
        if (!currentUser) return; // Wait until auth state is resolved

        const view = parts[1] || 'generator';
        setGlobalTab('workspace');

        if (view === 'configure') {
          setActiveWorkspaceView('configure');
        } else if (view === 'profile') {
          setActiveWorkspaceView('profile');
        } else {
          // Default to generator
          setActiveWorkspaceView('generator');
          const subTab = parts[2] || 'notes';
          const validSubTabs = ['notes', 'summary', 'qa'];
          const activeSubTab = validSubTabs.includes(subTab) ? subTab : 'notes';
          setWorkspaceTab(activeSubTab);

          const videoId = parts[3] || '';
          if (videoId) {
            const currentVideoId = extractYoutubeVideoId(loadedUrl);
            if (currentVideoId === videoId && taskResult) {
              setIsInitialRouteResolved(true);
              return;
            }

            setIsHistoryLoading(true);
            try {
              const foundNote = await getNoteByVideoId(currentUser.uid, videoId);
              if (foundNote) {
                setUrl(foundNote.videoUrl);
                setLoadedUrl(foundNote.videoUrl);
                setLoadedNoteId(foundNote.id);
                setMetadata(foundNote.metadata);
                setTaskResult(foundNote.result);
                setTaskStatus('COMPLETED');
                setShowMetadata(true);
                setShowNotes(true);
                setIsViewingHistory(true);
              } else {
                // Video note not found, reset view to input screen
                setUrl('');
                setLoadedUrl('');
                setLoadedNoteId(null);
                setMetadata(null);
                setTaskResult(null);
                setTaskStatus('IDLE');
                setShowMetadata(false);
                setShowNotes(false);
                window.history.replaceState(null, '', '/workspace/generator');
              }
            } catch (err) {
              console.error('Failed to load note by video ID:', err);
            } finally {
              setIsHistoryLoading(false);
            }
          } else {
            // No videoId, reset active loaded note if we were viewing one
            if (taskResult) {
              setUrl('');
              setLoadedUrl('');
              setLoadedNoteId(null);
              setMetadata(null);
              setTaskResult(null);
              setTaskStatus('IDLE');
              setShowMetadata(false);
              setShowNotes(false);
            }
          }
        }
        setIsInitialRouteResolved(true);
      } else {
        setGlobalTab('home');
        setIsInitialRouteResolved(true);
      }
    };

    if (currentUser !== undefined) {
      handleUrlRouting();
    }

    window.addEventListener('popstate', handleUrlRouting);
    return () => window.removeEventListener('popstate', handleUrlRouting);
  }, [currentUser]);

  useEffect(() => {
    if (!isInitialRouteResolved) return;

    let targetPath = '/';
    if (globalTab === 'workspace') {
      if (activeWorkspaceView === 'configure') {
        targetPath = '/workspace/configure';
      } else if (activeWorkspaceView === 'profile') {
        targetPath = '/workspace/profile';
      } else {
        // activeWorkspaceView === 'generator'
        const videoId = extractYoutubeVideoId(loadedUrl);
        if (videoId) {
          targetPath = `/workspace/generator/${workspaceTab}/${videoId}`;
        } else {
          targetPath = `/workspace/generator`;
        }
      }
    }
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
  }, [isInitialRouteResolved, globalTab, activeWorkspaceView, workspaceTab, loadedUrl]);

  useEffect(() => {
    setIsNotesFullscreen(false);
  }, [globalTab, activeWorkspaceView, workspaceTab]);

  const checkHealth = async () => {
    if (isConnectingRef.current) return;
    try {
      const res = await fetch(`${API_BASE_URL}/health`, { cache: 'no-store' });
      if (res.ok) {
        setApiStatus('healthy');
      } else {
        setApiStatus('unhealthy');
      }
    } catch {
      setApiStatus('unhealthy');
    }
  };

  const handleConnect = async () => {
    if (isConnectingRef.current) return;
    isConnectingRef.current = true;
    setApiStatus('checking');

    const startTime = Date.now();
    const timeout = 120000; // 1 minute retry window

    const poll = async () => {
      try {
        const res = await fetch('/api/health', { cache: 'no-store' });
        if (res.ok) {
          setApiStatus('healthy');
          isConnectingRef.current = false;
          return;
        }
      } catch (err) {
        // Ignored; we expect failures if the server is starting
      }

      if (Date.now() - startTime < timeout) {
        setTimeout(poll, 2000);
      } else {
        setApiStatus('unhealthy');
        isConnectingRef.current = false;
      }
    };

    poll();
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (apiStatus === 'unhealthy' && !hasShownModal) {
      setShowDisconnectModal(true);
      setHasShownModal(true);
    } else if (apiStatus === 'healthy') {
      const timer = setTimeout(() => {
        setShowDisconnectModal(false);
      }, 2000);
      setHasShownModal(false);
      return () => clearTimeout(timer);
    }
  }, [apiStatus, hasShownModal]);

  // Note state handlers and network operations below

  const handleOpenAuthModal = (mode = 'login', notice = null) => {
    setAuthModalMode(mode);
    setAuthNotice(notice);
    setIsAuthModalOpen(true);
  };

  // Handler: Fetch Metadata
  const handleFetchMetadata = async (targetUrl = url) => {
    clearMockTimers();
    if (!targetUrl) return;

    // Protection for non-authenticated users
    if (!currentUser) {
      handleOpenAuthModal('login', 'Please sign in to fetch YouTube video metadata.');
      return;
    }

    setIsLoadingMeta(true);
    setMetaError(null);
    try {
      const data = await fetchYoutubeMetadata(targetUrl);
      setMetadata(data);
      setShowMetadata(true);
      setLoadedUrl(targetUrl);
    } catch (err) {
      setMetaError(mapErrorMessage(err.message || 'Failed to fetch video metadata'));
      setMetadata(null);
    } finally {
      setIsLoadingMeta(false);
    }
  };

  // Handler: Start Note Generation
  const handleGenerateNotes = async (targetUrl = url) => {
    clearMockTimers();
    if (!targetUrl) return;
    setIsViewingHistory(false);

    // Protection for non-authenticated users
    if (!currentUser) {
      handleOpenAuthModal('login', 'Please sign in to generate structured study notes.');
      return;
    }

    // Reset task state
    setTaskId(null);
    setTaskStatus('PROCESSING');
    setTaskResult(null);
    setTaskError(null);
    setLogs([]);
    setShowPipeline(true);
    setShowMetadata(true);
    setShowNotes(false);

    // If metadata isn't fetched yet, fetch it concurrently
    if (!metadata) {
      handleFetchMetadata(targetUrl);
    }

    try {
      let idToken = null;
      if (currentUser) {
        idToken = await currentUser.getIdToken();
      }
      const response = await startNoteGeneration(targetUrl, currentUser?.uid, idToken);
      const newTaskId = response.task_id;
      setTaskId(newTaskId);

      // Start SSE Log Streaming
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      const es = streamTaskLogs(
        newTaskId,
        (logLine) => {
          setLogs((prev) => [...prev, logLine]);
        },
        (err) => {
          console.warn('SSE log stream error or disconnected:', err);
        },
        () => {
          console.log('SSE log stream completed.');
        }
      );
      eventSourceRef.current = es;

      // Start Polling Status every 2 seconds
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = setInterval(async () => {
        try {
          const statusData = await getTaskStatus(newTaskId);

          if (statusData.status === 'COMPLETED') {
            setTaskStatus('COMPLETED');
            setTaskResult(statusData.result);
            setShowNotes(true);
            setLoadedUrl(url);
            setWorkspaceTab('notes');
            const activeMetadata = statusData.metadata || metadata || {};
            if (statusData.metadata) {
              setMetadata(statusData.metadata);
              setShowMetadata(true);
            }
            if (eventSourceRef.current) {
              eventSourceRef.current.close();
            }
            clearInterval(pollIntervalRef.current);


            // Save notes to Firestore
            if (currentUser) {
              try {
                const noteId = await saveNotes(currentUser.uid, url, activeMetadata, statusData.result);
                const newHistoryItem = {
                  id: noteId,
                  userId: currentUser.uid,
                  videoUrl: url,
                  metadata: activeMetadata,
                  result: statusData.result,
                  createdAtDate: new Date()
                };
                setNotesHistory(prev => [newHistoryItem, ...prev]);
                setLoadedNoteId(noteId);
              } catch (saveErr) {
                console.error('Error saving notes to history:', saveErr);
              }
            }
          } else if (statusData.status === 'FAILED') {
            setTaskStatus('FAILED');
            setTaskError(mapErrorMessage(statusData.error || 'Notes generation failed.'));
            if (eventSourceRef.current) {
              eventSourceRef.current.close();
            }
            clearInterval(pollIntervalRef.current);
          }
        } catch (pollErr) {
          console.error('Task status poll error:', pollErr);
        }
      }, 2000);

    } catch (err) {
      setTaskStatus('FAILED');
      setTaskError(mapErrorMessage(err.message || 'Failed to dispatch note generation task'));
    }
  };

  const clearMockTimers = () => {
    mockTimersRef.current.forEach(timer => clearTimeout(timer));
    mockTimersRef.current = [];
  };

  const handleLoadMockData = () => {
    clearMockTimers();
    setIsViewingHistory(false);
    setUrl('https://www.youtube.com/watch?v=transformer-mock');

    // 1. Populate with mock video metadata immediately
    setMetadata({
      video_id: 'transformer-mock',
      title: 'Attention Is All You Need (Transformer Architecture Explained)',
      author: 'NotesMaker AI Labs',
      channel: 'NotesMaker AI Labs',
      length: 1240,
      thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60',
      description: 'A deep dive into the seminal paper that introduced the Transformer network architecture.',
      available_languages: [
        { code: 'en', name: 'English' },
        { code: 'es', name: 'Spanish' }
      ]
    });

    // 2. Set logs to initial metadata stage and show processing loader
    setLogs([
      'Task 777-mock-data: Starting mock study notes generation...',
      '[stage: metadata] Transcript & Metadata Generator node started.',
      '[stage: metadata] Fetching video metadata and transcript...'
    ]);
    setTaskStatus('PROCESSING');
    setTaskResult(null);
    setLoadedUrl('https://www.youtube.com/watch?v=transformer-mock');
    setShowMetadata(true);
    setShowPipeline(true);
    setShowNotes(false);

    // 3. Simulating logs stream intervals
    const timer1 = setTimeout(() => {
      setLogs(prev => [
        ...prev,
        '[stage: metadata] Transcript & Metadata Generator node completed.',
        '[stage: transcript] Transcript Merger node started.',
        '[stage: transcript] Paragraph segmentation successfully finished.',
        '[stage: transcript] Transcript Merger node completed.'
      ]);
    }, 3500);

    const timer2 = setTimeout(() => {
      setLogs(prev => [
        ...prev,
        '[stage: orchestrator] Starting Orchestrator node.',
        '[stage: orchestrator] Generating curriculum outline and planning...',
        '[stage: orchestrator] Orchestrator node completed successfully.',
        '[stage: section_writer] Starting parallel Section Workers...',
        '[stage: section_writer] [Section 1] Generating introduction & self-attention overview...',
        '[stage: section_writer] [Section 2] Synthesizing multi-head attention math details...'
      ]);
    }, 7000);

    const timer3 = setTimeout(() => {
      setLogs(prev => [
        ...prev,
        '[stage: section_writer] Section Worker completed for all sections.',
        '[stage: reducer] Starting Reducer node.',
        '[stage: reducer] Synthesis & Final Assembly completed successfully. Total sections merged: 2.',
        '[STREAM_FINISHED]'
      ]);
      setTaskStatus('COMPLETED');
      setTaskResult({
        draft_notes: {
          title: 'Attention Is All You Need (Transformer Architecture Explained)',
          content: `### 1. Introduction to the Transformer
The **Transformer** is a landmark neural network architecture introduced in 2017. Unlike previous sequence-to-sequence models (such as LSTMs and GRUs) that processed input sequentially, the Transformer relies entirely on **Self-Attention Mechanisms** to capture global dependencies.

Key advantages include:
- **Parallelization**: Computations across different sequence steps can be executed concurrently.
- **Constant Path Length**: Signals travel a constant distance between any two input positions.

### 2. Self-Attention Mechanics
Self-attention maps a query vector ($Q$) and a set of key ($K$) and value ($V$) vectors to an output. The matrix representation is defined mathematically as:

$$\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V$$

Where:
- $Q, K, V$ are projection matrices.
- $d_k$ is the scaling dimension factor.
          `,
          sections: [
            {
              section_id: 1,
              title: 'Introduction & Self-Attention',
              content: 'Self-attention maps a query vector ($Q$) and a set of key ($K$) and value ($V$) vectors.',
              references: [
                { title: 'Attention Is All You Need Paper (ArXiv)', url: 'https://arxiv.org/abs/1706.03762' }
              ]
            },
            {
              section_id: 2,
              title: 'Multi-Head Attention Layers',
              content: 'Multi-head projects queries, keys and values dynamically.',
              references: [
                { title: 'The Annotated Transformer (Harvard)', url: 'https://nlp.seas.harvard.edu/2018/04/03/attention.html' }
              ]
            }
          ]
        },
        lecture_outline: {
          title: 'Transformer Architecture Fundamentals',
          difficulty: 'Intermediate',
          lecture_type: 'Technical Seminar',
          overview: 'Overview of Self-Attention, Positional Encoding, and Feed-Forward sublayers.',
          learning_objectives: [
            'Understand the difference between Recurrent models and Self-Attention layers',
            'Calculate scaled dot-product attention mechanics',
            'Implement multi-head projection splitting'
          ],
          topic_hierarchy: [
            { title: 'Sequence to Sequence Limits', bullets: ['RNN bottlenecks', 'Lack of parallel processing'] },
            { title: 'Dot-Product Attention Scaling', bullets: ['Softmax stability', 'Dimension scaling factor'] }
          ],
          concepts: ['Self-Attention', 'Dot-Product Scaling', 'Multi-Head Projection']
        }
      });
      setShowNotes(true);
    }, 11000);

    mockTimersRef.current.push(timer1, timer2, timer3);
  };

  // Clear metadata, pipeline, and notes sections when URL changes or is removed
  useEffect(() => {
    if (url.trim() !== loadedUrl.trim()) {
      setMetadata(null);
      setMetaError(null);
      setTaskId(null);
      setTaskStatus('IDLE');
      setTaskResult(null);
      setTaskError(null);
      setLogs([]);
      setShowNotes(false);
      setShowPipeline(false);
      setShowMetadata(false);
      setLoadedUrl('');
    }
  }, [url, loadedUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) eventSourceRef.current.close();
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      mockTimersRef.current.forEach(timer => clearTimeout(timer));
    };
  }, []);

  // Fetch history when user logs in
  useEffect(() => {
    const fetchHistory = async () => {
      if (currentUser) {
        setIsHistoryLoading(true);
        try {
          const historyData = await getUserNotes(currentUser.uid);
          setNotesHistory(historyData);
        } catch (err) {
          console.error('Failed to load notes history:', err);
        } finally {
          setIsHistoryLoading(false);
        }
      } else {
        setNotesHistory([]);
        setLoadedNoteId(null);
      }
    };
    fetchHistory();
  }, [currentUser]);

  // Effect to load API Keys when accessing configuration
  useEffect(() => {
    if (currentUser && activeWorkspaceView === 'configure') {
      const loadKeys = async () => {
        setIsFetchingKeys(true);
        setKeysError('');
        setKeysSuccess('');
        try {
          const keys = await getUserApiKeys(currentUser.uid);
          const splitKeys = (keys.googleApiKey || '').split(',');
          setGoogleKey1(splitKeys[0] || '');
          setGoogleKey2(splitKeys[1] || '');
          setGoogleKey3(splitKeys[2] || '');
        } catch (err) {
          console.error('Failed to load API keys:', err);
          setKeysError('Failed to load your existing API keys.');
        } finally {
          setIsFetchingKeys(false);
        }
      };
      loadKeys();
    }
  }, [activeWorkspaceView, currentUser]);

  const handleSaveApiKeys = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSavingKeys(true);
    setKeysError('');
    setKeysSuccess('');
    try {
      const combinedKeys = [googleKey1.trim(), googleKey2.trim(), googleKey3.trim()]
        .filter(Boolean)
        .join(',');
      await saveUserApiKeys(currentUser.uid, combinedKeys);
      setKeysSuccess('API Keys saved successfully!');
    } catch (err) {
      console.error('Error saving API keys:', err);
      setKeysError(err.message || 'An error occurred while saving your keys.');
    } finally {
      setIsSavingKeys(false);
    }
  };

  const handleCopyUrl = (e, videoUrl, itemId) => {
    e.stopPropagation();
    if (!videoUrl) return;
    navigator.clipboard.writeText(videoUrl);
    setCopiedId(itemId);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const handleSelectHistoryNote = (note) => {
    clearMockTimers();
    const noteUrl = note.videoUrl || '';
    setUrl(noteUrl);
    setLoadedUrl(noteUrl);
    setLoadedNoteId(note.id);
    setMetadata(note.metadata || null);
    setTaskResult(note.result || null);
    setTaskStatus('COMPLETED');
    setShowMetadata(true);
    setShowNotes(true);
    setShowPipeline(false);
    setLogs([]);
    setIsViewingHistory(true);
    setGlobalTab('workspace');
    setWorkspaceTab('notes');
    setIsMobileHistoryExpanded(false);
  };

  const handleSetWorkspaceTab = (tabId) => {
    setWorkspaceTab(tabId);
  };

  const handleDeleteHistoryNote = async (noteId) => {
    try {
      await deleteNotes(noteId);
      setNotesHistory(prev => prev.filter(item => item.id !== noteId));
      // Reset currently loaded note if deleted
      if (loadedNoteId === noteId) {
        setLoadedNoteId(null);
        setUrl('');
        setLoadedUrl('');
        setMetadata(null);
        setTaskResult(null);
        setTaskStatus('IDLE');
      }
    } catch (err) {
      console.error('Failed to delete history item:', err);
    }
  };

  const handleDeleteAllVersions = async (generations) => {
    if (confirm(`Are you sure you want to delete this study note and all of its ${generations.length} versions?`)) {
      try {
        await Promise.all(generations.map(gen => deleteNotes(gen.id)));
        const idsToRemove = generations.map(g => g.id);
        setNotesHistory(prev => prev.filter(item => !idsToRemove.includes(item.id)));
        if (idsToRemove.includes(loadedNoteId)) {
          setLoadedNoteId(null);
          setUrl('');
          setLoadedUrl('');
          setMetadata(null);
          setTaskResult(null);
          setTaskStatus('IDLE');
        }
      } catch (err) {
        console.error('Failed to delete video notes:', err);
      }
    }
  };

  const handleToggleTerminal = () => {
    setIsTerminalOpen(prev => !prev);
  };

  const isRightPanelOpen = isTerminalOpen;
  const filteredHistory = notesHistory.filter(item => {
    const title = item.metadata?.title?.toLowerCase() || '';
    const channel = item.metadata?.channel?.toLowerCase() || '';
    const query = historySearchQuery.toLowerCase();
    return title.includes(query) || channel.includes(query);
  });

  // Group notesHistory by videoId, keeping legacy unique runs inside a nested list
  const groupHistoryByVideo = (historyItems) => {
    const groups = {};
    historyItems.forEach((item) => {
      const videoId = extractYoutubeVideoId(item.videoUrl) || 'fallback-' + item.id;
      if (!groups[videoId]) {
        groups[videoId] = {
          videoId,
          videoUrl: item.videoUrl,
          metadata: item.metadata,
          generations: []
        };
      }
      groups[videoId].generations.push(item);
    });

    return Object.values(groups).map(group => {
      group.generations.sort((a, b) => {
        const dateA = a.createdAtDate || (a.createdAt ? new Date(a.createdAt.toDate ? a.createdAt.toDate() : a.createdAt) : new Date(0));
        const dateB = b.createdAtDate || (b.createdAt ? new Date(b.createdAt.toDate ? b.createdAt.toDate() : b.createdAt) : new Date(0));
        return dateB - dateA;
      });
      group.latestDate = group.generations[0]?.createdAtDate || (group.generations[0]?.createdAt ? new Date(group.generations[0].createdAt.toDate ? group.generations[0].createdAt.toDate() : group.generations[0].createdAt) : new Date(0));
      return group;
    }).sort((a, b) => b.latestDate - a.latestDate);
  };

  const groupedHistory = groupHistoryByVideo(filteredHistory);

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col selection:bg-zinc-800 relative overflow-hidden">
      {/* Smooth White Ambient Light Blobs */}
      <div className="fixed -top-24 -left-24 w-[350px] sm:w-[550px] h-[350px] sm:h-[550px] bg-gradient-to-br from-white/25 via-zinc-200/10 to-transparent rounded-full blur-[75px] pointer-events-none z-0 opacity-100"></div>
      <div className="fixed -top-24 -right-24 w-[400px] sm:w-[650px] h-[400px] sm:h-[650px] bg-gradient-to-bl from-white/20 via-zinc-300/10 to-transparent rounded-full blur-[85px] pointer-events-none z-0 opacity-50"></div>
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] sm:w-[900px] h-[200px] bg-white/[0.08] rounded-full blur-[100px] pointer-events-none z-0"></div>

      {/* Top Header Navbar rendered globally */}
      {!isNotesFullscreen && (
        <Header
          globalTab={globalTab}
          setGlobalTab={setGlobalTab}
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



      {/* Main Switcher between Public Landing page and Auth-walled Workspace */}
      {globalTab === 'home' ? (
        <>
          {/* Global Background Grid and glows (Only on Home landing page) */}
          <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            <div className="premium-grid-bg h-full w-full"></div>
            <div className="grid-glow-effect"></div>
            <div className="grid-glow-secondary"></div>
          </div>

          <div className="flex-1 w-full flex flex-col px-4 sm:px-8 pb-12 pt-20 sm:pt-24 max-w-7xl mx-auto transition-all duration-300 relative z-10">
            <main className="flex-1 min-w-0 w-full">
              <HomeSection
                setGlobalTab={setGlobalTab}
                setWorkspaceTab={() => { }}
                isAuthenticated={!!currentUser}
                onOpenAuthModal={handleOpenAuthModal}
                onLoadMockData={handleLoadMockData}
              />
            </main>
          </div>

          {!isNotesFullscreen && (
            <footer className="relative z-10 border-t border-zinc-900 bg-black py-6 text-center text-xs text-zinc-500">
              <p>NotesMaker AI - All Rights Reserved</p>
            </footer>
          )}
        </>
      ) : (
        /* Workspace Section (Auth-walled) */
        !currentUser ? (
          <>
            <div className="flex-1 w-full flex flex-col px-4 sm:px-8 pb-12 pt-20 sm:pt-24 max-w-7xl mx-auto relative z-10">
              <AuthWall
                title="Study Workspace"
                description="Access notes generation, summary dashboards, and video Q&A resources in your study workspace."
                onOpenAuthModal={handleOpenAuthModal}
              >
                {/* Visual Preview */}
                <div className="max-w-3xl mx-auto space-y-8">
                  <UrlInput url="" setUrl={() => { }} onFetchMetadata={() => { }} onGenerateNotes={() => { }} onLoadMockData={() => { }} isLoadingMeta={false} isGenerating={false} hasMetadata={false} />
                  <div className="py-12 border border-zinc-800 rounded-xl bg-zinc-950 text-center text-zinc-500">Preview of study workspace...</div>
                </div>
              </AuthWall>
            </div>
            {!isNotesFullscreen && (
              <footer className="relative z-10 border-t border-zinc-900 bg-black py-6 text-center text-xs text-zinc-500">
                <p>NotesMaker AI - All Rights Reserved</p>
              </footer>
            )}
          </>
        ) : (
          /* Authenticated Sidebar Dashboard Workspace Layout (Header rendered separately at top) */
          <div className="flex-1 w-full flex relative min-h-screen">

            {/* Mobile Sidebar Backdrop Overlay */}
            {isSidebarMobileOpen && (
              <div
                onClick={() => setIsSidebarMobileOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-[1px] z-[79] lg:hidden mt-[53px]"
              />
            )}

            {/* Left Fixed Full-Height Navigation Sidebar - positioned below Header */}
            <aside className={`fixed top-[53px] bottom-0 left-0 w-64 bg-zinc-950 border-r border-zinc-900 z-[80] flex flex-col p-4 transition-transform duration-300 lg:translate-x-0 ${isSidebarMobileOpen ? 'translate-x-0' : '-translate-x-full'
              } ${isNotesFullscreen ? 'hidden lg:hidden' : ''}`}>


              <div className="h-px mb-4" />

              {/* Sidebar Navigation */}
              <div className="flex-1">
                <h3 className="text-[10px] font-mono font-bold tracking-wider uppercase text-zinc-500 mb-3 px-2">
                  Workspace
                </h3>
                <nav className="flex flex-col gap-1.5">
                  <button
                    onClick={() => {
                      setActiveWorkspaceView('generator');
                      setIsSidebarMobileOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition cursor-pointer ${activeWorkspaceView === 'generator'
                      ? 'bg-orange-950/20 text-orange-400 border border-orange-900/30 font-bold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
                      }`}
                  >
                    <Cpu className="w-4 h-4" />
                    <span>Notes Generator</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveWorkspaceView('configure');
                      setIsSidebarMobileOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition cursor-pointer ${activeWorkspaceView === 'configure'
                      ? 'bg-orange-950/20 text-orange-400 border border-orange-900/30 font-bold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
                      }`}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Configure Settings</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveWorkspaceView('profile');
                      setIsSidebarMobileOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition cursor-pointer ${activeWorkspaceView === 'profile'
                      ? 'bg-orange-950/20 text-orange-400 border border-orange-900/30 font-bold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
                      }`}
                  >
                    <User className="w-4 h-4" />
                    <span>User Profile</span>
                  </button>
                </nav>
              </div>

              {/* Live API Health Status in Footer */}
              <div className="pt-4 border-t border-zinc-900 space-y-3">
                {/* Console Toggle Button */}
                <button
                  type="button"
                  onClick={handleToggleTerminal}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition cursor-pointer border ${isTerminalOpen
                    ? 'bg-orange-950/20 text-orange-400 border-orange-900/30 font-bold'
                    : 'bg-zinc-950/30 border-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
                    }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Terminal className="w-4 h-4" />
                    <span>Real-time Console</span>
                  </div>
                  {taskStatus === 'PROCESSING' && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                    </span>
                  )}
                </button>

                <div
                  onClick={() => {
                    if (apiStatus === 'unhealthy') {
                      setShowDisconnectModal(true);
                    } else {
                      checkHealth();
                    }
                  }}
                  className="cursor-pointer flex items-center gap-2 p-2.5 rounded-xl bg-zinc-900/40 border border-zinc-900 hover:bg-zinc-900 transition text-[10px] font-medium"
                >
                  {apiStatus === 'checking' && (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 text-orange-500 animate-spin" />
                      <span className="text-zinc-500">API: Connecting...</span>
                    </>
                  )}
                  {apiStatus === 'healthy' && (
                    <>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                      </span>
                      <span className="text-orange-500 font-semibold">API Connected</span>
                    </>
                  )}
                  {apiStatus === 'unhealthy' && (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 text-orange-600 animate-pulse" />
                      <span className="text-orange-600 font-semibold">API Offline</span>
                    </>
                  )}
                </div>
              </div>
            </aside>

            {/* Right Side main scrollable Workspace Content Pane - pt-[53px] offset for Header */}
            <div className="flex-1 min-w-0 lg:pl-64 flex flex-col pt-[53px]">
              <div className={`flex-1 w-full px-4 sm:px-8 py-6 transition-all duration-300 relative z-10 ${isRightPanelOpen
                ? 'max-w-[1700px] lg:mx-0 lg:ml-0 lg:mr-auto lg:pr-[370px] xl:pr-[410px]'
                : 'max-w-7xl mx-auto'
                }`}>

                <div className="bg-zinc-950/20 border border-zinc-900 rounded-2xl p-4 sm:p-6 shadow-xl w-full">
                  {/* 1. API Configuration Settings view */}
                  {activeWorkspaceView === 'configure' && (
                    <div className="max-w-xl mx-auto space-y-6 py-4">
                      <div className="space-y-1.5 pb-4 border-b border-zinc-900">
                        <h3 className="text-lg font-bold text-zinc-50">API Key Configurations</h3>
                        <p className="text-xs text-zinc-400">Keys are stored securely and only used for your note generations.</p>
                      </div>

                      {keysError && (
                        <div className="p-3 rounded-lg bg-red-950/20 border border-red-500/30 text-red-300 text-xs flex items-center gap-2.5">
                          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                          <span>{keysError}</span>
                        </div>
                      )}

                      {keysSuccess && (
                        <div className="p-3 rounded-lg bg-orange-950/20 border border-orange-500/30 text-orange-300 text-xs flex items-center gap-2.5">
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-orange-400" />
                          <span>{keysSuccess}</span>
                        </div>
                      )}

                      {isFetchingKeys ? (
                        <div className="py-12 flex flex-col items-center justify-center text-zinc-450 gap-2">
                          <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                          <span className="text-xs">Loading api settings...</span>
                        </div>
                      ) : (
                        <form onSubmit={handleSaveApiKeys} className="space-y-5">
                          <div className="p-3.5 rounded-xl bg-orange-950/10 border border-orange-900/20 text-zinc-400 text-[11px] leading-relaxed">
                            <span className="font-bold text-orange-400 block mb-1">💡 Key Rotation & Fallback</span>
                            Upload up to 3 Gemini API keys from different accounts. If one gets rate limited under free tier quotas, the backend will automatically rotate to the next key. If all are blank, default server keys will be used.
                          </div>

                          {/* Gemini API Key 1 */}
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="block text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                                Gemini API Key 1 (Primary)
                              </label>
                              <a href="https://aistudio.google.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 font-semibold underline underline-offset-2">
                                Get Key <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </div>
                            <div className="relative">
                              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                              <input
                                type={showGoogle1 ? 'text' : 'password'}
                                value={googleKey1}
                                onChange={(e) => setGoogleKey1(e.target.value)}
                                placeholder="AIzaSy... (First Key)"
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-10 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition font-mono"
                              />
                              <button type="button" onClick={() => setShowGoogle1(!showGoogle1)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                                {showGoogle1 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          {/* Gemini API Key 2 */}
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="block text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
                                Gemini API Key 2 (Rotation Fallback)
                              </label>
                            </div>
                            <div className="relative">
                              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                              <input
                                type={showGoogle2 ? 'text' : 'password'}
                                value={googleKey2}
                                onChange={(e) => setGoogleKey2(e.target.value)}
                                placeholder="AIzaSy... (Second Key)"
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-10 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition font-mono"
                              />
                              <button type="button" onClick={() => setShowGoogle2(!showGoogle2)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                                {showGoogle2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          {/* Gemini API Key 3 */}
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="block text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
                                Gemini API Key 3 (Rotation Fallback)
                              </label>
                            </div>
                            <div className="relative">
                              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                              <input
                                type={showGoogle3 ? 'text' : 'password'}
                                value={googleKey3}
                                onChange={(e) => setGoogleKey3(e.target.value)}
                                placeholder="AIzaSy... (Third Key)"
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-10 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition font-mono"
                              />
                              <button type="button" onClick={() => setShowGoogle3(!showGoogle3)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                                {showGoogle3 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          <button type="submit" disabled={isSavingKeys} className="w-full py-2.5 px-4 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-sm rounded-xl transition duration-200 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50">
                            {isSavingKeys ? <Loader2 className="w-4 h-4 animate-spin text-zinc-950" /> : <Save className="w-4 h-4" />}
                            <span>Save Configurations</span>
                          </button>
                        </form>
                      )}
                    </div>
                  )}

                  {/* 2. User Profile view */}
                  {activeWorkspaceView === 'profile' && (
                    <div className="max-w-md mx-auto space-y-6 py-4 flex flex-col items-center text-center">
                      <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 text-orange-500 flex items-center justify-center text-xl font-black uppercase shadow-inner">
                        {getUserDisplayName(currentUser).charAt(0)}
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xl font-bold text-zinc-50">{getUserDisplayName(currentUser)}</h3>
                        <p className="text-xs text-zinc-500">{currentUser.email}</p>
                      </div>
                      <div className="w-full pt-4 border-t border-zinc-900 mt-2 flex flex-col gap-3">
                        <div className="flex items-center justify-between text-xs text-zinc-400 bg-zinc-900/30 p-3 rounded-lg border border-zinc-900">
                          <span>Authentication Provider</span>
                          <span className="font-semibold text-zinc-200">Email Address / User ID</span>
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              setGlobalTab('home');
                              await logout();
                            } catch (err) {
                              console.error('Logout failed:', err);
                            }
                          }}
                          className="w-full py-2.5 px-4 bg-red-950/20 hover:bg-red-900/10 border border-red-950/40 hover:border-red-900/60 text-red-500 font-semibold text-sm rounded-xl transition duration-200 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out Account</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 3. Notes Generator View (Has embedded History & Active generator panel) */}
                  {activeWorkspaceView === 'generator' && (
                    <div className="w-full flex flex-col xl:flex-row gap-6 items-stretch">

                      {/* Notes History Pane (Left side inside Notes Generator view) */}
                      <div className={`w-full shrink-0 flex flex-col border-b xl:border-b-0 xl:border-r border-zinc-900 pb-4 xl:pb-0 xl:sticky xl:top-[77px] xl:h-[calc(100vh-101px)] gap-2 transition-all duration-300 ${isSidebarSqueezed ? 'xl:w-14 xl:pr-0 xl:items-start xl:pl-0' : 'xl:w-72 xl:pr-4'
                        }`}>

                        {/* DESKTOP SIDEBAR VIEW */}
                        <div className="hidden xl:flex flex-col w-full h-full min-h-0">
                          {isSidebarSqueezed ? (
                            /* Squeezed View on Desktop */
                            <div className="flex flex-col items-start gap-4 py-2 w-full pl-0">
                              {/* Expand Button */}
                              <button
                                type="button"
                                onClick={() => setIsSidebarSqueezed(false)}
                                className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 transition flex items-center justify-center cursor-pointer shadow-sm"
                                title="Expand Sidebar"
                              >
                                <ArrowRight className="w-4 h-4" />
                              </button>

                              {/* Circular Generate Button */}
                              {taskResult && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    clearMockTimers();
                                    setUrl('');
                                    setLoadedUrl('');
                                    setLoadedNoteId(null);
                                    setMetadata(null);
                                    setTaskResult(null);
                                    setTaskStatus('IDLE');
                                    setShowMetadata(false);
                                    setShowNotes(false);
                                    setWorkspaceTab('notes');
                                    setIsViewingHistory(false);
                                    setIsMobileHistoryExpanded(false);
                                  }}
                                  className="w-9 h-9 rounded-full bg-zinc-100 text-zinc-950 hover:bg-white transition flex items-center justify-center shadow hover:scale-[1.05] cursor-pointer"
                                  title="New Ingestion / Generate"
                                >
                                  <Plus className="w-4.5 h-4.5" />
                                </button>
                              )}
                            </div>
                          ) : (
                            /* Expanded View on Desktop */
                            <div className="flex flex-col w-full h-full min-h-0">
                              {/* Header row with squeeze trigger */}
                              <div className="flex items-center justify-between px-1 py-1.5 border-b border-zinc-900/60 mb-2">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Workspace</span>
                                <button
                                  type="button"
                                  onClick={() => setIsSidebarSqueezed(true)}
                                  className="p-1 rounded hover:bg-zinc-900 text-zinc-500 hover:text-zinc-300 transition cursor-pointer"
                                  title="Collapse Sidebar"
                                >
                                  <ArrowLeft className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* "+ Generate" trigger button - Visible only when url input field is hidden */}
                              {taskResult && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    clearMockTimers();
                                    setUrl('');
                                    setLoadedUrl('');
                                    setLoadedNoteId(null);
                                    setMetadata(null);
                                    setTaskResult(null);
                                    setTaskStatus('IDLE');
                                    setShowMetadata(false);
                                    setShowNotes(false);
                                    setWorkspaceTab('notes');
                                    setIsViewingHistory(false);
                                    setIsMobileHistoryExpanded(false);
                                  }}
                                  className="w-full py-2.5 px-4 rounded-xl bg-zinc-100 text-zinc-950 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow hover:scale-[1.02] cursor-pointer mb-3"
                                >
                                  <Plus className="w-4 h-4" />
                                  <span>Generate</span>
                                </button>
                              )}

                              {/* Search History box */}
                              <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                                <input
                                  type="text"
                                  placeholder="Search history..."
                                  value={historySearchQuery}
                                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-4 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition"
                                />
                              </div>

                              {/* History list */}
                              <div className="flex-1 overflow-y-auto space-y-2.5 custom-scrollbar pr-1">
                                {isHistoryLoading ? (
                                  <div className="py-8 flex flex-col items-center justify-center text-zinc-500 gap-2">
                                    <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
                                    <span className="text-[10px]">Loading history...</span>
                                  </div>
                                ) : groupedHistory.length === 0 ? (
                                  <div className="text-center py-8 text-[10px] text-zinc-500">
                                    {historySearchQuery ? 'No results found.' : 'No notes generated yet.'}
                                  </div>
                                ) : (
                                  groupedHistory.map((group) => {
                                    const latestItem = group.generations[0];
                                    const hasMultiple = group.generations.length > 1;

                                    return (
                                      <div
                                        key={group.videoId}
                                        className={`border rounded-xl p-2.5 flex flex-col gap-2.5 transition ${group.generations.some(g => g.id === loadedNoteId)
                                          ? 'bg-zinc-900/50 border-zinc-700/60 shadow-lg'
                                          : 'bg-zinc-900/20 border-zinc-900/80 hover:border-zinc-800'
                                          }`}
                                      >
                                        {/* Video Summary Card Header */}
                                        <div
                                          className="flex gap-2 cursor-pointer group/card pr-7 relative"
                                          onClick={(e) => {
                                            handleSelectHistoryNote(latestItem);
                                            handleToggleVideoExpand(group.videoId, e);
                                          }}
                                        >
                                          {/* Thumbnail preview */}
                                          <div className="relative shrink-0 w-16 aspect-video rounded overflow-hidden bg-zinc-950 border border-zinc-900">
                                            {group.metadata?.thumbnail ? (
                                              <img src={group.metadata.thumbnail} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                              <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-650">
                                                <Video className="w-3.5 h-3.5" />
                                              </div>
                                            )}
                                          </div>
                                          <div className="flex-1 min-w-0 pr-1">
                                            <h4 className="text-[11px] font-bold text-zinc-200 line-clamp-2 leading-tight group-hover/card:text-orange-400 transition">
                                              {group.metadata?.title || 'Study Notes'}
                                            </h4>
                                            <div className="flex items-center justify-between mt-1">
                                              <p className="text-[9px] text-zinc-500 truncate max-w-[110px]">{group.metadata?.channel || 'YouTube Video'}</p>
                                              <div className="flex items-center gap-1 shrink-0">
                                                {hasMultiple && (
                                                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-md bg-orange-950/40 border border-orange-900/30 text-orange-400">
                                                    {group.generations.length} versions
                                                  </span>
                                                )}
                                                {/* Expand/Collapse Chevron (Passive indicator) */}
                                                <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 group-hover/card:text-zinc-300 transition-transform duration-300 ${expandedVideoIds[group.videoId] ? 'rotate-180 text-orange-500' : ''}`} />
                                              </div>
                                            </div>
                                          </div>

                                          {/* 3-Dot Options Dropdown for parent video */}
                                          <div className="absolute right-1 top-1/2 -translate-y-1/2 z-20" onClick={(e) => e.stopPropagation()}>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setActiveMenuNoteId(activeMenuNoteId === group.videoId ? null : group.videoId);
                                              }}
                                              className={`p-1 rounded hover:bg-zinc-800 transition duration-150 text-zinc-500 hover:text-zinc-300 cursor-pointer ${activeMenuNoteId === group.videoId ? 'bg-zinc-800 text-zinc-300 animate-pulse' : ''
                                                }`}
                                            >
                                              <MoreVertical className="w-3.5 h-3.5" />
                                            </button>

                                            {/* Dropdown Menu */}
                                            {activeMenuNoteId === group.videoId && (
                                              <div className="absolute right-0 top-7 w-28 bg-zinc-950 border border-zinc-800 shadow-2xl rounded-xl p-1 space-y-0.5 z-30 animate-in fade-in slide-in-from-top-1 duration-100">
                                                <button
                                                  type="button"
                                                  onClick={(e) => {
                                                    handleCopyUrl(e, latestItem.videoUrl, group.videoId);
                                                    setTimeout(() => setActiveMenuNoteId(null), 1000);
                                                  }}
                                                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[9px] font-bold text-zinc-300 hover:text-zinc-100 hover:bg-zinc-900 transition text-left cursor-pointer"
                                                >
                                                  {copiedId === group.videoId ? (
                                                    <>
                                                      <Check className="w-2.5 h-2.5 text-orange-450 shrink-0" />
                                                      <span className="text-orange-450">Copied!</span>
                                                    </>
                                                  ) : (
                                                    <>
                                                      <Copy className="w-2.5 h-2.5 text-zinc-400 shrink-0" />
                                                      <span>Copy Link</span>
                                                    </>
                                                  )}
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    setActiveMenuNoteId(null);
                                                    handleDeleteAllVersions(group.generations);
                                                  }}
                                                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[9px] font-bold text-red-400 hover:text-red-300 hover:bg-red-950/20 transition text-left cursor-pointer"
                                                >
                                                  <Trash2 className="w-2.5 h-2.5 text-red-500 shrink-0" />
                                                  <span>Delete Video</span>
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        </div>

                                        {/* Generations compact stack list */}
                                        {expandedVideoIds[group.videoId] && (
                                          <div className="space-y-1 pl-1 animate-in fade-in slide-in-from-top-1 duration-150">
                                            {group.generations.map((gen, idx) => {
                                              const timestamp = gen.createdAtDate || (gen.createdAt ? (gen.createdAt.toDate ? gen.createdAt.toDate() : new Date(gen.createdAt)) : new Date());
                                              const dateStr = timestamp.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

                                              return (
                                                <div
                                                  key={gen.id}
                                                  className={`group/gen relative flex items-center justify-between pl-2 pr-8 py-1.5 text-[10px] rounded-lg border transition duration-150 cursor-pointer ${loadedNoteId === gen.id
                                                    ? 'bg-orange-950/20 text-orange-400 border-orange-900/30 font-bold'
                                                    : 'bg-zinc-950/40 border-zinc-900/50 hover:bg-zinc-900/60 text-zinc-400 hover:text-zinc-300'
                                                    }`}
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSelectHistoryNote(gen);
                                                  }}
                                                >
                                                  <div className="flex items-center gap-1.5 truncate">
                                                    <span className={`w-1 h-1 rounded-full shrink-0 ${loadedNoteId === gen.id ? 'bg-orange-500' : 'bg-zinc-600 group-hover/gen:bg-orange-500'}`}></span>
                                                    <span className="truncate">
                                                      {hasMultiple ? `Version ${group.generations.length - idx}: ` : ''}{dateStr}
                                                    </span>
                                                  </div>

                                                  {/* Direct Trash delete button for version item */}
                                                  <div className="absolute right-1 top-1/2 -translate-y-1/2 z-20">
                                                    <button
                                                      type="button"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (confirm('Are you sure you want to delete this specific version of the study notes?')) {
                                                          handleDeleteHistoryNote(gen.id);
                                                        }
                                                      }}
                                                      className="p-1 rounded text-zinc-500 hover:text-red-500 hover:bg-zinc-900/50 transition duration-150 cursor-pointer"
                                                    >
                                                      <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* MOBILE SIDEBAR VIEW (Always Expanded, Collapsed via mobile toggle accordion) */}
                        <div className="flex xl:hidden flex-col gap-2 w-full min-h-0">
                          {/* Mobile Expander Toggle Bar */}
                          <button
                            type="button"
                            onClick={() => setIsMobileHistoryExpanded(!isMobileHistoryExpanded)}
                            className="w-full flex items-center justify-between px-4 py-3 bg-zinc-900/40 border border-zinc-900 rounded-xl text-xs font-bold text-zinc-300 transition hover:bg-zinc-900/60 cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <History className="w-4 h-4 text-orange-500" />
                              <span>Notes Ingestion History ({notesHistory.length})</span>
                            </div>
                            <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-300 ${isMobileHistoryExpanded ? 'rotate-180' : ''}`} />
                          </button>

                          {/* History content collapsible block */}
                          <div className={`flex-col ${isMobileHistoryExpanded ? 'flex' : 'hidden'} w-full min-h-0`}>
                            {/* Search History box */}
                            <div className="relative mb-4 mt-2">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                              <input
                                type="text"
                                placeholder="Search history..."
                                value={historySearchQuery}
                                onChange={(e) => setHistorySearchQuery(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-4 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition"
                              />
                            </div>

                            {/* History list */}
                            <div className="flex-1 overflow-y-auto max-h-[300px] space-y-2.5 custom-scrollbar pr-1">
                              {isHistoryLoading ? (
                                <div className="py-8 flex flex-col items-center justify-center text-zinc-500 gap-2">
                                  <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
                                  <span className="text-[10px]">Loading history...</span>
                                </div>
                              ) : groupedHistory.length === 0 ? (
                                <div className="text-center py-8 text-[10px] text-zinc-500">
                                  {historySearchQuery ? 'No results found.' : 'No notes generated yet.'}
                                </div>
                              ) : (
                                groupedHistory.map((group) => {
                                  const latestItem = group.generations[0];
                                  const hasMultiple = group.generations.length > 1;

                                  return (
                                    <div
                                      key={group.videoId}
                                      className={`border rounded-xl p-2.5 flex flex-col gap-2.5 transition ${group.generations.some(g => g.id === loadedNoteId)
                                        ? 'bg-zinc-900/50 border-zinc-700/60 shadow-lg'
                                        : 'bg-zinc-900/20 border-zinc-900/80 hover:border-zinc-800'
                                        }`}
                                    >
                                      {/* Video Summary Card Header */}
                                      <div
                                        className="flex gap-2 cursor-pointer group/card pr-7 relative"
                                        onClick={(e) => {
                                          handleSelectHistoryNote(latestItem);
                                          handleToggleVideoExpand(group.videoId, e);
                                        }}
                                      >
                                        {/* Thumbnail preview */}
                                        <div className="relative shrink-0 w-16 aspect-video rounded overflow-hidden bg-zinc-950 border border-zinc-900">
                                          {group.metadata?.thumbnail ? (
                                            <img src={group.metadata.thumbnail} alt="" className="w-full h-full object-cover" />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-650">
                                              <Video className="w-3.5 h-3.5" />
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex-1 min-w-0 pr-1">
                                          <h4 className="text-[11px] font-bold text-zinc-200 line-clamp-2 leading-tight group-hover/card:text-orange-400 transition">
                                            {group.metadata?.title || 'Study Notes'}
                                          </h4>
                                          <div className="flex items-center justify-between mt-1">
                                            <p className="text-[9px] text-zinc-500 truncate max-w-[110px]">{group.metadata?.channel || 'YouTube Video'}</p>
                                            <div className="flex items-center gap-1 shrink-0">
                                              {hasMultiple && (
                                                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-md bg-orange-950/40 border border-orange-900/30 text-orange-400">
                                                  {group.generations.length} versions
                                                </span>
                                              )}
                                              {/* Expand/Collapse Chevron (Passive indicator) */}
                                              <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 group-hover/card:text-zinc-300 transition-transform duration-300 ${expandedVideoIds[group.videoId] ? 'rotate-180 text-orange-500' : ''}`} />
                                            </div>
                                          </div>
                                        </div>

                                        {/* 3-Dot Options Dropdown for parent video */}
                                        <div className="absolute right-1 top-1/2 -translate-y-1/2 z-20" onClick={(e) => e.stopPropagation()}>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setActiveMenuNoteId(activeMenuNoteId === group.videoId ? null : group.videoId);
                                            }}
                                            className={`p-1 rounded hover:bg-zinc-800 transition duration-150 text-zinc-500 hover:text-zinc-300 cursor-pointer ${activeMenuNoteId === group.videoId ? 'bg-zinc-800 text-zinc-300 animate-pulse' : ''
                                              }`}
                                          >
                                            <MoreVertical className="w-3.5 h-3.5" />
                                          </button>

                                          {/* Dropdown Menu */}
                                          {activeMenuNoteId === group.videoId && (
                                            <div className="absolute right-0 top-7 w-28 bg-zinc-950 border border-zinc-800 shadow-2xl rounded-xl p-1 space-y-0.5 z-30 animate-in fade-in slide-in-from-top-1 duration-100">
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  handleCopyUrl(e, latestItem.videoUrl, group.videoId);
                                                  setTimeout(() => setActiveMenuNoteId(null), 1000);
                                                }}
                                                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[9px] font-bold text-zinc-300 hover:text-zinc-100 hover:bg-zinc-900 transition text-left cursor-pointer"
                                              >
                                                {copiedId === group.videoId ? (
                                                  <>
                                                    <Check className="w-2.5 h-2.5 text-orange-450 shrink-0" />
                                                    <span className="text-orange-450">Copied!</span>
                                                  </>
                                                ) : (
                                                  <>
                                                    <Copy className="w-2.5 h-2.5 text-zinc-400 shrink-0" />
                                                    <span>Copy Link</span>
                                                  </>
                                                )}
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setActiveMenuNoteId(null);
                                                  handleDeleteAllVersions(group.generations);
                                                }}
                                                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[9px] font-bold text-red-400 hover:text-red-300 hover:bg-red-950/20 transition text-left cursor-pointer"
                                              >
                                                <Trash2 className="w-2.5 h-2.5 text-red-500 shrink-0" />
                                                <span>Delete Video</span>
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {/* Generations compact stack list */}
                                      {expandedVideoIds[group.videoId] && (
                                        <div className="space-y-1 pl-1 animate-in fade-in slide-in-from-top-1 duration-150">
                                          {group.generations.map((gen, idx) => {
                                            const timestamp = gen.createdAtDate || (gen.createdAt ? (gen.createdAt.toDate ? gen.createdAt.toDate() : new Date(gen.createdAt)) : new Date());
                                            const dateStr = timestamp.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

                                            return (
                                              <div
                                                key={gen.id}
                                                className={`group/gen relative flex items-center justify-between pl-2 pr-8 py-1.5 text-[10px] rounded-lg border transition duration-150 cursor-pointer ${loadedNoteId === gen.id
                                                  ? 'bg-orange-950/20 text-orange-400 border-orange-900/30 font-bold'
                                                  : 'bg-zinc-950/40 border-zinc-900/50 hover:bg-zinc-900/60 text-zinc-400 hover:text-zinc-300'
                                                  }`}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleSelectHistoryNote(gen);
                                                }}
                                              >
                                                <div className="flex items-center gap-1.5 truncate">
                                                  <span className={`w-1 h-1 rounded-full shrink-0 ${loadedNoteId === gen.id ? 'bg-orange-500' : 'bg-zinc-600 group-hover/gen:bg-orange-500'}`}></span>
                                                  <span className="truncate">
                                                    {hasMultiple ? `Version ${group.generations.length - idx}: ` : ''}{dateStr}
                                                  </span>
                                                </div>

                                                {/* Direct Trash delete button for version item */}
                                                <div className="absolute right-1 top-1/2 -translate-y-1/2 z-20">
                                                  <button
                                                    type="button"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      if (confirm('Are you sure you want to delete this specific version of the study notes?')) {
                                                        handleDeleteHistoryNote(gen.id);
                                                      }
                                                    }}
                                                    className="p-1 rounded text-zinc-500 hover:text-red-500 hover:bg-zinc-900/50 transition duration-150 cursor-pointer"
                                                  >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                  </button>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Active Ingestion & Viewer Panel (Right side inside Notes Generator view) */}
                      <div className="flex-1 min-w-0 xl:sticky xl:top-[77px] xl:h-[calc(100vh-101px)] flex flex-col min-h-0">
                        {metaError && (
                          <div className="mb-4 p-3 rounded-xl bg-red-950/20 border border-red-500/30 text-red-300 text-xs flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
                            <div>
                              <span className="font-bold">Metadata Fetch Error:</span> {metaError}
                            </div>
                          </div>
                        )}

                        {!taskResult ? (
                          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar xl:pr-2 space-y-6">
                            <UrlInput
                              url={url}
                              setUrl={setUrl}
                              onFetchMetadata={handleFetchMetadata}
                              onGenerateNotes={handleGenerateNotes}
                              onLoadMockData={handleLoadMockData}
                              isLoadingMeta={isLoadingMeta}
                              isGenerating={taskStatus === 'PROCESSING'}
                              pulseTestNotes={!metadata}
                              hasMetadata={!!metadata}
                            />
                            {url !== '' && metadata && showMetadata && taskStatus !== 'PROCESSING' && (
                              <VideoCard
                                metadata={metadata}
                                onStartGeneration={handleGenerateNotes}
                                isGenerating={taskStatus === 'PROCESSING'}
                                onClose={() => setShowMetadata(false)}
                              />
                            )}

                            {/* Inline Loading / Generation Compiler Console */}
                            {taskStatus === 'PROCESSING' && (
                              <LoadingModal
                                isOpen={true}
                                inline={true}
                                isTerminalOpen={isTerminalOpen}
                                onToggleTerminal={handleToggleTerminal}
                              />
                            )}

                            {/* Empty state prompt - displayed inside scroll area only when no video preview is loaded */}
                            {!metadata && taskStatus !== 'PROCESSING' && (
                              <div className="text-center py-12 px-4 border border-zinc-900 bg-zinc-950/20 rounded-xl space-y-3 mt-4">
                                <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-850 text-zinc-400 flex items-center justify-center mx-auto">
                                  <Layers className="w-4 h-4" />
                                </div>
                                <h4 className="text-xs font-bold text-zinc-300">Study Workspace Empty</h4>
                                <p className="text-[10px] text-zinc-550 max-w-sm mx-auto leading-relaxed">
                                  Select a study note from your history on the left, or paste a new URL above to begin notes generation.
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col h-full min-h-0 space-y-6">
                            <div className="shrink-0">
                              <Tabs activeTab={workspaceTab} setActiveTab={setWorkspaceTab} />
                            </div>
                            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar xl:pr-2">
                              {workspaceTab === 'notes' && <NotesViewer result={taskResult} isFullscreen={isNotesFullscreen} onToggleFullscreen={setIsNotesFullscreen} />}
                              {workspaceTab === 'summary' && <SummaryOverview result={taskResult} metadata={metadata} consoleOpen={isTerminalOpen} />}
                              {workspaceTab === 'qa' && <VideoQa />}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Part 2: Real-time Streaming Terminal */}
            <LogTerminal
              logs={logs}
              isOpen={isTerminalOpen}
              onClose={() => setIsTerminalOpen(false)}
              onClear={() => setLogs([])}
            />
          </div>
        )
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

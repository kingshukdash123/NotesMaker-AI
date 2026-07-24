import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import UrlInput from './components/UrlInput';
import VideoCard from './components/VideoCard';
import PipelineTracker from './components/PipelineTracker';
import LogTerminal from './components/LogTerminal';
import NotesViewer from './components/NotesViewer';
import AuthModal from './components/AuthModal';
import ApiDisconnectModal from './components/ApiDisconnectModal';
import HistorySidebar from './components/HistorySidebar';
import ApiKeySettingsModal from './components/ApiKeySettingsModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import { fetchYoutubeMetadata, startNoteGeneration, getTaskStatus, streamTaskLogs, API_BASE_URL } from './services/server/api';
import { saveNotes, getUserNotes, deleteNotes, getUserApiKeys } from './services/firebase/notesService';
import { Sparkles, Video, Terminal, Layers, AlertCircle, RefreshCw, Lock } from 'lucide-react';

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
    return 'API Rate Limit reached. Please check your Google Gemini / Groq API key quota limits.';
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

function MainApp() {
  const { currentUser } = useAuth();

  // Auth modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'signup'
  const [authNotice, setAuthNotice] = useState(null);

  // API Key Settings Modal State
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [apiKeyNotice, setApiKeyNotice] = useState(null);

  const [url, setUrl] = useState('');
  const [loadedUrl, setLoadedUrl] = useState('');

  // API Status & Disconnect Modal State
  const [apiStatus, setApiStatus] = useState('checking'); // 'healthy' | 'unhealthy' | 'checking'
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [hasShownModal, setHasShownModal] = useState(false);
  const isConnectingRef = useRef(false);

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

  // Metadata state
  const [metadata, setMetadata] = useState(null);
  const [isLoadingMeta, setIsLoadingMeta] = useState(false);
  const [metaError, setMetaError] = useState(null);

  // Note generation state
  const [taskId, setTaskId] = useState(null);
  const [taskStatus, setTaskStatus] = useState('IDLE'); // IDLE | PROCESSING | COMPLETED | FAILED
  const [taskResult, setTaskResult] = useState(null);
  const [taskError, setTaskError] = useState(null);

  // Section visibility states
  const [showMetadata, setShowMetadata] = useState(true);
  const [showPipeline, setShowPipeline] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  // History Sidebar States
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [notesHistory, setNotesHistory] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // Terminal & Logs state
  const [logs, setLogs] = useState([]);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const eventSourceRef = useRef(null);

  // Polling ref
  const pollIntervalRef = useRef(null);

  const handleOpenAuthModal = (mode = 'login', notice = null) => {
    setAuthModalMode(mode);
    setAuthNotice(notice);
    setIsAuthModalOpen(true);
  };

  // Handler: Fetch Metadata
  const handleFetchMetadata = async (targetUrl = url) => {
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
    if (!targetUrl) return;

    // Protection for non-authenticated users
    if (!currentUser) {
      handleOpenAuthModal('login', 'Please sign in to generate structured study notes.');
      return;
    }

    // Check if API keys are set in Firestore
    try {
      const keys = await getUserApiKeys(currentUser.uid);
      if (!keys.googleApiKey || !keys.groqApiKey) {
        setApiKeyNotice('Please configure your Google Gemini and Groq API keys to generate study notes.');
        setIsApiKeyModalOpen(true);
        return;
      }
    } catch (err) {
      console.error('Failed to verify API keys in Firestore:', err);
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

  const handleLoadMockData = () => {
    setUrl('https://www.youtube.com/watch?v=transformer-mock');
    // Populate with mock video metadata
    setMetadata({
      video_id: 'transformer-mock',
      title: 'Attention Is All You Need (Transformer Architecture Explained)',
      author: 'NotesMaker AI Labs',
      length: 1240,
      thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60',
      description: 'A deep dive into the seminal paper that introduced the Transformer network architecture.'
    });

    // Populate with mock log pipeline steps
    setLogs([
      'Task 777-mock-data: Starting mock study notes generation...',
      '[stage: metadata] Transcript & Metadata Generator node started.',
      '[stage: metadata] Fetching video metadata and transcript...',
      '[stage: metadata] Transcript & Metadata Generator node completed.',
      '[stage: transcript] Transcript Merger node started.',
      '[stage: transcript] Paragraph segmentation successfully finished.',
      '[stage: transcript] Transcript Merger node completed.',
      '[stage: orchestrator] Starting Orchestrator node.',
      '[stage: orchestrator] Generating curriculum outline and planning...',
      '[stage: orchestrator] Orchestrator node completed successfully.',
      '[stage: section_writer] Starting parallel Section Workers...',
      '[stage: section_writer] [Section 1] Generating introduction & self-attention overview...',
      '[stage: section_writer] [Section 2] Synthesizing multi-head attention math details...',
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

          ### 3. Multi-Head Attention (MHA)
          Instead of performing a single attention function, Multi-Head Attention projects the queries, keys, and values $h$ times with different linear projections:

          \`\`\`python
          # Multi-head attention simulation code block
          import torch
          import torch.nn as nn

          class MultiHeadAttention(nn.Module):
              def __init__(self, d_model, num_heads):
                  super().__init__()
                  self.num_heads = num_heads
                  self.d_k = d_model // num_heads
                  self.q_linear = nn.Linear(d_model, d_model)
                  self.k_linear = nn.Linear(d_model, d_model)
                  self.v_linear = nn.Linear(d_model, d_model)
                  
              def forward(self, q, k, v):
                  # linear projection and scaling mechanics
                  print("Executing self-attention layers...")
                  return v
          \`\`\`
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
    setLoadedUrl('https://www.youtube.com/watch?v=transformer-mock');
    setShowMetadata(true);
    setShowPipeline(true);
    setShowNotes(true);
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
      }
    };
    fetchHistory();
  }, [currentUser]);

  const handleSelectHistoryNote = (note) => {
    const noteUrl = note.videoUrl || '';
    setUrl(noteUrl);
    setLoadedUrl(noteUrl);
    setMetadata(note.metadata || null);
    setTaskResult(note.result || null);
    setTaskStatus('COMPLETED');
    setShowMetadata(true);
    setShowNotes(true);
    setShowPipeline(false);
    setLogs([]);
    setIsHistoryOpen(false);
  };

  const handleDeleteHistoryNote = async (noteId) => {
    try {
      await deleteNotes(noteId);
      setNotesHistory(prev => prev.filter(item => item.id !== noteId));
    } catch (err) {
      console.error('Failed to delete history item:', err);
    }
  };

  const handleToggleTerminal = () => {
    setIsTerminalOpen(prev => {
      const nextVal = !prev;
      if (nextVal && window.innerWidth >= 1024) {
        setIsHistoryOpen(false);
      }
      return nextVal;
    });
  };

  const handleToggleHistory = () => {
    setIsHistoryOpen(prev => {
      const nextVal = !prev;
      if (nextVal && window.innerWidth >= 1024) {
        setIsTerminalOpen(false);
      }
      return nextVal;
    });
  };

  const isRightPanelOpen = isTerminalOpen || isHistoryOpen;

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col selection:bg-zinc-800 relative overflow-hidden">
      {/* Smooth White Ambient Light Blobs */}
      <div className="fixed -top-24 -left-24 w-[350px] sm:w-[550px] h-[350px] sm:h-[550px] bg-gradient-to-br from-white/25 via-zinc-200/10 to-transparent rounded-full blur-[75px] pointer-events-none z-0 opacity-100"></div>
      <div className="fixed -top-24 -right-24 w-[400px] sm:w-[650px] h-[400px] sm:h-[650px] bg-gradient-to-bl from-white/20 via-zinc-300/10 to-transparent rounded-full blur-[85px] pointer-events-none z-0 opacity-50"></div>
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] sm:w-[900px] h-[200px] bg-white/[0.08] rounded-full blur-[100px] pointer-events-none z-0"></div>

      {/* Top Header Navbar */}
      <Header
        apiStatus={apiStatus}
        checkHealth={checkHealth}
        setShowDisconnectModal={setShowDisconnectModal}
        onToggleTerminal={handleToggleTerminal}
        onToggleHistory={handleToggleHistory}
        logCount={logs.length}
        isGenerating={taskStatus === 'PROCESSING'}
        onOpenAuthModal={handleOpenAuthModal}
        onOpenApiKeySettings={() => setIsApiKeyModalOpen(true)}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        notice={authNotice}
      />

      {/* API Key Settings Modal */}
      <ApiKeySettingsModal
        isOpen={isApiKeyModalOpen}
        onClose={() => {
          setIsApiKeyModalOpen(false);
          setApiKeyNotice(null);
        }}
        notice={apiKeyNotice}
      />

      {/* Main Split Layout Container */}
      <div className={`flex-1 w-full flex flex-col lg:flex-row gap-6 px-4 sm:px-8 pb-6 pt-20 sm:pt-24 transition-all duration-300 ${isRightPanelOpen ? 'max-w-[1700px] mx-auto' : 'max-w-7xl mx-auto'
        }`}>
        {/* Part 1: Notes Generation UI (Upper part on phone, Left part on desktop) */}
        <main className={`flex-1 min-w-0 w-full transition-all duration-300 ${isRightPanelOpen ? 'pb-[10vh] lg:pb-0 lg:pr-[440px] xl:pr-[500px]' : ''
          }`}>
          {/* Hero Banner Title */}
          <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
            {/* <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
              Powered by Multi-Agent LangGraph Architecture
            </div> */}
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-50">
              Transform Any YouTube Video into{' '}
              <span className="bg-gradient-to-r from-zinc-100 via-zinc-300 to-zinc-500 bg-clip-text text-transparent">
                Structured Study Notes
              </span>
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
              Extract transcripts, generate deep lecture outlines, perform online research, and assemble publication-grade notes automatically.
            </p>
            {!currentUser && (
              <div className="pt-2">
                <button
                  onClick={() => handleOpenAuthModal('signup', 'Sign up or sign in to unlock video note generation.')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-zinc-100 text-xs font-semibold shadow-sm transition"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Sign In to Unlock Full Access</span>
                </button>
              </div>
            )}
          </div>

          {/* Input Search & Presets Component */}
          <UrlInput
            url={url}
            setUrl={setUrl}
            onFetchMetadata={handleFetchMetadata}
            onGenerateNotes={handleGenerateNotes}
            onLoadMockData={handleLoadMockData}
            isLoadingMeta={isLoadingMeta}
            isGenerating={taskStatus === 'PROCESSING'}
            pulseTestNotes={!currentUser && !metadata}
          />

          {/* Error Messages */}
          {metaError && (
            <div className="max-w-4xl mx-auto mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
              <div>
                <span className="font-bold">Metadata Fetch Error:</span> {metaError}
              </div>
            </div>
          )}

          {/* Video Card Preview */}
          {url !== '' && metadata && showMetadata && (
            <VideoCard
              metadata={metadata}
              onStartGeneration={handleGenerateNotes}
              isGenerating={taskStatus === 'PROCESSING'}
              onClose={() => setShowMetadata(false)}
            />
          )}

          {/* Pipeline Step Tracker */}
          {(taskStatus !== 'IDLE' || taskId) && showPipeline && (
            <PipelineTracker
              status={taskStatus}
              logs={logs}
              error={taskError}
              onClose={() => setShowPipeline(false)}
            />
          )}

          {/* Results Notes & Outline Viewer */}
          {taskResult && showNotes && (
            <NotesViewer
              result={taskResult}
              onClose={() => setShowNotes(false)}
            />
          )}

          {/* Empty state prompt if idle */}
          {taskStatus === 'IDLE' && !metadata && (
            <div className="max-w-3xl mx-auto text-center py-12 px-6 rounded-xl bg-zinc-950 border border-zinc-800 my-8 space-y-4 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center justify-center mx-auto">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-zinc-200">
                Ready to process your first video
              </h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Paste a YouTube lecture URL above or click one of the quick demo presets to generate notes, outline, and streaming logs.
              </p>
            </div>
          )}
        </main>

        {/* Part 2: Real-time Streaming Terminal (Right Part on Windows/Desktop) */}
        <LogTerminal
          logs={logs}
          isOpen={isTerminalOpen}
          onClose={() => setIsTerminalOpen(false)}
          onClear={() => setLogs([])}
        />
      </div>

      {/* Api Disconnect Modal */}
      <ApiDisconnectModal
        isOpen={showDisconnectModal}
        onClose={() => setShowDisconnectModal(false)}
        onConnect={handleConnect}
        apiStatus={apiStatus}
      />

      {/* History Sidebar */}
      <HistorySidebar
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={notesHistory}
        onSelect={handleSelectHistoryNote}
        onDelete={handleDeleteHistoryNote}
        isLoading={isHistoryLoading}
        apiStatus={apiStatus}
        checkHealth={checkHealth}
        setShowDisconnectModal={setShowDisconnectModal}
        isGenerating={taskStatus === 'PROCESSING'}
        isTerminalOpen={isTerminalOpen}
        onToggleTerminal={handleToggleTerminal}
        logCount={logs.length}
        onOpenAuthModal={handleOpenAuthModal}
        onOpenApiKeySettings={() => setIsApiKeyModalOpen(true)}
      />

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-black py-6 text-center text-xs text-zinc-500">
        <p>NotesMaker AI - All Rights Reserved</p>
      </footer>
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

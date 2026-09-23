import { useState, useRef, useEffect } from 'react';
import { Bot, ChevronDown, Plus, Trash2, AlertCircle, ChevronRight, FileText, PanelRight, PictureInPicture, Loader2, Maximize2, Pencil } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAssistantChat } from '../../hooks/useAssistantChat';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import ActionModal from '../common/ActionModal';

const COMPACT_SUGGESTIONS = [
  { text: 'Ask Orbit a study question', command: '/explain ' },
  { text: 'Solve a math problem step-by-step', command: '/math ' },
  { text: 'Create a focused study checklist', command: '/todo ' },
  { text: 'Draft a summary or email', command: '/email ' }
];

export default function RightAssistantSidebar({ currentUser, isOpen, onClose, mode = 'sidebar', onToggleMode, onZoom }) {
  const { isDark } = useTheme();
  const [showSelector, setShowSelector] = useState(false);
  const [inputValue, setInputValue] = useState('');
  
  // Modal states
  const [threadToRename, setThreadToRename] = useState(null);
  const [renameInput, setRenameInput] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  const [threadToDelete, setThreadToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const messagesEndRef = useRef(null);

  const {
    threads,
    activeThreadId,
    messages,
    isLoading,
    isStreaming,
    isLoadingHistory,
    error,
    createNewThread,
    selectThread,
    deleteThread,
    updateThreadMeta,
    sendMessage
  } = useAssistantChat(currentUser);

  // Scroll to bottom on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Handle sending messages
  const handleSend = () => {
    if (!inputValue.trim()) return;
    sendMessage(inputValue);
    setInputValue('');
  };

  const handleSuggestionClick = (cmd) => {
    setInputValue(cmd);
  };

  const [isCreatingThread, setIsCreatingThread] = useState(false);

  const handleCreateNewThread = async () => {
    if (isCreatingThread || isLoading) return;
    setIsCreatingThread(true);
    try {
      const id = await createNewThread('Study Session');
      if (id) {
        selectThread(id);
      }
    } catch (err) {
      console.error('Failed to create new chat session:', err);
    } finally {
      setIsCreatingThread(false);
    }
  };

  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 640 : false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const effectiveMode = isMobile ? 'floating' : mode;

  if (!currentUser) return null;

  const activeThread = threads.find(t => t.threadId === activeThreadId);

  const containerClasses = effectiveMode === 'sidebar'
    ? `fixed top-[53px] bottom-0 right-0 w-[calc(100vw-1rem)] max-w-sm sm:w-96 lg:static lg:h-full z-[85] flex flex-col shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${
        isOpen
          ? 'translate-x-0 opacity-100 lg:w-80 xl:w-96 border-l animate-chat-sidebar'
          : 'translate-x-full opacity-0 lg:translate-x-0 lg:w-0 pointer-events-none border-l-0'
      } ${
        isDark ? 'border-zinc-900/90 bg-zinc-950' : 'border-zinc-200 bg-white shadow-xl'
      }`
    : `fixed bottom-3 right-3 sm:bottom-4 sm:right-4 lg:bottom-6 lg:right-6 w-[calc(100vw-1.5rem)] max-w-[310px] sm:w-[340px] sm:max-w-[350px] lg:w-[380px] lg:max-w-[400px] h-[390px] max-h-[72vh] sm:h-[430px] sm:max-h-[76vh] lg:h-[480px] lg:max-h-[82vh] rounded-2xl shadow-2xl z-[110] flex flex-col overflow-hidden backdrop-blur-xl transition-all duration-300 ease-out origin-bottom-right border ${
        isOpen
          ? 'scale-100 opacity-100 translate-y-0 pointer-events-auto animate-chat-float'
          : 'scale-90 opacity-0 translate-y-4 pointer-events-none'
      } ${
        isDark ? 'bg-zinc-950/95 border-zinc-800/90' : 'bg-white border-zinc-200 shadow-2xl'
      }`;

  return (
    <>
      {/* Mobile Backdrop for docked sidebar mode with smooth fade (Only on larger screens if sidebar mode is active) */}
      {effectiveMode === 'sidebar' && (
        <div
          onClick={onClose}
          className={`fixed inset-0 bg-black/60 backdrop-blur-[1px] z-[84] lg:hidden mt-[53px] transition-opacity duration-300 ease-in-out ${
            isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        />
      )}

      <div key={effectiveMode} className={containerClasses}>
        <div className={`${
          effectiveMode === 'sidebar'
            ? 'w-[calc(100vw-1rem)] max-w-sm sm:w-96 lg:w-80 xl:w-96'
            : 'w-full'
        } h-full flex flex-col min-w-0 relative`}>
        {/* Header */}
        <div className={`px-3 sm:px-4 py-2 sm:py-3 border-b flex items-center justify-between shrink-0 h-11 sm:h-[50px] md:h-[53px] ${
          isDark ? 'border-zinc-900 bg-zinc-950' : 'border-zinc-200 bg-white'
        }`}>
          {isLoadingHistory ? (
            <div className="flex items-center gap-2 min-w-0 flex-1 animate-pulse">
              <div className={`w-3.5 h-3.5 rounded shrink-0 ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
              <div className={`h-3.5 w-24 rounded ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
            </div>
          ) : activeThread ? (
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
              <FileText className={`w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 select-none ${isDark ? 'text-zinc-500' : 'text-orange-500'}`} />
              <button
                onClick={() => setShowSelector(!showSelector)}
                className={`flex items-center gap-1 min-w-0 text-left cursor-pointer transition ${
                  isDark ? 'hover:text-zinc-200' : 'hover:text-zinc-900'
                }`}
              >
                <span className={`text-[11px] sm:text-xs font-bold truncate ${isDark ? 'text-zinc-150' : 'text-zinc-900'}`}>{activeThread.title}</span>
                <ChevronDown className={`w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 transition-transform ${showSelector ? 'rotate-180' : ''} ${isDark ? 'text-zinc-550' : 'text-zinc-400'}`} />
              </button>
              <button
                type="button"
                onClick={handleCreateNewThread}
                disabled={isCreatingThread || isLoading}
                className="btn-icon p-1 sm:p-1.5"
                title="New Chat Page"
                aria-label="New Chat Page"
              >
                {isCreatingThread || isLoading ? (
                  <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin text-orange-500" />
                ) : (
                  <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                )}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <span className={`text-[11px] sm:text-xs font-bold ${isDark ? 'text-zinc-300' : 'text-zinc-900'}`}>Study Session</span>
              <button
                type="button"
                onClick={handleCreateNewThread}
                disabled={isCreatingThread || isLoading}
                className="btn-icon p-1 sm:p-1.5"
                title="New Chat Page"
                aria-label="New Chat Page"
              >
                {isCreatingThread || isLoading ? (
                  <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin text-orange-500" />
                ) : (
                  <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                )}
              </button>
            </div>
          )}

          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            {/* Mode Switcher Button (Only for tablet/desktop - disabled on phone) */}
            {!isMobile && onToggleMode && (
              <button
                type="button"
                onClick={() => onToggleMode(effectiveMode === 'sidebar' ? 'floating' : 'sidebar')}
                className="btn-icon p-1 sm:p-1.5"
                title={effectiveMode === 'sidebar' ? "Switch to Floating widget" : "Pin/Dock as Sidebar"}
              >
                {effectiveMode === 'sidebar' ? <PictureInPicture className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <PanelRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
              </button>
            )}

            {/* Zoom to Full Screen Button */}
            {onZoom && (
              <button
                type="button"
                onClick={onZoom}
                className="btn-icon p-1 sm:p-1.5"
                title="Open full screen"
              >
                <Maximize2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="btn-icon p-1 sm:p-1.5"
              title="Close panel"
            >
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        {/* Body Viewport Container */}
        <div className="flex-1 relative min-h-0 flex flex-col">
          {/* 1. Selector Overlay Panel */}
          {showSelector && (
            <div className={`absolute inset-0 z-[130] flex flex-col animate-in fade-in duration-150 ${
              isDark ? 'bg-zinc-950' : 'bg-white'
            }`}>
              <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 custom-scrollbar">
                {threads.length === 0 ? (
                  <div className={`text-center py-8 text-[10px] ${isDark ? 'text-zinc-550' : 'text-zinc-400'}`}>
                    No study sessions created.
                  </div>
                ) : (
                  threads.map((t) => {
                    const isActive = t.threadId === activeThreadId;
                    return (
                      <div
                        key={t.threadId}
                        onClick={() => {
                          selectThread(t.threadId);
                          setShowSelector(false);
                        }}
                        className={`flex items-center justify-between p-2.5 rounded-xl transition duration-150 cursor-pointer ${
                          isActive
                            ? isDark 
                              ? 'bg-white/15 text-white font-bold' 
                              : 'bg-black/10 text-zinc-950 font-bold'
                            : isDark
                              ? 'text-zinc-400 hover:text-white hover:bg-white/10'
                              : 'text-zinc-600 hover:text-zinc-950 hover:bg-black/5'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                          <FileText className={`w-3.5 h-3.5 shrink-0 select-none ${
                            isActive 
                              ? isDark ? 'text-white' : 'text-zinc-950'
                              : isDark ? 'text-zinc-400' : 'text-zinc-500'
                          }`} />
                          <span className="text-xs truncate font-medium">{t.title}</span>
                        </div>
                        
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setThreadToRename(t);
                              setRenameInput(t.title || '');
                            }}
                            className={`p-1 rounded-lg transition cursor-pointer ${
                              isActive
                                ? isDark
                                  ? 'text-white/80 hover:text-white hover:bg-white/10'
                                  : 'text-zinc-800 hover:text-zinc-950 hover:bg-black/10'
                                : isDark
                                  ? 'text-zinc-400 hover:text-white hover:bg-white/10'
                                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-black/5'
                            }`}
                            title="Rename page"
                            aria-label="Rename page"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setThreadToDelete(t);
                            }}
                            className="p-1 rounded-lg transition cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            title="Delete page"
                            aria-label="Delete page"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}          {/* 2. Scrollable Messages flow */}
          <div className={`flex-1 overflow-y-auto px-2.5 sm:px-4 py-2 sm:py-3 space-y-2 sm:space-y-3 custom-scrollbar ${
            isDark ? 'bg-black/5' : 'bg-white'
          }`}>
            {isLoadingHistory ? (
              <div className="space-y-4 py-2 animate-pulse">
                {/* User message skeleton */}
                <div className="flex flex-col items-end w-full px-1">
                  <div className={`h-7 w-32 sm:w-40 rounded-2xl rounded-tr-xs ${isDark ? 'bg-zinc-800/80' : 'bg-zinc-200'}`} />
                </div>
                {/* Assistant message skeleton */}
                <div className="flex gap-2 w-full px-1">
                  <div className={`w-5 h-5 rounded shrink-0 ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
                  <div className="flex-1 space-y-2 pt-0.5">
                    <div className={`h-3 w-5/6 rounded ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
                    <div className={`h-3 w-full rounded ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
                    <div className={`h-3 w-2/3 rounded ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
                  </div>
                </div>
                {/* User message skeleton 2 */}
                <div className="flex flex-col items-end w-full px-1 pt-1">
                  <div className={`h-7 w-24 sm:w-32 rounded-2xl rounded-tr-xs ${isDark ? 'bg-zinc-800/80' : 'bg-zinc-200'}`} />
                </div>
                {/* Assistant message skeleton 2 */}
                <div className="flex gap-2 w-full px-1">
                  <div className={`w-5 h-5 rounded shrink-0 ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
                  <div className="flex-1 space-y-2 pt-0.5">
                    <div className={`h-3 w-4/5 rounded ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
                    <div className={`h-3 w-1/2 rounded ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
                  </div>
                </div>
              </div>
            ) : !activeThread ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 sm:p-6 space-y-2.5 sm:space-y-3">
                <img
                  src="/orbit.png"
                  alt="Orbit"
                  width="72"
                  height="96"
                  className="w-16 h-20 sm:w-20 sm:h-24 object-contain mx-auto select-none pointer-events-none drop-shadow-md"
                />
                <h4 className={`text-[11px] sm:text-xs font-bold ${isDark ? 'text-zinc-300' : 'text-zinc-900'}`}>Study Session</h4>
                <p className={`text-[9px] sm:text-[10px] max-w-[190px] sm:max-w-[200px] leading-relaxed ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                  Start a study session to learn and study with Orbit's guidance.
                </p>
                <button
                  onClick={async () => {
                    const id = await createNewThread('Study Session');
                    if (id) selectThread(id);
                  }}
                  className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-[9px] sm:text-[10px] font-bold transition cursor-pointer shadow-sm"
                >
                  Start Study Session
                </button>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col justify-center py-2 sm:py-4">
                <div className="max-w-[260px] sm:max-w-[280px] mx-auto space-y-2.5 sm:space-y-3">
                  <div className="space-y-0.5 sm:space-y-1 text-center">
                    <img
                      src="/orbit.png"
                      alt="Orbit"
                      width="80"
                      height="106"
                      className="w-16 h-22 sm:w-20 sm:h-26 object-contain mx-auto mb-1.5 sm:mb-2 select-none pointer-events-none drop-shadow-md"
                    />
                    <h3 className={`text-[11px] sm:text-xs font-bold ${isDark ? 'text-zinc-200' : 'text-zinc-900'}`}>{activeThread.title}</h3>
                    <p className={`text-[9px] sm:text-[10px] leading-relaxed ${isDark ? 'text-zinc-550' : 'text-zinc-500'}`}>
                      Ask Orbit any study doubt, discuss your goals, or use slash commands.
                    </p>
                  </div>
                  <div className={`space-y-1 sm:space-y-1.5 border-t pt-3 sm:pt-4 flex flex-col ${isDark ? 'border-zinc-900' : 'border-zinc-200'}`}>
                    {COMPACT_SUGGESTIONS.map((sug) => (
                      <button
                        key={sug.text}
                        onClick={() => handleSuggestionClick(sug.command)}
                        className={`text-left px-2 py-1.5 sm:px-2.5 sm:py-2 rounded-lg border text-[9px] sm:text-[10px] transition cursor-pointer ${
                          isDark 
                            ? 'border-zinc-900 bg-zinc-900/30 hover:bg-zinc-900/60 text-zinc-350' 
                            : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-800'
                        }`}
                      >
                        {sug.text}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {messages.map((msg, idx) => {
                  const isLast = idx === messages.length - 1;
                  return (
                    <ChatMessage 
                      key={idx} 
                      message={msg} 
                      isStreaming={isStreaming && isLast && msg.role === 'assistant'} 
                    />
                  );
                })}
              </div>
            )}

            {error && (
              <div className="p-2.5 sm:p-3 rounded-xl bg-red-950/20 border border-red-500/30 text-red-300 text-[9px] sm:text-[10px] flex items-center gap-2 max-w-[90%] mx-auto">
                <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* 3. Input container at bottom */}
          {activeThread && !showSelector && (
            <div className="p-2 sm:p-2.5 shrink-0 bg-transparent">
              <div className={`rounded-xl px-2 py-1 flex items-center border transition-colors ${
                isDark ? 'bg-zinc-900/60 border-zinc-800 focus-within:border-zinc-700' : 'bg-zinc-100 border-zinc-200 focus-within:border-zinc-300 shadow-xs'
              }`}>
                <ChatInput
                  value={inputValue}
                  onChange={setInputValue}
                  onSubmit={handleSend}
                  isLoading={isLoading}
                  isStreaming={isStreaming}
                />
              </div>
            </div>
          )}
        </div>

        </div>
      </div>

      {/* Rename Chat Page Modal using ActionModal */}
      <ActionModal
        isOpen={Boolean(threadToRename)}
        onClose={() => setThreadToRename(null)}
        title="Rename Chat Page"
        icon={Pencil}
        confirmText="Save Name"
        loadingText="Saving..."
        isLoading={isRenaming}
        isSubmitDisabled={!renameInput.trim()}
        onSubmit={async () => {
          if (!threadToRename || !renameInput.trim()) return;
          setIsRenaming(true);
          try {
            await updateThreadMeta(threadToRename.threadId, { title: renameInput.trim() });
            setThreadToRename(null);
          } catch (err) {
            console.error('Failed to rename chat page:', err);
          } finally {
            setIsRenaming(false);
          }
        }}
      >
        <div className="space-y-1.5">
          <label className={`block text-xs font-semibold ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
            Page Name
          </label>
          <input
            type="text"
            value={renameInput}
            onChange={(e) => setRenameInput(e.target.value)}
            placeholder="e.g. Thermodynamics Discussion, Calculus Homework"
            className={`w-full rounded-xl px-3 py-2 text-xs transition focus:outline-none focus:border-orange-500 ${
              isDark
                ? 'bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-500'
                : 'bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:bg-white'
            }`}
            required
            maxLength={40}
            autoFocus
          />
        </div>
      </ActionModal>

      {/* Delete Chat Page Modal using ActionModal */}
      <ActionModal
        isOpen={Boolean(threadToDelete)}
        onClose={() => setThreadToDelete(null)}
        title="Delete Chat Page"
        icon={Trash2}
        iconColor="text-red-500"
        confirmText="Delete"
        confirmVariant="danger"
        loadingText="Deleting..."
        isLoading={isDeleting}
        onSubmit={async () => {
          if (!threadToDelete) return;
          setIsDeleting(true);
          try {
            await deleteThread(threadToDelete.threadId || threadToDelete);
            setThreadToDelete(null);
          } catch (err) {
            console.error('Failed to delete chat page:', err);
          } finally {
            setIsDeleting(false);
          }
        }}
      >
        <p className={`text-xs leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          Are you sure you want to delete <span className={`font-semibold ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>"{threadToDelete?.title || 'this page'}"</span>? All messages and conversation context will be permanently removed.
        </p>
      </ActionModal>
    </>
  );
}

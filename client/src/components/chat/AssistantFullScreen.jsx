import { useState, useRef, useEffect } from 'react';
import { Bot, Plus, Trash2, FileText, Loader2, Pencil, ChevronDown, Minimize2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAssistantChat } from '../../hooks/useAssistantChat';
import { useApp } from '../../context/AppContext';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import ThreeDotMenu from '../common/ThreeDotMenu';
import ActionModal from '../common/ActionModal';

const FULLSCREEN_SUGGESTIONS = [
  { text: 'Explain a complex concept', command: '/explain ' },
  { text: 'Solve a math formula step-by-step', command: '/math ' },
  { text: 'Create a structured study checklist', command: '/todo ' },
  { text: 'Draft a summary or email response', command: '/email ' }
];

export default function AssistantFullScreen({ currentUser }) {
  const { isDark } = useTheme();
  const { setActiveSection, previousSection, setIsAssistantOpen, setAssistantMode } = useApp() || {};
  const [inputValue, setInputValue] = useState('');
  const [isCreatingThread, setIsCreatingThread] = useState(false);
  const [showSelector, setShowSelector] = useState(false);
  
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
    createNewThread,
    selectThread,
    deleteThread,
    updateThreadMeta,
    sendMessage
  } = useAssistantChat(currentUser);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    sendMessage(inputValue);
    setInputValue('');
  };

  const handleSuggestionClick = (cmd) => {
    setInputValue(cmd);
  };

  const handleCreateNewThread = async () => {
    if (isCreatingThread) return;
    setIsCreatingThread(true);
    try {
      const id = await createNewThread('Study Session');
      if (id) {
        selectThread(id);
      }
    } catch (err) {
      console.error('Failed to create new chat page:', err);
    } finally {
      setIsCreatingThread(false);
    }
  };

  const handleZoomOut = () => {
    const isPhone = typeof window !== 'undefined' && window.innerWidth < 640;
    if (isPhone) {
      setAssistantMode?.('floating');
    } else {
      setAssistantMode?.('sidebar');
    }
    setIsAssistantOpen?.(true);

    if (previousSection && previousSection !== 'assistant') {
      setActiveSection(previousSection);
    } else if (window.history.length > 1 && document.referrer && document.referrer.includes(window.location.host)) {
      window.history.back();
    } else {
      // Direct URL hit on /assistant -> fallback to dashboard
      setActiveSection('dashboard');
    }
  };

  if (!currentUser) {
    return (
      <div className={`h-full flex items-center justify-center ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
        Please sign in to access the assistant.
      </div>
    );
  }

  const activeThread = threads.find(t => t.threadId === activeThreadId);

  return (
    <div className={`h-full w-full flex rounded-xl overflow-hidden relative z-10 border animate-chat-fullscreen ${
      isDark ? 'bg-black border-zinc-900' : 'bg-white border-zinc-200 shadow-sm'
    }`}>
      {/* Main Full-Width Chat Viewport (All devices) */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-transparent relative">
        {/* 1. Full Header Bar for Phone and Tablet View (lg:hidden) */}
        <div className={`flex lg:hidden items-center justify-between px-3 py-2 sm:px-4 sm:py-2.5 border-b shrink-0 z-20 select-none ${
          isDark ? 'bg-zinc-950/95 border-zinc-900/80 backdrop-blur-md' : 'bg-white/95 border-zinc-200/80 backdrop-blur-md'
        }`}>
          {/* Left: Study Session Selector Dropdown Trigger & New Thread Button */}
          {isLoadingHistory ? (
            <div className="flex items-center gap-2 min-w-0 animate-pulse">
              <div className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded shrink-0 ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
              <div className={`h-3.5 sm:h-4 w-24 sm:w-28 rounded ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
            </div>
          ) : activeThread ? (
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <FileText className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 select-none ${isDark ? 'text-zinc-400' : 'text-orange-500'}`} />
              <button
                type="button"
                onClick={() => setShowSelector(!showSelector)}
                className={`flex items-center gap-1 min-w-0 text-left cursor-pointer transition max-w-[150px] sm:max-w-xs ${
                  isDark ? 'hover:text-zinc-100' : 'hover:text-zinc-900'
                }`}
              >
                <span className={`text-xs sm:text-sm font-bold truncate ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>{activeThread.title}</span>
                <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 transition-transform ${showSelector ? 'rotate-180' : ''} ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`} />
              </button>
              <button
                type="button"
                onClick={handleCreateNewThread}
                disabled={isCreatingThread || isLoading}
                className={`p-1 rounded-lg transition cursor-pointer ${
                  isDark 
                    ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80' 
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70'
                }`}
                title="New Chat Page"
                aria-label="New Chat Page"
              >
                {isCreatingThread || isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-orange-500" />
                ) : (
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                )}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <span className={`text-xs sm:text-sm font-bold ${isDark ? 'text-zinc-200' : 'text-zinc-900'}`}>Study Session</span>
              <button
                type="button"
                onClick={handleCreateNewThread}
                disabled={isCreatingThread || isLoading}
                className={`p-1 rounded-lg transition cursor-pointer ${
                  isDark 
                    ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80' 
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70'
                }`}
                title="New Chat Page"
                aria-label="New Chat Page"
              >
                {isCreatingThread || isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-orange-500" />
                ) : (
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                )}
              </button>
            </div>
          )}

          {/* Right: Zoom Out Button */}
          <button
            type="button"
            onClick={handleZoomOut}
            className={`p-1.5 sm:p-2 rounded-xl transition cursor-pointer ${
              isDark 
                ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80' 
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70'
            }`}
            title="Zoom out / Back to app"
            aria-label="Zoom out / Back to app"
          >
            <Minimize2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>
        </div>

        {/* 2. Floating Top-Left Controls (Desktop only: lg:flex) */}
        <div className="hidden lg:flex absolute top-4 left-5 z-20 items-center select-none">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl backdrop-blur-md transition shadow-xs ${
            isDark 
              ? 'bg-zinc-900/80 text-zinc-200' 
              : 'bg-zinc-100/90 text-zinc-800'
          }`}>
            {isLoadingHistory ? (
              <div className="flex items-center gap-2 min-w-0 animate-pulse">
                <div className={`w-4 h-4 rounded shrink-0 ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
                <div className={`h-4 w-28 rounded ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
              </div>
            ) : activeThread ? (
              <div className="flex items-center gap-2 min-w-0">
                <FileText className={`w-4 h-4 shrink-0 select-none ${isDark ? 'text-zinc-400' : 'text-orange-500'}`} />
                <button
                  type="button"
                  onClick={() => setShowSelector(!showSelector)}
                  className={`flex items-center gap-1 min-w-0 text-left cursor-pointer transition max-w-xs ${
                    isDark ? 'hover:text-zinc-100' : 'hover:text-zinc-900'
                  }`}
                >
                  <span className={`text-sm font-bold truncate ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>{activeThread.title}</span>
                  <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${showSelector ? 'rotate-180' : ''} ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`} />
                </button>
                <button
                  type="button"
                  onClick={handleCreateNewThread}
                  disabled={isCreatingThread || isLoading}
                  className={`p-1 rounded-lg transition cursor-pointer ${
                    isDark 
                      ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80' 
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70'
                  }`}
                  title="New Chat Page"
                  aria-label="New Chat Page"
                >
                  {isCreatingThread || isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                <span className={`text-sm font-bold ${isDark ? 'text-zinc-200' : 'text-zinc-900'}`}>Study Session</span>
                <button
                  type="button"
                  onClick={handleCreateNewThread}
                  disabled={isCreatingThread || isLoading}
                  className={`p-1 rounded-lg transition cursor-pointer ${
                    isDark 
                      ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80' 
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70'
                  }`}
                  title="New Chat Page"
                  aria-label="New Chat Page"
                >
                  {isCreatingThread || isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 3. Floating Top-Right Controls (Desktop only: lg:flex) */}
        <div className="hidden lg:flex absolute top-4 right-5 z-20 items-center gap-1.5">
          <button
            type="button"
            onClick={handleZoomOut}
            className={`p-2 rounded-xl backdrop-blur-md transition cursor-pointer shadow-xs ${
              isDark 
                ? 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800' 
                : 'bg-zinc-100/90 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200'
            }`}
            title="Zoom out / Back to app"
            aria-label="Zoom out / Back to app"
          >
            <Minimize2 className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Floating Chat Session List (All devices) */}
        {showSelector && (
          <>
            <div 
              className="fixed inset-0 z-[120]"
              onClick={() => setShowSelector(false)} 
            />
            <div className={`absolute top-12 left-3 sm:left-4 lg:top-14 lg:left-5 w-[calc(100vw-2rem)] max-w-xs sm:w-80 max-h-[70vh] z-[125] rounded-2xl border flex flex-col shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 overflow-hidden ${
              isDark ? 'bg-zinc-950/95 border-zinc-800' : 'bg-white border-zinc-200 shadow-xl'
            }`}>
              <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar max-h-64">
                {threads.length === 0 ? (
                  <div className={`text-center py-6 text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    No chat pages created.
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
                        className={`flex items-center justify-between px-3 py-2 rounded-xl transition duration-150 cursor-pointer ${
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
                            isActive ? (isDark ? 'text-white' : 'text-zinc-950') : (isDark ? 'text-zinc-400' : 'text-zinc-500')
                          }`} />
                          <span className="text-xs truncate font-medium">{t.title}</span>
                        </div>
                        <ThreeDotMenu
                          buttonClassName={
                            isActive
                              ? isDark
                                ? 'text-white/80 hover:text-white hover:bg-white/10'
                                : 'text-zinc-800 hover:text-zinc-950 hover:bg-black/10'
                              : isDark
                                ? 'text-zinc-400 hover:text-white hover:bg-white/10'
                                : 'text-zinc-500 hover:text-zinc-900 hover:bg-black/5'
                          }
                          items={[
                            {
                              label: 'Rename',
                              icon: Pencil,
                              onClick: (e) => {
                                if (e) e.stopPropagation();
                                setThreadToRename(t);
                                setRenameInput(t.title || '');
                              }
                            },
                            {
                              label: 'Delete',
                              icon: Trash2,
                              variant: 'danger',
                              onClick: (e) => {
                                if (e) e.stopPropagation();
                                setThreadToDelete(t);
                              }
                            }
                          ]}
                          title="Page options"
                          ariaLabel="Page options"
                        />
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}

        {/* Messages viewport */}
        <div className={`flex-1 overflow-y-auto px-3 sm:px-6 md:px-8 pt-3 sm:pt-4 lg:pt-14 pb-4 sm:pb-6 space-y-4 custom-scrollbar min-h-0 ${
          isDark ? 'bg-black/10' : 'bg-white'
        }`}>
          {isLoadingHistory ? (
            <div className="space-y-6 py-4 animate-pulse max-w-3xl mx-auto">
              {/* User message skeleton */}
              <div className="flex flex-col items-end w-full px-2">
                <div className={`h-9 w-48 rounded-2xl rounded-tr-xs ${isDark ? 'bg-zinc-800/80' : 'bg-zinc-200'}`} />
              </div>
              {/* Assistant message skeleton */}
              <div className="flex gap-3 w-full px-2">
                <div className={`w-7 h-7 rounded-lg shrink-0 ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
                <div className="flex-1 space-y-2.5 pt-1">
                  <div className={`h-3.5 w-4/5 rounded ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
                  <div className={`h-3.5 w-full rounded ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
                  <div className={`h-3.5 w-3/5 rounded ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
                </div>
              </div>
              {/* User message skeleton 2 */}
              <div className="flex flex-col items-end w-full px-2">
                <div className={`h-9 w-36 rounded-2xl rounded-tr-xs ${isDark ? 'bg-zinc-800/80' : 'bg-zinc-200'}`} />
              </div>
              {/* Assistant message skeleton 2 */}
              <div className="flex gap-3 w-full px-2">
                <div className={`w-7 h-7 rounded-lg shrink-0 ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
                <div className="flex-1 space-y-2.5 pt-1">
                  <div className={`h-3.5 w-3/4 rounded ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
                  <div className={`h-3.5 w-1/2 rounded ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
                </div>
              </div>
            </div>
          ) : !activeThread ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 max-w-sm mx-auto">
              <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${
                isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-orange-500/10 border-orange-500/20 text-orange-600 shadow-xs'
              }`}>
                <FileText className="w-6 h-6 text-orange-500" />
              </div>
              <div className="space-y-1">
                <h3 className={`text-sm font-bold ${isDark ? 'text-zinc-200' : 'text-zinc-900'}`}>Study Session</h3>
                <p className={`text-[10px] leading-relaxed ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
                  Start a study session to learn with Guruji's personal guidance and motivation.
                </p>
              </div>
              <button
                onClick={() => handleCreateNewThread()}
                disabled={isCreatingThread}
                className={`px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 ${
                  isDark ? 'shadow-lg shadow-orange-500/20' : 'shadow-sm'
                }`}
              >
                {isCreatingThread && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Start Study Session</span>
              </button>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center py-8">
              <div className="max-w-md w-full space-y-6 text-center">
                <div className="space-y-2">
                  <FileText className={`w-10 h-10 mx-auto ${isDark ? 'text-zinc-650' : 'text-zinc-400'}`} />
                  <h2 className={`text-sm font-bold ${isDark ? 'text-zinc-200' : 'text-zinc-900'}`}>{activeThread.title}</h2>
                  <p className={`text-xs max-w-xs mx-auto leading-relaxed ${isDark ? 'text-zinc-550' : 'text-zinc-500'}`}>
                    Ask Guruji any study doubts, plan routines, or use slash commands for detailed notes.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 max-w-sm mx-auto">
                  {FULLSCREEN_SUGGESTIONS.map((sug) => (
                    <button
                      key={sug.text}
                      onClick={() => handleSuggestionClick(sug.command)}
                      className={`text-left p-3 rounded-xl border text-[10px] transition cursor-pointer leading-normal ${
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
            <div className="max-w-3xl mx-auto space-y-2">
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

          <div ref={messagesEndRef} />
        </div>

        {/* Input box */}
        {activeThread && (
          <div className="p-3 sm:px-6 sm:pb-5 sm:pt-2 shrink-0 bg-transparent">
            <div className={`max-w-3xl mx-auto rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 flex items-center border ${
              isDark ? 'bg-zinc-900/60 border-zinc-800 shadow-inner' : 'bg-zinc-50 border-zinc-200 shadow-xs'
            }`}>
              <ChatInput
                value={inputValue}
                onChange={setInputValue}
                onSubmit={handleSend}
                isLoading={isLoading}
                isStreaming={isStreaming}
                isFullScreen={true}
              />
            </div>
          </div>
        )}
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
            await deleteThread(threadToDelete.threadId);
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
    </div>
  );
}

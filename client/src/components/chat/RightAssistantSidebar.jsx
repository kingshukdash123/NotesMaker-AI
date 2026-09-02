import { useState, useRef, useEffect } from 'react';
import { Bot, ChevronDown, Plus, Trash2, AlertCircle, ChevronRight, FileText, PanelRight, PictureInPicture, Loader2, Maximize2, Pencil } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAssistantChat } from '../../hooks/useAssistantChat';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

const COMPACT_SUGGESTIONS = [
  { text: 'Ask Guruji a study question', command: '/explain ' },
  { text: 'Solve a math problem step-by-step', command: '/math ' },
  { text: 'Create a focused study checklist', command: '/todo ' },
  { text: 'Draft a summary or email', command: '/email ' }
];

export default function RightAssistantSidebar({ currentUser, isOpen, onClose, mode = 'sidebar', onToggleMode, onZoom }) {
  const { isDark } = useTheme();
  const [showSelector, setShowSelector] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [threadToDelete, setThreadToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingThreadId, setEditingThreadId] = useState(null);
  const [editTitleValue, setEditTitleValue] = useState('');
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
    sendMessage,
    clearThread
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

  const handleSaveRename = (threadId) => {
    if (editTitleValue.trim()) {
      updateThreadMeta(threadId, { title: editTitleValue.trim() });
    }
    setEditingThreadId(null);
  };

  if (!currentUser || !isOpen) return null;

  const activeThread = threads.find(t => t.threadId === activeThreadId);

  const containerClasses = mode === 'sidebar'
    ? `fixed top-[53px] bottom-0 right-0 w-[calc(100vw-1rem)] max-w-sm sm:w-96 lg:static lg:w-80 xl:w-96 lg:h-full z-[85] border-l flex flex-col shrink-0 transition-all duration-300 animate-in slide-in-from-right duration-200 ${
        isDark ? 'border-zinc-900/90 bg-zinc-950' : 'border-orange-200/80 bg-white'
      }`
    : `fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] max-w-sm sm:max-w-md h-[480px] max-h-[82vh] rounded-2xl shadow-2xl z-[110] flex flex-col overflow-hidden backdrop-blur-xl transition-all duration-200 origin-bottom-right animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-200 border ${
        isDark ? 'bg-zinc-950/95 border-zinc-800/90' : 'bg-white/95 border-orange-200'
      }`;

  return (
    <>
      {/* Mobile Backdrop for docked sidebar mode */}
      {mode === 'sidebar' && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-[1px] z-[84] lg:hidden mt-[53px]"
        />
      )}

      <div className={containerClasses}>
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-orange-500/20 to-transparent"></div>

        {/* Header */}
        <div className={`px-4 py-3 border-b flex items-center justify-between shrink-0 h-[53px] ${
          isDark ? 'border-zinc-900 bg-zinc-950' : 'border-orange-100 bg-white'
        }`}>
          {activeThread ? (
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <FileText className={`w-3.5 h-3.5 shrink-0 select-none ${isDark ? 'text-zinc-500' : 'text-orange-600'}`} />
              <button
                onClick={() => setShowSelector(!showSelector)}
                className={`flex items-center gap-1 min-w-0 text-left cursor-pointer transition ${
                  isDark ? 'hover:text-zinc-200' : 'hover:text-orange-700'
                }`}
              >
                <span className={`text-xs font-bold truncate ${isDark ? 'text-zinc-150' : 'text-orange-950'}`}>{activeThread.title}</span>
                <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${showSelector ? 'rotate-180' : ''} ${isDark ? 'text-zinc-550' : 'text-orange-600'}`} />
              </button>
              <button
                type="button"
                onClick={() => createNewThread('Study Session')}
                disabled={isLoading}
                className="btn-icon"
                title="New Chat Page"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <span className={`text-xs font-bold ${isDark ? 'text-zinc-300' : 'text-orange-950'}`}>Guruji — Personal Mentor</span>
          )}

          <div className="flex items-center gap-1 shrink-0">
            {activeThread && messages.length > 0 && !showSelector && (
              <div className="relative">
                {showConfirmClear ? (
                  <div className={`absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1 border rounded px-1.5 py-1 z-50 animate-in fade-in duration-100 w-32 justify-between ${
                    isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-orange-200 shadow-sm'
                  }`}>
                    <button
                      type="button"
                      onClick={() => {
                        clearThread();
                        setShowConfirmClear(false);
                      }}
                      className="text-[8px] font-bold text-red-500 cursor-pointer"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowConfirmClear(false)}
                      className={`text-[8px] font-bold cursor-pointer ${isDark ? 'text-zinc-550' : 'text-orange-700'}`}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowConfirmClear(true)}
                    disabled={isStreaming}
                    className="btn-icon hover:!text-red-500"
                    title="Clear history"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Mode Switcher Button (Hidden on phone view) */}
            {onToggleMode && (
              <button
                type="button"
                onClick={() => onToggleMode(mode === 'sidebar' ? 'floating' : 'sidebar')}
                className="btn-icon !hidden sm:!inline-flex"
                title={mode === 'sidebar' ? "Switch to Floating widget" : "Pin/Dock as Sidebar"}
              >
                {mode === 'sidebar' ? <PictureInPicture className="w-3.5 h-3.5" /> : <PanelRight className="w-3.5 h-3.5" />}
              </button>
            )}

            {/* Zoom to Full Screen Button */}
            {onZoom && (
              <button
                type="button"
                onClick={onZoom}
                className="btn-icon"
                title="Open full screen"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="btn-icon"
              title="Close panel"
            >
              <ChevronRight className="w-4 h-4" />
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
              <div className={`p-3 border-b flex items-center justify-between shrink-0 ${
                isDark ? 'border-zinc-900' : 'border-orange-100'
              }`}>
                <span className={`text-[10px] font-bold uppercase tracking-widest font-mono ${
                  isDark ? 'text-zinc-550' : 'text-orange-700'
                }`}>Workspace Pages</span>
                <button
                  type="button"
                  onClick={async () => {
                    const id = await createNewThread('Study Session');
                    if (id) {
                      selectThread(id);
                      setShowSelector(false);
                    }
                  }}
                  disabled={isLoading}
                  className="btn-secondary px-2.5 py-1 text-[10px] font-bold !rounded-lg"
                >
                  <Plus className="w-3 h-3" />
                  <span>New Page</span>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 custom-scrollbar">
                {threads.length === 0 ? (
                  <div className={`text-center py-8 text-[10px] ${isDark ? 'text-zinc-550' : 'text-orange-700'}`}>
                    No workspace pages. Create a new page.
                  </div>
                ) : (
                  threads.map((t) => {
                    const isActive = t.threadId === activeThreadId;
                    return (
                      <div
                        key={t.threadId}
                        onClick={() => {
                          if (editingThreadId !== t.threadId) {
                            selectThread(t.threadId);
                            setShowSelector(false);
                          }
                        }}
                        className={`flex items-center justify-between p-2.5 rounded-lg border transition duration-150 cursor-pointer ${
                          isActive
                            ? isDark 
                              ? 'bg-orange-950/15 border-orange-900/35 text-orange-400 font-bold' 
                              : 'bg-orange-100 border-orange-300 text-orange-700 font-bold shadow-xs'
                            : isDark
                              ? 'bg-zinc-900/10 border-zinc-900/80 hover:border-zinc-800 text-zinc-400'
                              : 'bg-orange-50/50 border-orange-200/70 hover:border-orange-300 text-orange-950'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                          <FileText className={`w-3.5 h-3.5 shrink-0 select-none ${isDark ? 'text-zinc-550' : 'text-orange-600'}`} />
                          {editingThreadId === t.threadId ? (
                            <input
                              type="text"
                              value={editTitleValue}
                              onChange={(e) => setEditTitleValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveRename(t.threadId);
                                } else if (e.key === 'Escape') {
                                  setEditingThreadId(null);
                                }
                              }}
                              onBlur={() => handleSaveRename(t.threadId)}
                              className={`border rounded px-1.5 py-0.5 text-xs outline-none w-full font-normal ${
                                isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-white border-orange-300 text-orange-950'
                              }`}
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <span className="text-xs truncate font-medium">{t.title}</span>
                          )}
                        </div>
                        
                        {editingThreadId !== t.threadId && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingThreadId(t.threadId);
                                setEditTitleValue(t.title);
                              }}
                              className={`p-1 rounded transition cursor-pointer ${isDark ? 'text-zinc-650 hover:text-zinc-300' : 'text-orange-600 hover:text-orange-950'}`}
                              title="Rename page"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setThreadToDelete(t.threadId);
                              }}
                              className={`p-1 rounded transition cursor-pointer ${isDark ? 'text-zinc-650 hover:text-red-500' : 'text-orange-600 hover:text-red-600'}`}
                              title="Delete page"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* 2. Scrollable Messages flow */}
          <div className={`flex-1 overflow-y-auto px-4 py-3 space-y-3 custom-scrollbar ${
            isDark ? 'bg-black/5' : 'bg-[#fffcf8]'
          }`}>
            {isLoadingHistory ? (
              <div className="space-y-4 py-4 animate-pulse">
                <div className={`h-4 w-1/3 rounded ${isDark ? 'bg-zinc-900' : 'bg-orange-100'}`} />
                <div className={`h-4 w-5/6 rounded ${isDark ? 'bg-zinc-900' : 'bg-orange-100'}`} />
                <div className={`h-4 w-2/3 rounded ${isDark ? 'bg-zinc-900' : 'bg-orange-100'}`} />
              </div>
            ) : !activeThread ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
                  isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-orange-100 border-orange-300 shadow-xs'
                }`}>
                  <Bot className="w-5 h-5 text-orange-500" />
                </div>
                <h4 className={`text-xs font-bold ${isDark ? 'text-zinc-300' : 'text-orange-950'}`}>Guruji — Personal Mentor</h4>
                <p className={`text-[10px] max-w-[200px] leading-relaxed ${isDark ? 'text-zinc-500' : 'text-orange-800'}`}>
                  Start a study session to learn and study with Guruji's guidance.
                </p>
                <button
                  onClick={async () => {
                    const id = await createNewThread('Study Session');
                    if (id) selectThread(id);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-bold transition cursor-pointer shadow-sm"
                >
                  Start Session with Guruji
                </button>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col justify-center py-4">
                <div className="max-w-[280px] mx-auto space-y-4">
                  <div className="space-y-1 text-center">
                    <FileText className={`w-8 h-8 mx-auto mb-2 ${isDark ? 'text-zinc-650' : 'text-orange-400'}`} />
                    <h3 className={`text-xs font-bold ${isDark ? 'text-zinc-200' : 'text-orange-950'}`}>{activeThread.title}</h3>
                    <p className={`text-[10px] leading-relaxed ${isDark ? 'text-zinc-550' : 'text-orange-800'}`}>
                      Ask Guruji any study doubt, discuss your goals, or use slash commands.
                    </p>
                  </div>
                  <div className={`space-y-1.5 border-t pt-4 flex flex-col ${isDark ? 'border-zinc-900' : 'border-orange-100'}`}>
                    {COMPACT_SUGGESTIONS.map((sug) => (
                      <button
                        key={sug.text}
                        onClick={() => handleSuggestionClick(sug.command)}
                        className={`text-left px-2.5 py-2 rounded-lg border text-[10px] transition cursor-pointer ${
                          isDark 
                            ? 'border-zinc-900 bg-zinc-900/30 hover:bg-zinc-900/60 text-zinc-350' 
                            : 'border-orange-200/80 bg-orange-50/70 hover:bg-orange-100 text-orange-950'
                        }`}
                      >
                        {sug.text}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className={`divide-y ${isDark ? 'divide-zinc-900/30' : 'divide-orange-100'}`}>
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
              <div className="p-3 rounded-xl bg-red-950/20 border border-red-500/30 text-red-300 text-[10px] flex items-center gap-2 max-w-[90%] mx-auto">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* 3. Input container at bottom */}
          {activeThread && !showSelector && (
            <div className={`p-3 border-t shrink-0 ${
              isDark ? 'border-zinc-900/80 bg-zinc-950' : 'border-orange-100 bg-white'
            }`}>
              <div className={`rounded-2xl px-2.5 py-1.5 flex items-end border ${
                isDark ? 'bg-zinc-900/40 border-zinc-800/80 shadow-inner' : 'bg-orange-50/50 border-orange-200 shadow-xs'
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

        {/* Custom Confirmation Modal for Deleting page */}
        {threadToDelete && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className={`border rounded-xl p-4 w-full max-w-[280px] shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200 ${
              isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-orange-200'
            }`}>
              <div className="space-y-1">
                <h4 className={`text-xs font-bold ${isDark ? 'text-zinc-200' : 'text-orange-950'}`}>Delete page chat history?</h4>
                <p className={`text-[10px] leading-relaxed ${isDark ? 'text-zinc-550' : 'text-orange-800'}`}>
                  This will permanently delete this conversation page from your workspace.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  disabled={isDeleting}
                  onClick={async () => {
                    setIsDeleting(true);
                    try {
                      await deleteThread(threadToDelete);
                    } catch (err) {
                      console.error('Delete failed:', err);
                    } finally {
                      setIsDeleting(false);
                      setThreadToDelete(null);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-[10px] font-black transition cursor-pointer flex-1 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
                <button
                  disabled={isDeleting}
                  onClick={() => setThreadToDelete(null)}
                  className={`px-3 py-1.5 rounded-lg border transition cursor-pointer flex-1 disabled:opacity-50 text-[10px] font-bold ${
                    isDark ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-350' : 'bg-orange-50 border-orange-200 text-orange-900 hover:bg-orange-100'
                  }`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

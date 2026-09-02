import { useState, useRef, useEffect } from 'react';
import { Bot, Plus, Trash2, FileText, Loader2, Pencil, Menu, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAssistantChat } from '../../hooks/useAssistantChat';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

const FULLSCREEN_SUGGESTIONS = [
  { text: 'Explain a complex concept', command: '/explain ' },
  { text: 'Solve a math formula step-by-step', command: '/math ' },
  { text: 'Create a structured study checklist', command: '/todo ' },
  { text: 'Draft a summary or email response', command: '/email ' }
];

export default function AssistantFullScreen({ currentUser }) {
  const { isDark } = useTheme();
  const [inputValue, setInputValue] = useState('');
  const [threadToDelete, setThreadToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [editingThreadId, setEditingThreadId] = useState(null);
  const [editTitleValue, setEditTitleValue] = useState('');
  const [isThreadDrawerOpen, setIsThreadDrawerOpen] = useState(false);
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
    sendMessage,
    clearThread
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

  const handleSaveRename = (threadId) => {
    if (editTitleValue.trim()) {
      updateThreadMeta(threadId, { title: editTitleValue.trim() });
    }
    setEditingThreadId(null);
  };

  if (!currentUser) {
    return (
      <div className={`h-full flex items-center justify-center ${isDark ? 'text-zinc-500' : 'text-orange-700'}`}>
        Please sign in to access the assistant.
      </div>
    );
  }

  const activeThread = threads.find(t => t.threadId === activeThreadId);

  const renderThreadList = (isMobile = false) => (
    <div className={`flex flex-col h-full ${
      isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-white text-orange-950'
    }`}>
      <div className={`p-3.5 sm:p-4 border-b flex items-center justify-between shrink-0 h-[53px] ${
        isDark ? 'border-zinc-900' : 'border-orange-100'
      }`}>
        <span className={`text-[10px] font-bold uppercase tracking-widest font-mono select-none ${
          isDark ? 'text-zinc-550' : 'text-orange-700'
        }`}>AI Chat Pages</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={async () => {
              const id = await createNewThread('Study Session');
              if (id) {
                selectThread(id);
                if (isMobile) setIsThreadDrawerOpen(false);
              }
            }}
            disabled={isLoading}
            className="btn-icon"
            title="New Chat Page"
          >
            <Plus className="w-4 h-4" />
          </button>
          {isMobile && (
            <button
              type="button"
              onClick={() => setIsThreadDrawerOpen(false)}
              className="btn-icon"
              title="Close pages drawer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
        {isLoadingHistory && threads.length === 0 ? (
          <div className="space-y-3 py-2 animate-pulse">
            <div className={`h-8 rounded-lg ${isDark ? 'bg-zinc-900' : 'bg-orange-100'}`} />
            <div className={`h-8 rounded-lg ${isDark ? 'bg-zinc-900' : 'bg-orange-100'}`} />
            <div className={`h-8 rounded-lg ${isDark ? 'bg-zinc-900' : 'bg-orange-100'}`} />
          </div>
        ) : threads.length === 0 ? (
          <div className={`text-center py-8 text-[10px] select-none ${isDark ? 'text-zinc-550' : 'text-orange-700'}`}>
            No chat pages created.
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
                    if (isMobile) setIsThreadDrawerOpen(false);
                  }
                }}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl border transition duration-150 cursor-pointer group ${
                  isActive
                    ? isDark
                      ? 'bg-orange-950/15 border-orange-900/35 text-orange-400 font-bold font-sans'
                      : 'bg-orange-100 border-orange-300 text-orange-700 font-bold font-sans shadow-xs'
                    : isDark
                      ? 'bg-zinc-900/10 border-zinc-900 hover:border-zinc-800 text-zinc-400 font-sans'
                      : 'bg-white border-orange-200/70 hover:border-orange-300 text-orange-950 font-sans'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                  <FileText className={`w-3.5 h-3.5 shrink-0 select-none ${isDark ? 'text-zinc-500' : 'text-orange-600'}`} />
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
                        isDark ? 'bg-zinc-950 border-zinc-850 text-zinc-100' : 'bg-white border-orange-300 text-orange-950'
                      }`}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="text-xs truncate font-medium">{t.title}</span>
                  )}
                </div>
                
                {editingThreadId !== t.threadId && (
                  <div className="flex items-center gap-1 shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
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
  );

  return (
    <div className={`h-full w-full flex rounded-xl overflow-hidden relative z-10 border ${
      isDark ? 'bg-black border-zinc-900' : 'bg-white border-orange-200 shadow-sm'
    }`}>
      {/* 1. Desktop Left Sidebar thread list */}
      <div className={`hidden md:flex md:w-60 lg:w-64 border-r flex-col h-full shrink-0 ${
        isDark ? 'border-zinc-900 bg-zinc-950' : 'border-orange-100 bg-orange-50/30'
      }`}>
        {renderThreadList(false)}
      </div>

      {/* Mobile Drawer Overlay for Thread List */}
      {isThreadDrawerOpen && (
        <div className="fixed inset-0 z-[120] md:hidden flex">
          <div 
            onClick={() => setIsThreadDrawerOpen(false)} 
            className="fixed inset-0 bg-black/70 backdrop-blur-xs" 
          />
          <div className="relative w-72 max-w-[80vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {renderThreadList(true)}
          </div>
        </div>
      )}

      {/* 2. Main Chat Viewport */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-transparent relative">
        {/* Top Header */}
        <div className={`px-3 sm:px-6 py-3 border-b flex items-center justify-between shrink-0 h-[53px] gap-2 ${
          isDark ? 'border-zinc-900 bg-zinc-950/80' : 'border-orange-100 bg-white'
        }`}>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => setIsThreadDrawerOpen(true)}
              className="btn-icon md:hidden shrink-0"
              title="Toggle chat pages"
              aria-label="Toggle chat pages"
            >
              <Menu className="w-4 h-4" />
            </button>

            {activeThread ? (
              <div className="flex items-center gap-2 min-w-0">
                <FileText className={`w-4 h-4 shrink-0 select-none ${isDark ? 'text-zinc-500' : 'text-orange-600'}`} />
                <h2 className={`text-xs sm:text-sm font-bold truncate ${isDark ? 'text-zinc-150' : 'text-orange-950'}`}>
                  {activeThread.title}
                </h2>
              </div>
            ) : (
              <span className={`text-xs sm:text-sm font-bold truncate ${isDark ? 'text-zinc-300' : 'text-orange-950'}`}>Guruji's Study Desk</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {activeThread && messages.length > 0 && (
              <div className="relative">
                {showConfirmClear ? (
                  <div className={`flex items-center gap-1 border rounded-lg px-2 py-1 z-50 animate-in fade-in duration-100 ${
                    isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-orange-200 shadow-sm'
                  }`}>
                    <span className={`text-[10px] mr-1 ${isDark ? 'text-zinc-400' : 'text-orange-900'}`}>Clear all?</span>
                    <button
                      onClick={() => {
                        clearThread();
                        setShowConfirmClear(false);
                      }}
                      className="text-[10px] font-bold text-red-500 hover:text-red-400 px-1.5 py-0.5 rounded cursor-pointer"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setShowConfirmClear(false)}
                      className={`text-[10px] px-1.5 py-0.5 rounded cursor-pointer ${isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-orange-700 hover:text-orange-900'}`}
                    >
                      No
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
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Messages viewport */}
        <div className={`flex-1 overflow-y-auto px-3 sm:px-6 md:px-8 py-4 sm:py-6 space-y-4 custom-scrollbar min-h-0 ${
          isDark ? 'bg-black/10' : 'bg-[#fffcf8]'
        }`}>
          {isLoadingHistory ? (
            <div className="space-y-6 py-6 animate-pulse max-w-3xl mx-auto">
              <div className={`h-4 w-1/4 rounded ${isDark ? 'bg-zinc-900' : 'bg-orange-100'}`} />
              <div className={`h-10 w-full rounded-xl ${isDark ? 'bg-zinc-900' : 'bg-orange-100'}`} />
              <div className={`h-4 w-1/3 rounded ${isDark ? 'bg-zinc-900' : 'bg-orange-100'}`} />
              <div className={`h-20 w-5/6 rounded-xl ${isDark ? 'bg-zinc-900' : 'bg-orange-100'}`} />
            </div>
          ) : !activeThread ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 max-w-sm mx-auto">
              <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${
                isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-orange-100 border-orange-300 shadow-xs'
              }`}>
                <Bot className="w-6 h-6 text-orange-500" />
              </div>
              <div className="space-y-1">
                <h3 className={`text-sm font-bold ${isDark ? 'text-zinc-200' : 'text-orange-950'}`}>Guruji's Study Desk</h3>
                <p className={`text-[10px] leading-relaxed ${isDark ? 'text-zinc-500' : 'text-orange-800'}`}>
                  Start a study session to learn with Guruji's personal guidance and motivation.
                </p>
              </div>
              <button
                onClick={async () => {
                  const id = await createNewThread('Study Session');
                  if (id) selectThread(id);
                }}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition cursor-pointer shadow-lg shadow-orange-500/20"
              >
                Start Session with Guruji
              </button>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center py-8">
              <div className="max-w-md w-full space-y-6 text-center">
                <div className="space-y-2">
                  <FileText className={`w-10 h-10 mx-auto ${isDark ? 'text-zinc-650' : 'text-orange-400'}`} />
                  <h2 className={`text-sm font-bold ${isDark ? 'text-zinc-200' : 'text-orange-950'}`}>{activeThread.title}</h2>
                  <p className={`text-xs max-w-xs mx-auto leading-relaxed ${isDark ? 'text-zinc-550' : 'text-orange-800'}`}>
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
            <div className={`max-w-3xl mx-auto divide-y ${isDark ? 'divide-zinc-900/30' : 'divide-orange-100'}`}>
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
          <div className={`p-2.5 sm:p-4 border-t shrink-0 ${
            isDark ? 'border-zinc-900 bg-zinc-950' : 'border-orange-100 bg-white'
          }`}>
            <div className={`max-w-3xl mx-auto rounded-2xl px-3 py-1.5 sm:py-2 flex items-end border ${
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

      {/* Delete Confirmation Modal */}
      {threadToDelete && (
        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className={`border rounded-2xl p-5 sm:p-6 w-full max-w-[calc(100vw-2rem)] sm:max-w-sm shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200 ${
            isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-orange-200'
          }`}>
            <div className="space-y-1.5">
              <h4 className={`text-sm font-bold ${isDark ? 'text-zinc-100' : 'text-orange-950'}`}>Delete page chat history?</h4>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-zinc-400' : 'text-orange-800'}`}>
                This will permanently delete this conversation page and its context from your workspace.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
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
                className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition cursor-pointer flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  'Delete'
                )}
              </button>
              <button
                disabled={isDeleting}
                onClick={() => setThreadToDelete(null)}
                className={`px-4 py-2 rounded-xl border transition cursor-pointer flex-1 disabled:opacity-50 text-xs font-bold ${
                  isDark ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300' : 'bg-orange-50 border-orange-200 text-orange-900 hover:bg-orange-100'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

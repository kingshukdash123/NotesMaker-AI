import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, ChevronDown, Plus, Trash2, Brain, AlertCircle, ChevronRight, Sliders, ChevronUp, FileText, PanelRight, PictureInPicture, Loader2, Maximize2, Pencil } from 'lucide-react';
import { useAssistantChat } from '../../hooks/useAssistantChat';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

const COMPACT_SUGGESTIONS = [
  { text: 'Explain a study concept', command: '/explain ' },
  { text: 'Solve a math calculation', command: '/math ' },
  { text: 'Create a subject todo list', command: '/todo ' },
  { text: 'Draft a quick summary email', command: '/email ' }
];

export default function RightAssistantSidebar({ currentUser, isOpen, onClose, mode = 'sidebar', onToggleMode, onZoom }) {
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
    summary,
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
    ? "fixed top-[53px] bottom-0 right-0 w-80 sm:w-96 lg:static lg:h-full z-[85] border-l border-zinc-900/90 bg-zinc-950 flex flex-col shrink-0 transition-all duration-300 animate-in slide-in-from-right duration-200"
    : "fixed bottom-6 right-6 w-80 sm:w-96 h-[500px] bg-zinc-950/95 border border-zinc-800/90 rounded-2xl shadow-2xl z-[110] flex flex-col overflow-hidden backdrop-blur-xl transition-all duration-200 origin-bottom-right animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-200";

  return (
    <div className={containerClasses}>
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-orange-500/10 to-transparent"></div>

      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-900 bg-zinc-950 flex items-center justify-between shrink-0 h-[53px]">
        {activeThread ? (
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <FileText className="w-3.5 h-3.5 text-zinc-500 shrink-0 select-none" />
            <button
              onClick={() => setShowSelector(!showSelector)}
              className="flex items-center gap-1 min-w-0 text-left cursor-pointer hover:text-zinc-200 transition"
            >
              <span className="text-xs font-bold text-zinc-150 truncate">{activeThread.title}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-zinc-550 shrink-0 transition-transform ${showSelector ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={() => createNewThread('Study Session')}
              disabled={isLoading}
              className="p-1 rounded hover:bg-zinc-900 text-zinc-500 hover:text-zinc-300 transition cursor-pointer"
              title="New Chat Page"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <span className="text-xs font-bold text-zinc-300">Nova Assistant</span>
        )}

        <div className="flex items-center gap-2.5 shrink-0">
          {summary && (
            <div
              className="flex items-center justify-center p-1 rounded bg-orange-950/25 border border-orange-900/30 text-orange-400"
              title={`Memory Context: ${summary}`}
            >
              <Brain className="w-3.5 h-3.5 text-orange-455 animate-pulse" />
            </div>
          )}
          
          {activeThread && messages.length > 0 && !showSelector && (
            <div className="relative">
              {showConfirmClear ? (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded px-1.5 py-1 z-50 animate-in fade-in duration-100 w-32 justify-between">
                  <button
                    onClick={() => {
                      clearThread();
                      setShowConfirmClear(false);
                    }}
                    className="text-[8px] font-bold text-red-400 cursor-pointer"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setShowConfirmClear(false)}
                    className="text-[8px] font-bold text-zinc-550 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowConfirmClear(true)}
                  disabled={isStreaming}
                  className="p-1 rounded hover:bg-zinc-900 text-zinc-500 hover:text-red-400 transition cursor-pointer"
                  title="Clear history"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Mode Switcher Button */}
          {onToggleMode && (
            <button
              onClick={onToggleMode}
              className="p-1 rounded hover:bg-zinc-900 text-zinc-500 hover:text-zinc-300 transition cursor-pointer flex items-center justify-center"
              title={mode === 'sidebar' ? "Switch to Floating widget" : "Pin/Dock as Sidebar"}
            >
              {mode === 'sidebar' ? <PictureInPicture className="w-3.5 h-3.5" /> : <PanelRight className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Zoom to Full Screen Button */}
          {onZoom && (
            <button
              onClick={onZoom}
              className="p-1 rounded hover:bg-zinc-900 text-zinc-500 hover:text-zinc-300 transition cursor-pointer flex items-center justify-center"
              title="Open full screen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-zinc-900 text-zinc-500 hover:text-zinc-300 transition cursor-pointer"
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
          <div className="absolute inset-0 bg-zinc-950 z-[130] flex flex-col animate-in fade-in duration-150">
            <div className="p-3 border-b border-zinc-900 flex items-center justify-between shrink-0">
              <span className="text-[10px] font-bold text-zinc-550 uppercase tracking-widest font-mono">Workspace Pages</span>
              <button
                onClick={async () => {
                  const id = await createNewThread('Study Session');
                  if (id) {
                    selectThread(id);
                    setShowSelector(false);
                  }
                }}
                disabled={isLoading}
                className="flex items-center gap-1 px-2.5 py-1 text-[10px] rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:text-white transition cursor-pointer text-zinc-350"
              >
                <Plus className="w-3 h-3" />
                <span>New Page</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 custom-scrollbar">
              {threads.length === 0 ? (
                <div className="text-center py-8 text-[10px] text-zinc-550">
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
                          ? 'bg-orange-950/15 border-orange-900/35 text-orange-400 font-bold'
                          : 'bg-zinc-900/10 border-zinc-900/80 hover:border-zinc-800 text-zinc-400'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                        <FileText className="w-3.5 h-3.5 text-zinc-550 shrink-0 select-none" />
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
                            className="bg-zinc-950 border border-zinc-800 text-zinc-100 rounded px-1.5 py-0.5 text-xs outline-none w-full font-normal"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span className="text-xs truncate">{t.title}</span>
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
                            className="p-1 rounded text-zinc-650 hover:text-zinc-300 transition cursor-pointer"
                            title="Rename page"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setThreadToDelete(t.threadId);
                            }}
                            className="p-1 rounded text-zinc-650 hover:text-red-500 transition cursor-pointer"
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
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 custom-scrollbar bg-black/5">
          {isLoadingHistory ? (
            <div className="space-y-4 py-4 animate-pulse">
              <div className="h-4 w-1/3 bg-zinc-900 rounded" />
              <div className="h-4 w-5/6 bg-zinc-900 rounded" />
              <div className="h-4 w-2/3 bg-zinc-900 rounded" />
            </div>
          ) : !activeThread ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                <Bot className="w-5 h-5 text-orange-500" />
              </div>
              <h4 className="text-xs font-bold text-zinc-300">Nova AI Companion</h4>
              <p className="text-[10px] text-zinc-500 max-w-[200px] leading-relaxed">
                Create a study session page to start conversing with memory context.
              </p>
              <button
                onClick={async () => {
                  const id = await createNewThread('Study Session');
                  if (id) selectThread(id);
                }}
                className="px-3 py-1.5 rounded-lg bg-zinc-150 hover:bg-white text-zinc-950 text-[10px] font-bold transition cursor-pointer"
              >
                Create Page
              </button>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col justify-center py-4">
              <div className="max-w-[280px] mx-auto space-y-4">
                <div className="space-y-1 text-center">
                  <FileText className="w-8 h-8 text-zinc-650 mx-auto mb-2" />
                  <h3 className="text-xs font-bold text-zinc-200">{activeThread.title}</h3>
                  <p className="text-[10px] text-zinc-550 leading-relaxed">
                    Ask questions, plan schedules, or draft math/code equations.
                  </p>
                </div>
                <div className="space-y-1.5 border-t border-zinc-900 pt-4 flex flex-col">
                  {COMPACT_SUGGESTIONS.map((sug) => (
                    <button
                      key={sug.text}
                      onClick={() => handleSuggestionClick(sug.command)}
                      className="text-left px-2.5 py-2 rounded-lg border border-zinc-900 bg-zinc-900/30 hover:bg-zinc-900/60 text-[10px] text-zinc-350 transition cursor-pointer"
                    >
                      {sug.text}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-zinc-900/30">
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

        {/* 3. Notion AI Input container at bottom */}
        {activeThread && !showSelector && (
          <div className="p-4 border-t border-zinc-900/80 bg-zinc-950 shrink-0">
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-2.5 flex flex-col gap-1.5 shadow-inner">
              {/* Chat Input row */}
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
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 w-full max-w-[280px] shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-zinc-200">Delete page chat history?</h4>
              <p className="text-[10px] text-zinc-550 leading-relaxed">
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
                className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-black text-[10px] font-black transition cursor-pointer flex-1 flex items-center justify-center gap-1.5 disabled:opacity-50"
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
                className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-350 text-[10px] font-bold transition cursor-pointer flex-1 disabled:opacity-50"
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

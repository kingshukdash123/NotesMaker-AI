import React, { useState, useRef, useEffect } from 'react';
import { Bot, Plus, Trash2, Brain, AlertCircle, FileText, Loader2, ChevronUp, Pencil } from 'lucide-react';
import { useAssistantChat } from '../../hooks/useAssistantChat';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

const FULLSCREEN_SUGGESTIONS = [
  { text: 'Explain a study concept in detail', command: '/explain ' },
  { text: 'Solve a math formula step-by-step', command: '/math ' },
  { text: 'Create a structured checklist or todo', command: '/todo ' },
  { text: 'Draft an email response or summary', command: '/email ' }
];

export default function AssistantFullScreen({ currentUser }) {
  const [inputValue, setInputValue] = useState('');
  const [threadToDelete, setThreadToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
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
      <div className="h-full flex items-center justify-center text-zinc-500">
        Please sign in to access the assistant.
      </div>
    );
  }

  const activeThread = threads.find(t => t.threadId === activeThreadId);

  return (
    <div className="h-full w-full flex bg-black border border-zinc-900 rounded-xl overflow-hidden relative z-10">
      
      {/* 1. Left Sidebar thread list */}
      <div className="w-64 border-r border-zinc-900 bg-zinc-950 flex flex-col h-full shrink-0">
        <div className="p-4 border-b border-zinc-900 flex items-center justify-between shrink-0 h-[53px]">
          <span className="text-[10px] font-bold text-zinc-550 uppercase tracking-widest font-mono select-none">AI Chat Pages</span>
          <button
            onClick={() => createNewThread('Study Session')}
            disabled={isLoading}
            className="p-1 rounded hover:bg-zinc-900 text-zinc-500 hover:text-zinc-300 transition cursor-pointer"
            title="New Chat Page"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
          {isLoadingHistory && threads.length === 0 ? (
            <div className="space-y-3 py-2 animate-pulse">
              <div className="h-8 bg-zinc-900 rounded-lg" />
              <div className="h-8 bg-zinc-900 rounded-lg" />
              <div className="h-8 bg-zinc-900 rounded-lg" />
            </div>
          ) : threads.length === 0 ? (
            <div className="text-center py-8 text-[10px] text-zinc-550 select-none">
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
                    }
                  }}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl border transition duration-150 cursor-pointer group ${
                    isActive
                      ? 'bg-orange-950/15 border-orange-900/35 text-orange-400 font-bold font-sans'
                      : 'bg-zinc-900/10 border-zinc-900 hover:border-zinc-800 text-zinc-400 font-sans'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                    <FileText className="w-3.5 h-3.5 text-zinc-500 shrink-0 select-none" />
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
                        className="bg-zinc-950 border border-zinc-850 text-zinc-100 rounded px-1.5 py-0.5 text-xs outline-none w-full font-normal"
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
                        className="p-1 rounded text-zinc-650 hover:text-zinc-300 transition cursor-pointer opacity-0 group-hover:opacity-100"
                        title="Rename Chat"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setThreadToDelete(t.threadId);
                        }}
                        className="p-1 rounded text-zinc-650 hover:text-red-500 transition cursor-pointer opacity-0 group-hover:opacity-100"
                        title="Delete Chat"
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

      {/* 2. Main Chat Conversation Screen */}
      <div className="flex-1 flex flex-col h-full bg-black min-w-0">
        
        {/* Chat header */}
        <div className="px-6 py-3 border-b border-zinc-900 bg-zinc-950 flex items-center justify-between shrink-0 h-[53px]">
          {activeThread ? (
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="w-4 h-4 text-zinc-400 shrink-0 select-none" />
              <h2 className="text-xs font-bold text-zinc-150 truncate">{activeThread.title}</h2>
            </div>
          ) : (
            <span className="text-xs font-bold text-zinc-300">Nova AI Chat Workspace</span>
          )}

          <div className="flex items-center gap-3 shrink-0">
            {/* {summary && (
              <div
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-950/20 border border-orange-900/30 text-orange-400 text-[10px] select-none font-bold"
                title={`Context summary: ${summary}`}
              >
                <Brain className="w-3.5 h-3.5 animate-pulse" />
                <span>Memory Active</span>
              </div>
            )} */}

            {activeThread && messages.length > 0 && (
              <div className="relative">
                {showConfirmClear ? (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 z-40 animate-in fade-in duration-100 w-32 justify-between">
                    <button
                      onClick={() => {
                        clearThread();
                        setShowConfirmClear(false);
                      }}
                      className="text-[9px] font-bold text-red-400 cursor-pointer"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => setShowConfirmClear(false)}
                      className="text-[9px] font-bold text-zinc-550 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowConfirmClear(true)}
                    disabled={isStreaming}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] rounded-lg border border-zinc-800 hover:border-red-900/35 hover:text-red-400 transition cursor-pointer text-zinc-400"
                    title="Wipe conversation messages"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear Chat</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Messages list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-scrollbar bg-black/5">
          {isLoadingHistory && messages.length === 0 ? (
            <div className="space-y-6 py-6 animate-pulse max-w-3xl mx-auto">
              <div className="h-4 w-1/4 bg-zinc-900 rounded" />
              <div className="h-10 w-full bg-zinc-900 rounded-xl" />
              <div className="h-4 w-1/3 bg-zinc-900 rounded" />
              <div className="h-20 w-5/6 bg-zinc-900 rounded-xl" />
            </div>
          ) : !activeThread ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 max-w-sm mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center">
                <Bot className="w-6 h-6 text-orange-500" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-zinc-200">Spacious Full-Screen AI Chat</h3>
                <p className="text-[10px] text-zinc-500 leading-relaxed">
                  Start a new study session thread in this split-screen layout to converse with memory recall.
                </p>
              </div>
              <button
                onClick={async () => {
                  const id = await createNewThread('Study Session');
                  if (id) selectThread(id);
                }}
                className="px-4 py-2 rounded-xl bg-white text-zinc-950 text-xs font-bold transition cursor-pointer shadow-lg"
              >
                Create Study Session
              </button>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center py-8">
              <div className="max-w-md w-full space-y-6 text-center">
                <div className="space-y-2">
                  <FileText className="w-10 h-10 text-zinc-650 mx-auto" />
                  <h2 className="text-sm font-bold text-zinc-200">{activeThread.title}</h2>
                  <p className="text-xs text-zinc-550 max-w-xs mx-auto leading-relaxed">
                    Ask questions, map homework planners, outline code tasks, or draft complex equations.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2.5 max-w-sm mx-auto">
                  {FULLSCREEN_SUGGESTIONS.map((sug) => (
                    <button
                      key={sug.text}
                      onClick={() => handleSuggestionClick(sug.command)}
                      className="text-left p-3 rounded-xl border border-zinc-900 bg-zinc-900/30 hover:bg-zinc-900/60 text-[10px] text-zinc-350 transition cursor-pointer leading-normal"
                    >
                      {sug.text}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto divide-y divide-zinc-900/30">
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
          <div className="p-4 border-t border-zinc-900 bg-zinc-950 shrink-0">
            <div className="max-w-3xl mx-auto bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-3 flex flex-col gap-2 shadow-inner">
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

      {/* 3. Custom Delete confirmation modal */}
      {threadToDelete && (
        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 w-full max-w-[300px] shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200">
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
                className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-black text-xs font-black transition cursor-pointer flex-1 flex items-center justify-center gap-1.5 disabled:opacity-50"
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
                className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-350 text-xs font-bold transition cursor-pointer flex-1 disabled:opacity-50"
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

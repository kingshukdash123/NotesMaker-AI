import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Loader2, AlertCircle, Trash2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { askVideoQuestionStream } from '../services/server/api';
import { saveVideoQnAChat, getVideoQnAChat, deleteVideoQnAChat } from '../services/firebase/notesService';
import MarkdownRenderer from './common/MarkdownRenderer';

export default function VideoQa({ videoId, currentUser }) {
  const { isDark } = useTheme();
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Load chat history from Firestore
  useEffect(() => {
    let active = true;
    async function loadChatHistory() {
      if (!currentUser || !videoId) {
        setMessages([]);
        return;
      }
      try {
        setIsHistoryLoading(true);
        setError(null);
        const history = await getVideoQnAChat(currentUser.uid, videoId);
        if (active) {
          setMessages(history);
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
        if (active) {
          setError('Failed to load chat history from Firestore.');
        }
      } finally {
        if (active) {
          setIsHistoryLoading(false);
        }
      }
    }
    loadChatHistory();
    return () => {
      active = false;
    };
  }, [videoId, currentUser]);

  const getCleanChatHistory = (msgs) => {
    const clean = [];
    for (let i = 0; i < msgs.length; i++) {
      if (msgs[i].sender === 'assistant' && msgs[i].isError) {
        if (clean.length > 0 && clean[clean.length - 1].sender === 'user') {
          clean.pop();
        }
      } else {
        clean.push(msgs[i]);
      }
    }
    return clean;
  };

  const handleDeleteChat = async () => {
    if (!currentUser || !videoId) return;

    try {
      setIsDeleting(true);
      await deleteVideoQnAChat(currentUser.uid, videoId);
      setMessages([]);
      setShowConfirmDelete(false);
    } catch (err) {
      console.error('Failed to delete chat:', err);
      setError('Failed to clear chat history.');
      setShowConfirmDelete(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim() || !videoId) return;

    const currentQuestion = question.trim();
    setQuestion('');
    setError(null);
    setIsLoading(true);

    const chatHistory = getCleanChatHistory(messages);

    // Append user question
    const newMessages = [
      ...chatHistory,
      { sender: 'user', text: currentQuestion, timestamp: new Date().toISOString() }
    ];
    setMessages(newMessages);

    // Append assistant placeholder
    let assistantAnswer = '';
    setMessages((prev) => [
      ...prev,
      {
        sender: 'assistant',
        text: '',
        timestamp: new Date().toISOString()
      }
    ]);

    try {
      const idToken = currentUser ? await currentUser.getIdToken() : null;
      const userId = currentUser ? currentUser.uid : null;

      await askVideoQuestionStream(
        videoId,
        currentQuestion,
        chatHistory,
        userId,
        idToken,
        (chunk) => {
          assistantAnswer += chunk;
          setMessages((prev) => {
            const updated = [...prev];
            if (updated.length > 0) {
              const lastMsg = updated[updated.length - 1];
              if (lastMsg.sender === 'assistant') {
                lastMsg.text = assistantAnswer;
              }
            }
            return updated;
          });
        },
        (err) => {
          throw err;
        }
      );

      // Save complete updated conversation to Firestore
      if (userId) {
        const finalMessages = [
          ...newMessages,
          {
            sender: 'assistant',
            text: assistantAnswer,
            timestamp: new Date().toISOString()
          }
        ];
        await saveVideoQnAChat(userId, videoId, getCleanChatHistory(finalMessages));
      }
    } catch (err) {
      console.error('Q&A submit error:', err);
      setError(err.message || 'An error occurred while answering your question.');
      setMessages((prev) => {
        const updated = [...prev];
        if (updated.length > 0) {
          const lastMsg = updated[updated.length - 1];
          if (lastMsg.sender === 'assistant') {
            if (!lastMsg.text) {
              lastMsg.text = "Sorry, I couldn't generate an answer due to an API error. Please check your keys or verify that notes generation finished successfully.";
              lastMsg.isError = true;
            } else {
              lastMsg.isError = true;
            }
          }
        }
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!videoId) {
    return (
      <div className="max-w-xl mx-auto my-12 px-4">
        <div className="relative border border-zinc-800 bg-zinc-950/30 backdrop-blur-md rounded-2xl p-8 sm:p-10 text-center shadow-2xl overflow-hidden flex flex-col items-center">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[1px] bg-gradient-to-r from-transparent via-zinc-500/35 to-transparent"></div>
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-center text-zinc-455 mb-6">
            <MessageSquare className="w-6 h-6 text-zinc-455" />
          </div>
          <h3 className="text-base font-bold text-zinc-200 mb-2">Q&A Companion Idle</h3>
          <p className="text-xs text-zinc-455 max-w-xs leading-relaxed">
            Please generate notes or select a study guide from your history to start asking questions about the video.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col h-full min-h-0 relative overflow-hidden">
      {/* Subheader Toolbar with Clear Chat (only if messages exist) */}
      {messages.length > 0 && (
        <div className={`px-4 py-2 border-b flex items-center justify-between gap-2 shrink-0 ${
          isDark ? 'border-zinc-900 bg-zinc-950/40' : 'border-orange-100 bg-orange-50/20'
        }`}>
          <span className={`text-[10px] font-mono tracking-wide ${isDark ? 'text-zinc-500' : 'text-orange-800'}`}>
            {messages.filter(m => m.sender === 'user').length} Question{messages.filter(m => m.sender === 'user').length === 1 ? '' : 's'} asked
          </span>
          <button
            type="button"
            onClick={() => setShowConfirmDelete(true)}
            disabled={isDeleting || isLoading}
            className="btn-danger-subtle flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold !rounded-lg"
            title="Delete conversation history"
          >
            {isDeleting ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Trash2 className="w-3 h-3" />
            )}
            <span>Clear Chat</span>
          </button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className={`flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 sm:space-y-5 custom-scrollbar min-h-0 ${
        isDark ? 'bg-transparent' : 'bg-[#fffcf8]'
      }`}>
        {isHistoryLoading ? (
          <div className="space-y-5 animate-pulse">
            <div className="flex items-start gap-3 max-w-[80%] ml-auto flex-row-reverse">
              <div className={`w-8 h-8 rounded-full border shrink-0 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-orange-100 border-orange-200'}`} />
              <div className="flex flex-col items-end gap-1.5 w-full">
                <div className={`h-7 w-2/3 border rounded-2xl rounded-tr-none ${isDark ? 'bg-zinc-900 border-zinc-800/85' : 'bg-orange-100 border-orange-200'}`} />
              </div>
            </div>
            
            <div className="flex items-start gap-3 max-w-[85%] mr-auto">
              <div className={`w-8 h-8 rounded-full border shrink-0 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-orange-100 border-orange-200'}`} />
              <div className="flex flex-col items-start gap-2 w-full">
                <div className={`h-6 w-11/12 border rounded-2xl rounded-tl-none ${isDark ? 'bg-zinc-900 border-zinc-800/60' : 'bg-white border-orange-200'}`} />
                <div className={`h-4 w-3/4 border rounded-xl ${isDark ? 'bg-zinc-900 border-zinc-800/40' : 'bg-white border-orange-100'}`} />
              </div>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-16">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
              isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-550' : 'bg-orange-100 border-orange-300 text-orange-600 shadow-xs'
            }`}>
              <MessageSquare className="w-5 h-5 text-orange-500" />
            </div>
            <h4 className={`text-xs font-bold ${isDark ? 'text-zinc-300' : 'text-orange-950'}`}>How can I help you today?</h4>
            <p className={`text-[10px] max-w-xs leading-relaxed ${isDark ? 'text-zinc-500' : 'text-orange-800'}`}>
              Ask about definitions, request summaries, or clarify specific parts of the video lecture.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-start gap-2.5 sm:gap-3 max-w-[94%] sm:max-w-[85%] ${
                msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center border text-xs font-black font-mono tracking-tight ${
                  msg.sender === 'user'
                    ? isDark 
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-300' 
                      : 'bg-orange-500 border-orange-400 text-white shadow-xs'
                    : msg.isError
                      ? 'bg-red-950/20 border-red-500/30 text-red-400'
                      : isDark
                        ? 'bg-orange-950/30 border-orange-500/30 text-orange-400'
                        : 'bg-orange-100 border-orange-300 text-orange-600 shadow-xs'
                }`}
              >
                {msg.sender === 'user' ? 'ME' : 'AI'}
              </div>

              {/* Message Content */}
              <div className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? isDark
                        ? 'bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-tr-none'
                        : 'bg-orange-500 text-white font-medium rounded-tr-none shadow-xs'
                      : msg.isError
                        ? 'bg-red-955/20 border-red-900/40 text-red-200 rounded-tl-none'
                        : isDark
                          ? 'bg-transparent border border-zinc-800 text-zinc-100 rounded-tl-none prose prose-invert max-w-none font-normal selection:bg-zinc-800'
                          : 'bg-white border border-orange-200/90 text-orange-950 rounded-tl-none shadow-xs font-normal selection:bg-orange-100'
                  }`}
                >
                  {msg.sender === 'assistant' && !msg.text && isLoading && index === messages.length - 1 ? (
                    <div className="flex items-center gap-1 py-1">
                      <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce"></span>
                    </div>
                  ) : (
                    <MarkdownRenderer content={msg.text} isDark={isDark} />
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        {/* Error banner */}
        {error && (
          <div className="p-3 rounded-xl bg-red-950/20 border border-red-500/30 text-red-300 text-[10px] flex items-center gap-2 max-w-[90%] mx-auto">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSubmit} className={`p-3 sm:p-4 border-t flex gap-2 sm:gap-3 shrink-0 ${
        isDark ? 'border-zinc-900 bg-zinc-950' : 'border-orange-200/80 bg-white'
      }`}>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about this lecture..."
          className={`flex-1 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs transition disabled:opacity-50 border outline-none ${
            isDark 
              ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700/80 text-zinc-100 placeholder-zinc-500 focus:border-zinc-500' 
              : 'bg-orange-50/50 border-orange-200/90 text-orange-950 placeholder-orange-400 focus:border-orange-500'
          }`}
        />
        <button
          type="submit"
          disabled={isLoading || !question.trim()}
          className="btn-primary px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs font-bold shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Ask</span>
        </button>
      </form>

      {/* Custom Confirm Delete Modal Overlay */}
      {showConfirmDelete && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 sm:p-6 max-w-[calc(100vw-2rem)] sm:max-w-sm w-full shadow-2xl relative overflow-hidden transition-all duration-300">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[1px] bg-gradient-to-r from-transparent via-red-500/35 to-transparent"></div>
            
            <div className="w-12 h-12 rounded-xl bg-red-950/20 border border-red-900/30 flex items-center justify-center text-red-400 mb-4 mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>

            <h4 className="text-sm font-bold text-zinc-100 text-center mb-1">Clear Q&A History?</h4>
            <p className="text-xs text-zinc-400 text-center mb-6 leading-relaxed">
              This will permanently delete your entire conversation history for this video. This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                disabled={isDeleting}
                className="btn-secondary flex-1 py-2 px-4 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteChat}
                disabled={isDeleting}
                className="btn-danger flex-1 py-2 px-4 text-xs font-bold"
              >
                {isDeleting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

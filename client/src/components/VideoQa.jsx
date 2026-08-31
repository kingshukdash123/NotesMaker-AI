import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Loader2, AlertCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { askVideoQuestionStream } from '../services/server/api';
import { saveVideoQnAChat, getVideoQnAChat } from '../services/firebase/notesService';
import MarkdownRenderer from './common/MarkdownRenderer';

export default function VideoQa({ videoId, currentUser }) {
  const { isDark } = useTheme();
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
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
          messages.map((msg, index) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={index}
                className={`flex items-start gap-2.5 sm:gap-3 max-w-[92%] sm:max-w-[85%] ${
                  isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full shrink-0 flex items-center justify-center border text-[11px] sm:text-xs font-black font-mono tracking-tight select-none mt-0.5 ${
                    isUser
                      ? isDark 
                        ? 'bg-zinc-900 border-zinc-800 text-zinc-300' 
                        : 'bg-orange-100 border-orange-200 text-orange-700 shadow-xs'
                      : msg.isError
                        ? 'bg-red-950/20 border-red-500/30 text-red-400'
                        : isDark
                          ? 'bg-orange-950/30 border-orange-500/30 text-orange-400'
                          : 'bg-orange-100 border-orange-300 text-orange-600 shadow-xs'
                  }`}
                >
                  {isUser ? 'ME' : 'AI'}
                </div>

                {/* Message Content */}
                <div className={`flex flex-col min-w-0 ${isUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl text-xs leading-relaxed break-words shadow-xs ${
                      isUser
                        ? isDark
                          ? 'bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-tr-xs'
                          : 'bg-orange-100/80 border border-orange-200/90 text-orange-950 font-medium rounded-tr-xs'
                        : msg.isError
                          ? 'bg-red-950/20 border border-red-900/40 text-red-200 rounded-tl-xs'
                          : isDark
                            ? 'bg-zinc-950/40 border border-zinc-850 text-zinc-100 selection:bg-zinc-800 rounded-tl-xs'
                            : 'bg-white border border-orange-200/90 text-orange-950 selection:bg-orange-100 rounded-tl-xs'
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap leading-relaxed m-0 text-xs">{msg.text}</p>
                    ) : !msg.text && isLoading && index === messages.length - 1 ? (
                      <div className="flex items-center gap-1 py-1">
                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce"></span>
                      </div>
                    ) : (
                      <MarkdownRenderer content={msg.text} className="chat-markdown" />
                    )}
                  </div>
                </div>
              </div>
            );
          })
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
    </div>
  );
}

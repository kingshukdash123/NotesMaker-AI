import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Loader2, Play, AlertCircle, User, Trash2 } from 'lucide-react';
import { askVideoQuestionStream } from '../services/server/api';
import { saveVideoQnAChat, getVideoQnAChat, deleteVideoQnAChat } from '../services/firebase/notesService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/atom-one-dark.css';
import katex from 'katex';
import 'katex/dist/katex.min.css';

export default function VideoQa({ videoId, currentUser, isFullscreen = false }) {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const preprocessMessageMarkdown = (content) => {
    if (!content) return '';

    // 0. Restore LaTeX backslashes that were parsed as escape control characters (e.g. \t, \f, \b, \v)
    let processed = content
      .replace(/\x0c/g, '\\f') // Form Feed -> \f (e.g. \frac)
      .replace(/\x09/g, '\\t') // Horizontal Tab -> \t (e.g. \text, \theta)
      .replace(/\x08/g, '\\b') // Backspace -> \b (e.g. \beta, \begin)
      .replace(/\x0b/g, '\\v'); // Vertical Tab -> \v (e.g. \vec)

    // Convert standard LaTeX delimiters \( \) and \[ \] to $ and $$
    processed = processed
      .replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$') // \[ ... \] -> $$ ... $$
      .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');     // \( ... \) -> $ ... $

    // 1. Unescape any escaped dollar signs (e.g. \$ -> $)
    processed = processed.replace(/\\(\$)/g, '$1');



    // Robust state machine to tokenize and replace inline math $...$
    let result = '';
    let i = 0;
    const len = processed.length;

    while (i < len) {
      // 1. Skip code blocks (``` ... ```)
      if (processed.startsWith('```', i)) {
        const endIdx = processed.indexOf('```', i + 3);
        if (endIdx !== -1) {
          result += processed.substring(i, endIdx + 3);
          i = endIdx + 3;
        } else {
          result += processed.substring(i);
          break;
        }
        continue;
      }

      // 2. Skip inline code (` ... `)
      if (processed[i] === '`') {
        const endIdx = processed.indexOf('`', i + 1);
        if (endIdx !== -1) {
          result += processed.substring(i, endIdx + 1);
          i = endIdx + 1;
        } else {
          result += processed[i];
          i++;
        }
        continue;
      }

      // 3. Handle block math ($$ ... $$) — convert to __BLOCK_MATH__ token
      if (processed.startsWith('$$', i)) {
        let endIdx = -1;
        let nextSearchIdx = i + 2;
        
        // Look for the next $$ that forms a valid block (does not cross paragraphs or headings)
        while (true) {
          const foundIdx = processed.indexOf('$$', nextSearchIdx);
          if (foundIdx === -1) break;
          
          const innerText = processed.substring(i + 2, foundIdx);
          if (!innerText.includes('\n\n') && !innerText.includes('\r\n\r\n') && !innerText.includes('\n#') && !innerText.includes('\r\n#')) {
            endIdx = foundIdx;
            break;
          }
          // If it was invalid, keep searching from the next character
          nextSearchIdx = foundIdx + 1;
        }

        if (endIdx !== -1) {
          let mathContent = processed.substring(i + 2, endIdx).trim();
          // Fix single-backslash+newline to double-backslash+newline for LaTeX line breaks
          mathContent = mathContent.replace(/(?<!\\)\\\n/g, '\\\\\n');
          // Encode newlines so inline code block stays single-line
          const encoded = mathContent.replace(/\n/g, '§NL§');
          result += '`__BLOCK_MATH__' + encoded + '`';
          i = endIdx + 2;
          continue;
        }
      }

      // 4. Handle inline math ($ ... $)
      if (processed[i] === '$') {
        // Find closing $ on the same line
        let endIdx = -1;
        for (let j = i + 1; j < len; j++) {
          if (processed[j] === '\n') {
            break; // Must be on the same line
          }
          if (processed[j] === '$') {
            endIdx = j;
            break;
          }
        }

        if (endIdx !== -1 && endIdx > i + 1) {
          const formula = processed.substring(i + 1, endIdx);
          // Ensure it's not just spaces or empty
          if (formula.trim().length > 0) {
            result += '`__INLINE_MATH__' + formula + '`';
            i = endIdx + 1;
            continue;
          }
        }
      }

      result += processed[i];
      i++;
    }

    // 5. Pre-process [hh:mm:ss] or [mm:ss] timestamps into custom markdown link tokens
    const regex = /\[(\d{1,2}):(\d{2})(?::(\d{2}))?\]/g;
    result = result.replace(regex, (match, p1, p2, p3) => {
      const hrs = p3 !== undefined ? parseInt(p1, 10) : 0;
      const mins = p3 !== undefined ? parseInt(p2, 10) : parseInt(p1, 10);
      const secs = p3 !== undefined ? parseInt(p3, 10) : parseInt(p2, 10);
      const totalSeconds = hrs * 3600 + mins * 60 + secs;
      
      return `${match}(https://www.youtube.com/watch?v=${videoId}&t=${totalSeconds})`;
    });
 
    return result;
  };
 
  const renderMessageMarkdown = (text) => {
    if (!text) return null;
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          a({ href, children }) {
            const isSeekLink = href && href.includes('youtube.com/watch') && href.includes('&t=');
            if (isSeekLink) {
              return (
                <button
                  type="button"
                  onClick={() => window.open(href, '_blank')}
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 mx-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-orange-300 hover:text-orange-200 hover:bg-zinc-800 transition cursor-pointer align-baseline font-mono"
                  title="Click to seek video"
                >
                  <Play className="w-2.5 h-2.5 fill-current shrink-0 text-orange-300" />
                  <span>{children}</span>
                </button>
              );
            }
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">
                {children}
              </a>
            );
          },
          code({node, className, children, ...props}) {
            const getRawText = (n) => {
              if (typeof n === 'string') return n;
              if (typeof n === 'number') return String(n);
              if (Array.isArray(n)) return n.map(getRawText).join('');
              if (n && n.props && n.props.children) {
                return getRawText(n.props.children);
              }
              return '';
            };
            const codeText = getRawText(children);
            // Block math (from $$ blocks)
            if (codeText.startsWith('__BLOCK_MATH__')) {
              const formula = codeText.replace('__BLOCK_MATH__', '').replace(/§NL§/g, '\n');
              try {
                const html = katex.renderToString(formula, { 
                  displayMode: true, 
                  throwOnError: false 
                });
                return <span dangerouslySetInnerHTML={{ __html: html }} className="block my-4 overflow-x-auto" />;
              } catch (err) {
                return <span className="text-red-400 font-semibold block my-4">{formula}</span>;
              }
            }
            // Inline math (from $ blocks)
            if (codeText.startsWith('__INLINE_MATH__')) {
              const formula = codeText.replace('__INLINE_MATH__', '');
              try {
                const html = katex.renderToString(formula, { 
                  displayMode: false, 
                  throwOnError: false 
                });
                return <span dangerouslySetInnerHTML={{ __html: html }} className="inline-block" />;
              } catch (err) {
                return <span className="text-red-400 font-semibold">{formula}</span>;
              }
            }
            return <code className={className} {...props}>{children}</code>;
          }
        }}
      >
        {preprocessMessageMarkdown(text)}
      </ReactMarkdown>
    );
  };

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
      console.error("Failed to delete chat:", err);
      setError("Failed to clear chat history.");
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

    // Prepare assistant state variables
    let assistantAnswer = '';

    // Append assistant placeholder
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
          console.log(chunk)
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
        // Clean finalMessages before saving to Firestore
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
              lastMsg.text = 'Sorry, I couldn\'t generate an answer due to an API error. Please check your keys or verify that notes generation finished successfully.';
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
    <div className="w-full max-w-4xl mx-auto flex flex-col bg-zinc-950/40 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl relative transition-all duration-300 h-full min-h-0">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-[1px] bg-gradient-to-r from-transparent via-orange-500/25 to-transparent"></div>

      {/* Header */}
      <div className="px-5 py-4 border-b border-zinc-900 bg-zinc-950 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-950/20 border border-orange-900/30 flex items-center justify-center text-orange-400">
            <MessageSquare className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-zinc-150 flex items-center gap-1.5">
              Video Q&A Companion
            </h3>
            <p className="text-[10px] text-zinc-450">Ask anything about the lecture transcript</p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            type="button"
            onClick={() => setShowConfirmDelete(true)}
            disabled={isDeleting || isLoading}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold rounded-lg border border-red-950/30 bg-red-950/10 hover:bg-red-950/20 text-red-400 hover:text-red-300 transition disabled:opacity-50 cursor-pointer"
            title="Delete conversation history"
          >
            {isDeleting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            <span>Clear Chat</span>
          </button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar bg-black/10">
        {isHistoryLoading ? (
          <div className="space-y-5 animate-pulse">
            {/* User message skeleton */}
            <div className="flex items-start gap-3 max-w-[80%] ml-auto flex-row-reverse">
              <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 shrink-0" />
              <div className="flex flex-col items-end gap-1.5 w-full">
                <div className="h-7 w-2/3 bg-zinc-900 border border-zinc-800/85 rounded-2xl rounded-tr-none" />
              </div>
            </div>
            
            {/* AI message skeleton */}
            <div className="flex items-start gap-3 max-w-[85%] mr-auto">
              <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 shrink-0" />
              <div className="flex flex-col items-start gap-2 w-full">
                <div className="h-6 w-11/12 bg-zinc-900 border border-zinc-800/60 rounded-2xl rounded-tl-none" />
                <div className="h-4 w-3/4 bg-zinc-900 border border-zinc-800/40 rounded-xl" />
                <div className="h-4 w-1/2 bg-zinc-900 border border-zinc-800/30 rounded-xl" />
              </div>
            </div>

            {/* Another user message skeleton */}
            <div className="flex items-start gap-3 max-w-[80%] ml-auto flex-row-reverse">
              <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 shrink-0" />
              <div className="flex flex-col items-end gap-1.5 w-full">
                <div className="h-7 w-1/2 bg-zinc-900 border border-zinc-800/85 rounded-2xl rounded-tr-none" />
              </div>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-16">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-550 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-orange-500" />
            </div>
            <h4 className="text-xs font-bold text-zinc-300">How can I help you today?</h4>
            <p className="text-[10px] text-zinc-500 max-w-xs leading-relaxed">
              Ask about definitions, request summaries, or locate specific timestamps in the transcript.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center border text-xs font-black font-mono tracking-tight ${msg.sender === 'user'
                    ? 'bg-zinc-900 border-zinc-800 text-zinc-300'
                    : msg.isError
                      ? 'bg-red-950/20 border-red-500/30 text-red-400'
                      : 'bg-orange-950/30 border-orange-500/30 text-orange-400'
                  }`}
              >
                {msg.sender === 'user' ? 'ME' : 'AI'}
              </div>

              {/* Message Content */}
              <div className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${msg.sender === 'user'
                      ? 'bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-tr-none'
                      : msg.isError
                        ? 'bg-red-955/20 border-red-900/40 text-red-200 rounded-tl-none'
                        : 'bg-transparent border border-zinc-800 text-zinc-100 rounded-tl-none prose prose-invert max-w-none prose-sm font-normal selection:bg-zinc-800'
                    }`}
                >
                  {msg.sender === 'assistant' && !msg.text && isLoading && index === messages.length - 1 ? (
                    <div className="flex items-center gap-1 py-1">
                      <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce"></span>
                    </div>
                  ) : (
                    renderMessageMarkdown(msg.text)
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
      <form onSubmit={handleSubmit} className="p-4 border-t border-zinc-900 bg-zinc-950 flex gap-3">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about this lecture..."
          className="flex-1 bg-zinc-900 border border-zinc-800 hover:border-zinc-700/80 rounded-xl px-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || !question.trim()}
          className="px-4 py-2.5 bg-zinc-100 hover:bg-white disabled:bg-zinc-800 disabled:text-zinc-650 text-zinc-950 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Ask</span>
        </button>
      </form>

      {/* Custom Confirm Delete Modal Overlay */}
      {showConfirmDelete && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden transition-all duration-300">
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
                className="flex-1 px-4 py-2 border border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 hover:bg-zinc-900 text-zinc-300 font-bold text-xs rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteChat}
                disabled={isDeleting}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-red-950/25 disabled:bg-red-800 disabled:opacity-85"
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

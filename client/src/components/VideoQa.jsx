import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Loader2, Play, AlertCircle, User } from 'lucide-react';
import { askVideoQuestion } from '../services/server/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/atom-one-dark.css';
import katex from 'katex';
import 'katex/dist/katex.min.css';

export default function VideoQa({ videoId, currentUser, isFullscreen = false }) {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
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

    // 1. Unescape any escaped dollar signs (e.g. \$ -> $)
    processed = processed.replace(/\\(\$)/g, '$1');

    // 2. Safe delimiter balancing for single-line inline math blocks
    processed = processed.replace(/\$\$([^\n$]+)\$(?!\$)/g, '$$$1$$');
    processed = processed.replace(/(?<!\$)\$([^\n$]+)\$\$/g, '$$$1$$');

    // 3. Convert all inline math $formula$ to custom code blocks `__INLINE_MATH__formula`
    processed = processed.replace(/(?<!\$)\$([^\n$]+)\$(?!\$)/g, (match, p1) => {
      if (p1.startsWith('$') || p1.endsWith('$')) return match;
      return '`__INLINE_MATH__' + p1 + '`';
    });

    // 4. Pre-process [hh:mm:ss] or [mm:ss] timestamps into custom markdown link tokens
    const regex = /\[(\d{1,2}):(\d{2})(?::(\d{2}))?\]/g;
    processed = processed.replace(regex, (match, p1, p2, p3) => {
      const hrs = p3 !== undefined ? parseInt(p1, 10) : 0;
      const mins = p3 !== undefined ? parseInt(p2, 10) : parseInt(p1, 10);
      const secs = p3 !== undefined ? parseInt(p3, 10) : parseInt(p2, 10);
      const totalSeconds = hrs * 3600 + mins * 60 + secs;
      
      return `${match}(https://www.youtube.com/watch?v=${videoId}&t=${totalSeconds})`;
    });
 
    return processed;
  };
 
  const renderMessageMarkdown = (text) => {
    if (!text) return null;
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm, [remarkMath, { singleDollarTextMath: true }]]}
        rehypePlugins={[rehypeKatex, rehypeHighlight]}
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
            const codeText = String(children);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim() || !videoId) return;

    const currentQuestion = question.trim();
    setQuestion('');
    setError(null);
    setIsLoading(true);

    // Append user question
    setMessages((prev) => [
      ...prev,
      { sender: 'user', text: currentQuestion }
    ]);

    try {
      const idToken = currentUser ? await currentUser.getIdToken() : null;
      const userId = currentUser ? currentUser.uid : null;

      const data = await askVideoQuestion(videoId, currentQuestion, userId, idToken);

      // Append assistant answer
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: data.answer,
          sources: data.sources || []
        }
      ]);
    } catch (err) {
      console.error('Q&A submit error:', err);
      setError(err.message || 'An error occurred while answering your question.');
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: 'Sorry, I couldn\'t generate an answer due to an API error. Please check your keys or verify that notes generation finished successfully.',
          isError: true
        }
      ]);
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
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar bg-black/10">
        {messages.length === 0 ? (
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
                  {renderMessageMarkdown(msg.text)}
                </div>
              </div>
            </div>
          ))
        )}

        {/* Loading Bubble with Bouncing Dots Typing Animation */}
        {isLoading && (
          <div className="flex items-start gap-3 mr-auto max-w-[85%]">
            {/* AI Avatar */}
            <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center border bg-orange-950/30 border-orange-500/30 text-orange-400 text-xs font-black font-mono tracking-tight">
              AI
            </div>

            {/* Bubble */}
            <div className="px-4 py-3 rounded-2xl bg-transparent border border-zinc-800 text-zinc-100 rounded-tl-none flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce"></span>
              </div>
            </div>
          </div>
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
          disabled={isLoading}
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
    </div>
  );
}

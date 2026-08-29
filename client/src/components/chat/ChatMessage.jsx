import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/atom-one-dark.css';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { Copy, Check, Plus, ThumbsUp, ThumbsDown } from 'lucide-react';

export default function ChatMessage({ message, isStreaming = false }) {
  const [copied, setCopied] = useState(false);
  const [inserted, setInserted] = useState(false);
  const [feedback, setFeedback] = useState(null); // 'like' | 'dislike' | null
  const isUser = message.role === 'user' || message.sender === 'user';
  const text = message.content || message.text || '';

  const handleCopy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInsert = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setInserted(true);
    setTimeout(() => setInserted(false), 2000);
    // Custom window event for other components to listen to if they want to insert text
    window.dispatchEvent(new CustomEvent('insert-ai-text', { detail: text }));
  };

  const preprocessMessageMarkdown = (content) => {
    if (!content) return '';

    // Restore LaTeX backslashes that were parsed as escape control characters
    let processed = content
      .replace(/\x0c/g, '\\f') // Form Feed -> \f (e.g. \frac)
      .replace(/\x09/g, '\\t') // Horizontal Tab -> \t (e.g. \text, \theta)
      .replace(/\x08/g, '\\b') // Backspace -> \b (e.g. \beta, \begin)
      .replace(/\x0b/g, '\\v'); // Vertical Tab -> \v (e.g. \vec)

    // Convert standard LaTeX delimiters \( \) and \[ \] to $ and $$
    processed = processed
      .replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$') // \[ ... \] -> $$ ... $$
      .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');     // \( ... \) -> $ ... $

    // Unescape any escaped dollar signs
    processed = processed.replace(/\\(\$)/g, '$1');

    // Robust state machine to tokenize and replace inline math $...$
    let result = '';
    let i = 0;
    const len = processed.length;

    while (i < len) {
      // 1. Skip code blocks
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

      // 2. Skip inline code
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

      // 3. Handle block math ($$ ... $$)
      if (processed.startsWith('$$', i)) {
        let endIdx = -1;
        let nextSearchIdx = i + 2;
        
        while (true) {
          const foundIdx = processed.indexOf('$$', nextSearchIdx);
          if (foundIdx === -1) break;
          
          const innerText = processed.substring(i + 2, foundIdx);
          if (!innerText.includes('\n\n') && !innerText.includes('\r\n\r\n') && !innerText.includes('\n#') && !innerText.includes('\r\n#')) {
            endIdx = foundIdx;
            break;
          }
          nextSearchIdx = foundIdx + 1;
        }

        if (endIdx !== -1) {
          const formula = processed.substring(i + 2, endIdx);
          const formulaEscaped = formula.replace(/\n/g, '§NL§');
          result += '`__BLOCK_MATH__' + formulaEscaped + '`';
          i = endIdx + 2;
          continue;
        }
      }

      // 4. Handle inline math ($ ... $)
      if (processed[i] === '$') {
        const endIdx = processed.indexOf('$', i + 1);
        if (endIdx !== -1) {
          const formula = processed.substring(i + 1, endIdx);
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

    return result;
  };

  const renderMessageMarkdown = (rawText) => {
    if (!rawText) return null;
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          a({ href, children }) {
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" className="text-orange-450 hover:underline font-semibold">
                {children}
              </a>
            );
          },
          code({ node, className, children, ...props }) {
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
            
            // Block math
            if (codeText.startsWith('__BLOCK_MATH__')) {
              let formula = codeText.replace('__BLOCK_MATH__', '').replace(/§NL§/g, '\n');
              try {
                const html = katex.renderToString(formula, { 
                  displayMode: true, 
                  throwOnError: false 
                });
                return <span dangerouslySetInnerHTML={{ __html: html }} className="block my-3 overflow-x-auto custom-scrollbar" />;
              } catch (err) {
                return <div className="p-2 my-2 rounded bg-zinc-900/80 border border-zinc-800 text-zinc-300 font-mono text-xs overflow-x-auto">{formula}</div>;
              }
            }
            
            // Inline math
            if (codeText.startsWith('__INLINE_MATH__')) {
              let formula = codeText.replace('__INLINE_MATH__', '');
              try {
                const html = katex.renderToString(formula, { 
                  displayMode: false, 
                  throwOnError: false 
                });
                return <span dangerouslySetInnerHTML={{ __html: html }} className="inline-block px-0.5" />;
              } catch (err) {
                return <code className="px-1 py-0.5 rounded bg-zinc-900 text-zinc-300 font-mono text-xs">{formula}</code>;
              }
            }

            return <code className={`${className} bg-transparent border border-zinc-800 px-1 py-0.5 rounded text-xs font-mono`} {...props}>{children}</code>;
          },
          h1: ({ children }) => <h1 className="text-sm font-bold text-zinc-100 mt-4 mb-1.5">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xs font-bold text-zinc-150 mt-3 mb-1">{children}</h2>,
          h3: ({ children }) => <h3 className="text-xs font-bold text-zinc-200 mt-2.5 mb-1">{children}</h3>,
          p: ({ children }) => <p className="text-xs text-zinc-300 leading-relaxed mb-2">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-4 mb-3 space-y-1 text-zinc-300">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-4 mb-3 space-y-1 text-zinc-300">{children}</ol>,
          li: ({ children }) => <li className="text-xs leading-relaxed">{children}</li>,
          table: ({ children }) => (
            <div className="overflow-x-auto w-full my-2.5 rounded-lg border border-zinc-800 bg-zinc-950/20">
              <table className="w-full text-left border-collapse text-[10px]">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-zinc-900/50 border-b border-zinc-800 text-zinc-400 font-semibold">{children}</thead>,
          tbody: ({ children }) => <tbody className="divide-y divide-zinc-900">{children}</tbody>,
          tr: ({ children }) => <tr className="hover:bg-zinc-900/10 transition">{children}</tr>,
          th: ({ children }) => <th className="px-3 py-2 font-semibold">{children}</th>,
          td: ({ children }) => <td className="px-3 py-2 text-zinc-300">{children}</td>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-orange-500 bg-zinc-900/30 px-3 py-2 rounded-r my-3 text-zinc-400 text-[10px] italic">
              {children}
            </blockquote>
          ),
        }}
      >
        {preprocessMessageMarkdown(rawText)}
      </ReactMarkdown>
    );
  };

  if (isUser) {
    let formattedTime = '';
    if (message.timestamp) {
      try {
        const date = new Date(message.timestamp);
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        formattedTime = `${dateStr}, ${timeStr}`;
      } catch (err) {
        // Fallback if parsing fails
      }
    }

    return (
      <div className="flex flex-col items-end w-full py-1 px-2 gap-1">
        <div className="bg-zinc-900 border border-zinc-800/80 text-zinc-200 rounded-2xl rounded-tr-none px-3.5 py-2 text-xs leading-relaxed max-w-[85%] break-words">
          {text}
        </div>
        {formattedTime && (
          <span className="text-[9px] text-zinc-600 select-none mr-1.5 font-sans leading-none">
            {formattedTime}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex gap-2.5 w-full py-3.5 px-2 transition duration-150 border-b border-zinc-900/40 relative">
      <style>{`
        .prose pre, .prose pre code, .prose code {
          background: transparent !important;
          background-color: transparent !important;
        }
      `}</style>
      {/* Bot Icon */}
      <div className="w-5 h-5 rounded bg-orange-950/20 border border-orange-900/30 text-orange-400 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5 select-none shadow-sm">
        N
      </div>

      <div className="flex-1 min-w-0">
        <div className="prose prose-invert max-w-none prose-sm font-normal selection:bg-zinc-800 text-xs text-zinc-200">
          {renderMessageMarkdown(text)}
          
          {isStreaming && !text && (
            <div className="flex items-center gap-1 py-1">
              <span className="w-1 h-1 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1 h-1 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1 h-1 bg-orange-500 rounded-full animate-bounce"></span>
            </div>
          )}
          
          {isStreaming && text && (
            <span className="inline-block w-1 h-3 bg-orange-500 animate-pulse ml-0.5 align-middle"></span>
          )}
        </div>

        {/* Feedback & Actions row underneath the message content */}
        {!isStreaming && text && (
          <div className="flex items-center gap-3.5 mt-2.5 text-zinc-550">
            <button
              onClick={handleCopy}
              className="hover:text-zinc-300 transition duration-150 cursor-pointer p-0.5"
              title={copied ? "Copied!" : "Copy message to clipboard"}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-orange-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            {/* <button
              onClick={handleInsert}
              className="hover:text-zinc-300 transition duration-150 cursor-pointer p-0.5"
              title={inserted ? "Copied!" : "Copy & insert notes"}
            >
              {inserted ? <Check className="w-3.5 h-3.5 text-orange-500" /> : <Plus className="w-3.5 h-3.5" />}
            </button> */}
            {/* <button
              onClick={() => setFeedback(feedback === 'like' ? null : 'like')}
              className={`hover:text-zinc-300 transition duration-150 cursor-pointer p-0.5 ${
                feedback === 'like' ? 'text-orange-500' : ''
              }`}
              title="Thumbs up"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setFeedback(feedback === 'dislike' ? null : 'dislike')}
              className={`hover:text-zinc-300 transition duration-150 cursor-pointer p-0.5 ${
                feedback === 'dislike' ? 'text-red-500' : ''
              }`}
              title="Thumbs down"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button> */}
          </div>
        )}
      </div>
    </div>
  );
}
